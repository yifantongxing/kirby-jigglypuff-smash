"""Export local Ultimate NUANMB clips. Usage: python import_motions.py FIGHTER_PARENT [output.js]."""
import argparse
import base64
import gzip
import json
import struct
import subprocess
from pathlib import Path

import numpy as np
from ssbh_data_py import anim_data, skel_data

# The actor's movement and floor contacts are resolved in sim.js. Trans is the
# motion-extraction bone. Rot, Hip and each child retain their animated offsets.
COMMON = '''a00defaulteyelid a00wait1 a01walkmiddle a01walkslow a01walkfast a02dash a02run a02runbrakel a02turnrun a03jumpsquat a03jumpf a03jumpb a03jumpaerialf a03jumpaerialf2 a03jumpaerialf3 a03jumpaerialf4 a03jumpaerialf5 a04fall a04fallaerial a05landinglight a05landingheavy a05squat a05squatwait b00guard b00guardon b00guardoff b01guarddamage b00justshieldoff b02escapeair b02escapef b02escapeb b02escapen c00attack11 c00attack12 c00attackdash c01attacks3s c01attacks3hi c01attacks3lw c02attackhi3 c02attacklw3 c03attacks4s c03attacks4charge c04attackhi4 c04attackhi4charge c04attacklw4 c04attacklw4charge c05attackairb c05attackairf c05attackairn c05attackairhi c05attackairlw f00damagen1 f00damagen2 f00damagen3 f01damageair1 f01damageair2 f01damageair3 f01damageflyn f01damageflyhi f01damageflylw f01damageflytop f01damageflyroll a04damagefall f07sleeploop f09camerahit f03downspotu f06furafurastartu f06furafura f06furafuraend f03downwaitu f04downwaitd f03downstandu f04downstandd f03downforwardu f04downforwardd f03downattacku f04downattackd f05passive f05passivestandf g01cliffwait g02cliffclimb g02cliffescape g02cliffattack g02cliffjump1 j01appealhir j01appealsr j01appeallwr'''.split()
EXTRA = {
    'kirby': '''c00attack100 c00attackend c03attacks4hi c03attacks4lw d00eatwait d00specialnend d00specialairnend d00specialnstart d00specialnloop d00specialnswallow d00specialnspit d00specialairnstart d00specialairnloop d00specialairnswallow d00specialairnspit d01specials d01specialsmax d01specialairs d01specialairsmax d01specialsstart d01specialairsstart d01specialshold d02specialhi d02specialhi2 d02specialhi3 d02specialhi4 d02specialairhi d02specialairhi2 d03speciallw1 d03specialairlw1 d03speciallw2 d03specialairlw2 d04finalstart d04finalattack d04finalairstart d04finalairattack'''.split(),
    'purin': '''d00specialnstartr d00specialnhold d00specialn d00specialnendr d00specialairnstartr d00specialairnhold d00specialairnendr d01specials d01specialairs d02specialhir d02specialairhir d03speciallwr d03specialairlwr d04finalstartr d04final d04finalendr d04finalairstartr d04finalair d04finalairendr'''.split(),
}
GRABS = '''e00catch e00catchdash e00catchturn e00catchwait e00catchattack
e00catchcut e03capturecut e03capturewaitlw e03capturedamagelw
e01throwf e01throwb e01throwhi e01throwlw'''.split()
THROWN = ['e01thrown'+suffix for suffix in ('f','b','hi','lw')]

def local_matrix(track, frame):
    value = track.values[min(frame, len(track.values)-1)]
    x,y,z,w = value.rotation
    rotation = np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)],
                         [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)],
                         [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])
    matrix=np.eye(4)
    matrix[:3,:3]=rotation@np.diag(value.scale)
    matrix[:3,3]=value.translation
    return matrix

def throw_paths(root, kind):
    # Rows are native units: holder root Z/Y and recipient root Z/Y relative
    # to it. The shared thrown pose is centered at the recipient's Rot joint.
    scale=.96 if kind=='kirby' else 1.
    other='purin' if kind=='kirby' else 'kirby'
    bones=skel_data.read_skel(str(root/other/'model/body/c00/model.nusktb')).bones
    height=next(b for b in bones if b.name=='Rot').transform[3,1]
    recipient=np.array([0,-height*(1 if other=='purin' else .96)/scale,0,1])
    result={}
    for action,suffix in [('throwF','f'),('throwB','b'),('throwU','hi'),('throwD','lw')]:
        data=anim_data.read_anim(str(root/kind/'motion/body/c00'/('e01throw'+suffix+'.nuanmb')))
        tracks={node.name:node.tracks[0] for group in data.groups if group.group_type==anim_data.GroupType.Transform for node in group.nodes}
        frames=[]
        for frame in range(int(data.final_frame_index)+1):
            trans=local_matrix(tracks['Trans'],frame)
            attach=local_matrix(tracks['Rot'],frame)@local_matrix(tracks['Throw'],frame)
            point=attach@recipient
            frames.append([round(float(v)*scale,4) for v in (trans[2,3],trans[1,3],point[2],point[1])])
        result[action]=frames
    return result

def pack_curve(values, size, packed, quaternion=False):
    a = np.asarray(values, dtype=np.float32).reshape(-1, size)
    if quaternion:
        # Equivalent antipodal quaternions must interpolate along the short arc.
        signs = np.where(np.sum(a[:-1] * a[1:], axis=1) < 0, -1, 1)
        a = a * np.concatenate(([1], np.cumprod(signs)))[:, None]
    low = a.min(axis=0)
    span = a.max(axis=0) - low
    if span.max() < 1e-6:
        return [round(float(v), 7) for v in a[0]]
    step = span / 65535
    offset = len(packed) // 2
    q = np.rint((a-low) / np.where(step == 0, 1, step)).clip(0,65535).astype('<u2')
    packed.extend(q.tobytes())
    return [offset, len(a), *map(float,low), *map(float,step)]

def export_fighter(path, names, packed):
    bones = skel_data.read_skel(str(path/'model/body/c00/model.nusktb')).bones
    indices = {b.name:i for i,b in enumerate(bones)}
    clips = {}
    for name in names:
        motion_dir = 'purinbody' if name.startswith('purind') else 'body'
        directory = path
        filename = name
        if name.startswith('receive_'):
            # A thrower's directory provides the synchronized victim track,
            # retargeted by bone name onto the opponent's own bind skeleton.
            filename = name.removeprefix('receive_')
            directory = path.parent / ('purin' if path.name=='kirby' else 'kirby')
        data = anim_data.read_anim(str(directory/'motion'/motion_dir/'c00'/(filename+'.nuanmb')))
        transforms, visible, eyes = [], {}, {}
        stride = 0.0
        for group in data.groups:
            for node in group.nodes:
                track = node.tracks[0]
                if group.group_type == anim_data.GroupType.Transform and node.name in indices:
                    v = track.values
                    flags = track.transform_flags
                    if node.name=='Trans' and name in ('a01walkslow','a01walkmiddle','a01walkfast','a02run'):
                        stride = float(v[-1].translation[2]-v[0].translation[2])
                    # Final Smash Trans can position the pose itself. Puff's
                    # grounded active clip puts the giant body 80 units up.
                    planted_kick=path.name=='purin' and name=='c02attacklw3'
                    locomotion_root = node.name=='Trans' and not (name.startswith('d04final') or planted_kick)
                    t = None if flags.override_translation or locomotion_root else pack_curve([a.translation for a in v],3,packed)
                    r = None if flags.override_rotation else pack_curve([a.rotation for a in v],4,packed,quaternion=True)
                    s = None if flags.override_scale else pack_curve([a.scale for a in v],3,packed)
                    transforms.append([indices[node.name], int(track.compensate_scale and not flags.override_compensate_scale), t, r, s])
                elif group.group_type == anim_data.GroupType.Visibility:
                    v = track.values
                    visible[node.name] = [int(v[0]), *[i for i in range(1,len(v)) if v[i]!=v[i-1]]]
                elif group.group_type == anim_data.GroupType.Material and node.name.startswith(('EyeL','EyeR')):
                    uv = next((t for t in node.tracks if t.name=='CustomVector31'),None)
                    pattern = next((t for t in node.tracks if t.name=='nfTexture1[0].PatternIndex'),None)
                    if uv or pattern:
                        # These eye materials use CustomVector31 as (scaleU,scaleV,offsetU,offsetV).
                        keys = [[i,int(x)] for i,x in enumerate(pattern.values) if not i or x!=pattern.values[i-1]] if pattern else []
                        eyes[node.name] = [pack_curve(uv.values,4,packed) if uv else None, keys]
        clips[name] = [int(data.final_frame_index), transforms, visible, eyes, stride]
    return {'bones':[b.name for b in bones], 'parents':[b.parent_index for b in bones], 'clips':clips}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('fighter_parent', type=Path, help='Directory containing kirby and purin')
    parser.add_argument('output', nargs='?', type=Path, default=Path('native-motions.js'))
    parser.add_argument('--pilot', action='store_true', help='Export only the idle and back aerial clips')
    args=parser.parse_args();packed=bytearray();manifest={}
    for kind in ('kirby','purin'):
        names=['a00defaulteyelid','a00wait1','c05attackairb'] if args.pilot else COMMON+EXTRA[kind]
        if not args.pilot:
            names += GRABS+['receive_'+name for name in THROWN]
        if not args.pilot and kind=='kirby':
            # Kirby's copied Rollout uses his own bones and eyelid meshes.
            names += [file.stem for file in sorted((args.fighter_parent/kind/'motion/purinbody/c00').glob('*.nuanmb'))]
        manifest[kind]=export_fighter(args.fighter_parent/kind,names,packed)
    header=json.dumps(manifest,separators=(',',':')).encode()
    # Align the unsigned-16 data for a direct typed-array view after decoding.
    header+=b' '*(len(header)%2)
    data=struct.pack('<I',len(header))+header+packed
    encoded=base64.b64encode(gzip.compress(data,compresslevel=6,mtime=0)).decode()
    paths={} if args.pilot else {kind:throw_paths(args.fighter_parent,kind) for kind in ('kirby','purin')}
    args.output.write_text('// Generated from NUANMB by tools/import_motions.py.\n'+
                           'globalThis.SmashThrowPaths='+json.dumps(paths,separators=(',',':'))+';\n'+
                           'globalThis.SmashMotionData="'+encoded+'";\n')
    if not args.pilot:
        subprocess.run(['node',Path(__file__).with_name('import_throw_floor.cjs'),args.output.resolve()],check=True)
    print(sum(len(f['clips']) for f in manifest.values()),'clips;',len(data),'bytes unpacked;',len(encoded),'bytes inline')

if __name__=='__main__':main()

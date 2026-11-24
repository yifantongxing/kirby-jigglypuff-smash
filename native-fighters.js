// Default-costume meshes, material UV sets and bind matrices from the two fighters.
(() => {
  'use strict';
  const source=globalThis.SmashRigData;
  if(!source)return;
  const textureSets=new Map();
  const decode=(data,Type)=>{
    const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));
    return new Type(bytes.buffer);
  };
  function buildRig(T,kind) {
    const data=source[kind],group=new T.Group();
    let textures=textureSets.get(kind);
    if(!textures) {
      const loader=new T.TextureLoader();
      textures=new Map(Object.entries(data.textures).map(([name,uri])=>{
        const tex=loader.load(uri);tex.colorSpace=T.SRGBColorSpace;tex.flipY=false;
        tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.name=name;
        return [name,tex];
      }));
      textureSets.set(kind,textures);
    }
    const bind=data.bones.map(([, ,matrix])=>new T.Matrix4().fromArray(matrix));
    const bones=data.bones.map(([name],index)=>{
      const bone=new T.Bone();bone.name=name;bind[index].decompose(bone.position,bone.quaternion,bone.scale);return bone;
    });
    data.bones.forEach(([,parent],i)=>(parent===null?group:bones[parent]).add(bones[i]));
    group.updateMatrixWorld(true);
    const skeleton=new T.Skeleton(bones);
    const materials=new Map();
    const aura={value:new T.Vector4(1,.8,.28,0)};
    for(const [name,maps] of Object.entries(data.materials)) {
      const overlay=/alp/i.test(name), metal=kind==='ultraSword' && name!=='Hoshi';
      const mat=new T.MeshStandardMaterial({map:textures.get(maps.Texture0),roughness:metal?.32:.77,
        metalness:metal?.20:0,alphaTest:overlay?.18:0,side:T.DoubleSide});
      mat.name=name;
      if(maps.Texture1) {
        const uvOffset=new T.Vector4(1,1,0,0);mat.userData.irisUV=uvOffset;
        const pattern={value:0};mat.userData.irisPattern=pattern;
        mat.customProgramCacheKey=()=>'fighter-iris-v1';
        mat.onBeforeCompile=shader=>{
          shader.uniforms.pupil={value:textures.get(maps.Texture1)};
          shader.uniforms.goldPupil={value:textures.get(maps.goldIris||maps.Texture1)};
          shader.uniforms.irisPattern=pattern;
          shader.uniforms.pupilTransform={value:uvOffset};
          shader.vertexShader='attribute vec2 irisUv; varying vec2 pupilUv;\n'+shader.vertexShader
            .replace('#include <uv_vertex>','#include <uv_vertex>\npupilUv=irisUv;');
          shader.fragmentShader='varying vec2 pupilUv; uniform sampler2D pupil,goldPupil; uniform float irisPattern; uniform vec4 pupilTransform;\n'+shader.fragmentShader
            .replace('#include <map_fragment>','#include <map_fragment>\nvec2 irisUV=pupilUv*pupilTransform.xy+pupilTransform.zw; vec4 iris=irisPattern>.5?texture2D(goldPupil,irisUV):texture2D(pupil,irisUV); diffuseColor.rgb=mix(diffuseColor.rgb,iris.rgb,iris.a);');
        };
      }
      const prepare=mat.onBeforeCompile,cacheKey=mat.customProgramCacheKey();
      // The source skin shader includes coloured ambient fill. Calibrate its
      // daylight response on the two unflashed fighters in match #18086.
      const skin=maps.Texture0.startsWith('skin_') || kind==='kirby';
      const fill=skin?(kind==='jigglypuff'?'vec3(1.84,2.25,2.49)':'vec3(1.49,1.72,1.89)'):'';
      mat.customProgramCacheKey=()=>cacheKey+'|smash-aura|'+fill;
      mat.onBeforeCompile=function(shader,renderer){
        prepare.call(this,shader,renderer);shader.uniforms.finalAura=aura;
        shader.fragmentShader='uniform vec4 finalAura;\n'+shader.fragmentShader.replace('#include <opaque_fragment>',
          (skin?`float skinWeight=smoothstep(.07,.26,diffuseColor.g); outgoingLight=mix(outgoingLight,outgoingLight*${fill}+diffuseColor.rgb*.11,skinWeight);\n`:'')+
          'float edge=pow(1.-max(0.,dot(normalize(normal),normalize(vViewPosition))),1.75); outgoingLight+=finalAura.a*edge*finalAura.rgb*1.65;\n#include <opaque_fragment>');
      };
      materials.set(name,mat);
    }
    const shapes=new Map();
    for(const part of data.meshes) {
      const geo=new T.BufferGeometry();
      geo.setAttribute('position',new T.BufferAttribute(decode(part.p,Float32Array),3));
      geo.setAttribute('normal',new T.BufferAttribute(decode(part.n,Int8Array),3,true));
      geo.setAttribute('uv',new T.BufferAttribute(decode(part.uv,Float32Array),2));
      if(part.uv2)geo.setAttribute('irisUv',new T.BufferAttribute(decode(part.uv2,Float32Array),2));
      geo.setIndex(new T.BufferAttribute(decode(part.index,Uint16Array),1));
      const material=materials.get(part.material);
      let mesh;
      if(part.rigid!==undefined) {
        mesh=new T.Mesh(geo,material);bones[part.rigid].add(mesh);
      } else {
        geo.setAttribute('skinIndex',new T.Uint8BufferAttribute(decode(part.bones,Uint8Array),4));
        geo.setAttribute('skinWeight',new T.Uint16BufferAttribute(decode(part.weights,Uint16Array),4,true));
        mesh=new T.SkinnedMesh(geo,material);group.add(mesh);mesh.bind(skeleton,new T.Matrix4());
      }
      mesh.frustumCulled=false;mesh.name=part.name;
      mesh.castShadow=!(kind==='jigglypuff' && part.name.includes('_VIS'));
      const end=part.name.indexOf('_VIS');
      if(end>=0) {
        const name=part.name.slice(0,end);
        if(!shapes.has(name))shapes.set(name,[]);
        shapes.get(name).push(mesh);
      }
    }
    return {group,bones,boneNames:data.bones.map(x=>x[0]),bind,shapes,materials,aura};
  }

  function kirbyAccessories(T, rig, owner) {
    const hammer=buildRig(T,'hammer'), cutter=buildRig(T,'cutter');
    const stone=buildRig(T,'stone'), hat=buildRig(T,'copyHat');
    const hand=rig.bones[rig.boneNames.indexOf('HaveR')];
    const head=rig.bones[rig.boneNames.indexOf('Headdress')];
    hand.add(hammer.group,cutter.group);
    head.add(hat.group);
    // The hat mesh is authored about the body centre. Its locator sits 4.58
    // units higher at rest, but already carries the correct animated axes.
    hat.group.position.y=-4.58;
    owner.add(stone.group);
    stone.group.scale.copy(rig.group.scale);
    stone.group.rotation.copy(rig.group.rotation);
    const blade=cutter.bones[cutter.boneNames.indexOf('Have2')];
    const variants=['BodyStonePPonM','BodyStoneKirbyM','BodyStoneTBoxM',
      'BodyStone100t','BodyStoneHammerM','BodyStoneDosunM'];
    let lastAction='',variant=-1;
    return function update(f){
      const action=f.action,n=f.actionFrame||1;
      const transformed=action==='stoneLand' || (action==='stone' && n>=(f.landedStart?11:29))
        || (action==='stoneExit' && n<=5);
      if(action==='stone' && lastAction!=='stone')variant=(variant+1)%variants.length;
      if(transformed)for(const [name,meshes] of stone.shapes){
        for(const mesh of meshes)mesh.visible=name===variants[Math.max(0,variant)];
      }
      stone.group.visible=transformed;
      rig.group.visible=!transformed;
      hammer.group.visible=action==='hammer' && n<69;
      cutter.group.visible=action==='cutter' || action==='cutterLand';
      if(cutter.group.visible){
        const stage=action==='cutterLand'?4:n<=22?1:n<=57?2:3;
        const name='d02specialhi'+(stage===1?'':stage);
        const profile=source.cutter.bladeScale[name];
        const phase=n-1-(stage===2?22:stage===3?57:0);
        blade.scale.fromArray(profile[Math.min(profile.length-1,phase)]);
      }
      hat.group.visible=!!f.copied && (action!=='swallow' || n>=10) && action!=='ultraSword';
      lastAction=action;
    };
  }

  globalThis.SmashNative={
    createFighter(T,kind){
      const rig=buildRig(T,kind), group=new T.Group();group.name=kind+' original rig';
      group.add(rig.group);
      const visual=SmashFighters.worldScale[kind];
      rig.group.rotation.order='ZXY';
      rig.group.rotation.y=Math.PI/2;
      const size=10/77.2737*(kind==='kirby'?.96:1)/visual;
      rig.group.scale.setScalar(size);
      const accessories=kind==='kirby'?kirbyAccessories(T,rig,group):null;
      const attach=new T.Matrix4(),inverse=new T.Matrix4(),point=new T.Vector3();
      const rotation=new T.Quaternion(),axes=new T.Vector3();
      const reelRotation=new T.Quaternion(),legCentre=rig.bones[rig.boneNames.indexOf('LegC')];
      const rotId=rig.boneNames.indexOf('Rot'),restCentre=rig.bind[rotId].elements[13];
      let blendBones,restoreFrom;
      const previousMeshes=[];
      return {group,rig,boneWorld(name,target){
        const index=rig.boneNames.indexOf(name);
        if(index<0 || !group.visible)return null;
        return rig.bones[index].getWorldPosition(target);
      },boneMatrixWorld(name,target){
        const index=rig.boneNames.indexOf(name);
        if(index<0 || !group.visible)return null;
        rig.bones[index].updateWorldMatrix(true,false);
        return target.copy(rig.bones[index].matrixWorld);
      },pose(f,time,rollAngle){
        const available=globalThis.SmashMotions;
        const final=f.action==='ultraSword' || f.action==='puffUp';
        if(!available?.canPose(f) || f.flower>0 && !final)return false;
        rig.group.matrixAutoUpdate=true;
        const from=f.hitPoseFrom;
        const weight=from && available.canPose(from)?f.hitPoseWeight:1;
        if(weight<1) {
          available.pose(rig,from,time,rollAngle);
          if(weight>0) {
            blendBones ||= rig.bones.map(()=>[new T.Vector3(),new T.Quaternion(),new T.Vector3()]);
            rig.bones.forEach((bone,i)=>bone.matrix.decompose(...blendBones[i]));
            previousMeshes.length=0;
            if(weight<.5)for(const meshes of rig.shapes.values())for(const mesh of meshes)previousMeshes.push([mesh,mesh.visible]);
            available.pose(rig,f,time,rollAngle);
            rig.bones.forEach((bone,i)=>{
              const [p,q,s]=blendBones[i];bone.matrix.decompose(point,rotation,axes);
              bone.matrix.compose(p.lerp(point,weight),q.slerp(rotation,weight),s.lerp(axes,weight));
              bone.matrixWorldNeedsUpdate=true;
            });
            for(const [mesh,visible] of previousMeshes)mesh.visible=visible;
            restoreFrom=from;
          }
        } else {
          // Reset joints omitted by the destination clip after the last blended sample.
          if(restoreFrom){available.pose(rig,restoreFrom,time,rollAngle);restoreFrom=null;}
          available.pose(rig,f,time,rollAngle);
        }
        const shown=weight<.5?from:f;
        // CatchTurn reaches behind its starting direction. The simulator
        // already exposes the post-turn facing direction.
        group.scale.x=(shown.face || 1)*(shown.action==='pivotGrab'?-1:1);
        // The game rotates the nominal horizontal damage pose toward its
        // launch vector. Pivot about Rot so the simulation's contact stays put.
        const diagonal=f.action==='stun' && f.tumbling && Math.abs(f.kx)>.01 && Math.abs(f.ky)<=2*Math.abs(f.kx);
        const tilt=diagonal?weight*Math.atan2(f.ky,Math.abs(f.kx))*Math.sign(f.kx)*group.scale.x:0;
        const centre=size*(kind==='kirby'?4.6:5);
        group.scale.y=1;group.position.y=0;
        rig.group.rotation.z=tilt;
        rig.group.position.set(Math.sin(tilt)*centre,(1-Math.cos(tilt))*centre,0);
        rig.group.rotation.x=0;rig.group.rotation.y=Math.PI/2;
        if(f.backAirReel){
          // The first contact already shows the raised ear, near eye and
          // trailing foot. Register the roll about the native Rot joint.
          group.scale.x=Math.sign(f.kx) || shown.face || 1;
          group.scale.y=.84;group.position.y=centre*(1-group.scale.y);
          rig.group.rotation.set(.17,Math.PI/2,Math.atan2(f.ky,Math.abs(f.kx))+.02);
          point.set(0,centre,0).applyEuler(rig.group.rotation);
          rig.group.position.set(-point.x,centre-point.y,-point.z);
          // The unoccluded launch frame shows the rear toe trailing horizontally.
          // Turn the native two-leg chain together while keeping its knee bends.
          legCentre.parent.getWorldQuaternion(rotation).invert();
          point.set(0,1,0).applyQuaternion(rotation);
          reelRotation.setFromAxisAngle(point,2.18*group.scale.x);
          legCentre.matrix.decompose(point,rotation,axes);
          legCentre.matrix.compose(point,rotation.premultiply(reelRotation),axes);
          legCentre.matrixWorldNeedsUpdate=true;
        }
        if(accessories)accessories(f);
        // Puff Up has its own narrow cinematic rim. Stacking the meter-ready
        // Fresnel under it washes the giant's forearms and belly to white.
        const glow=(f.finalReady && f.action!=='puffUp') || f.action==='ultraSword';
        const hue=time*5.9+(f.index||0)*1.2;
        rig.aura.value.set(.61+.39*Math.cos(hue),.63+.37*Math.cos(hue-2.1),.63+.37*Math.cos(hue+2.1),glow?1:0);
        if(f.finalReady)for(const mat of rig.materials.values())if(mat.userData.irisPattern)mat.userData.irisPattern.value=1;
        return true;
      },alignCapture(holder,f){
        if(!group.visible || !f.captureMove?.startsWith('throw') || !holder.getBoneMatrixWorld('Throw',attach))return;
        attach.decompose(point,rotation,axes);
        // Preserve handedness when facing left, and keep the recipient's size.
        const z=point.z,worldSize=size*group.parent.scale.y;
        axes.set(Math.sign(axes.x)*worldSize,worldSize,worldSize);
        attach.compose(point.set(0,0,0),rotation,axes);
        point.set(0,restCentre,0).applyMatrix4(attach);
        attach.setPosition(f.x,f.y,z-point.z);
        group.updateWorldMatrix(true,false);
        rig.group.matrixAutoUpdate=false;
        rig.group.matrix.multiplyMatrices(inverse.copy(group.matrixWorld).invert(),attach);
        rig.group.matrixWorldNeedsUpdate=true;
      },setFire(value){
        for(const mat of rig.materials.values())mat.emissive.setRGB(value*.34,value*.035,0);
      }};
    },
    ultraSword(T){return buildRig(T,'ultraSword').group;},
    ultraSwordHat(T){return buildRig(T,'ultraSwordHat').group;}
  };
})();

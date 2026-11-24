// Bake the lower extent of each retargeted thrown mesh, in native stage units.
// This is a build step. The match uses one number per frame for floor contact.
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const bundle=path.resolve(process.argv[2]);
require(path.join(root,'vendor/three.r180.min.js'));
require(path.join(root,'native-fighter-data.js'));
require(bundle);
for(const script of ['native-motion-player.js','native-fighters.js','fighters.js'])
  require(path.join(root,script));
const T=globalThis.THREE;
T.TextureLoader.prototype.load=()=>new T.Texture();
const unit=10/77.2737;

async function bake(){
  await SmashMotions.ready;
  const scene=new T.Scene(), vertex=new T.Vector3();
  const kinds=['kirby','jigglypuff'];
  const models=kinds.map(kind=>{
    const parent=new T.Group(),model=SmashNative.createFighter(T,kind);
    parent.scale.setScalar(SmashFighters.worldScale[kind]);
    parent.add(model.group);scene.add(parent);
    return model;
  });
  for(const [index,kind] of kinds.entries()){
    const holder=models[index],victim=models[1-index],recipient=kinds[1-index];
    const paths=SmashThrowPaths[kind==='kirby'?'kirby':'purin'];
    for(const [move,rows] of Object.entries(paths)){
      for(const [frame,row] of rows.entries()){
        const time=frame/60;
        holder.pose({kind,x:0,y:0,face:1,action:move,actionFrame:frame+1},time);
        const f={kind:recipient,x:0,y:0,face:-1,action:'grabbed',actionFrame:1,
          captureMove:move,captureKind:kind,captureFrame:frame+1};
        victim.pose(f,time);
        victim.alignCapture({getBoneMatrixWorld:holder.boneMatrixWorld},f);
        scene.updateMatrixWorld(true);
        let lowest=Infinity;
        victim.rig.group.traverseVisible(mesh=>{
          if(!mesh.isMesh)return;
          mesh.skeleton?.update();
          for(let i=0;i<mesh.geometry.attributes.position.count;i++){
            mesh.getVertexPosition(i,vertex).applyMatrix4(mesh.matrixWorld);
            lowest=Math.min(lowest,vertex.y);
          }
        });
        row[4]=Number((lowest/unit).toFixed(4));
      }
    }
  }
  const source=fs.readFileSync(bundle,'utf8');
  fs.writeFileSync(bundle,source.replace(/^globalThis\.SmashThrowPaths=.*$/m,
    'globalThis.SmashThrowPaths='+JSON.stringify(SmashThrowPaths)+';'));
}
bake().catch(error=>{console.error(error);process.exitCode=1});

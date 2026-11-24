(() => {
  'use strict';
  const streaks=new WeakMap();
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));

  function makeStreaks(scene) {
    const T=THREE, vertices=[], colors=[];
    // Long, thin impact streaks fan out behind the fighter against the glass.
    for(const [angle,inner,weight] of [
      [4,.25,1], [14,.33,.52], [35,.41,.55], [49,.53,.40], [67,.37,.9],
      [85,.47,.82], [118,.42,.52], [152,.32,.80], [178,.41,.52], [201,.35,.9],
      [219,.37,.49], [244,.39,.63], [267,.41,.56], [295,.30,.82], [326,.34,.74], [347,.37,1]
    ]) {
      const a=angle*Math.PI/180, dx=Math.cos(a),dy=Math.sin(a),half=.006*weight;
      vertices.push(inner*dx,inner*dy,0, dx*1.42-dy*half,dy*1.42+dx*half,0, dx*1.42+dy*half,dy*1.42-dx*half,0);
      colors.push(1,1,1,.05, 1,1,1,weight, 1,1,1,weight*.75);
    }
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
    geo.setAttribute('color',new T.Float32BufferAttribute(colors,4));
    const mat=new T.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false});
    const mesh=new T.Mesh(geo,mat); mesh.visible=false; mesh.renderOrder=4;scene.add(mesh);
    return mesh;
  }

  // Dream Land's outer blast rectangle and the inset camera rectangle remain
  // on screen briefly after the fighter flies out of the ordinary camera.
  function blastRadar(scene) {
    const T=THREE,canvas=document.createElement('canvas');
    canvas.width=320;canvas.height=180;
    const ctx=canvas.getContext('2d'), map=new T.CanvasTexture(canvas);
    map.colorSpace=T.SRGBColorSpace;
    const sprite=new T.Sprite(new T.SpriteMaterial({map,transparent:true,depthTest:false,depthWrite:false}));
    sprite.renderOrder=90;scene.add(sprite);
    return {sprite,paint(f,other,view,age) {
      const {left,right,top,bottom}=view, w=right-left,h=top-bottom;
      sprite.visible=age<65;
      if(!sprite.visible) return;
      ctx.clearRect(0,0,320,180);
      ctx.fillStyle='rgba(23,29,43,.38)';ctx.fillRect(0,0,320,180);
      ctx.strokeStyle='rgba(255,255,255,.80)';ctx.lineWidth=1.7;
      ctx.strokeRect(1,1,318,178);ctx.strokeRect(42,31,234,100);
      const unit=10/77.2737;
      for(const fighter of [f,other]) {
        const x=clamp(160+fighter.x/(500*unit)*320,5,315);
        const y=clamp((192.112-fighter.y/unit)/332.112*180,5,175);
        ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);
        ctx.fillStyle=fighter.port?'#81baff':'#ff8398';ctx.fillRect(-3,-3,6,6);ctx.restore();
      }
      map.needsUpdate=true;sprite.material.opacity=clamp((65-age)/22,0,1)*.77;
      sprite.position.set(left+.143*w,top-.235*h,26);sprite.scale.set(.237*w,.241*h,1);
    }};
  }

  function draw(model,f,other,view,scene,t) {
    let rays=streaks.get(model);
    if(!f.screenKO) {
      if(rays) {rays.visible=false;rays.userData.radar.sprite.visible=false;model.group.rotation.set(0,0,0);}
      return;
    }
    if(!rays) {rays=makeStreaks(scene);rays.userData.radar=blastRadar(scene);streaks.set(model,rays);}
    const age=f.actionFrame-1, w=view.right-view.left, h=view.top-view.bottom;
    const dir=f.screenKO.side, u=clamp(age/30,0,1);
    const drop=clamp((age-50)/35,0,1);
    const px=.5+dir*(f.kind==='kirby'?.14:.241),py=.484;
    // Perspective growth follows the original camera offsets -230 → -50.
    // The final on-screen coverage is measured from the paired Dream Land shot.
    const size=Math.min(w*.83,h*.765)/(f.kind==='kirby'?1.94:2.02);
    const scale=size*(50/(230-180*u));
    const x=view.left+w*(px+dir*.05*(1-u));
    const y=view.top-h*(py-1.12*(1-u)+1.42*drop*drop);
    const spin=dir*f.screenKO.angle*Math.PI/180;
    const rotation=spin+(1-u)*dir*1.53;
    model.update({...f,face:1,flower:0,action:'screenKOPose'},t);
    const g=model.group;
    g.scale.setScalar(scale);g.rotation.set((1-u)*Math.PI*.25,(1-u)*dir*2.1,rotation);
    const center=.83*scale;
    g.position.set(x+Math.sin(rotation)*center, y-Math.cos(rotation)*center,12);
    if(!other.screenKO || f.index===0) rays.userData.radar.paint(f,other,view,age);
    else rays.userData.radar.sprite.visible=false;
    rays.visible=age>=30 && age<51;
    if(rays.visible) {
      rays.position.set(x,y,9);rays.scale.set(h,h,1);
      rays.material.opacity=.83*(1-(age-30)/21);
    }
  }
  globalThis.SmashScreenKO={draw};
})();

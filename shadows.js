// Project each live fighter silhouette onto the ground or a floating platform.
// One small pair of masks serves all four decks.
(() => {
  const castX=-.22, castZ=.10, pitch=.205;
  const spanX=5.6, spanZ=4.2, resolution=224;
  const sampleDirections=[];
  for(let i=0;i<42;i++) {
    const y=1-(i+.5)*2/42, r=Math.sqrt(1-y*y), a=i*Math.PI*(3-Math.sqrt(5));
    sampleDirections.push([r*Math.cos(a),y,r*Math.sin(a)]);
  }
  sampleDirections.push([1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]);

  // Pick outer vertices once per geometry. Pose changes are carried by each mesh's
  // world matrix, including detached feet, a hammer swing and the copied headpiece.
  function samples(geometry,cache) {
    if(cache.has(geometry))return cache.get(geometry);
    const pos=geometry.attributes.position, indices=new Set();
    for(const [dx,dy,dz] of sampleDirections) {
      let best=-Infinity, index=0;
      for(let j=0;j<pos.count;j++) {
        const dot=dx*pos.getX(j)+dy*pos.getY(j)+dz*pos.getZ(j);
        if(dot>best){best=dot;index=j;}
      }
      indices.add(index);
    }
    const points=[...indices].map(j=>({vertex:j,x:pos.getX(j),y:pos.getY(j),z:pos.getZ(j),u:0,v:0,h:0}));
    cache.set(geometry,points);return points;
  }

  const turn=(a,b,c)=>(b.u-a.u)*(c.v-a.v)-(b.v-a.v)*(c.u-a.u);
  function addSilhouette(ctx,near,points,m,origin,hull,low) {
    for(const p of points) {
      const h=m[1]*p.x+m[5]*p.y+m[9]*p.z+m[13]-origin.y;
      p.h=h;
      p.u=m[0]*p.x+m[4]*p.y+m[8]*p.z+m[12]-origin.x+castX*h;
      p.v=m[2]*p.x+m[6]*p.y+m[10]*p.z+m[14]+castZ*h;
    }
    points.sort((a,b)=>a.u-b.u || a.v-b.v);
    addContour(ctx,points,hull);
    low.length=0;
    for(const p of points)if(p.h<.17)low.push(p);
    if(low.length>=3)addContour(near,low,hull);
  }
  function addContour(path,points,hull) {
    let k=0;
    for(const p of points) {
      while(k>1 && turn(hull[k-2],hull[k-1],p)<=0)k--;
      hull[k++]=p;
    }
    const bottom=k;
    for(let j=points.length-2;j>=0;j--) {
      const p=points[j];
      while(k>bottom && turn(hull[k-2],hull[k-1],p)<=0)k--;
      hull[k++]=p;
    }
    if(k<4)return;
    path.moveTo(hull[0].u,hull[0].v);
    for(let i=1;i<k-1;i++) path.lineTo(hull[i].u,hull[i].v);
    path.closePath();
  }

  function create(T, scene, decks) {
    const cache=new WeakMap(), plane=new T.PlaneGeometry(1,1), skinnedPoint=new T.Vector3();
    const deckBounds=decks.map(d=>new T.Vector3(d.left,d.right,d.y));
    const planks={value:deckBounds.slice(1)};
    // All three surinukeShape top faces have the same front and back edges.
    // The sunlight passes the front lip before reaching the lower cheek.
    const plankVertex='varying vec3 plankWorld;\n';
    const plankFragment=`
      varying vec3 plankWorld;
      uniform vec3 shadowPlanks[3];
      uniform float receivePlankShadow;
      float plankCover(vec3 world) {
        float cover=0.;
        for(int i=0;i<3;i++){
          vec3 plank=shadowPlanks[i];
          float height=plank.z-world.y;
          vec2 intercept=world.xz+height*vec2(.22,.35);
          float inside=min(min(intercept.x-plank.x,plank.y-intercept.x),
                           min(intercept.y+.9151,.9420-intercept.y));
          float penumbra=.034+max(0.,height)*.07;
          cover=max(cover,smoothstep(-.018,.055,height)*smoothstep(-penumbra,penumbra,inside));
        }
        return cover;
      }
    `;
    const fighters=[0,1].map(()=>{
      const canvas=document.createElement('canvas');canvas.width=resolution;canvas.height=168;
      const ctx=canvas.getContext('2d');
      ctx.setTransform(canvas.width/spanX,0,0,canvas.height/spanZ,canvas.width/2,canvas.height/2);
      const mask=new T.CanvasTexture(canvas);mask.generateMipmaps=false;
      mask.minFilter=T.LinearFilter;mask.magFilter=T.LinearFilter;
      return {ctx,mask,hull:[],low:[],receive:{value:0},bound:false};
    });
    const surfaces=decks.map((d,index)=>{
      const material=new T.ShaderMaterial({
        transparent:true,depthTest:true,depthWrite:false,toneMapped:false,
        // A single directional light leaves one shadow even where fighters overlap.
        // Multiplication also keeps the actual grass, pond and plank grain visible.
        blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.DstColorFactor,blendDst:T.ZeroFactor,
        blendSrcAlpha:T.ZeroFactor,blendDstAlpha:T.OneFactor,
        uniforms:{mask0:{value:fighters[0].mask},mask1:{value:fighters[1].mask},
          deck:{value:deckBounds[index]},boards:{value:deckBounds},origin:{value:[new T.Vector3(),new T.Vector3()]},
          strength:{value:new Float32Array(2)},surfaceDepth:{value:new T.Vector3()}},
        vertexShader:`
          varying vec2 point;
          void main(){vec4 world=modelMatrix*vec4(position,1.0);point=world.xy;gl_Position=projectionMatrix*viewMatrix*world;}`,
        fragmentShader:`
          uniform sampler2D mask0,mask1;uniform vec3 deck,boards[4],origin[2];uniform float strength[2];
          varying vec2 point; uniform vec3 surfaceDepth;
          vec2 castMask(sampler2D mask,vec3 center,float power){
            if(power<.001)return vec2(0.0);
            vec2 uv=(point-center.xy)/vec2(${spanX.toFixed(2)},${(spanZ*pitch).toFixed(4)})+.5;
            if(min(min(uv.x,uv.y),min(1.0-uv.x,1.0-uv.y))<0.0)return vec2(0.0);
            for(int i=0;i<4;i++){
              vec3 board=boards[i];float delta=board.z-deck.z;
              if(delta>.12 && delta<center.z+.13){
                float upperX=point.x-delta*${castX.toFixed(3)};
                float inside=min(upperX-board.x,board.y-upperX);
                power*=1.0-smoothstep(-.012,.017,inside);
              }
            }
            vec2 spread=vec2(1.0/224.0,1.0/168.0)*(.85+.59*center.z);
            vec4 centerSample=texture2D(mask,uv);
            float shape=.40*centerSample.a;
            shape+=.15*(texture2D(mask,uv+vec2(spread.x,0.0)).a+texture2D(mask,uv-vec2(spread.x,0.0)).a
                       +texture2D(mask,uv+vec2(0.0,spread.y)).a+texture2D(mask,uv-vec2(0.0,spread.y)).a);
            float contact=centerSample.r*centerSample.a*(1.0-smoothstep(.02,.33,center.z));
            return vec2(shape,contact)*power;
          }
          void main(){
            float side=min(point.x-deck.x,deck.y-point.x),dy=point.y-deck.z;
            float edge=smoothstep(-.012,.017,side);
            if(deck.z>0.0){
              float endWidth=mix(.58,1.0,smoothstep(0.0,.22,side));
              edge*=1.0-smoothstep(.135*endWidth,.155*endWidth,abs(dy-.014));
            }
            vec2 shade=edge*max(castMask(mask0,origin[0],strength[0]),castMask(mask1,origin[1],strength[1]));
            if(shade.x<.003)discard;
            // Recover the physical deck depth at this screen pixel. From below,
            // the platform underside hides the shadow cast on its top face.
            float sight=${SmashStage.cameraPitch.toFixed(4)}-(point.y-cameraPosition.y)/surfaceDepth.x;
            if(sight<=.004)discard;
            float z=(deck.z-point.y)/sight;
            gl_FragDepth=surfaceDepth.y+(z+.11)*surfaceDepth.z;
            vec3 transmission=deck.z>0.0?vec3(.48,.53,.46):vec3(.37,.58,.37);
            gl_FragColor=vec4(mix(vec3(1.0),transmission,shade.x)*mix(1.0,.67,shade.y),1.0);
          }`
      });
      const receiver=new T.Mesh(plane,material);receiver.visible=false;receiver.renderOrder=-700;
      receiver.name='Fighter ground shadow';receiver.position.set((d.left+d.right)/2,d.y+(index===0?.045:.014),-3);
      receiver.scale.set(d.right-d.left,index===0?.79:.32,1);
      receiver.onBeforeRender=(renderer,currentScene,camera)=>{
        const range=camera.far-camera.near;
        material.uniforms.surfaceDepth.value.set(SmashStage.cameraDistance(camera),(camera.position.z-camera.near)/range,-1/range);
      };
      scene.add(receiver);return receiver;
    });

    function update(i,model,enabled,overhead=true) {
      const fighter=fighters[i],{ctx,mask,hull,low}=fighter,base=model.position;
      if(!fighter.bound) {
        const materials=new Set();
        model.traverse(part=>{
          if(part.isMesh && part.material?.isMeshStandardMaterial)materials.add(part.material);
        });
        for(const mat of materials) {
          const previous=mat.onBeforeCompile,key=mat.customProgramCacheKey();
          mat.customProgramCacheKey=()=>key+'|plank-shadow';
          mat.onBeforeCompile=function(shader,renderer){
            previous.call(this,shader,renderer);
            shader.uniforms.shadowPlanks=planks;
            shader.uniforms.receivePlankShadow=fighter.receive;
            shader.vertexShader=plankVertex+shader.vertexShader.replace('#include <project_vertex>',
              'plankWorld=(modelMatrix*vec4(transformed,1.)).xyz;\n#include <project_vertex>');
            shader.fragmentShader=plankFragment+shader.fragmentShader.replace('#include <opaque_fragment>',`
              if(receivePlankShadow>.5){
                vec3 worldNormal=inverseTransformDirection(normal,viewMatrix);
                float facing=dot(worldNormal,normalize(vec3(.22,1.,.35)));
                float coverage=plankCover(plankWorld)*smoothstep(.04,.73,facing);
                outgoingLight*=mix(vec3(1.),vec3(.215,.204,.285),coverage);
              }
              #include <opaque_fragment>`);
          };
          mat.needsUpdate=true;
        }
        fighter.bound=true;
      }
      fighter.receive.value=enabled && overhead?1:0;
      let cast=false;
      for(let j=0;j<decks.length;j++) {
        const d=decks[j],shadow=surfaces[j],h=base.y-d.y;
        const cx=base.x+castX*h,uniforms=shadow.material.uniforms,gap=Math.max(0,h);
        const active=enabled && model.visible && h>=-.12 && h<9 && cx+spanX/2>d.left && cx-spanX/2<d.right;
        const powers=uniforms.strength.value;
        powers[i]=active?Math.max(0,1-gap/9)/(1+gap*.055):0;
        shadow.visible=powers[0]+powers[1]>.001;
        if(active) {uniforms.origin.value[i].set(cx,d.y-pitch*castZ*gap,gap);cast=true;}
      }
      if(!cast)return;
      model.updateWorldMatrix(true,true);
      const contact=new Path2D();
      ctx.clearRect(-spanX/2,-spanZ/2,spanX,spanZ);ctx.beginPath();
      model.traverseVisible(part=>{
        if(part.isMesh && part.castShadow && part.geometry.attributes.position) {
          const points=samples(part.geometry,cache);
          if(part.isSkinnedMesh)for(const p of points) {
            part.getVertexPosition(p.vertex,skinnedPoint);
            p.x=skinnedPoint.x;p.y=skinnedPoint.y;p.z=skinnedPoint.z;
          }
          addSilhouette(ctx,contact,points,part.matrixWorld.elements,base,hull,low);
        }
      });
      ctx.fillStyle='black';ctx.fill();ctx.fillStyle='red';ctx.fill(contact);mask.needsUpdate=true;
    }
    return {update};
  }
  globalThis.SmashShadows={create};
})();

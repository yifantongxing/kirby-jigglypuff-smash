// Jigglypuff's specials, in fighter-local stage units (positive y is up).
(() => {
  const tau = Math.PI * 2;
  const clamp = value => Math.max(0, Math.min(1, value));
  const impacts = new WeakMap();

  // The visual swell keeps expanding through the launch freeze. The damaging
  // volumes have their own clock in the simulation. Values are zero-based
  // frames of the native attack followed by its recovery at index 120.
  // After the narrow recoil, the mouth widens across F278–279 and then holds through the pop.
  const swellTiming=[[231,0],[249,20],[265,48],[273,59],[277,63.4],[278,65.2],[279,66.5],[281,66.5],
    [305,68],[309,71.9],[313,79],[329,98],[337,123],[377,163],[401,188],[453,239]];
  function visualPose(f) {
    if(!f || f.action!=='puffUp' || f.actionFrame<231)return f;
    const t=f.actionFrame;
    let i=1;
    while(i<swellTiming.length-1 && swellTiming[i][0]<t)i++;
    const [a,start]=swellTiming[i-1],[b,end]=swellTiming[i];
    const n=start+(end-start)*clamp((t-a)/(b-a));
    return {...f,finalPhase:n<120?'attack':'end',finalFrame:n<120?Math.min(119,n):n-120};
  }

  function glint(c, x, y, size, color) {
    c.save(); c.translate(x, y); c.fillStyle = color; c.beginPath();
    c.moveTo(0, size); c.quadraticCurveTo(size*.08,size*.10,size*.70,0);
    c.quadraticCurveTo(size*.06,-size*.09,0,-size*.90);
    c.quadraticCurveTo(-size*.08,-size*.08,-size*.70,0);
    c.quadraticCurveTo(-size*.08,size*.10,0,size); c.fill(); c.restore();
  }

  function musicNote(c, x, y, size, tilt, paired, color) {
    c.save(); c.translate(x,y); c.rotate(tilt); c.scale(size,size);
    c.fillStyle=color; c.beginPath(); c.ellipse(-.25,-.36,.29,.17,.32,0,tau); c.fill();
    c.beginPath(); c.moveTo(-.02,-.37); c.lineTo(-.04,.55);
    if (paired) {
      c.lineTo(.76,.49); c.lineTo(.74,-.39); c.lineTo(.65,-.39);
      c.lineTo(.61,.21); c.lineTo(.09,.27); c.lineTo(.07,-.34);
    } else {
      c.bezierCurveTo(.44,.45,.88,.15,.30,-.24);
      c.bezierCurveTo(.55,.10,.33,.21,.09,.22); c.lineTo(.08,-.34);
    }
    c.fill();
    if (paired) { c.beginPath(); c.ellipse(.49,-.41,.27,.17,.32,0,tau); c.fill(); }
    c.restore();
  }

  function singing(c, f, n) {
    c.save();
    if (f.grounded) { c.beginPath(); c.rect(-3.6,-.08,7.2,5); c.clip(); }
    const center=.87;
    for (let i=0;i<8;i++) {
      const age=n-(9+i*13);
      if (age<0 || age>40) continue;
      const p=age/40, r=.62+p*1.61+(i>=6?.15*p:0);
      c.globalAlpha=clamp(age/3)*clamp((41-age)/8);
      c.beginPath();
      for(let k=0;k<=72;k++) {
        const a=k*tau/72;
        const wobble=(.023*Math.sin(8*a+.35*age)+.017*Math.sin(13*a-.16*age))*(1-p*.60);
        const x=(r+wobble)*Math.cos(a), y=center+(r+wobble)*Math.sin(a);
        if(k===0) c.moveTo(x,y); else c.lineTo(x,y);
      }
      c.closePath();
      c.strokeStyle=p>.63?'#ffbd55':'#fff273'; c.lineWidth=.11*(1-.5*p); c.globalAlpha*=.28; c.stroke();
      c.globalAlpha*=3.25; c.lineWidth=.065*(1-.63*p);
      c.strokeStyle=p>.65?'#ffc557':p>.25?'#fff188':'#fffbe2'; c.stroke();
    }
    c.restore();
    // The four notes first appear above the shoulders, then cross the top and sides of the wave.
    const angles=[.24,1.12,2.03,2.95];
    for (let i=0;i<4;i++) {
      const start=20+(i%2)*2;
      if(n<start || n>=125) continue;
      const p=((n-start)%38)/38;
      const visibility=clamp((n-start)/7)*clamp((126-n)/12)*(.70+.30*Math.sin(p*Math.PI));
      const a=angles[i]+.21*Math.sin((n-start)*.051+i*.47), r=1.53+.54*p;
      c.save(); c.globalAlpha=visibility;
      musicNote(c,Math.cos(a)*r,center+Math.sin(a)*r,.40+.14*Math.sin(p*Math.PI),.15*Math.sin(n*.06+i),i%2===1,i%2===1?'#fffa72':'#82fff5'); c.restore();
    }
  }

  function breath(c, n, end, isRest) {
    // A breath leaves the face in a small cluster. The bubbles are translucent with a refracted cyan rim.
    const first=isRest?Math.max(8,end-90):2;
    for(let j=0;j<3;j++) {
      const t=n-first-j*8;
      if(t<0 || n>end+26) continue;
      const age=t%53, born=n-age;
      if(j && (Math.floor(t/53)+j)%3===1) continue;
      if(age>=38 || born>end) continue;
      const p=age/38, r=(.085+.10*Math.sin(Math.PI*p))*(1-j*.19);
      const x=.62+p*(.91+.07*j)+.13*Math.sin(5.2*p+j*.46);
      const y=.81+p*(1.49+.10*j)+.06*Math.sin(8.1*p);
      c.save(); c.globalAlpha=clamp(age/4)*clamp((38-age)/7)*.93;
      const g=c.createRadialGradient(x-r*.31,y+r*.40,r*.04,x,y,r);
      g.addColorStop(0,'#ffffff'); g.addColorStop(.20,'#d5ffff'); g.addColorStop(.39,'#54deffbb');
      g.addColorStop(.68,'#1173b588'); g.addColorStop(.86,'#319bd3'); g.addColorStop(1,'#a9fdffb0');
      c.fillStyle=g; c.beginPath(); c.arc(x,y,r,0,tau); c.fill();
      c.strokeStyle='#d3ffffcc'; c.lineWidth=r*.11; c.beginPath(); c.arc(x,y,r*.77,3.64,5.08); c.stroke(); c.restore();
    }
  }

  function dust(c, clock, force) {
    // Strips hide behind the fighter's rear edge. Farther puffs curl upwards and fade apart.
    for(let i=0;i<4;i++) {
      const age=clock-i*4;
      if(age<0) continue;
      const p=(age%19)/19;
      const x=-.64-p*(1.16+force*.43), y=.13+p*(.27+.38*force+.13*(i%2));
      const r=(.11+.26*Math.sin(p*Math.PI))*(.84+.10*(i%3))*(1+.35*force);
      c.save(); c.translate(x,y); c.globalAlpha=clamp(age/3)*(1-p*.80);
      c.fillStyle='#e1e2df'; c.beginPath(); c.ellipse(0,0,r*1.22,r*.63,0,0,tau); c.fill();
      c.fillStyle='#fffef5'; c.beginPath(); c.arc(-r*.40,r*.13,r*.62,0,tau); c.arc(r*.14,r*.29,r*.74,0,tau); c.arc(r*.63,r*.07,r*.44,0,tau); c.fill();
      c.restore();
    }
  }

  function spin(c, f, n) {
    if(f.rollHit) return;
    const hold=f.chargeHold||0;
    if(!hold && n>=3 && n<=17 && f.grounded) {
      c.save();c.globalAlpha=clamp((18-n)/7);dust(c,n-3,.33);c.restore();
    }
    // The uncharged ground roll has visible takeoff dust and no luminous shell.
    if(n<8 || hold<4 || f.rollPhase==='end' || f.rollPhase==='turn') return;
    const charging=n<16, clock=charging?n-8+hold:n-16;
    if(!charging && Math.abs(f.vx)<.115) return;
    const force=charging?clamp(clock/30):clamp((f.charge||0)/36);
    if(f.grounded) dust(c,clock,force);
    if(!charging) {
      for(let i=3;i>=1;i--) {
        c.save(); c.globalAlpha=(.18-i*.039)*clamp(clock/3); c.fillStyle='#ffd5e2';
        c.beginPath(); c.ellipse(-i*(.24+force*.12),.78,.82,.76,-.17,0,tau); c.fill(); c.restore();
      }
    }
    c.save(); c.translate(0,.80); c.rotate(-.33+.14*Math.sin(clock*.29));
    const shell=c.createRadialGradient(-.18,.37,.10,0,0,.88);
    shell.addColorStop(0,charging?'#fff3db9a':'#fff0d52b'); shell.addColorStop(.73,charging?'#ffe8e595':'#ffdcdf32');
    shell.addColorStop(.90,'#ffeced9c'); shell.addColorStop(1,'#ffc5da00');
    c.fillStyle=shell; c.beginPath(); c.ellipse(0,0,.87,.81,0,0,tau); c.fill();
    for(let i=0;i<3;i++) {
      const a=clock*.29+i*tau/3;
      const g=c.createLinearGradient(-.73,0,.73,0);
      g.addColorStop(0,'#ffd0df00'); g.addColorStop(.35,'#ffe2eaa8'); g.addColorStop(.70,'#fff6f7e6'); g.addColorStop(1,'#f8acc5aa');
      c.save(); c.rotate(a); c.fillStyle=g; c.beginPath(); c.moveTo(-.82,.16);
      c.bezierCurveTo(-.65,.96,.42,1.02,.80,.12); c.bezierCurveTo(.35,.72,-.48,.73,-.82,.16); c.fill(); c.restore();
    }
    c.restore();
    const flash=(clock+2)%22;
    if(flash<8 && (charging || clock<15)) {
      c.save(); c.globalAlpha=1-flash/8; glint(c,.65,.50,.25+force*.22,'#fff6b3'); glint(c,.65,.50,.17,'white'); c.restore();
    }
  }

  function pound(c, f, n) {
    if(n>=6 && n<=11) {
      const k=Math.sin(Math.PI*(n-5)/7);
      glint(c,-.57,1.22,.31*k,'#95edff'); glint(c,-.57,1.22,.19*k,'#fff');
    }
    if(n>=10 && n<=19) {
      const p=(n-10)/9;
      c.save(); c.globalAlpha=clamp((n-9)/2)*clamp((20-n)/4); c.translate(.10*p,-.07*p);
      const stripe=c.createLinearGradient(-1.9,.91,1.04,1.8);
      stripe.addColorStop(0,'#fb87b580'); stripe.addColorStop(.32,'#f976a9ef'); stripe.addColorStop(.73,'#ffb4d7'); stripe.addColorStop(1,'#ff91a16b');
      c.fillStyle=stripe; c.beginPath(); c.moveTo(-2.04,.80);
      c.bezierCurveTo(-1.45,1.99,-.05,2.16,1.14,1.66); c.bezierCurveTo(.02,1.82,-1.24,1.52,-2.04,.80); c.fill();
      c.fillStyle='#fff8ff'; c.beginPath(); c.moveTo(-1.78,1.08);
      c.bezierCurveTo(-1.06,2.01,-.09,2.04,.72,1.79); c.bezierCurveTo(-.19,1.94,-1.07,1.66,-1.78,1.08); c.fill(); c.restore();
    }
    if(n>=16 && n<=24) {
      const p=(n-16)/8; c.save(); c.globalAlpha=clamp((n-15)/2)*(1-p); c.translate(.14*p,0);
      c.fillStyle='#fffdf5'; c.beginPath(); c.moveTo(-.70,1.65); c.bezierCurveTo(.74,1.49,1.30,.51,1.04,.13);
      c.bezierCurveTo(1.17,.68,.25,1.41,-.70,1.65); c.fill(); c.restore();
    }
    if(f.grounded && n>=13 && n<=25) { c.save(); c.globalAlpha=clamp((26-n)/6); dust(c,n-13,.35); c.restore(); }
  }

  // sys_attack_arc starts on F9. The bright head follows the raised hand
  // across the crown, while the narrow trailing edge fades behind it.
  // [animation frame, trailing angle, leading angle, ribbon width, opacity]
  const upAirArc=[[9,193,176,.065,.42],[11,184,121,.145,.97],[13,170,42,.160,1],
    [15,90,25,.154,1],[17,44,15,.105,.84],[19,22,13,0,0]];
  function drawUpAir(c,f,n) {
    if(n<9 || n>=19)return;
    let i=1;while(upAirArc[i][0]<n)i++;
    const a=upAirArc[i-1],b=upAirArc[i],t=(n-a[0])/(b[0]-a[0]);
    const at=k=>a[k]+(b[k]-a[k])*t;
    const tailTime=a[0]===13?t*t*t:t;
    const headTime=a[0]===9?t*t:a[0]===11?1-(1-t)*(1-t):t;
    const tail=(a[1]+(b[1]-a[1])*tailTime)*Math.PI/180;
    const head=(a[2]+(b[2]-a[2])*headTime)*Math.PI/180,thickness=at(3);
    c.save();c.translate(f.x,f.y);c.scale(f.face,1);
    for(const inner of [false,true]){
      c.globalAlpha=at(4)*(inner?.94:.67);
      c.fillStyle=inner?'#ffffed':'#fff1ba';c.beginPath();
      for(const side of [1,-1])for(let j=0;j<=20;j++) {
        const q=side===1?j/20:1-j/20;
        const a=tail+(head-tail)*q;
        const width=thickness*(inner?.67:1)*Math.pow(q,.50)*Math.pow(Math.sin(Math.PI*q),.42);
        const radius=.965+side*width;
        const x=.03+1.16*radius*Math.cos(a),y=.91+1.43*radius*Math.sin(a);
        if(side===1 && j===0)c.moveTo(x,y);else c.lineTo(x,y);
      }
      c.closePath();c.fill();
    }
    c.restore();
  }
  function draw(c, f, worldFrame) {
    const a=f.action, n=f.actionFrame, hit=impacts.get(f);
    if(f.kind==='jigglypuff' && a==='uair')drawUpAir(c,f,n);
    if(a!=='sing' && a!=='sleep' && a!=='rest' && a!=='rollout' && a!=='pound' && !hit) return;
    c.save(); c.translate(f.x,f.y); c.scale(f.face,1);
    if(a!=='sing') { const size=SmashFighters.worldScale[f.kind]; c.scale(size,size); }
    if(a==='sing') singing(c,f,n);
    else if(a==='sleep' || a==='rest') breath(c,n,f.actionLimit-19,a==='rest');
    else if(a==='rollout') spin(c,f,n);
    else if(a==='pound') pound(c,f,n);
    c.restore();
    if(hit) {
      const age=worldFrame-hit.frame;
      if(age>=16 || age<0) { impacts.delete(f); return; }
      if(hit.move==='pound' && age>=5) {
        const k=Math.sin((age-4)*Math.PI/12); c.save(); c.globalAlpha=k;
        glint(c,hit.x,hit.y,.37*k,'#ffe286'); glint(c,hit.x,hit.y,.21*k,'#fff'); c.restore();
      }
    }
  }

  function event(e, m) {
    // A shield touch or whiff never produces the additional gold contact glint.
    if(e.type==='hit' && e.move==='pound') impacts.set(m.fighters[e.fighter],{move:e.move,x:e.x,y:e.y,frame:m.frame});
  }
  function restContact(c,fighters,age) {
    if(age>24) return;
    const f=fighters.find(fighter=>fighter.action==='rest');
    if(!f)return;
    c.save(); c.translate(f.x,f.y); c.scale(f.face,1);
    const t=age/24, x=1.18+t*.26, y=.83, r=.34+.25*Math.min(1,t*2.5);
    c.globalAlpha=(1-t)*.9;
    const halo=c.createRadialGradient(x,y,.02,x,y,1.08);
    halo.addColorStop(0,'#fbffe576');halo.addColorStop(.44,'#edff6e68');halo.addColorStop(1,'#dcff6100');
    c.fillStyle=halo;c.fillRect(x-1.08,y-1.08,2.16,2.16);
    c.strokeStyle='#b5ff79';c.lineWidth=.064;c.beginPath();c.arc(x,y,r,0,tau);c.stroke();
    c.strokeStyle='#f6ffed';c.lineWidth=.026;c.stroke();
    glint(c,x+r*.85,y+r*.54,.23,'#c9ff9e');glint(c,x+r*.85,y+r*.54,.13,'white');
    if(age<14) {
      c.globalAlpha=1-age/14;
      for(let i=0;i<3;i++) {
        const ox=[.53,1.40,1.76][i],oy=[1.83,1.48,1.98][i];
        c.save();c.translate(ox+t*.30,oy+t*.18);c.rotate(i===0?.63:-.66);
        c.fillStyle='#8bfff6';c.beginPath();c.ellipse(0,0,.047,.30,0,0,tau);c.fill();
        c.fillStyle='#fff';c.beginPath();c.ellipse(0,.02,.017,.23,0,0,tau);c.fill();c.restore();
      }
      c.translate(.57,1.77);c.fillStyle='#fff191';c.beginPath();
      c.moveTo(-.24,-.18);c.lineTo(.04,-.03);c.lineTo(.32,-.17);c.lineTo(.21,.03);
      c.lineTo(.56,.24);c.lineTo(.12,.17);c.lineTo(.26,.47);c.lineTo(-.05,.20);c.closePath();c.fill();
    }
    c.restore();
  }
  // The original Special Zoom replaces the scenery behind the fighting surface.
  // Keep Dream Land's floor and three planks, and use the actors' normal depth test.
  function createRestBackdrop(T, scene) {
    const material=new T.ShaderMaterial({
      depthTest:true, depthWrite:false, transparent:true, toneMapped:false,
      uniforms:{at:{value:new T.Vector2()},progress:{value:0}},
      vertexShader:`
        varying vec2 point;
        void main() {
          point=position.xy;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
        }`,
      fragmentShader:`
        varying vec2 point;
        uniform vec2 at;
        uniform float progress;
        float random(float v){return fract(sin(v*17.23+13.54)*18571.924);}
        float plank(vec2 p, float left, float right, float top) {
          float u=(p.x-left)/(right-left);
          float bevel=smoothstep(0.0,.06,u)*(1.0-smoothstep(.94,1.0,u));
          return min(min(p.x-left,right-p.x),min(top+.13-p.y,p.y-top+.27*bevel));
        }
        void main() {
          float coast=10.03-max(0.0,-point.y-1.2)*.44;
          coast-=max(0.0,-point.y-4.55)*1.65;
          float rim=.34+.20*(1.0-clamp(abs(point.x)/10.0,0.0,1.0));
          float floorMask=min(coast-abs(point.x),rim-point.y);
          floorMask=max(floorMask,plank(point,-7.95,-4.10,3.495));
          floorMask=max(floorMask,plank(point,4.10,8.16,3.495));
          floorMask=max(floorMask,plank(point,-2.461,2.461,6.655));
          float edge=1.0-smoothstep(-.035,.028,floorMask);
          if(edge<.002)discard;
          vec2 q=point-at;
          float r=max(length(q),.0001),a=atan(q.y,q.x), t=progress;
          float ripple=.055*sin(r*2.7+a*7.0+t*1.2)+.020*sin(r*9.0+a*12.0-t);
          float angle=a+ripple*(.42+.68*smoothstep(.5,5.0,r));
          float bands=.78*sin(angle*7.0+.58*sin(3.0*angle))+.55*sin(angle*13.0+.31)+.35*sin(angle*4.0-1.23);
          float crest=smoothstep(-.88,.54,bands), bright=smoothstep(.12,.99,bands);
          vec3 blue=mix(vec3(.011,.010,.034),vec3(.017,.022,.43),crest);
          blue=mix(blue,vec3(.021,.054,.68),bright);
          blue+=vec3(.013,.022,.11)*pow(max(0.0,sin(angle*20.0+.35*sin(angle*9.0))),11.0)*crest;
          float sector=(a/6.2831853+.5)*29.0, id=floor(sector);
          float offset=.12+.73*random(id+2.4), dist=abs(fract(sector)-offset);
          float width=.011+.036*random(id+19.9);
          float start=.54+1.9*random(id+5.1);
          float line=(1.0-smoothstep(width*.38,width,dist))*
            smoothstep(start,start+.62+1.7*random(id+8.0),r);
          blue=mix(blue,vec3(.94,.96,1.0),line*(.64+.35*random(id+1.2)));
          blue+=vec3(.19,.07,.28)*exp(-dot(q,q)*1.3)*(1.0-smoothstep(.25,.78,t));
          float fade=1.0-smoothstep(.80,1.0,t);
          gl_FragColor=vec4(blue,edge*fade);
        }`
    });
    const backdrop=new T.Mesh(new T.PlaneGeometry(180,150),material);
    backdrop.name='Rest Special Zoom'; backdrop.position.z=-4;
    backdrop.renderOrder=-990; backdrop.frustumCulled=false; backdrop.visible=false;
    scene.add(backdrop);
    return {update(accent){
      backdrop.visible=!!accent;
      if(accent) {material.uniforms.at.value.set(accent.x,accent.y);material.uniforms.progress.value=accent.progress;}
    }};
  }
  function createFinalAura(T,scene,model){
    const maskLayer=28, mask=new T.WebGLRenderTarget(256,144,{depthBuffer:true});
    mask.texture.generateMipmaps=true;
    mask.texture.minFilter=T.LinearMipmapLinearFilter;
    model.group.traverse(node=>node.layers.enable(maskLayer));
    const white=new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide,toneMapped:false});
    const lens={value:new T.Matrix4()}, frameScale={value:new T.Vector2()};
    const shadow={value:new T.Vector2()}, screen={value:new T.Vector2()}, silhouette={value:mask.texture};
    // The eyes and curl on a fully inflated Puff are several world units nearer
    // the lens than the ears. Use the same perspective as the stage and halo.
    const materials=new Set([white]);
    model.group.traverse(node=>{if(node.material)materials.add(node.material);});
    for(const mat of materials) {
      const compile=mat.onBeforeCompile.bind(mat),key=mat.customProgramCacheKey();
      mat.customProgramCacheKey=()=>key+'|puff-perspective';
      mat.onBeforeCompile=(shader,renderer)=>{
        compile(shader,renderer);
        shader.uniforms.puffLens=lens;shader.uniforms.puffFrameScale=frameScale;
        shader.vertexShader='uniform mat4 puffLens; uniform vec2 puffFrameScale;\n'+shader.vertexShader.replace(
          '#include <project_vertex>',`#include <project_vertex>
          if(puffFrameScale.x>0.0){
            vec4 p=puffLens*modelMatrix*vec4(transformed,1.);
            gl_Position.xy=p.xy*puffFrameScale;
            gl_Position.z*=p.w;gl_Position.w=p.w;
          }`);
        if(mat===white || mat.name==='skin_purin_001'){
          shader.vertexShader='varying vec2 upperMask;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
            upperMask=vec2(0.);
            #ifdef USE_SKINNING
              vec4 curl=step(vec4(7.5),skinIndex)*(1.-step(vec4(10.5),skinIndex));
              vec4 upper=step(vec4(7.5),skinIndex)*(1.-step(vec4(12.5),skinIndex));
              upperMask=vec2(dot(curl,skinWeight),dot(upper,skinWeight));
            #endif`);
          shader.fragmentShader='varying vec2 upperMask;\n'+shader.fragmentShader;
        }
        if(mat===white){
          shader.fragmentShader=shader.fragmentShader.replace(
            '#include <opaque_fragment>','#include <opaque_fragment>\ngl_FragColor.rgb=vec3(1.,step(.48,upperMask.x),upperMask.y);');
        }else if(mat.name==='skin_purin_001'){
          shader.uniforms.puffMask=silhouette;shader.uniforms.puffShadow=shadow;shader.uniforms.puffScreen=screen;
          shader.fragmentShader='uniform sampler2D puffMask;uniform vec2 puffShadow,puffScreen;\n'+shader.fragmentShader.replace(
            '#include <opaque_fragment>',`if(puffShadow.y>0.){
              vec2 uv=.5+(gl_FragCoord.xy/puffScreen-.5)*.66;
              float curl=texture2D(puffMask,uv).g;
              vec2 sampleAt=uv+.66*puffShadow, soft=.66*puffShadow.y*vec2(.035,.047);
              float shade=.40*texture2D(puffMask,sampleAt).g+
                .15*(texture2D(puffMask,sampleAt+soft).g+texture2D(puffMask,sampleAt-soft).g+
                     texture2D(puffMask,sampleAt+vec2(-soft.x,soft.y)).g+texture2D(puffMask,sampleAt+vec2(soft.x,-soft.y)).g);
              shade*=1.-curl;
              outgoingLight*=mix(vec3(1.),vec3(.35,.41,.46),shade);
              float lobe=max(0.,dot(normalize(normal),normalize(vec3(-.22,.81,.54))));
              outgoingLight+=upperMask.y*(.33*pow(lobe,7.)+.88*pow(lobe,29.))*mix(fsTint,vec3(1.),.62)*fsMix;
            }
            #include <opaque_fragment>`);
        }else if(mat.name==='alp_purin_001'){
          // The pink eyelid above the ink line belongs to the same brightly
          // lit skin as the forehead in the close-up.
          shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
            'outgoingLight=mix(outgoingLight,diffuseColor.rgb*.91+vec3(.012,.012,.020),fsMix*smoothstep(.08,.23,diffuseColor.g));\n#include <opaque_fragment>');
        }
      };
      mat.needsUpdate=true;
    }
    // RGB emission from the whole silhouette, the curl/ears and the outward plume.
    // Sampled every eight ticks; the halo follows the live fighter's mask at any position.
    const hazeKeys=[
      [129,0,0,0,0,0,0,0,0,0],[137,32,8,38,475,410,365,0,0,0],
      [145,24,16,3,445,400,456,0,0,0],[153,0,20,0,520,420,500,0,0,0],
      [161,78,76,0,394,436,390,0,0,0],[169,260,264,195,75,72,65,60,106,22],
      [177,365,425,357,20,25,25,64,97,57],[185,300,423,290,300,190,340,31,61,9],
      [193,228,350,345,90,130,220,82,85,78],[201,163,280,383,420,470,500,150,238,179],
      [209,186,250,310,465,400,490,105,134,134],[217,138,221,257,490,490,500,81,60,88],
      [225,175,180,248,480,480,460,28,19,15],[233,161,98,281,380,360,130,62,49,30],
      [241,14,8,76,180,200,190,8,0,5],[249,0,0,0,0,0,0,0,0,0]
    ];
    const saveColor=new T.Color(), uniforms={mask:{value:mask.texture},aspect:{value:16/9},
      tint:{value:new T.Color()},strength:{value:0},phase:{value:0},reach:{value:.075},crown:{value:0},
      hazeBody:{value:new T.Vector3()},hazeCrown:{value:new T.Vector3()},hazeSide:{value:new T.Vector3()},
      hazeScale:{value:0},hazeFace:{value:1}};
    const aura=new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({
      uniforms,transparent:true,depthTest:false,depthWrite:false,blending:T.AdditiveBlending,
      vertexShader:'varying vec2 uvScreen;void main(){uvScreen=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader:`varying vec2 uvScreen;uniform sampler2D mask;uniform vec3 tint;
        uniform float aspect,strength,phase,reach,crown,hazeScale,hazeFace;
        uniform vec3 hazeBody,hazeCrown,hazeSide;
        vec4 maskAt(vec2 uv){return texture2D(mask,.5+(uv-.5)*.66);}
        vec4 diffuseMask(vec2 at,float sigma){
          vec2 stepUV=.66*sigma*1.25*vec2(1./aspect,1.);
          vec2 center=.5+(at-.5)*.66;
          float level=max(0.,log2(sigma*222.));
          vec4 glow=vec4(0.);
          for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++){
            float w=float((i==0?2:1)*(j==0?2:1));
            glow+=w*textureLod(mask,center+stepUV*vec2(float(i),float(j)),level);
          }
          return glow*.0625;
        }
        void main(){
          float inside=maskAt(uvScreen).r;
          if(inside>.99)discard;
          vec2 circle=vec2(1./aspect,1.);float light=0.;
          for(int i=0;i<12;i++){
            float a=float(i)*.523599;vec2 d=vec2(cos(a),sin(a))*circle*reach;
            light+=.42*maskAt(uvScreen+d*.18).r+.30*maskAt(uvScreen+d*.37).r
                  +.19*maskAt(uvScreen+d*.64).r+.09*maskAt(uvScreen+d).r;
          }
          light*=strength*(1.-inside)/12.;
          float pulse=.93+.07*sin(18.*uvScreen.y+9.*uvScreen.x-phase);
          float n=sin(uvScreen.x*103.+phase*1.1+.78*sin(uvScreen.y*51.-phase));
          float crest=.37+.63*pow(abs(n*sin(uvScreen.x*67.-phase*.7)),2.);
          float sparks=0.;
          for(int i=1;i<=4;i++){
            float d=float(i)*.25;
            vec2 ray=vec2((.36*n+.16)*d/aspect,d);
            vec2 sampleAt=uvScreen-ray*reach*crest;
            float blur=.012*d/aspect;
            float upper=.46*maskAt(sampleAt).b+.27*maskAt(sampleAt+vec2(blur,0.)).b+.27*maskAt(sampleAt-vec2(blur,0.)).b;
            sparks+=upper*(1.1-.78*d);
          }
          sparks*=crown*(1.-inside)*.38;
          vec3 emission=mix(tint,vec3(1.),clamp(light*.90+sparks*.75,0.,.98))*min(1.,light*2.35*pulse+sparks);
          if(hazeScale>0.){
            float body=diffuseMask(uvScreen-vec2(0.,.10*hazeScale),.25*hazeScale).r;
            float top=diffuseMask(uvScreen-vec2(0.,.06*hazeScale),.14*hazeScale).b;
            float side=diffuseMask(uvScreen+vec2(.27*hazeFace/aspect,.08)*hazeScale,.105*hazeScale).r;
            emission+=(1.-inside)*(body*hazeBody+top*hazeCrown+side*hazeSide);
          }
          gl_FragColor=vec4(emission,1.);
        }`
    }));aura.visible=false;aura.frustumCulled=false;aura.renderOrder=6;scene.add(aura);
    return (renderer,camera,f,view)=>{
      aura.visible=false;
      frameScale.value.set(0,0);
      shadow.value.set(0,0);
      if(f?.action!=='puffUp')return;
      const w=view.right-view.left,h=view.top-view.bottom,aspect=w/h;
      const recorded=camera.userData.dreamLandLens;
      if(recorded?.final==='puff-up'){
        const p=recorded.projection;
        lens.value.set(p[0],p[1],p[2],p[3],p[4],p[5],p[6],p[7],0,0,0,0,p[8],p[9],p[10],p[11]);
        frameScale.value.set(recorded.width/(camera.right-camera.left), recorded.width*9/(16*(camera.top-camera.bottom)));
      }else{
        const pitch=SmashStage.cameraPitch,distance=SmashStage.cameraDistance(camera);
        lens.value.set(2/w,0,0,-2*camera.position.x/w,0,2/h,-2*pitch/h,-2*camera.position.y/h,0,0,0,0,0,0,-1/distance,1);
        frameScale.value.set(1,1);
      }
      const age=f.actionFrame,grow=f.finalPhase,fade=grow==='end'?Math.min(1,(119-f.finalFrame)/19):1;
      if(fade<=0)return;
      const size=SmashFinalSmash.puffBone(f)[0];
      shadow.value.set(.015*size/w,.13*size/h);
      renderer.getDrawingBufferSize(screen.value);
      // Keep off-screen curls in the light mask, or clipping at the top of
      // the viewport extrudes their cast shadow into a hard rectangle.
      mask.setSize(Math.round(336*aspect),336);
      const prior=renderer.getRenderTarget(),alpha=renderer.getClearAlpha(),layers=camera.layers.mask;
      const background=scene.background,material=scene.overrideMaterial;renderer.getClearColor(saveColor);
      scene.background=null;scene.overrideMaterial=white;camera.layers.set(maskLayer);
      frameScale.value.multiplyScalar(.66);
      renderer.setRenderTarget(mask);renderer.setClearColor(0,0);renderer.render(scene,camera);
      frameScale.value.multiplyScalar(1/.66);
      camera.layers.mask=layers;scene.background=background;scene.overrideMaterial=material;
      renderer.setRenderTarget(prior);renderer.setClearColor(saveColor,alpha);
      const pressure=clamp((age-272)/9)*clamp((314-age)/9);
      uniforms.hazeScale.value=0;
      if(age>129 && age<249){
        const i=Math.floor((age-129)/8),a=hazeKeys[i],b=hazeKeys[i+1],t=(age-a[0])/8;
        const v=k=>(a[k]+(b[k]-a[k])*t)/255;
        uniforms.hazeBody.value.set(v(1),v(2),v(3));
        uniforms.hazeCrown.value.set(v(4),v(5),v(6));
        uniforms.hazeSide.value.set(v(7),v(8),v(9)).multiplyScalar(.58);
        uniforms.hazeScale.value=recorded?recorded.width*9/(16*h):1;
        uniforms.hazeFace.value=f.face;
      }
      uniforms.aspect.value=aspect;uniforms.reach.value=.043+.052*Math.min(1,age/120)+.057*pressure;
      uniforms.strength.value=fade*Math.min(1,age/9)*(grow==='end'?.68:1.18+.80*pressure);
      uniforms.crown.value=fade*clamp((age-30)/26);
      uniforms.tint.value.setHSL(SmashFinalSmash.puffHue(age),.85,.64);
      uniforms.phase.value=age*.13;aura.visible=true;
    };
  }
  // Each pressure pulse starts as a sharp spray and breaks into drifting
  // rings. The 13 transparent tiles isolate only the dust from #18086.
  const pulses=[48,57,68,79,90,101,112,124,136,147,157,168,190,201,213,224];
  let finalDust;
  function drawFinalSmoke(c,f,size){
    const frame=f.actionFrame;
    if(frame<48 || frame>236)return;
    finalDust ??= document.getElementById('puff-up-dust');
    if(!finalDust.complete || !finalDust.naturalWidth)return;
    for(const start of pulses){
      const age=frame-start;
      if(age<0 || age>12)continue;
      const scale=size/266.5;
      for(const side of [-1,1]){
        c.save();c.translate(f.x,f.y);c.scale(side*scale,-scale);
        c.drawImage(finalDust,age%4*324,Math.floor(age/4)*184,324,184,10,-146,324,184);
        c.restore();
      }
    }
  }
  globalThis.SmashPuffFX={draw,event,restContact,createRestBackdrop,createFinalAura,drawFinalSmoke,visualPose};
})();

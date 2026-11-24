// Combat events drive sound and particles at simulation time, independent of display refresh.
(() => {
  'use strict';
  const tau = Math.PI*2;
  const clamp = (v,lo,hi) => Math.min(hi,Math.max(lo,v));
  function audioSystem() {
    let audio, master, hiss, enabled=true;
    function unlock() {
      if(!audio) {
        const Context=window.AudioContext || window.webkitAudioContext;
        if(!Context) return;
        audio=new Context();
        master=audio.createGain(); master.gain.value=enabled?.35:0; master.connect(audio.destination);
        hiss=audio.createBuffer(1,audio.sampleRate*.55,audio.sampleRate);
        const data=hiss.getChannelData(0);
        for(let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
      }
      if(audio.state==='suspended') audio.resume().catch(()=>{});
    }
    function tone(frequency,end,duration,type='sine',gain=.3,delay=0) {
      if(!audio || !enabled || audio.state!=='running') return;
      const at=audio.currentTime+delay, osc=audio.createOscillator(), volume=audio.createGain();
      osc.type=type; osc.frequency.setValueAtTime(frequency,at);
      osc.frequency.exponentialRampToValueAtTime(end,at+duration);
      volume.gain.setValueAtTime(.001,at); volume.gain.exponentialRampToValueAtTime(gain,at+.007);
      volume.gain.exponentialRampToValueAtTime(.001,at+duration);
      osc.connect(volume); volume.connect(master); osc.start(at); osc.stop(at+duration+.015);
    }
    function noise(frequency,end,duration,gain) {
      if(!audio || !enabled || audio.state!=='running') return;
      const at=audio.currentTime, src=audio.createBufferSource(), filter=audio.createBiquadFilter(), envelope=audio.createGain();
      src.buffer=hiss; src.loop=true; filter.type='bandpass'; filter.Q.value=.82;
      filter.frequency.setValueAtTime(frequency,at); filter.frequency.exponentialRampToValueAtTime(end,at+duration);
      envelope.gain.setValueAtTime(gain,at); envelope.gain.exponentialRampToValueAtTime(.001,at+duration);
      src.connect(filter); filter.connect(envelope); envelope.connect(master); src.start(at); src.stop(at+duration);
    }
    function sound(type,event={}) {
      switch(type) {
        case 'select': tone(680,950,.08,'triangle',.21); break;
        case 'count': tone(600,530,.12,'square',.12); break;
        case 'go': [440,554.37,659.25,880].forEach((hz,i)=>tone(hz,hz*1.02,.28,'triangle',.22,i*.035)); break;
        case 'jump': tone(event.air?465:310,event.air?800:660,.13,'sine',.13); break;
        case 'land': noise(620,180,.10,.28); break;
        case 'hit': {
          const heavy=event.strong || event.damage>11; noise(heavy?3000:2050,135,.12+(heavy?.13:0),heavy?1.5:1.05);
          tone(heavy?145:205,46,heavy?.24:.12,'triangle',.8);
          tone(heavy?1200:1750,360,.075,'sawtooth',.10); break;
        }
        case 'swing': noise(900,2800,.085,.16); break;
        case 'stone': noise(1500,100,.31,.84); tone(130,30,.25,'triangle',.8); break;
        case 'parry': tone(1047,2093,.085,'triangle',.36);tone(1568,1047,.28,'sine',.33,.045);break;
        case 'shieldHit': tone(1220,480,.12,'sine',.42); tone(795,580,.13,'triangle',.19); break;
        case 'grab': tone(500,110,.09,'square',.12); break;
        case 'wave': noise(3900,550,.18,.6); break;
        case 'copy': case 'respawn': [660,880,1108].forEach((hz,i)=>tone(hz,hz,.19,'triangle',.3,i*.065)); break;
        case 'sing': [494,587,523,440].forEach((hz,i)=>tone(hz,hz*.99,.27,'sine',.19,i*.18)); break;
        // Synthesized close-camera impact, followed later by the blast KO.
        case 'screenImpact': noise(1080,180,.11,.54);tone(152,48,.15,'triangle',.68);break;
        case 'ko': noise(1400,82,.48,1.15); tone(490,49,.5,'sawtooth',.36); break;
        case 'finalReady': [659,880,1175].forEach((hz,i)=>tone(hz,hz*1.012,.24,'sine',.18,i*.06));break;
        case 'end': [523,659,784,1047].forEach((hz,i)=>tone(hz,hz,.35,'triangle',.37,i*.095)); break;
      }
    }
    return {unlock,sound,pause(){if(audio?.state==='running')audio.suspend().catch(()=>{})},set(on){enabled=on;if(master)master.gain.setTargetAtTime(on?.35:0,audio.currentTime,.025)}};
  }

  // A dark rear hemisphere sits behind the model. The bright rim, hit noise and
  // reflected light sit in front, so an undamaged shield leaves the fighter legible.
  function makeGuardEffects(ctx) {
    const power=[null,null], meshes=[], beams=[], flashes=[{value:0},{value:0}], eyes=[{value:0},{value:0}];
    const colors=['#fb404a','#398afa'], radii=[0,0], styles=new Map();
    let engine,burstMap,shade;
    const envelope=(x,a,b)=>clamp((x-a)/(b-a),0,1);
    function canvas(size) {const c=document.createElement('canvas');c.width=c.height=size;return c;}
    function style(color) {
      if(styles.has(color))return styles.get(color);
      const number=parseInt(color.slice(1),16), rgb=[number>>16,(number>>8)&255,number&255];
      const gray=Math.max(...rgb)-Math.min(...rgb)<25;
      const hue=gray?[112,111,117]:rgb[0]>rgb[2]?[236,39,48]:[41,102,228];
      const textures=[];
      for(let pass=0;pass<5;pass++) {
        const size=pass<2?208:148,c=canvas(size),pen=c.getContext('2d'),pixels=pen.createImageData(size,size);
        for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
          const u=(x+.5-size/2)/(size/2)*1.18,v=(y+.5-size/2)/(size/2)*1.18,d=Math.hypot(u,v),j=(y*size+x)*4;
          if(d>1.17)continue;
          const inside=1-envelope(d,.985,1.01);let alpha,light=0,tint=1;
          if(pass===0) {
            tint=.43+.21*d+.44*Math.pow(Math.max(0,-u+.05),1.2);alpha=(.76+.09*d)*inside;
          } else if(pass===1) {
            const rim=Math.exp(-Math.pow((d-.983)/.033,2));
            const lower=Math.exp(-((u+.50)**2/.18+(v-.72)**2/.10));
            const upper=Math.exp(-((u-.62)**2/.019+(v+.64)**2/.023));
            const halo=Math.exp(-Math.pow((d-.98)/.105,2));
            light=Math.min(1,.95*rim+.32*halo+1.36*lower+1.18*upper);
            alpha=Math.min(1,(.055+.073*d**5)*inside+.87*rim+.38*halo+.86*lower*inside+.77*upper*inside);
          } else {
            if(d>1.01)continue;
            const bx=Math.floor((x+.40*y)/1.8),by=Math.floor((y-.23*x)/1.8), grain=Math.imul(bx+pass*79,1274126177)^Math.imul(by+pass*43,668265263);
            const noise=((Math.imul(grain^(grain>>>13),1274126177)>>>12)&1023)/1023;
            const speck=((Math.imul(x+pass,1193)^Math.imul(y,997))&31)/31;
            light=.155+.465*Math.max(0,(noise-.27)/.73)+.134*speck+.14*d*d;
            tint=gray?.81:1.01;alpha=.97*inside;
          }
          for(let k=0;k<3;k++)pixels.data[j+k]=hue[k]*tint*(1-light)+255*light;
          pixels.data[j+3]=255*alpha;
        }
        pen.putImageData(pixels,0,0);textures.push(c);
      }
      const back=new engine.CanvasTexture(textures[0]);back.colorSpace=engine.SRGBColorSpace;
      const value={back,front:textures[1],noise:textures.slice(2)};styles.set(color,value);return value;
    }
    function attach(T,scene) {
      engine=T;
      const c=canvas(320),p=c.getContext('2d');p.translate(160,160);
      const flare=p.createRadialGradient(0,0,12,0,0,159);
      flare.addColorStop(0,'#e0ffff');flare.addColorStop(.40,'#6ae0fff2');flare.addColorStop(.69,'#009dfaaa');flare.addColorStop(1,'#168dff00');
      p.fillStyle=flare;p.fillRect(-160,-160,320,320);
      for(let layer=0;layer<2;layer++) {
        p.beginPath();
        for(let j=0;j<17;j++) {
          const a=j*tau/17+.10*Math.sin(j*3.2),tip=(96+46*(.5+.5*Math.sin(j*7.2+1.5)))*(layer?.91:1.07);
          const base=65+17*Math.sin(j*3.38),coords=[[a-.15,base],[a-.09,base*1.35],[a-.04,tip*.84],[a,tip],[a+.065,tip*.67],[a+.12,base*1.23]];
          for(const [r,l] of coords)p.lineTo(Math.cos(r)*l,Math.sin(r)*l);
        }
        p.closePath();p.fillStyle=layer?'#fcffff':'#8addff';p.fill();
      }
      burstMap=new T.CanvasTexture(c);burstMap.colorSpace=T.SRGBColorSpace;
      // The frame following the radial burst sends a narrow fan back towards the attacker.
      const fan=document.createElement('canvas');fan.width=512;fan.height=192;
      const ray=fan.getContext('2d');ray.translate(16,150);
      for(const [slope,width] of [[-.02,4],[.06,5],[.145,9],[.235,6],[.32,4]]) {
        for(const [spread,color] of [[2.8,'#427dff70'],[1.7,'#8edaffc9'],[1,'#f6ffff']]) {
          const wide=spread*width;
          ray.fillStyle=color;ray.beginPath();ray.moveTo(-15,1);
          ray.lineTo(512,-slope*512-wide);ray.lineTo(512,-slope*512+wide);ray.closePath();ray.fill();
        }
      }
      const fanMap=new T.CanvasTexture(fan);fanMap.colorSpace=T.SRGBColorSpace;
      shade=new T.Mesh(new T.PlaneGeometry(160,120),new T.MeshBasicMaterial({color:0x070d1a,transparent:true,opacity:.34,depthWrite:false,toneMapped:false}));
      shade.position.z=-2.8;shade.visible=false;shade.renderOrder=-650;scene.add(shade);
      for(const color of [...colors,'#d6d5d9'])style(color);
      for(let i=0;i<2;i++) {
        const material=new T.MeshBasicMaterial({transparent:true,depthWrite:false,toneMapped:false});
        const plane=new T.Mesh(new T.PlaneGeometry(1,1),material);plane.visible=false;plane.renderOrder=-600;scene.add(plane);meshes.push(plane);
        const beam=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:fanMap,transparent:true,depthWrite:false,toneMapped:false,side:T.DoubleSide}));
        beam.visible=false;beam.renderOrder=-599;scene.add(beam);beams.push(beam);
      }
    }
    function bind(models) {
      models.forEach((model,i)=>{
        const materials=new Set();model.group.traverse(o=>{if(o.isMesh && o.material.isMeshStandardMaterial)materials.add(o.material)});
        for(const material of materials) {
          const original=material.onBeforeCompile, signature=material.customProgramCacheKey();
          const face=!!material.map;
          material.customProgramCacheKey=()=>signature+(face?'|parry-eyes':'|parry-light');
          material.onBeforeCompile=function(shader,renderer){
            original.call(this,shader,renderer);shader.uniforms.guardFlash=flashes[i];shader.uniforms.guardEyes=eyes[i];
            shader.fragmentShader='uniform float guardFlash,guardEyes;\n'+shader.fragmentShader.replace('#include <opaque_fragment>',
              `if(guardFlash>0.0){
                 float side=dot(normal,normalize(vec3(.48,.69,.53)));
                 float ink=smoothstep(.15,.19,side)*smoothstep(.10,.41,dot(diffuseColor.rgb,vec3(.21,.72,.07)));
                 vec3 duotone=mix(vec3(.020,.027,.075),vec3(1.,.83,.93),ink);
                 outgoingLight=mix(outgoingLight,guardFlash>1.5?duotone:vec3(.91,.86,1.),guardFlash>1.5?.95:guardFlash);
               }\n`+(face?`if(guardEyes>0.0){
                 float iris=smoothstep(.026,.13,max(diffuseColor.g,diffuseColor.b)-diffuseColor.r);
                 outgoingLight=mix(outgoingLight,vec3(1.35,.92,.07),iris*guardEyes);
               }\n`:'')+'#include <opaque_fragment>');
          };
          material.needsUpdate=true;
        }
      });
    }
    function event(e,m) {
      if(e.type!=='parry' && e.type!=='shieldHit')return;
      const f=m.fighters[e.fighter];
      if(e.type==='shieldHit' && f.action!=='shield')return;
      const dx=e.x-f.x,dy=e.y-f.y-.78,angle=Math.atan2(dy,Math.abs(dx)<.12?-(e.face||1):dx);
      power[f.index]={kind:e.type,frame:m.frame,angle,x:f.x,y:f.y,r:radii[f.index]||SmashSim.guardRadius(f,true)};
    }
    function radius(f,state,age) {
      const r=SmashSim.guardRadius(f,false);
      return state?.kind==='shieldHit' && age<8 ? r+(state.r-r)*(1-envelope(age,3,8)):r;
    }
    function position(show,m) {
      let darkness=0;
      for(const f of m.fighters) {
        const i=f.index,plane=meshes[i],state=power[i],age=state?m.frame-state.frame:99;
        if(!plane)continue;
        const parry=state?.kind==='parry' && age>=0 && age<23;
        const held=f.action==='shield',r=radius(f,state,age);
        if(held)radii[i]=r;
        const wash=.65*envelope(age,10,14)*(1-envelope(age,16,19));
        const invert=age===2 || age===3 || age===7 || age===8;
        flashes[i].value=show && parry ? (invert ? 2 : wash):0;
        eyes[i].value=show && parry ? 1-envelope(age,5,8):0;
        if(show && parry)darkness=Math.max(darkness,.36*(1-envelope(age,0,10)));
        const beam=beams[i];
        beam.visible=show && parry && age>=2 && age<5;
        if(beam.visible) {
          beam.position.set(f.x+f.face*6.60,f.y+1.79,-1.53);beam.scale.set(f.face*13,3.12,1);
          beam.material.opacity=age===2?1:age===3?.78:.31;
        }
        plane.visible=show && (held || parry && age<8);
        if(!plane.visible)continue;
        const side=held?r*2.36:SmashSim.guardRadius(f,true)*(3.38+.14*Math.min(age,5));
        plane.position.set(f.x,f.y+(held?.78:.93),-1.6);plane.scale.set(side,side,1);
        plane.material.map=held?style(colors[i]).back:burstMap;
        plane.material.opacity=held?1:1-envelope(age,3,8);
      }
      if(shade){shade.visible=darkness>0;shade.material.opacity=darkness;}
    }
    function image(c,side,opacity=1) {ctx.save();ctx.globalAlpha=opacity;ctx.drawImage(c,-side/2,-side/2,side,side);ctx.restore();}
    function draw(f,frame,color) {
      const i=f.index,state=power[i],age=state?frame-state.frame:99;
      colors[i]=color;
      if(f.action==='shield') {
        const r=radius(f,state,age),s=style(color),side=r*2.36;
        ctx.save();ctx.translate(f.x,f.y+.78);ctx.scale(1,-1);
        if(state?.kind==='shieldHit' && age>=0 && age<7) image(s.noise[age%3],side,1-envelope(age,3,7));
        image(s.front,side);
        for(const dir of [-1,1])for(let j=0;j<2;j++) {
          const phase=((f.actionFrame+j*9+(dir+1)*3)%25)/25, fade=Math.sin(phase*Math.PI);
          const px=dir*(.61+.56*phase)*r,py=.76-.09*phase,rp=(.07+.105*fade)*r;
          ctx.fillStyle='rgba(255,252,251,'+(.53*fade)+')';ctx.beginPath();
          ctx.ellipse(px,py,rp*1.38,rp*.70,dir*.12,0,tau);ctx.ellipse(px-dir*rp*.55,py-rp*.42,rp*.72,rp*.71,0,0,tau);ctx.fill();
        }
        if(state?.kind==='shieldHit' && age>=0 && age<9) {
          const fade=1-envelope(age,3,9), rr=r*(.17+.018*Math.min(age,6));
          ctx.translate(r*.94*Math.cos(state.angle),-r*.94*Math.sin(state.angle));ctx.rotate(-state.angle);
          ctx.globalAlpha=fade;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,rr*.68,0,tau);ctx.fill();
          ctx.strokeStyle='#a4ffff';ctx.lineWidth=r*.039;ctx.beginPath();ctx.ellipse(.02*r,0,rr*1.43,rr*1.47,.28,.15,5.18);ctx.stroke();
          ctx.strokeStyle='white';ctx.lineWidth=r*.061;ctx.beginPath();ctx.arc(0,0,rr*1.48,1.06,3.89);ctx.stroke();
        }
        ctx.restore();return;
      }
      if(state?.kind!=='parry' || age<0 || age>31)return;
      if(age>=20) {
        const p=(age-20)/11,fade=Math.sin(Math.PI*p);
        ctx.save();ctx.translate(state.x,state.y);
        for(const dir of [-1,1])for(let j=0;j<3;j++){
          const x=dir*(.39+p*.93+j*.13),y=.045+p*.13+Math.sin(j*1.7)*.048,r=(.19-.032*j)*fade;
          if(r<.001)continue;
          ctx.fillStyle='rgba(255,254,251,'+(.81*(1-.52*p))+')';ctx.beginPath();
          ctx.ellipse(x,y,r*1.36,r*.62,dir*.15,0,tau);ctx.ellipse(x+dir*r*.24,y+r*.48,r*.72,r*.76,0,0,tau);ctx.fill();
        }
        ctx.restore();return;
      }
      const r=SmashSim.guardRadius(f,true);ctx.save();ctx.translate(f.x,f.y+.93);ctx.scale(f.face,1);
      if(age<13) {
        const k=1-envelope(age,4,13);
        if(age>=2 && age<7) {
          const ac=.31*r*(1-envelope(age,3,8));ctx.fillStyle='#f8ffff';ctx.beginPath();
          for(let j=0;j<14;j++){const a=j*tau/14,sp=j%2?.33:1;ctx.lineTo(r*.91+Math.cos(a)*ac*sp,.01+Math.sin(a)*ac*sp);}
          ctx.closePath();ctx.fill();
        }
        for(let j=0;j<12;j++) {
          const a=j*tau/12+.15*Math.sin(j*3.2),dist=r*(1.02+.039*age+.35*Math.cos(j*7.9));
          ctx.save();ctx.translate(dist*Math.cos(a),dist*Math.sin(a));ctx.rotate(a);
          ctx.fillStyle='rgba(222,252,255,'+k+')';ctx.beginPath();ctx.ellipse(0,0,.042+.046*Math.sin(j*1.8)**2,.024,0,0,tau);ctx.fill();ctx.restore();
        }
        if(age>2) {
          ctx.globalAlpha=k;ctx.lineWidth=.045;ctx.strokeStyle='#f1ffff';ctx.beginPath();
          ctx.ellipse(0,.01,r*(.72+.035*age),r*.83,.39,.18,2.25);ctx.stroke();ctx.beginPath();
          ctx.ellipse(0,.01,r*.94,r*(.70+.02*age),-.28,3.20,5.98);ctx.stroke();
        }
      }
      if(age>=6 && age<17) {ctx.globalAlpha=.67*(1-envelope(age,7,17));ctx.strokeStyle='#edffff';ctx.lineWidth=.035;ctx.beginPath();ctx.ellipse(0,-.91,r*(.7+.19*(age-6)),.10+.018*(age-6),0,Math.PI*.82,Math.PI*1.95);ctx.stroke();}
      ctx.restore();
    }
    return {attach,bind,position,event,draw,clear(){power.fill(null);radii.fill(0);for(const value of [...flashes,...eyes])value.value=0;for(const s of [...meshes,...beams])s.visible=false;if(shade)shade.visible=false}};
  }

  // 638 × 359 capture of the first Puff Up in #18086. The camera cuts before
  // the fixed off-screen damage boundary is reached. Only the registered
  // replay uses these circle positions; the portrait and radar dots stay live.
  const puffLoupe=[[310,51.5,51.5,25.5],[314,50.5,51,24.5],[322,43.5,44,21],
    [330,38,38,18],[338,34,35,17],[342,33,33.5,16],[346,32.5,35,16],
    [350,33.5,39,16],[354,34.5,48.5,17],[362,39.5,67,19],[370,43.5,87,21],
    [378,48,107.5,23],[383,50.5,121,24],[392,50.5,146.5,24]];
  function replayLoupe(frame){
    if(frame<310 || frame>392)return null;
    const i=puffLoupe.findIndex(row=>row[0]>=frame),b=puffLoupe[i],a=puffLoupe[Math.max(0,i-1)];
    const t=a===b?0:(frame-a[0])/(b[0]-a[0]);
    return [1,2,3].map(k=>a[k]+(b[k]-a[k])*t);
  }
  // The large map tracks the fixed stage bounds. The magnifier instead tracks
  // the live viewport: on a tall display the fighter may still be visible.
  function makeRadar(T,renderer,scene,models,ctx) {
    const camera=new T.OrthographicCamera(-1.95,1.95,1.95,-1.95,.1,100);
    const glass=new T.Mesh(new T.CircleGeometry(1.95,64),new T.MeshBasicMaterial({
      color:0x536883,transparent:true,opacity:.82,depthWrite:false,toneMapped:false
    }));
    glass.layers.set(5);glass.layers.enable(6);scene.add(glass);
    const viewport=new T.Vector4(),scissor=new T.Vector4(),registered=new WeakSet();
    scene.traverse(o=>{if(o.isLight){o.layers.enable(5);o.layers.enable(6);}});
    let corner=0;
    function portrait(f,x,y,r,scale,h) {
      // Reuse the live skinned mesh and its pose. A scissored viewport draws
      // directly into the main framebuffer without a CPU readback or a copy.
      const layer=5+f.index,group=models[f.index].group;
      for(const branch of group.children)if(!registered.has(branch)){
        branch.traverse(o=>o.layers.enable(layer));registered.add(branch);
      }
      camera.layers.set(layer);camera.position.set(f.x,f.y+.76,35);
      glass.position.set(f.x,f.y+.76,-12);
      renderer.getViewport(viewport);renderer.getScissor(scissor);
      const oldTest=renderer.getScissorTest(),clear=renderer.autoClear,background=scene.background;
      const s=scale/renderer.getPixelRatio(),side=2*r*s;
      scene.background=null;renderer.autoClear=false;
      renderer.setViewport((x-r)*s,(h-y-r)*s,side,side);
      renderer.setScissor((x-r)*s,(h-y-r)*s,side,side);renderer.setScissorTest(true);
      renderer.clearDepth();renderer.render(scene,camera);
      renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(oldTest);
      renderer.autoClear=clear;scene.background=background;
    }
    function triangle(x,y,angle,depth,half,color){
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;ctx.beginPath();
      ctx.moveTo(depth,0);ctx.lineTo(0,-half);ctx.lineTo(0,half);ctx.closePath();ctx.fill();ctx.restore();
    }
    return {clear(){corner=0;},draw(m,view,teams,finalFighter){
      const shot=view.registeredRadar;
      const age=shot?(m.frame>=310 && m.frame<443?45:0):Math.max(...m.fighters.map(f=>f.radarFrames));
      if(!age){corner=0;return;}
      const {blast,camera:bounds}=SmashSim.stageBounds;
      const scale=Math.min(ctx.canvas.width/638,ctx.canvas.height/359);
      const w=ctx.canvas.width/scale,h=ctx.canvas.height/scale;
      const fighters=m.fighters.filter(f=>f.action!=='ko' && !f.hidden);
      if(!corner){
        const first=m.fighters.reduce((a,b)=>a.loupeFrames>=b.loupeFrames?a:b);
        corner=shot || first.x<0?-1:1;
      }
      const left=corner<0?13:w-165,top=41,mw=152,mh=87;
      const mapX=x=>left+2+(mw-3)*clamp((x-blast.left)/(blast.right-blast.left),0,1);
      const mapY=y=>top+3+(mh-6)*clamp((blast.top-y)/(blast.top-blast.bottom),0,1);
      ctx.save();ctx.setTransform(scale,0,0,scale,0,0);
      ctx.globalAlpha=shot?clamp(Math.min((m.frame-309.75)/5.7,(443-m.frame)/13),0,1):clamp(age/14,0,1);
      ctx.fillStyle='rgba(8,5,12,.30)';ctx.fillRect(left,top,mw,mh);
      ctx.strokeStyle='rgba(255,249,255,.58)';ctx.lineWidth=.65;
      ctx.strokeRect(left,top,mw,mh);
      ctx.strokeRect(mapX(bounds.left),mapY(bounds.top),mapX(bounds.right)-mapX(bounds.left),mapY(bounds.bottom)-mapY(bounds.top));
      for(const f of fighters){
        const x=mapX(f.x),y=mapY(f.y+.78),fp=teams[f.index].tag==='FP';
        const color=fp?'#a7ffdb':teams[f.index].color;
        ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);
        ctx.fillStyle='rgba(10,8,13,.7)';ctx.fillRect(-1.6,-1.6,3.2,3.2);
        ctx.fillStyle=color;ctx.fillRect(-1.14,-1.14,2.28,2.28);
        ctx.fillStyle=fp?'#fff3a7':'#fff4ee';ctx.fillRect(-1,-1,1.27,2);ctx.restore();
      }
      ctx.globalAlpha=1;
      for(const f of fighters){
        const mark=shot && f.index===0?view.recordedLoupe:null;
        if((shot?!mark:!f.loupeFrames) || f===finalFighter || f.action==='respawn')continue;
        const bodyTop=f.y+(f.kind==='kirby'?1.52:1.65);
        if(!mark && f.x+.78>=view.left && f.x-.78<=view.right && bodyTop>=view.bottom && f.y<=view.top)continue;
        const px=(f.x-view.left)/(view.right-view.left)*w,py=(view.top-f.y-.78)/(view.top-view.bottom)*h;
        const gap=Math.max(0,-px,px-w,-py,py-h);
        const r=mark?mark[2]:clamp(26-gap*.091,15.5,25),pad=2*r;
        const x=mark?mark[0]:clamp(px,pad,w-pad),y=mark?mark[1]:clamp(py,pad,h-pad);
        const dir=Math.atan2(y-h*.5,x-w*.5),fp=teams[f.index].tag==='FP';
        const upper=fp?'#fff78a':teams[f.index].color,lower=fp?'#77ddeb':teams[f.index].color;
        portrait(f,x,y,r,scale,h);
        // The tinted glass also covers the little fighter, as in the source.
        const ink=ctx.createLinearGradient(0,y-r,0,y+r);
        ink.addColorStop(0,'rgba(40,78,82,.08)');ink.addColorStop(1,'rgba(63,104,135,.10)');
        ctx.beginPath();ctx.arc(x,y,r,0,tau);ctx.fillStyle=ink;ctx.fill();
        const rim=ctx.createLinearGradient(0,y-r,0,y+r);rim.addColorStop(0,upper);rim.addColorStop(.75,lower);rim.addColorStop(1,fp?'#afa8f1':'#e5f3ff');
        ctx.strokeStyle=rim;ctx.lineWidth=1.55;ctx.stroke();
        triangle(x+Math.cos(dir)*(r+2),y+Math.sin(dir)*(r+2),dir,r*.71,r*.25,upper);
        const horizontal=!!mark || Math.abs(px-w/2)/w>=Math.abs(py-h/2)/h;
        const returnDir=horizontal?(px<w/2?0:Math.PI):(py<h/2?Math.PI/2:-Math.PI/2);
        for(let i=0;i<3;i++){
          const at=45+i*16;
          const ax=horizontal?(px<w/2?at:w-at):w/2,ay=horizontal?h*.475:(py<h/2?at:h-at);
          triangle(ax,ay,returnDir,12,7,'rgba(248,243,252,'+(.48+i*.18)+')');
        }
      }
      ctx.restore();
    }};
  }
  function makeEffects(canvas) {
    const ctx=canvas.getContext('2d');
    const guard=makeGuardEffects(ctx);
    let radar;
    const particles=[];
    let shake=0;
    const trails=[null,null], trailTeams=[0,0];
    // Top-lit clusters divide into wisps as they age. The atlas keeps that
    // changing silhouette and lighting in a single transparent draw call.
    const tile=72, cloud=document.createElement('canvas');
    cloud.width=cloud.height=tile*4;
    const ink=cloud.getContext('2d'), cloudPixels=ink.createImageData(cloud.width,cloud.height);
    for(let shape=0;shape<4;shape++) {
      const lobes=[{x:0,y:0,r:21}];
      for(let j=0;j<6;j++) {
        const a=j*tau/6+shape*.57, offset=13+3*Math.sin(j*3.7+shape);
        lobes.push({x:Math.cos(a)*offset,y:Math.sin(a)*offset*.74,r:12+3*Math.cos(a*4+shape)});
      }
      for(let age=0;age<4;age++) for(let py=0;py<tile;py++) for(let px=0;px<tile;px++) {
        let depth=-1, coverage=0, light=0;
        for(let j=0;j<lobes.length;j++) {
          const l=lobes[j], radius=l.r*(1-age*(j?.17:.29));
          const dx=px-tile/2-l.x*(1+age*.12), dy=py-tile/2-l.y*(1+age*.17);
          const distance=Math.hypot(dx,dy);
          if(distance>=radius+.7)continue;
          coverage=Math.max(coverage,clamp(radius+.7-distance,0,1));
          const z=Math.sqrt(Math.max(0,radius*radius-distance*distance));
          if(z<=depth)continue;
          depth=z;
          light=(-.36*dx-.80*dy+.42*z)/radius;
        }
        if(!coverage)continue;
        const lit=clamp((light-.25)*4.8+.5,0,1), shade=lit*lit*(3-2*lit);
        const pos=4*((py+age*tile)*cloud.width+px+shape*tile);
        cloudPixels.data.set([255,211+44*shade,220+35*shade,Math.round(255*coverage)],pos);
      }
    }
    ink.putImageData(cloudPixels,0,0);
    let trailMesh, trailAlpha, trailCell, trailTransform, throwBomb;
    const launchJets=[];
    const dashClouds=[];
    let dashPlane;
    const flameMeshes=[],burnLife=[0,0];
    let backKickMesh,kickBrush,lastKickFrame=-1;
    function attachTrails(T,scene) {
      const image=document.createElement('canvas');image.width=640;image.height=832;
      kickBrush=image.getContext('2d');
      const flare=new T.CanvasTexture(image);flare.colorSpace=T.SRGBColorSpace;flare.generateMipmaps=false;flare.minFilter=T.LinearFilter;
      backKickMesh=new T.Mesh(new T.PlaneGeometry(10,13),new T.MeshBasicMaterial({map:flare,transparent:true,depthWrite:false,toneMapped:false,side:T.DoubleSide}));
      backKickMesh.visible=false;backKickMesh.renderOrder=4;scene.add(backKickMesh);
      guard.attach(T,scene);
      const map=new T.CanvasTexture(cloud);map.colorSpace=T.SRGBColorSpace;
      const geo=new T.PlaneGeometry(1,1);
      trailAlpha=new T.InstancedBufferAttribute(new Float32Array(200),1);
      geo.setAttribute('cloudOpacity',trailAlpha);
      trailCell=new T.InstancedBufferAttribute(new Float32Array(600),3);
      geo.setAttribute('cloudCell',trailCell);
      const mat=new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false});
      mat.onBeforeCompile=shader=>{
        shader.vertexShader='attribute float cloudOpacity; attribute vec3 cloudCell; varying float cloudFade; varying float cloudTeam;\n'+shader.vertexShader
          .replace('#include <uv_vertex>','#include <uv_vertex>\nvMapUv=(vMapUv+cloudCell.xy)*.25;')
          .replace('#include <begin_vertex>','#include <begin_vertex>\ncloudFade=cloudOpacity; cloudTeam=cloudCell.z;');
        shader.fragmentShader='varying float cloudFade; varying float cloudTeam;\n'+shader.fragmentShader.replace('#include <map_fragment>',
          '#include <map_fragment>\nfloat shadow=1.-diffuseColor.g; if(cloudTeam>.5) diffuseColor.rgb=vec3(1.)-shadow*(cloudTeam>1.5?vec3(.78,.78,.75):vec3(1.2,.47,0.)); diffuseColor.a*=cloudFade;');
      };
      trailTransform=new T.Object3D();trailMesh=new T.InstancedMesh(geo,mat,200);
      trailMesh.count=0;trailMesh.frustumCulled=false;trailMesh.renderOrder=-1;scene.add(trailMesh);
      const windImage=document.getElementById('launch-wind');
      const dashImage=document.getElementById('dash-smoke');
      // In the registered strip the foot is at (220,145) in a 326×154 cell,
      // with 56 pixels per world unit. Mirror around the foot with the fighter.
      const dashGeo=new T.PlaneGeometry(326/56,154/56).translate(-57/56,68/56,0);
      dashPlane=()=>{
        const map=new T.Texture(dashImage);
        map.colorSpace=T.SRGBColorSpace;map.repeat.set(.25,.25);
        map.generateMipmaps=false;map.minFilter=T.LinearFilter;
        if(dashImage.complete)map.needsUpdate=true;
        else dashImage.addEventListener('load',()=>{map.needsUpdate=true},{once:true});
        const mesh=new T.Mesh(dashGeo,new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false,side:T.DoubleSide}));
        mesh.name='Dash smoke';mesh.visible=false;mesh.renderOrder=-1;scene.add(mesh);
        dashClouds.push(mesh);return mesh;
      };
      const jetPlane=new T.PlaneGeometry(8.8,3.8).translate(-2.7,0,0);
      for(let i=0;i<2;i++) {
        const map=new T.Texture(windImage);
        map.colorSpace=T.SRGBColorSpace;map.repeat.set(.25,.25);
        map.generateMipmaps=false;map.minFilter=T.LinearFilter;
        if(windImage.complete)map.needsUpdate=true;
        else windImage.addEventListener('load',()=>{map.needsUpdate=true},{once:true});
        const jet=new T.Mesh(jetPlane,new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false,side:T.DoubleSide}));
        jet.visible=false;scene.add(jet);launchJets.push(jet);
      }
      const fireImage=document.getElementById('throw-fire');
      if(fireImage) {
        const fire=new T.Texture(fireImage);fire.colorSpace=T.SRGBColorSpace;
        fire.repeat.set(1/6,1/4);fire.generateMipmaps=false;fire.minFilter=T.LinearFilter;
        if(fireImage.complete)fire.needsUpdate=true;
        else fireImage.addEventListener('load',()=>{fire.needsUpdate=true},{once:true});
        const material=new T.MeshBasicMaterial({map:fire,transparent:true,depthWrite:false,toneMapped:false});
        throwBomb=new T.Mesh(new T.PlaneGeometry(4.92,4.48),material);
        throwBomb.visible=false;throwBomb.renderOrder=-2;scene.add(throwBomb);
      }
      // Kirby burns behind his leading foot. The fire on the fighter he
      // hits follows that fighter independently as the pink launch trail grows.
      for(let i=0;i<2;i++) {
        const material=new T.ShaderMaterial({
          transparent:true,depthWrite:false,side:T.DoubleSide,
          uniforms:{clock:{value:0},strength:{value:1}},
          vertexShader:`varying vec2 vUV;
            void main(){vUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
          fragmentShader:`varying vec2 vUV;uniform float clock,strength;
            float hash(vec2 p){return fract(sin(dot(p,vec2(41.17,79.63)))*43758.5);}
            float noise(vec2 p){
              vec2 c=floor(p),f=fract(p);f=f*f*(3.-2.*f);
              return mix(mix(hash(c),hash(c+vec2(1,0)),f.x),mix(hash(c+vec2(0,1)),hash(c+1.),f.x),f.y);
            }
            void main(){
              vec2 p=vec2((vUV.x-.50)*2.,vUV.y);
              float y=p.y, t=clock;
              float wave=noise(vec2(p.x*3.4+t*.45,y*3.-t*2.1))-.5;
              p.x+=wave*(.20+.43*y)+.09*sin(y*11.-t*4.);
              float eddy=noise(p*vec2(5.,3.7)-vec2(.15*t,2.6*t));
              float detail=noise(p*vec2(13.,8.)-vec2(.4*t,4.1*t));
              float edge=.74-.73*y-abs(p.x)+(.52*eddy+.25*detail-.29)*(.55+1.3*y);
              float base=smoothstep(.015,.20,y), crown=1.-smoothstep(.84,1.,y);
              float opacity=(smoothstep(-.055,.05,edge)*.91+.08*smoothstep(-.19,-.04,edge))*base*crown*strength;
              if(opacity<.015)discard;
              float heat=edge+(detail-.5)*.13-.11*y;
              vec3 fire=mix(vec3(.42,.036,.014),vec3(1.,.19,.012),smoothstep(-.02,.065,heat));
              fire=mix(fire,vec3(1.,.64,.035),smoothstep(.06,.16,heat));
              fire=mix(fire,vec3(1.,.96,.56),smoothstep(.14,.29,heat));
              fire=mix(fire,vec3(1.,.995,.94),smoothstep(.27,.42,heat));
              gl_FragColor=vec4(fire,opacity);
            }`
        });
        const flame=new T.Mesh(new T.PlaneGeometry(1,1),material);
        flame.visible=false;flame.renderOrder=-1;scene.add(flame);flameMeshes.push(flame);
      }
    }
    function positionTrails(visible,m) {
      guard.position(visible,m);
      trailMesh.visible=visible;
      for(const jet of launchJets)jet.visible=false;
      const kick=visible && particles.find(p=>p.type==='backKick');
      backKickMesh.visible=!!kick;
      if(kick) {
        const frame=kick.ttl-kick.life;
        if(frame!==lastKickFrame){
          kickBrush.setTransform(1,0,0,1,0,0);kickBrush.clearRect(0,0,640,832);
          kickBrush.save();kickBrush.setTransform(64,0,0,-64,320,512);backKickFlash(kick,kickBrush);kickBrush.restore();
          backKickMesh.material.map.needsUpdate=true;lastKickFrame=frame;
        }
        backKickMesh.scale.x=kick.face;
        // The violet satellite locates the origin of this contact burst within the kick.
        backKickMesh.position.set(kick.x+.28*kick.face,kick.y-.13+1.5,.78);
      }
      if(throwBomb)throwBomb.visible=false;
      for(const cloud of dashClouds)cloud.visible=false;
      for(const f of m.fighters){
        const dash=f.kind==='kirby' && f.action==='dashAttack' && f.actionFrame>=8 && f.actionFrame<=37;
        const flame=flameMeshes[f.index];
        flame.visible=visible && (dash || burnLife[f.index]>0) && f.action!=='ko';
        if(!flame.visible) continue;
        const life=dash?clamp(Math.min((f.actionFrame-7)/3,(38-f.actionFrame)/7),0,1):Math.min(1,burnLife[f.index]/10);
        flame.material.uniforms.strength.value=life;
        flame.material.uniforms.clock.value=(m.frame+f.index*73)/60;
        flame.position.set(f.x-(dash?f.face*.76:0),f.y+(dash?.96:1.15),-.76);
        flame.scale.set(dash?2.26:2.37,dash?3.30:2.98,1);
        flame.rotation.z=dash?f.face*1.06:Math.sin(m.frame*.09)*.15;
      }
      if(!visible)return;
      let index=0,dashIndex=0;
      for(const p of particles) {
        if(p.type==='dashSmoke') {
          const frame=p.cell;
          if(frame<0)continue;
          const cloud=dashClouds[dashIndex++] || dashPlane();
          cloud.material.map.offset.set((frame%4)*.25,(3-Math.floor(frame/4))*.25);
          cloud.position.set(p.x,p.y,-.09);cloud.scale.x=p.face;cloud.visible=true;
        }
        if(p.type==='launchWind') {
          const frame=p.ttl-p.life-1;
          if(frame>=0 && frame<16) {
            const jet=launchJets[p.fighter], f=m.fighters[p.fighter];
            jet.material.map.offset.set((frame%4)*.25,(3-Math.floor(frame/4))*.25);
            jet.position.set(f.x,f.y+.66,-.82);
            jet.rotation.z=p.angle;
            jet.scale.y=Math.cos(p.angle)<0?-1:1;
            jet.visible=true;
          }
        }
        if(p.type==='throwBomb' && throwBomb) {
          const frame=p.ttl-p.life;
          throwBomb.material.map.offset.set((frame%6)/6,(3-Math.floor(frame/6))/4);
          throwBomb.position.set(p.x,p.y+2.16,-1.03);throwBomb.visible=true;
        }
        if((p.type!=='trail' && p.type!=='swordTrail') || index>=200)continue;
        const age=1-p.life/p.ttl, sword=p.type==='swordTrail';
        const size=p.size*(sword
          ? (.41+.59*Math.min(1,(p.ttl-p.life)/4))*Math.min(1,p.life/10)
          : 1.58+2.32*Math.min(1,age/.14)+.25*age);
        trailTransform.position.set(p.x,p.y,-1.85);trailTransform.scale.set(size*p.width,size,1);
        trailTransform.rotation.z=p.angle;trailTransform.updateMatrix();
        trailMesh.setMatrixAt(index,trailTransform.matrix);
        trailAlpha.setX(index,Math.min(1,p.life/(sword?5:11)));
        trailCell.setXYZ(index,p.shape,3-(sword?Math.min(2,Math.floor(age*2.8)):Math.min(3,Math.floor(Math.pow(age,1.55)*4))),p.team);
        index++;
      }
      trailMesh.count=index;trailMesh.instanceMatrix.needsUpdate=true;trailAlpha.needsUpdate=true;trailCell.needsUpdate=true;
    }
    const random=(lo,hi)=>lo+Math.random()*(hi-lo);
    function puff(x,y,vx,vy,size,tint='245,246,250',ttl=22) {
      particles.push({type:'puff',x,y,vx,vy,size,tint,ttl,life:ttl,angle:random(0,tau)});
    }
    function star(x,y,vx,vy,size,color,ttl=16) {
      particles.push({type:'star',x,y,vx,vy,size,color,ttl,life:ttl,angle:random(0,tau)});
    }
    function ring(x,y,color,size,ttl,flat=1) {particles.push({type:'ring',x,y,color,size,ttl,life:ttl,flat,vx:0,vy:0})}
    function landingBurst(x,y,age=0,star=false) {
      particles.push({type:'landingBurst',x,y,vx:0,vy:0,ttl:18,life:18-age,star});
    }
    function burst(e,backKick) {
      const sharp=e.strong || e.damage>12, attackAngle=e.angle*Math.PI/180;
      const dir=Math.atan2(Math.sin(attackAngle),Math.cos(attackAngle)*e.face);
      const size=clamp(.86+e.damage*.061,.85,2.3);
      const duration=backKick?19:sharp?15:11;
      particles.push({type:backKick?'backKick':'flash',x:e.x,y:e.y,size,angle:dir,
        ttl:duration,life:duration,vx:0,vy:0,sharp,face:e.face,wash:e.kb>=160});
      const sparkCount=backKick?0:sharp?16:9;
      for(let i=0;i<sparkCount;i++) {
        const a=dir+random(-2.7,2.7), v=random(.06,.23)*size;
        particles.push({type:'spark',x:e.x,y:e.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,size:random(.08,.25),color:['#fff7ad','#ffba22','#fff','#76faff'][i%4],ttl:14,life:random(8,14)});
      }
      shake=Math.max(shake,sharp?.17:.06);
    }
    function event(e,match,teams) {
      const f=match.fighters[e.fighter];
      SmashPuffFX.event(e,match);
      if(e.type==='hit') {
        if(f?.kind==='kirby' && e.move==='throwU') {
          star(e.x,e.y,0,.015,.53,'#fffdeb',8);
          ring(e.x,e.y,'#c8f6ff',.89,8);
        } else if(e.move!=='swallow' && e.move!=='spit') burst(e,f?.kind==='kirby' && e.move==='bair' && e.strong && f.actionFrame<=8);
        const target=match.fighters[e.target];
        if(target) {
          trails[e.target]={x:target.x,y:target.y+.74,gap:0,travel:0,swordFinish:e.move==='ultraSword' && e.kb>0,
            backKick:f?.kind==='kirby' && e.move==='bair' && f.actionFrame<=8 && e.strong};
          trailTeams[e.target]=teams?.[e.fighter]?.theme==='cpu'?2:teams?.[e.fighter]?.theme==='blue'?1:0;
        }
        if(f?.kind==='kirby' && (e.move==='dashAttack'||e.move==='hammer' && f.charge>=105)) burnLife[e.target]=34;
      }
      if(e.type==='dash')particles.push({type:'dashSmoke',x:e.x,y:e.y,fighter:f.index,face:f.face,born:f.motionTicks,cell:-1,nextCell:0});
      if(['land','stone','jump'].includes(e.type)) {
        if(e.type==='jump' && e.air) ring(e.x,e.y,'#ffffff',.9,15,.26);
        else if(e.type==='land' && f?.kind==='kirby' && f.action==='land') landingBurst(e.x,e.y);
        else for(let i=0;i<(e.type==='stone'?14:6);i++) {
          const dir=i%2?-1:1; puff(e.x+dir*random(.04,.43),e.y+random(.03,.19),dir*random(.025,.12),random(.012,.08),random(.13,.35));
        }
      }
      guard.event(e,match);
      if(e.type==='fastFall')particles.push({type:'fallGlint',x:e.x,y:e.y,vx:0,vy:0,life:6,ttl:6});
      if(e.type==='copy' || e.type==='respawn' || e.type==='spit') {
        for(let i=0;i<9;i++) {const a=i*tau/9;star(e.x,e.y,Math.cos(a)*.10,Math.sin(a)*.10,.17,'#fff699',24)}
      }
      if(e.type==='loseCopy') {
        const unit=10/77.2737;
        particles.push({type:'abilityStar',x:e.x,y:e.y,vx:-e.face*.67*unit,vy:2.67*unit,
          size:.33,ttl:50,life:50,angle:.12});
      }
      if(e.type==='ko')shake=.38;
      if(e.type==='throwSlam') {
        particles.push({type:'throwBomb',x:e.x,y:e.y,vx:0,vy:0,life:24,ttl:24});
        for(const dir of [-1,1]) {
          puff(e.x+dir*.43,e.y+.10,dir*.13,.022,.32,'244,235,223',16);
          puff(e.x+dir*.75,e.y+.06,dir*.17,.015,.22,'244,235,223',13);
        }
        shake=Math.max(shake,.23);
      }
      if(f && e.type==='grab' && e.move!=='inhale') {
        const target=match.fighters[e.target];
        particles.push({type:'grabFlare',x:f.x+(target.x-f.x)*.65,y:f.y+.99,
          holder:f,target,face:f.face,vx:0,vy:0,life:10,ttl:10});
      }
    }
    function tick(m) {
      burnLife[0]=Math.max(0,burnLife[0]-1);burnLife[1]=Math.max(0,burnLife[1]-1);
      for(let i=particles.length-1;i>=0;i--) {
        const p=particles[i];
        if(p.type==='dashSmoke'){
          // ACMD emits on dash F3; the first visible plume follows a frame
          // later. During Puff Up the next cell then arrives every seven ticks.
          p.cell=p.nextCell;
          p.nextCell=m.fighters[p.fighter].motionTicks-p.born;
          if(p.cell>=16)particles.splice(i,1);
          continue;
        }
        if(--p.life<=0) {particles.splice(i,1);continue}
        p.x+=p.vx; p.y+=p.vy;
        if(p.type==='launchWind'){
          const f=m.fighters[p.fighter],dx=f.x-p.x,dy=f.y+.66-p.y;
          if(Math.hypot(dx,dy)>.04)p.angle=Math.atan2(dy,dx);
          p.x=f.x;p.y=f.y+.66;
        }
        else if(p.type==='swordTrail'){p.vx*=.934;p.vy*=.934;}
        else if(p.type==='trail' && p.drifting){p.vx*=.966;p.vy*=.966;}
        else if(p.type==='puff') {p.vx*=.945;p.vy*=.96}
        else if(p.type==='spark' || p.type==='star') p.vy-=.004;
        else if(p.type==='ember') {p.vx*=.96;p.vy+=.003}
        else if(p.type==='abilityStar') p.vy=Math.max(-3*10/77.2737,p.vy-.10*10/77.2737);
      }
      shake*=.83;
      for(const f of m.fighters) {
        const dashing=f.kind==='kirby' && f.action==='dashAttack' && f.actionFrame>=8 && f.actionFrame<=34;
        if((dashing || burnLife[f.index]>4) && m.frame%2===0) {
          const edge=random(-1,1),dir=dashing?-f.face:edge;
          particles.push({type:'ember',x:f.x+(dashing?dir*.66:edge*.6),y:f.y+.53+random(0,.75),
            size:random(.06,.19),vx:dir*random(.045,.13),vy:random(.025,.11),angle:random(-1.4,1.4),ttl:14,life:14});
        }
        const trailThreshold=trails[f.index]?.swordFinish ? .16 : .34;
        if(f.action==='stun' && !f.hitlag && Math.hypot(f.kx,f.ky)>trailThreshold) {
          const previous=trails[f.index] || {x:f.x-f.kx,y:f.y+.74-f.ky,gap:0};
          const dx=f.x-previous.x,dy=f.y+.74-previous.y, distance=Math.hypot(dx,dy);
          if(previous.backKick && !previous.wind && distance>.5){
            particles.push({type:'launchWind',fighter:f.index,x:f.x,y:f.y+.66,angle:Math.atan2(dy,dx),vx:0,vy:0,life:17,ttl:17});
            previous.wind=true;
          }
          let gap=previous.gap;
          while(gap<distance) {
            if(previous.swordFinish) {
              // The paired strands spread backward with the initial launch. As
              // the defender slows, new wisps stay close together at the head.
              const along=previous.travel+gap, ratio=gap/distance;
              const x=previous.x+dx*ratio, y=previous.y+dy*ratio, face=Math.sign(dx)||1;
              const size=1.35*(.72+.28*Math.min(1,distance/.9))*(.91+.13*Math.sin(along*3.3));
              for(const side of [-1,1]) {
                const bend=(.054+side*(.030+.026*Math.sin(along*.61+side*.9)))*face;
                particles.push({type:'swordTrail',x,y,vx:-.192*dx-bend*dy,vy:-.192*dy+bend*dx,
                  size,width:2.4+.22*Math.sin(along*2.9+side),ttl:51,life:51,shape:(Math.floor(along/.81)+(side+1))%4,team:2,angle:Math.atan2(dy,dx)});
              }
              gap+=.81+.15*Math.sin(along*1.7);
              continue;
            }
            const z=gap/distance, size=clamp(.78+Math.hypot(f.kx,f.ky)*.65,.88,1.42)*(.97+.19*Math.sin(m.frame*.55))*(previous.backKick?.48:1);
            // The expanding wake pushes the earliest puffs back toward the
            // hit. Slower, later emissions sit close to the fighter again.
            const wind=previous.backKick?.40*clamp((distance-.29)/.63,0,1):0;
            particles.push({type:'trail',x:previous.x+dx*z+random(-.14,.14),y:previous.y+dy*z+random(-.19,.19),
              vx:random(-.019,.019)-wind*dx/distance,vy:random(.003,.032)-wind*dy/distance,drifting:!!wind,
              size,width:random(.87,1.16)+(wind?.23:0),ttl:31,life:31,shape:Math.floor(random(0,4)),team:trailTeams[f.index],
              angle:random(-.28,.28)+(wind?Math.atan2(dy,dx):0)});
            gap+=previous.backKick?.46:.57;
          }
          previous.x=f.x;previous.y=f.y+.74;previous.gap=gap-distance;
          if(previous.swordFinish)previous.travel+=distance;
          trails[f.index]=previous;
        } else if(f.action!=='stun')trails[f.index]=null;
        if(f.action==='rapidJab' && f.actionFrame>=5 && (f.actionFrame-5)%4===0 && !f.hitlag)
          puff(f.x-f.face*.50,f.y+.08,-f.face*.09,.04,.18);
        if(f.action==='rapidEnd' && f.actionFrame===3 && !f.hitlag)
          puff(f.x+f.face*.65,f.y+.07,-f.face*.09,.07,.30);
        if((f.action==='run' || f.action==='hammer'&&f.charge>8) && f.grounded && m.frame%7===0)
          puff(f.x-f.face*.35,f.y+.1,-f.face*.053,.035,.22);
      }
    }
    function polygon(vertices,color,brush=ctx) {
      brush.fillStyle=color;brush.beginPath();vertices.forEach(([x,y],i)=>i?brush.lineTo(x,y):brush.moveTo(x,y));brush.closePath();brush.fill();
    }
    function glint(x,y,r,color,brush=ctx) {
      brush.save();brush.translate(x,y);polygon([[0,r],[r*.17,r*.16],[r*.76,0],[r*.15,-r*.14],[0,-r],[-r*.17,-r*.14],[-r*.76,0],[-r*.15,r*.16]],color,brush);brush.restore();
    }
    function backKickFlash(p,ctx) {
      const frame=p.ttl-p.life;
      if(frame>=13) {
        // The red contact ring has already collapsed. Its two small clouds
        // separate around the contact point while the defender leaves.
        const tile=frame-12, image=document.getElementById('back-air-wisps');
        const size=480/46;
        ctx.save();ctx.scale(1,-1);
        ctx.drawImage(image,(tile%4)*480,Math.floor(tile/4)*480,480,480,-size*.5,-size*.57,size,size);
        ctx.restore();return;
      }
      const fill=(vertices,color)=>polygon(vertices,color,ctx);
      const sparkle=(x,y,r,color)=>glint(x,y,r,color,ctx);
      // The first white flare points up-right. The next two stretch along
      // the other diagonal, then the short four-point core returns.
      if(frame<=5) {
        const up=[[1.83,2.15],[.47,.10],[.83,-.68],[.13,-.40],[-1.56,-2.10],[-.31,-.14],[-.51,.48],[-.10,.27],[.22,.72],[.30,.40]];
        const across=[[-2.55,2.15],[-.28,.55],[-.58,1.22],[-.05,.71],[.12,1.06],[.22,.50],[.66,.78],[.44,.17],[2.19,-1.87],[.25,-.59],[-.19,-.56],[-.91,-1.30],[-.46,-.35],[-.45,.17]];
        const points=frame===1 || frame===2?across:up;
        ctx.save();
        if(frame===2)ctx.scale(1.22,1.22);
        if(frame===3)ctx.scale(.68,.68);
        if(frame===5)ctx.scale(.54,.54);
        ctx.shadowBlur=10;ctx.shadowColor='#f82428';fill(points,'#dd2841');
        ctx.shadowBlur=2;ctx.scale(.89,.89);fill(points,'#fffdfb');ctx.restore();
        if(frame<=2){
          const streak=ctx.createLinearGradient(-1.84,0,-.02,0);
          streak.addColorStop(0,'#e0faff00');streak.addColorStop(.47,'#c7f4ffdc');streak.addColorStop(.84,'white');
          fill([[-1.9,.24],[-.84,.48],[-.43,.47],[-.69,.60],[-.02,.42],[-.25,.29],[-.74,.21]],streak);
        }
        if(frame<3){
          ctx.save();ctx.translate(.20,-.68);ctx.globalAlpha=1-frame*.26;
          const halo=ctx.createRadialGradient(0,0,0,0,0,.52);halo.addColorStop(0,'#fff4ff');halo.addColorStop(.32,'#ff9bff');halo.addColorStop(1,'#cf38fa00');
          ctx.fillStyle=halo;ctx.fillRect(-.52,-.52,1.04,1.04);
          sparkle(0,0,.47,'#fff3ff');ctx.rotate(.76);sparkle(0,0,.34,'#ffc1ff');ctx.restore();
        }
      }
      if(frame>=3 && frame<15) {
        const open=clamp((frame-1)/3,0,1),fall=clamp((15-frame)/5,0,1);
        ctx.save();ctx.globalAlpha=Math.min(open+.25,fall*1.6,1);
        const twist=clamp((frame-6)/3,0,1);
        const rays=[[1.52,3.75,1.14],[-2.96+.70*twist,4.15,.64],[.05,3.25,.51],[-1.68+.55*twist,2.18,.53]];
        const sampled=SmashKirbyFX.backKickGold[frame-3];
        if(sampled){
          ctx.save();ctx.globalAlpha=1;ctx.fillStyle='#fff8a3';ctx.shadowColor='#ff9a48';ctx.shadowBlur=12;
          ctx.fill(sampled);ctx.strokeStyle='#ffb364';ctx.lineWidth=.024;ctx.stroke(sampled);ctx.restore();
        }
        for(const [angle,length,spread] of rays.slice(sampled?(frame<=7?3:1):0)) {
          ctx.save();ctx.rotate(angle);ctx.translate(frame>8?(frame-8)*.15:0,0);
          const recede=angle>1.5?clamp((8-frame)/2,.03,1):clamp((15-frame)/3,.12,1);
          ctx.scale(length*open*recede,spread*(.5+.5*fall));
          const ray=[[.02,0],[.31,.49],[.47,.38],[.40,.80],[.67,.35],[.63,.75],[1,.45],[.78,.04],[.93,-.15],[.63,-.27],[.73,-.62],[.42,-.27],[.36,-.52],[.26,-.24]];
          ctx.shadowColor='#ff883e';ctx.shadowBlur=12;fill(ray,'#ff9854');
          ctx.shadowBlur=0;ctx.scale(.989,.95);fill(ray,'#fff8a0');ctx.restore();
        }
        if(frame>=5 && frame<=8) {
          ctx.save();ctx.rotate(-.58);
          const glow=ctx.createRadialGradient(0,0,.05,0,0,1.0);
          glow.addColorStop(0,'#fff');glow.addColorStop(.30,'#e0fcff');glow.addColorStop(.56,'#6fceffaa');glow.addColorStop(1,'#4e79ff00');
          ctx.fillStyle=glow;ctx.fillRect(-1,-1,2,2);
          ctx.shadowBlur=9;ctx.shadowColor='#54aaff';sparkle(0,0,.95,'#82cbff');
          ctx.shadowColor='#ccfaff';sparkle(0,0,.89,'#e1fcff');sparkle(0,0,.79,'white');ctx.restore();
        }
        if(frame>=6 && frame<=13) {
          // Light runs through the struck fighter before separating into thin streaks.
          const reach=1.9+(frame-6)*.48, thickness=frame===7?.50:frame===8?.38:.13;
          const beam=ctx.createLinearGradient(.12,0,reach+1.4,0);
          beam.addColorStop(0,'#e7fcffdd');beam.addColorStop(.56,'#fbffff');beam.addColorStop(1,'#b2dcff00');
          ctx.shadowColor='#74bfff';ctx.shadowBlur=6;
          fill([[.05,-.03],[reach*.55,thickness*.46],[reach+1.4,thickness*.65],[reach+1.2,-thickness],[reach*.57,-thickness*.3]],beam);
          for(const [height,rise,offset] of [[.23,.16,.8],[-.18,-.18,1.1],[.01,.48,.6]]) {
            const x=offset+(frame-6)*.15;
            fill([[x,height],[x+.37,height+rise*.40+.045],[x+1.13,height+rise],[x+.31,height+rise*.31-.034]],'#ecffff');
          }
          ctx.shadowBlur=0;
          if(frame>=9) {
            ctx.shadowBlur=12;ctx.shadowColor='#ffe650';sparkle(-.12,.03,.58,'#ffffaa');
            ctx.save();ctx.translate(-.12,.03);ctx.scale(2.1,.85);sparkle(0,0,.50,'#ffffef');ctx.restore();
          }
        }
        ctx.restore();
      }
      if(frame>=4 && (frame<6 || frame>=8)) {
        const t=(frame-4)/14,angle=.80+t*.16;
        ctx.save();ctx.rotate(angle);ctx.globalAlpha=Math.min(1,(1-t)*2.9);
        ctx.strokeStyle=frame<6?'#f04e5a':'#fff';ctx.lineWidth=(frame<6?.18:.10)*(1-.65*t);
        ctx.beginPath();ctx.ellipse(0,0,1+.79*t,.92*(1-t)+.30,0,.22+t,4.78+t);ctx.stroke();
        if(frame<6){ctx.lineWidth=.115;ctx.strokeStyle='#fff';ctx.stroke();}
        ctx.strokeStyle='#a6efff';ctx.lineWidth=.032;ctx.beginPath();ctx.ellipse(0,-.06,1.22+.78*t,.98*(1-t)+.30,0,2.95,5.69);ctx.stroke();
        if(frame>=8 && frame<14){
          ctx.fillStyle='#fffffc';ctx.beginPath();ctx.moveTo(-1.12,-.39);
          ctx.bezierCurveTo(-.72,-.99,.72,-1.06,1.72,-.20);
          ctx.bezierCurveTo(.91,-.73,-.66,-.83,-1.12,-.39);ctx.fill();
        }
        ctx.restore();
        for(const [dx,dy] of [[1.65,.13],[-.41,1.73],[.77,1.36],[-1.35,-.17]]) {
          const reach=.8+t*2;
          fill([[dx*reach,dy*reach],[dx*(reach+.38)-.035,dy*(reach+.38)+.05],[dx*(reach+.95),dy*(reach+.95)],[dx*(reach+.40)+.022,dy*(reach+.40)-.035]],'#d8faff');
        }
      }
      if(frame>=12 && frame<=17) {
        const t=(frame-12)/6;
        for(const [dx,dy,r] of [[-.12,.34,.23],[.05,.60,.29],[.24,.79,.25],[.19,1.02,.20],[-.28,.11,.15],[-.30,-.14,.13]]) {
          ctx.fillStyle='#fffefa';ctx.globalAlpha=1-t*.35;ctx.beginPath();
          ctx.arc(dx*(1+t),dy*(1+t*.36),r*(1+t*.4),0,tau);ctx.fill();
        }
      }
    }
    function drawParticle(p) {
      if(p.type==='trail' || p.type==='swordTrail' || p.type==='throwBomb' || p.type==='backKick' || p.type==='launchWind' || p.type==='dashSmoke')return;
      const a=1-p.life/p.ttl;
      ctx.save();ctx.translate(p.x,p.y);
      if(p.type==='landingBurst'){
        const n=p.ttl-p.life, out=clamp(n/7,0,1);
        if(n<9){
          ctx.save();ctx.globalAlpha=clamp((10-n)/4,0,1);
          for(const side of [-1,1]) {
            ctx.save();ctx.scale(side,1);ctx.translate(out*.43,0);
            ctx.shadowBlur=3;ctx.shadowColor='#fff';ctx.fillStyle='#fffffb';
            ctx.beginPath();ctx.moveTo(.03,.11);ctx.quadraticCurveTo(.57,.24,.68,.64);
            ctx.lineTo(.68,1.23-out*.48);ctx.lineTo(.85,.85-out*.28);ctx.lineTo(1.02,1.39-out*.69);
            ctx.quadraticCurveTo(1.04,.79,1.21,.71);ctx.lineTo(1.53,.97-out*.21);ctx.lineTo(1.28,.50);
            ctx.quadraticCurveTo(1.13,.09,.78,.03);ctx.quadraticCurveTo(.39,-.02,.03,.11);ctx.fill();ctx.restore();
          }
          ctx.restore();
        }
        if(n>=3 && n<12) {
          ctx.fillStyle='#fffffc';ctx.globalAlpha=clamp((12-n)/3,0,1);
          for(const side of [-1,1])for(const [dx,dy,r] of [[.78,.17,.20],[.96,.24,.24],[1.13,.14,.21],[1.17,.36,.14]]) {
            ctx.beginPath();ctx.arc(side*(dx+n*.065),dy+.012*n,r*(.5+.07*n),0,tau);ctx.fill();
          }
        }
        if(p.star) {
          ctx.save();ctx.globalAlpha=clamp((17-n)/5,0,1);ctx.translate(.03+n*.012,.45+n*.095);ctx.rotate(n*.08);
          ctx.shadowBlur=7;ctx.shadowColor='#fff59b';ctx.fillStyle='#fff29a';
          ctx.beginPath();for(let i=0;i<10;i++){const θ=Math.PI/2+i*Math.PI/5,r=i%2?.15:.25;ctx.lineTo(Math.cos(θ)*r,Math.sin(θ)*r)}ctx.closePath();ctx.fill();ctx.restore();
        }
      } else if(p.type==='fallGlint'){
        const r=[.18,.45,.55,.38,.22,.08][p.ttl-p.life];
        glint(0,0,r,'#d97bff');glint(0,0,r*.83,'white');ctx.rotate(.76);glint(0,0,r*.59,'#fff5ff');
      } else if(p.type==='abilityStar') {
        ctx.rotate(p.angle+a*4.1);ctx.globalAlpha=Math.min(1,p.life/8);
        ctx.fillStyle='#fff39a';ctx.beginPath();
        for(let i=0;i<10;i++){
          const angle=Math.PI/2+i*Math.PI/5,r=p.size*(i%2?.48:1);
          const x=Math.cos(angle)*r,y=Math.sin(angle)*r;
          if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
        }
        ctx.closePath();ctx.fill();ctx.lineWidth=.035;ctx.strokeStyle='#ffffda';ctx.stroke();
      } else if(p.type==='puff') {
        ctx.globalAlpha=Math.min(1,p.life/9)*.84;const r=p.size*(.5+a*1.5);
        ctx.rotate(p.angle);
        const jet=p.tint==='255,185,208';
        const g=ctx.createRadialGradient(-r*.15,r*.19,0,0,0,1.12*r);
        g.addColorStop(0,jet?'#fffaff':'#fff');g.addColorStop(.53,jet?'#ffe2ed':'#fbfdff');
        g.addColorStop(1,'rgba('+p.tint+','+(jet?'.92':'.77')+')');ctx.fillStyle=g;
        ctx.beginPath();ctx.arc(-r*.37,0,r*.72,0,tau);ctx.arc(r*.23,r*.12,r*.78,0,tau);ctx.arc(r*.1,-r*.25,r*.68,0,tau);ctx.fill();

      } else if(p.type==='flash') {
        const s=p.size*(.85+.18*Math.sin(a*Math.PI));ctx.rotate(p.angle);ctx.scale(s,s);
        const wedge=(length,thickness,angle,color,drift=0)=>{
          ctx.save();ctx.rotate(angle);ctx.translate(drift,0);
          polygon([[-.21,-thickness*.38],[length*.18,thickness*.25],[length,0],[length*.28,-thickness*.32],[length*.57,-thickness*.72],[length*.10,-thickness*.56]],color);
          ctx.restore();
        };
        if(a<.34) {
          const stretch=1.3-a*.6;
          wedge(stretch*1.72,.43,.89,'#ff3448');wedge(stretch*1.58,.31,.91,'#fff');
          wedge(1.45,.27,-2.53,'#fb3137');wedge(1.33,.18,-2.55,'#fffbe5');
          wedge(1.65,.11,-.23,'#9ceaff');glint(0,0,.45,'white');
        } else if(a<.89) {
          const phase=(a-.34)/.55,drift=phase*phase*.45;
          ctx.globalAlpha=1-phase*.23;
          for(const ang of [2.18,2.89,-.15,-2.31]) {
            wedge(.90+phase*.65,.58,ang,'#ff6c14',drift);
            wedge(.81+phase*.60,.42,ang+.018,'#fff441',drift);
          }
          wedge(1.33,.29,1.63,'white');wedge(1.29,.085,2.11,'#80ecff');wedge(1.25,.07,-.78,'#b6f7ff');
          glint(0,0,.50*(1-phase),'#fff');
        } else glint(.24,.26,.47,'#a9ffca');
      } else if(p.type==='grabFlare') {
        // The gold fan revolves behind the fighters and contracts into the grip.
        for(const fighter of [p.holder,p.target]) {
          ctx.beginPath();ctx.rect(-4,-4,8,8);
          ctx.moveTo(fighter.x-p.x+.75,fighter.y+.82-p.y);
          ctx.ellipse(fighter.x-p.x,fighter.y+.82-p.y,.75,.70,0,0,tau);
          ctx.clip('evenodd');
        }
        ctx.beginPath();ctx.rect(-4,-.85,8,5);ctx.clip();
        const radius=2.19*(1+.12*Math.sin(Math.PI*Math.min(1,a/.4))-.95*a*a);
        ctx.scale(p.face*radius,radius);
        const glow=ctx.createRadialGradient(0,0,0,0,0,1.19);
        glow.addColorStop(0,'#ffef88bb');glow.addColorStop(.45,'#ff941739');glow.addColorStop(1,'#ff820000');
        ctx.fillStyle=glow;ctx.fillRect(-1.2,-1.2,2.4,2.4);
        const phase=.43+a*6.10;
        for(const shift of [0,Math.PI]) {
          ctx.save();ctx.rotate(phase+shift);ctx.scale(1,-1);
          const gold=ctx.createLinearGradient(-.45,.94,1,0);
          gold.addColorStop(0,'#ff8e1620');gold.addColorStop(.52,'#ff941ce9');
          gold.addColorStop(.82,'#ffe943');gold.addColorStop(.96,'#ffffbd');gold.addColorStop(1,'#fffff6');
          ctx.fillStyle=gold;ctx.beginPath();ctx.moveTo(1,0);ctx.arc(0,0,1,0,1.91);
          ctx.bezierCurveTo(.06,.88,.56,.79,.56,.53);
          ctx.quadraticCurveTo(.34,.67,.23,.65);ctx.quadraticCurveTo(.49,.44,.06,.03);
          ctx.lineTo(1,0);ctx.fill();
          const edge=ctx.createLinearGradient(.10,0,1,0);
          edge.addColorStop(0,'#ffad1b00');edge.addColorStop(.72,'#fff7aeaa');edge.addColorStop(1,'#fffefc');
          polygon([[.09,.035],[.89,.052],[1,0],[.58,-.008]],edge);
          ctx.restore();
        }
        if(a>=.1 && a<=.65) {
          ctx.globalAlpha=Math.sin(Math.PI*(a-.04)/.7);
          const light=a<.3?'#b3faff':'#ecc6ff';
          for(const angle of [.8,1.55,3.85]) {
            ctx.save();ctx.rotate(angle);
            polygon([[.47,0],[1.03,.029],[1.62,0],[1.02,-.025]],light);
            ctx.restore();
          }
        }
      } else if(p.type==='ring') {
        ctx.globalAlpha=1-a;ctx.scale(1,p.flat);ctx.strokeStyle=p.color;ctx.lineWidth=.09*(1-a)+.017;ctx.beginPath();ctx.arc(0,0,(.15+a*.85)*p.size,0,tau);ctx.stroke();
      } else if(p.type==='ember') {
        ctx.globalAlpha=Math.min(1,p.life/6);ctx.rotate(p.angle-.52*Math.sin(a*4));const s=p.size*(.7+.5*Math.sin(a*Math.PI));
        ctx.scale(s,s*(1.25+.5*Math.cos(p.angle)));
        const glow=ctx.createRadialGradient(0,0,0,0,0,1.45);glow.addColorStop(0,'#ffd042dc');glow.addColorStop(1,'#ff4f0000');
        ctx.fillStyle=glow;ctx.fillRect(-1.5,-1.5,3,3);
        ctx.fillStyle='#ff751ea8';ctx.beginPath();ctx.moveTo(-.85,-.2);ctx.quadraticCurveTo(-.45,.8,-.65,1.75);
        ctx.quadraticCurveTo(.1,1.27,.26,.58);ctx.lineTo(.74,1.15);ctx.quadraticCurveTo(.85,-.4,.12,-.70);
        ctx.quadraticCurveTo(-.68,-.7,-.85,-.2);ctx.fill();
        polygon([[-.45,-.32],[-.12,.65],[.10,.31],[.4,.55],[.27,-.40]],'#fff192');
      } else if(p.type==='spark') {
        ctx.globalAlpha=Math.min(1,p.life/5);ctx.rotate(Math.atan2(p.vy,p.vx));polygon([[p.size*2,0],[-p.size*.8,p.size*.21],[-p.size*2.7,0],[-p.size*.6,-p.size*.17]],p.color);
      } else {ctx.rotate(p.angle+a);glint(0,0,p.size*Math.sin(Math.PI*(a*.8+.1)),p.color)}
      ctx.restore();
    }
    function textAt(word,x,y,size,color,angle=0) {
      ctx.save();ctx.translate(x,y);ctx.scale(1,-1);ctx.rotate(angle);ctx.font='italic 900 '+size+'px Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.strokeStyle='rgba(50,32,64,.6)';ctx.lineWidth=.06;ctx.strokeText(word,0,0);ctx.fillText(word,0,0);ctx.restore();
    }
    function jabEffects(f) {
      const n=f.actionFrame,a=f.action,kirby=f.kind==='kirby';
      const rapid=a==='rapidJab',finish=a==='rapidEnd',first=a==='jab';
      const onset=kirby ? first?1:2 : 5;
      if(rapid?n<5:finish?n>11:(n<onset || n>onset+7)) return;
      const size=SmashFighters.worldScale[f.kind];
      ctx.save();ctx.translate(f.x,f.y);ctx.scale(f.face*size,size);
      if(rapid) {
        const haze=ctx.createRadialGradient(2.21,.93,.12,2.21,.93,1.12);
        haze.addColorStop(0,'#e89aff30');haze.addColorStop(.73,'#6ff5ff16');haze.addColorStop(1,'#b0ecff00');
        ctx.fillStyle=haze;ctx.fillRect(.95,-.21,2.58,2.27);
        // White cores, cyan leading edges and pink trails cross at three heights.
        for(let i=0;i<4;i++) {
          const phase=((n-5+i*3)%9)/9, high=(i===0 || i===3);
          const x=high?.90:1.10,y=[1.30,.89,.52,1.10][i];
          const length=(i===0?1.58:i===3?2.02:1.91)*(.84+.16*Math.sin(phase*Math.PI));
          ctx.save();ctx.translate(x+.20*phase,y);ctx.rotate([.16,.07,-.18,.12][i]);
          ctx.save();ctx.translate(length*.62,0);ctx.scale(length*.72,.21);
          const bloom=ctx.createRadialGradient(.13,0,.06,.13,0,1);
          bloom.addColorStop(0,i===0?'#ffe0fff2':'#beffffd4');bloom.addColorStop(.52,i===0?'#ffb4f197':'#59eefb83');bloom.addColorStop(1,'#fcd9ff00');
          ctx.fillStyle=bloom;ctx.fillRect(-1.1,-1.08,2.32,2.16);ctx.restore();
          if(i===0) {
            const pink=ctx.createLinearGradient(0,0,length,0);pink.addColorStop(0,'#ffc0f000');pink.addColorStop(.28,'#fff8ffc7');pink.addColorStop(.66,'#ffdef6ef');pink.addColorStop(1,'#ffacde00');
            ctx.fillStyle=pink;ctx.beginPath();ctx.moveTo(-.18,-.13);ctx.lineTo(.11,.006);ctx.lineTo(-.09,.063);
            ctx.quadraticCurveTo(.55,.12,length+.19,.082);ctx.lineTo(.69,-.044);ctx.closePath();ctx.fill();ctx.restore();continue;
          }
          const glow=ctx.createLinearGradient(0,0,length,0);
          glow.addColorStop(0,'rgba(234,93,192,0)');glow.addColorStop(.35,'rgba(255,192,236,.52)');
          glow.addColorStop(.71,'#fff4ff');glow.addColorStop(1,'#19fff6');
          ctx.fillStyle=glow;
          ctx.beginPath();ctx.moveTo(0,-.09);ctx.lineTo(.40,-.01);ctx.lineTo(.14,.03);ctx.lineTo(length*.72,.13);
          ctx.bezierCurveTo(length+.07,.20,length+.22,-.055,length,-.13);
          ctx.quadraticCurveTo(length*.82,-.24,.48,-.075);ctx.closePath();ctx.fill();
          const core=ctx.createLinearGradient(.17,0,length,0);
          core.addColorStop(0,'#ffc5ed00');core.addColorStop(.52,'#fff7ffb5');core.addColorStop(.83,'#fff');core.addColorStop(1,'#c8ffff');
          ctx.fillStyle=core;ctx.beginPath();ctx.moveTo(.22,.004);ctx.quadraticCurveTo(length*.80,.14,length-.10,.073);
          ctx.quadraticCurveTo(length+.01,-.03,length-.17,-.085);ctx.quadraticCurveTo(length*.72,-.13,.22,.004);ctx.fill();
          for(let j=0;j<3;j++){
            const offset=(j-1.1)*.068;const tail=length*(.60+j*.11);
            const tint=ctx.createLinearGradient(-.18,0,tail,0);tint.addColorStop(0,'#a4ffff00');tint.addColorStop(.76,'#cdfbffc2');tint.addColorStop(1,'#fff');
            polygon([[-.16+j*.07,offset],[tail,offset+.045],[tail+.05,offset]],tint);
          }
          ctx.restore();
        }
      } else if(finish) {
        const fade=clamp((12-n)/6,0,1);ctx.globalAlpha=fade;
        const bloom=ctx.createRadialGradient(2.25,1.48,.06,2.25,1.48,.92);
        bloom.addColorStop(0,'#fcffffe0');bloom.addColorStop(.33,'#bafbffb8');bloom.addColorStop(.57,'#67c1ff63');bloom.addColorStop(1,'#a995ff00');
        ctx.fillStyle=bloom;ctx.fillRect(1.28,.50,1.96,1.96);
        const arc=ctx.createLinearGradient(.85,.1,2.45,1.68);arc.addColorStop(0,'#36c9ff00');arc.addColorStop(.40,'#2ee5ffb3');arc.addColorStop(.9,'#f6ffff');
        ctx.fillStyle=arc;ctx.beginPath();ctx.moveTo(1.12,.02);ctx.bezierCurveTo(1.44,.47,2.28,1.31,2.21,1.75);
        ctx.bezierCurveTo(2.57,1.53,2.22,.78,1.53,.20);ctx.quadraticCurveTo(1.33,.08,1.12,.02);ctx.fill();
        for(let j=0;j<3;j++) {
          const end=2.19+j*.10,st=.96+j*.13;
          const jet=ctx.createLinearGradient(st,.05,end,1.55);
          jet.addColorStop(0,'#93feff00');jet.addColorStop(.28,'#59ecff75');jet.addColorStop(.64,'#c1ffffad');jet.addColorStop(1,'#fff');
          ctx.fillStyle=jet;ctx.beginPath();ctx.moveTo(st,.05);
          ctx.quadraticCurveTo(1.61,.47,end,1.61);ctx.quadraticCurveTo(1.91,.55,st+.08,.09);ctx.fill();
        }
        if(n>=2) {
          ctx.save();ctx.translate(2.25,1.48);ctx.rotate(-.35);
          ctx.strokeStyle='#80edff';ctx.lineWidth=.10;ctx.beginPath();ctx.ellipse(0,0,.34,.37,.1,0,tau);ctx.stroke();
          ctx.strokeStyle='#f4ffff';ctx.lineWidth=.056;ctx.stroke();
          for(const [r,angle] of [[1.07,1.56],[.78,.07],[.63,-1.57],[.63,3.11]]) {
            ctx.save();ctx.rotate(angle);polygon([[0,-.073],[r,0],[0,.075]],'#c6feff');polygon([[0,-.03],[r*.94,0],[0,.03]],'#fff');ctx.restore();
          }
          ctx.restore();
        }
      } else {
        const age=n-onset,fade=clamp((8-age)/4,0,1);
        const x=kirby ? first?1.91:2.03 : first?1.55:1.35, y=kirby?1.01:first?.77:.61;
        ctx.translate(x,y);ctx.globalAlpha=fade;
        if(kirby) {
          ctx.rotate(first?.018:.014);
          const bloom=ctx.createRadialGradient(.03,0,.01,.03,0,.31);
          bloom.addColorStop(0,'#ffffffff');bloom.addColorStop(.56,'#80eeffa8');bloom.addColorStop(1,'#a7e3ff00');
          ctx.fillStyle=bloom;ctx.fillRect(-.30,-.32,.68,.64);
          const glow=ctx.createLinearGradient(-1.18,0,.27,0);glow.addColorStop(0,'#ebbbff00');glow.addColorStop(.58,'#aeccffcc');glow.addColorStop(.83,'#f5feff');glow.addColorStop(1,'#39f3ffff');
          ctx.fillStyle=glow;ctx.beginPath();ctx.moveTo(-1.22,-.18);ctx.lineTo(-.46,-.03);ctx.lineTo(-.89,.085);ctx.lineTo(-.15,.10);
          ctx.bezierCurveTo(.35,.21,.39,-.08,.16,-.13);ctx.lineTo(-1.22,-.18);ctx.fill();
          ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(.01,0,.23,.098,0,0,tau);ctx.fill();
        }
        if(!kirby || age>=2) {
          const r=(kirby?.26:.46)*(.84+.16*Math.sin((age+1)*.84));
          ctx.rotate(kirby?.14:-.25);ctx.globalAlpha*=kirby?.67:.58;
          ctx.beginPath();
          for(let i=0;i<18;i++){
            const angle=i*Math.PI/9,rad=i%2?r*(.31+.10*Math.sin(i*3)):r*(.65+.36*Math.cos(i*3));
            const x=Math.cos(angle)*rad,y=Math.sin(angle)*rad*1.33;
            if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
          }
          ctx.closePath();ctx.moveTo(.24*r,0);ctx.arc(0,0,.24*r,0,tau,true);ctx.fillStyle='#fff9f0';ctx.fill('evenodd');
        }
      }
      ctx.restore();
    }
    function fighterFx(f,frame,color,tag,view) {
      if(f.action==='ko'||f.action==='grabbed' && f.hidden)return;
      const x=f.x,y=f.y+.82,t=f.actionFrame;
      if(f.finalReady) {
        ctx.save();ctx.translate(x,y-.13);
        const pulse=.94+.055*Math.sin(frame*.18),hue=(frame*4.3+f.index*80)%360;
        ctx.scale(pulse,pulse*1.03);
        const halo=ctx.createRadialGradient(0,0,.42,0,0,1.13);
        halo.addColorStop(0,'transparent');halo.addColorStop(.25,'hsla('+hue+',100%,88%,.07)');
        halo.addColorStop(.44,'hsla('+hue+',100%,82%,.37)');halo.addColorStop(1,'transparent');
        ctx.fillStyle=halo;ctx.fillRect(-1.14,-1.14,2.28,2.28);
        for(let j=0;j<4;j++){
          const a=frame*.043+j*1.55,phase=(frame*.034+j*.29)%1;
          ctx.globalAlpha=.72*Math.sin(phase*Math.PI);glint(Math.cos(a)*(.68+phase*.34),Math.sin(a)*.67+phase*.24,.045+phase*.055,'#fffcce');
        }
        ctx.restore();
      }
      guard.draw(f,frame,color);
      if(f.action==='stun' && f.tumbling && !f.hitlag && f.launchSpeedUp>2 && t<10 && !trails[f.index]?.backKick) {
        const angle=Math.atan2(f.ky+f.vy,f.kx), length=Math.min(3.8,Math.hypot(f.kx,f.ky)*6);
        ctx.save();ctx.translate(x,y);ctx.rotate(angle);
        ctx.globalAlpha=clamp((10-t)/5,0,1)*.92;
        for(const [h,end] of [[.41,1.1],[-.42,.82],[.24,.72],[-.21,1.24]]) {
          polygon([[.50,h],[-.30,h*1.12],[-length*end,h*1.8],[-.42,h*1.44]],'#fff');
        }
        ctx.restore();
      }
      if(f.action==='jab' || f.action==='jab2' || f.action==='rapidJab' || f.action==='rapidEnd') jabEffects(f);
      if(f.action==='inhale' && t>=8 && t<=44 && !f.inhaleReleased) {
        ctx.save();ctx.translate(x+f.face*.48,y-.1);ctx.scale(f.face,1);
        for(let i=0;i<6;i++) {const phase=(frame*.064+i/6)%1, length=(1-phase)*2.5+.12, h=Math.sin(i*2.2)*(.2+length*.32);ctx.strokeStyle='rgba(255,255,255,'+(.18+.64*Math.sin(phase*Math.PI))+')';ctx.lineWidth=.04+.04*phase;ctx.beginPath();ctx.moveTo(length,h);ctx.quadraticCurveTo(length*.65,h*.78,length*.46,h*.3);ctx.stroke();}ctx.restore();
      }
      SmashPuffFX.draw(ctx,f,frame);
      SmashKirbyFX.draw(ctx,f,frame);
      if(/smash$/.test(f.action)&&f.charge>3) {
        const a=(frame%17)/17;glint(x+f.face*.68,y+.5,.1+.48*(1-a),'#f7ffff');
      }
      if(f.action==='respawn') {
        ctx.fillStyle='#b9eafa';ctx.fillRect(x-.92,f.y-.10,1.84,.11);polygon([[x-.9,f.y-.11],[x+.9,f.y-.11],[x+.58,f.y-.34],[x-.58,f.y-.34]],'#5797c6');
      }
      if(!tag) return;
      const top=f.y+(f.kind==='kirby'?2.05:2.30)*SmashFighters.worldScale[f.kind];
      if(tag==='FP'){
        const fade=clamp((view.right-view.left-21.6)/1.6,0,1);
        if(!fade || x<view.left || x>view.right || top>view.top)return;
        ctx.save();ctx.globalAlpha=fade;ctx.translate(x,top+.07);
        polygon([[-.15,.16],[.15,.16],[0,-.03]],'#77ccb9');
        const color=ctx.createLinearGradient(0,.17,0,.62);color.addColorStop(0,'#72e5d8');color.addColorStop(.72,'#e4f8a2');color.addColorStop(1,'#ffe37e');
        textAt('FP',0,.38,.52,color);ctx.restore();return;
      }
      if(x>view.left && x<view.right && top<view.top-.35 && f.y>view.bottom) {
        ctx.save();ctx.translate(x,top);polygon([[-.13,.17],[.13,.17],[0,-.02]],color);
        textAt(tag,0,.40,.42,color);ctx.restore();
      }
    }
    function draw(m,view,teams,restZoomAge) {
      const d=canvas.width/view.pixels, s=view.scale*d;
      ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
      const hitFlash=particles.find(p=>p.wash && p.ttl-p.life<10);
      if(hitFlash && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        ctx.fillStyle='rgba(255,255,255,'+(.30*(1-(hitFlash.ttl-hitFlash.life)/10))+')';
        ctx.fillRect(0,0,canvas.width,canvas.height);
      }
      ctx.setTransform(s,0,0,-s,-view.left*s,view.top*s);
      for(const p of m.projectiles) SmashKirbyFX.wave(ctx,p,m.frame);
      if(restZoomAge===undefined) {
        const atGlass=m.fighters.some(f=>f.screenKO && f.actionFrame>20 && f.actionFrame<82);
        const finalFighter=m.fighters.find(SmashFinalSmash.isActive);
        m.fighters.forEach((f,i)=>{
          if(i!==0 || !view.recordedLoupe)fighterFx(f,m.frame,teams[i].color,atGlass || f===finalFighter?'':teams[i].tag,view);
        });
        particles.forEach(drawParticle);
        SmashFinalSmash.draw(ctx,m,finalFighter,view);
        if(!atGlass)radar?.draw(m,view,teams,finalFighter);
      } else {
        SmashPuffFX.restContact(ctx,m.fighters,restZoomAge);
        if(restZoomAge>28) particles.forEach(drawParticle);
      }
    }
    return {event,tick,draw,attachTrails,positionTrails,landingBurst,replayLoupe,bindGuardModels:guard.bind,
      bindRadar(T,renderer,scene,models){radar=makeRadar(T,renderer,scene,models,ctx);},
      burnLevel(i){return Math.min(1,burnLife[i]/10)*.88},
      get shake(){return shake},clear(){guard.clear();radar?.clear();particles.length=0;trails.fill(null);burnLife.fill(0);shake=0}};
  }
  globalThis.SmashFeedback={audioSystem,makeEffects};
})();

// Sample Ultimate's local-space SRT and mesh-visibility tracks on the original skeleton.
(() => {
  let clipsByKind, values;
  const rigs=new WeakMap();
  const stageUnit=10/77.2737;
  const ready=(async()=>{
    const bytes=Uint8Array.from(atob(globalThis.SmashMotionData),ch=>ch.charCodeAt(0));
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const buf=await new Response(stream).arrayBuffer();
    const size=new DataView(buf).getUint32(0,true);
    clipsByKind=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,4,size)));
    values=new Uint16Array(buf,4+size);
    return true;
  })().catch(()=>false);

  const basic={
    idle:'a00wait1', walk:'a01walkmiddle', run:'a02run', runBrake:'a02runbrakel', turnRun:'a02turnrun',
    jumpSquat:'a03jumpsquat', jump:'a03jumpf', fall:'a04fall', land:'a05landinglight', crouch:'a05squatwait',
    shield:'b00guardon', shieldDrop:'b00guardoff', parry:'b00justshieldoff',
    roll:'b02escapef', dodge:'b02escapen', airDodge:'b02escapeair',
    jab:'c00attack11', jab2:'c00attack12', rapidJab:'c00attack100', rapidEnd:'c00attackend',
    ftilt:'c01attacks3s', utilt:'c02attackhi3', dtilt:'c02attacklw3', dashAttack:'c00attackdash',
    fsmash:'c03attacks4s', usmash:'c04attackhi4', dsmash:'c04attacklw4',
    nair:'c05attackairn', fair:'c05attackairf', bair:'c05attackairb', uair:'c05attackairhi', dair:'c05attackairlw',
    sleep:'f07sleeploop', ledge:'g01cliffwait', ledgeSnap:'g01cliffwait', climb:'g02cliffclimb',
    ledgeRoll:'g02cliffescape', ledgeAttack:'g02cliffattack', ledgeJump:'g02cliffjump1',
    tech:'f05passive', techRoll:'f05passivestandf', screenKOPose:'f09camerahit',
    grab:'e00catch', dashGrab:'e00catchdash', pivotGrab:'e00catchturn', hold:'e00catchwait',
    pummel:'e00catchattack', grabRelease:'e00catchcut', throwF:'e01throwf',
    throwB:'e01throwb', throwU:'e01throwhi', throwD:'e01throwlw'
  };
  const repeats=new Set(['a00wait1','a01walkmiddle','a01walkslow','a01walkfast','a02run','a04fall','a04fallaerial','a05squatwait','b00guard','f07sleeploop','g01cliffwait','c00attack100','d00specialnloop','d00specialairnloop','d00specialnhold','d00specialairnhold','d00specialn','d01specialshold']);
  function source(f){
    const a=f.action,air=f.landedStart===false,kind=f.kind==='kirby'?'kirby':'purin';
    if(a==='grabbed' && f.captureMove){
      const direction={throwF:'f',throwB:'b',throwU:'hi',throwD:'lw'}[f.captureMove];
      if(direction)return 'receive_e01thrown'+direction;
      return f.captureMove==='pummel'?'e03capturedamagelw':'e03capturewaitlw';
    }
    if(a==='grabRelease' && f.releasedVictim)return 'e03capturecut';
    if(a==='puffUp'||a==='ultraSword'){
      const prefix='d04final'+(air?'air':'');
      if(kind==='kirby')return f.finalPhase==='start'?prefix+'start':f.finalPhase==='attack'?prefix+'attack':null;
      return f.finalPhase==='start'?prefix+'startr':f.finalPhase==='end'?prefix+'endr':prefix;
    }
    if(a==='walk' && Number.isFinite(f.vx)){
      const speed=Math.abs(f.vx)/stageUnit;
      // Midpoints of the feet-per-frame speeds of the three native Trans curves.
      const slow=kind==='kirby'?.404:.311, fast=kind==='kirby'?.760:.709;
      return speed<slow?'a01walkslow':speed<fast?'a01walkmiddle':'a01walkfast';
    }
    if(a==='taunt')return {up:'j01appealhir',down:'j01appeallwr',side:'j01appealsr'}[f.tauntVariant];
    if(a==='jump' && Number.isFinite(f.jumps) && f.jumps<5){
      const used=5-f.jumps;return 'a03jumpaerialf'+(used>1?used:'');
    }
    if(a==='shield' && f.shieldStun>0)return 'b01guarddamage';
    if(a==='idle' && f.parryRecovery && f.actionFrame<=(kind==='kirby'?20:21))return 'b00justshieldoff';
    if(a==='shieldBreak'){
      if(!f.shieldBreakLandFrame)return 'f01damageflyn';
      if(f.actionFrame<f.shieldBreakDizzyFrame-49)return 'f03downspotu';
      if(f.actionFrame<f.shieldBreakDizzyFrame)return 'f06furafurastartu';
      return f.actionLimit-f.actionFrame<=32?'f06furafuraend':'f06furafura';
    }
    if(a==='stun'){
      if(f.tumbling)return Math.abs(f.ky)>Math.abs(f.kx)*2?'f01damageflytop':'f01damageflyn';
      return f.grounded?'f00damagen2':'f01damageair2';
    }
    if(a==='fall'&&f.tumbling)return 'a04damagefall';
    if(a==='run'&&f.dashFrames)return 'a02dash';
    if(a==='roll'&&f.rollDir && f.rollDir!==f.face)return 'b02escapeb';
    if(a==='prone'||a==='getup'||a==='getupRoll'||a==='getupAttack'){
      const head=f.proneFront?'f04down':'f03down';
      const verb={prone:'wait',getup:'stand',getupRoll:'forward',getupAttack:'attack'}[a];
      return head+verb+(f.proneFront?'d':'u');
    }
    if(f.charge && f.actionFrame===globalThis.SmashSim?.smashChargeFrame?.(f)-1){
      return {fsmash:'c03attacks4charge',usmash:'c04attackhi4charge',dsmash:'c04attacklw4charge'}[a];
    }
    if(kind==='kirby'){
      if(a==='inhale'){const stem=air?'d00specialairn':'d00specialn';return stem+(f.actionFrame<=19?'start':f.actionFrame<=44?'loop':'end');}
      if(a==='held')return 'd00eatwait';
      if(a==='swallow'||a==='spit')return (air?'d00specialairn':'d00specialn')+a;
      if(a==='hammer'){
        if(f.actionFrame<=15)return f.charge?'d01specialshold':air?'d01specialairsstart':'d01specialsstart';
        return (air?'d01specialairs':'d01specials')+(f.charge>=120?'max':'');
      }
      if(a==='cutter')return f.actionFrame<=22?(air?'d02specialairhi':'d02specialhi'):f.actionFrame<=57?(air?'d02specialairhi2':'d02specialhi2'):'d02specialhi3';
      if(a==='cutterLand')return 'd02specialhi4';
      if(a==='stone')return air?'d03specialairlw1':'d03speciallw1';
      if(a==='stoneExit')return air?'d03specialairlw2':'d03speciallw2';
      if(a==='stoneLand')return 'd03speciallw1';
    }
    if(kind==='purin'){
      if(a==='pound')return air?'d01specialairs':'d01specials';
      if(a==='sing')return air?'d02specialairhir':'d02specialhir';
      if(a==='rest')return air?'d03specialairlwr':'d03speciallwr';
    }
    if(a==='rollout' && (kind==='purin' || f.copied)){
      const copy=kind==='kirby'?'purin':'',prefix=copy+(air?'d00specialairn':'d00specialn');
      if(f.rollPhase==='charge')return f.chargeHold?prefix+'hold':prefix+'startr';
      if(f.rollPhase==='end')return prefix+'endr';
      return copy+'d00specialn';
    }
    return basic[a];
  }
  function pack(f){return clipsByKind?.[f.kind==='kirby'?'kirby':'purin'];}
  function canPose(f){const data=pack(f);return !!data?.clips[source(f)];}

  function makeState(rig,data){
    const T=globalThis.THREE;
    const bind=rig.bind.map(m=>{const p=new T.Vector3(),q=new T.Quaternion(),s=new T.Vector3();m.decompose(p,q,s);return [p,q,s];});
    const irisMaterials=new Map([...rig.materials].filter(([,mat])=>mat.userData.irisUV));
    return {bind,irisMaterials,prev:null,q0:new T.Quaternion(),v0:new T.Vector3(),v1:new T.Vector3(),uv:new T.Vector4(),indices:data.bones.map((name,i)=>rig.boneNames[i]===name?i:rig.boneNames.indexOf(name))};
  }
  function read(desc,dimension,frame,out){
    if(desc.length===dimension){out.fromArray(desc);return;}
    const k=desc[0]+Math.min(frame,desc[1]-1)*dimension;
    out.x=desc[2]+values[k]*desc[2+dimension];out.y=desc[3]+values[k+1]*desc[3+dimension];out.z=desc[4]+values[k+2]*desc[4+dimension];
    if(dimension===4)out.w=desc[5]+values[k+3]*desc[9];
  }
  function sample(desc,dim,frame,next,frac,out,scratch){
    if(!desc)return;
    read(desc,dim,frame,out);
    if(frac && desc.length!==dim){read(desc,dim,next,scratch);if(out.isQuaternion)out.slerp(scratch,frac);else out.lerp(scratch,frac);}
    if(out.isQuaternion)out.normalize();
  }
  function applyVisible(rig,tracks,frame,overrides){
    for(const [name,keys] of Object.entries(tracks)){
      if(overrides && Object.hasOwn(overrides,name))continue;
      const refs=rig.shapes.get(name);if(!refs)continue;
      let visible=!!keys[0];
      for(let k=1;k<keys.length&&keys[k]<=frame;k++)visible=!visible;
      for(const mesh of refs)mesh.visible=visible;
    }
  }
  function pose(rig,f,seconds,rollAngle){
    const data=pack(f),name=source(f),clip=data?.clips[name];
    if(!clip)return false;
    let state=rigs.get(rig);
    if(!state){state=makeState(rig,data);rigs.set(rig,state);}
    const [end,tracks,visibility,eyes,stride]=clip;
    let pos=Number.isFinite(f.finalFrame)&&(f.action==='ultraSword'||f.action==='puffUp')?f.finalFrame:Math.max(0,(f.actionFrame||1)-1);
    if(f.backAirReel)pos+=6;
    if(name==='b01guarddamage')pos=Math.max(0,f.actionFrame-(f.shieldDamageFrame||1));
    if(name==='b00justshieldoff' && f.action==='idle')pos=f.actionFrame;
    if(f.action==='shieldBreak' && f.shieldBreakLandFrame){
      if(name==='f03downspotu')pos=f.actionFrame-f.shieldBreakLandFrame;
      else if(name==='f06furafurastartu')pos=f.actionFrame-f.shieldBreakDizzyFrame+49;
      else if(name==='f06furafuraend')pos=32-Math.floor(f.actionLimit-f.actionFrame);
      else pos=(f.actionFrame-f.shieldBreakDizzyFrame)%end;
    }
    if(f.action==='grabbed')pos=Math.max(0,(f.captureFrame||1)-1);
    const capturedThrow=f.action==='grabbed' && f.captureMove?.startsWith('throw');
    if((capturedThrow || f.action?.startsWith('throw')) && globalThis.SmashSim?.throwPoseFrame){
      pos=capturedThrow?SmashSim.throwPoseFrame(f.captureKind,f.captureMove,f.captureFrame):
        SmashSim.throwPoseFrame(f.kind,f.action,f.actionFrame);
    }
    if((f.action==='hold' || f.captureMove==='hold') && end>0)pos%=end;
    if(name.endsWith('charge'))pos=f.charge||0;
    if(f.kind==='kirby' && name==='c04attackhi4' && f.actionFrame>=12)pos+=2;
    // The down smash passes the first four authored frames in one game tick.
    if(f.kind==='kirby' && name==='c04attacklw4' && f.actionFrame>1)pos+=3;
    if(f.action==='inhale' && name.endsWith('loop'))pos-=19;
    if(f.action==='inhale' && name.endsWith('end'))pos-=44;
    if(f.action==='hammer')pos=name.endsWith('hold')?f.charge:Math.max(0,pos-(f.actionFrame>15?15:0));
    if(f.action==='cutter')pos=Math.max(0,pos-(f.actionFrame>57?57:f.actionFrame>22?22:0));
    if(f.action==='rollout'&&f.rollPhase==='charge'&&f.chargeHold)pos=f.chargeHold;
    if(f.action==='rollout'&&f.rollPhase!=='charge')pos=f.rollPhaseFrame||0;
    if(f.action==='rollout' && /d00specialn$/.test(name) && Number.isFinite(rollAngle)){
      // Rot (Kirby) and Hip (Puff) rotate 360° with a cubic smoothstep across
      // 60 authored frames. Invert it to keep the observed angular speed.
      const turns=rollAngle/(2*Math.PI),phase=turns-Math.floor(turns);
      pos=end*(.5-Math.sin(Math.asin(1-2*phase)/3));
    }
    if(stride>0 && Number.isFinite(f.x)){
      // Sample the same footfall over the distance the simulator actually moved.
      // Retain its phase when analog input crosses the walk-speed boundaries.
      const sameGait=state.gait===f.action && f.actionFrame>=state.gaitFrame;
      if(sameGait)state.gaitPhase+=Math.abs(f.x-state.gaitX)/(stride*stageUnit);
      else state.gaitPhase=pos/end;
      state.gait=f.action;state.gaitFrame=f.actionFrame;state.gaitX=f.x;
      state.gaitPhase%=1;pos=state.gaitPhase*end;
    }else state.gait=null;
    if(repeats.has(name.replace(/^purind/,'d'))&&end>0)pos%=end;else pos=Math.min(end,pos);
    const frame=Math.floor(pos),next=Math.min(end,frame+1),frac=pos-frame;
    if(state.prev!==clip){
      for(let i=0;i<rig.bones.length;i++){
        const bone=rig.bones[i],[p,q,s]=state.bind[i];bone.matrixAutoUpdate=false;bone.position.copy(p);bone.quaternion.copy(q);bone.scale.copy(s);bone.matrix.copy(rig.bind[i]);bone.matrixWorldNeedsUpdate=true;
      }
      state.prev=clip;
    }
    for(const [index,comp,t,r,s] of tracks){
      const i=state.indices[index];if(i<0)continue;
      const bone=rig.bones[i];sample(t,3,frame,next,frac,bone.position,state.v0);sample(r,4,frame,next,frac,bone.quaternion,state.q0);sample(s,3,frame,next,frac,bone.scale,state.v1);
      bone.matrix.compose(bone.position,bone.quaternion,bone.scale);bone.matrixWorldNeedsUpdate=true;
    }
    for(const [index,comp] of tracks){
      if(!comp)continue;
      const i=state.indices[index],parent=state.indices[data.parents[index]];if(i<0||parent==null||parent<0)continue;
      // SSBH local matrix = T * inverse(parent's local S) * R * S. Keep T intact.
      const e=rig.bones[i].matrix.elements, s=rig.bones[parent].scale;
      for(const k of [0,4,8]){if(s.x)e[k]/=s.x;if(s.y)e[k+1]/=s.y;if(s.z)e[k+2]/=s.z;}
    }
    // The base eyelid clip supplies eye shapes omitted by many idle/walk clips.
    // Main-clip visibility takes precedence for attacks and closed eyes.
    const eyelids=data.clips.a00defaulteyelid;
    if(eyelids)applyVisible(rig,eyelids[2],Math.floor((seconds||0)*60)%Math.max(1,eyelids[0]),visibility);
    if(name.startsWith('receive_'))applyVisible(rig,data.clips.e03capturewaitlw[2],0);
    applyVisible(rig,visibility,frame);
    for(const [label,material] of state.irisMaterials){
      const entry=eyes?.[label], uniforms=material.userData;
      if(entry?.[0])sample(entry[0],4,frame,next,frac,uniforms.irisUV,state.uv);
      else uniforms.irisUV.set(1,1,0,0);
      if(uniforms.irisPattern){
        let pattern=0;
        if(entry)for(const [start,value] of entry[1]){if(start>frame)break;pattern=value;}
        // Pattern index 1 occurs on both damage and Final Smash tracks. The
        // gold iris comes from the Final Smash material set, while an ordinary
        // damage pose keeps the default blue pupil used in the match footage.
        uniforms.irisPattern.value=f.action==='puffUp'?(f.finalPhase==='end'?1:pattern):0;
      }
    }
    return true;
  }
  globalThis.SmashMotions={ready,canPose,pose};
})();

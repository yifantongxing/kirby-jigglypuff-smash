/* Fixed 60 Hz simulation. Fighter positions are measured at the soles.
   Public frame counts: ultimateframedata.com/{kirby,jigglypuff}.
   Knockback parameters and Dream Land geometry: rubendal/SSBU-Calculator.
   hit-regions.js supplies root capsules and measured moving-limb projections. */
(() => {
  'use strict';
  if(!globalThis.SmashFinalSmash && typeof require==='function') require('./final-smash.js');
  const final=globalThis.SmashFinalSmash;
  const unit = 10 / 77.2737;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const toward = (v, goal, delta) => v + clamp(goal - v, -delta, delta);
  const platforms = [
    {left: -10, right: 10, y: 0},
    {left: -61.422 * unit, right: -31.699 * unit, y: 27.009 * unit},
    {left: 31.693 * unit, right: 63.038 * unit, y: 27.009 * unit},
    {left: -19.019 * unit, right: 19.018 * unit, y: 51.425 * unit},
  ];
  const stageBounds = {
    blast:{left:-250*unit,right:250*unit,top:192.111542*unit,bottom:-140*unit},
    camera:{left:-180*unit,right:180*unit,top:130*unit,bottom:-80*unit}
  };
  const stats = {
    kirby: {weight: 79, gravity: .064, walk: .977, brake: .116, run: 1.727, dash: 1.9, runAccel: .10494, air: .84, airBase: .03, airAccel: .065, airBrake: .015, fall: 1.23, full: 25.37, hop: 12.24, mid: 22, landing: [6, 8, 10, 7, 16]},
    jigglypuff: {weight: 68, gravity: .053, walk: .735, brake: .087, run: 1.271, dash: 1.65, runAccel: .09119, air: 1.332, airBase: .05, airAccel: .08, airBrake: .0375, fall: .98, full: 19.79, hop: 11.26, mid: 19.79, landing: [9, 9, 8, 9, 12]},
  };
  const aerials = ['nair', 'fair', 'bair', 'uair', 'dair'];
  // Distances inward from the lip and above its surface. Roll roots follow the
  // floor crosshair in the 45-frame UFD recordings. Attack scale uses the
  // 4.5-unit hit capsule on frame 20 (Kirby) and frame 21 (Jigglypuff).
  const ledges={
    kirby:{hang:[-.68,-1.73],jumpHeight:32.685,climb:33,rollXLU:22,attackXLU:22,
      ledgeRoll:[[1,-.68,-1.73],[6,-.56,-.58],[9,-.31,0],[12,.11,0],[15,.54,0],[17,.96,0],[21,2.24,0],[22,3.03,0],[24,3.54,0],[26,4.15,0],[28,4.54,0],[31,4.85,0],[36,5.14,0],[45,5.14,0]],
      ledgeAttack:[[1,-.68,-1.73],[6,-.68,-1.6],[12,-.72,-.55],[15,-.33,-.12],[18,-.32,-.12],[20,.97,0],[24,1.06,0],[55,1.06,0]]},
    jigglypuff:{hang:[-.84,-1.49],jumpHeight:29.895,climb:34,rollXLU:25,attackXLU:23,
      ledgeRoll:[[1,-.84,-1.49],[4,-.82,-.94],[6,-.66,-.47],[9,-.35,.12],[12,.21,.1],[15,.37,0],[18,.9,0],[21,1.78,0],[22,1.94,0],[24,2.87,0],[26,3.2,0],[28,4.14,0],[31,4.85,0],[32,5.07,0],[36,5.35,0],[45,5.35,0]],
      ledgeAttack:[[1,-.84,-1.49],[6,-.89,-.87],[9,-.53,-.28],[15,-.47,-.4],[18,-.39,-.14],[21,.54,0],[26,1.04,0],[55,.96,0]]},
  };
  const throwInvincibility={
    kirby:{throwF:45,throwB:41,throwU:51,throwD:58},
    jigglypuff:{throwF:12,throwB:26,throwU:9,throwD:62},
  };
  const free = new Set(['idle', 'walk', 'run', 'runBrake', 'turnRun', 'crouch', 'jump', 'fall']);
  const smashHold = {fsmash: 4, usmash: 8, dsmash: 4};
  const smashChargeFrame=f=>f.kind==='kirby' && f.action==='dsmash'?2:smashHold[f.action];
  const neutral = {x: 0, y: 0};
  // A window carries its own launch data. Adjacent clean/late windows share
  // a group; a new group lets multi-hit moves strike the same target again.
  function hit(first, last, damage, angle, growth, base, group = 0, lag = 1, fixed = 0) {
    return {first, last, damage, angle, growth, base, group, lag, fixed};
  }
  function move(frames, shape, ...windows) { return {frames, shape, windows}; }
  const handGrabs=new Set(['grab','dashGrab','pivotGrab']);
  // Calibrate the moving grab footage using its two-frame top-bone capsule.
  const dashGrabX={
    kirby:[[1,0],[5,.46],[9,.912],[10,1.045],[18,2.38],[31,3.72],[41,3.75]],
    jigglypuff:[[1,0],[5,.38],[9,.537],[10,.684],[18,1.61],[31,2.20],[39,2.21]],
  };
  // Sole height and horizontal translation sampled from UFD's fixed-camera footage.
  // The upward throw disappears above the recording before its descent.
  const throwTravel={
    kirby:{
      throwF:[[1,0,0],[9,-.26,0],[13,-.39,1.60],[18,-.10,2.49],[25,0,3.24],[30,.35,2.60],[35,.96,.52],[36,.98,0],[45,.98,0],[51,.73,2.47],[58,.32,3.50]],
      throwB:[[1,0,0],[5,.78,0],[12,.78,0],[18,.47,1.69],[25,.93,2.81],[30,.72,1.69],[31,.63,0],[38,.67,0],[41,.76,.69],[45,.84,2.08],[49,.97,2.51]],
      throwU:[[1,0,0],[5,-.22,0],[6,-.29,.82],[7,-.29,3.24],[12,-.29,15],[47,-.29,15],[53,-.29,7.98],[55,-.30,3.73],[56,.20,0],[58,-.30,0],[64,-1.08,1.61],[74,-1.97,2.5],[86,-2.65,2.5]],
    },
    jigglypuff:{throwB:[[1,0,0],[7,-.37,0],[10,-.54,1.06],[15,-.68,1.6],[18,-.74,1.88],[20,-1.22,.40],[25,-1,.33],[29,-.40,.75],[36,-.05,0],[49,-.19,0]]},
  };
  const forwardCapture=[[1,1.13,.05],[8,.70,0],[13,-.18,.23],[15,-.88,.34],[18,-.72,.62],[24,-.08,1],[31,.61,.32],[36,.05,-.52],[45,.05,-.52]];
  function throwPoseFrame(kind,action,n) {
    if(kind!=='kirby' || action!=='throwU')return Math.max(0,n-1);
    // In-game airtime includes the wait above the camera and the ground
    // stop. Preserve the observed F56 slam and ACMD F51 release at game F58.
    if(n<=27)return n-1;
    if(n<=38)return 26;
    if(n<=56)return n-12;
    if(n===57)return 47;
    return n-7;
  }
  function nativeThrow(f) {
    const rows=globalThis.SmashThrowPaths?.[f.kind==='kirby'?'kirby':'purin']?.[f.action];
    return rows?.[Math.min(rows.length-1,throwPoseFrame(f.kind,f.action,f.actionFrame))];
  }
  function atFrame(track,n) {
    const k=track.findIndex(sample=>sample[0]>=n);
    if(k<0) return track[track.length-1].slice(1);
    const a=track[Math.max(0,k-1)], b=track[k], t=(n-a[0])/Math.max(1,b[0]-a[0]);
    return [a[1]+(b[1]-a[1])*t,(a[2]||0)+((b[2]||0)-(a[2]||0))*t];
  }
  // CatchDash and CatchTurn use distinct capsules for grounded and aerial targets.
  // The pivot actor faces the new direction here, so its backward ACMD Z is positive.
  function movingGrab(frames,first,y,radius,end) {
    const spec=move(frames,'front',hit(first,first+1,0,0,0,0));
    spec.boxes=[[first,first+1,0,'top','g',radius,0,y,4,0,y,end],
      [first,first+1,1,'top','a',radius/2,0,y,4-radius/2,0,y,end+radius/2]];
    return spec;
  }
  const moves = {
    kirby: {
      jab: move(14, 'jab', hit(2,2,1.8,361,25,20,0,1.7)),
      jab2: move(15, 'jab', hit(3,3,1.6,361,15,25,0,1.2)),
      rapidJab: move(0, 'jab', hit(6,6,.2,361,35,7,0,.5)),
      rapidEnd: move(39, 'front', hit(3,4,3,361,115,70,0,3)),
      ftilt: move(23, 'front', hit(5,8,8,361,100,40)),
      utilt: move(20, 'up', hit(4,5,5,100,132,30), hit(6,10,4,88,130,26)),
      dtilt: move(20, 'low', hit(4,6,6,361,43,30)),
      dashAttack: move(51, 'body', hit(9,17,12,46,71,82,0,1.3), hit(18,26,9,76,50,80), hit(27,34,6,76,50,80,0,.8)),
      fsmash: move(47, 'front', hit(13,15,15,361,109,32,0,1.2), hit(16,19,11,60,69,90)),
      usmash: move(45, 'up', hit(12,14,15,75,104,36), hit(15,16,14,88,98,20), hit(17,17,13,50,52,10)),
      dsmash: move(50, 'sweep', hit(7,11,14,29,94,25), hit(12,19,10,29,94,25)),
      nair: move(52, 'body', hit(8,9,10,46,117,35), hit(10,13,8,46,90,30), hit(14,18,6,46,90,30), hit(19,32,4,46,90,30)),
      fair: move(47, 'front', hit(10,11,4,53,39,43,0,.8), hit(17,18,4,367,30,28,1,.8), hit(25,27,6,361,148,24,2,1.2)),
      bair: move(40, 'back', hit(6,8,13,361,104,15,0,1.2), hit(9,12,8,361,112,0)),
      uair: move(35, 'up', hit(8,13,10,70,115,20)),
      dairLand: move(16, 'sweep', hit(1,3,2,60,100,0,0,1,40)),
      dair: move(54, 'down', ...[18,21,24,27,30].map((n,i) => hit(n,n+1,1.2,367,100,20,i,.8)), hit(34,34,2,270,110,20,5)),
      grab: move(34, 'jab', hit(6,7,0,0,0,0)),
      dashGrab: movingGrab(41,9,5.5,2.5,11), pivotGrab: movingGrab(36,10,5.5,3.1,15.7),
      inhale: move(67, 'suction', hit(10,44,0,0,0,0)),
      swallow: move(20, 'throw', hit(8,8,10,60,50,60)),
      spit: move(30, 'throw', hit(8,8,6,25,65,70)),
      hammer: move(54, 'hammer', hit(26,27,19,48,78,60,0,1.2)),
      cutter: move(9999, 'sword', hit(23,26,5,85,100,0,0,1,85), hit(41,49,2,275,100,0,1,1,96), hit(50,9999,2,361,180,30,2)),
      cutterLand: move(30, 'sweep'),
      stone: move(9999, 'body', hit(29,9999,18,70,76,69,0,.7)),
      stoneLand: move(9999, 'sweep', hit(1,3,14,25,24,86)),
      throwF: move(58, 'throw', hit(45,45,5,75,125,40)),
      throwB: move(49, 'throw', hit(41,41,8,130,120,30)),
      throwU: move(86, 'throw', hit(58,58,10,78,74,75)),
      throwD: move(87, 'throw', hit(58,58,2,63,180,60)),
    },
    jigglypuff: {
      jab: move(16, 'jab', hit(5,6,3,361,25,18,0,1.3)),
      jab2: move(16, 'jab', hit(5,6,3,361,50,50,0,1.7)),
      ftilt: move(24, 'front', hit(7,10,10,361,100,8)),
      utilt: move(24, 'up', hit(9,10,9,96,120,40), hit(11,13,8,88,120,40)),
      dtilt: move(30, 'low', hit(10,12,10,20,68,50)),
      dashAttack: move(39, 'body', hit(5,7,12,43,83,57), hit(8,20,8,43,83,8)),
      fsmash: move(49, 'front', hit(16,19,16,361,110,10), hit(20,24,14,361,85,6)),
      usmash: move(45, 'up', hit(16,19,15,87,100,20)),
      dsmash: move(48, 'sweep', hit(14,16,11,0,99,34)),
      nair: move(43, 'body', hit(6,7,11,361,100,30), hit(8,30,6,361,70,50)),
      fair: move(36, 'front', hit(8,9,9,361,98,30), hit(10,20,6,361,70,30)),
      bair: move(35, 'back', hit(10,11,13,42,120,0,0,1.2)),
      uair: move(39, 'up', hit(9,21,9,88,100,30)),
      dair: move(52, 'down', ...[7,10,13,16,19,22,25,28].map((n,i) => hit(n,n+1,1.5,367,100,10,i,.8)), hit(31,32,2,45,150,30,8,2.2)),
      grab: move(32, 'jab', hit(6,7,0,0,0,0)),
      dashGrab: movingGrab(39,9,5.2,2.8,10.2), pivotGrab: movingGrab(34,10,5.2,3.5,14.5),
      rollout: move(67, 'body', hit(16,36,10,30,60,60)),
      pound: move(39, 'front', hit(13,28,11,75,75,52)),
      sing: move(149, 'song', hit(27,36,0,0,0,0), hit(61,70,0,0,0,0,1), hit(100,115,0,0,0,0,2)),
      rest: move(209, 'core', hit(2,4,20,88,66,100)),
      throwF: move(35, 'throw', hit(12,12,5,35,30,103)),
      throwB: move(49, 'throw', hit(26,26,10,135,25,90)),
      throwU: move(37, 'throw', hit(9,9,8,90,30,130)),
      throwD: move(83, 'throw', hit(62,62,6,75,45,90)),
    },
  };
  moves.kirby.rollout = moves.jigglypuff.rollout;
  const floorAttack=move(45,'sweep',hit(16,17,7,48,48,80),hit(20,21,7,48,48,80));
  moves.kirby.getupAttack=moves.jigglypuff.getupAttack=floorAttack;
  const hammerMax = move(74, 'hammer', hit(26,27,35,361,78,60,0,1.5));
  const airHammerMax = move(74, 'hammer', hit(26,27,28,50,78,60));
  const airHammer = move(71, 'hammer', hit(28,29,16,50,78,60), hit(42,43,16,50,78,60,1));
  const waveStart = hit(1,2,5,70,95,85,0,.7);
  const waveTravel = hit(3,19,6,361,30,60,0,.7);
  const groundStone = hit(11,13,14,25,24,86);
  const vacuum={mouthX:5.4*unit,mouthY:6.8*unit,speedX:.9*unit,speedY:1.2*unit};
  const staleFactors = [.09,.08545,.07635,.0679,.05945,.05035,.04255,.03345,.025];
  function fighter(index,port=index) {
    return {
      index,port,kind: index ? 'jigglypuff' : 'kirby', x: (port ? 46 : -46)*unit,
      y: platforms[port+1].y, face: port ? -1 : 1, vx: 0, vy: 0, kx: 0, ky: 0,
      grounded: true, platform: port+1, jumps: 5, airDodgeUsed: false, fastFall: false,
      action: 'idle', actionFrame: 1, actionLimit: 0, charge: 0, landedStart: true,
      stocks: 3, damage: 0, shieldHP: 50, hitlag: 0, invuln: 0, flower: 0,
      respawnProtection:0, screenKO:null, loupeFrames:0, radarFrames:0, finalMeter:0, finalReady:false, finalSince:0,
      copied: false, copyProtectedUntil:0, caught: -1, hitGroups: [], stale: [], staleScale: 1.05,
      buffer: {}, previous: neutral, stick: neutral, dropFrames: 0, ledgeLock: 0,
      ledgeGrabs:0, ledgeStale:0, airFrames:0,
      tumbling:false, proneFront:false, techPress:-100, techLock:0, techHeld:false,
    };
  }
  function createMatch(firstPlayer=0,seed=Math.floor(Math.random()*4294967296),{finalSmashMeter=true,staleMoves=true,spiritHitlag=false}={}) {
    return {fighters: [fighter(0,firstPlayer), fighter(1,1-firstPlayer)], frame: 0, remaining: 7*60*60,
      winner: null, suddenDeath: false, finalSmashMeter, staleMoves, spiritHitlag, events: [], projectiles: [], seed:seed>>>0};
  }
  function emit(m, f, type, extra = {}) {
    m.events.push({type, x: f.x, y: f.y+.7, fighter: f.index, ...extra});
  }
  function discardCopy(m,f) {
    f.copied=false; f.copyProtectedUntil=0;
    emit(m,f,'loseCopy',{x:f.x,y:f.y+4*unit,face:f.face});
  }
  function addFinalMeter(m,f,amount) {
    if(!m.finalSmashMeter || m.suddenDeath || f.finalReady || final.isActive(f) || f.action==='ko') return;
    f.finalMeter=Math.min(100,f.finalMeter+amount);
    if(f.finalMeter>=100-1e-8) {
      f.finalReady=true; f.finalMeter=100; f.finalSince=m.frame; emit(m,f,'finalReady');
    }
  }
  function damageFighter(m,f,amount,source) {
    f.damage=Math.min(999,f.damage+amount);
    addFinalMeter(m,f,amount*.45);
    if(source) addFinalMeter(m,source,amount*.15);
    if(!f.copied || m.frame<f.copyProtectedUntil || amount<1) return;
    m.seed=(Math.imul(m.seed,1664525)+1013904223)>>>0;
    if(m.seed/4294967296<amount/100) discardCopy(m,f);
  }
  function begin(f, action, limit = 0) {
    f.parryRecovery=action==='idle' && f.action==='parry';
    if(action==='grabRelease')f.releasedVictim=f.action==='grabbed';
    if(action!=='grabbed') f.inhaleOrigin=null;
    if(action!=='grabbed') f.captureMove=null;
    if(action==='stun') f.tumbling=limit+1>=32;
    else if(action!=='fall') f.tumbling=false;
    f.action = action; f.actionFrame = 1; f.actionLimit = limit; f.hidden = false; f.dashFrames=0;
    f.shieldRecoil=false;
    f.hitGroups = []; f.charge = 0; f.landedStart = f.grounded; f.staleScale = null;
  }
  function currentMove(f) {
    if (f.action === 'hammer') {
      if(f.charge===120) return f.landedStart ? hammerMax : airHammerMax;
      if(!f.landedStart) return airHammer;
    }
    return moves[f.kind][f.action];
  }
  function restoreAir(f) { f.jumps = 5; f.fastFall = false; f.airDodgeUsed = false; }
  function releaseGround(f) { f.grounded = false; f.platform = -1; }
  function hangOnLedge(m,f) {
    const [x,y]=ledges[f.kind].hang;
    f.x=f.face*(x-10); f.y=y;
    f.vx=f.vy=f.kx=f.ky=0; f.fullHopFrames=0; restoreAir(f);
    f.ledgeSince=m.frame; f.ledgeContested=false; f.ledgeGrabs++; f.ledgeStale++;
    f.ledgeLag=[19,19,20,21,22,23][f.ledgeGrabs-1];
    f.invuln=f.ledgeGrabs===1?19+clamp(Math.floor(44+.2*Math.min(f.airFrames,300)-44*Math.min(f.damage,120)/120),4,104):0;
    begin(f,'ledge'); emit(m,f,'ledge',{x:-f.face*10,y:0});
  }
  function doJump(m, f, height, fullHop = false) {
    const s = stats[f.kind];
    const groundJump=f.grounded;
    releaseGround(f); f.fastFall = false; f.ky = 0;
    f.shortHop=groundJump && !fullHop;
    f.fullHop=fullHop; f.fullHopFrames=fullHop ? 4 : 0;
    f.vy = (Math.sqrt(2*s.gravity*height)+s.gravity*.5)*unit;
    begin(f,'jump'); emit(m,f,'jump',{y:f.y,air:f.jumps<5});
  }
  function bufferInput(f, input) {
    const stickChanged=(input.x && input.x!==f.previous.x) || (input.y && input.y!==f.previous.y);
    f.mash=stickChanged ? 1 : 0;
    f.stick = input;
    if(f.buffer.taunt && --f.buffer.taunt.life<=0) delete f.buffer.taunt;
    if(input.taunt && input.taunt!==f.previous.taunt) f.buffer.taunt={variant:input.taunt,life:9};
    const moveX=input.moveX ?? input.x ?? 0, moveY=input.moveY ?? input.y ?? 0;
    const lastX=f.previous.moveX ?? f.previous.x ?? 0, lastY=f.previous.moveY ?? f.previous.y ?? 0;
    f.stickAgeX=!moveX || moveX*lastX<=0 ? 0 : (f.stickAgeX||0)+1;
    f.stickAgeY=!moveY || moveY*lastY<=0 ? 0 : (f.stickAgeY||0)+1;
    f.flickX=Math.abs(moveX)>=.8 && f.stickAgeX<3;
    f.flickY=Math.abs(moveY)>=.8 && f.stickAgeY<4;
    for (const button of ['jump','attack','special','smash','grab','shield']) {
      if (f.buffer[button] && --f.buffer[button].life <= 0) delete f.buffer[button];
      if (input[button] && !f.previous[button]) {
        let x=input.x||0, y=input.y||0;
        if(button==='smash' && input.smashX!==undefined) { x=input.smashX; y=input.smashY; }
        else if(input.analog && x && y) {
          if(Math.abs(moveX)>Math.abs(moveY)) y=0; else x=0;
        }
        const flick=button==='attack' && input.analog && (y ? f.flickY : x && f.flickX);
        f.buffer[button] = {x,y,flick,life:9};
        f.mash=1.8;
      }
    }
  }
  function take(f, key) { const v = f.buffer[key]; delete f.buffer[key]; return v; }
  function startMove(m, f, action) {
    begin(f,action);
    if(action==='rollout') {
      f.chargeHold=0; f.rollHit=false; f.rollPhase='charge'; f.rollPhaseFrame=0; f.rollSpeed=0;
    }
    if(action==='stone') f.stoneHP=25;
    if(action==='inhale') { f.sustainFrames=0; f.inhaleReleased=false; }
    emit(m,f,'swing',{move:action});
  }
  function selectMove(f, input, button) {
    const x = input.x, y = input.y;
    if (button === 'special') {
      if (x && !y) f.face = x;
      if (f.kind === 'kirby') return y > 0 ? 'cutter' : y < 0 ? 'stone' : x ? 'hammer' : f.copied ? 'rollout' : 'inhale';
      return y > 0 ? 'sing' : y < 0 ? 'rest' : x ? 'pound' : 'rollout';
    }
    if (!f.grounded) return y > 0 ? 'uair' : y < 0 ? 'dair' : !x ? 'nair' : x === f.face ? 'fair' : 'bair';
    const running = f.action === 'run' && (!x || x===f.face) || f.action==='runBrake' && f.actionFrame<=2;
    if(running && button==='attack' && !y) return 'dashAttack';
    if (x) f.face = x;
    if (button === 'smash') return y > 0 ? 'usmash' : y < 0 ? 'dsmash' : 'fsmash';
    return y > 0 ? 'utilt' : y < 0 ? 'dtilt' : running ? 'dashAttack' : x ? 'ftilt' : 'jab';
  }
  function control(m, f, input) {
    const dir = input.x || 0, up = input.y || 0, a = f.action, n = f.actionFrame;
    if(a==='prone') {
      if(n<26) return;
      if(take(f,'attack') || take(f,'special') || take(f,'smash')) {
        startMove(m,f,'getupAttack'); f.invuln=21;
      } else if(dir) {
        f.rollDir=dir; begin(f,'getupRoll',35);
        const forward=dir===f.face, extra=f.kind==='jigglypuff'?1:0;
        f.invuln=(f.proneFront?(forward?23:28):(forward?18:20))+extra;
      } else if(up>0 || take(f,'jump') || take(f,'shield') || n>=180) {
        begin(f,'getup',29); f.invuln=22;
      }
      return;
    }
    if (a === 'ledge') {
      if(n<=f.ledgeLag) return;
      const data=ledges[f.kind];
      let option, length, protection;
      if(take(f,'jump')) {option='ledgeJump'; length=14; protection=12;}
      else if(take(f,'attack') || take(f,'special') || take(f,'smash')) {option='ledgeAttack'; length=55; protection=data.attackXLU;}
      else if(take(f,'shield') || input.shield || take(f,'grab')) {option='ledgeRoll'; length=45; protection=data.rollXLU;}
      else if(dir===f.face || up>0) {option='climb'; length=data.climb; protection=length-1;}
      else if(up<0 || dir===-f.face || n>f.ledgeLag+360) {option='fall'; length=0; protection=0;}
      if(!option) return;
      const stale=[1,.8,.5,0][Math.min(3,f.ledgeStale-1)];
      f.invuln=stale===.8?Math.ceil(protection*stale):Math.floor(protection*stale);
      f.ledgeLock=44; begin(f,option,length);
      if(option==='ledgeJump') emit(m,f,'jump',{y:f.y,air:false});
      return;
    }
    if (a === 'jumpSquat' && n > 3) {
      const fullHop=!!input.jump && !f.forceShortHop && !f.buffer.attack && !f.buffer.smash;
      doJump(m,f,fullHop ? stats[f.kind].full : stats[f.kind].hop,fullHop);
    }
    if (a==='jab') {
      const kirby=f.kind==='kirby', tap=f.buffer.attack;
      const neutralTap=tap && !tap.x && !tap.y;
      if(n>=(kirby?4:8) && (neutralTap || input.attack && f.hitGroups.length)) {
        take(f,'attack'); startMove(m,f,'jab2'); return;
      }
      if(n>=(kirby?5:12) && input.attack && !tap && !f.hitGroups.length) {
        startMove(m,f,'jab'); return;
      }
    }
    if (a === 'jab2' && f.kind === 'kirby' && n>=5 && (f.buffer.attack || input.attack && f.hitGroups.length)) {
      take(f,'attack'); startMove(m,f,'rapidJab'); return;
    }
    if (a==='rapidJab' && !input.attack && n>=21) { startMove(m,f,'rapidEnd'); return; }
    if (a === 'hold' || a === 'held') {
      if(a==='held' && n<=15) return;
      if (a === 'held' && (up < 0 || f.buffer.special)) {
        take(f,'special'); startMove(m,f,'swallow');
      } else if (a === 'held' && take(f,'attack')) startMove(m,f,'spit');
      else if (a === 'hold' && ((up && up!==f.previous.y) || (dir && dir!==f.previous.x) || (up || dir) && (f.buffer.attack || f.buffer.grab))) {
        take(f,'attack'); startMove(m,f,up>0 ? 'throwU' : up<0 ? 'throwD' : dir===-f.face ? 'throwB':'throwF');
        take(f,'grab'); f.throwOrigin={x:f.x,y:f.y,floor:f.platform};
      } else if (a === 'hold' && (f.buffer.attack || f.buffer.grab)) {
        take(f,'attack'); take(f,'grab');
        const target=m.fighters[f.caught];
        const kirby=f.kind==='kirby';
        begin(f,'pummel',kirby?5:6);
        const damage=(kirby?1:1.3)*1.2*staleScale(m,f,'pummel',false);
        damageFighter(m,target,damage,f);
        f.hitlag=target.hitlag=kirby?10:13;
        emit(m,f,'hit',{target:target.index,...impactAt(hurtCircles(target)[0]),damage,angle:0,face:f.face,kb:0,move:'pummel',strong:false});
      } else if(a==='held') {
        if(dir) f.face=dir;
        f.vx=dir*.045;
        if(f.grounded && take(f,'jump')) { f.vy=.16; releaseGround(f); }
      }
      return;
    }
    if (a === 'shield' && f.shieldStun > 0) { f.shieldStun--; return; }
    if (a === 'shield') {
      if (f.buffer.grab || f.buffer.attack) {
        if(f.shieldGrabPenalty && f.sinceShieldStun<4) { f.sinceShieldStun++; return; }
        take(f,'grab'); take(f,'attack'); startMove(m,f,'grab'); return;
      }
      if (f.buffer.jump) { take(f,'jump'); begin(f,'jumpSquat'); f.forceShortHop=!!input.shortHop; return; }
      if (dir && input.shield && f.flickX) {
        f.rollDir=dir; begin(f,'roll', dir===f.face ? 30 : 35); return;
      }
      if (up<0 && input.shield && f.flickY) { begin(f,'dodge',26); return; }
      if (input.shield || n<=3) { f.sinceShieldStun++; return; }
      f.canParry=f.sinceShieldStun>=3;
      begin(f,'shieldDrop',11); return;
    }
    if (!free.has(f.action)) return;
    const runStart=f.kind==='kirby'?13:14, stepEnd=f.kind==='kirby'?17:19;
    if(a==='run' && f.dashFrames) {
      f.dashFrames=n;
      if(dir!==f.face || Math.abs(input.moveX??dir)<.62) f.stepOnly=true;
      const startup=n-f.dashDelay;
      if(!f.stepOnly && startup>=runStart) f.dashFrames=0;
      else if(startup>stepEnd) begin(f,'idle');
    }
    if((a==='runBrake' || a==='turnRun') && !dir && n>1 && Math.abs(f.vx)<=.001) begin(f,'idle');
    const skidding=f.action==='runBrake' || f.action==='turnRun';
    if (f.grounded && !f.dashFrames && !skidding && f.platform>0 && up<0 && (!input.analog ? !(f.previous.y<0) : f.flickY) && !input.attack && !input.smash && !input.special && !input.shield && !input.taunt && !f.buffer.taunt) {
      f.dropFrames=10; f.y-=.06; releaseGround(f); begin(f,'fall');
    }
    if (take(f,'jump')) {
      if (f.grounded) { begin(f,'jumpSquat'); f.forceShortHop=!!input.shortHop; return; }
      if (f.jumps>0) { f.jumps--; doJump(m,f,stats[f.kind].mid*(.75+.05*f.jumps)); }
    }
    if (f.grounded && f.buffer.grab) {
      take(f,'grab');
      const moving=a==='run' || a==='runBrake' || a==='turnRun';
      const pivot=moving && (dir===-f.face || a==='turnRun' && f.vx*f.face<0);
      if(pivot && dir) f.face=dir;
      if(moving) f.grabOriginX=f.x;
      startMove(m,f,pivot?'pivotGrab':moving?'dashGrab':'grab'); return;
    }
    for (const button of ['special','smash','attack']) {
      const pending=f.buffer[button];
      if(!pending) continue;
      if(f.dashFrames && n<15 && (button==='special' && !pending.x && pending.y<=0 ||
        button==='smash' && (pending.y<0 || !pending.y && n>6))) continue;
      if(skidding && n<5 && !(pending.y>0 && button!=='attack') &&
        !(a==='runBrake' && n<=2)) continue;
      const command = take(f,button);
      if (command) {
        if(button==='special' && !command.x && !command.y && f.finalReady && !m.fighters.some(final.isActive)) {
          begin(f,f.kind==='kirby'?'ultraSword':'puffUp');
          f.finalMeter=0; f.finalReady=false; f.finalPhase='start'; f.finalFrame=f.kind==='kirby'?-1:0; f.finalTarget=-1;
          f.finalHits=[]; f.finalPause=0; f.finalStarted=m.frame;
          f.vx=f.vy=f.kx=f.ky=0; f.hitlag=0; f.invuln=1;
          emit(m,f,'finalStart',{move:f.action}); return;
        }
        const flickSmash=command.flick && f.grounded;
        startMove(m,f,selectMove(f,command,flickSmash?'smash':button));
        f.smashButton=flickSmash?'attack':'smash'; return;
      }
    }
    if (f.grounded && input.shield && !f.dashFrames && !skidding) { take(f,'shield'); begin(f,'shield'); f.shieldStun=0; f.sinceShieldStun=3; f.shieldGrabPenalty=false; return; }
    if(f.grounded && !f.dashFrames && !skidding && f.buffer.taunt) {
      const variant=take(f,'taunt').variant;
      f.tauntVariant=variant;
      f.tauntCancel=f.kind==='kirby' ? (variant==='up'?46:variant==='down'?47:49) : 49;
      const full=f.kind==='kirby' ? (variant==='side'?101:f.tauntCancel) : (variant==='down'?81:variant==='side'?96:104);
      begin(f,'taunt',full);
      if(f.copied) discardCopy(m,f);
      emit(m,f,'taunt',{variant}); return;
    }
    if (!f.grounded && !f.airDodgeUsed && take(f,'shield')) {
      const downSpeed=-(f.vy+f.ky);
      if(f.tumbling && downSpeed>0 && platforms.some(p =>
        f.x>=p.left && f.x<=p.right && f.y>=p.y && f.y-p.y<=downSpeed*7
      )) return;
      f.airDodgeUsed=true; begin(f,'airDodge',dir || up ? 100 : f.kind==='kirby' ? 62 : 63);
      f.vx=dir*.22; f.vy=up*.22; f.fastFall=false; return;
    }
    if (f.grounded) {
      const forward=dir===f.face && Math.abs(input.moveX??dir)>=.62;
      if(f.action==='run' && f.dashFrames) {
        if(dir!==-f.face || (n>6 && n<15) || input.analog && !f.flickX) return;
      } else if(f.action==='run' || f.action==='runBrake' || f.action==='turnRun') {
        if(f.action==='run' && forward) return;
        if(dir===-f.face && Math.abs(input.moveX??dir)>=.60) {
          f.face=dir; begin(f,'turnRun'); return;
        }
        if(f.action==='run') { begin(f,'runBrake'); return; }
        if(f.action==='turnRun' && forward) {
          if(f.vx*f.face>=stats[f.kind].run*unit-.000001) begin(f,'run');
          return;
        }
        if(f.action==='runBrake' && forward && n>=7) { begin(f,'run'); return; }
        if(Math.abs(f.vx)>.001) return;
        begin(f,'idle');
      }
      if(dir && (!input.analog || f.flickX)) {
        const reverse=f.face!==dir;
        f.face=dir; begin(f,'run'); f.dashFrames=1; f.dashDelay=reverse?2:0; f.stepOnly=false;
      } else {
        const next=dir?'walk':up<0?'crouch':'idle';
        if(dir) f.face=dir;
        if(f.action!==next) begin(f,next);
      }
    } else if (f.vy<=0 && f.action==='jump') begin(f,'fall');
  }
  function rolloutMotion(f,input) {
    f.rollPhaseFrame++;
    if(f.rollPhase==='charge') {
      if(f.actionFrame<16) return;
      if(input.special && f.chargeHold<100) {
        f.chargeHold++; f.charge=Math.min(36,f.chargeHold); f.actionFrame=15; return;
      }
      // F16 is the first hold-state frame; the next 35 reach full charge.
      const charge=clamp((f.charge-1)/35,0,1);
      f.rollSpeed=.8+(4-.8)*charge;
      f.rollRemaining=21+Math.round(72*charge);
      f.rollPhase='roll'; f.rollPhaseFrame=1;
    } else if(f.rollPhase==='rebound') return;
    else if(f.rollPhase==='end') {
      f.vx=toward(f.vx,0,(f.grounded?stats[f.kind].brake:.05)*unit); return;
    } else if(f.rollPhase==='turn') {
      // SpecialNTurn checks the previous ground speed before advancing STOP.
      // All four floors here have a vertical normal and normal traction.
      if(!f.grounded || f.vx*Math.sign(f.rollTurnVx)>-Math.abs(f.rollTurnVx)*.25) {
        if(f.grounded) f.vx-=f.rollTurnVx*.05*.9;
        else f.vx=Math.sign(f.vx)*Math.max(unit,Math.abs(f.vx)-.05*unit);
        f.rollRemaining=Math.max(0,f.rollRemaining-1);
        return;
      }
      f.rollPhase='roll'; f.rollPhaseFrame=1; f.hitGroups=[];
    }
    if(f.rollRemaining===0) {
      f.rollPhase='end'; f.rollPhaseFrame=1;
      f.vx*=.6; f.vy*=.8;
      // UFD records the first controllable frame at 68 for a tap and 175
      // for an earliest full release (the final active frame overlaps recovery).
      const endFrames=f.grounded || f.kind==='kirby'?31:36;
      f.actionLimit=f.actionFrame+endFrames-1-(f.charge===36?1:0); return;
    }
    if(f.rollPhaseFrame>1 && input.x===-f.face && f.grounded) {
      f.rollSpeed=Math.max(1,f.rollSpeed-.05);
      f.rollTurnVx=f.face*f.rollSpeed*unit; f.vx=f.rollTurnVx;
      f.face=-f.face; f.rollPhase='turn'; f.rollPhaseFrame=1; f.rollRemaining--; return;
    }
    if(!f.grounded) f.rollSpeed=Math.max(1,f.rollSpeed-.05);
    f.vx=f.face*f.rollSpeed*unit; f.rollRemaining--;
  }
  function specialMotion(m, f, input) {
    const a = f.action, n = f.actionFrame;
    if (a in smashHold) {
      const hold = smashChargeFrame(f);
      if(n===hold && input[f.smashButton||'smash'] && f.charge<120) { f.charge++; f.actionFrame--; }
      if(a==='fsmash' && n===(f.kind==='kirby'?11:14)) f.vx=f.face*.13;
    }
    if(a==='hammer' && n===16) {
      if(input.special) { f.charge=Math.min(120,f.charge+1); f.actionFrame--; }
      if(f.charge) f.landedStart=f.grounded;
    }
    if(a==='hammer' && f.charge===120 && f.landedStart && n>=17 && n<=25) f.invuln=1;
    if(a==='inhale' && f.caught>=0) {
      f.actionFrame=Math.min(43,n);
    } else if(a==='inhale' && n>=10 && n<=44) {
      const t=m.fighters[1-f.index], ahead=(t.x-f.x)*f.face;
      if(ahead>1 && ahead<3.5 && Math.abs(t.y-f.y)<1 && !t.invuln && t.action!=='ko') t.x-=f.face*.065;
      if(n===44 && input.special) {
        f.sustainFrames++; f.actionFrame--;
      } else if(n===44 && f.sustainFrames) {
        // On a prolonged inhale release, terminate the suction now. Keep
        // the 67-frame minimum from startup and 19-frame release animation.
        f.inhaleReleased=true;
        f.actionLimit=Math.max(67-f.sustainFrames,n+18);
      }
    }
    if(f.caught>=0 && a.startsWith('throw')) {
      const t=m.fighters[f.caught];
      let pummel=0;
      if(f.kind==='kirby' && a==='throwD' && (n===56 || n>=9 && n<=41 && (n-9)%4===0)) pummel=1;
      if(f.kind==='jigglypuff' && a==='throwF' && n===10) pummel=5;
      if(f.kind==='jigglypuff' && a==='throwD' && n===60) pummel=6;
      if(pummel) {
        const damage=pummel*1.2*staleScale(m,f,a,false);
        damageFighter(m,t,damage,f);
        emit(m,f,'hit',{target:t.index,...impactAt(hurtCircles(t)[0]),damage,angle:0,face:f.face,kb:0,move:a,strong:false});
      }
    }
    if(a==='rollout') rolloutMotion(f,input);
    if(a==='pound' && n===12) { f.vx=f.face*.18; if(!f.grounded) f.vy=.04+(input.y||0)*.06; }
    if(a==='cutter') {
      if(n===22) { releaseGround(f); f.vy=.46; f.fastFall=false; }
      if(n>=41) f.vy=-.58;
    }
    if(a==='stone') {
      if(f.landedStart && n===11) emit(m,f,'stone',{y:f.y});
      if(!f.landedStart && n<29) f.vy=.006;
      if(!f.landedStart && n>=29) f.vy=-.66;
    }
    if((a==='stoneLand' || a==='stone') && n>(f.landedStart ? 13 : 29) && (f.buffer.special || n>180)) {
      take(f,'special'); begin(f,'stoneExit',31);
    }
    if(a==='sing' && (n===27 || n===61 || n===100)) emit(m,f,'sing');
    if(a==='roll' && n>=4 && n<=19) f.vx=f.rollDir*.19;
    if((a==='techRoll' || a==='getupRoll') && n>=4 && n<=22) {
      f.vx=f.rollDir*(a==='techRoll'?.19:.16)*Math.sin((n-3)*Math.PI/20);
    }
    if(a==='dashAttack' && n<=13) f.vx=f.face*(f.kind==='kirby' ? .20:.18);
    if(a==='shield') {
      f.shieldHP=Math.max(0,f.shieldHP-.15);
      if(f.shieldHP<=0) breakShield(m,f);
    } else if(a!=='shieldBreak') f.shieldHP=Math.min(50,f.shieldHP+.08);
    if(a==='rest' && n<=27) f.invuln=Math.max(1,f.invuln);
    if(n<=throwInvincibility[f.kind][a]) f.invuln=Math.max(f.invuln,1);
    if(a==='dodge' && n>=3 && n<=17) f.invuln=1;
    if(a==='roll' && n>=(f.rollDir===f.face?4:5) && n<=(f.rollDir===f.face?15:16)) f.invuln=1;
    if(a==='airDodge' && n>=(f.kind==='kirby'?3:4) && n<=(f.actionLimit>80?21:30)) f.invuln=1;
  }
  function breakShield(m,f) {
    // 13.0.1 fighter_param shield_break_y; integrate with the same gravity as jumps.
    const gravity=stats[f.kind].gravity, height=f.kind==='kirby'?34:936.84;
    f.shieldHP=37.5; f.shieldBreakLandFrame=0; f.shieldBreakDizzyFrame=0;
    f.vy=(Math.sqrt(2*gravity*height)+gravity*.5)*unit; releaseGround(f);
    begin(f,'shieldBreak'); emit(m,f,'shieldBreak');
  }
  function motion(m,f,input) {
    const a=f.action, s=stats[f.kind], n=f.actionFrame;
    const axis=input.moveX ?? input.x ?? 0;
    if (a==='ledge' || a==='grabbed' || a==='respawn' || a==='ko') return;
    if((a==='pivotGrab' || a==='dashGrab') && f.grounded) {
      const p=platforms[f.platform];
      if(p) {
        const x=clamp(f.grabOriginX+(a==='dashGrab'?atFrame(dashGrabX[f.kind],n)[0]*f.face:0),p.left,p.right);
        f.vx=x-f.x; f.x=x; return;
      }
    }
    const track=throwTravel[f.kind][a];
    const originalThrow=f.throwOrigin && nativeThrow(f);
    if(a==='throwD' && f.throwOrigin && !originalThrow) {
      const origin=f.throwOrigin, kirby=f.kind==='kirby', release=kirby?58:62;
      const raised=n<release?clamp((n-1)/6,0,1):clamp((release+6-n)/6,0,1);
      const bounce=kirby && n>=9 && n<=45 ? [0,.24,.55,.36][(n-9)%4] : 0;
      f.y=origin.y+raised*(.56+bounce);
      f.vx=f.vy=0; return;
    }
    if((track || originalThrow) && f.throwOrigin) {
      const origin=f.throwOrigin, previousY=f.y;
      let [dx,dy]=originalThrow?[originalThrow[0]*unit,originalThrow[1]*unit]:atFrame(track,n);
      // ThrowKirby's STOP flag holds the floor through the release. The
      // following recoil blends back into its baked vertical travel.
      if(originalThrow && origin.landed && a==='throwU')dy*=clamp((n-58)/6,0,1);
      const x=origin.x+dx*f.face;
      const slam=f.kind==='kirby' ? {throwF:36,throwB:31,throwU:56}[a] : 0;
      let y=origin.y+dy;
      if(origin.fallSpeed) y=previousY+origin.fallSpeed;
      if(slam && !origin.landed && n>5 && y<previousY && (previousY>origin.y+.02 || n>=slam)) {
        let floor=-1;
        for(let i=0;i<platforms.length;i++) {
          const p=platforms[i];
          if(x>=p.left && x<=p.right && previousY>=p.y && y<=p.y && (floor<0 || p.y>platforms[floor].y)) floor=i;
        }
        if(floor>=0) {
          origin.landed=true; origin.floor=floor; origin.y=platforms[floor].y; y=origin.y;
          if(a==='throwU') emit(m,f,'throwSlam',{x,y});
          f.actionFrame=Math.max(n,slam);
          origin.fallSpeed=0;
        } else if(n>=slam) {
          origin.fallSpeed=y-previousY;
          f.actionFrame=slam-1;
        }
      }
      f.vx=x-f.x; f.vy=y-f.y; f.x=x; f.y=y;
      const p=platforms[origin.floor];
      f.grounded=!!p && Math.abs(y-p.y)<.001 && x>=p.left && x<=p.right;
      f.platform=f.grounded?origin.floor:-1;
      return;
    }
    if(a==='ledgeSnap') {
      if(n>f.snapFrames) hangOnLedge(m,f);
      else {
        const [x,y]=ledges[f.kind].hang, remaining=f.snapFrames+2-n;
        f.x+=(f.face*(x-10)-f.x)/remaining; f.y+=(y-f.y)/remaining;
      }
      return;
    }
    const ledge=ledges[f.kind];
    if(a==='ledgeRoll' || a==='ledgeAttack' || a==='climb' || a==='ledgeJump' && n<=12) {
      let x,y;
      if(a==='ledgeRoll' || a==='ledgeAttack') {
        const track=ledge[a], k=track.findIndex(p=>p[0]>=n), to=track[k], from=track[Math.max(0,k-1)];
        const t=(n-from[0])/Math.max(1,to[0]-from[0]);
        x=from[1]+(to[1]-from[1])*t; y=from[2]+(to[2]-from[2])*t;
      } else {
        const u=clamp((n-1)/(a==='ledgeJump'?11:ledge.climb-8),0,1), t=u*u*(3-2*u);
        x=ledge.hang[0]+((a==='ledgeJump'?0:.82)-ledge.hang[0])*t; y=ledge.hang[1]*(1-t);
      }
      f.x=f.face*(x-10); f.y=y;
      if(a!=='ledgeJump' && x>=0 && Math.abs(y)<.01) {
        f.grounded=true; f.platform=0; f.ledgeGrabs=f.ledgeStale=0;
      }
      if(a==='ledgeJump' && n===12) {
        f.vx=.6*unit*f.face; f.vy=(Math.sqrt(2*s.gravity*ledge.jumpHeight)+s.gravity*.5)*unit;
      }
      return;
    }
    if(f.grounded) {
      if (a==='run') {
        const burst=n-f.dashDelay;
        if(f.dashFrames && burst<=0) f.vx=toward(f.vx,0,s.brake*unit);
        else if(f.dashFrames && burst<=6) f.vx=s.dash*unit*f.face;
        else {
          const target=(f.dashFrames && f.stepOnly?0:axis)*s.run*unit;
          f.vx=toward(f.vx,target,(Math.abs(f.vx)>Math.abs(target)?s.brake:.044+s.runAccel*Math.abs(axis))*unit);
        }
        if(f.dashFrames && n===3+f.dashDelay) emit(m,f,'dash',{y:f.y});
      } else if(a==='turnRun') {
        const turning=f.vx*f.face<0;
        f.vx=toward(f.vx,turning?0:axis*s.run*unit,(turning?2*s.brake:axis?.044+s.runAccel*Math.abs(axis):s.brake)*unit);
      } else if (a==='walk') f.vx=toward(f.vx,s.walk*axis*unit,(.105+.168*Math.abs(axis))*unit);
      else if(a!=='rollout') f.vx=toward(f.vx,0,s.brake*unit);
    } else {
      if(f.fullHopFrames>0 && f.action!=='jump') {
        const remainingHeight=s.full*(.45+.55*f.fullHopFrames/4);
        f.vy=(Math.sqrt(2*s.gravity*remainingHeight)+s.gravity*.5)*unit;
        f.fullHopFrames=0;
      }
      const canDrift=a!=='stun' && a!=='stone' && a!=='sleep' && a!=='shieldBreak' && a!=='airDodge';
      if(canDrift && a!=='rollout' && a!=='ledgeJump' && !(a==='ledgeTrump' && !axis))
        f.vx=toward(f.vx,axis*s.air*unit,(axis?s.airBase+Math.abs(axis)*s.airAccel:s.airBrake)*unit);
      // Accept the apex frame when the remaining upward displacement is
      // under .005 stage units. A strict sign test delayed Kirby's short
      // hop fast fall by one tick against the documented 26-frame arc.
      const atApex=f.action==='jump' && f.vy<=.005*unit;
      const falling=(f.vy<0 || atApex) && !f.fastFall && a!=='stun' && a!=='cutter' && a!=='stone' && a!=='rollout';
      if(falling && input.y<0 && (!input.analog ? !(f.previous.y<0) : f.flickY)) {
        f.fastFall=true;emit(m,f,'fastFall',{x:f.x,y:f.y+1.7});
      }
      // Ultimate covers 55% of full-hop height in its first four frames.
      // The remaining ascent, short hops and air jumps follow normal gravity.
      if(f.fullHopFrames>0) {
        f.vy=s.full*.55*unit/4;
        f.fullHopFrames--;
      } else if(a==='rollout' && f.rollPhase==='rebound') f.vy=Math.max(-2*unit,f.vy-.17*unit);
      else if(a==='rollout' && (f.rollPhase==='roll' || f.rollPhase==='turn')) f.vy=Math.max(-1.2*unit,f.vy-.07*unit);
      else if(f.fastFall) f.vy=-s.fall*1.6*unit;
      else if(a!=='airDodge' || n>12) {
        // A stone dive and Final Cutter set their own terminal speed.
        if(a!=='stone' && a!=='cutter') f.vy=Math.max(-s.fall*unit, f.vy-s.gravity*unit);
        else f.vy-=s.gravity*unit;
      }
    }
    const oldX=f.x, oldY=f.y;
    const launchSpeed=f.tumbling ? Math.hypot(f.kx,f.ky)/unit : 0;
    f.x+=f.vx+f.kx; f.y+=f.vy+f.ky;
    if(f.action==='jump' && n===4 && f.fullHopFrames===0 && f.fullHop) {
      f.vy=(Math.sqrt(2*s.gravity*s.full*.45)+s.gravity*.5)*unit;
    }
    f.kx=toward(f.kx,0,f.kDecayX || .0065); f.ky=toward(f.ky,0,f.kDecayY || .0065);
    if(f.grounded) {
      const floor=platforms[f.platform];
      if(f.shieldRecoil || a==='techRoll' || a==='getupRoll' || (a==='rollout' && f.rollPhase==='turn' && Math.abs(f.vx)<=3.5*unit)) f.x=clamp(f.x,floor.left,floor.right);
      if(f.vx===0) f.shieldRecoil=false;
      if(f.x<floor.left || f.x>floor.right) {
        releaseGround(f);
        if(a==='rollout' && f.rollPhase==='roll') {
          f.rollSpeed=Math.min(3.5,f.rollSpeed); f.vx=f.face*f.rollSpeed*unit;
        }
      }
      return;
    }
    if(f.y<=oldY) {
      for(let i=platforms.length-1;i>=0;i--) {
        const p=platforms[i];
        if((i>0 && f.dropFrames>0) || f.x<p.left || f.x>p.right || oldY<p.y || f.y>p.y) continue;
        const landingFace=f.kx*f.face>0, impactKY=f.ky;
        f.y=p.y; f.vy=0; f.ky=0; f.grounded=true; f.platform=i; restoreAir(f);
        f.ledgeGrabs=f.ledgeStale=0;
        emit(m,f,'land',{y:f.y});
        if(a==='shieldBreak') {
          f.shieldBreakLandFrame=n;
          // DownSpotU, then FuraFuraStartU, both through the last noncancelable frame.
          f.shieldBreakDizzyFrame=n+(f.kind==='kirby'?29:32)+49;
          f.actionLimit=f.shieldBreakDizzyFrame+Math.max(0,Math.ceil(400-f.damage))+32;
        }
        if(f.tumbling) {
          if(a==='stun' && launchSpeed>3 && impactKY<0) {
            // A downward spike above the floor-tech threshold reflects
            // the remaining launch velocity even if shield was timed.
            f.ky=-impactKY*.9; f.kx*=.9; releaseGround(f);
            f.techHeld=false; f.techPress=-100;
            emit(m,f,'knockdown',{x:f.x,y:f.y,bounce:true,untechable:true});
            break;
          }
          const requested=m.frame-f.techPress<11 || (input.shield && f.techHeld);
          f.proneFront=landingFace; f.vx=f.kx=0; f.reactionRemaining=0; f.reactionCarry=0;
          take(f,'shield'); f.techHeld=false; f.techPress=-100;
          if(requested && launchSpeed<=3) {
            f.rollDir=input.x || 0;
            begin(f,f.rollDir?'techRoll':'tech',f.rollDir?40:26);
            f.invuln=20; emit(m,f,'tech',{x:f.x,y:f.y,face:f.rollDir});
          } else {
            begin(f,'prone'); emit(m,f,'knockdown',{x:f.x,y:f.y,untechable:launchSpeed>3});
          }
        } else if(a==='rollout' && f.rollPhase==='rebound') {
          f.vx=0; begin(f,'land',20);
        } else if(a==='rollout' && f.rollPhase==='roll') {
          f.hitGroups=[];
        } else if(a==='cutter' && n>=41) {
          begin(f,'cutterLand');
          m.projectiles.push({kind:'wave',owner:f.index,x:f.x+f.face*.5,y:f.y+.23,vx:f.face*.39,life:19});
          emit(m,f,'wave',{face:f.face,y:f.y});
        } else if(a==='stone') { begin(f,'stoneLand'); emit(m,f,'stone',{y:f.y}); }
        else if(aerials.includes(a)) {
          const lag=aerialLandingLag(f,a,n);
          if(f.kind==='kirby' && a==='dair' && lag===16) begin(f,'dairLand');
          else begin(f,'land',lag);
        } else if(free.has(a) || a==='airDodge' || a==='helpless') begin(f,'land',a==='airDodge'?10:3);
        break;
      }
    }
    // Main island's solid sides taper below the lip. A rising fighter cannot
    // pass through its underside and emerge on the main floor.
    if(!f.grounded && f.y<-.1 && f.y> -4.63 && oldY<0) {
      const wall= f.y>=-1.43 ? 10+f.y*.085 : 9.88+(f.y+1.43)*.43;
      if(Math.abs(f.x)<wall+.14 && Math.abs(oldX)>=wall-.25) {
        f.x=Math.sign(oldX)*(wall+.14); f.vx=0; f.kx=0;
        if(a==='rollout' && f.rollPhase==='roll' && f.face===-Math.sign(oldX)) {
          f.face=-f.face; f.rollSpeed*=.75; f.vx=f.face*f.rollSpeed*unit; f.hitGroups=[];
        }
      } else if(oldY<=-4.63 && Math.abs(f.x)<8.51 && f.y>oldY) { f.y=-4.63; f.vy=0; }
    }
    const edge=Math.sign(f.x), facingIn=f.face===-edge;
    const canCatch=(free.has(a) || a==='helpless' || a==='sing') && f.vy<=0 ||
      a==='airDodge' && n>=25 || a==='cutter' && n>=33 && facingIn ||
      a==='pound' && (n>=42 || n>=30 && facingIn) ||
      a==='rollout' && f.rollPhase==='rebound' && f.rollPhaseFrame>=41 && facingIn;
    if(!f.grounded && !f.ledgeLock && f.ledgeGrabs<6 && canCatch && input.y!==-1 &&
       Math.abs(f.x)>=9.85 && Math.abs(f.x)-10<(facingIn?2.05:1.23) && f.y<.06 && f.y> -3.25) {
      f.face=-edge; f.vx=f.vy=f.kx=f.ky=0;
      const [,y]=ledge.hang;
      // A lower approach travels through up to two vulnerable snap frames.
      f.snapFrames=clamp(Math.ceil((y-f.y)/.6),0,2);
      if(f.snapFrames) { f.invuln=0; begin(f,'ledgeSnap'); } else hangOnLedge(m,f);
    }
  }
  function aerialLandingLag(f,a,n) {
    const idx=aerials.indexOf(a);
    const starts=f.kind==='kirby'?[3,9,2,7,17]:[3,3,3,3,0];
    const ends=f.kind==='kirby'?[49,41,32,20,48]:[40,28,26,35,42];
    return n<=starts[idx] || n>=ends[idx]?3:stats[f.kind].landing[idx];
  }
  const shapes = { // [horizontal center, height, horizontal radius, vertical radius]
    jab:[.82,.78,.50,.37], front:[.94,.74,.70,.52], low:[.86,.31,.72,.32],
    back:[-.90,.76,.72,.53], up:[-.16,1.30,.79,.85], down:[.05,-.08,.66,.58],
    body:[.12,.76,.87,.77], sweep:[0,.34,1.46,.45], hammer:[1.12,.94,.91,.85],
    sword:[.55,1.00,.70,1.12], suction:[1.12,.83,.85,.68], song:[0,.70,14*unit,14*unit],
    core:[0,.69,.21,.33],
  };
  function guardRadius(f,perfect) {
    const full=(f.kind==='kirby'?9.5*.96:9.6)*unit;
    return perfect ? full : full*(.25+.75*f.shieldHP/50);
  }
  function isParrying(f) { return f.action==='shieldDrop' && f.canParry && f.actionFrame<=5; }
  function touches(f,other,shape,guard=false) {
    if(shape==='throw') return f.caught===other.index;
    const [dx,dy,rx,ry]=shapes[shape];
    const crouching=other.action==='crouch' || other.action==='dtilt';
    const halfHeight=crouching?.35:.68;
    const hurtCenter=other.y+halfHeight+.05;
    const radius=guard ? guardRadius(other,isParrying(other)) : .58;
    const distanceX=(other.x-f.x-dx*f.face)/(rx+radius);
    const distanceY=((guard?other.y+.78:hurtCenter)-f.y-dy)/(ry+(guard?radius:halfHeight));
    return distanceX*distanceX+distanceY*distanceY<=1;
  }
  // Each position is in stage coordinates. The neutral sample uses the last
  // jab frame, when the fist and torso have returned to their resting pose.
  function hurtCircles(f,guard=false) {
    if(guard) return [{x:f.x,y:f.y+.78,r:guardRadius(f,isParrying(f))}];
    const poses=globalThis.SmashHurt?.[f.kind];
    if(!poses) return [{x:f.x,y:f.y+.75,r:.62}];
    let track=poses[f.action], frame=f.actionFrame;
    const floorPose=f.proneFront?poses.getupAttack:poses.getupAttackUp;
    if(f.action==='getupAttack') track=floorPose;
    if(!track) {
      if(f.action==='prone' || f.action==='getup' || f.action==='getupRoll' || f.action==='techRoll') {
        track=floorPose; frame=f.action==='prone'?1:Math.min(15,frame);
      } else if(f.action==='crouch' || f.action==='jumpSquat' || f.action==='land') {
        track=poses.dtilt; frame=1;
      } else if(!f.grounded) {
        track=poses.fair; frame=1;
      } else {
        track=poses.jab; frame=track[track.length-1][0];
      }
    }
    let sample=track[0];
    for(const key of track) if(Math.abs(key[0]-frame)<Math.abs(sample[0]-frame)) sample=key;
    const scale=unit*(f.kind==='kirby'?.96:1), circles=[];
    for(let i=1;i<sample.length;i+=3) {
      circles.push({x:f.x+f.face*scale*sample[i],y:f.y+scale*sample[i+1],r:scale*sample[i+2]});
    }
    return circles;
  }
  // Find an actual point in the common interval of both shapes along the
  // shortest line from the capsule's axis to the receiver's center.
  function capsulePoint(x1,y1,x2,y2,r,c) {
    const dx=x2-x1, dy=y2-y1, len=dx*dx+dy*dy;
    const u=len ? clamp(((c.x-x1)*dx+(c.y-y1)*dy)/len,0,1) : 0;
    const px=x1+u*dx, py=y1+u*dy, ex=c.x-px, ey=c.y-py;
    const square=ex*ex+ey*ey;
    if(square>(r+c.r)**2) return null;
    if(!square) return {x:px,y:py};
    const d=Math.sqrt(square);
    const uHit=(Math.max(-r,d-c.r)+Math.min(r,d+c.r))/(2*d);
    return {x:px+ex*uHit,y:py+ey*uHit};
  }
  function outlinePoint(poly,c) {
    let inside=false, edge=null;
    for(let i=1,j=poly.length-2;i<poly.length;j=i,i+=2) {
      const x1=poly[j],y1=poly[j+1],x2=poly[i],y2=poly[i+1];
      if(!edge) edge=capsulePoint(x1,y1,x2,y2,0,c);
      if((y1>c.y)!==(y2>c.y) && c.x<(x2-x1)*(c.y-y1)/(y2-y1)+x1) inside=!inside;
    }
    return inside ? {x:c.x,y:c.y} : edge;
  }
  function impactAt(point) {
    return {x:point.x,y:point.y,contactX:point.x,contactY:point.y};
  }
  function releaseGrab(m,holder,target) {
    holder.caught=-1;
    holder.hitlag=target.hitlag=0;
    begin(holder,'grabRelease',29); begin(target,'grabRelease',29);
    target.grabImmuneUntil=m.frame+61;
    if(holder.grabbedAir || holder.grabJumps>=4 || !holder.grounded) {
      releaseGround(target); target.vx=1.2*unit*holder.face;
      target.vy=Math.sqrt(2*stats[target.kind].gravity*27)*unit;
    } else {
      target.y=holder.y; target.grounded=true; target.platform=holder.platform;
      target.vx=1.9*unit*holder.face; target.vy=0;
    }
  }
  function sourceContact(f,other,action,frame,guard=false) {
    const tables=globalThis.SmashRegions;
    if(!tables) return undefined;
    let kind=f.kind, key=action;
    if(action==='rollout') { kind='jigglypuff'; key=f.grounded?'rollout':'airRollout'; }
    if(action==='getupAttack') key=f.proneFront?'getupAttackDown':'getupAttackUp';
    if(action==='stone' && f.landedStart) { key='stoneLand'; frame-=10; }
    if(action==='hammer') {
      if(f.charge===120) key=f.landedStart?'hammerMax':'airHammerMax';
      else if(!f.landedStart) key='airHammer';
    }
    if(action==='cutter') frame=Math.min(58,frame);
    const entry=moves[kind][key]?.boxes ? moves[kind][key] : tables[kind][key];
    if(!entry) return undefined;
    const scale=unit*(f.kind==='kirby'?.96:1);
    const circles=hurtCircles(other,guard).map(c=>({x:(c.x-f.x)*f.face/scale,y:(c.y-f.y)/scale,r:c.r/scale}));
    const centers=entry.centers?.[frame];
    const posed=entry.poses?.[frame] || [];
    let best=null;
    for(let i=0;i<entry.boxes.length;i++) {
      const b=entry.boxes[i];
      if(frame<b[0] || frame>b[1] || (best && best.box[2]<=b[2])) continue;
      if(b[4]==='g' && !other.grounded || b[4]==='a' && other.grounded) continue;
      for(const c of circles) {
        let point=null;
        if(centers) {
          const at=2*b[2], x=centers[at], y=centers[at+1];
          point=capsulePoint(x,y,x,y,b[5],c);
        } else if(b[3]==='top') point=capsulePoint(b[8],b[7],b[11],b[10],b[5],c);
        else if(b[3]==='bust' && action==='sing') point=capsulePoint(0,6.1,0,6.1,b[5],c);
        else for(const outline of posed) {
          if(outline[0]===i && (point=outlinePoint(outline,c))) break;
        }
        if(point) {
          best={box:b,point:{x:f.x+point.x*scale*f.face,y:f.y+point.y*scale}};
          break;
        }
      }
    }
    return best;
  }
  function contact(m,f,t) {
    const a=f.action,n=f.actionFrame;
    if(f.hitlag || t.invuln || ['ko','respawn'].includes(t.action) || a==='inhale' && f.inhaleReleased) return null;
    if(t.action==='prone' && (handGrabs.has(a) || a==='inhale') || handGrabs.has(a) && m.frame<t.grabImmuneUntil) return null;
    const spec=currentMove(f);
    if(!spec && a!=='ledgeAttack') return null;
    let windows=spec?.windows,shape=spec?.shape;
    if(a==='ledgeAttack') {
      const first=f.kind==='kirby'?20:21;
      windows=[hit(first,first+2,f.kind==='kirby'?9:8,45,20,90)]; shape='front';
    }
    if(t.action==='grabbed' && shape!=='throw') return null;
    let frame=n, window;
    if(a==='rapidJab') {
      if(n<6 || n%2) return null;
      frame=6;
    }
    if(a==='rollout') {
      if(f.rollPhase!=='roll' || f.rollSpeed<2) return null;
      frame=16;
    }
    if(a==='stone' && f.landedStart) windows=[groundStone];
    window=windows.find(h=>frame>=h.first && frame<=h.last);
    if(!window) return null;
    const guarding=(t.action==='shield' || isParrying(t)) && shape!=='throw' && !handGrabs.has(a) && a!=='inhale';
    let blocked=false, collision;
    if(guarding) {
      collision=sourceContact(f,t,a,frame,true);
      blocked=!!collision || (collision===undefined && touches(f,t,shape,true));
    }
    if(!blocked) {
      collision=sourceContact(f,t,a,frame);
      if(collision===null || (collision===undefined && !touches(f,t,shape))) return null;
    }
    const box=collision?.box;
    if(box && box.length>12) {
      window={...window,damage:box[12],angle:box[13],growth:box[14],base:box[15],fixed:box[16],lag:box[17]};
    }
    const group=a==='rapidJab'?n:window.group;
    if(f.hitGroups.includes(group)) return null;
    if(a==='sing' && (!t.grounded || t.action==='sleep' || t.action==='shield')) return null;
    if(a==='rapidJab') f.hitGroups.length=0;
    f.hitGroups.push(group);
    let damage=window.damage;
    if(f.shortHop && aerials.includes(a)) damage*=.85;
    if(a in smashHold) damage*=1+.4*Math.min(60,f.charge)/60;
    if(a==='hammer') damage=f.charge===120 ? (f.landedStart?35:28) : damage*(1+.52*f.charge/120);
    if(a==='rollout') damage=Math.floor(f.rollSpeed*5.1);
    let face=a==='bair'?-f.face:f.face;
    if(box?.[18]==='pos') face=Math.sign(t.x-f.x) || face;
    return {f,t,a,h:window,damage,box,face,blocked,point:collision?.point};
  }
  function staleScale(m,f,action,shield) {
    if(!m.staleMoves) return 1;
    if(f.staleScale!==null) return f.staleScale;
    let scale=1;
    f.stale.forEach((last,i)=>{ if(last.action===action) scale-=staleFactors[i]*(last.shield?.85:1); });
    f.stale.unshift({action,shield}); if(f.stale.length>9) f.stale.pop();
    return f.staleScale=scale===1?1.05:scale;
  }
  // Sample the defender's stick as hitstop ends, when the launch still has
  // its original velocity. The last frame is also available for DI.
  function steerLaunch(f,input) {
    f.pendingDI=false;
    const sx=input.moveX ?? input.x ?? 0, sy=input.moveY ?? input.y ?? 0;
    if((!sx && !sy) || f.grounded) return;
    const original=Math.atan2(f.ky,f.kx), sideAngle=Math.atan2(f.ky,Math.abs(f.kx));
    if(Math.abs(sideAngle)<.17) return;
    const angle=original+.17*clamp(sy*Math.cos(original)-sx*Math.sin(original),-1,1);
    const vertical=Math.abs(Math.sin(angle))>Math.sin(65*Math.PI/180);
    const influence=vertical?1:1+sy*(sy>=0?.095:.08);
    const speed=Math.hypot(f.kx,f.ky)*influence;
    f.kx=Math.cos(angle)*speed; f.ky=Math.sin(angle)*speed;
    f.kDecayX=Math.abs(Math.cos(angle))*.051*unit; f.kDecayY=Math.abs(Math.sin(angle))*.051*unit;
  }
  function applyContact(m,c) {
    const {f,t,a,h,damage,face}=c;
    const at=impactAt(c.point || hurtCircles(t)[0]);
    if(handGrabs.has(a) || a==='inhale') {
      f.caught=t.index; begin(t,'grabbed');
      if(handGrabs.has(a)) {
        begin(f,'hold'); f.grabSince=m.frame; f.grabJumps=0; f.vx=0; f.grabbedAir=!t.grounded;
        t.face=-f.face; t.captureMove='hold'; t.captureFrame=1; t.captureFace=f.face; t.captureKind=f.kind;
        f.gripDX=f.kind==='kirby'?1.13:.84; f.gripDY=.05;
        t.x=f.x+f.face*f.gripDX; t.y=f.y+f.gripDY;
      }
      else {
        const offsetX=t.x-f.x,offsetY=t.y-f.y;
        const frames=Math.max(4,Math.ceil(Math.abs(offsetX-f.face*vacuum.mouthX)/vacuum.speedX),
          Math.ceil(Math.abs(offsetY-vacuum.mouthY)/vacuum.speedY));
        t.inhaleOrigin={offsetX,offsetY,age:0,frames};
        releaseGround(t);
      }
      f.holdTimer=a==='inhale' ? Math.max(1,180+1.1*t.damage-f.damage) : Math.floor(90+t.damage*1.7);
      t.vx=t.vy=t.kx=t.ky=0; emit(m,f,'grab',{target:t.index,move:a,...at}); return;
    }
    if(a==='sing') {
      const delta=clamp(f.stocks-t.stocks,-2,2);
      const adjustment=[14,7,0,-18,-26][delta+2];
      const near=c.box ? c.box[2]===0 : Math.abs(t.x-f.x)<9*unit+.4;
      const kb=(t.damage*.14+18)*(near?.4:.3);
      begin(t,'sleep',Math.ceil(70+adjustment+t.damage+25*kb)+59);
      t.vx=t.kx=0; emit(m,t,'sleep',at); return;
    }
    const shield=c.blocked;
    const finalBlow=a==='ultraSword' || a==='puffUp';
    const stale=finalBlow?1:staleScale(m,f,a,shield), raw=damage*stale;
    const copyBonus=a==='rollout' && f.kind==='kirby'?1.2:1;
    let lagMultiplier=h.lag;
    if(a==='hammer' && f.charge===120 && f.landedStart) lagMultiplier=1.5;
    if(shield && lagMultiplier>0) lagMultiplier=Math.max(1,lagMultiplier)*.67;
    const absoluteThrow=a.startsWith('throw') || a==='swallow' || a==='spit';
    // This counter starts on the tick after contact. The contact frame
    // already accounts for the first frame of the game's stop value.
    let stop=Math.floor((raw*.65+6)*lagMultiplier);
    if(m.spiritHitlag && stop>15) stop=Math.floor(stop*.3+10.5);
    stop=Math.min(30,stop);
    if(t.action==='crouch') stop=Math.floor(stop*.67);
    const freeze=absoluteThrow?0:Math.max(0,stop-1);
    if(shield && isParrying(t)) {
      t.hitlag=Math.min(32,freeze+(a==='wave'?8:11));
      if(a!=='wave') f.hitlag=Math.min(35,freeze+14);
      begin(t,'parry',1); t.invuln=1;
      emit(m,t,'parry',{target:f.index,move:a,face,...at}); return;
    }
    if(shield) {
      const shieldBonus=a==='pound'?20:a==='getupAttack'?8:0;
      const shieldDamage=raw*copyBonus;
      t.shieldHP=Math.max(0,t.shieldHP-(shieldDamage+shieldBonus)*1.19);
      const attackType=a==='wave'?.29:aerials.includes(a)?.33:a in smashHold?.725:1;
      const stunScale=a==='rapidJab'?7:attackType;
      t.shieldStun=Math.min(60,Math.floor(shieldDamage*.8*stunScale+3)-1);
      t.shieldDamageFrame=t.actionFrame;
      t.sinceShieldStun=0; t.shieldGrabPenalty=true;
      t.vx=face*Math.min(1.3,(shieldDamage*.8*attackType+3)*.09)*unit;
      t.shieldRecoil=true;
      if(a!=='wave') {f.vx-=face*(shieldDamage*.04+.025)*unit; f.shieldRecoil=f.grounded;}
      t.hitlag=freeze; if(a!=='wave') f.hitlag=freeze;
      emit(m,t,'shieldHit',{target:t.index,move:a,damage:shieldDamage,face,...at});
      if(t.shieldHP===0) breakShield(m,t);
      return;
    }
    const stoneArmor=(t.action==='stoneLand' || t.action==='stone' && t.actionFrame >= (t.landedStart?11:19));
    const pre=t.damage;
    // The one-on-one bonus increases displayed damage; the launch itself
    // uses the unstretched current hit and the victim's pre-hit percent.
    if(stoneArmor) {
      t.stoneHP-=raw;
      if(t.stoneHP>0) {
        t.hitlag=Math.floor(freeze*1.2); if(a!=='wave') f.hitlag=t.hitlag;
        emit(m,t,'shieldHit',{target:t.index,move:a,face,damage:raw,...at}); return;
      }
    }
    const dealt=raw*(finalBlow?1:1.2)*copyBonus*(stoneArmor?.5:1); damageFighter(m,t,dealt,f);
    if(a==='swallow' || a==='spit') {
      const copying=a==='swallow';
      f.caught=-1;
      begin(t,copying?'copyStar':'star',copying?10:Math.min(60,Math.floor(25+.5*pre)));
      releaseGround(t);
      t.starFacing=copying?-f.face:f.face;
      t.starSpeed=copying?3.4:Math.max(0,2.8+.008*(pre-f.damage));
      t.x=f.x+(copying?0:7*unit*f.face); t.y=f.y+7*unit;
      t.vx=t.vy=t.kx=t.ky=0; t.fastFall=false; t.invuln=1; t.pendingDI=false;
      if(copying) { f.copied=true; f.copyProtectedUntil=m.frame+1200; }
      emit(m,f,copying?'copy':'spit',{target:t.index,face:f.face});
      emit(m,f,'hit',{target:t.index,...at,damage:dealt,angle:copying?62:0,face:t.starFacing,kb:0,move:a,strong:false});
      return;
    }
    const hammerArmor=t.action==='hammer' && t.charge===120 && t.landedStart && t.actionFrame>=26 && t.actionFrame<=32;
    if(hammerArmor) {
      t.hitlag=freeze; if(a!=='wave') f.hitlag=freeze;
      emit(m,f,'hit',{target:t.index,...at,damage:dealt,angle:0,face,kb:0,move:a,strong:false}); return;
    }
    const weight=200/(100+stats[t.kind].weight), rage=1+.1*clamp((f.damage-35)/115,0,1);
    const scaledDamage=damage*(1-(1-stale)*.3);
    let kb=h.fixed ? ((1+h.fixed/2)*weight*1.4+18)*h.growth/100+h.base :
      (((pre+raw)*(.1+scaledDamage/20)*1.4*weight+18)*h.growth/100+h.base)*rage;
    if(finalBlow) kb*=a==='ultraSword'?.967:.92;
    let angle=h.angle;
    if(angle===361) angle=t.grounded ? kb<60 ? 0 : clamp(1+(kb-60)*38/28,1,38) : 38;
    if(angle===367) { angle=a==='dair'?266:22; kb=26; }
    if((angle===0 || angle===180) && kb>=120) angle=angle===0?32:148;
    const rad=angle*Math.PI/180;
    
    if(a==='rollout') {
      f.rollHit=true; f.rollPhase='rebound'; f.rollPhaseFrame=1; f.airDodgeUsed=true; releaseGround(f);
      f.vx=-face*.13*unit; f.vy=2.7*unit; f.fastFall=false;
    }
    if(a==='rest') {
      t.flower=Math.min(3000,t.flower+Math.floor(20+dealt*40));
      t.flowerTick=0; f.actionLimit=186;
    }
    if(a.startsWith('throw')) { f.caught=-1; t.grabImmuneUntil=m.frame+61; }
    const speed=kb*.03*unit, cx=Math.cos(rad)*face, sy=Math.sin(rad);
    const duration=Math.max(4,Math.floor(kb*.4)-1);
    const firstActionable=duration+1, tumble=firstActionable>=32;
    if(t.caught>=0) { const held=m.fighters[t.caught]; begin(held,'fall'); t.caught=-1; }
    begin(t,'stun',duration); t.fastFall=false;
    t.ledgeGrabs=0; t.airFrames=0; t.ledgeLock=30;
    t.reactionRemaining=duration; t.reactionCarry=0;
    t.launchSpeedUp=tumble && !h.fixed ? 1+5*clamp((firstActionable-30)/50,0,1) : 1;
    t.kx=cx*speed; t.ky=sy*speed; t.vx=t.vy=0;
    const flyTop=angle>=70 && angle<=110;
    if(tumble && !flyTop && (sy>0 || !t.grounded)) t.ky+=5*(stats[t.kind].gravity-.075)*unit;
    t.kDecayX=Math.abs(cx)*.051*unit; t.kDecayY=Math.abs(sy)*.051*unit;
    if(t.ky>.001 || t.ky<-.01 && !t.grounded) releaseGround(t);
    else if(t.grounded) t.ky=0;
    t.pendingDI=tumble && !t.grounded;
    if(t.pendingDI && !freeze) steerLaunch(t,t.stick);
    t.hitlag=freeze; if(a!=='wave') f.hitlag=freeze;
    emit(m,f,'hit',{target:t.index,...at,damage:dealt,angle,face,kb,move:a,sfx:c.box?.[19],strong:kb>=100});
  }
  function finalMotion(m,f,t) {
    const puff=f.action==='puffUp', phase=f.finalPhase;
    if(f.finalPause>0) {f.finalPause--;f.invuln=1;return;}
    const last=f.finalFrame;
    // Convert animation frames to game frames. The pop animation frame is held
    // across seven ticks (F169–175). F130–135 is the earlier cry hitbox.
    if(puff && phase==='start') {
      // FinalWait/exec retimes the growing body after its common flag at
      // animation F30. On Dream Land in #18086, darkening to the cry is
      // 241 elapsed frames. The animation reaches F119 after 231 game ticks.
      f.finalFrame=f.actionFrame<=30?f.actionFrame:30+(f.actionFrame-30)*89/201;
    } else if(puff && phase==='attack') {
      const elapsed=f.actionFrame-231;
      f.finalFrame=elapsed<=17?elapsed:elapsed<=50?17+(elapsed-17)*50/33:
        elapsed<=57?67+(elapsed-50)/7:68+elapsed-57;
    } else f.finalFrame+=puff && phase==='end' && last>=90?1.25:1;
    f.invuln=Math.max(1,f.invuln);
    const n=f.finalFrame, limit=puff?(phase==='attack'?120:119):(phase==='attack'?221:89);
    const clock=f.actionFrame;
    const phaseChange=(name)=>{f.finalPhase=name; f.finalFrame=0;};
    const susceptible=t.action!=='ko' && t.action!=='respawn' && (!t.invuln || t.action==='ultraSwordVictim');
    const pointAt=(x,y,r,x2=x,y2=y)=>{
      if(!susceptible) return null;
      for(const c of hurtCircles(t)) {
        const point=capsulePoint(f.x+x*unit*f.face,f.y+y*unit,f.x+x2*unit*f.face,f.y+y2*unit,r*unit,c);
        if(point) return point;
      }
      return null;
    };
    if(puff && phase!=='end') {
      const [sx,sy,x,y]=final.puffBone(f);
      const face=Math.sign(t.x-f.x)||f.face;
      if(phase==='start' && n>=30 && clock%2===0) {
        const r=n>=92?5.4:n>=57?4.4:n>=50?3.5:3;
        // Final(Air)Start: the rot-bone windbox switches between a sphere
        // and horizontal/vertical capsules. Its flinchless fixed knockback is 75.
        const halfWidth=(n>=50 && n<57) || (n>=74 && n<92)?sx:0;
        const low=n>=50 && n<74?-sy:0, high=n>=57 && n<74?3.2*sy:low;
        if(pointAt(x-halfWidth,y+low,r*sx,x+halfWidth,y+high)) {
          const kb=(1+75/2)*200/(100+stats[t.kind].weight)*1.4+18;
          t.kx=face*kb*.03*unit; t.kDecayX=.051*unit;
        }
      } else if(phase==='attack' && t.y+1.2>=f.y) {
        const early=n>=11 && n<17, pop=n>=67 && n<68;
        const group=early?'cry':pop?'pop':null;
        if(group && !f.finalHits.includes(group)) {
          const row=early?[-1.5,-1,1.8,4.5]:[-2,1.6,2.3,6.9];
          const point=pointAt(x+row[0]*sx,y+row[1]*sy,row[3]*sx,x+row[2]*sx,y+row[1]*sy);
          if(point) {
            const power=f.finalDamageScale??1;
            const h=early?hit(0,0,7*power,60,80,40,0,0,10):hit(0,0,17.5*power,50,65,60,1,0);
            f.finalHits.push(group);
            applyContact(m,{f,t,a:'puffUp',damage:h.damage,h,face,point});
          }
        }
      }
    }
    if(!puff) {
      const meterPower=.7*(f.finalDamageScale??1);
      let point=null, power=0;
      // The opening electric catch is already visible on action F17, one tick
      // before the zero-based pose counter reaches sample 17.
      if(phase==='start' && clock>=17 && clock<20 && !f.finalHits.includes('close')) {
        point=pointAt(15*.96,8*.96,10*.96);
        if(point) {f.finalHits.push('close');power=3;}
      }
      if(phase==='start' && n>=54 && n<61 && !f.finalHits.includes('blade')) {
        const row=final.bladeHit[Math.floor(n)-54];
        for(let i=1;i<row.length;i+=2) {
          point=pointAt(row[i]*.96,row[i+1]*.96,(i===7 && n>=58?8:9)*.96);
          if(point) break;
        }
        if(f.finalTarget===t.index || point) {f.finalHits.push('blade');power=5;}
      }
      if(power) {
        if(f.finalTarget<0) {
          f.finalTarget=t.index;
          if(t.caught>=0) {begin(m.fighters[t.caught],'fall');t.caught=-1;}
          begin(t,'ultraSwordVictim'); releaseGround(t); t.hitlag=0; t.vx=t.vy=t.kx=t.ky=0;
          t.finalCatchX=t.x; t.finalCatchY=t.y; 
          emit(m,f,'finalCatch',{target:t.index,move:f.action});
        }
      } else if(phase==='attack' && final.slashes.some(at=>last<at && n>=at)) power=2.6;
      if(power) {
        const dealt=power*meterPower; damageFighter(m,t,dealt,f);
        // The selected 60 Hz match holds the connecting opener for one tick
        // and the eight rapid sword sweeps for two more ticks per hit.
        if(power===5) f.finalPause=1;
        else if(phase==='attack') f.finalPause=2;
        emit(m,f,'hit',{target:t.index,...impactAt(point||hurtCircles(t)[0]),damage:dealt,angle:0,face:f.face,kb:0,move:'ultraSword',strong:false});
      }
      if(t.action==='ultraSwordVictim') {
        const blend=phase==='attack'?1:clamp((n-17)/62,0,1);
        t.x=t.finalCatchX+(f.x+34*unit*f.face-t.finalCatchX)*blend;
        t.y=t.finalCatchY+(f.y+.25-t.finalCatchY)*blend; t.invuln=1;
      }
      if(phase==='attack' && last<173 && n>=173 && t.action==='ultraSwordVictim') {
        t.invuln=0;
        const h=hit(0,0,16*meterPower,45,95,75,0,.5);
        applyContact(m,{f,t,a:'ultraSword',damage:h.damage,h,face:f.face});
        f.hitlag=0; f.finalTarget=-1;
      }
      if(phase==='start' && f.finalTarget>=0 && n>=80) {phaseChange('attack');return;}
    }
    if(n<limit) return;
    if(puff && phase==='start') phaseChange('attack');
    else if(puff && phase==='attack') phaseChange('end');
    else {
      emit(m,f,'finalEnd',{move:f.action});
      f.finalDamageScale=1;
      begin(f,f.grounded?'idle':'fall'); f.finalPhase=null; f.finalFrame=0; f.finalTarget=-1;
    }
  }
  function progress(m,f,input) {
    if(final.isActive(f) || f.action==='ultraSwordVictim') return;
    if(f.action==='taunt' && f.actionFrame>f.tauntCancel &&
      (input.x || input.y || input.shield || Object.keys(f.buffer).length)) begin(f,'idle');
    if(f.action==='grabbed') return;
    if(f.action==='star' || f.action==='copyStar') {
      const copying=f.action==='copyStar', angle=copying?62*Math.PI/180:0;
      if(!copying && f.mash) f.actionLimit=Math.max(4,f.actionLimit-10*f.mash);
      if(f.actionFrame<=f.actionLimit && (copying || f.starSpeed>=.4)) {
        f.x+=f.starFacing*Math.cos(angle)*f.starSpeed*unit;
        f.y+=Math.sin(angle)*f.starSpeed*unit;
        f.starSpeed-=copying?.17:.05; f.invuln=1; return;
      }
      begin(f,'fall'); f.vx=.73*unit*f.starFacing; f.vy=2.3*unit;
      return;
    }
    if(f.action==='sleep') {
      // The last 59 frames are the uninterruptible wake-up animation.
      if(f.actionLimit-f.actionFrame>59) f.actionLimit=Math.max(f.actionFrame+59,f.actionLimit-f.mash*8);
    }
    if(f.action==='shieldBreak' && f.shieldBreakLandFrame && f.actionFrame>=f.shieldBreakDizzyFrame) {
      // Each stick change removes 3 and each button press 5.4 frames; the
      // 33-frame native recovery remains vulnerable after the dizzy time runs out.
      if(f.actionLimit-f.actionFrame>32) f.actionLimit=Math.max(f.actionFrame+32,f.actionLimit-3*f.mash);
    }
    if(f.action==='ko') {
      if(f.screenKO) return;
      if(f.actionFrame>60 && f.stocks>0) {
        const stocks=f.stocks, finalMeter=f.finalMeter;
        const other=m.fighters[1-f.index], occupied=other.action==='respawn' && other.x===0;
        Object.assign(f,fighter(f.index,f.port),{stocks,finalMeter,x:(occupied?36:0)*unit,y:130*unit,platform:-1,grounded:false,invuln:1});
        begin(f,'respawn'); emit(m,f,'respawn');
      }
      return;
    }
    if(f.action==='respawn') {
      // Ordinary blast KO: 60 frames before the platform, then 60 descending.
      // Dream Land's upper camera boundary and revival height are 130 and 80.
      const elapsed=f.actionFrame-1;
      f.y=(130-50*Math.min(1,elapsed/60))*unit;
      const waited=elapsed-60;
      const leave=input.x || input.y || input.jump || input.attack || input.special || input.smash;
      if(waited<0 || (waited<240 && !leave)) { f.invuln=1; return; }
      begin(f,'fall');
      // common.prc gives 60 base + 60 bonus frames. Only the latter half
      // of the 240-frame optional stay spends the bonus, at half speed.
      f.respawnProtection=120-clamp(Math.floor((waited-119)/2),0,60);
    }
    if(f.action==='stun' && f.reactionRemaining>0) {
      // Ultimate's launch speed-up consumes more of the trajectory just
      // after hitstop, converging to ordinary time in late hitstun.
      // The reaction counter includes the first actionable frame. The stored
      // duration counts only the preceding frames of hitstun.
      const ratio=clamp(((f.reactionRemaining+1)/(f.actionLimit+1)-.3)/.7,0,1);
      const elapsed=Math.min(f.reactionRemaining,Math.max(1,f.launchSpeedUp*ratio));
      f.reactionRemaining-=elapsed; f.reactionCarry+=elapsed;
      while(f.reactionCarry>=.99999 && f.action==='stun') { f.reactionCarry--; motion(m,f,input); }
      return;
    }
    if(f.action==='stun') begin(f,f.grounded?'idle':'fall');
    const spec=currentMove(f);
    const limit=f.actionLimit || (f.action==='rollout'?0:spec?.frames) || 0;
    // The first punch is already interruptible while its link into the second
    // is still open. Movement or another command takes the normal FAF.
    const jabLink=f.action==='jab' && f.actionFrame<=30 && !input.x && !input.y &&
      !input.shield && Object.keys(f.buffer).every(key=>key==='attack');
    if(limit && f.actionFrame>limit && !jabLink) {
      const old=f.action;
      if(old==='bair' && f.kind==='jigglypuff') f.face=-f.face;
      if(old==='pummel') begin(f,'hold');
      else begin(f,f.grounded?'idle':'fall');
      
    }
    control(m,f,input);
    if(final.isActive(f)) return;
    specialMotion(m,f,input); motion(m,f,input);
  }
  function resolveStock(m,f) {
    const side=f.x<stageBounds.blast.left || f.x>stageBounds.blast.right;
    const launchSpeed=f.action==='shieldBreak'?f.vy:Math.hypot(f.kx,f.ky);
    let top=f.y>stageBounds.blast.top && launchSpeed>=2.4*unit, bottom=f.y<stageBounds.blast.bottom;
    if(f.screenKO) {
      // The additional 88 frames precede the ordinary 60+60 revival.
      if(f.actionFrame===31) emit(m,f,'screenImpact');
      if(f.actionFrame<=88) return;
      f.screenKO=null; f.y=-140*unit; f.vx=f.kx=f.ky=0; f.vy=-1;
      top=false; bottom=true;
    } else {
      if(f.action==='ko' || (!side && !top && !bottom)) return;
      if(top && !side && m.remaining>=300 && !f.hidden) {
        m.seed=(Math.imul(m.seed,1664525)+1013904223)>>>0;
        // Conditional screen-KO odds have no published parameter; sample
        // one third of eligible exits in this two-fighter ruleset.
        if(m.seed/4294967296<1/3) {
          m.seed=(Math.imul(m.seed,1664525)+1013904223)>>>0;
          const min=f.kind==='kirby'?10:30, angle=min+(180-2*min)*m.seed/4294967296;
          f.screenKO={angle,side:f.x===0?-f.face:Math.sign(f.x)};
          f.hitlag=0; begin(f,'ko'); emit(m,f,'screenKO'); return;
        }
      }
    }
    const direction=side ? Math.sign(f.x) : 0;
    emit(m,f,'ko',{x:f.x,y:f.y,face:direction,vx:f.kx+f.vx,vy:f.ky+f.vy,top,bottom});
    if(f.caught>=0) { begin(m.fighters[f.caught],'fall'); f.caught=-1; }
    f.stocks--; f.hitlag=0; begin(f,'ko');
    if(f.finalReady) {f.finalReady=false; f.finalMeter=f.stocks<m.fighters[1-f.index].stocks?90:60;}
  }
  function suddenDeath(m) {
    m.suddenDeath=true; m.remaining=60*60; m.projectiles=[];
    for(const f of m.fighters) Object.assign(f,fighter(f.index,f.port),{damage:300,stocks:1});
    m.events.push({type:'suddenDeath',x:0,y:0,fighter:-1});
  }
  function step(m, inputs=[neutral,neutral]) {
    m.events=[]; if(m.winner!==null) return m;
    m.frame++; m.remaining--;
    if(m.finalSmashMeter && !m.suddenDeath) for(const f of m.fighters) {
      if(f.finalReady) {
        const age=m.frame-f.finalSince;
        if(age>=600) f.finalMeter=clamp((1200-age)/6,0,100);
        if(age>=1200) f.finalReady=false;
      } else if(m.frame%15===0) addFinalMeter(m,f,.05);
    }
    const frozen=m.fighters.map(f=>f.hitlag>0);
    const starter=m.fighters.find(f=>final.isActive(f) && f.finalPhase==='start');
    for(const f of m.fighters) {
      const input=inputs[f.index] || neutral;
      bufferInput(f,input);
      if(frozen[f.index] && f.action==='pummel') { take(f,'attack'); take(f,'grab'); }
      if(!input.shield) f.techHeld=false;
      if(input.shield && !f.previous.shield && m.frame>=f.techLock) {
        f.techPress=m.frame; f.techLock=m.frame+40; f.techHeld=f.tumbling;
      }
      const slow=starter && starter!==f && starter.actionFrame<=(starter.kind==='kirby'?50:120) &&
        (m.frame-starter.finalStarted)%(starter.kind==='kirby'?4:7)!==0;
      if(!frozen[f.index] && !slow) {
        f.motionTicks=(f.motionTicks||0)+1;
        if(f.grounded) f.airFrames=0;
        else if(f.action!=='ledge') f.airFrames++;
        if(f.invuln>0) f.invuln--;
        if(f.respawnProtection>0) f.respawnProtection--;
        if(f.dropFrames>0) f.dropFrames--;
        if(f.ledgeLock>0) f.ledgeLock--;
        if(f.flower>0) {
          f.flower=Math.max(0,f.flower-1-16*f.mash);
          if(++f.flowerTick===21) { damageFighter(m,f,1); f.flowerTick=0; }
        }
        f.actionFrame++; progress(m,f,input);
        f.invuln=Math.max(f.invuln,f.respawnProtection);
      }
      f.previous=input;
    }
    // A buffered exit outranks a trump. With simultaneous grabs the higher
    // controller port keeps hold, even when its fighter updates first.
    const [left,right]=m.fighters;
    if(left.action==='ledge' && right.action==='ledge' && left.face===right.face) {
      const first=left.ledgeSince===right.ledgeSince?(left.port<right.port?left:right):
        (left.ledgeSince<right.ledgeSince?left:right);
      first.ledgeContested=true;
    }
    for(const f of m.fighters) {
      if(f.action!=='ledge' || !f.ledgeContested || f.actionFrame<=f.ledgeLag) continue;
      f.invuln=0; f.ledgeLock=44; begin(f,'ledgeTrump',28);
      f.vx=-f.face*.9*unit; f.vy=stats[f.kind].gravity*20*unit;
      emit(m,f,'ledgeTrump');
    }
    for(const f of m.fighters) {
      if(f.caught<0) continue;
      const other=m.fighters[f.caught];
      if(f.action==='inhale') {
        const from=other.inhaleOrigin;
        if(!frozen[f.index] && !frozen[other.index]) from.age++;
        other.x=f.x+toward(from.offsetX,f.face*vacuum.mouthX,vacuum.speedX*from.age);
        other.y=f.y+toward(from.offsetY,vacuum.mouthY,vacuum.speedY*from.age);
        if(from.age>=from.frames) {
          begin(f,'held'); other.hidden=true; f.invuln=Math.max(f.invuln,15);
        }
        continue;
      }
      if(f.action==='held' && f.actionFrame>15) {
        f.holdTimer-=1+other.mash*12;
        if(f.holdTimer<=0) {
          f.caught=-1; begin(f,'land',12); begin(other,'fall');
          other.invuln=12; other.vy=.12; releaseGround(other); continue;
        }
      }
      if(f.action==='held' || f.action==='spit' || f.action==='swallow') {
        other.x=f.x+.08*f.face; other.y=f.y+.13; continue;
      }
      const victimInput=inputs[other.index] || neutral;
      if(f.action==='hold' || f.action==='pummel') {
        if(victimInput.jump && other.buffer.jump?.life===9) f.grabJumps++;
        f.holdTimer-=1+other.mash*8;
        if(f.holdTimer<=0 && m.frame-f.grabSince>=19) { releaseGrab(m,f,other); continue; }
      }
      const a=f.action,n=f.actionFrame;
      // The capture anchor follows the holder's hand to the release side.
      let dx=f.kind==='kirby'?1.13:.84,dy=.05;
      const authored=nativeThrow(f);
      if(authored) {
        dx=authored[2]*unit;dy=authored[3]*unit;
      } else if(a==='throwB') {
        if(f.kind==='kirby') [dx,dy]=atFrame([[1,1.13,.05],[19,.85,.04],[27,.1,.70],[36,-.65,-.32],[41,-.65,-.32]],n);
        else [dx,dy]=atFrame([[1,.84,.05],[7,.55,.28],[14,-.40,.66],[20,-.79,-.12],[26,-.81,-.30]],n);
      } else if(a==='throwF' && f.kind==='kirby') {
        [dx,dy]=atFrame(forwardCapture,n);
      } else if(a==='throwF') {
        [dx,dy]=atFrame([[1,.84,.05],[8,.78,.05],[10,1.16,.10],[12,1.28,.12]],n);
      } else if(a==='throwU') {
        const t=clamp((n-2)/6,0,1); dx*=1-t; dy+=t*.92;
      } else if(a==='throwD') {
        const t=clamp((n-1)/6,0,1);
        dx+=(f.kind==='kirby'?.25-dx:-.62-dx)*t; dy=f.throwOrigin.y-f.y;
      }
      other.captureMove=a; other.captureFrame=n; other.captureFace=f.face; other.captureKind=f.kind;
      other.x=f.x+dx*f.face; other.y=f.y+dy; other.face=-f.face;
      const supportingFloor=f.grounded && platforms[f.platform];
      if(supportingFloor && other.x>=supportingFloor.left && other.x<=supportingFloor.right) {
        const floorOffset=authored?authored[4]*unit:0;
        other.y=Math.max(supportingFloor.y-floorOffset,other.y);
      }
      f.gripDX=dx; f.gripDY=other.y-f.y;
      other.grounded=f.grounded; other.platform=f.platform;
    }
    // Collect both contacts before resolving either, so simultaneous hits trade.
    for(const f of m.fighters) if(final.isActive(f)) finalMotion(m,f,m.fighters[1-f.index]);
    const hits=[];
    for(const f of m.fighters) {
      if(frozen[f.index]) continue;
      const c=contact(m,f,m.fighters[1-f.index]); if(c) hits.push(c);
    }
    for(const p of m.projectiles) {
      p.x+=p.vx; p.life--;
      const f=m.fighters[p.owner],t=m.fighters[1-p.owner];
      if(t.invuln || t.action==='ko' || t.action==='respawn' || t.action==='grabbed' && t.inhaleOrigin) continue;
      const early=p.life>=17, face=Math.sign(p.vx), h=early?waveStart:waveTravel;
      const floorY=p.y-.23;
      const x1=p.x+(early?-5.1:-6.1)*unit*face, y1=floorY+(early?5.6:3)*unit;
      const x2=early?x1:p.x-9.6*unit*face, y2=early?y1:floorY+9*unit;
      const r=(early?5:3.8)*unit;
      const guarding=t.action==='shield' || isParrying(t);
      let point=guarding && capsulePoint(x1,y1,x2,y2,r,hurtCircles(t,true)[0]);
      const blocked=!!point;
      if(!point) for(const c of hurtCircles(t)) {
        if((point=capsulePoint(x1,y1,x2,y2,r,c))) break;
      }
      if(point) {
        hits.push({f,t,a:'wave',h,damage:h.damage,face,blocked,point}); p.life=0;
      }
    }
    if(hits.length===2 && hits.every(c=>handGrabs.has(c.a))) {
      for(const {f} of hits) {
        begin(f,'grabRelease',15); f.hitlag=10; f.vx=-f.face*1.5*unit;
        damageFighter(m,f,1.2); f.grabImmuneUntil=m.frame+61;
      }
      emit(m,hits[0].f,'grabClash',{target:hits[1].f.index,...impactAt(hits[0].point || hurtCircles(hits[0].t)[0])});
    } else if(hits.length===2 && hits.some(c=>handGrabs.has(c.a)) && hits.some(c=>c.a==='inhale')) {
      applyContact(m,hits.find(c=>c.a==='inhale'));
    } else if(hits.length===2 && hits.some(c=>handGrabs.has(c.a)) && !hits.some(c=>c.a==='wave') && hits[0].f!==hits[1].f) {
      const strike=hits.find(c=>!handGrabs.has(c.a));
      applyContact(m,strike);
      const striker=strike.f;
      begin(striker,'grabRelease',29); damageFighter(m,striker,3.6);
      striker.grabImmuneUntil=m.frame+61;
    } else for(const c of hits) applyContact(m,c);
    m.projectiles=m.projectiles.filter(p=>p.life>0);
    for(const f of m.fighters) {
      if(frozen[f.index]) {
        f.hitlag=Math.max(0,f.hitlag-1);
        if(f.hitlag===0 && f.pendingDI && f.action==='stun') steerLaunch(f,f.stick);
      }
      resolveStock(m,f);
      const box=stageBounds.camera;
      const outside=f.x<box.left || f.x>box.right || f.y+.78>box.top || f.y+.78<box.bottom;
      if(outside && f.action!=='ko' && f.action!=='respawn' && !f.hidden) {
        f.loupeFrames++;
        f.radarFrames=45;
        if(f.loupeFrames%60===0 && f.damage<150)f.damage+=1.2;
      } else {
        f.loupeFrames=0;
        f.radarFrames=f.action==='ko'?0:Math.max(0,f.radarFrames-1);
      }
    }
    const [a,b]=m.fighters;
    if(a.stocks===0 && b.stocks===0) suddenDeath(m);
    else if(a.stocks===0 || b.stocks===0) m.winner=a.stocks===0?1:0;
    else if(m.remaining<=0) {
      if(a.stocks!==b.stocks) m.winner=a.stocks>b.stocks?0:1;
      else if(Math.abs(a.damage-b.damage)>.0001) m.winner=a.damage<b.damage?0:1;
      else suddenDeath(m);
    }
    if(m.winner!==null) emit(m,m.fighters[m.winner],'end');
    return m;
  }
  function cpuInput(m,index) {
    const f=m.fighters[index], opponent=m.fighters[1-index], dx=opponent.x-f.x;
    const dy=opponent.y-f.y, abs=Math.abs(dx), dir=Math.sign(dx), tick=m.frame+index*17;
    const input={x:0,y:0};
    if(f.tumbling && f.vy+f.ky<0 && (Math.floor(tick/60)+index)%3!==0) {
      const floor=platforms.find(p=>p.left<=f.x && p.right>=f.x && f.y>=p.y && f.y-p.y<=.55);
      if(floor) {
        input.shield=true; input.x=Math.abs(f.x)>6?-Math.sign(f.x):tick%2?0:-dir;
        return input;
      }
    }
    if(f.action==='ledge') {
      if(f.actionFrame<f.ledgeLag) return input;
      if(abs<2.35 && opponent.grounded) input.attack=true;
      else if(abs<4.25 && opponent.grounded) input.shield=true;
      else input.x=f.face;
      return input;
    }
    if(f.action==='respawn') { input.x=dir || 1; return input; }
    if(f.action==='held') { input.y=-1; return input; }
    if(f.action==='hold') { input.x=dir||f.face; input.attack=!f.previous.attack; return input; }
    if(f.action==='rollout' && Math.abs(f.x)>7 && f.x*f.face>0) {input.x=-f.face;return input;}
    if(!f.grounded && (Math.abs(f.x)>9.2 || f.y< -1)) {
      input.x=-Math.sign(f.x);
      if(f.action==='stun') { input.y=1; return input; }
      if(!f.ledgeLock && f.ledgeGrabs<6 && f.vy<=0 && Math.abs(f.x)<11.2 && f.y<.08 && f.y> -3.15) return input;
      if(f.vy<.015 && f.jumps>0 && !f.previous.jump) input.jump=true;
      if(f.jumps===0 && f.y< -.65 && free.has(f.action) && tick%3===0) {
        if(f.kind==='kirby') {input.y=1; input.special=true;}
        else if(Math.abs(f.x)>11) input.special=true;
      }
      return input;
    }
    if(dy<-1.9 && f.grounded && f.platform>0) { input.y=tick%12<8?-1:0; return input; }
    if(dy>1.8 || (!f.grounded && dy>.55)) {
      input.x=abs>.8?dir:0;
      if(f.vy<=.012 && tick%7===0) input.jump=true;
      if(dy<2.2 && abs<1.3 && tick%13===3) { input.y=1; input.attack=true; }
      return input;
    }
    if(opponent.action==='ko' || opponent.action==='respawn') { input.x=Math.abs(f.x)>2?-Math.sign(f.x):0; return input; }
    if(f.finalReady && free.has(f.action) && !m.fighters.some(final.isActive) &&
      (f.kind==='jigglypuff'?abs<6 && dy>=-.5:dir===f.face && abs<3 && Math.abs(dy)<1.4)) {
      input.special=!f.previous.special; return input;
    }
    if(abs>1.43) {
      if(Math.abs(f.x)<9.3 || f.x*dir<0 || !f.grounded) input.x=dir;
      if(abs<3.4 && f.grounded && tick%67===12) input.jump=true;
      if(abs<2.45 && tick%29===0) {input.x=dir; input.attack=true;}
      return input;
    }
    const beat=Math.floor(tick/17), choice=(beat*17+Math.floor(tick/93)*7+index*3)%15;
    // Decisions are latched to opportunities; button edges remain available
    // after hitlag and recovery without requiring a random process each frame.
    if(f.grounded && f.face!==dir && abs>.35) {
      input.x=dir; input.moveX=dir*.45; input.analog=true; return input;
    }
    if(tick%17===0 || f.action==='rapidJab' && f.actionFrame<15) {
      if(opponent.action==='shield') input.grab=true;
      else if(choice<5) {input.x=choice<2?0:dir; input.smash=opponent.damage>60 || choice===3; input.attack=!input.smash;}
      else if(choice<8) {input.y=dy>.4?1:-1; input.attack=true;}
      else if(choice<12) {input.y=choice===8?1:choice===9?-1:0; input.x=choice===10?dir:0; input.special=true;}
      else if(choice===12) {input.jump=true; input.x=dir;}
      else if(choice===13) input.grab=true;
      else {input.x=dir; input.smash=true;}
    } else if(choice===4 && tick%17<7 && currentMove(opponent)) input.shield=true;
    return input;
  }
  globalThis.SmashSim={createMatch, step, cpuInput, platforms, stageBounds, currentMove, guardRadius, hurtCircles,throwPoseFrame,smashChargeFrame};
})();

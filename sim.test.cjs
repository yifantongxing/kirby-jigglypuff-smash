const {test} = require('node:test');
const assert = require('node:assert/strict');
require('./hit-regions.js');
require('./native-motions.js');
require('./sim.js');
const {createMatch, step, cpuInput, platforms} = globalThis.SmashSim;

function spar(distance = 1, seed) {
  const match=createMatch(0,seed);
  match.fighters.forEach((f,i)=>Object.assign(f,{x:i*distance, y:0, platform:0}));
  return match;
}
function frames(match, count, left = {}, right = {}) {
  const events=[];
  for(let i=0;i<count;i++) { step(match,[left,right]); events.push(...match.events); }
  return events;
}

test('Kirby jab connects on frame two, freezes both fighters, then releases hitstun',()=>{
  const m=spar(); const [a,b]=m.fighters;
  frames(m,1,{attack:true}); assert.equal(b.damage,0);
  frames(m,1); assert.equal(a.actionFrame,2); assert.equal(b.action,'stun');
  assert.ok(Math.abs(b.damage-1.8*1.05*1.2)<1e-6);
  const before=b.x, freeze=a.hitlag;
  const jabStopValue=Math.floor((.65*1.8*1.05+6)*1.7);
  assert.equal(freeze,jabStopValue-1); frames(m,freeze); assert.equal(b.x,before);
  step(m); assert.ok(b.x>before);
  frames(m,30); assert.ok(b.x>before); assert.equal(b.action,'idle');
  const low=spar(); frames(low,1,{}, {y:-1});
  frames(low,1,{attack:true},{y:-1}); frames(low,1,{}, {y:-1});
  assert.equal(low.fighters[1].hitlag,Math.floor((.65*1.8*1.05+6)*1.7*.67)-1);
});

test('the reconstructed Dream Land back air matches contact, percent, launch and hitstun recovery',()=>{
  for(const [options,damage,release] of [[{staleMoves:false,spiritHitlag:true},106.8,15],[{},107.58,17]]) {
    const m=createMatch(0,18086,options),[kirby,puff]=m.fighters;
    Object.assign(kirby,{x:-5.55,y:platforms[1].y,platform:1,face:-1,action:'crouch',stocks:2});
    const ref=!!options.spiritHitlag;
    Object.assign(puff,{x:ref?-4.10:-4.13,y:ref?6.18:6.38,vx:.20,vy:-.11,grounded:false,platform:-1,action:'fall',actionFrame:30,face:1,damage:91.2});
    for(let n=1;n<=12;n++) {
      const pad=n<12?{x:1,moveX:ref?.44:.90}:{x:1,moveX:.58,moveY:.31};
      if(ref && n===5)Object.assign(pad,{smash:true,smashX:-1,smashY:0});
      step(m,[{jump:true,x:n>=4?1:0,attack:n===7},pad]);
      if(ref && n===11)assert.deepEqual([puff.action,puff.actionFrame],['bair',7]);
    }
    assert.equal(m.events.find(e=>e.type==='hit')?.move,'bair');
    assert.equal(kirby.actionFrame,6);assert.ok(Math.abs(puff.damage-damage)<1e-8);
    const atContact=puff.x;frames(m,release-1);
    assert.equal(puff.x,atContact);step(m);assert.ok(puff.x>atContact);
    if(ref) {
      // 169.18 knockback gives 67 unaccelerated frames to the first action.
      // Ultimate's speed-up formula compresses that to 45 frames.
      frames(m,43);assert.equal(puff.action,'stun');
      step(m);assert.equal(puff.action,'fall');
    }
  }
});

test('neutral attack repeats the opener on whiff, links a second tap, and finishes a complete Vulcan loop',()=>{
  for(const [index,repeat,link] of [[0,5,4],[1,12,8]]) {
    const miss=spar(6), press=[{},{}]; press[index]={attack:true};
    for(let n=1;n<=repeat;n++) step(miss,press);
    assert.deepEqual([miss.fighters[index].action,miss.fighters[index].actionFrame],['jab',1]);
    assert.equal(miss.fighters[1-index].damage,0);

    for(const tapAt of [3,25]) {
      const m=spar(6), f=m.fighters[index], command=[{},{}];
      for(let n=1;n<=Math.max(tapAt,link);n++) {
        command[index]={attack:n===1 || n===tapAt};step(m,command);
      }
      assert.deepEqual([f.action,f.actionFrame],['jab2',1]);
    }
  }
  const m=spar(1), fighter=m.fighters[0], hits=[], swings=[];
  let elapsed=0;
  for(let n=1;n<210 && elapsed<67;n++) {
    if(!fighter.hitlag) elapsed++;
    step(m,[{attack:elapsed<10},{}]);
    for(const e of m.events) {
      if(e.type==='hit') hits.push([elapsed,e.move]);
      if(e.type==='swing') swings.push([elapsed,e.move]);
    }
  }
  assert.deepEqual(swings,[[1,'jab'],[4,'jab2'],[8,'rapidJab'],[28,'rapidEnd']]);
  assert.deepEqual(hits,[[2,'jab'],[6,'jab2'],...[13,15,17,19,21,23,25,27].map(n=>[n,'rapidJab']),[30,'rapidEnd']]);
  assert.equal(fighter.action,'idle');
  const guarded=spar(1), guard=guarded.fighters[1];
  for(let n=0;n<85;n++) {
    step(guarded,[{attack:true},{shield:true}]);
    if(guarded.events.some(e=>e.type==='shieldHit' && e.move==='rapidJab')) {
      assert.equal(guard.shieldStun,3);assert.equal(guard.damage,0);return;
    }
  }
  assert.fail('holding into the shield should reach the rapid jab');
});

test('jab stops at the forward sphere; a tilted kick hits close, tip or neither according to spacing',()=>{
  function strike(distance, tilt) {
    const m=spar(distance);
    frames(m,1,{attack:true,x:tilt?1:0}); frames(m,tilt?4:1);
    return m.fighters[1].damage;
  }
  assert.ok(strike(2.40,false)>0); assert.equal(strike(2.50,false),0);
  assert.ok(Math.abs(strike(1.2,true)-8*1.05*1.2)<1e-6);
  assert.ok(Math.abs(strike(2.7,true)-8*1.05*1.2)<1e-6);
  assert.ok(Math.abs(strike(2.9,true)-7*1.05*1.2)<1e-6);
  assert.equal(strike(3.3,true),0);
  for(const [distance,expected] of [[2.6,12.6],[2.7,0]]) {
    const m=spar(distance);
    frames(m,1,{}, {x:-1,attack:true}); frames(m,6);
    assert.ok(Math.abs(m.fighters[0].damage-expected)<1e-6);
  }
});

test('low stance ducks a passing aerial and a stretched foot can be jabbed outside neutral reach',()=>{
  function passingKick(crouch) {
    const m=spar(1.5);
    Object.assign(m.fighters[1],{y:1.1,grounded:false,platform:-1,action:'fall'});
    frames(m,1,{y:crouch?-1:0},{x:-1,attack:true});
    return frames(m,7,{y:crouch?-1:0}).find(e=>e.type==='hit' && e.fighter===1);
  }
  assert.equal(passingKick(false).move,'fair'); assert.equal(passingKick(true),undefined);
  function jabAtFoot(extend,mirror) {
    const m=spar(2.8*mirror), [kirby,puff]=m.fighters;
    kirby.face=mirror; puff.face=-mirror;
    frames(m,1,extend?{x:mirror,attack:true}:{},{attack:true});
    return frames(m,4).find(e=>e.type==='hit' && e.fighter===1);
  }
  assert.equal(jabAtFoot(false,1),undefined);
  const left=jabAtFoot(true,1), right=jabAtFoot(true,-1);
  assert.equal(left.move,'jab'); assert.ok(left.contactX>1 && left.contactX<2.5);
  assert.equal(left.x,left.contactX); assert.equal(left.y,left.contactY);
  assert.ok(Math.abs(left.x+right.x)<1e-9); assert.ok(Math.abs(left.y-right.y)<1e-9);
});

test('smash clean and late hits follow the frame table and scale with charge and prior damage',()=>{
  // [P1/P2, direction, first active frame, hitlag on a fresh clean hit]
  for(const [i,y,active,freeze] of [[0,0,13,18],[0,1,12,15],[0,-1,7,14],
                                      [1,0,16,15],[1,1,16,15],[1,-1,14,12]]) {
    // Puff's rising head strike starts behind her before arcing up.
    const m=spar(i===1 && y===1 ? -.55 : .55), press=[{},{}]; press[i]={smash:true,y};
    step(m,press); frames(m,active-2); assert.equal(m.fighters[1-i].damage,0);
    step(m); assert.ok(m.fighters[1-i].damage>0); assert.equal(m.fighters[i].hitlag,freeze);
  }
  // On F12 the raised toe reaches Puff at this spacing, while the closer
  // 15% knee and foot spheres miss. Beyond the toe the kick misses entirely.
  for(const [distance,base] of [[2.2,14],[2.5,0]]) {
    const m=spar(distance); frames(m,1,{smash:true,y:1}); frames(m,11);
    assert.ok(Math.abs(m.fighters[1].damage-base*1.05*1.2)<1e-6);
  }
  // Falling into Kirby's second sweep first contacts its weaker hit on F12.
  for(const mirror of [1,-1]) {
    const m=spar(-1.5*mirror);
    m.fighters[0].face=mirror;
    Object.assign(m.fighters[1],{face:-mirror,y:2.25,vy:-.1,grounded:false,platform:-1,action:'fall'});
    frames(m,1,{smash:true,y:-1}); frames(m,10);
    assert.equal(m.fighters[1].damage,0);
    assert.ok(Math.abs(frames(m,1).find(e=>e.type==='hit').damage-10*1.05*1.2)<1e-6);
  }
  function smash(charge, percent) {
    const m=spar(); m.fighters[1].damage=percent;
    frames(m,charge || 1,{smash:true});
    return frames(m,60).find(e=>e.type==='hit');
  }
  const clean=smash(0,0), charged=smash(64,0), high=smash(0,100);
  assert.ok(Math.abs(charged.damage/clean.damage-1.4)<1e-5); assert.ok(high.kb>clean.kb*2);
});

test('shield release parries through frame five, shielding blocks damage, and a grab bypasses it',()=>{
  const m=spar(); frames(m,1,{attack:true},{shield:true});
  assert.ok(frames(m,1,{},{shield:true}).some(e=>e.type==='shieldHit'));
  assert.equal(m.fighters[1].damage,0); assert.ok(m.fighters[1].shieldHP<49);
  for(const releaseFrame of [1,5,6]) {
    const guard=spar(); const [attacker,defender]=guard.fighters;
    for(let n=1;n<=3+releaseFrame;n++) {
      step(guard,[{attack:n===2+releaseFrame},{shield:n<=3}]);
    }
    if(releaseFrame===6) assert.ok(defender.damage>0);
    else {
      assert.ok(guard.events.some(e=>e.type==='parry')); assert.equal(defender.damage,0);
      assert.equal(attacker.hitlag-defender.hitlag,3); assert.ok(defender.shieldHP>49);
    }
  }
  const g=spar(); frames(g,1,{grab:true},{shield:true}); frames(g,5,{},{shield:true});
  assert.deepEqual(g.fighters.map(f=>f.action),['hold','grabbed']);
  frames(g,58,{y:1}); assert.equal(g.fighters[1].action,'stun'); assert.ok(g.fighters[1].ky>0);
});

test('a broken shield launches Puff out of Dream Land and leaves Kirby dizzy for 400 minus damage',()=>{
  const puff=spar(9,343), airborne=puff.fighters[1];
  airborne.shieldHP=.1;
  assert.ok(frames(puff,1,{},{shield:true}).some(e=>e.type==='shieldBreak'));
  assert.ok(frames(puff,100).some(e=>e.type==='ko')); assert.equal(airborne.stocks,2);
  for(const percent of [0,300,400]){
    const m=spar(9,343),k=m.fighters[0]; k.shieldHP=.1; k.damage=percent;
    frames(m,1,{shield:true}); assert.equal(k.shieldHP,37.5);
    while(!k.shieldBreakLandFrame && m.frame<120) frames(m,1);
    assert.ok(k.shieldBreakLandFrame); assert.equal(k.stocks,3);
    assert.equal(k.actionLimit+1-k.shieldBreakDizzyFrame,400-percent+33);
    frames(m,k.actionLimit-k.actionFrame); assert.equal(k.action,'shieldBreak');
    frames(m,1); assert.equal(k.action,'idle');
  }
});

test('five midair jumps recharge on landing, dropping from a pass-through platform reaches the floor',()=>{
  for(const [index,full,normal,fast] of [[0,false,39,26],[0,true,53,36],[1,false,41,29],[1,true,51,35]]) {
    function airtime(downFrame) {
      const jump=spar(8); let airFrames=0;
      for(let n=0;n<80;n++) {
        const controls=[{},{}]; controls[index]={jump:full || n===0,y:n===downFrame?-1:0}; step(jump,controls);
        if(!jump.fighters[index].grounded) airFrames++;
        else if(airFrames) break;
      }
      return airFrames;
    }
    assert.equal(airtime(-1),normal);
    // Search the input window around the apex without inspecting velocity.
    assert.equal(Math.min(...Array.from({length:23},(_,i)=>airtime(12+i))),fast);
  }
  const m=createMatch(), f=m.fighters[0], ledgeY=platforms[1].y;
  frames(m,1,{y:-1}); assert.ok(f.y<ledgeY); frames(m,100); assert.equal(f.y,0); assert.ok(f.grounded);
  frames(m,4,{jump:true}); assert.ok(!f.grounded); assert.equal(f.jumps,5);
  for(let i=0;i<5;i++) {frames(m,1); frames(m,1,{jump:true});}
  assert.equal(f.jumps,0); const vy=f.vy;
  frames(m,1); frames(m,1,{jump:true}); assert.ok(f.vy<vy);
  frames(m,160); assert.ok(f.grounded); assert.equal(f.jumps,5);
});

test('Kirby inhales and copies Rollout, Final Cutter makes one traveling wave, Stone stays armored',()=>{
  const long=spar(8); frames(long,100,{special:true}); frames(long,19);
  assert.equal(long.fighters[0].action,'inhale'); frames(long,1); assert.equal(long.fighters[0].action,'idle');
  const hammer=spar(1.6); frames(hammer,134,{special:true,x:1});
  assert.equal(hammer.fighters[0].charge,119); frames(hammer,1,{special:true});
  assert.equal(hammer.fighters[0].charge,120); frames(hammer,10);
  assert.equal(hammer.fighters[1].damage,0); frames(hammer,1);
  assert.ok(Math.abs(hammer.fighters[1].damage-44.1)<1e-5);
  const m=spar(), [kirby,puff]=m.fighters, unit=10/77.2737;
  frames(m,10,{special:true}); assert.equal(puff.action,'grabbed'); assert.equal(puff.hidden,false);
  frames(m,1,{y:-1});
  assert.ok(Math.abs(puff.x-(1-.9*unit))<1e-8 && Math.abs(puff.y-1.2*unit)<1e-8);
  frames(m,4,{y:-1}); assert.equal(puff.hidden,false);
  frames(m,1,{y:-1}); assert.equal(kirby.action,'held'); assert.equal(puff.hidden,true);
  assert.ok(Math.abs(puff.x-5.4*unit)<1e-8 && Math.abs(puff.y-6.8*unit)<1e-8);
  frames(m,14,{y:-1}); assert.equal(kirby.action,'held'); assert.equal(kirby.invuln,1);
  frames(m,1,{y:-1}); assert.equal(kirby.action,'swallow'); assert.equal(kirby.invuln,0);
  frames(m,7); assert.ok(kirby.copied); frames(m,45);
  frames(m,1,{special:true}); assert.equal(m.fighters[0].action,'rollout');
  const spit=spar(-2); spit.fighters[0].face=-1;
  frames(spit,20,{special:true}); assert.equal(spit.fighters[1].hidden,false);
  frames(spit,1); assert.equal(spit.fighters[1].hidden,true);
  assert.ok(Math.abs(spit.fighters[1].x+5.4*unit)<1e-8);
  frames(spit,14); frames(spit,8,{attack:true});
  assert.equal(spit.fighters[1].action,'star'); assert.equal(spit.fighters[0].copied,false);
  const escape=spar(); frames(escape,9,{special:true});
  Object.assign(escape.fighters[1],{x:5.4*unit,y:6.8*unit,grounded:false,platform:-1,action:'fall'});
  frames(escape,4,{special:true}); assert.equal(escape.fighters[1].hidden,false);
  frames(escape,1); assert.equal(escape.fighters[1].hidden,true);
  frames(escape,193); assert.equal(escape.fighters[1].action,'grabbed'); frames(escape,1);
  assert.notEqual(escape.fighters[1].action,'grabbed'); assert.equal(escape.fighters[0].copied,false);
  const c=spar(9); frames(c,1,{special:true,y:1});
  const effects=frames(c,100); assert.equal(effects.filter(e=>e.type==='wave').length,1);
  const rock=spar(); frames(rock,12,{special:true,y:-1});
  assert.ok(rock.fighters[1].damage>0); assert.equal(rock.fighters[0].action,'stone');
  frames(rock,65); rock.fighters[1].x=rock.fighters[0].x+1;
  frames(rock,1,{}, {attack:true}); frames(rock,4); assert.equal(rock.fighters[0].damage,0);
  frames(rock,22); frames(rock,rock.fighters[0].hitlag);
  frames(rock,1,{special:true}); assert.equal(rock.fighters[0].action,'stoneExit');
  // Swallowing launches the opponent as a star behind Kirby for ten frames.
  // Compare with spitting them horizontally, then record two actual positions.
  for(const copying of [true,false]) {
    const stars=spar(), [kirby,target]=stars.fighters;
    frames(stars,36,{special:true}); frames(stars,1);
    frames(stars,8,copying?{y:-1}:{attack:true});
    assert.equal(target.action,copying?'copyStar':'star');
    const unit=10/77.2737, x=target.x, y=target.y;
    assert.ok(Math.abs(y-kirby.y-7*unit)<1e-8);
    frames(stars,1); const dx=target.x-x,dy=target.y-y;
    if(copying) {
      assert.ok(dx<0 && dy>0);
      assert.ok(Math.abs(Math.atan2(dy,-dx)*180/Math.PI-62)<1e-8);
      assert.ok(Math.abs(Math.hypot(dx,dy)/unit-3.4)<1e-8);
      frames(stars,8,{}, {attack:true}); assert.equal(target.action,'copyStar');
      frames(stars,1); assert.equal(target.action,'fall');
    } else {
      assert.ok(Math.abs(dx/unit-2.8)<1e-8); assert.equal(dy,0);
      const first=target.x; frames(stars,1);
      assert.ok(Math.abs((target.x-first)/unit-2.75)<1e-8);
    }
  }
});

test('copy loss starts after 1200 frames and each grounded taunt discards the ability at once',()=>{
  // These seeds sample 3.7526% and 3.7914%, on either side of a 3.78% jab.
  for(const [delay,seed,lost] of [[1199,2068,false],[1200,2068,true],[1200,2069,false]]) {
    const m=spar(1,seed), [kirby,puff]=m.fighters;
    frames(m,30,{special:true}); const copied=frames(m,8,{y:-1});
    assert.ok(copied.some(e=>e.type==='copy'));
    frames(m,delay-5);
    Object.assign(puff,{x:kirby.x+1,y:kirby.y,face:-1,grounded:true,platform:0});
    const events=frames(m,5,{}, {attack:true});
    assert.ok(Math.abs(kirby.damage-3.78)<1e-8);
    assert.equal(kirby.copied,!lost); assert.equal(events.some(e=>e.type==='loseCopy'),lost);
  }
  for(const [i,variant,firstAction] of [[0,'up',47],[0,'down',48],[0,'side',50],[1,'up',50],[1,'down',50],[1,'side',50]]) {
    const m=createMatch(), f=m.fighters[i], platform=f.platform, joy=[{},{}];
    if(i===0) {f.copied=true; f.copyProtectedUntil=1200;}
    joy[i]={taunt:variant,y:variant==='down'?-1:0};
    step(m,joy); assert.equal(f.action,'taunt'); assert.equal(f.platform,platform);
    assert.equal(f.copied,false); assert.equal(m.events.some(e=>e.type==='loseCopy'),i===0);
    frames(m,firstAction-3); joy[i]={attack:true}; step(m,joy); assert.equal(f.action,'taunt');
    step(m); assert.equal(f.action,'jab'); assert.equal(f.actionFrame,1);
  }
});

test('Sing affects grounded opponents on frame 27, Rest lands on frame two and applies a flower',()=>{
  const m=spar(); frames(m,26,{}, {special:true,y:1}); assert.equal(m.fighters[0].action,'idle');
  frames(m,1); assert.equal(m.fighters[0].action,'sleep');
  const r=spar(.3); frames(r,1,{}, {special:true,y:-1}); assert.equal(r.fighters[0].flower,0);
  frames(r,1); assert.equal(r.fighters[0].flower,Math.floor(20+25.2*40)); assert.equal(r.fighters[1].actionLimit,186);
  const miss=spar(4); frames(miss,209,{}, {special:true,y:-1}); assert.equal(miss.fighters[1].action,'rest');
  frames(miss,1); assert.notEqual(miss.fighters[1].action,'rest');
});

test('Rollout uses release speed for damage, loses its hitbox while turning and rebounds on contact',()=>{
  const unit=10/77.2737;
  const tap=spar(1.1), ball=tap.fighters[1], origin=ball.x;
  frames(tap,1,{}, {special:true}); frames(tap,14); assert.equal(ball.x,origin);
  frames(tap,1); assert.ok(Math.abs((origin-ball.x)/unit-.8)<1e-8);
  frames(tap,20); assert.equal(ball.rollPhase,'roll'); assert.equal(tap.fighters[0].damage,0);
  frames(tap,1); assert.equal(ball.rollPhase,'end'); frames(tap,30);
  assert.equal(ball.action,'rollout'); frames(tap,1); assert.equal(ball.action,'idle');
  for(const [held,damage] of [[29,0],[30,12.6]]) {
    const partial=spar(1.1); frames(partial,held,{}, {special:true}); frames(partial,1);
    assert.ok(Math.abs(partial.fighters[0].damage-damage)<1e-8);
  }
  for(const [held,speed] of [[15,1],[30,2.03],[51,3.95]]) {
    const air=spar(5), f=air.fighters[1];
    Object.assign(f,{x:0,y:18,grounded:false,platform:-1,action:'fall'});
    frames(air,held,{}, {special:true}); frames(air,1);
    assert.ok(Math.abs(f.vx/unit+speed)<1e-8); frames(air,1);
    assert.ok(Math.abs(f.vx/unit+Math.max(1,speed-.05))<1e-8);
  }
  const roll=spar(1.1), puff=roll.fighters[1], x=puff.x;
  const copyRoll=structuredClone(roll);
  Object.assign(copyRoll.fighters[1],{kind:'kirby',copied:true});
  const normalGuard=structuredClone(roll), copyGuard=structuredClone(copyRoll);
  for(const trial of [normalGuard,copyGuard]) frames(trial,51,{shield:true},{special:true});
  frames(normalGuard,1,{shield:true}); frames(copyGuard,1,{shield:true});
  assert.ok(Math.abs(normalGuard.fighters[0].shieldHP-copyGuard.fighters[0].shieldHP-21*.2*1.19)<1e-8);
  frames(roll,50,{}, {special:true}); assert.equal(puff.charge,35);
  frames(roll,1,{}, {special:true}); assert.equal(puff.charge,36); assert.equal(puff.x,x);
  frames(roll,1); assert.ok(puff.x<x); assert.ok(Math.abs(roll.fighters[0].damage-25.2)<1e-5);
  const impulse=[roll.fighters[0].kx,roll.fighters[0].ky];
  assert.ok(Math.abs((x-puff.x)/unit-4)<1e-8); assert.equal(puff.grounded,false);
  assert.ok(Math.abs(puff.vx/unit-.13)<1e-8 && Math.abs(puff.vy/unit-2.7)<1e-8);
  frames(roll,puff.hitlag+1); assert.ok(Math.abs(puff.vy/unit-2.53)<1e-8);
  for(let n=0;n<45 && !puff.grounded;n++) step(roll);
  assert.equal(puff.action,'land'); frames(roll,19); assert.equal(puff.action,'land');
  frames(roll,1); assert.equal(puff.action,'idle');
  frames(copyRoll,51,{}, {special:true}); frames(copyRoll,1);
  assert.ok(Math.abs(copyRoll.fighters[0].damage-30.24)<1e-5);
  assert.deepEqual([copyRoll.fighters[0].kx,copyRoll.fighters[0].ky],impulse);
  const heldRoll=spar(8); frames(heldRoll,115,{}, {special:true}); assert.equal(heldRoll.fighters[1].x,8);
  frames(heldRoll,1,{}, {special:true}); assert.ok(heldRoll.fighters[1].x<8);
  const turn=spar(7), [target,roller]=turn.fighters;
  frames(turn,51,{}, {special:true}); frames(turn,1);
  const firstTurnX=roller.x;
  for(let n=1;n<=29;n++) {
    target.x=roller.x; frames(turn,1,{}, {x:1});
    assert.ok(Math.abs(roller.vx/unit-(-3.95+.17775*(n-1)))<1e-8);
    assert.equal(target.damage,0);
    if(n===23) assert.ok(Math.abs((roller.x-firstTurnX)/unit+45.87925)<1e-8);
  }
  assert.equal(roller.rollPhase,'turn'); assert.equal(roller.face,1);
  target.x=roller.x+.5;
  frames(turn,1,{}, {x:1}); assert.ok(Math.abs(target.damage-25.2)<1e-8);
  const slowTurn=spar(7), slowBall=slowTurn.fighters[1];
  frames(slowTurn,1,{}, {special:true}); frames(slowTurn,15);
  frames(slowTurn,29,{}, {x:1}); assert.equal(slowBall.rollPhase,'turn');
  frames(slowTurn,1,{}, {x:1}); assert.equal(slowBall.rollPhase,'end');
  const track=spar(0), [spectator,runner]=track.fighters;
  Object.assign(spectator,{platform:3,y:platforms[3].y}); runner.face=1;
  frames(track,51,{}, {special:true});
  // Reset only position so an uninterrupted straight roll has 93 frames of floor.
  while(track.frame<144) { runner.x=0; step(track); }
  assert.equal(runner.rollPhase,'roll'); frames(track,1); assert.equal(runner.rollPhase,'end');
  frames(track,29); assert.equal(runner.action,'rollout'); frames(track,1); assert.equal(runner.action,'idle');
});

test('ledge catch allows a climb, ring-out removes one stock, simultaneous last stocks cause sudden death',()=>{
  const m=createMatch(1); const [a,b]=m.fighters;
  assert.ok(b.x<0 && a.x>0); assert.equal(b.platform,1); assert.equal(a.platform,2);
  Object.assign(a,{x:10.5,y:-.7,grounded:false,platform:-1,action:'fall',vy:-.1});
  frames(m,1); assert.equal(a.action,'ledge'); frames(m,18,{x:-1}); assert.equal(a.action,'ledge');
  frames(m,1,{x:-1}); assert.equal(a.action,'climb'); frames(m,33); assert.equal(a.action,'idle');
  a.x=34; frames(m,1); assert.equal(a.stocks,2); assert.equal(a.action,'ko');
  frames(m,59); assert.equal(a.action,'ko'); frames(m,1);
  assert.equal(a.action,'respawn'); assert.equal(a.damage,0);
  Object.assign(a,{x:-34,stocks:1}); Object.assign(b,{x:34,stocks:1}); frames(m,1);
  assert.ok(m.suddenDeath); assert.equal(m.winner,null); assert.equal(a.damage,300);
  assert.ok(b.x<0 && a.x>0); assert.equal(b.face,1); assert.equal(a.face,-1);
  a.x=-34; frames(m,1); assert.equal(m.winner,1);
});

test('a fighter outside Dream Land’s camera range takes one singles damage tick per 60 frames',()=>{
  const match=spar(), f=match.fighters[0];
  Object.assign(f,{x:-25,y:14,grounded:false,platform:-1,action:'fall',damage:56.4625});
  frames(match,59);
  assert.equal(f.loupeFrames,59);
  assert.equal(f.damage,56.4625);
  frames(match,1);
  assert.equal(Math.floor(f.damage*10),576);
  f.x=-21;
  frames(match,1);
  assert.equal(f.loupeFrames,0);
  assert.equal(f.radarFrames,44);
  Object.assign(f,{x:-25,y:14,damage:150});
  frames(match,60);
  assert.equal(f.damage,150);
});

test('an upward smash can send a fighter into the screen for 88 frames before the normal revival',()=>{
  for(const [seed,time,screen] of [[153,1200,true],[1000,1200,false],[153,320,false]]) {
    const m=spar(.65,seed), target=m.fighters[1];
    target.damage=100; m.remaining=time;
    step(m,[{smash:true,y:1},{}]);
    const launch=frames(m,36);
    if(!screen) {
      assert.equal(launch.find(e=>e.type==='ko')?.top,true);
      assert.equal(target.stocks,2); continue;
    }
    assert.equal(launch.at(-1).type,'screenKO');assert.equal(target.stocks,3);
    assert.equal(frames(m,30).at(-1).type,'screenImpact');
    frames(m,57); assert.equal(target.stocks,3);
    const blast=frames(m,1).find(e=>e.type==='ko');
    assert.ok(blast.bottom && !blast.top);assert.equal(target.stocks,2);
    frames(m,60); assert.equal(target.action,'respawn');
    frames(m,60,{}, {x:1}); assert.notEqual(target.action,'respawn');
    assert.equal(time-m.remaining,37+208);
  }
  const m=spar(.65,153),[k,p]=m.fighters;
  Object.assign(p,{damage:100,stocks:1});k.stocks=1;
  step(m,[{smash:true,y:1},{}]);frames(m,38);
  k.x=34;step(m);assert.equal(m.winner,1);
  const airborne=createMatch(),f=airborne.fighters[0];
  Object.assign(f,{action:'fall',x:0,y:26,grounded:false,platform:-1,vy:.15});
  step(airborne);assert.equal(f.stocks,3);
});

test('ledge options retain their recorded protection, displacement and first actionable frame',()=>{
  for(const slot of [0,1]) {
    const front=slot===0?1:-1, inputs=[{},{}];
    for(const [action,input,total,safe] of [
      ['climb',{x:front},33+slot,32+slot],['ledgeRoll',{shield:true},45,slot?25:22],
      ['ledgeAttack',{attack:true},55,slot?23:22],['ledgeJump',{jump:true},14,12],
    ]) {
      const m=createMatch(), f=m.fighters[slot];
      Object.assign(f,{x:-front*10.6,y:-.8,face:front,vy:-.1,grounded:false,platform:-1,action:'fall'});
      frames(m,19); assert.equal(f.action,'ledge'); const start=f.x;
      inputs[slot]=input; step(m,inputs); assert.equal(f.action,action); assert.equal(f.x,start);
      frames(m,safe-1); assert.equal(f.invuln,1); frames(m,1); assert.equal(f.invuln,0);
      frames(m,total-safe-1); assert.equal(f.action,action);
      if(action==='ledgeRoll') assert.ok(Math.abs(f.x-front*((slot?5.35:5.14)-10))<.001);
      if(action==='ledgeJump') assert.ok(f.y>0 && f.vx*front>0);
      frames(m,1); assert.equal(f.action,action==='ledgeJump'?'fall':'idle');
    }
    const m=createMatch(), f=m.fighters[slot], target=m.fighters[1-slot];
    Object.assign(f,{x:-front*10.6,y:-.8,face:front,vy:-.1,grounded:false,platform:-1,action:'fall'});
    Object.assign(target,{x:-front*8.2,y:0,grounded:true,platform:0});
    frames(m,19); inputs[slot]={attack:true}; step(m,inputs); frames(m,18+slot);
    assert.equal(target.damage,0); frames(m,1);
    assert.ok(Math.abs(target.damage-(slot?8:9)*1.05*1.2)<1e-6);
  }
});

test('simultaneous ledge catches respect ports and buffered exits; an airborne regrab loses protection',()=>{
  const falling={x:10.5,y:-.8,vy:-.1,face:-1,action:'fall',grounded:false,platform:-1};
  for(const swap of [0,1]) {
    const m=createMatch(swap), old=m.fighters[swap], kept=m.fighters[1-swap];
    for(const f of m.fighters) Object.assign(f,falling);
    frames(m,19); assert.equal(old.action,'ledge');
    const input=[{},{}]; if(swap) input[kept.index]={jump:true}; step(m,input);
    assert.equal(old.action,'ledgeTrump'); assert.equal(kept.action,swap?'ledgeJump':'ledge'); assert.equal(old.invuln,0);
    frames(m,27); assert.equal(old.action,'ledgeTrump'); assert.ok(old.x>11);
    frames(m,1); assert.equal(old.action,'fall');
  }
  const m=createMatch(), [a,b]=m.fighters;
  for(const f of m.fighters) Object.assign(f,falling);
  frames(m,18); frames(m,1,{jump:true}); frames(m,1);
  assert.equal(a.action,'ledgeJump'); assert.equal(b.action,'ledge');
  const regrab=createMatch(), f=regrab.fighters[0]; Object.assign(f,falling);
  frames(regrab,19); frames(regrab,1,{x:1}); assert.equal(f.action,'fall'); assert.equal(f.invuln,0);
  frames(regrab,2); frames(regrab,1,{jump:true}); frames(regrab,40);
  assert.notEqual(f.action,'ledge'); frames(regrab,1); assert.equal(f.action,'ledge'); assert.equal(f.invuln,0);
  frames(regrab,18); frames(regrab,1,{jump:true}); assert.equal(f.action,'ledgeJump');
  assert.equal(f.invuln,10); assert.equal(f.jumps,5);
});

test('revival platform descends for 60 frames and the first vulnerable frame depends on the optional wait',()=>{
  for(const [slot,wait,protection] of [[0,0,120],[1,120,120],[1,179,90],[0,240,60]]) {
    const m=spar(5), victim=m.fighters[slot], attacker=m.fighters[1-slot];
    victim.x=34; step(m); const ko=m.frame;
    frames(m,60); assert.equal(victim.action,'respawn');
    const initialY=victim.y, input=[{},{}]; input[slot]={x:1};
    for(let j=0;j<59;j++) step(m,input);
    assert.equal(victim.action,'respawn'); assert.ok(victim.y<initialY);
    frames(m,wait); assert.equal(victim.action,'respawn');
    input[slot]=wait===240?{}:slot===1?{attack:true}:{x:1};
    step(m,input); assert.equal(m.frame-ko,120+wait);
    assert.equal(victim.action,slot===1?'nair':'fall'); assert.equal(victim.invuln,protection);
    const active=attacker.kind==='kirby'?5:7;
    const dodge=[{},{}]; if(wait===0) dodge[slot]={shield:true};
    step(m,dodge); frames(m,protection-active-2);
    Object.assign(attacker,{x:victim.x-1,y:victim.y,grounded:true,platform:victim.platform,face:1});
    const kick=[{},{}];kick[1-slot]={x:1,attack:true};step(m,kick);frames(m,active-1);
    assert.equal(victim.damage,0);assert.equal(victim.invuln,1);
    step(m);assert.ok(victim.damage>0);assert.equal(m.frame-ko,120+wait+protection);
  }
});

test('tumble lands prone, or techs with neutral and directional input in the 11-frame window',()=>{
  function knockdown() {
    const m=spar();
    frames(m,1,{special:true,y:-1});
    return m;
  }
  const missed=knockdown();
  while(missed.frame<120 && missed.fighters[1].action!=='prone') step(missed);
  assert.equal(missed.fighters[1].action,'prone'); const landing=missed.frame;
  for(const [ahead,held,dir,expected] of [[10,1,0,'tech'],[11,1,0,'prone'],[16,20,-1,'techRoll']]) {
    const m=knockdown();
    for(let n=m.frame+1;n<=landing;n++) {
      step(m,[{},{x:n===landing?dir:0,shield:n>=landing-ahead && n<landing-ahead+held}]);
    }
    const t=m.fighters[1], x=t.x;
    assert.equal(t.action,expected);
    if(expected==='techRoll') {
      assert.ok(m.events.some(e=>e.type==='tech'));
      frames(m,15); assert.ok(t.x<x-.6);
    }
  }
  const f=missed.fighters[1]; frames(missed,24); assert.equal(f.action,'prone');
  const target=missed.fighters[0]; target.x=f.x+f.face*.95;
  frames(missed,1,{}, {attack:true}); assert.equal(f.action,'getupAttack');
  frames(missed,14); assert.equal(target.damage,0);
  const hit=frames(missed,1).find(e=>e.move==='getupAttack' && e.type==='shieldHit');
  assert.ok(hit); assert.ok(Number.isFinite(hit.contactX));
  const spike=spar(.12), [attacker,victim]=spike.fighters;
  Object.assign(attacker,{grounded:false,platform:-1,y:1.2,action:'dair',actionFrame:33});
  Object.assign(victim,{grounded:false,platform:-1,y:.28,action:'fall',damage:300});
  const meteor=frames(spike,1).find(e=>e.type==='hit'); assert.equal(meteor.angle,270);
  const bounce=frames(spike,10,{}, {shield:true}).find(e=>e.bounce);
  assert.ok(bounce.untechable); assert.ok(victim.ky>0); assert.equal(victim.grounded,false);
});

test('two CPUs finish a stock match and use recovery, aerials and special attacks',()=>{
  const m=createMatch(), seen=new Set();
  while(m.winner===null && m.frame<7*60*60) {
    step(m,[cpuInput(m,0),cpuInput(m,1)]);
    for(const f of m.fighters) seen.add(f.action);
  }
  assert.notEqual(m.winner,null); assert.ok(m.fighters.some(f=>f.stocks===0));
  assert.ok(seen.has('fair')); assert.ok(seen.has('pound'));
  for(const i of [0,1]) {
    const edge=createMatch(), f=edge.fighters[i];
    Object.assign(f,{x:10.6,y:-.8,vy:-.1,jumps:0,grounded:false,platform:-1,action:'fall'});
    let grabbedLedge=false;
    for(let j=0;j<24;j++) {
      const inputs=[{},{}]; inputs[i]=cpuInput(edge,i); step(edge,inputs);
      grabbedLedge ||= f.action==='ledge';
    }
    assert.ok(grabbedLedge); assert.equal(f.action,'climb');
  }
});

test('a slow tilt reaches walk speed, a flick dashes or charges a smash, and right-stick attacks preserve air drift',()=>{
  const unit=10/77.2737;
  for(const [i,speed] of [[0,.977],[1,.735]]) {
    const m=spar(6), f=m.fighters[i];
    const steer=(x,extra={})=>{const inputs=[{},{}];inputs[i]={analog:true,x:Math.sign(x),moveX:x,...extra};step(m,inputs)};
    for(const x of [.25,.40,.55,.70,.85,1,1,1]) steer(x);
    assert.equal(f.action,'walk');assert.ok(Math.abs(f.vx-speed*unit)<1e-6);
    steer(0);steer(1,{attack:true});assert.equal(f.action,'fsmash');
    for(let n=0;n<20;n++) steer(1,{attack:true});
    assert.ok(f.charge>0);
    Object.assign(f,{x:0,y:4,face:1,vx:0,grounded:false,platform:-1,action:'fall',hitlag:0});
    steer(-.6,{smash:true,smashX:1,smashY:0});
    assert.equal(f.action,'fair');assert.ok(f.vx<0);assert.equal(f.face,1);
  }
});

test('dash startup, early shield, braking and turnaround follow each fighter’s movement windows',()=>{
  const unit=10/77.2737;
  for(const [i,burst,run,brake,runFrame,stepFrame] of [[0,1.9,1.727,.116,13,18],[1,1.65,1.271,.087,14,20]]) {
    for(const reverse of [false,true]) {
      const m=spar(6), f=m.fighters[i], wait=reverse?2:0, dir=f.face*(reverse?-1:1), input=[{},{}];
      f.x=0; input[i]={x:dir};
      for(let n=1;n<=6+wait;n++) {
        step(m,input); assert.equal(f.face,dir);
        assert.ok(Math.abs(f.vx-(n<=wait?0:dir*burst*unit))<1e-8);
      }
      for(const keepingStick of [false,true]) {
        const trial=structuredClone(m), guard=trial.fighters[i], guardInput=[{},{}];
        guardInput[i]={x:keepingStick?dir:0,shield:true};
        const first=(keepingStick?runFrame:stepFrame)+wait;
        while(trial.frame<first-1){step(trial,guardInput);assert.equal(guard.action,'run');}
        step(trial,guardInput); assert.equal(guard.action,'shield'); assert.equal(guard.actionFrame,1);
        step(trial,guardInput); assert.equal(guard.action,'shield');
      }
    }
    const m=spar(6), f=m.fighters[i], dir=f.face, input=[{},{}]; f.x=0; input[i]={x:dir};
    for(let n=0;n<20;n++) step(m,input);
    const turn=structuredClone(m), pivot=turn.fighters[i];
    const speed=dir*run*unit, friction=dir*brake*unit;
    step(m); assert.equal(f.action,'runBrake'); assert.ok(Math.abs(f.vx-(speed-friction))<1e-8);
    input[i]={shield:true};
    for(let n=2;n<=Math.ceil(run/brake);n++){step(m,input); assert.equal(f.action,'runBrake');}
    assert.equal(f.vx,0); step(m,input); assert.equal(f.action,'shield');
    input[i]={x:-dir}; step(turn,input); assert.equal(pivot.action,'turnRun'); assert.equal(pivot.face,-dir);
    assert.ok(Math.abs(pivot.vx-(speed-2*friction))<1e-8);
    for(let n=0;n<30 && pivot.action!=='run';n++) step(turn,input);
    assert.equal(pivot.action,'run'); assert.ok(Math.abs(pivot.vx+speed)<1e-8);
  }
});

test('DI reads the final frame of hitstop; up and down alter launch speed outside the vertical exclusion cone',()=>{
  function launch(move,last,early={}) {
    const m=spar(.55),target=m.fighters[1]; target.damage=100;
    step(m,[move,early]);
    for(let n=0;n<24 && !target.hitlag;n++) step(m,[{},early]);
    assert.ok(target.hitlag>1);const lag=target.hitlag;
    frames(m,lag-1,{},early);step(m,[{},last]);
    assert.equal(target.hitlag,0);
    return {angle:Math.atan2(target.ky,target.kx),speed:Math.hypot(target.kx,target.ky)};
  }
  const smash={smash:true},neutral=launch(smash,{}),up=launch(smash,{y:1}),down=launch(smash,{y:-1});
  assert.deepEqual(launch(smash,{}, {y:1}),neutral);
  assert.ok(up.angle>neutral.angle && down.angle<neutral.angle);
  assert.ok(Math.abs(up.speed/neutral.speed-1.095)<1e-8);
  assert.ok(Math.abs(down.speed/neutral.speed-.92)<1e-8);
  const vertical={smash:true,y:1};
  assert.ok(Math.abs(launch(vertical,{y:1}).speed-launch(vertical,{}).speed)<1e-8);
});

test('both fighters distinguish standing, dash and pivot grabs, with separate active capsules and whiff recovery',()=>{
  for(const [index,dashLength,pivotLength,delta] of [[0,41,36,.133],[1,39,34,.147]]) {
    for(const [action,first,total] of [['grab',6,index?32:34],['dashGrab',9,dashLength],['pivotGrab',10,pivotLength]]) {
      for(const distance of [1.5,2.7,4]) {
        const close=distance===1.5 || distance===2.7 && action==='pivotGrab';
        const m=spar(), f=m.fighters[index], t=m.fighters[1-index];
        f.x=0; f.face=1; t.x=-8; t.face=-1;
        const go=input=>step(m,index?[{},input]:[input,{}]);
        if(action!=='grab') { go({x:1}); go({x:1}); }
        const facing=action==='pivotGrab'?-1:1;
        go({x:action==='grab'?0:facing,grab:true});
        assert.equal(f.action,action); assert.equal(f.face,facing);
        let priorX;
        for(let n=2;n<=total;n++) {
          if(n===first || n===first+1) t.x=f.x+distance*facing;
          go({});
          if(n<first) assert.notEqual(t.action,'grabbed');
          if(n===first && close) { assert.equal(t.action,'grabbed'); assert.equal(f.action,'hold'); break; }
          if(n===first) priorX=f.x;
          if(n===first+1 && action!=='grab') assert.ok(Math.abs(f.x-priorX-(action==='pivotGrab'?0:delta))<1e-8);
          if(!close) assert.equal(f.action,action);
        }
        if(!close) { go({}); assert.equal(f.action,'idle'); assert.equal(t.damage,0); }
      }
    }
  }
});

test('grab mash, pummel hitstop, mutual grabs and release obey their independent clocks',()=>{
  const clash=spar(1.1); frames(clash,1,{grab:true},{grab:true}); frames(clash,5);
  assert.equal(clash.events[0].type,'grabClash');
  for(const f of clash.fighters) { assert.equal(f.action,'grabRelease'); assert.equal(f.caught,-1); assert.equal(f.damage,1.2); }
  const shield=spar(), defender=shield.fighters[1];
  frames(shield,1,{attack:true},{shield:true}); frames(shield,1,{},{shield:true});
  for(let n=0;n<35 && (defender.hitlag || defender.shieldStun>1);n++) step(shield,[{},{shield:true}]);
  step(shield,[{},{shield:true,grab:true}]); assert.equal(defender.shieldStun,0);
  frames(shield,4,{},{shield:true}); assert.equal(defender.action,'shield');
  frames(shield,5,{},{shield:true}); assert.equal(defender.action,'grab');
  frames(shield,1,{},{shield:true}); assert.equal(defender.action,'hold');
  for(const [index,freeze,total,base] of [[0,10,15,1],[1,13,19,1.3]]) {
    const m=spar(1.15), f=m.fighters[index], t=m.fighters[1-index], go=(a,b)=>step(m,index?[b,a]:[a,b]);
    go({grab:true},{}); for(let i=0;i<5;i++) go({},{});
    go({attack:true},{}); assert.equal(f.action,'pummel');
    assert.equal(f.hitlag,freeze); assert.equal(t.hitlag,freeze); assert.ok(Math.abs(t.damage-base*1.05*1.2)<1e-8);
    for(let i=1;i<total;i++) go(i===freeze-1?{grab:true}:{},{});
    assert.equal(f.action,'pummel');
    go({},{}); assert.equal(f.action,'hold'); assert.ok(Math.abs(t.damage-base*1.05*1.2)<1e-8);
    go({grab:true},{}); assert.equal(f.action,'pummel');
    assert.ok(Math.abs(t.damage-base*1.2*(1.05+.91))<1e-8);
  }
  for(const [damage,mash,expected] of [[0,false,90],[50,false,175],[0,true,19]]) {
    const m=spar(1.1),[f,t]=m.fighters; t.damage=damage;
    frames(m,1,{grab:true}); frames(m,5);
    for(let n=1;n<expected;n++) { step(m,[{},mash?{x:n%2?1:-1}:{}]); assert.equal(t.action,'grabbed'); }
    step(m); assert.equal(t.action,'grabRelease'); assert.equal(f.action,'grabRelease');
    assert.equal(t.grounded,true); assert.ok(t.vx>0);
    frames(m,28); assert.equal(t.action,'grabRelease'); frames(m,1); assert.equal(t.action,'idle');
    if(expected===90) {
      t.x=f.x+1; frames(m,1,{grab:true}); frames(m,5); assert.notEqual(t.action,'grabbed');
      frames(m,28); t.x=f.x+1; frames(m,1,{grab:true}); frames(m,5); assert.equal(t.action,'grabbed');
    }
  }
});

test('all eight throws release on their own frames and Kirby lands earlier on an overhead platform',()=>{
  const data=[
    [0,'throwF',45,5,75],[0,'throwB',41,8,130],[0,'throwU',58,10,78],[0,'throwD',58,12,63],
    [1,'throwF',12,10,35],[1,'throwB',26,10,135],[1,'throwU',9,8,90],[1,'throwD',62,12,75]
  ];
  for(const [index,move,release,base,angle] of data) {
    const m=spar(),f=m.fighters[index],t=m.fighters[1-index]; f.x=-8.9; f.face=1; t.x=-7.8; t.face=-1;
    const go=input=>step(m,index?[{},input]:[input,{}]);
    go({grab:true}); for(let i=1;i<6;i++) go({});
    const input={throwF:{x:1},throwB:{x:-1},throwU:{y:1},throwD:{y:-1}}[move];
    const contactFrames=[];
    for(let n=1;n<=release;n++) {
      go(n===1?input:{});
      if(m.events.some(e=>e.move===move && e.type==='hit')) contactFrames.push(n);
      if(n<release) { assert.equal(t.action,'grabbed'); assert.equal(t.captureMove,move); assert.equal(t.captureFrame,n); }
    }
    assert.equal(f.caught,-1); assert.equal(t.action,'stun'); assert.equal(t.captureMove,null);
    assert.ok(Math.abs(t.damage-base*1.05*1.2)<1e-8);
    const launch=m.events.find(e=>e.type==='hit' && e.kb>0); assert.equal(launch.angle,angle);
    assert.ok(t.ky>0); if(angle!==90) assert.equal(Math.sign(t.kx),angle>90?-1:1);
    const extras=move==='throwD'?(index?[60]:[9,13,17,21,25,29,33,37,41,56]):index && move==='throwF'?[10]:[];
    assert.deepEqual(contactFrames,[...extras,release]);
  }
  const m=spar(1.1), [f,t]=m.fighters; frames(m,1,{grab:true}); frames(m,5); frames(m,1,{y:1});
  let peak=f.y;
  for(let n=2;n<=58 && t.action==='grabbed';n++) {step(m);peak=Math.max(peak,f.y);}
  assert.ok(peak>33 && peak<34,'up throw follows the authored 271-unit ascent');
  assert.equal(t.action,'stun'); assert.equal(f.platform,3); assert.ok(t.y>=platforms[3].y);
  assert.ok(m.frame-6<58);
});

test('the Final Smash meter credits damage and time, preserves partial charge on KO, and expires standby at 20 seconds',()=>{
  const m=spar(),[k,p]=m.fighters;
  frames(m,2,{attack:true});
  assert.ok(Math.abs(k.finalMeter-p.damage*.15)<1e-8);
  assert.ok(Math.abs(p.finalMeter-p.damage*.45)<1e-8);
  const charge=k.finalMeter; frames(m,13);assert.ok(Math.abs(k.finalMeter-charge-.05)<1e-8);
  p.y=-100;p.grounded=false;frames(m,1);const saved=p.finalMeter;
  frames(m,61);assert.equal(p.action,'respawn');assert.equal(p.finalMeter,saved);
  const ready=spar(),r=ready.fighters[0];r.finalMeter=99.98;frames(ready,14);
  assert.ok(frames(ready,1).some(e=>e.type==='finalReady'));
  frames(ready,900);assert.equal(r.finalReady,true);assert.equal(r.finalMeter,50);
  frames(ready,300);assert.equal(r.finalReady,false);assert.equal(r.finalMeter,0);
  const off=createMatch(0,5,{finalSmashMeter:false});frames(off,60);
  assert.deepEqual(off.fighters.map(f=>f.finalMeter),[0,0]);
});

test('charged neutral special selects both fighters’ Final Smashes and leaves their directional and uncharged moves available',()=>{
  const m=spar(1.4),[k,p]=m.fighters;
  k.finalReady=true;k.finalMeter=100;frames(m,1,{special:true,x:-1});
  assert.equal(k.action,'hammer');assert.equal(k.finalReady,true);
  const miss=spar(-8),[caster,foe]=miss.fighters;foe.face=-1;
  caster.finalMeter=foe.finalMeter=100;caster.finalReady=foe.finalReady=true;
  const start=frames(miss,1,{special:true},{special:true});assert.equal(start.filter(e=>e.type==='finalStart').length,1);
  assert.equal(caster.action,'ultraSword');assert.equal(foe.action,'rollout');assert.equal(foe.finalReady,true);
  frames(miss,89);assert.equal(caster.action,'idle');assert.equal(foe.damage,0);
  const kFight=spar(1.4),[sword,target]=kFight.fighters;sword.finalReady=true;
  const timeline=[];for(let n=1;n<=319;n++) {
    step(kFight,[n===1?{special:true}:{},{}]);
    if(kFight.events.some(e=>e.type==='hit'))timeline.push(n);
    if(n===16)assert.notEqual(target.action,'ultraSwordVictim');
    if(n===17)assert.equal(target.action,'ultraSwordVictim');
    if(n===271){assert.equal(target.action,'stun');assert.ok(target.kx>0 && target.ky>0);}
  }
  assert.deepEqual(timeline,[17,55,103,119,134,147,161,175,191,205,271]);
  assert.ok(Math.abs(target.damage-31.36)<1e-6);assert.equal(sword.action,'idle');assert.equal(sword.finalReady,false);
  const fpSword=spar(1.4),[fpCaster,fpVictim]=fpSword.fighters;
  Object.assign(fpCaster,{finalReady:true,finalDamageScale:1.024});fpVictim.damage=30.58;
  const tenths=[];
  for(let n=1;n<=319;n++){
    step(fpSword,[{special:n===1},{}]);
    if(fpSword.events.some(e=>e.type==='hit'))tenths.push(Math.floor(fpVictim.damage*10));
  }
  assert.deepEqual(tenths,[327,363,381,400,419,437,456,474,493,512,626]);assert.equal(fpCaster.finalDamageScale,1);
  const pFight=spar(1.4),[other,puff]=pFight.fighters;puff.finalReady=true;
  const notes=[];for(let n=1;n<=454;n++){
    step(pFight,[{x:n>=121 && n<=242?1:0},n===1?{special:true}:{}]);
    if(n===100){assert.equal(other.damage,0);assert.equal(other.action,'idle');assert.ok(other.kx<0);}
    for(const e of pFight.events)if(e.type==='hit')notes.push([n,e.damage]);
  }
  assert.deepEqual(notes,[[242,7],[281,17.5]]);assert.equal(other.damage,24.5);assert.equal(puff.action,'idle');
  frames(pFight,1,{}, {special:true});assert.equal(puff.action,'rollout');
  const figure=spar(1.4),[figKirby,figPuff]=figure.fighters;
  Object.assign(figPuff,{finalReady:true,finalDamageScale:1.025});
  figKirby.damage=69.65;frames(figure,120,{}, {special:true});frames(figure,122,{x:1});
  assert.equal(Math.floor(figKirby.damage*10),768);
  frames(figure,39);assert.equal(Math.floor(figKirby.damage*10),947);
});

(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
  const world=$('world'), overlay=$('effects'), lobby=$('lobby'), pauseBox=$('break'), guide=$('help');
  const fx=SmashFeedback.makeEffects(overlay), sound=SmashFeedback.audioSystem();
  const labels=['KIRBY','JIGGLYPUFF'], zh=['卡比','胖丁'];
  const portraits=[...$('hud-art').content.querySelectorAll('img')];
  const accent=globalThis.SmashAccent?.create($('accent'));
  const music=globalThis.BattleAudio?.create();
  let sceneAccent=null,impactHold=0,restBackdrop,finalScene,puffAura;
  let lastFinalShot=null;
  const keyMaps=[
    {left:'KeyA',right:'KeyD',up:'KeyW',down:'KeyS',walk:'ShiftLeft',jump:'Space',attack:'KeyJ',special:'KeyK',smash:'KeyL',shield:'KeyU',grab:'KeyI',taunt:'KeyT'},
    {left:'ArrowLeft',right:'ArrowRight',up:'ArrowUp',down:'ArrowDown',walk:'ControlRight',jump:'Enter',attack:'Comma',special:'Period',smash:'Slash',shield:'ShiftRight',grab:'Quote',taunt:'BracketRight'}
  ];
  const keys=new Set(), taps=new Set(), touchHeld=new Set(),touchTaps=new Set();
  const usedKeys=new Set(keyMaps.flatMap(map=>Object.values(map)));
  let axisX=0,axisY=0,player=0,local=false,audible=true,state='lobby',match,scene,camera,renderer,stage,models,shadows;
  let counter=0, calloutLife=0, lastTime=0,accumulator=0,victoryDelay=0,visualFrame=0;
  const skyColor=new THREE.Color(0x89c9fe);
  let teams=[], meters=[], view,centreX=0,centreY=3.35,viewWidth=26.6;
  const recordedSwings=new Set(['sing','rest','inhale','cutter','jab','jab2','rapidJab','rapidEnd']);
  const canTouch=matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints>1;
  let meterEnabled=true;
  let replayFrame=-1,replayMatch='';
  const replayEndFrame={'back-air':51,'ultra-sword':320,'puff-up':456};
  const beforeContact=[{},{}], hitStops=[null,null];
  let artwork,artworkLoaded=false;
  $('fs-rule').onclick=()=>{
    meterEnabled=!meterEnabled;$('fs-rule').setAttribute('aria-pressed',String(meterEnabled));
    $('fs-rule').textContent='最终绝招表 · '+(meterEnabled?'开':'关');
  };
  function resetInput() {
    keys.clear();taps.clear();touchHeld.clear();touchTaps.clear();axisX=axisY=0;
    document.querySelector('.pad i').style.transform='';
    for(const b of document.querySelectorAll('[data-action]')) delete b.dataset.pressed;
  }
  function remap() {
    lobby.dataset.player=String(player);
    [0,1].forEach(i=>{
      const tag=i===player?'1P':local?'2P':'CPU';
      $(`slot${i}`).textContent=tag;
      document.querySelector(`[data-choice="${i}"]`).setAttribute('aria-pressed',String(player===i));
    });
    $('local').setAttribute('aria-pressed',String(local));$('cpu').setAttribute('aria-pressed',String(!local));
  }
  function select(i) {player=i;sound.unlock();music?.unlock();sound.sound('select');remap()}
  document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>select(+b.dataset.choice));
  $('cpu').onclick=()=>{local=false;select(player)};$('local').onclick=()=>{local=true;select(player)};
  if(canTouch) {
    $('local').title='同屏双人需要键盘或手柄';
  }
  $('sound').onclick=()=>{
    audible=!audible;sound.unlock();sound.set(audible);music?.setEnabled(audible);sound.sound('select');
    $('sound').setAttribute('aria-pressed',String(audible));$('sound-label').textContent=audible?'声音开启':'声音关闭';
  };
  function openGuide(){sound.unlock();sound.sound('select');guide.showModal();guide.querySelector('button').focus()}
  $('guide').onclick=$('break-guide').onclick=openGuide;
  guide.querySelector('.close').onclick=()=>guide.close();
  guide.addEventListener('click',e=>{if(e.target===guide){const r=guide.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)guide.close()}});
  function initScene() {
    if(renderer)return;
    const T=THREE;
    const textures=new Promise(resolve=>{T.DefaultLoadingManager.onLoad=resolve});
    const cutinImages=Array.from(document.querySelectorAll('#final-cutins img'),image=>image.decode());
    artwork=Promise.all([textures,SmashMotions.ready,...cutinImages]);
    renderer=new T.WebGLRenderer({canvas:world,antialias:true,alpha:true,powerPreference:'high-performance'});
    renderer.outputColorSpace=T.SRGBColorSpace;
    scene=new T.Scene();scene.background=new T.Color(0x89c9fe);
    camera=new T.OrthographicCamera(-13,13,7.3,-7.3,.1,180);
    camera.position.set(0,3,35);camera.lookAt(0,3,0);
    const day=new T.HemisphereLight(0xfff8f5,0xb9a7bc,1.65);scene.add(day);
    const key=new T.DirectionalLight(0xfff0df,2.0);key.position.set(-4,8,6);scene.add(key);
    const rim=new T.DirectionalLight(0xffebff,1.15);rim.position.set(4,5,-4);scene.add(rim);
    stage=SmashStage.create(T,scene);fx.attachTrails(T,scene);
    restBackdrop=SmashPuffFX.createRestBackdrop?.(T,scene);
    renderer.setClearColor(0x000000,0);
    models=['kirby','jigglypuff'].map(kind=>{const m=SmashFighters.create(T,kind);scene.add(m.group);return m});
    const articleStart=scene.children.length;
    finalScene=SmashFinalSmash.createScene(T,scene,models);
    puffAura=SmashPuffFX.createFinalAura(T,scene,models[1]);
    stage.bindFinalSubjects([...models.map(m=>m.group),...scene.children.slice(articleStart)]);
    fx.bindGuardModels(models);
    fx.bindRadar(T,renderer,scene,models);
    shadows=SmashShadows.create(T,scene,SmashSim.platforms);
  }
  function displayHUD(figurePlayers=replayFrame>=0 && !!replayMatch) {
    $('hud').classList.toggle('fp-replay',figurePlayers);
    const teamFor=i=>i===player?{tag:'1P',color:'#fb404a',theme:'red'}:local?{tag:'2P',color:'#398afa',theme:'blue'}:{tag:'CPU',color:'#d6d5d9',theme:'cpu'};
    teams=[0,1].map(i=>figurePlayers?{tag:'FP',color:'#f3ede7',theme:'cpu'}:teamFor(i));
    const host=$('damage');host.replaceChildren();meters=[];
    for(const i of [player,1-player]) {
      const meter=document.createElement('div');meter.className='meter';meter.dataset.team=teams[i].theme;
      meter.innerHTML='<div class="sigil" aria-hidden="true"></div><img class="portrait" alt=""><div class="percent"><b>0</b><small>.0%</small></div><span class="name"></span><span class="fs-gauge" role="meter" aria-label="最终绝招" aria-valuemin="0" aria-valuemax="100"><i></i></span><span class="lives"></span>';
      meter.dataset.fighter=String(i);
      meter.querySelector('.portrait').src=figurePlayers?portraits[i].dataset.fp:portraits[i].src;
      meter.querySelector('.name').textContent=figurePlayers?['Kirby','Jigglypuff'][i]:labels[i];
      let score;
      if(figurePlayers){
        score=document.createElement('span');score.className='fp-score';score.setAttribute('aria-label','对战分数');meter.appendChild(score);
      }
      const gauge=meter.querySelector('.fs-gauge');gauge.hidden=!match.finalSmashMeter;
      meters[i]={meter,score,b:meter.querySelector('.percent b'),decimal:meter.querySelector('.percent small'),lives:meter.querySelector('.lives'),gauge,lastMeter:-1,lastDamage:-1,lastStocks:-1,damagePop:null};
      host.appendChild(meter);
    }
  }
  function hudUpdate() {
    const time=Math.max(0,match.remaining)/60, full=Math.floor(time);
    if(!meters[0].score) $('clock').innerHTML=Math.floor(full/60)+':'+String(full%60).padStart(2,'0')+'<small>.'+String(Math.floor((time-full)*100)).padStart(2,'0')+'</small>';
    match.fighters.forEach((f,i)=>{
      const h=meters[i], tenth=Math.floor((f.damage+1e-7)*10);
      if(match.finalSmashMeter && (Math.floor(f.finalMeter)!==h.lastMeter || h.ready!==f.finalReady)) {
        h.lastMeter=Math.floor(f.finalMeter);
        h.ready=f.finalReady;
        h.gauge.style.setProperty('--fill',h.lastMeter+'%');h.gauge.setAttribute('aria-valuenow',String(h.lastMeter));
        h.gauge.classList.toggle('ready',h.ready);
      }
      h.meter.classList.toggle('out',f.action==='ko' && !f.screenKO);
      const age=h.damagePop===null?Infinity:visualFrame-h.damagePop;
      if(tenth!==h.lastDamage && age>=2) {
        if(age<17) {
          const strings=[String(Math.floor(tenth/10)),'.'+tenth%10+'%'];
          [h.b,h.decimal].forEach((element,index)=>element.replaceChildren(...Array.from(strings[index],value=>{
            const span=document.createElement('span');span.textContent=value;return span;
          })));
        } else {
          h.b.textContent=Math.floor(tenth/10);h.decimal.textContent='.'+tenth%10+'%';
        }
        if(age===Infinity && h.lastDamage>=0 && tenth-h.lastDamage>=10 && !matchMedia('(prefers-reduced-motion:reduce)').matches){
          h.b.parentElement.animate([{transform:'scale(1.12) translateY(-4%)'},{transform:'none'}],{duration:140,easing:'ease-out'});
        }
        h.lastDamage=tenth;
        const colors=h.score?[[255,255,255],[255,226,136],[250,103,48],[211,30,27],[157,22,39]]:[[255,255,255],[255,214,92],[255,145,65],[246,74,65],[191,46,56]];
        const step=h.score?32:38, stop=Math.min(3,Math.floor(f.damage/step)),mix=Math.min(1,Math.max(0,f.damage/step-stop));
        h.meter.style.setProperty('--hurt','rgb('+colors[stop].map((a,j)=>Math.round(a+(colors[stop+1][j]-a)*mix)).join(',')+')');
      }
      if(age>=2 && age<17) {
        const spread=(17-age)/15,phase=(age-2)*.86;
        h.b.parentElement.querySelectorAll('span').forEach((span,j)=>{
          const dx=Math.sin(j*2.08+phase)*spread*.38,dy=Math.cos(j*2.21+phase)*spread*.70;
          span.style.transform='translate('+dx+'em,'+dy+'em) rotate('+((j%3-1)*spread*14)+'deg) scale('+(1+.25*spread)+')';
          span.style.color=age<5?'#c81124':age<9?'#ffdddb':age<11?'#ffba32':age<14?'#dd2130':'var(--hurt)';
          span.style.webkitTextStrokeColor=age<13?'#fff4e9':'#591c24';
        });
      } else if(age>=17 && h.damagePop!==null) {
        h.b.textContent=Math.floor(tenth/10);h.decimal.textContent='.'+tenth%10+'%';h.damagePop=null;
      }
      if(h.score){
        const score=f.stocks-match.fighters[1-i].stocks;
        if(score!==h.lastScore){h.score.textContent=String(score);h.lastScore=score;}
      }
      if(f.stocks!==h.lastStocks) {
        h.lives.replaceChildren();for(let k=0;k<f.stocks;k++) {const im=new Image();im.src=portraits[i].dataset.stock;im.alt='';h.lives.appendChild(im)}
        h.lastStocks=f.stocks;h.lives.setAttribute('aria-label','剩余 '+f.stocks+' 命');
      }
    });
  }
  function shout(word,frames=0) {
    const node=$('callout');
    node.textContent=word;node.dataset.word=word;
    node.className=word==='GAME!'?'game-word':'';
    calloutLife=frames;
  }
  async function start(replay) {
    if(state==='loading')return;
    hitStops.fill(null);
    lastFinalShot=null;
    replayMatch=replay || '';replayFrame=replayMatch?0:-1;
    if(replayMatch){player=0;local=true;remap();}
    $('rematch').textContent=replayMatch?'再次重放':'重新对战';
    $('resume').textContent='继续对战';
    sound.unlock();music?.unlock();sound.sound('select');
    try{initScene()}catch(e){$('fatal').hidden=false;$('fatal').textContent='无法建立 WebGL 2 画面，请使用已开启硬件加速的 Chrome、Edge 或 Safari。 '+e.message;console.error(e);return}
    if(pauseBox.open)pauseBox.close();
    if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
    match=SmashSim.createMatch(player,replayMatch?18086:undefined,{finalSmashMeter:replayMatch?true:meterEnabled,
      staleMoves:replayMatch!=='back-air',spiritHitlag:replayMatch==='back-air'});
    displayHUD();resetInput();fx.clear();accent?.clear();sceneAccent=null;impactHold=0;music?.start();counter=180;visualFrame=0;victoryDelay=0;
    state='count';lastTime=0;accumulator=0;centreX=0;centreY=3.22;viewWidth=26.6;
    lobby.hidden=true;$('hud').hidden=false;$('touch').hidden=!canTouch;$('fatal').hidden=true;
    if(replayMatch) {
      const [kirby,puff]=match.fighters;
      if(replayMatch==='back-air') {
        Object.assign(kirby,{x:-5.55,y:SmashSim.platforms[1].y,platform:1,face:-1,action:'crouch',stocks:2,finalMeter:56});
        fx.landingBurst(kirby.x,kirby.y,2,true);
        Object.assign(puff,{x:-4.10,y:6.18,vx:.20,vy:-.11,grounded:false,platform:-1,action:'fall',actionFrame:30,face:1,damage:91.2,finalMeter:65});
        centreX=-4.77;centreY=8.4;viewWidth=16.61;
      } else {
        const sword=replayMatch==='ultra-sword';
        const platform=sword?3:1;
        Object.assign(kirby,{x:sword?-1:-7.64,y:SmashSim.platforms[platform].y,platform,face:1,damage:sword?57.6:31.35,stocks:2});
        Object.assign(puff,{x:sword?2.39:-3.2,y:sword?SmashSim.platforms[3].y:2.5,platform:sword?3:-1,grounded:sword,action:sword?'crouch':'fall',face:sword?-1:1,damage:sword?30.58:16,stocks:2});
        // One effective FP multiplier per caster reproduces the observed HUD tenths.
        Object.assign(sword?kirby:puff,{finalMeter:100,finalReady:true,finalSince:match.frame,finalDamageScale:sword?1.024:1.025});
        centreX=(kirby.x+puff.x)/2;centreY=(kirby.y+puff.y)/2+2;viewWidth=sword?16:21;
      }
      counter=0;state='play';shout('');
    }
    if(!artworkLoaded) {
      state='loading';$('loading-art').hidden=false;
      await artwork;artworkLoaded=true;$('loading-art').hidden=true;
      state=replayMatch?'play':'count';
    }
    if(!replayMatch){shout('3');music?.announce('3');sound.sound('count');}
    render();schedule();
  }
  function pause() {
    if(state!=='play' && state!=='count')return;
    state='paused';sound.pause();music?.pause();resetInput();pauseBox.classList.remove('result');$('break-title').textContent='对战暂停';$('resume').hidden=false;
    pauseBox.showModal();$('resume').focus();
  }
  function resume() {
    if(state!=='paused')return;
    pauseBox.close();sound.unlock();music?.resume();resetInput();
    if(replayMatch && replayFrame<0 && $('hud').classList.contains('fp-replay')) {
      if(replayMatch!=='back-air')lastFinalShot={frame:match.frame,lens:SmashStage.finalReplayCamera(replayMatch,match.frame)};
      displayHUD(false);hudUpdate();
    }
    state=counter>0?'count':'play';lastTime=0;accumulator=0;schedule();
  }
  function back() {
    if(pauseBox.open)pauseBox.close();resetInput();state='lobby';music?.stop();lobby.hidden=false;$('hud').hidden=$('touch').hidden=true;
    shout('');$('start').focus();
  }
  $('start').onclick=()=>start();$('pause').onclick=pause;$('resume').onclick=resume;$('rematch').onclick=()=>start(replayMatch);$('return').onclick=back;
  const replaySelect=$('replay-select');
  $('watch-replay').onclick=()=>{guide.close();start(replaySelect.value)};
  function openReplayLink(){
    const clip=location.hash.slice(1);
    if(state!=='lobby' || ![...replaySelect.options].some(o=>o.value===clip))return;
    replaySelect.value=clip;if(!guide.open)guide.showModal();$('watch-replay').focus();
  }
  window.addEventListener('hashchange',openReplayLink);openReplayLink();
  pauseBox.addEventListener('cancel',e=>{e.preventDefault();if(state==='paused')resume();else back()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
  window.addEventListener('blur',()=>{resetInput();pause()});
  window.addEventListener('keydown',e=>{
    if(guide.open || pauseBox.open)return;
    if(state==='lobby') {
      if(e.repeat)return;
      if(e.code==='ArrowLeft'||e.code==='ArrowRight'){e.preventDefault();select(e.code==='ArrowLeft'?0:1)}
      else if(e.code==='Enter' && (document.activeElement===document.body || document.activeElement===$('start'))){e.preventDefault();start()}
      return;
    }
    if(e.code==='Escape'){e.preventDefault();pause();return}
    if(!usedKeys.has(e.code))return;
    e.preventDefault();if(!keys.has(e.code))taps.add(e.code);keys.add(e.code);
  });
  window.addEventListener('keyup',e=>{keys.delete(e.code);if(!lobby.hidden || guide.open || pauseBox.open)return;if(usedKeys.has(e.code))e.preventDefault()});
  const pad=document.querySelector('.pad');let padId=null;
  function movePad(e) {
    const r=pad.getBoundingClientRect(),x=clamp((e.clientX-r.left-r.width/2)/(r.width*.42),-1,1),y=clamp((r.top+r.height/2-e.clientY)/(r.height*.42),-1,1);
    axisX=x;axisY=y;
    pad.firstElementChild.style.transform='translate('+x*57+'%,'+-y*57+'%)';
  }
  pad.onpointerdown=e=>{if(padId!==null)return;padId=e.pointerId;pad.setPointerCapture(e.pointerId);movePad(e)};
  pad.onpointermove=e=>{if(padId===e.pointerId)movePad(e)};
  pad.onlostpointercapture=()=>{padId=null;axisX=axisY=0;pad.firstElementChild.style.transform=''};
  for(const b of document.querySelectorAll('[data-action]')) {
    b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);touchTaps.add(b.dataset.action);touchHeld.add(b.dataset.action);b.dataset.pressed='1'};
    b.onlostpointercapture=()=>{touchHeld.delete(b.dataset.action);delete b.dataset.pressed};
  }
  function humanInput(slot,pads) {
    const map=keyMaps[slot],gamepad=pads[slot],buttons=gamepad?.buttons;
    const key=k=>keys.has(map[k]) || taps.has(map[k]);
    const dx=+key('right')-+key('left'),dy=+key('up')-+key('down');
    const touched=!slot && padId!==null;
    const walking=key('walk') && dx!==0;
    const x=dx*(walking?.48:1) || (touched?axisX:gamepad?.axes[0]||0), y=dy || (touched?axisY:-(gamepad?.axes[1]||0));
    const analog=walking || (!(dx || dy) && (touched || !!gamepad));
    const input={x:Math.abs(x)>=.19?Math.sign(x):0,y:Math.abs(y)>=.55?Math.sign(y):0,
      moveX:Math.abs(x)>=.19?x:0,moveY:Math.abs(y)>=.19?y:0,analog};
    const nintendo=/nintendo|joy-con|switch pro|057e/i.test(gamepad?.id||'');
    const padMap={jump:[2,3],attack:[nintendo?1:0],special:[nintendo?0:1],smash:nintendo?[]:[5],shield:[6,7],grab:nintendo?[4,5]:[4]};
    const touch=k=>!slot && (touchHeld.has(k)||touchTaps.has(k));
    for(const [k,indices] of Object.entries(padMap)) input[k]=key(k) || touch(k) || indices.some(i=>buttons?.[i]?.pressed);
    if(touch('tauntUp')) input.taunt='up';
    else if(touch('tauntSide')) input.taunt='side';
    else if(touch('taunt')) input.taunt='down';
    else if(key('taunt')) input.taunt=input.y>0?'up':input.x?'side':'down';
    else if(buttons?.[12]?.pressed) input.taunt='up';
    else if(buttons?.[13]?.pressed) input.taunt='down';
    else if(buttons?.[14]?.pressed || buttons?.[15]?.pressed) input.taunt='side';
    input.shortHop=!!(buttons?.[2]?.pressed && buttons?.[3]?.pressed);
    const rx=gamepad?.axes[2]||0, ry=-(gamepad?.axes[3]||0);
    if(Math.max(Math.abs(rx),Math.abs(ry))>=.72) {
      input.smash=true;
      input.smashX=Math.abs(rx)>=Math.abs(ry)?Math.sign(rx):0;
      input.smashY=input.smashX?0:Math.sign(ry);
    }
    return input;
  }
  // Menus must also poll outside a match: the combat loop sleeps in the
  // lobby and while paused. Stop polling if the last controller disconnects.
  let menuPoll=0, lastPadKeys=new Set();
  function pollPadMenu() {
    const g=Array.from(navigator.getGamepads()).find(Boolean);
    if(!g) {menuPoll=0;lastPadKeys.clear();return}
    const pressed=i=>g.buttons[i]?.pressed;
    const nintendo=/nintendo|joy-con|switch pro|057e/i.test(g.id);
    const flags={left:pressed(14)||g.axes[0]<-.7,right:pressed(15)||g.axes[0]>.7,
      up:pressed(12)||g.axes[1]<-.7,down:pressed(13)||g.axes[1]>.7,
      confirm:pressed(nintendo?1:0),back:pressed(nintendo?0:1),start:pressed(9)};
    const now=new Set(Object.keys(flags).filter(k=>flags[k]));
    const tap=k=>now.has(k) && !lastPadKeys.has(k);
    if(guide.open) {
      if(tap('back') || tap('confirm') || tap('start'))guide.close();
    } else if(state==='lobby') {
      if(tap('left') || tap('right'))select(tap('left')?0:1);
      if(tap('up') || tap('down')){local=!local;remap()}
      if(tap('confirm') || tap('start'))start();
    } else if(state==='paused' || state==='result') {
      const choices=[...pauseBox.querySelectorAll('.break-items button')].filter(b=>!b.hidden);
      const i=Math.max(0,choices.indexOf(document.activeElement));
      if(tap('up')||tap('down'))choices[(i+choices.length+(tap('up')?-1:1))%choices.length].focus();
      if(tap('confirm'))document.activeElement.click();
      else if(tap('start')||tap('back'))state==='paused'?resume():back();
    } else if(tap('start'))pause();
    lastPadKeys=now;menuPoll=requestAnimationFrame(pollPadMenu);
  }
  window.addEventListener('gamepadconnected',()=>{if(!menuPoll)menuPoll=requestAnimationFrame(pollPadMenu)});
  function tick() {
    if(sceneAccent){
      sceneAccent.age+=state==='finish' && sceneAccent.kind==='ko' && sceneAccent.age>=7 && victoryDelay>16?.065:1;
      if(sceneAccent.age>=sceneAccent.duration)sceneAccent=null;
    }
    if(impactHold>0) { impactHold--;return }
    visualFrame++;
    if(calloutLife>0 && --calloutLife===0)shout('');
    if(state==='count') {
      counter--;if(counter===120 || counter===60){shout(String(counter/60));music?.announce(String(counter/60));sound.sound('count')}
      if(counter===0){state='play';shout(accent?'':'GO!',37);sceneAccent={kind:'go',age:0,duration:68,x:0,y:0,dx:1,dy:0,seed:0};music?.announce('GO!');sound.sound('go');resetInput()}
      return;
    }
    if(state==='finish') {
      fx.tick(match);
      $('callout').dataset.phase=victoryDelay>91?'white':victoryDelay<12?'out':'color';
      if(--victoryDelay<=0) {
        state='result';shout('');pauseBox.classList.add('result');
        $('winner-art').src=document.querySelectorAll('.hero')[match.winner].src;
        $('winner-name').textContent=labels[match.winner];
        $('break-title').textContent=zh[match.winner]+'获胜！';$('resume').hidden=true;
        pauseBox.showModal();$('rematch').focus();
      }
      return;
    }
    if(state!=='play')return;
    const pads=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[];
    let input;
    if(replayFrame>=0) {
      const n=++replayFrame;
      if(replayMatch==='back-air') {
        const drift=n<12?{x:1,moveX:.44}:n<=26?{x:1,moveX:.76,moveY:.48}:{};
        if(n===5)Object.assign(drift,{smash:true,smashX:-1,smashY:0});
        input=[{jump:n<=13,x:n<4?0:n<42?1:-1,y:n===47?-1:0,attack:n===7},drift];
      }
      else if(replayMatch==='puff-up') {
        // Kirby runs along the left platform, jumps and steers against the growing wind.
        const left=(n>=40 && n<=130) || (n>=166 && n<=176) || n===241 || (n>=323 && n<=356);
        const x=left?-1:n>=282 && n<=322?0:1;
        const kirby={x,jump:(n>=49 && n<=71) || [121,170,221,319,401].includes(n)};
        if(n===281)Object.assign(kirby,{moveX:.77,moveY:-.78});
        input=[kirby,{special:n===1}];
      }
      // Puff is already crouching at the right tip of the top platform.
      else input=[{special:n===1},n<=15?{y:-1,moveY:-.62,analog:true}:{}];
    } else input=match.fighters.map((f,i)=>i===player?humanInput(0,pads):local?humanInput(1,pads):SmashSim.cpuInput(match,i));
    match.fighters.forEach((f,i)=>Object.assign(beforeContact[i],f));
    SmashSim.step(match,input);const played=music?.updateMoves?.(match.fighters,match.events);taps.clear();touchTaps.clear();fx.tick(match);
    for(const e of match.events) {
      if(e.type==='hit' || e.type==='shieldHit' || e.type==='parry') {
        const defender=e.type==='hit'?e.target:e.fighter, attacker=1-defender;
        const f=match.fighters[attacker], t=match.fighters[defender];
        if(f.hitlag>0 && e.move!=='wave' && !(hitStops[attacker]?.frame===match.frame && hitStops[attacker].victim))
          hitStops[attacker]={frame:match.frame,total:f.hitlag+1,ground:beforeContact[attacker].grounded,victim:false};
        if(e.type==='hit' && t.hitlag>0)
          hitStops[defender]={frame:match.frame,total:t.hitlag+1,ground:beforeContact[defender].grounded,victim:true,
            backAirReel:e.move==='bair' && f.kind==='kirby' && t.kind==='jigglypuff' && t.tumbling && !beforeContact[defender].grounded,
            from:t.action==='stun'?{...beforeContact[defender]}:null};
      }
      const hasMoveAudio=music?.updateMoves && (e.type==='sing' || e.type==='swing' && recordedSwings.has(e.move));
      if(!hasMoveAudio && !played?.has(e))sound.sound(e.type,e);
      fx.event(e,match,teams);
      if(e.type==='hit' && (e.move==='ultraSword' || e.strong && e.damage>=10) && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const caster=match.fighters[e.fighter];
        // The blade catch and later sweeps reveal the new digits on the next tick.
        // The first sweep waits two ticks, and the finishing launch waits three.
        let delay=2;
        if(e.move==='ultraSword') {
          const closeCatch=caster.finalPhase==='start' && caster.actionFrame<20;
          const firstSweep=caster.finalPhase==='attack' && caster.finalFrame===SmashFinalSmash.slashes[0];
          delay=e.kb>0?3:closeCatch || firstSweep?2:1;
        }
        meters[e.target].damagePop=visualFrame+delay-2;
      }
      if(e.type==='hit' && (e.strong || e.move==='rest') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const target=match.fighters[e.target];
        if(e.strong && target.stocks===1 && predictedLaunchKO(match,e.target)) {
          impactHold=50;
          sceneAccent={kind:'critical',age:0,duration:57,x:e.x,y:e.y,dx:target.kx,dy:-target.ky,seed:match.frame};
        } else if(e.move==='rest') {
          const puff=match.fighters[e.fighter], gap=puff.x-target.x;
          impactHold=Math.max(0,28-target.hitlag);
          sceneAccent={kind:'restZoom',age:0,duration:39,caster:e.fighter,
            x:(puff.x+target.x)/2,y:(puff.y+target.y)/2+.91,
            parting:(Math.sign(gap)||-puff.face)*Math.max(0,1.52-Math.abs(gap))*.5,
            startX:centreX,startY:centreY,startWidth:Math.min(viewWidth,9.4)};
        }
      }
      if(e.type==='ko') {
        sceneAccent={kind:'ko',age:0,duration:32,x:e.x,y:e.y,dx:e.face||e.vx*.6,dy:e.top?-1:e.bottom?1:-e.vy*.5,color:teams[e.fighter].color,seed:match.frame};
      }
      if(e.type==='ko' && match.winner===null)shout(match.fighters[player].stocks+' – '+match.fighters[1-player].stocks,41);
      if(e.type==='suddenDeath')shout('SUDDEN DEATH',70);
    }
    if(match.winner!==null) {state='finish';music?.stop();music?.announce('GAME!');shout('GAME!');$('callout').dataset.phase='white';victoryDelay=102;resetInput()}
    // Keep the filmed return to play in each clip, including the two frames after Puff Up ends.
    if(replayFrame===replayEndFrame[replayMatch]) {
      replayFrame=-1;pause();$('break-title').textContent='重放结束';$('resume').textContent='接手对战';
    }
  }
  // Run only for a strong last-stock hit. Confirm that the unaided launch
  // crosses a blast line during hitstun before showing the finishing zoom.
  function predictedLaunchKO(current,index) {
    const future=structuredClone(current), target=future.fighters[index];
    const initial=target.stocks;
    for(let i=0;i<180 && (target.action==='stun' || target.hitlag>0);i++) {
      SmashSim.step(future);
      if(target.stocks<initial || target.screenKO)return true;
    }
    return false;
  }
  function render(reusePose=false) {
    const w=window.innerWidth,h=window.innerHeight,dpr=Math.min(devicePixelRatio||1,1.8), aspect=w/h;
    if(world.width!==Math.floor(w*dpr) || world.height!==Math.floor(h*dpr)) {
      renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);overlay.width=world.width;overlay.height=world.height;$('accent').width=world.width;$('accent').height=world.height;
    }
    const fighters=match.fighters;
    const alive=fighters.filter(f=>f.action!=='ko');
    // Kirby carries both fighters off the top of the screen. Resume following
    // them at impact, including when a platform intercepts the descent.
    const carry=alive.find(f=>f.kind==='kirby' && f.action==='throwU' && f.caught>=0);
    let [a,b]=alive.length===2 ? alive : [alive[0]||fighters[0],alive[0]||fighters[1]];
    if(carry?.throwOrigin && !carry.throwOrigin.landed) {
      const origin=carry.throwOrigin;
      let landingY=origin.y;
      for(const p of SmashSim.platforms) {
        if(carry.x>=p.left && carry.x<=p.right)landingY=Math.max(landingY,p.y);
      }
      const ascent=clamp((carry.actionFrame-6)/18,0,1);
      a=b={x:origin.x,y:origin.y+(landingY-origin.y)*ascent};
    }
    // The side platform occupies about a third of the picture in close
    // Dream Land duels. Preserve space around the fighters as they separate.
    // During a fast launch the camera starts pulling back as hitstop ends.
    // Lead the accelerated first steps so the launched fighter stays in view.
    const launched=alive.find(f=>f.action==='stun' && f.tumbling && f.launchSpeedUp>1.5);
    if(launched && launched.hitlag<6) {
      const framesAhead=launched.hitlag?Math.min(4.25,6-launched.hitlag):clamp(4.25-(launched.actionFrame-1)*.8,.6,4.25);
      const lead=framesAhead*clamp(launched.launchSpeedUp,1,4);
      const ahead={x:launched.x+launched.kx*lead,y:launched.y+launched.ky*lead};
      if(a===launched)a=ahead;
      if(b===launched)b=ahead;
    }
    const spanning=clamp(Math.abs(a.x-b.x)*1.48+5.82,11.35,39), vertical=Math.abs(a.y-b.y)+5.94;
    let width=state==='count'?Math.max(25.8,13.2*aspect):Math.max(spanning,Math.min(22,vertical)*aspect);
    const midpoint=(a.x+b.x)*.5;
    let targetX=clamp(midpoint-clamp(midpoint*.14,-1.05,1.05),-15.9,15.9);
    const groundBias=1.06-.54*clamp(Math.min(a.y,b.y)/5.3,0,1);
    let targetY=clamp((a.y+b.y)*.5+groundBias,1.0,15.4);
    const finalFighter=fighters.find(SmashFinalSmash.isActive);
    if(fighters.some(f=>f.screenKO)) {
      width=Math.max(30.4,17.1*aspect);
      targetX=clamp((alive[0]?.x||0)*.5,-5,5);targetY=2.4;
    }
    const critical=sceneAccent?.kind==='critical' && !!accent;
    const rest=sceneAccent?.kind==='restZoom'?sceneAccent:null;
    // The footage opens on a wide flare, cuts in for about 42 frames, then
    // restores the stage under the receding red flash.
    const closeup=critical && sceneAccent.age>=6 && sceneAccent.age<50;
    const cutout=critical && sceneAccent.age<50;
    if(closeup){width=Math.max(5.65,3.1*aspect);targetX=sceneAccent.x;targetY=sceneAccent.y+.12}
    if(launched?.hitlag>0 && !closeup)width=Math.max(width,viewWidth);
    const follow=critical?33:launched && !launched.hitlag?7.5:5;
    const smooth=state==='finish'?0:1-Math.exp(-follow*Math.max(0,render.delta||1/60));
    centreX+=(targetX-centreX)*smooth;centreY+=((state==='count'?3.22:targetY)-centreY)*smooth;
    viewWidth+=(width-viewWidth)*smooth;
    if(rest) {
      const t=clamp(rest.age/12,0,1),zoomIn=t*t*(3-2*t);
      const back=clamp((rest.age-28)/11,0,1),zoomOut=back*back*(3-2*back);
      const closeWidth=Math.max(3.72,2.23*aspect);
      centreX=(rest.startX+(rest.x-rest.startX)*zoomIn)*(1-zoomOut)+targetX*zoomOut;
      centreY=(rest.startY+(rest.y-rest.startY)*zoomIn)*(1-zoomOut)+targetY*zoomOut;
      viewWidth=(rest.startWidth+(closeWidth-rest.startWidth)*zoomIn)*(1-zoomOut)+width*zoomOut;
    }
    const atReplayEnd=replayFrame<0 && state==='paused' && $('hud').classList.contains('fp-replay');
    let recordedLens=null;
    if(replayFrame>=0 || atReplayEnd) {
      if(replayMatch==='back-air')recordedLens=SmashStage.backAirCamera(atReplayEnd?51:replayFrame);
      else if(replayMatch)recordedLens=SmashStage.finalReplayCamera(replayMatch,match.frame);
    } else if(!critical && !rest && !fighters.some(f=>f.screenKO)) {
      const normal={x:targetX,y:targetY,width};
      if(finalFighter){
        recordedLens=SmashStage.liveFinalCamera(finalFighter,fighters[1-finalFighter.index]);
        // A missed sword cannot capture after animation frame 60. Follow both
        // live fighters again during the remainder of the swing.
        const missed=finalFighter.action==='ultraSword' && finalFighter.finalPhase==='start' && finalFighter.finalTarget<0 && finalFighter.finalFrame>60;
        if(missed)recordedLens=SmashStage.releaseFinalCamera(recordedLens,normal,(finalFighter.finalFrame-60)/29);
        lastFinalShot={frame:match.frame,lens:recordedLens};
      } else if(lastFinalShot){
        const age=match.frame-lastFinalShot.frame;
        if(age<14){
          recordedLens=SmashStage.releaseFinalCamera(lastFinalShot.lens,normal,age/14);
          recordedLens.frame=lastFinalShot.lens.frame+age;
        }
        else lastFinalShot=null;
      }
    }
    camera.userData.dreamLandLens=recordedLens;
    if(recordedLens){
      centreX=recordedLens.x;centreY=recordedLens.y;viewWidth=recordedLens.width;
    }
    const widthVisible=Math.max(viewWidth,aspect<1 && !closeup && !rest ? 21:0),heightVisible=widthVisible/aspect;
    const shake=recordedLens || matchMedia('(prefers-reduced-motion:reduce)').matches?0:fx.shake;
    const x=centreX+Math.sin(visualFrame*2.8)*shake,y=centreY+Math.cos(visualFrame*2.2)*shake*.55;
    camera.left=-widthVisible/2;camera.right=widthVisible/2;camera.top=heightVisible/2;camera.bottom=-heightVisible/2;
    camera.position.set(x,y,35);camera.updateProjectionMatrix();
    view={left:x+camera.left,right:x+camera.right,top:y+camera.top,bottom:y+camera.bottom,scale:w/widthVisible,pixels:w};
    view.registeredRadar=!recordedLens?.live && recordedLens?.final==='puff-up' && Math.abs(aspect-16/9)<.10;
    view.recordedLoupe=view.registeredRadar?fx.replayLoupe(match.frame):null;
    scene.background=cutout?null:skyColor;
    scene.getObjectByName('Dream Land (64)').visible=!cutout;
    $('hud').style.visibility=critical || rest?'hidden':'';
    // The recorded Whispy is looking left. Register his native stage motion
    // to that frame of the recording, including the paused replay end.
    const stageFrame=recordedLens && !recordedLens.live && replayMatch==='back-air'?854+(atReplayEnd?51:replayFrame):visualFrame;
    stage.update(stageFrame/60,widthVisible);
    const visualFinal=SmashPuffFX.visualPose(finalFighter);
    // High-refresh displays can redraw the same simulation tick. Normal poses
    // and shadows stay in world space; cinematic poses can follow the camera.
    if(!reusePose || sceneAccent || finalFighter || fighters.some(f=>f.screenKO)) {
      fighters.forEach((f,i)=>{
        let pose=f===finalFighter?visualFinal:f,scale=SmashFighters.worldScale[f.kind];
        if(f.action==='star' || f.action==='copyStar' || critical) scale=1;
        if(f.action==='grabbed' && !f.hidden && f.inhaleOrigin) {
          const {age,frames}=f.inhaleOrigin;
          scale*=1-.85*clamp((age/frames-.48)/.52,0,1);
          pose={...f,action:'stun',actionFrame:age+1};
        }
        if(rest) {
          const portraitBlend=clamp(rest.age/7,0,1)*clamp((39-rest.age)/10,0,1);
          scale+=(1-scale)*portraitBlend;
          const part=(.60+.40*clamp(rest.age/7,0,1))*clamp((37-rest.age)/9,0,1)*rest.parting;
          pose={...pose,x:f.x+(i===rest.caster?part:-part)};
          if(rest.age<=28){pose.action=i===rest.caster?'restZoom':'restVictim';pose.actionFrame=rest.age+1}
        }
        const stop=hitStops[i], age=stop?match.frame-stop.frame:0;
        const active=stop && age>=0 && age<stop.total;
        if(stop?.backAirReel && pose.action==='stun'){
          pose={...pose,backAirReel:true};
        } else if(active && stop.from && pose.action==='stun') {
          // The victim holds its last pose for about 15% of the stopped frames.
          const weight=clamp((age-Math.ceil(stop.total*.15)+1)/3,0,1);
          if(weight<1)pose={...pose,hitPoseFrom:stop.from,hitPoseWeight:weight};
        }
        models[i].group.scale.setScalar(scale);
        models[i].update(SmashFinalSmash.swordPose(pose,finalFighter,recordedLens?.final==='ultra-sword' && !recordedLens.live),visualFrame/60);
        if(active && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
          const end=stop.victim?Math.ceil(stop.total*.75):Math.min(6,stop.total);
          if(age<end) {
            const shake=widthVisible*.0027*(1-age/end)*(age%2?-1:1);
            models[i].group.position[stop.ground?'x':'y']+=shake;
          }
        }
        models[i].setFire(fx.burnLevel(i));
      });
      fighters.forEach((f,i)=>{
        if(f.action==='grabbed' && f.captureMove)models[i].alignCapture(models[1-i],f);
        shadows.update(i,models[i].group,!critical,!finalFighter);
        SmashScreenKO.draw(models[i],f,fighters[1-i],view,scene,visualFrame/60);
      });
    }
    restBackdrop?.update(rest?{x:rest.x,y:rest.y,progress:rest.age/rest.duration}:null);
    finalScene.update(visualFinal,view,recordedLens);
    puffAura(renderer,camera,visualFinal,view);
    fx.positionTrails(!critical,match);
    const kirbyVisible=models[0].group.visible;
    if(view.recordedLoupe)models[0].group.visible=false;
    renderer.render(scene,camera);
    models[0].group.visible=kirbyVisible;
    fx.draw(match,view,teams,rest?.age);hudUpdate();
    if(sceneAccent && !rest && accent) {
      const a=sceneAccent;
      const px=a.kind==='go'?.5:clamp((a.x-view.left)/widthVisible,.008,.992);
      const py=a.kind==='go'?.44:clamp((view.top-a.y)/heightVisible,.014,.986);
      accent.draw({...a,subjects:cutout?world:undefined,x:px,y:py,progress:a.age/a.duration});
    } else accent?.clear();
  }
  // One animation owner for the whole match. A stale callback from the previous
  // match is cancelled when the game moves to a modal or a fresh round.
  let raf=0;
  function schedule(){cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
  function loop(time) {
    cancelAnimationFrame(raf);raf=0;
    if(!['play','count','finish'].includes(state))return;
    const delta=lastTime?clamp((time-lastTime)/1000,0,.1):0;lastTime=time;render.delta=delta;
    accumulator+=delta;
    const reusePose=accumulator<1/60;
    while(accumulator>=1/60 && ['play','count','finish'].includes(state)) {tick();accumulator-=1/60}
    render(reusePose);if(['play','count','finish'].includes(state))schedule();
  }
  window.addEventListener('resize',()=>{if(renderer && artworkLoaded && state!=='lobby')render()});
  remap();
})();

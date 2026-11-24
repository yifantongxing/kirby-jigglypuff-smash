// The +Z surface of the body faces the camera. Feature positions below are angles
// on the sphere, so the eyes follow its curvature even during a full turn.
(() => {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const PI = Math.PI;
  const skinColor = { kirby: '#ff9bc4', puff: '#ffd0de' };
  const faceMaps = new Map();
  const puffIrisAtlas=globalThis.document?.getElementById('puff-irises');
  let puffIrisFibers;

  function irisFibers() {
    if(puffIrisFibers) return puffIrisFibers;
    const tile=document.createElement('canvas');
    tile.width=tile.height=176;
    const c=tile.getContext('2d');
    c.scale(2,2);c.translate(44,44);c.lineCap='round';
    let seed=752;
    function noise() {seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
    for(let y=-39;y<40;y+=2.2) {
      for(let x=-39;x<40;x+=2.1) {
        const px=x+(noise()-.5)*2.0, py=y+(noise()-.5)*2.1;
        if(Math.hypot(px,py)>38.2) continue;
        const angle=PI*.5+.36*Math.sin(px/17)+(noise()-.5)*.72;
        const band=clamp((17.5-py)/6,0,1)*clamp((py+24)/8,0,1);
        const len=.9+2*noise(), contrast=(.28+.58*noise())*(.18+.82*band);
        c.strokeStyle=noise()<.52?'rgba(7,53,75,'+contrast+')':'rgba(150,238,231,'+contrast+')';
        c.lineWidth=.68+noise()*.67;
        c.beginPath();c.moveTo(px,py);c.lineTo(px+Math.cos(angle)*len,py+Math.sin(angle)*len);c.stroke();
      }
    }
    // The lower reflection is a broken crescent beneath the darker iris fibers.
    for(let i=0;i<79;i++) {
      const x=-17+noise()*42;
      const y=22+7*(1-((x-3)/23)**2)+noise()*6;
      if(Math.hypot(x,y)>37.5) continue;
      c.strokeStyle='rgba(160,255,244,'+(.46+.48*noise())+')';c.lineWidth=.7+noise()*.8;
      c.beginPath();c.moveTo(x,y);c.lineTo(x-.4,y+1+2*noise());c.stroke();
    }
    puffIrisFibers=tile;
    return tile;
  }

  function faceTexture(T, kind, expression) {
    const id = kind + expression;
    const useIrisAtlas=kind==='puff' && !!puffIrisAtlas?.naturalWidth && puffIrisAtlas.complete;
    const cached=faceMaps.get(id);
    if (cached && cached.userData.useIrisAtlas===useIrisAtlas) return cached;
    const canvas = document.createElement('canvas');
    const pixels=expression==='screen' || kind==='puff' && expression==='restZoom'?1.5:.75;
    canvas.width = 1024*pixels;
    canvas.height = 512*pixels;
    const c = canvas.getContext('2d');
    c.scale(pixels,pixels);
    c.fillStyle = skinColor[kind];
    c.fillRect(0, 0, 1024, 512);
    c.translate(256, 256);
    const puff = kind === 'puff';
    const screen=expression==='screen';
    const closed = ['blink','sleep','singBreath','rest','hurt'].includes(expression) || screen && !puff;
    const keen = expression === 'attack' || expression === 'attackOpen';
    const jaw = expression==='inhale' ? 1 : expression==='inhaleMid' ? .54 : 0;
    const full = expression==='full';

    function oval(x, y, rx, ry, color) {
      c.fillStyle = color;
      c.beginPath();
      c.ellipse(x, y, rx, ry, 0, 0, 2 * PI);
      c.fill();
    }
    if(screen && !puff) oval(0,-1,142,106,'#d795ab');
    for (const side of [-1, 1]) {
      const x = side * (puff ? 78 : 40);
      const y = puff ? (screen?-45:-34) : -29-66*jaw-(full?23:0);
      if (!puff) {
        c.save();
        c.translate(side*(92+18*jaw),12-61*jaw-(full?18:0));
        c.rotate(-side * .09);
        const blush = c.createRadialGradient(0, 0, .1, 0, 0, 1);
        blush.addColorStop(0, '#e75597');
        blush.addColorStop(.70, '#ed669f');
        blush.addColorStop(1, skinColor.kirby);
        c.scale(28.5, 9.5);
        oval(0, 0, 1, 1, blush);
        c.restore();
      }
      c.save();
      c.translate(x, y);
      if (closed) {
        const width = puff ? 39 : screen?27:16;
        c.lineWidth = puff ? 4 : 5;
        c.lineCap = 'round';
        c.strokeStyle = puff ? (expression==='rest'?'#573142':'#752f4c') : '#542341';
        c.beginPath();
        if (expression === 'hurt') {
          c.moveTo(side * width, -12);
          c.lineTo(-side * width * .65, 0);
          c.lineTo(side * width, 10);
        } else {
          c.moveTo(-width, 0);
          c.quadraticCurveTo(0, screen?-21:expression==='rest'||expression==='singBreath'?12:18, width, 0);
        }
        c.stroke();
      } else if (puff) {
        c.rotate(side*(expression==='restZoom'?.14:-.12));
        c.scale(1.17,1.18);
        if(expression==='throwPuff') {
          c.beginPath();c.moveTo(-59,-25+22*side);c.lineTo(59,-25-22*side);
          c.lineTo(59,60);c.lineTo(-59,60);c.closePath();c.clip();
        }
        if(expression==='drowsy') {c.beginPath();c.rect(-58,-8,116,64);c.clip();}
        if(expression==='restZoom') {
          c.beginPath();c.moveTo(-60,-3);c.quadraticCurveTo(0,-19,60,-2);
          c.lineTo(60,60);c.lineTo(-60,60);c.closePath();c.clip();
        }
        oval(0, 0, 51.5, 48.5, '#e9a5ba');
        const sclera=c.createLinearGradient(0,20,0,47);
        sclera.addColorStop(0,'#fff8f9');sclera.addColorStop(.55,'#f4f0f3');sclera.addColorStop(1,'#b2abb8');
        oval(0, -1, 50, 47.5, sclera);
        if (useIrisAtlas) {
          // The two columns are the actual right and left eye colors. The lower
          // row contains the three reflected highlights used during screen KOs.
          c.drawImage(puffIrisAtlas, side<0?0:160, screen?160:0, 160,160, -42.45,-42.45,84.9,84.9);
          if(expression==='restZoom') {
            c.save();
            c.beginPath();c.ellipse(0,0,39.7,40,0,0,2*PI);c.clip();
            const reflection=c.createLinearGradient(0,-20,0,39);
            reflection.addColorStop(0,'rgba(3,26,46,.36)');
            reflection.addColorStop(.38,'rgba(17,101,125,.15)');
            reflection.addColorStop(.53,'rgba(40,167,178,.61)');
            reflection.addColorStop(.72,'rgba(47,205,209,.77)');
            reflection.addColorStop(.78,'rgba(62,224,226,.88)');
            reflection.addColorStop(.90,'rgba(42,190,195,.72)');
            reflection.addColorStop(1,'rgba(39,184,188,.70)');
            c.fillStyle=reflection;c.fillRect(-41,-41,82,82);
            c.drawImage(irisFibers(),-44,-44,88,88);
            c.restore();
          }
        } else {
          const iris = c.createLinearGradient(0, -39, 0, 42);
          iris.addColorStop(0, '#123a4c');
          iris.addColorStop(.36, '#17485b');
          iris.addColorStop(.58, '#1c6b80');
          iris.addColorStop(.66, '#2498a3');
          iris.addColorStop(.73, '#29b4bb');
          iris.addColorStop(.91, '#48ced2');
          iris.addColorStop(1, '#80f4e5');
          oval(0, 0, 41, 41, '#265965');
          oval(0, 0, 39.7, 40, iris);
          c.globalAlpha=screen?.24:1;c.drawImage(irisFibers(),-44,-44,88,88);c.globalAlpha=1;
        }
        if(expression==='restZoom') {
          c.fillStyle='#321f32';c.beginPath();c.moveTo(-49,-3);
          c.quadraticCurveTo(-2,-20,49,-1);c.quadraticCurveTo(-4,-6,-49,-3);
          c.closePath();c.fill();
        } else if(!useIrisAtlas) {
          const glint=c.createRadialGradient(10,-18,8,10,-18,20);
          glint.addColorStop(0,'#fcffff');glint.addColorStop(.52,'rgba(221,255,255,.68)');glint.addColorStop(1,'rgba(194,254,255,0)');
          oval(10,-18,20,20,glint);
          oval(10, -18, screen?16:11.5, screen?16:12, '#ffffff');
          oval(-12, 22, 3.2, 2.1, '#54c1c5');
          if(screen) {oval(-15,14,10,12,'#c3ffff');oval(1,27,4,4,'#d3ffff');}
        }
      } else {
        c.scale(1.11-.21*jaw,1.11-.30*jaw);
        c.rotate(side * .035 + (keen ? -side * .2 : 0));
        if(expression==='inhalePrep') {c.beginPath();c.rect(-20,-6,40,54);c.clip();}
        const iris = c.createLinearGradient(0, -42, 0, 43);
        iris.addColorStop(0, '#160e1c');
        iris.addColorStop(.48, '#211120');
        iris.addColorStop(.64, '#17172c');
        iris.addColorStop(.86, '#263e8d');
        iris.addColorStop(1, '#4972da');
        oval(0, 0, 16.1, 43, '#381b39');
        oval(0, 0, 14.4, 41, iris);
        oval(0, -17, 9.4, 14.5, '#fffafd');
      }
      c.restore();
    }
    const mouthY = puff ? 16 : full ? -4 : 30;
    if(screen) {
      const x=puff?46:24, y=puff?42:22, center=puff?43:32;
      const cavity=c.createLinearGradient(0,center-y,0,center+y);
      cavity.addColorStop(0,'#210d20');cavity.addColorStop(1,'#572c39');
      oval(0,center,x,y,cavity);
      oval(-1,center+y*.35,x*.76,y*.56,puff?'#8e556b':'#662334');
    } else if (jaw || ['open','singNote','rest','drowsy','restZoom','hurt','attackOpen'].includes(expression)) {
      const resting=expression==='rest'||expression==='drowsy';
      const rx = jaw ? 14+110*jaw : resting?16:expression==='restZoom'?15:(puff?12:13);
      const ry = jaw ? 16+96*jaw : expression==='singNote'?23:resting?8:expression==='restZoom'?11:16;
      const y = mouthY + (jaw ? 7 : 0);
      const inside = c.createLinearGradient(0, y - ry, 0, y + ry);
      inside.addColorStop(0, '#511531');
      inside.addColorStop(.58, puff ? '#87445a' : '#a21e46');
      inside.addColorStop(1, '#e97182');
      oval(0, y, rx, ry, '#87354c');
      oval(0, y-.3, Math.max(1,rx-2.5), Math.max(1,ry-2), inside);
      if (jaw) oval(0, y + ry * .65, rx * .56, ry * .18, '#c84965');
      if(expression==='restZoom') oval(0,y+ry*.48,rx*.62,ry*.29,'#bf6a7b');
    } else if(expression==='throwPuff') {
      c.fillStyle='#774050';c.beginPath();c.moveTo(-17,mouthY+2);
      c.quadraticCurveTo(0,mouthY+8,17,mouthY+2);c.quadraticCurveTo(4,mouthY+14,-17,mouthY+2);c.fill();
      c.fillStyle='#fff6f3';
      for(const side of [-1,1]){
        c.beginPath();c.moveTo(side*16,mouthY+4);c.lineTo(side*10,mouthY+5);
        c.lineTo(side*12,mouthY+11);c.fill();
      }
    } else if(expression==='cheer') {
      c.fillStyle='#852c4a';c.beginPath();
      c.moveTo(-28,mouthY-8);c.quadraticCurveTo(0,mouthY-5,28,mouthY-9);
      c.bezierCurveTo(23,mouthY+25,-16,mouthY+34,-28,mouthY-8);c.fill();
      c.fillStyle='#ea7084';c.beginPath();c.moveTo(-14,mouthY+10);
      c.quadraticCurveTo(0,mouthY+2,16,mouthY+7);c.quadraticCurveTo(3,mouthY+27,-14,mouthY+10);c.fill();
    } else if(full) {
      c.strokeStyle='#66243f';c.lineWidth=3.6;c.lineCap='round';c.beginPath();
      c.moveTo(-15,mouthY+4);c.quadraticCurveTo(-9,mouthY-5,0,mouthY);
      c.quadraticCurveTo(9,mouthY-4,15,mouthY+4);c.stroke();
    } else if(expression==='ready'&&!puff) {
      oval(0,mouthY+1,3.3,3.7,'#77334d');
    } else {
      c.strokeStyle = puff ? '#a34e70' : '#8a284d';
      c.lineWidth = puff ? 2.5 : 3;
      c.lineCap = 'round';
      c.beginPath();
      const w = puff ? 16 : 9;
      c.moveTo(-w, mouthY);
      c.quadraticCurveTo(0, mouthY+(keen ? -3 : 7), w, mouthY-1);
      c.stroke();
    }
    const texture = cached || new T.CanvasTexture(canvas);
    if(cached){texture.image=canvas;texture.needsUpdate=true;}
    texture.userData.useIrisAtlas=useIrisAtlas;
    texture.colorSpace = T.SRGBColorSpace;
    faceMaps.set(id, texture);
    return texture;
  }

  // Fixed camera samples of the four Ultimate Frame Data aerial animations.
  // Body rows: frame, yaw/pitch/roll (degrees), horizontal/vertical stretch.
  // Foot rows: frame, then the two screen-plane (x,y,angle,length) tuples.
  // Offsets are relative to the torso center; the near sole stays in front
  // of the body during kicks irrespective of the rotating pelvis.
  const airPoses = {
    kirby: {
      fair: {
        body: [
          [1,0,2,-5,1,1],[3,-44,1,7,.89,1.09],[6,21,2,9,.92,1.05],
          [9,70,4,10,.94,1.04],[10,77,6,9,1.06,.76],[12,78,1,1,1.03,.82],
          [14,92,2,-4,.83,1.09],[16,120,0,-6,.91,1.01],[17,150,4,-9,1.08,.73],
          [19,164,1,-9,1.06,.78],[21,180,-2,1,.85,1.06],[22,235,3,2,.87,1.05],
          [23,308,6,1,.98,.94],[24,380,6,-4,1.05,.88],[25,428,6,-5,1.11,.72],
          [27,456,4,0,1.03,.86],[30,478,-6,-8,.91,.98],[34,538,1,-9,.99,.97],
          [38,604,-4,-7,1,1],[41,680,3,-9,1.02,.96],[44,711,7,-13,1,.98],[47,722,10,-14,1,1],
        ],
        feet: [
          [1,-.44,-.57,-131,.87,.35,-.63,-73,.94],[5,-.36,-.40,-131,.67,-.07,-.63,-124,.89],
          [9,-.47,-.47,-123,.82,.36,-.56,-69,.81],[10,-.60,-.40,-126,.88,.76,-.19,2,1.46],
          [12,-.53,-.44,-116,.82,.68,-.32,9,1.20],[14,-.32,-.62,-133,.77,.30,-.64,-55,.76],
          [16,-.29,-.50,-138,.66,.30,-.66,-59,.85],[17,-.55,-.45,-137,1.0,.84,-.35,-14,1.51],
          [19,-.37,-.59,-111,.91,.58,-.49,-33,.98],[21,-.42,-.68,-120,.92,.34,-.58,-78,.87],
          [24,-.48,-.40,-147,.71,.30,-.58,4,1.07],[25,-.65,-.37,-153,1.07,.84,-.25,-9,1.54],
          [27,-.53,-.46,-119,.91,.54,-.35,-40,1.04],[30,-.38,-.64,-106,1.05,.25,-.46,-56,.80],
          [34,-.52,-.45,-147,1.02,.36,-.61,-66,.98],[38,-.03,-.52,-77,.88,.51,-.48,-39,1.03],
          [42,-.28,-.62,-106,.93,.54,-.49,-46,1.03],[47,-.45,-.54,-149,1.0,.31,-.62,-79,.80],
        ],
      },
      bair: {
        body: [
          [1,165,-1,-2,.74,1.10],[2,174,-3,-5,.58,1.23],[4,141,-6,-10,.85,1.08],
          [5,34,9,17,.94,.93],[6,-26,16,-27,1.18,.61],[10,-25,17,-24,1.18,.64],
          [12,-20,19,-15,1.11,.73],[14,-19,15,-22,1.04,.91],[23,-19,15,-22,1.01,.93],
          [25,-13,18,-21,.98,.93],[27,-25,15,-78,1,.98],[29,-79,-6,-153,1.01,1.0],
          [30,-101,-13,-204,1,1],[32,-67,-17,-247,.98,1.01],[34,-20,-12,-302,1,1],[36,30,-3,-327,.98,1.03],
          [38,45,2,-350,.98,1.02],[40,46,5,-357,1,1],
        ],
        feet: [
          [1,.37,-.68,4,.80,.25,-.61,-23,.82],[3,.28,-.70,-29,.79,.34,-.61,-53,.84],
          [5,-.23,-.55,-125,.67,-.36,-.60,-132,.77],[6,-.90,-.28,172,1.58,-.78,-.39,170,1.43],
          [12,-.79,-.26,168,1.33,-.74,-.40,168,1.28],[15,-.62,-.13,171,1.07,-.58,-.43,167,1.17],
          [24,-.55,-.13,171,1.03,-.53,-.44,169,1.02],[27,-.55,.29,151,1.04,-.60,-.04,-146,1.19],
          [29,-.31,.68,141,.92,-.52,.54,153,.97],[32,.56,.43,98,1.00,.61,.16,105,1.01],
          [35,.48,-.48,-60,1.03,.66,-.34,30,1.00],[37,-.11,-.62,-87,.93,.35,-.56,-45,.84],
          [40,-.45,-.62,-134,1.02,-.22,-.50,-136,.82],
        ],
      },
    },
    puff: {
      fair: {
        body: [
          [1,52,8,8,1,1],[4,63,-3,17,.97,1.06],[6,64,-4,18,.95,1.05],
          [7,59,-3,56,1.02,.99],[8,52,-2,65,1.01,.98],[20,45,-1,65,1.01,.98],
          [25,36,-4,76,1,1],[27,25,-5,109,1,1],[29,20,-2,143,1,1],
          [32,35,6,160,.99,1.01],[36,60,15,176,.99,1.02],
        ],
        feet: [
          [1,.28,-.60,15,.85,.53,-.44,17,.84],[4,.53,-.23,56,.79,.52,-.34,57,.86],
          [6,.55,-.21,56,.78,.54,-.30,56,.91],[7,.77,.06,17,1.24,.76,.21,17,1.23],
          [8,.91,0,8,1.52,.87,.15,10,1.50],[20,.89,-.06,5,1.44,.87,.14,7,1.42],
          [24,.78,-.09,1,1.31,.79,.15,2,1.30],[26,.71,-.06,3,1.16,.72,.17,4,1.13],
          [29,.51,.36,38,.92,.49,.54,57,.88],[32,.42,.53,68,.85,.27,.61,69,.82],
          [36,.29,.65,77,.91,-.02,.63,90,.89],
        ],
      },
      bair: {
        body: [
          [1,49,10,10,1,1],[4,70,10,14,.94,1.02],[7,87,9,15,.91,1.06],
          [8,70,5,16,.94,1.00],[9,3,-6,-5,1.01,.92],[10,-14,9,-5,1.12,.75],
          [12,-43,5,-11,1.08,.89],[14,-107,5,-7,1,.98],[17,-175,3,0,1,1],
          [21,-230,3,-7,1,.99],[24,-292,4,-3,1,1],[28,-338,0,-6,1,1],
          [31,-361,3,-6,1,.99],[35,-379,7,-5,1,1],
        ],
        feet: [
          [1,-.14,-.62,-22,.86,.35,-.52,6,.88],[4,.26,-.59,20,.82,.45,-.45,28,.86],
          [7,.36,-.58,55,.77,.43,-.41,58,.85],[9,-.45,-.39,-149,.77,.26,-.58,-28,.83],
          [10,-1.03,-.18,-173,2.04,.19,-.46,-21,.88],[11,-1.01,-.17,-173,1.94,.23,-.43,-21,.86],
          [12,-.82,-.12,174,1.49,.34,-.48,-36,.91],[14,-.40,-.21,144,.85,.43,-.54,-64,.81],
          [17,-.26,-.62,-137,.87,.55,-.46,-15,1.05],[20,-.44,-.59,-142,.81,.47,-.56,-17,1.01],
          [24,-.35,-.61,-143,.86,-.01,-.53,-176,.78],[28,-.47,-.47,-148,.88,.38,-.49,-42,.90],
          [35,-.35,-.52,-139,.88,.40,-.52,-46,.92],
        ],
      },
    },
  };

  // Torso width/height, facing, pitch and two arm elevations. Rest also has
  // an ear angle measured at the two long exhalations in the 209-frame clip.
  const specialPoses={
    inhale:[
      [1,1,1,.65,.10,-.65,-.44],[5,1.18,.66,-.52,.17,-.62,-.84],
      [7,1.03,.90,.77,.00,.06,-.10],[10,.96,1.18,.82,-.13,.81,.61],
      [44,.96,1.18,.82,-.13,.81,.61],[49,1.10,.79,.75,.12,-.22,-.36],
      [58,.98,1.02,.67,.07,-.55,-.39],[67,1,.96,.65,.10,-.6,-.37],
    ],
    held:[
      [14,1.30,1.08,.56,-.13,.46,.61],[18,1.16,1.25,.53,-.03,.29,.33],
      [23,1.19,1.20,.25,.02,.35,.30],[33,1.19,1.19,.25,.02,.34,.28],
    ],
    swallow:[
      [1,1.19,1.20,.25,.02,.34,.28],[4,1.12,1.40,.16,-.24,.74,.69],
      [6,1.14,1.35,.13,-.21,.80,.71],[8,1.37,.51,.07,.04,.68,.76],
      [10,1.42,.35,.07,.08,.65,.64],[13,1.32,.44,.10,.08,.45,.46],
      [17,1.17,.55,.14,.06,.12,.22],[20,1.11,.64,.16,.06,-.16,-.13],
      [24,1,1.04,.22,.04,-.29,-.32],[27,.96,1.14,.31,-.03,.27,.20],
      [32,1,.96,.62,.10,-.56,-.37],
    ],
    rest:[
      [1,.96,1.05,.64,.04,-.98,-1.03,0],[8,.93,1.10,.63,-.18,-1.12,.00,0],
      [20,.93,1.12,.62,-.19,-1.12,.04,0],[29,.96,1.09,.49,-.09,-1.0,-.14,0],
      [37,1.02,.82,.27,.22,-1.32,-1.24,.40],[50,.98,.99,.22,.03,-1.24,-1.26,.13],
      [77,1.06,.66,.18,.23,-1.32,-1.33,.72],[114,.98,1.00,.19,-.02,-1.25,-1.23,.08],
      [158,1.06,.66,.19,.23,-1.32,-1.33,.72],[182,1.02,.84,.25,.12,-1.30,-1.29,.32],
      [194,.99,.96,.33,.04,-1.20,-1.20,.12],[209,.99,.99,.44,.06,-1.0,-.97,0],
    ],
    sing:[
      [1,1,.96,.63,.1,-.89,-.69],[10,1.03,.86,.24,.16,-.84,-.58],
      [18,1.02,.88,.14,.08,-.24,-.76],[27,.97,1.03,.12,-.12,.04,-.93],
      [39,.94,1.06,.14,-.13,.57,-1.0],[48,1.03,.86,.05,.21,-.89,-.82],
      [53,1.04,.84,.03,.18,-1.05,-.42],[62,.97,1.03,.17,-.10,-1.00,.07],
      [74,.95,1.06,.2,-.12,-.90,.20],[84,1.03,.88,.07,.18,-1.06,-1.0],
      [92,1.06,.82,.05,.20,-1.12,-1.14],[104,.94,1.08,.08,-.13,.15,.22],
      [115,.94,1.07,.12,-.13,.15,.23],[125,1.03,.91,.16,.03,.02,.09],
      [137,1.04,.88,.27,.13,-.68,-.64],[149,1,.97,.60,.10,-.86,-.72],
    ],
  };

  // Grabs and throws in the Ultimate Frame Data model recordings. Ground travel,
  // the paired capture socket and release are driven by the simulation. These
  // tracks describe the shape around that root: frame, yaw, pitch, roll (deg),
  // torso width, height, and how far the arms reach around the opponent.
  const grapples={
    kirby:{
      grab:[[1,115,7,9,.98,.91,.12],[4,165,10,0,1.10,.84,.12],[6,43,-14,-17,.99,1.02,.93],[8,18,-10,-20,1.02,1.03,1],[13,88,-5,-16,1,1.06,.55],[19,95,-4,-12,.99,1.05,.44],[24,-8,2,-6,1.06,.89,.13],[28,25,9,2,.96,1.05,0],[34,35,5,-3,1,.96,0]],
      dashGrab:[[1,30,8,-21,1.09,.83,.20],[5,60,-12,-12,1.02,.97,.33],[7,127,-11,-16,.90,1.05,.17],[9,28,-17,-17,1,1.08,1],[10,18,-15,-20,1,1.10,1],[15,90,-9,-24,.96,1.11,.80],[22,88,-7,-14,1,1.07,.55],[31,11,6,0,1.12,.81,.10],[41,35,5,-3,1,.96,0]],
      pivotGrab:[[1,-137,-5,6,1,.94,.1],[5,-183,-8,22,.94,1.07,.18],[9,-280,-11,38,.94,1.10,.36],[10,-320,-13,42,.96,1.12,1],[14,-323,-28,45,.98,1.12,.87],[23,-310,-17,41,.96,1.08,.59],[29,-338,2,8,1,.92,.25],[32,-344,9,0,1.14,.73,.08],[36,-325,5,-3,1,.96,0]],
      throwF:[[1,47,3,-7,1,.99,.80],[8,8,18,0,1.16,.75,.82],[11,36,-25,4,.79,1.23,1],[16,42,-32,-16,.87,1.10,1],[20,123,24,-122,1,.99,.95],[24,165,-4,-237,.99,.98,.96],[28,85,-19,-335,.92,1.05,.99],[33,40,-4,-370,.96,1.02,1],[36,6,79,-360,1.05,.99,.92],[45,6,78,-360,1.06,.98,.94],[47,20,18,-372,1.02,1,.19],[58,35,5,-365,1,.98,0]],
      throwB:[[1,46,4,-6,1,.99,.8],[6,68,11,6,1.12,.80,.98],[12,72,12,4,1.14,.75,1],[16,62,-23,10,.84,1.12,.95],[19,38,-39,36,.92,1.04,.99],[21,35,-32,59,.96,1.03,.99],[25,24,9,129,.99,1.01,1],[29,18,18,192,1.02,.97,1],[33,132,16,214,1.05,.91,.94],[40,133,15,215,1.05,.91,.93],[43,23,-25,101,.98,1.03,.14],[47,59,-7,25,.91,1.08,0],[49,51,-3,13,.93,1.09,0]],
      throwU:[[1,65,4,-10,1,.98,.83],[5,23,10,-7,1.12,.80,.94],[7,97,-15,16,.86,1.24,1],[42,93,-14,30,.87,1.15,1],[46,112,7,155,.87,1.16,1],[50,115,7,154,.88,1.13,.93],[53,47,3,-18,.89,1.03,.87],[58,40,8,-19,.91,1.03,.20],[70,13,4,-15,.98,.97,.07],[73,5,-14,20,1.11,.89,0],[77,92,-11,140,.99,.96,0],[80,162,5,215,.99,.94,0],[83,64,10,291,.95,1,0],[86,14,3,354,.93,1.06,0]],
      throwD:[[1,39,3,-4,1,.99,.86],[4,15,12,-8,.96,.98,.45],[7,30,16,-4,.89,1.06,.15],[10,26,2,-4,.89,1.08,0],[42,25,4,-4,.91,1.08,0],[45,26,14,-7,.94,1.05,.12],[49,17,6,-12,.96,1.02,.18],[55,19,6,-13,.95,1.01,.16],[58,17,10,-4,1.12,.82,.05],[64,19,7,-6,1.08,.88,0],[79,32,6,-4,1,.96,0]],
    },
    puff:{
      grab:[[1,103,7,-4,1,.94,.13],[4,185,3,2,.97,1.05,.14],[6,19,-7,-14,1.02,1.05,1],[10,20,-6,-12,.98,1.07,.74],[17,41,1,-13,1,.96,.52],[23,33,3,-9,1,.97,.36],[27,4,4,-2,1.05,.91,.13],[29,35,8,-5,1,.96,0]],
      dashGrab:[[1,36,9,-18,1.07,.87,.17],[6,71,9,-16,1.03,.90,.27],[9,21,-10,-22,.98,1.09,1],[18,39,-7,-21,.94,1.08,.82],[26,46,5,-12,1,.96,.41],[33,7,5,-2,1.07,.86,.11],[39,35,8,-5,1,.96,0]],
      pivotGrab:[[1,-145,6,4,.99,.95,.10],[5,-93,5,8,.96,.98,.16],[9,-60,0,13,.94,1.01,.28],[10,-336,-11,15,.99,1.07,1],[14,-338,-14,13,.95,1.13,.89],[22,-326,-9,7,.97,1.06,.56],[28,-329,6,-2,1,.95,.25],[34,-325,8,-5,1,.96,0]],
      throwF:[[1,36,7,-4,1,.97,.77],[4,4,3,0,1,.96,.92],[8,0,9,0,.94,.86,.86],[10,0,2,0,1.21,1.12,.08],[13,0,0,0,1.12,1.04,0],[18,0,0,0,1.05,.99,0],[27,0,0,0,1,.98,0],[32,11,3,-2,1,.96,0],[35,35,8,-5,1,.96,0]],
      throwB:[[1,50,9,-14,1.13,.79,.88],[5,68,11,2,1.22,.64,1],[8,128,4,60,1,.98,1],[12,158,6,155,.96,1.02,1],[18,191,-8,199,.96,1.04,.98],[23,140,14,252,1.03,.96,.98],[26,180,8,175,.98,1.0,.34],[30,108,-17,128,.96,.98,.12],[35,50,-9,24,.97,1.02,.07],[39,23,12,-2,1.19,.65,0],[44,31,9,-5,1.10,.81,0],[49,35,8,-5,1,.96,0]],
      throwU:[[1,33,4,-4,1,.97,.8],[3,1,7,0,1.10,.90,.93],[7,-143,2,-3,.98,1.06,.85],[10,-292,-9,2,.94,1.05,.41],[13,-360,-4,-2,.95,1.09,.13],[21,-535,-4,-2,.94,1.08,.17],[29,-652,-6,-2,.96,1.08,.22],[33,-680,-3,-5,.96,1.02,.20],[37,-685,8,-5,1,.96,0]],
      throwD:[[1,45,6,-6,1,.97,.86],[4,110,16,71,1,.99,.63],[7,6,9,176,.98,1,.17],[60,6,9,176,.98,1,.17],[63,5,15,142,1.04,.95,.22],[68,11,3,50,1,.97,.26],[72,4,10,1,1.10,.79,.13],[77,8,7,0,1.03,.89,0],[83,35,8,-5,1,.96,0]],
    },
  };
  // Tilt of the second fighter around its own root before the throw is released.
  // The simulation supplies the attacker's facing and animation frame even in hitlag.
  const capturedRoll={
    kirby:{
      throwF:[[1,-14],[8,-28],[13,-38],[18,-87],[22,-178],[26,-272],[31,-344],[35,-485],[39,-535],[45,-535]],
      throwB:[[1,-14],[9,-25],[16,9],[21,60],[25,120],[31,178],[41,181]],
      throwU:[[1,-14],[5,-25],[7,8],[42,10],[46,153],[51,162],[58,158]],
      throwD:[[1,-14],[4,-45],[7,-83],[54,-85],[58,-94]],
    },
    puff:{
      throwF:[[1,-14],[7,-26],[10,9],[12,15]],
      throwB:[[1,-14],[5,-30],[8,41],[13,128],[18,179],[25,183],[26,169]],
      throwU:[[1,-14],[3,-24],[6,-17],[9,25]],
      throwD:[[1,-14],[4,-52],[7,-85],[57,-87],[62,-95]],
    },
  };

  // Six 25 fps taunt recordings. Yaw stays unwrapped so each visible turn is kept.
  // Frame, yaw / screen roll / pitch in degrees, width, height, foot lift, lateral travel.
  const tauntPoses={
    kirby:{
      up:[
        [1,35,-3,5,1,.96,0,0],[6,12,0,14,1.08,.68,0,0],[9,2,0,16,1.12,.64,0,0],
        [13,-2,0,-10,.98,1.14,.02,0],[17,-4,-4,-4,1,.99,.02,0],
        [31,-4,-4,-4,1,.99,.02,0],[35,7,0,9,.98,1.04,0,0],
        [39,26,0,13,1.06,.85,0,0],[46,35,-3,5,1,.96,0,0],
      ],
      side:[
        [1,35,-3,5,1,.96,0,0],[6,18,12,13,1.12,.76,0,0],[10,50,3,-4,.91,1.11,.13,0],
        [16,380,0,-11,.78,1.31,.12,-.06],[26,735,0,-9,.77,1.32,.15,-.07],
        [38,1080,0,-9,.78,1.31,.15,-.08],[52,1350,0,-9,.77,1.32,.14,-.08],
        [57,1450,10,-9,.83,1.26,.12,-.06],[61,1438,49,-9,1,1.10,.30,.12],
        [71,1438,48,-8,1,1.10,.30,.10],[74,1442,26,-6,.96,1.08,.31,0],
        [79,1450,9,-5,1,1,.92,-.02],[82,1458,6,-5,1,1,.86,0],
        [86,1462,1,3,1,.97,.15,0],[88,1468,-4,14,1.14,.68,0,0],
        [93,1470,-5,8,1.05,.88,0,0],[101,1475,-3,5,1,.96,0,0],
      ],
      down:[
        [1,35,-3,5,1,.96,0,0],[4,18,2,15,1.1,.74,0,0],
        [8,0,0,-8,.94,1.12,.12,0],[12,0,0,-3,.98,1.07,.11,0],
        [30,0,0,-3,1,1.06,.11,0],[34,4,1,2,.95,1.07,.04,0],
        [38,23,0,14,1.12,.66,0,0],[42,35,-3,8,1.04,.9,0,0],[47,35,-3,5,1,.96,0,0],
      ],
    },
    puff:{
      up:[
        [1,36,-5,8,1,.96,0,0],[9,44,-4,2,.99,1,.01,.02],[15,96,0,-4,1.03,.95,.16,.18],
        [21,-8,7,0,1,1.04,.10,-.60],[27,130,0,0,1.02,1.08,.05,.14],
        [33,202,-6,0,1.04,1.07,.04,.52],[41,304,10,2,1.08,1.07,.04,-.52],
        [47,362,0,11,1.08,.82,0,-.03],[53,360,0,5,1.10,.97,.04,-.10],
        [63,359,-5,-4,1.18,1.08,.30,-.03],[72,360,2,-6,1.19,1.08,.31,-.06],
        [81,361,7,-3,1.15,1.02,.23,-.18],[89,360,2,4,1.12,.95,.12,-.10],
        [96,360,0,9,1.07,.81,0,-.08],[101,377,-2,5,1,.97,0,-.03],
        [104,395,-5,8,1,.96,0,0],
      ],
      side:[
        [1,36,-5,8,1,.96,0,0],[6,32,-2,15,1.07,.91,0,0],[9,133,-8,0,.89,1.10,.02,-.18],
        [14,460,-4,-4,.73,1.35,.02,-.12],[22,900,1,-3,.67,1.37,.03,-.08],
        [30,1360,1,-3,.69,1.38,.02,-.06],[34,1478,-15,-2,.9,1.13,.07,.11],
        [38,1405,-31,-26,1.04,1.03,.16,.29],[56,1405,-31,-26,1.04,1.03,.16,.29],
        [60,1468,-15,-14,1,1.12,.38,.14],[63,1472,-7,-5,.98,1.08,.87,.06],
        [67,1477,-2,0,.99,1.01,.99,.02],[70,1479,-2,0,1,.96,.40,.01],
        [73,1478,-6,16,1.1,.72,0,0],[80,1476,-5,11,1.04,.88,0,0],[96,1475,-5,8,1,.96,0,0],
      ],
      down:[
        [1,35,-5,9,1,.96,0,0],[6,35,0,13,1.03,.81,0,0],[12,28,3,2,1.26,1.33,0,-.15],
        [17,22,0,-3,1.34,1.45,0,-.09],[21,12,-14,19,1.22,1.35,.36,-.54],
        [25,11,18,40,1.12,1.00,1.54,-.83],[29,5,25,49,.97,.50,2.03,-1.82],
        [33,0,-43,34,1.06,.13,1.79,-1.64],[37,2,-32,32,1.08,.11,1.08,-.71],
        [40,1,1,18,1.02,.11,.73,.13],[45,0,10,13,1.03,.10,1.22,1.78],
        [50,4,35,17,1.02,.10,1.64,2.34],[54,4,18,12,1.04,.10,.98,2.14],
        [58,4,13,8,1.02,.11,.57,1.52],[63,4,0,2,.98,.13,.03,.12],
        [65,7,0,2,1.0,.13,0,0],[69,16,0,10,1.10,.40,0,0],[72,30,4,-6,1.12,1.27,0,-.11],
        [75,36,2,-5,1.01,1.04,0,-.02],[77,38,-3,18,1.10,.67,0,-.04],[81,35,-5,8,1,.96,0,0],
      ],
    },
  };

  // Clockwise body roll read from the two ledge-roll and ledge-attack recordings.
  // Zero is the hanging pose. Repeated rotations are kept unwrapped.
  const ledgeTurns={
    kirby:{
      ledgeRoll:[[1,0],[5,-20],[7,-46],[10,-86],[13,-160],[16,-285],[18,-455],[21,-677],[23,-918],[24,-1005],[27,-1080],[45,-1080]],
      ledgeAttack:[[1,0],[8,0],[10,-9],[12,-51],[15,-101],[17,-171],[18,-245],[19,-316],[20,-360],[55,-360]],
    },
    puff:{
      ledgeRoll:[[1,0],[5,-29],[9,-77],[12,-134],[15,-207],[17,-310],[20,-413],[21,-467],[22,-639],[23,-752],[25,-905],[27,-1038],[29,-1080],[45,-1080]],
      ledgeAttack:[[1,0],[5,-14],[9,-65],[13,-132],[16,-178],[17,-211],[18,-263],[19,-307],[20,-360],[55,-360]],
    },
  };

  // Tilt of the eye line and the opening hop in Nintendo's Jigglypuff film.
  // Both fighters perform the same uncharged rotation around 9.8–10.9 s.
  const slowRollPose=[
    [1,1,0],[3,8,.25],[6,15,.58],[10,4,.32],[14,-5,-.07],
    [18,2,-.08],[24,-60,-.01],[28,-106,.02],[36,-182,.03],
    [40,-221,.03],[44,-272,.015],[48,-321,0],[52,-370,-.04],
    [56,-376,-.07],[60,-374,-.05],[66,-362,0],[69,-360,0],
  ];
  // Height of the rotating silhouette above the stage, fitted separately
  // for Kirby's copied headpiece and Jigglypuff's own ears. The hop is free.
  const rollGroundOffset=[
    [11,0,0],[13,-.049,-.025],[15,-.048,.026],[20,-.061,.013],
    [22,.023,.011],[25,.122,.087],[27,.086,.066],[30,.294,.327],
    [32,.323,.361],[34,.231,.275],[36,.071,.217],[37,.175,.223],
    [38,.249,.292],[40,.303,.339],[41,.272,.305],[42,.187,.218],
    [44,-.114,-.042],[51,-.090,-.017],[56,.047,.032],[60,.076,.039],[66,.003,-.036],
  ];
  // Ultimate Frame Data, Jab 1/2 and Vulcan Finisher. Each row gives the
  // facing yaw and screen roll (degrees), root shift/rise, height and reach.
  const jabPoses={
    kirby:{
      jab:[[1,67,-12,.04,.03,1,.04],[2,144,-10,.15,.04,1,.92],[3,153,-10,.17,.04,1,1],
        [6,142,-9,.11,.04,1,.66],[9,102,-9,.08,.01,.99,.35],[12,54,-4,.01,0,.99,.08],[15,34,0,0,0,1,0]],
      jab2:[[1,148,5,-.16,0,.94,0],[2,170,9,-.21,0,.85,.1],[3,54,-26,.29,.13,1,1],
        [5,50,-24,.29,.12,1,.81],[9,47,-21,.23,.09,1,.48],[13,31,-11,.12,.02,.91,.18],
        [16,20,-4,0,0,.87,0],[24,34,0,0,0,1,0]],
      rapidEnd:[[1,63,-23,.06,.15,1.06,.1],[2,44,-44,.14,.15,1.04,.2],[3,67,-64,.32,.36,1,.85],
        [5,65,-67,.34,.36,1,.8],[18,69,-65,.38,.37,1,.8],[20,81,-46,.42,.28,.98,.5],
        [22,75,10,.46,.16,.99,.2],[24,45,25,.49,.06,.97,.05],[26,40,-7,.50,0,.78,0],
        [38,42,-5,.49,0,.79,0],[45,39,-2,.30,0,.93,0],[60,34,0,0,0,1,0]]},
    puff:{
      jab:[[1,139,7,-.04,.06,.99,0],[4,142,9,-.04,.06,.99,0],[5,47,-23,.14,.10,.97,1],
        [7,51,-19,.13,.12,.99,.77],[10,51,-10,.09,.07,.98,.53],[13,36,-4,.03,0,.94,.16],
        [16,32,0,0,0,1,0]],
      jab2:[[1,43,-15,.09,.09,.98,.22],[3,30,-12,.09,.11,1,0],[4,112,-16,.12,.09,.97,.36],
        [5,161,-20,.14,.10,.99,1],[7,164,-21,.13,.09,.99,.71],[10,160,-17,.10,.07,.98,.51],
        [13,82,-11,.06,.02,.92,.2],[16,38,-1,0,0,.98,0]]},
  };

  function interpolatePose(keys,frame,values,feet=false) {
    let i=1;
    while (i<keys.length-1 && frame>keys[i][0]) i++;
    const start=keys[i-1], end=keys[i];
    const progress=clamp((frame-start[0])/(end[0]-start[0]),0,1);
    for (let j=1;j<start.length;j++) {
      let delta=end[j]-start[j];
      if(feet && (j===3 || j===7)) delta=(delta+540)%360-180;
      values[j-1]=start[j]+delta*progress;
    }
  }

  // Scale the visual rig to stage units using the known separation of the
  // root-attached jab hit spheres in the frontal and side-view captures.
  const worldScale={kirby:.77,jigglypuff:.80};
  function create(T, requestedKind) {
    const puff = requestedKind !== 'kirby';
    const kind = puff ? 'puff' : 'kirby';
    const group = new T.Group();
    group.scale.setScalar(worldScale[puff?'jigglypuff':'kirby']);
    const facing = new T.Group();
    const pivot = new T.Group();
    const body = new T.Group();
    group.add(facing);
    facing.add(pivot);
    pivot.add(body);
    const mat = (color, roughness=.63) => new T.MeshStandardMaterial({color, roughness});
    const skin = mat(skinColor[kind]);
    const footColor = puff ? skin : mat('#db2455', .57);
    const face = mat(0xffffff);
    // The game lights the round silhouette from behind as well as from above.
    // A soft rim carries that light onto the limb and face materials together.
    const fireTint={value:0}, crownShade={value:puff?1:0}, screenShade={value:0};
    const skinShader = shader => {
      shader.uniforms.fireTint=fireTint;shader.uniforms.screenShade=screenShade;
      shader.fragmentShader = 'uniform float fireTint,screenShade;\n'+shader.fragmentShader.replace('#include <opaque_fragment>',
        'float rim = pow(1.0-clamp(dot(normalize(vViewPosition),normal),0.0,1.0),2.7);\n' +
        'outgoingLight += diffuseColor.rgb*0.11 + vec3(0.16,0.115,0.14)*rim;\n'+
        'float capLight=max(0.0,dot(normal,normalize(vec3(-.43,.78,.58))));\n'+
        'float palePigment=smoothstep(.24,.65,diffuseColor.g+.36*diffuseColor.b)*smoothstep(.38,.77,diffuseColor.r);\n'+
        (puff?'outgoingLight+=vec3(.34,.36,.37)*pow(capLight,2.1)*palePigment;\n':
          'outgoingLight+=vec3(.14,.22,.30)*pow(capLight,2.5)*palePigment;\n')+
        'float bounce=pow(max(0.0,-normal.y),1.75)*palePigment;\n'+
        'outgoingLight+=vec3(.095,.027,.002)*bounce;\n'+
        // The counterlit surface stays pink on the shaded side in both
        // Dream Land matches. Keep eye ink and the dark foot pigments intact.
        (puff?'outgoingLight=mix(outgoingLight,vec3(1.0,.64,.75),.49*palePigment);\n':
          'outgoingLight=mix(outgoingLight,vec3(.95,.40,.52),.32*palePigment);\n')+
        'outgoingLight=mix(outgoingLight,outgoingLight*vec3(.64,.065,.025)+vec3(.12,.007,.001)+rim*vec3(1.6,.28,.02),fireTint);\n'+
        'float pink=smoothstep(.06,.28,diffuseColor.r-min(diffuseColor.g,diffuseColor.b));\n'+
        'outgoingLight*=mix(vec3(1.0),vec3(.51,.42,.47)+.16*capLight,screenShade*pink);\n#include <opaque_fragment>');
    };
    const skinProgramKey=()=>puff?'puff-sheen':'kirby-skin';
    for (const material of [skin,footColor,face]) {
      material.onBeforeCompile=skinShader;material.customProgramCacheKey=skinProgramKey;
    }
    // The forelock casts a small soft occlusion on the brow as the head turns.
    // Keep it attached to the head surface and to the copied ability.
    face.onBeforeCompile=shader=>{
      skinShader(shader);shader.uniforms.crownShade=crownShade;
      shader.vertexShader='varying vec3 vCrownPos;\n'+shader.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\n vCrownPos=position;');
      shader.fragmentShader='varying vec3 vCrownPos; uniform float crownShade;\n'+shader.fragmentShader.replace('#include <opaque_fragment>',
        'float brow=length((vCrownPos.xy-vec2(.20,.58))/vec2(.43,.40));\n'+
        'float underLock=(1.0-smoothstep(.40,1.0,brow))*smoothstep(.28,.56,vCrownPos.z)*crownShade;\n'+
        'outgoingLight*=mix(vec3(1.0),vec3(.58,.53,.65),underLock);\n#include <opaque_fragment>');
    };
    face.customProgramCacheKey=()=>kind+'-face-crown';
    face.map = faceTexture(T, kind, 'normal');
    const sphere = new T.SphereGeometry(1,48,32);
    const limbBall = new T.SphereGeometry(1,26,18);

    function mesh(parent, geometry, material, x=0,y=0,z=0) {
      const part = new T.Mesh(geometry,material);
      part.position.set(x,y,z);
      part.castShadow = true;
      parent.add(part);
      return part;
    }
    const r = puff ? [.83,.79,.80] : [.79,.755,.75];
    let torsoGeo=sphere;
    if(!puff) {
      torsoGeo=sphere.clone();
      const openJaw=sphere.clone(), pos=openJaw.attributes.position;
      for(let i=0;i<pos.count;i++) {
        const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
        const radius=Math.hypot(Math.atan2(x,z)/.76,(Math.asin(y)+.225)/.69);
        if(radius>=1.32) continue;
        // Keep the lip in front of the cheeks while recessing the painted palate.
        const rim=.95+.025*Math.max(0,1-Math.abs(radius-1)*4);
        const palate=rim-.23*Math.max(0,1-radius*radius);
        const blend=clamp((1.32-radius)/.32,0,1);
        pos.setZ(i,z+(palate-z)*blend);
      }
      openJaw.computeVertexNormals();
      torsoGeo.morphAttributes.position=[pos];
      torsoGeo.morphAttributes.normal=[openJaw.attributes.normal];
    }
    const ball = mesh(body,torsoGeo,face);
    ball.scale.set(...r);
    const center = puff ? .835 : .872;

    // Taper only the outer half of each limb. Kirby's mitten has a round tip,
    // whereas Puff's pointed arm and toe narrow continuously toward the end.
    const handGeo = limbBall.clone();
    const shoeGeo = limbBall.clone();
    for (const [geo,axis] of [[handGeo, 'x'], [shoeGeo,'z']]) {
      const pos = geo.attributes.position;
      for (let i=0;i<pos.count;i++) {
        let x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i);
        const u = (axis === 'x' ? x : z);
        const k = puff ? 1-.47*(u+1)/2 : 1-.14*(u+1)/2;
        if (axis === 'x') { y*=k; z*=k; }
        else { x*=k; y*=k; }
        pos.setXYZ(i,x,y,z);
      }
      geo.computeVertexNormals();
    }

    const arms = [], feet = [];
    const gripInverse=new T.Matrix4(), gripPoint=new T.Vector3(), gripShoulder=new T.Vector3();
    const gripAxis=new T.Vector3(), gripRotation=new T.Quaternion();
    const bodyPose = new Float32Array(5), footPose = new Float32Array(8), specialPose=new Float32Array(7);
    const soleYaw=new Float32Array(2), rollPose=new Float32Array(2);
    let tumbleAngle=0, tumbleDirection=1, sideLaunch=false, launchYaw=.59;
    let copyRecovery=false;
    let lastRollImpact=0,rollAngle=0;
    let stridePhase=0, strideX=0, priorAction='', priorFace=1, turnFrom=1;
    let wasDashing=false;
    for (const s of [-1,1]) {
      const shoulder = new T.Group(), hip = new T.Group();
      body.add(shoulder,hip);
      shoulder.position.set(s*(puff?.65:.61),puff?-.12:-.02,0);
      const hand = mesh(shoulder,handGeo,skin,s*.15,0,.035);
      hand.scale.set(s*(puff?.31:.41),puff?.19:.257,puff?.20:.27);
      hip.position.set(s*(puff?.38:.34),puff?-.62:-.66,.03);
      const toe = mesh(hip,shoeGeo,footColor,0,-.006,puff?.075:.12);
      toe.scale.set(puff?.19:.295,puff?.205:.211,puff?.395:.455);
      // The underside is pressed flat against the camera in the screen-KO pose.
      const soleGeo=limbBall.clone(), sp=soleGeo.attributes.position, soleColors=[];
      const soleColor=new T.Color(puff?'#b8889b':'#913844'), upperColor=new T.Color(puff?'#e5a9bc':'#cf4c61');
      for(let j=0;j<sp.count;j++) {
        const y=sp.getY(j);
        sp.setY(j,Math.max(-.39,y));const col=y<-.38?soleColor:upperColor;
        soleColors.push(col.r,col.g,col.b);
      }
      soleGeo.setAttribute('color',new T.Float32BufferAttribute(soleColors,3));soleGeo.computeVertexNormals();
      const pressed=mesh(hip,soleGeo,new T.MeshStandardMaterial({vertexColors:true,roughness:.96}),0,-.006,puff?.075:.12);
      pressed.scale.set(puff?.212:.302,.218,puff?.39:.48);pressed.visible=false;
      hip.rotation.order='YXZ';
      arms.push(shoulder); feet.push(hip);
    }

    const headpiece = new T.Group(), ears=[];
    body.add(headpiece);
    const earSkin = skin;
    const earDark = new T.MeshStandardMaterial({vertexColors:true,roughness:.96});
    const deepEar=new T.Color(puff?'#30242b':'#281916');
    const earEdge=new T.Color(puff?'#57444d':'#4b3039');
    for (const s of [-1,1]) {
      const ear = new T.Group();
      headpiece.add(ear);
      ears.push(ear);
      ear.position.set(s*(puff?.49:.51),puff?.475:.46,-.073);
      ear.rotation.set(-.08,s*.29,-s*.40);
      const outline = new T.Shape();
      outline.moveTo(-.218,-.04);
      outline.quadraticCurveTo(-.204,.17,-.045,.439);
      outline.quadraticCurveTo(.002,.514,.048,.433);
      outline.quadraticCurveTo(.194,.18,.218,-.043);
      outline.quadraticCurveTo(0,-.15,-.218,-.04);
      const shell = new T.ExtrudeGeometry(outline,{depth:.10,bevelEnabled:true,bevelThickness:.075,bevelSize:.065,bevelSegments:4,curveSegments:12});
      mesh(ear,shell,earSkin);
      // The broad velvet inset shades into its lower edge inside the pink rim.
      const innerRim=outline.getSpacedPoints(36).slice(0,-1),vertices=[0,.14,.179],colors=[],triangles=[];
      colors.push(deepEar.r,deepEar.g,deepEar.b);
      for(const radius of [.50,.85,1]) {
        for(const edge of innerRim) {
          const x=edge.x*radius*.85,y=.14+(edge.y-.14)*radius*.89;
          vertices.push(x,y,.179+.017*radius*radius);
          const tone=deepEar.clone().lerp(earEdge,(.12+.7*radius*radius)*clamp(.76-y,0,1));
          colors.push(tone.r,tone.g,tone.b);
        }
      }
      const count=innerRim.length;
      for(let i=0;i<count;i++) {
        const j=(i+1)%count;triangles.push(0,1+j,1+i);
        for(let k=0;k<2;k++){const a=1+k*count;triangles.push(a+i,a+j,a+count+j,a+i,a+count+j,a+count+i);}
      }
      const inset=new T.BufferGeometry();
      inset.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
      inset.setAttribute('color',new T.Float32BufferAttribute(colors,3));
      inset.setIndex(triangles);inset.computeVertexNormals();mesh(ear,inset,earDark);

    }
    if(!puff) {
      // Kirby copies the round forelock. Its side silhouette ends in a smooth lip.
      const copiedLock=sphere.clone(), pos=copiedLock.attributes.position;
      for(let i=0;i<pos.count;i++) {
        const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
        const taper=1-.12*z;
        pos.setXYZ(i,.04+.29*x*taper-.045*z,.74+.203*y*taper-.078*z,.36+.47*z);
      }
      copiedLock.computeVertexNormals();mesh(headpiece,copiedLock,earSkin);
    } else {
      // Puff's full forelock folds back to reveal a smaller hook above the brow.
      const curlPoints = [
        [.11,.62,-.20],[.16,.81,.025],[.15,.87,.26],[.11,.76,.49],
        [.045,.65,.62],[-.03,.59,.702],[-.12,.579,.748],[-.16,.63,.74],[-.11,.66,.721]
      ];
      const curlPath = new T.CatmullRomCurve3(curlPoints.map(v=>new T.Vector3(...v)));
      const radii = [.07,.23,.267,.275,.251,.207,.135,.071,.012];
      const verts=[], indices=[];
      const rings=36, sides=20;
      for(let i=0;i<=rings;i++) {
        const u=i/rings, at=curlPath.getPoint(u), tangent=curlPath.getTangent(u);
        const across = new T.Vector3(1,0,0);
        across.addScaledVector(tangent,-tangent.x).normalize();
        const normal = tangent.clone().cross(across).normalize();
        const ri = u*(radii.length-1), index=Math.min(radii.length-2,Math.floor(ri));
        const radius = radii[index]+(radii[index+1]-radii[index])*(ri-index);
        for(let j=0;j<sides;j++) {
          const angle=2*PI*j/sides;
          const point=at.clone().addScaledVector(across,Math.cos(angle)*radius).addScaledVector(normal,Math.sin(angle)*radius*.98);
          verts.push(point.x,point.y,point.z);
          if(i<rings) {
            const a=i*sides+j, b=i*sides+(j+1)%sides;
            indices.push(a,b,a+sides,b,b+sides,a+sides);
          }
        }
      }
      const curlGeo = new T.BufferGeometry();
      curlGeo.setAttribute('position',new T.Float32BufferAttribute(verts,3));
      curlGeo.setIndex(indices); curlGeo.computeVertexNormals();
      mesh(headpiece,curlGeo,earSkin);
    }

    let hammer, cutter, stone;
    const grip = new T.Vector3();
    if (!puff) {
      hammer = new T.Group();
      facing.add(hammer);
      const oak = mat('#ab592b'), brass = mat('#dca743',.32), end = mat('#e6a253');
      mesh(hammer,new T.CylinderGeometry(.074,.085,1.12,14),oak,0,.51,0);
      const barrel=mesh(hammer,new T.CylinderGeometry(.39,.39,.79,24),oak,0,1.15,0);
      barrel.rotation.x=PI/2;
      for (const z of [-.326,.326]) {
        mesh(hammer,new T.CylinderGeometry(.407,.407,.105,24),brass,0,1.15,z).rotation.x=PI/2;
      }
      mesh(hammer,new T.CylinderGeometry(.365,.365,.013,30),end,0,1.15,.402).rotation.x=PI/2;
      const star = new T.Shape();
      for(let i=0;i<10;i++){
        const a=PI/2+i*PI/5, radius=i%2?.105:.222;
        const x=Math.cos(a)*radius,y=Math.sin(a)*radius;
        if(i===0) star.moveTo(x,y); else star.lineTo(x,y);
      }
      star.closePath();
      mesh(hammer,new T.ShapeGeometry(star),mat('#ffe13d'),0,1.15,.412);
      cutter = new T.Group();
      facing.add(cutter);
      mesh(cutter,new T.CylinderGeometry(.056,.066,.35,12),mat('#b44535'),0,.13,0);
      const guard = mesh(cutter,limbBall,brass,0,.32,0);
      guard.scale.set(.205,.084,.082);
      const blade = new T.Shape();
      blade.moveTo(-.075,.33);
      blade.bezierCurveTo(-.14,.85,-.19,1.12,.055,1.49);
      blade.quadraticCurveTo(.05,1.18,.14,.87);
      blade.lineTo(.102,.35);
      blade.closePath();
      mesh(cutter,new T.ExtrudeGeometry(blade,{depth:.035,bevelEnabled:true,bevelThickness:.02,bevelSize:.019,bevelSegments:2}),mat('#c7e6f1',.22));
      stone = new T.Group();
      facing.add(stone);
      const rock = new T.DodecahedronGeometry(.91,0);
      const colors = [];
      const facets = rock.attributes.position;
      const tints=['#9c7d72','#ac8e83','#795f5d','#9a7974','#9f8677'];
      for(let i=0;i<facets.count;i+=3) {
        const x=facets.getX(i), y=facets.getY(i), z=facets.getZ(i);
        const swatch=new T.Color(tints[Math.abs(Math.round(34*x+19*y+11*z))%tints.length]);
        for(let j=0;j<3;j++) colors.push(swatch.r,swatch.g,swatch.b);
      }
      rock.setAttribute('color',new T.Float32BufferAttribute(colors,3));
      const boulder=mesh(stone,rock,new T.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1}),0,.68,0);
      boulder.scale.set(1.11,.81,.91);
      boulder.rotation.set(.15,.26,.08);
    }

    const spitStar=new T.Group();
    facing.add(spitStar);
    const projectileStar=new T.Shape(), corners=[];
    for(let i=0;i<10;i++) {
      const angle=PI/2+i*PI/5, radius=i%2?.48:.87;
      corners.push(new T.Vector2(Math.cos(angle)*radius,Math.sin(angle)*radius));
    }
    for(let i=0;i<10;i++) {
      const point=corners[i], trim=i%2?.105:.23;
      const start=point.clone().lerp(corners[(i+9)%10],trim);
      const end=point.clone().lerp(corners[(i+1)%10],trim);
      if(i===0)projectileStar.moveTo(start.x,start.y);else projectileStar.lineTo(start.x,start.y);
      projectileStar.quadraticCurveTo(point.x,point.y,end.x,end.y);
    }
    projectileStar.closePath();
    const starSolid=new T.ExtrudeGeometry(projectileStar,{
      depth:.18,bevelSize:.035,bevelThickness:.05,bevelSegments:4,curveSegments:8
    });
    const faceGold=new T.Color('#fffea0'), edgeGold=new T.Color('#ffffdc');
    const starColors=[], tint=new T.Color(), normal=starSolid.attributes.normal;
    const starPosition=starSolid.attributes.position;
    for(let i=0;i<normal.count;i++) {
      const bevel=1-Math.abs(normal.getZ(i));
      const light=clamp(.52-.36*normal.getX(i)+.35*normal.getY(i),0,1);
      tint.copy(faceGold).lerp(edgeGold,bevel*light);
      tint.b+=.066*starPosition.getX(i)+.052*starPosition.getY(i);
      starColors.push(tint.r,tint.g,tint.b);
    }
    starSolid.setAttribute('color',new T.Float32BufferAttribute(starColors,3));
    mesh(spitStar,starSolid,new T.MeshBasicMaterial({vertexColors:true,toneMapped:false}),0,0,-.09);

    // Only the solid casts a stage shadow. A blurred copy of its outline
    // supplies the local bloom all around the concave corners.
    const outline=projectileStar.getPoints(8), glowCanvas=document.createElement('canvas');
    glowCanvas.width=glowCanvas.height=256;
    const glowContext=glowCanvas.getContext('2d'), glowSpan=2.44;
    glowContext.beginPath();
    outline.forEach((p,i)=>{
      const x=128+256*p.x/glowSpan,y=128-256*p.y/glowSpan;
      if(i)glowContext.lineTo(x,y);else glowContext.moveTo(x,y);
    });
    glowContext.closePath();glowContext.fillStyle='#fffabc';
    for(const [width,color] of [[24,'rgba(255,226,104,.69)'],[13,'rgba(255,242,130,.88)'],[6,'rgba(255,255,179,.91)']]) {
      glowContext.shadowBlur=width;glowContext.shadowColor=color;glowContext.fill();
    }
    const bloomMap=new T.CanvasTexture(glowCanvas);bloomMap.colorSpace=T.SRGBColorSpace;
    const halo=mesh(spitStar,new T.PlaneGeometry(glowSpan,glowSpan),new T.MeshBasicMaterial({
      map:bloomMap,transparent:true,side:T.DoubleSide,depthWrite:false,toneMapped:false,
    }));
    halo.castShadow=false;
    const flower = new T.Group();
    pivot.add(flower);
    const stem = mesh(flower,new T.CylinderGeometry(.018,.022,.36,8),mat('#378758'),0,.16,0);
    stem.rotation.z=-.12;
    const petal=mat('#f34878');
    for(let i=0;i<5;i++) {
      const angle=i*2*PI/5;
      const p=mesh(flower,limbBall,petal,.025+Math.sin(angle)*.118,.38+Math.cos(angle)*.118,0);
      p.scale.set(.079,.107,.044);
      p.rotation.z=-angle;
    }
    mesh(flower,limbBall,mat('#ffdc4c'),.025,.38,.052).scale.set(.073,.073,.043);

    // A short release after the hit frames keeps the strike readable during
    // its recovery. Both animation and collision use the simulation's windows.
    function update(f,t) {
      const a=f.action || 'idle', n=f.actionFrame || 1;
      screenShade.value=a==='screenKOPose'?(puff?1:.43):0;
      for(const foot of feet) {foot.children[0].visible=!screenShade.value;foot.children[1].visible=!!screenShade.value;}
      if(a==='swallow') copyRecovery=!!f.copied;
      else if(a!=='idle'||n>12) copyRecovery=false;
      const aerial = airPoses[kind][a];
      group.position.set(f.x,f.y,0);
      group.visible=a!=='ko' && !(a==='grabbed' && f.hidden);
      facing.scale.set(f.face===-1?-1:1,1,1);
      const tIdle=t*3+(puff?1.6:0);
      const breathe=Math.sin(tIdle);
      let yaw=.59, lean=0, nod=0, lift=0, shift=0;
      let sx=1, sy=1+.011*breathe, sz=1, eye='normal', jaw=0, earFold=0;
      let leftArm=-.10+.032*breathe, rightArm=-.12+.038*breathe;
      let handX=0, handY=0, handZ=0, handStretch=1;
      let shoulderDrop=0, armSize=1;
      let leftHandY=0, groundSoles=false;
      let toeX=0,toeY=0,toeZ=0,toeAngle=0,toePitch=0,toeStretch=1,toeHeight=1;
      let backX=0,backY=0,backZ=0,backAngle=0,backPitch=0;
      let bothArmsFront=0, jabArm=-1, jabReach=0, followGrip=0, reachGrab=0;
      const framePose=f.kind ? globalThis.SmashSim?.currentMove?.(f) : undefined;
      const first=framePose?.windows[0]?.first ?? 9;
      const last=Math.min(125,framePose?.windows.at(-1)?.last ?? 16);
      const wind=clamp(n/Math.max(1,first-2),0,1) * clamp((first-n)/3,0,1);
      const strike=clamp((n-first+3)/3,0,1)*clamp(1-(n-last)/12,0,1);
      if(a==='taunt') {
        const variant=f.tauntVariant||'up';
        interpolatePose(tauntPoses[kind][variant],n,specialPose);
        [yaw,lean,nod,sx,sy,lift,shift]=specialPose;
        yaw*=PI/180;lean*=PI/180;nod*=PI/180;
        eye='ready';
        if(!puff && variant==='up') {
          const raise=clamp((n-8)/6,0,1)*clamp((36-n)/5,0,1);
          leftArm=.45*raise-.30;rightArm=1.22*raise-.38;
          leftHandY=.05*raise;handY=.29*raise;armSize=1-.20*raise;
          backX=-.13*raise;backY=.16*raise;backZ=.45*raise;backAngle=-.64*raise;backPitch=-.64*raise;
          toeX=.08*raise;toeAngle=.60*raise;toePitch=.18*raise;
          eye=raise>.60?'cheer':(n>=7&&n<=9)||(n>=37&&n<=39)?'blink':'ready';
        } else if(!puff && variant==='side') {
          const spin=clamp((n-7)/6,0,1)*clamp((62-n)/6,0,1);
          const balance=clamp((n-54)/6,0,1)*clamp((78-n)/6,0,1);
          const split=clamp((n-69)/8,0,1)*clamp((87-n)/5,0,1);
          leftArm=-.47+.48*spin+.72*balance+.74*split;rightArm=-.30+.40*spin+.54*balance+.46*split;
          toeX=-.34*spin+.27*balance+.48*split;backX=.34*spin-.1*balance-.45*split;
          toePitch=.83*spin-.22*split+.36*balance;backPitch=.86*spin-.27*split+.82*balance;
          toeAngle=.98*balance+.98*split;backAngle=-.83*split;
          toeY=.29*balance+.04*split;backY=-.11*balance;toeZ=.25*split;
          eye=spin>.5?'open':balance>.45||split>.4?'cheer':n>=87&&n<=90?'blink':'ready';
        } else if(!puff) {
          const pose=clamp((n-4)/6,0,1)*clamp((38-n)/6,0,1);
          const wave=.5+.5*Math.cos((n-10)*PI/3.9);
          leftArm=rightArm=-.3+pose*(1.06+.47*wave);armSize=1-.48*pose;
          leftHandY=handY=pose*(.32+.10*wave);
          toeX=-.08*pose;backX=.09*pose;toePitch=.94*pose;backPitch=.90*pose;
          toeZ=.18*pose;backZ=.13*pose;eye=pose>.65?'cheer':n>=36&&n<=39?'blink':'ready';
        } else if(variant==='up') {
          const turn=clamp((n-9)/6,0,1)*clamp((46-n)/4,0,1);
          const float=clamp((n-48)/14,0,1)*clamp((96-n)/12,0,1);
          sz=1+.21*float;earFold=.14*float;
          leftArm=-.98+.91*turn-.16*float;rightArm=-.83+.60*turn-.19*float;
          toeY=.17*turn+.14*float;backY=.04*turn+.12*float;toeAngle=.50;backAngle=-.40;
          eye=float>.25?'cheer':n>=46&&n<=49?'open':'ready';
        } else if(variant==='side') {
          const twirl=clamp((n-5)/6,0,1)*clamp((36-n)/4,0,1);
          const pose=clamp((n-30)/6,0,1)*clamp((63-n)/5,0,1);
          const hop=clamp((n-57)/7,0,1)*clamp((74-n)/6,0,1);
          leftArm=-.8+.75*twirl+.24*pose;rightArm=-.76+.88*twirl+1.00*pose;
          toeX=-.24*twirl+.13*pose;backX=.25*twirl;
          toePitch=.91*twirl+.83*pose+.36*hop;backPitch=.90*twirl+.42*pose+.37*hop;
          toeY=.13*pose;backY=-.04*pose;toeAngle=.38*pose;backAngle=-.20*pose;
          eye=(n>=4&&n<=7)||(n>=46&&n<=55)?'blink':'ready';
        } else {
          const flat=clamp((n-24)/8,0,1)*clamp((71-n)/5,0,1);
          sz=clamp(sy+.10,.42,1.35);earFold=.20*flat;
          leftArm=-.8-.68*flat;rightArm=-.69-.67*flat;
          toePitch=-.48*flat;backPitch=-.46*flat;
          eye=n>=6&&n<=14?'open':n>=21&&n<=69?'hurt':'ready';
        }
      } else if(a==='screenKOPose') {
        yaw=0; nod=puff?-.06:.03; eye='screen';
        sx=puff?1.06:1.10; sy=puff?1.04:1.02; sz=puff?.95:.69;
        leftArm=.62;rightArm=.68;handZ=.26;handY=.10;leftHandY=.11;
        toeX=.08;backX=-.09;toeY=.17;backY=.17;toeZ=.88;backZ=.88;
        toePitch=-1.38;backPitch=-1.38;toeAngle=.12;backAngle=-.12;
      } else if(a==='restVictim') {
        yaw=2.8;nod=-.11;lean=.14;sy=.97;sx=1.03;
        leftArm=-.63;rightArm=-.15;toePitch=.61;toeY=.16;backPitch=-.28;eye='hurt';
      } else if(a==='restZoom') {
        // The blue on-hit camera holds a single balancing pose throughout its push-in.
        sx=1;sy=1.04;sz=.99;yaw=.65;nod=.035;lean=-.035;
        leftArm=-.85;rightArm=-.90;armSize=.88;eye='restZoom';
        toeX=.10;toeY=.13;toeZ=.52;toePitch=.46;toeAngle=.42;toeStretch=.83;
        backX=-.055;backY=.06;backZ=.25;backPitch=.92;backAngle=-.21;
      } else if(specialPoses[a] || copyRecovery) {
        const phase=copyRecovery && a==='idle'?'swallow':a;
        let frame=copyRecovery && a==='idle'?20+n:n;
        // Rest on hit skips 23 frames of sleep before the shared wake-up.
        if(phase==='rest' && f.actionLimit===186 && n>143) frame=n+23;
        interpolatePose(specialPoses[phase],frame,specialPose);
        [sx,sy,yaw,nod,leftArm,rightArm]=specialPose;
        if(phase==='inhale') {
          jaw=clamp((frame-5)/5,0,1)*clamp((50-frame)/6,0,1);
          eye=jaw>.72?'inhale':jaw>.18?'inhaleMid':frame<9?'inhalePrep':'ready';
          backX=-.12*jaw;toeX=.04*jaw;backAngle=-.70;toeAngle=.25;
          toeHeight=1+.39*jaw;
          sz=1+.08*jaw;
        } else if(phase==='held'||phase==='swallow') {
          const full=phase==='held'||frame<=7;
          eye=full?'full':'ready';sz=full?1.20:1+(1-sy)*.20;
          backX=-.03;toeX=.03;toeAngle=.35;backAngle=-.36;
          toeHeight=full?1.24:1;
          if(full) {toePitch=.12;backPitch=.13;}
        } else if(phase==='rest') {
          earFold=specialPose[6];eye=frame<5?'open':frame<32?'drowsy':frame<190?'rest':'normal';
          const settled=clamp((frame-27)/6,0,1)*clamp((204-frame)/17,0,1);
          bothArmsFront=.19+.47*settled;handX=-.14*settled;handZ=.25*settled;
          armSize=1-.19*settled;shoulderDrop=.14*settled;
          toeAngle=.62;backAngle=-.55;backZ=.13;toeZ=.13;
          sz=1+(1-sy)*.18;
        } else {
          const pause=(frame>=7 && frame<=17)||(frame>=44 && frame<=54)||(frame>=83 && frame<=93);
          const note=(frame>=22 && frame<=42)||(frame>=57 && frame<=79)||(frame>=98 && frame<=124);
          eye=pause?'singBreath':note?'singNote':'normal';
          const reach=note?Math.sin(clamp((frame<44?frame-21:frame<81?frame-56:frame-97)/22,0,1)*PI):0;
          lean=(frame<44?.10:frame<81?-.10:.03)*reach;
          toeX=.09+(frame<45?.22:0)*reach;backX=-.07-(frame>=55?.19:0)*reach;
          toeY=frame<45?.17*reach:0;backY=frame>=55?.15*reach:0;
          toeAngle=.58;backAngle=-.57;earFold=pause?.23:0;
        }
      } else if (a==='idle' || a==='respawn') {
        const rock=Math.sin(t*(puff?3.15:2.75)+(puff?.9:0));
        lean=(puff?-.095:-.058)+.036*rock; nod=puff?.19:.105;
        yaw=(puff?.61:.65)+.045*rock;
        sy=(puff?.967:.95)+.019*breathe;
        sx=1.018-.012*breathe;lift=.012*(1+rock);
        leftArm=(puff?-.90:-.60)+.12*rock;rightArm=(puff?-.65:-.37)-.13*rock;
        toeX=puff?.093:.09; toeZ=.09;toeStretch=puff?1.14:1.09;
        toeAngle=(puff?.48:.53)-.055*rock;
        backX=-.08;backAngle=(puff?-.53:-.73)+.1*rock;
        toePitch=.12+.095*rock;backPitch=.11-.09*rock;
        eye='ready';
        if((t+(puff?1.1:0))%3.7>3.56) eye='blink';
      } else if (a==='run' || a==='walk') {
        const walking=a==='walk';
        const cycle=walking?(puff?1.86:2.16):(puff?2.70:3.60);
        if(!walking && wasDashing && !f.dashFrames)stridePhase=.18;
        else if(priorAction!==a || priorFace!==f.face)stridePhase=walking?.06:.01;
        else stridePhase=(stridePhase+Math.abs(f.x-strideX)/cycle)%1;
        const beat=Math.cos(stridePhase*2*PI);
        const contact=walking?.55:.37;
        groundSoles=true;
        for(let i=0;i<2;i++) {
          const phase=(stridePhase+(i===0?.5:0))%1, j=i*4;
          const swing=clamp((phase-contact)/(1-contact),0,1);
          const sweep=swing*swing*(3-2*swing);
          const liftFoot=Math.sin(swing*PI);
          // In stance, local X gives back exactly the distance moved by the root.
          const x=phase<contact?cycle*(contact*.5-phase):cycle*contact*(sweep-.5);
          const angle=walking?12*liftFoot*(swing*2-1):38*liftFoot*(swing*2-1);
          footPose[j]=x+(i===0?-.045:.045);
          footPose[j+1]=(puff?.14:.19)+(walking?.13:puff?.24:.31)*liftFoot-center;
          footPose[j+2]=angle;
          footPose[j+3]=walking?.92:(puff?.97:1.05+.08*Math.abs(beat));
          soleYaw[i]=(walking?1.02:1.17)-(puff?.33:.65)*liftFoot;
        }
        const bounce=1-Math.abs(beat);
        sy=(walking?.978:puff?.94:.86)+(walking?.027:.10)*bounce;
        sx=1+(1-sy)*.26; lift=(walking?.025:.095)*bounce;
        yaw=(walking?.65:.74)+beat*(walking?.09:.15);
        lean=(walking?-.045:-.15)+.055*beat;nod=walking?.07:.12;
        leftArm=(walking?-.48:-.16)-(walking?.35:.59)*beat;
        rightArm=(walking?-.44:-.20)+(walking?.35:.55)*beat;
        eye='ready';
        if(!walking && f.dashFrames) {
          const frame=Math.max(1,f.dashFrames-(f.dashDelay||0));
          const open=clamp((frame-1)/3,0,1)*clamp((14-frame)/4,0,1);
          if(!puff) {
            // The official Kirby clip holds its opening airborne split through F10;
            // the forward and trailing soles converge just before the running loop.
            const spread=clamp((14-frame)/4,0,1);
            footPose.set([-.44-.38*spread,.18+.19*open-center,16+9*open,1.04,
              .26+.48*spread,.18+.15*open-center,26*spread,1.02]);
            soleYaw[0]=1.27;soleYaw[1]=1.00;
            sy=.90+.10*open;sx=1;lift=.09*open;
            yaw=.51+.10*(1-spread);lean=-.11;nod=.09;
            leftArm=-.47+.31*open;rightArm=-.18-.12*open;
          } else {
            sy-=.16*clamp((5-frame)/4,0,1);
            lean-=.10*open;leftArm-=.28*open;rightArm+=.20*open;
          }
        }
      } else if(a==='runBrake'||a==='turnRun') {
        if(priorAction!==a)turnFrom=priorFace;
        const reverse=a==='turnRun';
        const span=f.actionLimit||18, settle=clamp((n-1)/(span-1),0,1);
        const bend=Math.sin(Math.min(1,(n+2)/8)*PI/2)*(1-settle*.78);
        const turn=clamp((n-2)/(puff?9:7),0,1);
        yaw=reverse?.88*turnFrom*f.face*(1-2*turn):.81-.17*settle;
        lean=(reverse?turnFrom*f.face:1)*.27*bend;nod=.11*bend;
        sy=1-.22*bend;sx=1+.09*bend;
        leftArm=.36*bend;rightArm=-.63*bend;eye='ready';
        toeX=.28*bend;toeZ=.21*bend;toeAngle=.72;toeStretch=1+.19*bend;
        backX=-.23*bend;backPitch=.39*bend;backAngle=-.61;
      } else if (a==='jumpSquat' || a==='land' || a==='crouch' || a==='shield') {
        const fold=a==='crouch'?.52:a==='shield'?.82:.77;
        sy=fold; sx=1+(1-fold)*.57; leftArm=-.25;
        bothArmsFront=a==='shield'?.38:0;
      } else if(a==='fall' && f.tumbling) {
        if(sideLaunch) {
          yaw=launchYaw+.30*Math.sin(n*.13);
          lean=tumbleAngle+.19*Math.sin(n*.11)*tumbleDirection;
          nod=-.18;leftArm=.21;rightArm=.31;toePitch=.38;backPitch=.29;
        } else {
          lean=tumbleAngle-tumbleDirection*n*.072;
          nod=.22;leftArm=.65;rightArm=.80;
          toeY=.26;backY=.14;toeAngle=.68;backAngle=-.42;
        }
        eye='open';
      } else if(a==='jump' || a==='fall') {
        const floating=f.jumps<5;
        const beat=.11*Math.sin(n*(puff?.22:.27));
        lift=.025; yaw=.66;
        toeX=.09; toeY=.10+beat; backY=.11-beat;
        toePitch=-.34; backPitch=.40;
        leftArm=.25+beat;rightArm=.24-beat;
        if(floating) { sx=puff?1.025:1.11; sy=puff?1.0:1.065; sz=sx; eye='open'; }
        else {lean=clamp(-f.vx*.7,-.17,.17); nod=f.vy>0?-.10:.06;}
      } else if(jabPoses[kind][a] || a==='rapidJab') {
        if(a==='rapidJab') {
          const swing=clamp((n-1)/4,0,1);
          yaw=.69+.15*Math.sin(n*PI/2);lean=-.12;shift=.10*swing;sy=.96;
          jabArm=-1;jabReach=0;
          toeX=.17;backX=-.17;backPitch=1.08;eye='attackOpen';
        } else {
          interpolatePose(jabPoses[kind][a],n,specialPose);
          [yaw,lean,shift,lift,sy,jabReach]=specialPose;yaw*=PI/180;lean*=PI/180;
          const first=a==='jab',finish=a==='rapidEnd';
          jabArm=(first!==puff)?0:1;
          const brace=clamp(jabReach*2,0,1);
          toeX=.15*brace;backX=-.13*brace;toeAngle=.55*brace;backPitch=1.06*brace;
          backY=(puff?.15:.14)*brace;toeY=-.06*brace;
          leftArm=.18+brace*.27;rightArm=.12+brace*.22;
          eye=!puff && !first && n<=12?'attackOpen':'normal';
          if(finish) {
            // The finishing punch plants a hand at the floor. Both feet flip up
            // behind the body before Kirby drops into the long low recovery.
            jabArm=-1;nod=.09*brace;yaw=.67+.11*brace;lean*=.80;lift-=.23*brace;
            handX=.12*brace;handY=-.29*brace;handZ=.18*brace;rightArm=-.95*brace;
            toeY=.65*brace;backY=.35*brace;toeX=-.85*brace;backX=-.50*brace;
            toePitch=-.94*brace;backPitch=-.45*brace;leftArm=.70*brace;
            eye=n>=3 && n<21?'attack':n<25?'open':'normal';
          }
        }
        groundSoles=true;
        const brace=a==='rapidJab'?1:clamp(jabReach*2.5,0,1);
        soleYaw[0]=1.44;soleYaw[1]=1.46;
        footPose.set([-.36-.19*brace,.17+(puff?.13:.16)*brace-center,
          (puff?35:57)*brace,1+.19*brace,.25+.09*brace,.17-center,4*brace,1.04]);
        if(a==='rapidEnd') {
          armSize=.85;handZ=.48*brace;handY=-.12*brace;rightArm=-.48*brace;
          footPose[0]=-.37-.12*brace;footPose[1]=.18+1.40*brace-center;
          footPose[2]=43+85*brace;footPose[4]=.24-.30*brace;footPose[5]=.16-center;
          footPose[6]=12-28*brace;
        }
      } else if(a==='pound') {
        yaw=.47-3.5*wind+.08*strike;lean=.22*wind-.30*strike;nod=.17*strike;
        handX=-.013*strike;handY=.19*strike;handZ=.22*strike;handStretch=1+.57*strike;
        leftArm=.70*strike+.35*wind;rightArm=.36*wind;
        shift=.10*strike;toeX=.14*strike;toeY=.16*wind;lift=.06*wind;
        backX=-.33*strike-.27*wind;backY=.05*strike+.22*wind;
        backAngle=-.89*strike-1.02*wind;eye=strike>.2?'open':'normal';
      } else if(aerial) {
        interpolatePose(aerial.body,n,bodyPose); interpolatePose(aerial.feet,n,footPose,true);
        yaw=bodyPose[0]*PI/180; nod=bodyPose[1]*PI/180; lean=bodyPose[2]*PI/180;
        sx=bodyPose[3]; sy=bodyPose[4]; lift=center*(1-sy);
        leftArm=.55;rightArm=.68;
        eye=(a==='fair' || n<26)?'open':'ready';
        if (a==='bair' && !puff && n===24) eye='blink';
      } else if(a==='fsmash'||a==='ftilt'||a==='dtilt') {
        const big=a==='fsmash', low=a==='dtilt';
        let kick=strike;
        yaw=.60 - (big?2:.35)*wind + .47*kick;
        lean=.22*wind+(big?.51:.29)*kick;
        sy=1+(big?.09:0)*wind-(low?.43:.05)*kick;
        sx=1+(low?.17:0)*kick;
        lift=(big?.24:.04)*wind+(big?.13:.02)*kick;
        shift=big?.25*kick:0;
        const reach=big?.64:.40;
        toeX=reach*kick-.16*wind; toeY=(low?.10:big?.65:.43)*kick+.38*wind;
        toeZ=.24*kick;toeAngle=.92*kick;toePitch=-.25*kick;
        toeStretch=1+.48*kick;
        backAngle=-.27*kick; backX=-.17*kick;rightArm=.14+.4*wind;
        leftArm=-.19-.43*kick;
        if (big && !puff) {
          // At frame 13 the extended front shoe is level with the face. The
          // silhouette remains stretched well into the late recovery (frame 30).
          const longKick=clamp((n-10)/3,0,1)*clamp((44-n)/14,0,1);
          const earlyTurn=clamp((n-1)/3,0,1)*clamp((12-n)/3,0,1);
          const contact=longKick*clamp((32-n)/12,0,1);
          yaw=.50-1.44*earlyTurn+.10*longKick;
          nod=.21*longKick; lean=.27*earlyTurn+.46*longKick;
          sy=1-.16*clamp(1-n/4,0,1)-.22*contact;
          sx=1+.11*contact; lift=.17*earlyTurn+.22*longKick;
          shift=.24*longKick;
          toeX=.34*longKick-.05*earlyTurn;
          toeY=.28*longKick+.43*earlyTurn;toeZ=.47*longKick+.11*earlyTurn;
          toeAngle=.64*longKick;toePitch=.52*longKick;toeStretch=1+.35*longKick;toeHeight=1+.50*longKick;
          backX=-.47*longKick; backY=.27*longKick;backAngle=-1.06*longKick;
          leftArm=-.55*longKick;rightArm=.38*longKick; kick=longKick;
        }
        eye=kick>.3?(big&&!puff?'attackOpen':'attack'):'normal';
      } else if(a==='utilt'||a==='usmash'||a==='uair') {
        const bodyHit=puff && a==='usmash', armHit=puff && a==='uair';
        sy=1-.23*wind+.09*strike;
        lean=.28*wind+(bodyHit?-1.15:armHit?-.65:1.04)*strike;
        lift=.11*strike; toeX=.31*strike; toeY=(armHit?.23:1.0)*strike;
        toeAngle=.79*strike;toePitch=-1.05*strike;toeStretch=1+.32*strike;
        rightArm=armHit?1.4*strike:.37*strike;handY=armHit?.21*strike:0;
        leftArm=-.43*strike; backX=-.19*strike; eye='attack';
        if(bodyHit) { toeY=.10; yaw=.67+1.66*strike; }
      } else if(a==='dsmash'||a==='dair') {
        const down=a==='dair';
        sy=1-(down?.1:.37)*strike;sx=1+.22*strike;
        yaw=.56+(puff&&!down?0:(n-first)*.43*strike);
        toeX=(down?.13:.57)*strike; backX=-toeX;
        toeAngle=(down?.28:1.23)*strike;backAngle=-toeAngle;
        toePitch=down?1.15*strike:0;backPitch=toePitch;
        toeY=down?-.19*strike:.14*strike; backY=toeY;
        rightArm=.4*strike;leftArm=.48*strike;eye='attack';
      } else if(a==='rollout') {
        const charge=f.charge||0, end=36+charge*2, hold=f.chargeHold||0;
        const weak=clamp(1-charge/16,0,1), phase=f.rollPhase, elapsed=f.rollPhaseFrame||0;
        const tuck=clamp((n-2)/12,0,1)*clamp((end+16+11*weak-n)/14,0,1);
        const travel=clamp(n-16,0,end-16), velocity=.38+.0038*charge;
        interpolatePose(slowRollPose,n,rollPose);
        let spin=n>=16 ? -travel*velocity : .36*tuck+.10*Math.sin(hold*.34);
        if(n>end) spin+=(Math.round(spin/(2*PI))*2*PI-spin)*clamp((n-end)/28,0,1);
        lean=spin*(1-weak)+rollPose[0]*PI/180*weak;
        lift=rollPose[1]*(n<=15?1:weak);
        if(f.grounded && weak>0 && !f.rollHit) {
          interpolatePose(rollGroundOffset,n,rollPose);
          lift+=rollPose[puff?1:0]*weak;
        }
        if(phase==='turn') {
          const progress=clamp(elapsed/29,0,1);
          yaw=.5+PI*(1-progress);lean+=.24*Math.sin(progress*PI);
        } else yaw=.64-(.57-.09*weak)*tuck;
        if(!f.rollHit) lastRollImpact=0;
        else {
          if(!lastRollImpact) lastRollImpact=n;
          const after=phase==='rebound'?elapsed:n-lastRollImpact;
          const contact=-Math.max(0,lastRollImpact-16)*velocity;
          lean=contact-after*clamp(30-after*.45,5,30)*PI/180;
          if(phase==='end') lean=(2*PI*Math.round(lean/(2*PI))-lean)*clamp(elapsed/20,0,1)+lean;
        }
        rollAngle=-lean;
        nod=-.15*tuck;sy=1+.02*tuck;
        const hop=Math.sin(PI*clamp((n-1)/13,0,1));
        bothArmsFront=(.38+.50*weak)*tuck;handX=-(.12+.34*weak)*tuck;
        shoulderDrop=.22*tuck*weak;handZ=.24*tuck*weak;
        leftArm=-1.1*tuck+.83*hop;rightArm=-1.14*tuck+1.10*hop;
        toeY=.25*tuck;backY=.25*tuck;toeZ=.41*tuck;backZ=.43*tuck;
        toeX=.18*hop+.23*tuck*weak;backX=-toeX;
        toePitch=(-1.17+.48*weak)*tuck+.55*hop;backPitch=(-1.19+.48*weak)*tuck+.52*hop;
        if(puff) earFold=.28*tuck*(1-weak);
        toeAngle=(.18+.57*weak)*tuck;backAngle=-toeAngle;eye=tuck>.5?'open':'ready';
      } else if(a==='dashAttack'||a==='nair'||a==='roll'||a==='airDodge'||a==='dodge') {
        const spin=a==='roll'||(!puff&&a==='nair');
        lean=spin?-n*.49:-.73*strike;
        sy=a==='dodge'?.67:.92;sx=a==='dodge'?1.12:1.01;
        leftArm=-.4;rightArm=-.37;toeY=.24;backY=.22;
        if(a==='nair' && puff){toeAngle=strike;toeX=.37*strike;toeZ=.24*strike;toeY=.30*strike;}
        if(a==='dashAttack' && !puff) {lean-=n*.27*strike;eye='attack';}
      } else if(a==='prone'||a==='getup'||a==='getupRoll'||a==='getupAttack'||a==='tech'||a==='techRoll') {
        const side=f.proneFront?1:-1;
        const stand=clamp(n/Math.max(1,f.actionLimit || 28),0,1);
        if(a==='techRoll'||a==='getupRoll') {
          lean=-2*PI*stand*(f.rollDir || f.face)*f.face;
          sx=1.06;sy=.70+.28*Math.abs(Math.sin(stand*PI));toeY=.17;backY=.17;
        } else if(a==='tech') {
          sy=.65+.35*stand;sx=1.15-.15*stand;lean=.27*(1-stand);
        } else {
          const recover=a==='prone'?0:clamp((stand-.20)/.70,0,1);
          // The UFD get-up openings show the soles together at one end
          // of the silhouette. The face points up on the back, down on the belly.
          const lying=1-recover;
          lean=-side*(puff?.86:1.18)*lying;nod=side*.22*lying;
          yaw-=.12*lying;
          sy=1-(puff?.17:.12)*lying;sx=1+.045*lying;
          const faceDown=f.proneFront;
          const width=puff?(faceDown?.13:.075):(faceDown?.14:.16);
          const height=puff?(faceDown?.76:.84):(faceDown?.75:.72);
          facing.scale.x*=1+width*lying;
          facing.scale.y=1-(1-height)*lying;
          toeY=.16*lying;backY=.11*lying;toeZ=.16*lying;backZ=.12*lying;
          toePitch=-.32*lying;backPitch=-.23*lying;
          lift=(faceDown?.21:.09)*lying;
          if(a==='getupAttack') {yaw+=2*PI*stand;toeX=.44*Math.sin(stand*PI);toeY=.15;}
        }
        leftArm=-.46;rightArm=-.48;
        eye=stand>.7&&a!=='prone'?'ready':a==='tech'||a==='techRoll'?'hurt':'blink';
      } else if(a==='stun') {
        const dir=(Math.sign(f.kx || f.vx) || -f.face)*f.face;
        const launch=f.tumbling && !f.grounded;
        const recoil=1-clamp((n-2)/10,0,1);
        eye=puff?'open':'hurt';
        if(launch) {
          const elapsed=f.actionLimit-(f.reactionRemaining ?? f.actionLimit-n);
          if(n===1 || priorAction!=='stun') {
            tumbleDirection=dir;
            sideLaunch=puff && Math.abs(f.ky)<2.75*Math.abs(f.kx);
          }
          eye='open';
          if(sideLaunch) {
            // Jigglypuff vs Pikachu, 17.065–17.668 s. The ears stay above
            // the feet as the visible eye turns from profile toward the far side.
            const turn=clamp((n-3)/12,0,1)*clamp((35-n)/12,0,1);
            launchYaw=.91+1.02*turn;
            tumbleAngle=-tumbleDirection*(.12+.20*Math.sin(Math.min(n,28)*PI/28));
            yaw=launchYaw;lean=tumbleAngle;nod=-.17-.20*recoil;
            leftArm=.12+.16*recoil;rightArm=.23+.16*recoil;
            toePitch=.42;backPitch=.32;toeY=.04;backY=.06;
            sy=1+.045*recoil;sx=1-.035*recoil;
          } else {
            tumbleAngle=-tumbleDirection*(.55+.105*Math.max(0,elapsed-2));
            lean=tumbleAngle;
            nod=.22;leftArm=.65;rightArm=.80;
            toeY=.26;backY=.14;toeAngle=.68;backAngle=-.42;
            sy=.95+.12*recoil;sx=1-.09*recoil;
          }
        } else {
          const strength=f.actionLimit>=20?1:f.actionLimit>=14?.70:.38;
          const flinch=strength*recoil;
          lean=-dir*(.06*strength+.31*flinch);nod=-.41*flinch;
          sy=1-.075*flinch;sx=1+.063*flinch;
          rightArm=.12+.51*flinch;leftArm=.14+.39*flinch;
          toeX=.12*flinch;backAngle=-.30*flinch;
        }
      } else if(a==='grabbed' && f.captureMove) {
        const source=f.captureKind==='kirby'?'kirby':'puff',phase=f.captureMove;
        const frame=f.captureFrame||1,sign=(f.captureFace||-f.face)*f.face;
        const turn=capturedRoll[source][phase];
        if(turn) {
          interpolatePose(turn,frame,bodyPose);lean=bodyPose[0]*PI/180*sign;
          const pinned=phase==='throwD'?clamp((frame-2)/6,0,1):0;
          sx=1+.06*pinned;sy=1-.24*pinned;eye='hurt';yaw=.54;nod=.12;
          if(pinned && source==='kirby' && frame>=9 && frame<=42) sy-=.11*(1-(frame-9)%4/4);
          toeY=.14;backY=.04;toePitch=.71;backPitch=-.32;toeAngle=.63;backAngle=-.66;
          leftArm=.58;rightArm=.27;group.position.z=-.12;
        } else {
          const hit=phase==='pummel'?clamp((6-frame)/5,0,1):0;
          eye=hit?'hurt':'open';lean=sign*(-.20+.50*hit);nod=.18-.29*hit;yaw=.49;
          sx=.94+.14*hit;sy=.97-.10*hit;toeY=.12;backY=.05;toePitch=.70;backPitch=-.28;
          leftArm=.40+.30*hit;rightArm=-.23+.32*hit;group.position.z=-.10;
        }
      } else if(a==='grabbed') {
        eye='hurt';lean=.27+.09*Math.sin(n*.29);leftArm=.80;rightArm=.68;
        toeX=.12;toeY=.19;backY=.10;
      } else if(['ledge','ledgeSnap','climb','ledgeAttack','ledgeRoll','ledgeJump','ledgeTrump'].includes(a)) {
        const attack=a==='ledgeAttack',roll=a==='ledgeRoll',jump=a==='ledgeJump',trump=a==='ledgeTrump';
        const hanging=a==='ledge'||a==='ledgeSnap';
        const release=hanging?0:clamp((n-2)/(attack?(puff?6:8):roll?4:jump?6:12),0,1);
        const grip=1-release;
        sy=1+.10*grip;sx=1-.09*grip;
        yaw=(puff?.23:.38)+.18*release;nod=-(puff?.16:.31)*grip;
        lean=.11*grip;eye=hanging?'open':'normal';
        rightArm=1.15*grip;handY=(puff?.51:.54)*grip;handX=(puff?.19:0)*grip;
        leftArm=-.84*grip;leftHandY=-.09*grip;
        toePitch=1.23*grip;backPitch=1.17*grip;
        toeX=-.08*grip;backX=.06*grip;
        toeY=.09*grip;backY=.03*grip;
        if(roll||attack) {
          interpolatePose(ledgeTurns[kind][a],n,bodyPose);
          lean+=bodyPose[0]*PI/180;
          if(roll) {
            const curl=clamp((n-4)/6,0,1)*clamp((32-n)/6,0,1);
            toeY+=.16*curl;backY+=.20*curl;leftArm-=.57*curl;rightArm-=.53*curl;
            const brace=clamp((n-22)/6,0,1)*clamp((45-n)/6,0,1);
            sy-=(puff?.24:.12)*brace;yaw+=.50*brace;
            toeX+=.16*brace;backX-=.13*brace;nod+=.18*brace;
          } else {
            const first=puff?21:20;
            const strike=clamp((n-first+2)/2,0,1)*clamp((puff?41:32)-n,0,12)/12;
            const recoil=clamp((n-31)/8,0,1)*clamp((55-n)/6,0,1);
            sy-=strike*(puff?.48:.48);sx+=.20*strike;
            yaw+=.49*strike;nod+=.22*strike;
            toeX+=.55*strike;toeZ=.57*strike;toeAngle=.95*strike;toeStretch=1+.60*strike;
            backX-=.26*strike;leftArm+=.38*strike;rightArm-=.57*strike;
            if(puff){
              toeX-=.51*strike;toeZ=0;toeStretch=1;toeAngle=.40*strike;
              handX+=.12*strike;handZ=.40*strike;handY+=.10*strike;handStretch=1+1.16*strike;
              rightArm+=.55*strike;nod+=.17*strike;yaw+=.72*recoil;
            }
            else {sy+=.12*recoil;leftArm+=.80*recoil;rightArm+=.68*recoil;}
            eye=strike>.4?'attackOpen':n<19?'open':'ready';
          }
        } else if(a==='climb'||jump) {
          const length=jump?14:(f.actionLimit||34), phase=clamp(n/length,0,1);
          const tuck=Math.sin(phase*PI);
          nod+=.29*tuck;lean-=.39*tuck;sy-=.24*tuck;
          toeX+=.21*tuck;toeY+=.35*tuck;toeZ=.25*tuck;backX-=.14*tuck;
          backY+=.13*tuck;leftArm-=.76*tuck;rightArm-=.46*tuck;
        } else if(trump) {
          const recoil=clamp(n/4,0,1);
          rightArm=.88;leftArm=.83;lean=.64*recoil;toeY=.16;backY=.08;eye='hurt';
        }
      } else if(a==='sleep') {
        const wave=Math.sin(n*.10);
        eye='sleep';lean=.14*wave;leftArm=-.42;rightArm=-.49;
        sy=.78+.04*wave;sx=1+(1-sy)*.46;nod=.16;
      } else if(a==='spit') {
        jaw=clamp((n-4)/4,0,1)*clamp((19-n)/6,0,1);
        const full=clamp((9-n)/4,0,1);
        eye=jaw>.7?'inhale':jaw>.2?'inhaleMid':full?'full':'ready';
        sx=1+.28*full;sy=1+.16*full+.08*jaw;sz=1+.23*full;
        yaw=.36+.50*jaw;nod=-.16*jaw;leftArm=.34+.26*jaw;rightArm=.31+.28*jaw;
      } else if(a==='hammer') {
        const swing=clamp((n-(f.landedStart===false?24:21))/6,0,1);
        lean=.2-.66*swing;rightArm=.68-.88*swing;
        leftArm=.36;sy=.89+.10*swing;eye='attackOpen';handZ=.27;
        yaw=.30+.70*swing; rightArm=.42-.84*swing;
      } else if(a==='cutter'||a==='cutterLand') {
        const descend=a==='cutterLand'||n>=41;
        rightArm=descend?-.55:1.18;leftArm=.26;lean=descend?-.30:.22;
        toeY=.15;backY=.17;sy=a==='cutterLand'?.78:1.04;eye='attack';
        handZ=.18;handY=descend?-.08:.2; yaw=.30;
      } else if(a==='stoneExit') {
        const emerge=clamp((n-5)/11,0,1);
        sy=.60+.40*emerge;sx=1+(1-emerge)*.31;
        leftArm=rightArm=.42*(1-emerge);eye=emerge>.6?'normal':'blink';
      } else if(grapples[kind][a]) {
        interpolatePose(grapples[kind][a],n,specialPose);
        let grip;[yaw,nod,lean,sx,sy,grip]=specialPose;yaw*=PI/180;nod*=PI/180;lean*=PI/180;
        const grabbing=a==='grab'||a==='dashGrab'||a==='pivotGrab';
        if(!grabbing) followGrip=a==='throwD'?grip*clamp((7-n)/5,0,1):grip;
        else {
          const start=a==='grab'?6:a==='dashGrab'?9:10;
          reachGrab=clamp((n-start+3)/3,0,1)*clamp((start+8-n)/5,0,1);
        }
        bothArmsFront=.49*grip;handX=.19*grip;handZ=.26*grip;handStretch=1+.27*grip;
        leftArm=-.38+.69*grip;rightArm=-.24+.67*grip;handY=.08*grip;
        toeX=.11;backX=-.12;toeAngle=.67;backAngle=-.48;
        eye=grabbing&&grip>.45?'open':grabbing?'ready':'attack';
        if(grabbing) {
          toeX+=.14*grip;backX-=.12*grip;toeZ=.10*grip;
          if(a==='pivotGrab'){toeY=.24*grip;toePitch=-.43*grip;backPitch=.43*grip;}
        } else if(!puff && (a==='throwF'||a==='throwU'||a==='throwB')) {
          const front=a==='throwF',up=a==='throwU';
          if((front&&n>=10&&n<=34)||(a==='throwB'&&n>=14&&n<=26))eye='open';
          const tuck=front?clamp((n-7)/4,0,1)*clamp((36-n)/4,0,1):up?clamp((n-5)/3,0,1)*clamp((54-n)/4,0,1):clamp((n-11)/6,0,1)*clamp((43-n)/4,0,1);
          toeX-=.22*tuck;backX+=.23*tuck;toePitch=.96*tuck;backPitch=.88*tuck;
          toeY=.05*tuck;backY=.11*tuck;toeAngle-=.27*tuck;backAngle+=.19*tuck;
          if(front && n>=34 && n<=45){toeX+=.32;backX-=.32;toeAngle=1.1;backAngle=-1.1;handY=-.11;}
          if(up && n>52){toeX=.16;backX=-.14;toeY=-.04;backY=.21;toePitch=.47;}
        } else if(!puff && a==='throwD') {
          const stomp=n>=8&&n<=43;
          const foot=stomp ? ((n-8)>>2)%2 : 0;
          const kick=stomp ? (.24+.76*Math.cos((n-9)*PI/4)**2) : 0;
          toeY=stomp?(foot?.17:-.28*kick):0;backY=stomp?(foot?-.28*kick:.17):0;
          toePitch=stomp?(foot?.54:1.18):0;backPitch=stomp?(foot?1.18:.54):0;
          toeX=.06;backX=-.04;leftArm=.70;rightArm=.58;
          if(n>=45&&n<=56){toeX=.29;toeY=.29;toeAngle=.99;toePitch=-.17;backPitch=.70;}
          if(n>=58){rightArm=-.04;leftArm=.20;toeX=.24;backX=-.20;toeAngle=.98;backAngle=-.84;}
        } else if(puff && a==='throwF') {
          sz=sx;earFold=n>=9&&n<=15?.12:0;bothArmsFront=.28+.53*grip;
          if(n>=9 && n<31){leftArm=rightArm=-.90;handX=-.13;eye='throwPuff';nod+=.26;}
        } else if(puff && a==='throwB') {
          const tuck=clamp((n-3)/5,0,1)*clamp((39-n)/4,0,1);
          toeX=.04;backX=-.06;toeY=.28*tuck;backY=.04*tuck;toeAngle=.83;backAngle=-.71;
          toePitch=.52*tuck;backPitch=.85*tuck;rightArm=.45+.47*grip;
        } else if(puff && a==='throwU') {
          const turn=clamp((n-3)/6,0,1)*clamp((37-n)/5,0,1);
          toeX-=.22*turn;backX+=.19*turn;toeY=.29*turn;backY=-.17*turn;
          toePitch=.33*turn;backPitch=1.07*turn;rightArm=.15+.78*turn;leftArm=.32+.47*turn;
        } else if(puff && a==='throwD') {
          const grind=clamp((n-5)/3,0,1)*clamp((64-n)/4,0,1);
          lean+=.53*Math.sin((n-8)*PI/11)*grind;toePitch=.39*grind;backPitch=.49*grind;
          leftArm=.05+.58*grind;rightArm=.05+.58*grind;earFold=.08*grind;
        }
      } else if(a==='pummel' || a==='hold' || a==='grabRelease') {
        const hit=a==='pummel'?clamp((puff?7:6)-n,0,puff?6:5)/(puff?6:5):0;
        const grip=a==='grabRelease'?clamp(1-(n-1)/7,0,1):1;
        if(a==='hold'||(a==='pummel'&&puff))followGrip=grip;
        yaw=(puff?.49:.61)*grip+.59*(1-grip);lean=(-.12-.15*hit)*grip;nod=.04+.14*hit;
        eye=hit?'attackOpen':grip>.5?'attack':'ready';
        sx=1+.04*grip;sy=1-.08*grip;bothArmsFront=.60*grip;handX=.21*grip;handZ=.22*grip;
        leftArm=-.23+.45*grip;rightArm=-.12+.44*grip;toeAngle=.68;backAngle=-.67;
        toeX=.15*grip;backX=-.13*grip;
        if(puff){toeX+=.48*hit;toeY=.43*hit;toePitch=-.57*hit;toeAngle+=.55*hit;toeZ=.21*hit;}
        else {handStretch=1+.91*hit;handZ+=.26*hit;handY=.09+.17*hit;toeZ=.07;}
      } else if(a==='stone'||a==='stoneLand') {
        sy=.85;leftArm=.62;rightArm=.62;eye='blink';
      }
      group.visible=group.visible && !(f.invuln>0 && a==='respawn' && Math.floor(n/5)%2 && n>10);
      const rocky=!puff && (a==='stoneLand'||(a==='stoneExit' && n<=5)||(a==='stone' && n >= (f.landedStart?11:29)));
      spitStar.visible=a==='star'||a==='copyStar';
      if(spitStar.visible) {
        const copy=a==='copyStar', direction=(f.starFacing||f.face)*f.face;
        const angle=(n-1)*(copy?8:15)*PI/180;
        spitStar.rotation.set(.07,(copy?.64:.23)+.06*Math.sin(n*.22),direction*(-.07-angle));
      }
      pivot.visible=!rocky && !spitStar.visible;
      if(stone) stone.visible=rocky;
      headpiece.visible=puff || (!!f.copied && (a!=='swallow'||n>=10));
      crownShade.value=headpiece.visible?1:0;
      headpiece.rotation.z=.025*breathe;
      ears[0].rotation.z=.51+earFold;ears[1].rotation.z=-.51-earFold;
      for(const ear of ears) ear.scale.y=puff && a==='screenKOPose'?.86:1;
      flower.visible=!!f.flower && f.flower>0;
      if(flower.visible){flower.position.set(.02,puff?.98:.73,.09);flower.rotation.z=.13*Math.sin(n*.12);}

      pivot.position.set(shift,center*sy+lift,0);
      pivot.scale.set(sx,sy,sz);
      pivot.rotation.set(nod,0,lean);
      body.rotation.y=yaw;
      for(const arm of arms) if(arm.parent!==body) body.add(arm);
      arms[0].position.set(-(puff?.65:.61)+bothArmsFront*.32,(puff?-.12:-.02)-shoulderDrop+leftHandY,bothArmsFront);
      arms[1].position.set((puff?.65:.61)+handX,(puff?-.12:-.02)+handY-shoulderDrop,handZ+bothArmsFront*.6);
      arms[0].rotation.set(0,.26+bothArmsFront,-leftArm);
      arms[1].rotation.set(0,-.22-bothArmsFront-Math.max(0,handStretch-1)*.54,rightArm);
      if(aerial) {
        const tuck=puff?.84:.8;
        arms[0].position.x*=.95; arms[1].position.x*=.95;
        arms[0].scale.x=tuck; arms[1].scale.x=tuck;
      } else {
        arms[0].scale.x=armSize; arms[1].scale.x=armSize*handStretch;
      }
      arms[1].visible=a!=='rapidJab' || n<5;
      if(jabArm>=0 && jabReach>0 && a!=='rapidJab') {
        const arm=arms[jabArm],extend=clamp(jabReach*3,0,1);
        // Start with the shoulder on the turned body. Then straighten the
        // forearm in facing space so the punch and its trail meet at the tip.
        pivot.updateMatrix();body.updateMatrix();
        arm.position.applyMatrix4(body.matrix).applyMatrix4(pivot.matrix);
        facing.add(arm);
        arm.position.x+=(shift+.56+.10*jabReach-arm.position.x)*extend;
        arm.position.y+=((puff?.74:1.01)+.02*lift-arm.position.y)*extend;
        const depth=(puff?a==='jab':a==='jab2')?-.24:.30;
        arm.position.z+=(depth-arm.position.z)*extend;
        arm.rotation.set(0,jabArm?0:PI,0);
        arm.scale.x=1+(puff?.68:.55)*jabReach;
      }
      if(reachGrab>0) {
        // The capture capsule projects horizontally while the body twists around it.
        pivot.updateMatrix();body.updateMatrix();gripInverse.multiplyMatrices(pivot.matrix,body.matrix).invert();
        const arm=arms[1];
        gripShoulder.set(.52,puff?.81:.87,.35).applyMatrix4(gripInverse);
        gripPoint.set(puff?1.22:1.39,puff?.80:.86,.36).applyMatrix4(gripInverse);
        arm.position.lerp(gripShoulder,reachGrab);
        gripPoint.sub(arm.position).normalize();
        gripRotation.setFromUnitVectors(gripAxis.set(1,0,0),gripPoint);
        arm.quaternion.slerp(gripRotation,reachGrab);
        arm.scale.x+=(1.52-arm.scale.x)*reachGrab;
      }
      if(followGrip>0 && f.caught>=0 && Number.isFinite(f.gripDX)) {
        // Bring the hands to the near and far sides of the captured torso.
        // Convert the simulation's pair offset into the rotating body's space.
        pivot.updateMatrix();body.updateMatrix();gripInverse.multiplyMatrices(pivot.matrix,body.matrix).invert();
        for(let i=0;i<2;i++) {
          const arm=arms[i],side=i?1:-1;
          const size=group.scale.x, caughtSize=worldScale[puff?'kirby':'jigglypuff'];
          gripPoint.set(f.gripDX/size,(.73*caughtSize+f.gripDY)/size+(i?.08:-.09),i?.41:-.34).applyMatrix4(gripInverse);
          gripShoulder.copy(gripPoint).normalize().multiplyScalar(puff?.66:.62);
          arm.position.lerp(gripShoulder,followGrip);
          gripPoint.sub(arm.position);
          const length=gripPoint.length();
          gripRotation.setFromUnitVectors(gripAxis.set(side,0,0),gripPoint.normalize());
          arm.quaternion.slerp(gripRotation,followGrip);
          arm.scale.x+=(clamp((length-.10)/(puff?.45:.52),.60,1.31)-arm.scale.x)*followGrip;
        }
      }
      if (aerial || groundSoles) {
        for(let i=0;i<2;i++) {
          const foot=feet[i], j=i*4;
          if(foot.parent!==facing) facing.add(foot);
          const angle=footPose[j+2]*PI/180, length=footPose[j+3];
          const tipOffset=(puff?.075:.12)*length;
          const swingYaw=groundSoles?soleYaw[i]:PI/2, offset=tipOffset*Math.sin(swingYaw);
          foot.position.set(shift+footPose[j]-offset*Math.cos(angle),
            center+footPose[j+1]-offset*Math.sin(angle),
            groundSoles?(i===0?.08:.46)-tipOffset*Math.cos(swingYaw):(puff?.57:.43)+(i===0?.10:0)+.14*Math.max(0,1-Math.abs(footPose[j])));
          foot.rotation.order='ZYX'; foot.rotation.set(0,swingYaw,angle);
          foot.scale.set(1,groundSoles&&!puff?1.12:1,length);
        }
      } else {
        for(const foot of feet) {
          if(foot.parent!==body) body.add(foot);
          foot.rotation.order='YXZ';
        }
        feet[0].scale.set(1,(a==='held'||a==='inhale'||a==='swallow')?toeHeight:1,1);
        feet[0].position.set(-(puff?.38:.34)+backX,(puff?-.62:-.66)+backY,.03+backZ);
        feet[1].position.set((puff?.38:.34)+toeX,(puff?-.62:-.66)+toeY,.03+toeZ);
        feet[0].rotation.set(backPitch,-.34+backAngle,.06);
        feet[1].rotation.set(toePitch,.35+toeAngle,-.06);
        if(a==='screenKOPose') {
          feet[0].rotation.order=feet[1].rotation.order='ZXY';
          feet[0].rotation.z=puff?.49:.93;feet[1].rotation.z=-.45;
        }
        feet[1].scale.set(1,toeHeight,toeStretch);
      }
      face.map=faceTexture(T,kind,eye);
      strideX=f.x;priorAction=a;priorFace=f.face;wasDashing=a==='run'&&!!f.dashFrames;
      if(!puff) ball.morphTargetInfluences[0]=jaw;

      if (hammer) {
        if (a==='hammer'||a==='cutter'||a==='cutterLand') {
          arms[1].children[0].getWorldPosition(grip);
          facing.worldToLocal(grip);
        }
        hammer.visible=a==='hammer';
        if(hammer.visible) {
          let swing=clamp((n-(f.landedStart===false?23:21))/6,0,1);
          if(f.landedStart===false && n>32) swing=clamp((n-37)/5,0,1);
          const recovery=clamp((n-35)/20,0,1);
          hammer.position.copy(grip);
          hammer.rotation.set(-.18,-.24,.92-2.60*swing+.19*recovery);
        }
        cutter.visible=a==='cutter'||a==='cutterLand';
        if(cutter.visible) {
          cutter.position.copy(grip);
          const angle=a==='cutterLand'?-1.48:n<23?1.4*(1-n/23):n<40?.17:-2.74;
          cutter.rotation.set(0,.11,angle);
        }
      }
    }
    const sourceKind=puff?'jigglypuff':'kirby';
    const native=globalThis.SmashNative?.createFighter(T,sourceKind);
    function pose(f,time) {
      const previous=f.hitPoseFrom && f.hitPoseWeight<.5;
      update(previous?{...f.hitPoseFrom,x:f.x,y:f.y}:f,time);
      if(native) {
        native.group.visible=native.pose(f,time,rollAngle);
        facing.visible=!native.group.visible;
        // Hidden Three.js subtrees still receive world-matrix updates. Keep
        // the inactive representation detached until a move needs it again.
        const active=native.group.visible?native.group:facing;
        if(active.parent!==group){
          group.remove(native.group.visible?facing:native.group);
          group.add(active);
        }
      }
    }
    pose({kind:sourceKind,x:0,y:0,face:1,action:'idle',actionFrame:1},0);
    return {group,update:pose,getBoneWorld:(name,target)=>native?.boneWorld(name,target),
      getBoneMatrixWorld:(name,target)=>native?.boneMatrixWorld(name,target),
      alignCapture:(holder,f)=>native?.alignCapture(holder,f),
      setFire(level){fireTint.value=level;if(native?.group.visible)native.setFire(level)}};
  }
  globalThis.SmashFighters={create,worldScale};
})();

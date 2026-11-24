/* Cinematic accents. Coordinates and launch direction use screen axes.
   All animation is a function of event progress, so pause/slowdown is exact. */
(function () {
  'use strict';

  const tau = Math.PI * 2;
  const clamp = value => Math.max(0, Math.min(1, value));
  function noise(seed, index) {
    let n = Math.imul(index + 1, 0x9e3779b1) ^ (seed | 0);
    n = Math.imul(n ^ (n >>> 16), 0x85ebca6b);
    return ((n ^ (n >>> 13)) >>> 0) / 4294967296;
  }
  function polygon(ctx, points, color) {
    ctx.beginPath();ctx.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
    ctx.closePath();ctx.fillStyle = color;ctx.fill();
  }
  function glow(ctx, x, y, radius, colors) {
    const gradient = ctx.createRadialGradient(x,y,0,x,y,radius);
    for (const [stop, color] of colors) gradient.addColorStop(stop,color);
    ctx.fillStyle = gradient;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
  }

  // A small, repeatable turbulence field makes the fire borders irregular at
  // both large and small scales. It is evaluated only while baking the sprites.
  function grain(x,y,seed) {
    const i=Math.floor(x), j=Math.floor(y);
    let u=x-i,v=y-j;u=u*u*(3-2*u);v=v*v*(3-2*v);
    const k=i+j*8191;
    const a=noise(seed,k),b=noise(seed,k+1),c=noise(seed,k+8191),d=noise(seed,k+8192);
    return (a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;
  }
  function sampleHeat(value, colors) {
    const q=clamp(value)*(colors.length-1), index=Math.min(colors.length-2,Math.floor(q));
    const a=colors[index],b=colors[index+1],t=q-index;
    return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  }
  function texture(width,height,pixel) {
    const result=document.createElement('canvas');result.width=width;result.height=height;
    const c=result.getContext('2d'),im=c.createImageData(width,height);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
      const rgba=pixel(x/width,y/height),i=(y*width+x)*4;
      im.data[i]=rgba[0];im.data[i+1]=rgba[1];im.data[i+2]=rgba[2];im.data[i+3]=rgba[3]??255;
    }
    c.putImageData(im,0,0);return result;
  }
  function makeFlame() {
    const colors=[[180,24,4],[255,66,0],[255,140,0],[255,224,14],[255,252,113],[255,255,221]];
    return texture(230,90,(x,y)=>{
      const curl=grain(x*7,y*4,34), rough=grain(x*18+curl*3,y*9+curl*2,93);
      const width=Math.sin(Math.PI*x)**.71*(.10+.20*x);
      const centre=.50+.11*Math.sin(x*8.3)+.09*(curl-.5);
      const edge=width-Math.abs(y-centre)+(.16*curl+.10*rough-.13);
      const a=clamp((edge+.015)*11)*clamp(x*10)*clamp((1-x)*17);
      const color=sampleHeat(.10+x*.32+edge*1.85+(curl-.5)*.37+(rough-.5)*.17,colors);
      return [...color,255*a];
    });
  }
  function makeBlast() {
    const colors=[[29,0,8],[75,0,9],[162,9,12],[230,26,11],[255,91,23],[255,143,40],
      [255,181,51],[255,228,102],[255,255,208],[255,255,248]];
    return texture(480,300,(u,v)=>{
      const x=(u-.5)*1.6,y=v-.5,r=Math.hypot(x,y),angle=Math.atan2(y,x);
      const large=grain(x*4.1+3,y*5,92),medium=grain(x*13+large*3.1,y*12+large*2.7,35);
      const fine=grain(x*40+medium*4,y*32+medium*2,17);
      const plume=grain(Math.cos(angle)*8+r*2,Math.sin(angle)*8+r*1.8,65);
      const heat=.31+.12*x+.24*(1-clamp(r*1.35))+.61*(large-.35)+.42*(medium-.44)
        +.13*(fine-.55)+.49*Math.max(0,plume-.50);
      return sampleHeat(heat,colors);
    });
  }

  function makeGoArt() {
    const art = document.createElement('canvas');art.width = 968;art.height = 372;
    const c = art.getContext('2d');c.scale(2,2);c.translate(12,8);
    const lettering = new Path2D([
      'M152 31 C132 10 112 2 83 2 C38 2 3 32 3 77 C3 122 36 151 84 151 C114 151 140 144 155 131 L155 62 L80 62 L80 96 L111 96 L111 109 C102 115 94 116 84 116 C62 116 50 101 50 78 C50 53 63 38 85 38 C99 38 110 44 120 56 Z',
      'M260 4 C211 4 177 32 176 78 C174 123 206 152 253 152 C302 152 334 124 336 79 C338 36 310 4 260 4 Z M259 39 C277 39 286 51 285 76 C284 104 275 116 255 116 C236 116 226 102 227 81 C228 53 238 39 259 39 Z',
      'M398 16 L456 16 L397 113 L357 113 Z M351 123 L392 123 L374 159 L329 159 Z'
    ].join(' '));
    c.lineJoin = 'round';c.strokeStyle = '#080508';c.lineWidth = 7;c.fillStyle = '#080508';
    for (let depth=12;depth>=0;depth-=3) {
      c.save();c.translate(depth*.42,depth);c.stroke(lettering);c.fill(lettering,'evenodd');c.restore();
    }
    c.strokeStyle = '#fff6d1';c.lineWidth = 2.8;c.stroke(lettering);
    c.save();c.clip(lettering,'evenodd');
    const colors=[[255,171,0],[245,49,0],[255,75,0],[255,123,0],
      [255,198,0],[255,226,22],[255,241,55],[255,251,126]];
    const fire=texture(456,162,(u,v)=>{
      const broad=grain(u*12,v*3.3,43),medium=grain(u*26+broad*2,v*9+broad*1.9,15);
      const fine=grain(u*67+medium*2,v*22+medium*1.8,62);
      return sampleHeat(.18+.66*v+(.53*broad+.34*medium+.13*fine-.5)*(1.37-.45*v),colors);
    });
    c.drawImage(fire,0,0,459,163);
    c.restore();return art;
  }

  function go(ctx,w,h,p,seed,art,flame) {
    const size = Math.min(w * (w<h ? .86 : .57) / 456, h*.38/160);
    const cx=w*.53, cy=h*.345;
    if (p<.72) {
      const arrival=clamp(p/.105), x=cx+w*.82*(1-arrival)**3;
      if (p<.19) {
        ctx.save();ctx.translate(cx,cy);ctx.scale(size,size);
        ctx.globalAlpha=(1-clamp(p/.19))*.95;
        for(let i=0;i<12;i++) {
          const y=(noise(seed,i)-.5)*155, length=170+noise(seed,i+20)*250;
          polygon(ctx,[-length,y,-45,y-4,135,y+1,-75,y+5],i%3===0?'#bce6ff':'#fff');
        }
        // Electric snap spreading behind the letters on the opening frames.
        for(const side of [-1,1]) {
          ctx.beginPath();
          for(let j=0;j<=13;j++) {
            const u=j/13, y=25*Math.sin(u*12)+28*(noise(seed,j+57)-.5);
            if(j===0)ctx.moveTo(side*110,y);else ctx.lineTo(side*(110+u*370),y);
          }
          ctx.strokeStyle='#4979fe';ctx.lineWidth=11;ctx.stroke();
          ctx.strokeStyle='#f4fbff';ctx.lineWidth=4;ctx.stroke();
        }
        ctx.restore();
      }
      ctx.save();ctx.translate(x,cy);const settle=1+.07*Math.exp(-Math.max(0,p-.09)*29);
      ctx.scale(size*settle,size*settle);ctx.drawImage(art,-242,-93,484,186);ctx.restore();
      return;
    }
    const t=clamp((p-.72)/.28), unit=Math.min(w,h*1.78);
    const flash=1-clamp(t/.43);
    if(flash>0) {
      ctx.save();ctx.globalAlpha=flash;
      glow(ctx,cx,cy,unit*(.12+t*.6),[[0,'#fff'],[.27,'#fffdd5'],[.53,'rgba(255,228,45,.96)'],[1,'rgba(255,144,0,0)']]);
      ctx.restore();
    }
    ctx.save();ctx.translate(cx,cy);ctx.scale(unit,unit);
    for(let i=0;i<19;i++) {
      const angle=tau*(i+.65*noise(seed,i*3))/19;
      const speed=.27+.54*noise(seed,i*3+1), small=i%3===0;
      const length=(.17+.20*noise(seed,i*3+2))*(1-.48*t)*(small?.42:1);
      const r=(.04+speed*t**.88);
      ctx.save();ctx.rotate(angle);ctx.translate(r,0);ctx.globalAlpha=Math.min(1,(1-t)*2.1);
      const thick=(.13+noise(seed,i+105)*.058)*(1-.50*t)*(small?.58:1);
      ctx.scale(1,i%2?-1:1);ctx.drawImage(flame,-length*.65,-thick/2,length,thick);
      if(i%4===0)polygon(ctx,[length*.45,0,length*.51,-.0015,length*.77,0,length*.48,.0015],'#fff5e3');
      ctx.restore();
    }
    ctx.restore();
  }

  function fracture(ctx,span,seed,angle,p,front) {
    ctx.save();ctx.rotate(angle);
    const knots=[0,.062,.14,.173,.202,.269,.31,.379,.395,.46,.58,.64,.76,1.04];
    const bend=knots.map((u,i)=>span*(i<2?0:(noise(seed,i+80)-.5)*(.065+.080*u)));
    const width=knots.map((u,i)=>span*(.0015+(.004+.020*u)*noise(seed,i+100)));
    const first=front?3:0;
    for(const layer of ['glow','core']) {
      const multiple=layer==='glow'?1.85:1;
      const shape=[];
      for(let j=first;j<knots.length;j++)shape.push(knots[j]*span,bend[j]-width[j]*multiple);
      for(let j=knots.length-1;j>=first;j--)shape.push(knots[j]*span,bend[j]+width[j]*multiple*(.25+.40*noise(seed,j+125)));
      const color=ctx.createLinearGradient(0,0,span*.80,0);
      if(layer==='glow') {
        color.addColorStop(0,'#fff1ff');color.addColorStop(.19,'#ff8bea');
        color.addColorStop(.47,'#fd1549');color.addColorStop(1,'rgba(246,44,12,.32)');
      } else {
        color.addColorStop(0,'#ffefff');color.addColorStop(.19,'#7d0a54');
        color.addColorStop(.37,'#240416');color.addColorStop(.73,'#060306');color.addColorStop(1,'#200309');
      }
      polygon(ctx,shape,color);
    }
    for(const j of [4,7,9,11]) {
      const a=knots[j]*span,b=bend[j],side=noise(seed,j)<.52?1:-1;
      const tail=span*(.04+noise(seed,j+70)*.09),rise=side*tail;
      polygon(ctx,[a,b,a+tail*.26,b+rise*.43,a+tail*.41,b+rise*.38,a+tail,b+rise,
        a+tail*.41,b+rise*.47,a+tail*.23,b+rise*.51,a-span*.004,b],'#340315');
    }
    if(front) {
      const k=4,x=knots[k]*span,y=bend[k];
      const r=span*(.019+.011*Math.max(0,Math.sin(5*p)));
      glow(ctx,x,y,r*2.35,[[0,'#fff'],[.24,'#fff4ff'],[.45,'rgba(255,154,242,.91)'],[1,'rgba(255,37,131,0)']]);
      polygon(ctx,[x-r*1.4,y,x-r*.20,y-r*.22,x+r*.13,y-r,x+r*.24,y-r*.14,x+r*1.3,y,x+r*.17,y+r*.22,x-r*.10,y+r*.76,x-r*.27,y+r*.13],'#fff');
    }
    ctx.restore();
  }

  function critical(ctx,w,h,p,info,blast,flame) {
    const x=info.x*w,y=info.y*h,span=Math.hypot(w,h),seed=info.seed|0;
    const fade=Math.min(1,(1-p)*7.2),direction=Math.atan2(info.dy||0,info.dx||0);
    ctx.save();ctx.globalAlpha=fade;
    const drift=1.04+.13*p;
    ctx.drawImage(blast,w*(1-drift)*.5,h*(1-drift)*.5,w*drift,h*drift);
    ctx.save();ctx.translate(x,y);
    // Bright foil-like shards and flame silhouettes grow behind the fighters.
    for(let i=0;i<45;i++) {
      const n=noise(seed,i*3),a=tau*(i+.65*n)/45;
      const inner=(.028+.30*noise(seed,i*3+1))*span*(1+p*.13);
      const spread=(.012+.055*noise(seed,i*3+2))*span;
      ctx.save();ctx.rotate(a);ctx.globalAlpha=fade*(.1+.48*n);
      polygon(ctx,[inner,0,inner+span*.12,-spread*.24,inner+span*.08,-spread*.41,span,-spread,span,spread,
        inner+span*.14,spread*.48,inner+span*.19,spread*.18],['#730510','#ffc553','#fff3b4','#e62915','#ff9615'][i%5]);
      ctx.restore();
    }
    for(let i=0;i<15;i++) {
      const a=tau*(i+.3*noise(seed,i+181))/15,len=span*(.19+.27*noise(seed,i+176));
      ctx.save();ctx.rotate(a);ctx.translate(span*(.08+.24*noise(seed,i+191)+p*.03),0);
      const thick=span*(.08+.14*noise(seed,i+203));ctx.scale(1,i%2?-1:1);
      ctx.drawImage(flame,-len*.56,-thick*.5,len,thick);ctx.restore();
    }
    glow(ctx,0,0,span*.34,[[0,'#fff9c4'],[.18,'rgba(255,221,90,.60)'],[.56,'rgba(255,110,18,.18)'],[1,'rgba(255,77,12,0)']]);
    const crackAngle=direction+Math.PI*.5;
    fracture(ctx,span,seed+4,crackAngle,p,false);
    fracture(ctx,span,seed+11,crackAngle+Math.PI+.16,p,false);
    for(let i=0;i<35;i++) {
      const a=tau*noise(seed,i+300),r=span*(.10+noise(seed,i+340)*.62)*(1+.18*p);
      ctx.save();ctx.rotate(a);ctx.translate(r,0);ctx.rotate(i+p*.64);
      const sz=span*(.001+noise(seed,i+380)*.005);
      polygon(ctx,[-sz*1.5,0,sz,-sz*.46,sz*.35,sz],i%3?'#6f0711':'#fff2a8');ctx.restore();
    }
    ctx.restore();
    if(info.subjects) {
      ctx.save();ctx.shadowColor='#ffec77';ctx.shadowBlur=4;ctx.drawImage(info.subjects,0,0,w,h);ctx.restore();
    } else {
      ctx.save();ctx.translate(x,y);ctx.scale(1,.82);ctx.globalCompositeOperation='destination-out';
      glow(ctx,0,0,Math.min(w,h)*.42,[[0,'#000'],[.53,'#000'],[1,'rgba(0,0,0,0)']]);ctx.restore();
    }
    ctx.save();ctx.translate(x,y);
    fracture(ctx,span,seed+4,crackAngle,p,true);
    // A blade of blue-white light passes *in front* of the bodies. The hot
    // core remains directional throughout the hold, not just on its first frame.
    ctx.rotate(direction);
    const impulse=1-clamp(p/.24),hot=span*(.051+.026*impulse);
    ctx.save();ctx.scale(2.2,.74);
    glow(ctx,0,0,hot*2.5,[[0,'#fff'],[.14,'#fffdf0'],[.29,'rgba(225,245,255,.96)'],
      [.49,'rgba(146,178,255,.68)'],[.68,'rgba(255,122,212,.33)'],[1,'rgba(255,96,103,0)']]);ctx.restore();
    const beam=ctx.createLinearGradient(-span*.30,0,span*.58,0);
    beam.addColorStop(0,'rgba(245,98,255,0)');beam.addColorStop(.17,'rgba(151,189,255,.56)');
    beam.addColorStop(.28,'#f4f7ff');beam.addColorStop(.47,'#fff');beam.addColorStop(.75,'rgba(211,243,255,.88)');
    beam.addColorStop(1,'rgba(184,142,255,0)');
    polygon(ctx,[-span*.30,0,-hot*.81,-hot*.15,-hot*.57,-hot*.32,0,-hot*.20,
      hot*.44,-hot*.28,hot*1.28,-hot*.08,span*.58,-hot*.013,hot*1.09,hot*.14,
      hot*.61,hot*.23,hot*.24,hot*.18,-hot*.38,hot*.31,-hot*.93,hot*.14],beam);
    for(let i=0;i<8;i++) {
      const a=Math.PI*.8+(noise(seed,i+451)-.5)*2.6;
      const r=hot*(.73+noise(seed,i+452)*1.75),width=hot*(.07+noise(seed,i+483)*.12);
      ctx.save();ctx.rotate(a);polygon(ctx,[-hot*.18,0,r*.38,-width,r,0,r*.56,width*.41,hot*.2,width*.28],
        ['#fffdf2','#ffdc73','#fff','#ffaf37'][i%4]);ctx.restore();
    }
    glow(ctx,0,0,hot*.84,[[0,'#fff'],[.24,'#fff'],[.58,'rgba(255,250,209,.90)'],[1,'rgba(255,218,117,0)']]);
    ctx.restore();ctx.restore();
  }

  function ko(ctx,w,h,p,info) {
    const seed=info.seed|0, x=info.x*w,y=info.y*h,span=Math.hypot(w,h);
    const angle=Math.atan2(info.dy||0,info.dx||0);
    const open=Math.min(1,(p+.025)*11), fade=Math.min(1,(1-p)*3.0);
    const half=Math.min(w,h)*(.034+.19*open)*(1-.77*p*p);
    const length=span*(.40+.99*open);
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=fade;
    const beam=ctx.createLinearGradient(0,-half*1.35,0,half*1.35);
    beam.addColorStop(0,'rgba(255,255,255,0)');beam.addColorStop(.08,'rgba(20,11,34,.39)');beam.addColorStop(.14,'rgba(248,250,255,.51)');
    beam.addColorStop(.24,info.color||'#ff6399');beam.addColorStop(.30,'#ffe5f5');
    beam.addColorStop(.38,'#fff');beam.addColorStop(.64,'#fff');beam.addColorStop(.77,'#e3fbff');
    beam.addColorStop(.82,info.color||'#ff6399');beam.addColorStop(.9,'rgba(46,30,69,.43)');beam.addColorStop(1,'rgba(255,255,255,0)');
    polygon(ctx,[-length,-half*.45,span*.85,-half*1.65,span*.85,half*1.65,-length,half*.45],beam);
    for(let i=0;i<37;i++) {
      const offset=(noise(seed,i*3)-.5)*half*2.6;
      const start=(-1.05+noise(seed,i*3+1)*1.05+p*.55)*length;
      const distance=(.24+.85*noise(seed,i*3+2))*span;
      const width=(.0013+.0047*noise(seed,i+32))*span*(1-p*.65);
      polygon(ctx,[start,offset*.60,start+distance*.30,offset-width,start+distance,offset,start+distance*.25,offset+width*.7],
        ['#fff','#fff','#fff5ab','#8bffec','#ff92eb','#a8b9ff'][i%6]);
    }
    for(let i=0;i<19;i++) {
      const px=span*(-.84+noise(seed,i+80)*1.24+p*.14),py=(noise(seed,i+120)-.5)*half*5;
      const radius=(3+8*noise(seed,i+155))*Math.sin(Math.PI*Math.min(.99,p+.12));
      ctx.save();ctx.translate(px,py);ctx.rotate(-angle+.27*i);
      polygon(ctx,[-radius,0,-radius*.17,-radius*.18,0,-radius*1.7,radius*.20,-radius*.14,radius,0,radius*.18,radius*.12,0,radius*1.7,-radius*.16,radius*.14],
        i%2?'#fff9ae':'#fff');ctx.restore();
    }
    ctx.restore();
  }

  function create(canvas) {
    const ctx=canvas.getContext('2d');let art,flame,blast,dirty=false;
    // Prepare the three reusable images while the lobby is idle. A cold
    // finishing hit would otherwise spend approximately one frame baking them.
    const warm=()=>{art ||= makeGoArt();flame ||= makeFlame();blast ||= makeBlast()};
    if(globalThis.requestIdleCallback)globalThis.requestIdleCallback(warm);
    else setTimeout(warm,0);
    function clear() {
      if(!dirty)return;
      ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);dirty=false;
    }
    function draw(info) {
      clear();const p=clamp(info.progress);if(p>=1 || !canvas.height)return;
      dirty=true;const scale=canvas.height/450,w=canvas.width/scale;
      ctx.save();ctx.setTransform(scale,0,0,scale,0,0);
      if(info.kind==='go') {art ||= makeGoArt();flame ||= makeFlame();go(ctx,w,450,p,info.seed||0,art,flame)}
      else if(info.kind==='critical'){blast ||= makeBlast();flame ||= makeFlame();critical(ctx,w,450,p,info,blast,flame)}
      else if(info.kind==='ko')ko(ctx,w,450,p,info);
      ctx.restore();
    }
    return {draw,clear};
  }
  globalThis.SmashAccent={create};
})();

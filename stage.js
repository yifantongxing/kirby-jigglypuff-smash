/* Dream Land (64), Ultimate normal form. The source meshes, map1 UVs, vertex
   colors and sampled Whispy/flower animations are embedded by stage-art.js. */
(() => {
  const cameraPitch = .0855;
  const focalLength = 1.048;
  const cameraDistance = camera => (camera.right - camera.left) * focalLength;

  function create(T, scene) {
    const assets = globalThis.DreamLandMesh;
    const stage = new T.Group();
    stage.name = 'Dream Land (64)';
    scene.add(stage);

    const distance = {value: 15}, restDepth = {value: 0};
    const replayProjection = {value: new T.Matrix4()}, replayScale = {value: new T.Vector2()};
    const cameraGrade = {value: 1}, subjectScale = {value: new T.Vector2()};
    const materials = new Map(), animated = [];
    const finalDim = {value: new T.Vector2()}, openingShade = {value: 1};
    const puffOpening = {value: new T.Vector2()};
    const skyExposure = {value: new T.Vector2(1,1)};
    let water, eyes, restBackdrop;
    const wrapping = {ClampToEdge: T.ClampToEdgeWrapping, MirroredRepeat: T.MirroredRepeatWrapping, Repeat: T.RepeatWrapping};

    for (const [part, name, , image, wraps, positions, uv, triangles, colors] of assets.mesh) {
      const key = image + wraps.join(',');
      const isWater = image.includes('wpond3');
      let material = materials.get(key);
      if (!material) {
        const texture = new T.TextureLoader().load('data:image/webp;base64,' + assets.texture[image]);
        texture.colorSpace = T.SRGBColorSpace;
        texture.flipY = false;
        texture.wrapS = wrapping[wraps[0]];
        texture.wrapT = wrapping[wraps[1]];
        texture.anisotropy = 4;
        if (image.includes('weye')) {
          eyes = texture;
          eyes.repeat.x = .5;
        }
        if (isWater) {
          water = texture;
          water.repeat.x = 2;
        }
        const sky = part === 'stc_bg_set';
        if (sky) {
          texture.offset.y = -.037;
          texture.wrapT = T.ClampToEdgeWrapping;
        }
        material = new T.MeshBasicMaterial({
          map: texture, side: T.DoubleSide, vertexColors: true, toneMapped: false,
          alphaTest: isWater ? .035 : .45, transparent: isWater, depthWrite: !isWater
        });
        if (isWater) {
          material.blending = T.CustomBlending;
          material.blendSrc = T.OneFactor;
          material.blendDst = T.OneMinusSrcAlphaFactor;
        }

        // Ambient fill measured on the bark, canopy and wood in same-stage footage.
        let fill = [.010, .046, .008];
        if (part === 'dyr_pupupuwispyanim_topn_set' || isWater) fill = [0, 0, 0];
        else if (image.includes('wfoliage')) fill = [.065, .088, .011];
        else if (image.includes('wwood3')) fill = [.048, .027, .016];
        else if (image.includes('scaffold')) fill = [.005, .002, .005];
        else if (sky) fill = [.034, .041, .035];
        const plank = image.includes('scaffold');
        const floor = /scaffold|wload|komore|grassfloor|wwall|wpond/.test(image);
        const faceInk = image.includes('weye');
        const canopy = image.includes('wfoliage'), foliage = canopy || image.includes('wgrass4l'), bark = image.includes('wwood3');
        const puffShade = foliage ? '.13,.20,.08' : bark ? '.32,.24,.04' : '.32,.27,.18';
        const swordShade = foliage ? '.055,.13,.08' : bark ? '.23,.07,.05' : '.26,.12,.14';
        material.customProgramCacheKey = () => [fill.join(','), floor, isWater, faceInk, foliage, bark, canopy, sky, plank].join('/');
        material.onBeforeCompile = shader => {
          shader.uniforms.stageDistance = distance;
          shader.uniforms.restDepth = restDepth;
          shader.uniforms.replayProjection = replayProjection;
          shader.uniforms.replayScale = replayScale;
          shader.uniforms.cameraGrade = cameraGrade;
          shader.uniforms.finalDim = finalDim;
          shader.uniforms.openingShade = openingShade;
          shader.uniforms.puffOpening = puffOpening;
          shader.uniforms.skyExposure = skyExposure;
          shader.vertexShader = 'uniform float stageDistance; uniform float restDepth; uniform mat4 replayProjection; uniform vec2 replayScale;\n' + shader.vertexShader;
          // Project through a virtual perspective camera onto the existing z=0
          // fighting plane. A point on that plane keeps its exact gameplay pixel.
          // Clip-space w also clips geometry behind the eye in a Rest close-up.
          shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
            vec4 stageVertex = modelMatrix * vec4(transformed, 1.0);
            float w = 1.0 - stageVertex.z / stageDistance;
            stageVertex.y -= ${cameraPitch.toFixed(4)} * stageVertex.z;
            ${floor ? '' : 'stageVertex.z -= restDepth;'}
            vec4 mvPosition = viewMatrix * stageVertex;
            gl_Position = projectionMatrix * mvPosition;
            gl_Position.z *= w;
            gl_Position.w = w;
            if (replayScale.x > 0.0) {
              vec4 recorded = replayProjection * modelMatrix * vec4(transformed, 1.0);
              gl_Position.xy = recorded.xy * replayScale;
              gl_Position.z = (projectionMatrix * mvPosition).z * recorded.w;
              gl_Position.w = recorded.w;
            }
          `);
          shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>',
            'outgoingLight += vec3(' + fill.map(v => v.toFixed(4)).join(',') + ');\n#include <opaque_fragment>');
          // The recorded camera uses the color response measured from this capture's scenery.
          shader.fragmentShader = 'uniform vec2 replayScale;uniform vec2 finalDim,puffOpening,skyExposure;uniform float openingShade,cameraGrade;\n' + shader.fragmentShader.replace(
            '#include <colorspace_fragment>', `#include <colorspace_fragment>
            if (replayScale.x > 0.0) {
              vec3 c = gl_FragColor.rgb;
              mat3 linear = mat3(1.295,-.008,.069, 1.420,2.818,.593, .516,.164,1.662);
              mat3 quadratic = mat3(-.371,-.007,-.071, -.685,-1.125,-.287, -.371,-.112,-.569);
              gl_FragColor.rgb = ${faceInk ? 'c * vec3(.75,.40,1.0)' : 'clamp(linear * c + quadratic * (c * c) - vec3(.783,.705,.384), 0.0, 1.0)'};
              ${canopy ? `
                // Leaf highlights survive the blackout in the recording, while
                // the crevices between them drop to almost black.
                vec3 lit = gl_FragColor.rgb;
                vec3 puffLeaves = vec3(.535,1.079,.272)*pow(max(lit-vec3(.207,.472,.190),0.),vec3(1.674,1.610,1.512));
                vec3 swordLeaves = vec3(.563,.289,.549)*pow(max(lit-vec3(.039,.179,-.025),0.),vec3(4.,2.457,4.));
                gl_FragColor.rgb=mix(mix(lit,puffLeaves,finalDim.x),swordLeaves,finalDim.y);
              ` : sky ? 'if(skyExposure.x>1.) gl_FragColor.rgb=pow(gl_FragColor.rgb,vec3(skyExposure.x))*skyExposure.y;' : `
                gl_FragColor.rgb *= mix(vec3(1.),vec3(${puffShade}),finalDim.x)
                                  * mix(vec3(1.),vec3(${swordShade}),finalDim.y);
              `}
              ${floor ? 'gl_FragColor.rgb *= openingShade;' : ''}
              ${sky ? '' : `gl_FragColor.rgb *= mix(1.,${canopy ? '.09' : bark ? '.27' : plank ? '.06' : '.24'},puffOpening.x);`}
              ${canopy || plank ? `gl_FragColor.rgb *= mix(vec3(1.),vec3(${canopy ? '.32,.55,.42' : '.83,.23,.65'}),puffOpening.y);` : ''}
              gl_FragColor.rgb=mix(c,gl_FragColor.rgb,cameraGrade);
            }`);
          if (isWater) {
            shader.fragmentShader = shader.fragmentShader.replace('#include <premultiplied_alpha_fragment>',
              'gl_FragColor.rgb *= mix(gl_FragColor.a, 1.0, 0.12);');
          }
        };
        materials.set(key, material);
      }

      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.Float32BufferAttribute(positions.flat(), 3));
      geometry.setAttribute('uv', new T.Float32BufferAttribute(uv.flat(), 2));
      geometry.setAttribute('color', new T.Float32BufferAttribute(
        colors.flatMap(color => color.slice(0, 3).map(channel => Math.min(1.5, channel * 2))), 3));
      geometry.setIndex(triangles);
      const mesh = new T.Mesh(geometry, material);
      mesh.name = name + ' / ' + image;
      // WebGL receives projected positions through the shader.
      mesh.frustumCulled = false;
      mesh.renderOrder = part === 'stc_bg_set' ? -100 : -10;
      stage.add(mesh);
      if (part === 'stc_bg_set') {
        mesh.onBeforeRender = (renderer, currentScene, camera) => {
          distance.value = cameraDistance(camera);
          const lens = camera.userData.dreamLandLens;
          cameraGrade.value = lens?.grade ?? 1;
          const fade = currentScene.userData.finalStageFade || 0;
          const skyGrade = lens?.final ? currentScene.userData.finalSkyGrade : null;
          skyExposure.value.set(skyGrade?.[1] ?? 1,skyGrade?.[2] ?? 1);
          finalDim.value.set(lens?.final === 'puff-up' ? fade : 0, lens?.final === 'ultra-sword' ? fade : 0);
          openingShade.value = lens?.final === 'ultra-sword' && lens.frame <= 1 ? .08 : 1;
          const puffFrame = lens?.final === 'puff-up' ? lens.frame : -1;
          puffOpening.value.set(puffFrame===1 ? 1 : 0, puffFrame>1 ? Math.max(0,Math.min(1,(81-puffFrame)/32)) : 0);
          if (lens) {
            const m = lens.projection;
            replayProjection.value.set(m[0],m[1],m[2],m[3], m[4],m[5],m[6],m[7], 0,0,0,0, m[8],m[9],m[10],m[11]);
            replayScale.value.set(lens.width / (camera.right-camera.left),
              lens.width * 9 / (16 * (camera.top-camera.bottom)));
            // The native sky is a Y-axis billboard. Use the measured yaw of
            // this recording so the cloud bank stays aligned as the lens pans.
            const g=cameraGrade.value, freeOffset=.009+.004*camera.position.x;
            material.map.repeat.set(1-.00495*g,1+.05064*g);
            material.map.offset.set(freeOffset+(.002955-.36361*m[8]-freeOffset)*g,-.037-.011084*g);
          } else {
            replayScale.value.set(0,0);
            material.map.repeat.set(1, 1);
            material.map.offset.set(.009 + .004 * camera.position.x, -.037);
          }
          restDepth.value = restBackdrop?.visible ? 14 : 0;
        };
      }
      if (assets.anim[name]) {
        const [frames, encoded] = assets.anim[name];
        const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
        animated.push({frames, values: new Int16Array(bytes.buffer), position: geometry.attributes.position, index: 0});
      }
    }

    let previous = -1;
    return {
      // The extra pass for the off-screen fighter portrait has its own camera.
      // Apply the match perspective only to subjects drawn by the match camera.
      bindFinalSubjects(roots) {
        const materials = new Set();
        roots.forEach(root=>root.traverse(part=>{
          if(part.material?.isMeshStandardMaterial || part.material?.isMeshBasicMaterial)materials.add(part.material);
        }));
        for(const material of materials) {
          const compile=material.onBeforeCompile, key=material.customProgramCacheKey(), before=material.onBeforeRender;
          material.customProgramCacheKey=()=>key+'|final-orbit';
          material.onBeforeCompile=function(shader,renderer){
            compile.call(this,shader,renderer);
            shader.uniforms.subjectLens=replayProjection;
            shader.uniforms.subjectScale=subjectScale;
            shader.uniforms.subjectGrade=cameraGrade;
            shader.vertexShader='uniform mat4 subjectLens;uniform vec2 subjectScale;uniform float subjectGrade;\n'+shader.vertexShader.replace(
              '#include <logdepthbuf_vertex>',`if(subjectScale.x>0.){
                vec4 p=subjectLens*modelMatrix*vec4(transformed,1.);
                vec2 xy=mix(gl_Position.xy/gl_Position.w,p.xy*subjectScale/p.w,subjectGrade);
                gl_Position=vec4(xy*p.w,gl_Position.z/gl_Position.w*p.w,p.w);
              }
              #include <logdepthbuf_vertex>`);
          };
          material.onBeforeRender=function(renderer,scene,camera,...args){
            before.call(this,renderer,scene,camera,...args);
            const lens=camera.userData.dreamLandLens;
            if(lens?.live || (lens?.final==='ultra-sword' && lens.frame>=83))subjectScale.value.copy(replayScale.value);
            else subjectScale.value.set(0,0);
          };
          material.needsUpdate=true;
        }
      },
      update(seconds) {
        restBackdrop ||= scene.getObjectByName('Rest Special Zoom');
        const phase = seconds * 60 % 1764;
        const frame = Math.round(phase <= 882 ? phase : 1764 - phase);
        if (frame === previous) return;
        previous = frame;
        for (const track of animated) {
          let index = track.index;
          while (index > 0 && track.frames[index] > frame) index--;
          while (index < track.frames.length - 2 && track.frames[index + 1] < frame) index++;
          track.index = index;
          const weight = (frame - track.frames[index]) / (track.frames[index + 1] - track.frames[index]);
          const points = track.position.array, length = points.length;
          for (let i = 0; i < length; i++) {
            const start = track.values[index * length + i], end = track.values[(index + 1) * length + i];
            points[i] = (start + (end - start) * weight) / 2048;
          }
          track.position.needsUpdate = true;
        }
        let tile = 0;
        for (let i = 1; i < assets.blink.length && assets.blink[i] <= frame; i++) tile = i % 2;
        eyes.offset.x = tile * .5;
        water.offset.y = seconds * .07 % 1;
      }
    };
  }
  // Sampled at the replay's 60 Hz simulation tick. Free gameplay uses its live camera.
  const backAirCamera = frame => globalThis.DreamLandBackAir[frame];
  // Centre, two radii, falloff power, RGB gain and black level, measured on
  // the sky and canopy around Kirby during the nine-frame summon flash.
  const swordOpeningLight = [
    [.596,.504,.273,.523,5.293,.320,.239,.015,0,0,0],
    [.587,.464,.577,1.303,1.086,1.058,1.163,1.153,.065,-.047,-.30],
    [.580,.485,.604,1.254,1.631,1.178,1.193,.955,-.076,-.153,-.30],
    [.571,.470,.528,1.158,1.998,1.325,1.172,.745,-.30,-.241,-.226],
    [.561,.451,.446,1.006,1.990,1.123,.970,.588,-.111,-.062,-.10],
    [.550,.459,.482,1.064,1.624,1.285,1.104,.644,-.25,-.181,-.164],
    [.540,.472,.402,.861,1.686,1.084,.911,.518,-.071,-.019,-.074],
    [.530,.459,.369,.808,1.773,.923,.788,.423,.013,.045,-.038],
    [.520,.337,.327,.850,2.186,.753,.647,.340,.120,.134,-.002]
  ];
  // [simulation frame, effect opacity, sky gamma, sky gain]. The saturation
  // of the distant clouds returns before their brightness in both recordings.
  const skyRecovery = {
    'puff-up': [[429,1,3,.30],[433,.36,2.54,.47],[441,.265,1.67,.736],[453,.107,1.256,.908],[464,0,1,1]],
    'ultra-sword': [[299,1,1.75,.31],[301,.613,1.644,.367],[309,.306,1.378,.644],[317,.185,1.195,.838],[330,0,1,1]]
  };
  function finalSkyRecovery(kind, frame) {
    const keys = skyRecovery[kind];
    if (frame <= keys[0][0]) return [1,1,1];
    for (let i=1;i<keys.length;i++) {
      const b=keys[i], a=keys[i-1];
      if (frame<=b[0]) {
        const t=(frame-a[0])/(b[0]-a[0]);
        return [1,2,3].map(channel=>a[channel]+(b[channel]-a[channel])*t);
      }
    }
    return [0,1,1];
  }
  function finalReplayCamera(kind, frame) {
    const keys = globalThis.DreamLandFinalLenses[kind];
    const next = keys.findIndex(key => key[0] >= frame);
    const b = keys[next < 0 ? keys.length - 1 : next], a = keys[next > 0 ? next - 1 : keys.indexOf(b)];
    const t = b === a ? 0 : (frame - a[0]) / (b[0] - a[0]);
    const value = i => a[i] + (b[i] - a[i]) * t;
    return {x: value(1), y: value(2), width: value(3), projection: a.slice(4).map((v, i) => value(4 + i)), final: kind, frame};
  }
  // Opponent displacement from the caster in the filmed launch. Only the
  // deviation from this path contributes to framing in a live match.
  const launchReference={
    'ultra-sword':[[271,4.40,.25],[276,4.40,.25],[279,8.81,4.05],[282,11.66,5.94],[289,15.38,7.97],[300,18.2,9.24],[318,21.60,10.09]],
    'puff-up':[[241,-4.5,1],[252,-5.46,2.2],[263,-6.13,1.92],[281,-7.93,4.39],[287,-11.90,7.39],[294,-14.18,8.24],[318,-18.34,8.36],[337,-21.32,10.78],[346,-22.36,10.88],[361,-23.64,9.56],[368,-23.46,8.45],[401,-19.93,3.20],[414,-18.52,5.10],[426,-17.22,5.62],[438,-15.91,4.94],[453,-14.28,2.72]]
  };
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  function liveFinalCamera(f,target) {
    const sword=f.action==='ultraSword', kind=sword?'ultra-sword':'puff-up';
    const frame=f.actionFrame, lens=finalReplayCamera(kind,frame), face=f.face;
    const originX=sword?-1:-3.2, originY=sword?SmashSim.platforms[3].y:2.5;
    let x=f.x+face*(lens.x-originX), y=f.y+lens.y-originY, width=lens.width;
    const path=launchReference[kind];
    if(frame>=path[0][0]){
      const i=path.findIndex(p=>p[0]>=frame), b=i<0?path.at(-1):path[i], a=i>0?path[i-1]:b;
      const t=b===a?0:(frame-a[0])/(b[0]-a[0]);
      const refX=a[1]+(b[1]-a[1])*t, refY=a[2]+(b[2]-a[2])*t;
      const dx=target.action==='ko'?0:(target.x-f.x)*face, dy=target.action==='ko'?0:target.y-f.y;
      const weight=clamp((frame-path[0][0])/14,0,1);
      x+=face*clamp((dx-refX)*.32,-6,6)*weight;
      y+=clamp((dy-refY)*.26,-4,4)*weight;
      width+=clamp((Math.hypot(dx,dy)-Math.hypot(refX,refY))*.75,-width*.32,12)*weight;
    }
    // Keep a fighter near a blast line visible even when the orbit is facing out.
    x=clamp(clamp(x,-15.9,15.9),f.x-width*.38,f.x+width*.38);
    const m=lens.projection, dx=lens.x-face*x, dy=lens.y-y;
    for(let row=0;row<3;row++){
      const i=4*row, horizontal=row===0?face:1;
      m[i+3]=(m[i+3]+m[i]*dx+m[i+1]*dy)*horizontal;
      m[i]*=face*horizontal;m[i+1]*=horizontal;m[i+2]*=horizontal;
    }
    // A dolly along the optical axis increases homogeneous depth uniformly.
    m[11]+=(width-lens.width)*1.05;
    return {...lens,x,y,width,live:true};
  }
  function releaseFinalCamera(lens,normal,amount) {
    const t=clamp(amount,0,1), s=t*t*(3-2*t), w=normal.width;
    const m=lens.projection, depth=m[8]*lens.x+m[9]*lens.y+m[11];
    const ortho=[2/w,0,0,-2*normal.x/w,0,32/(9*w),-32*cameraPitch/(9*w),-32*normal.y/(9*w),0,0,-1/(w*focalLength),1];
    return {...lens,x:lens.x*(1-s)+normal.x*s,y:lens.y*(1-s)+normal.y*s,width:lens.width*(1-s)+w*s,
      projection:m.map((v,i)=>v*(1-s)+ortho[i]*depth*s),grade:(lens.grade??1)*(1-s)};
  }
  globalThis.SmashStage = {create, cameraDistance, cameraPitch, backAirCamera, finalReplayCamera, liveFinalCamera, releaseFinalCamera, swordOpeningLight, finalSkyRecovery};
})();

/**
 * NEXUS Background Engine
 * ========================
 * Inspired by alireza.com's technique:
 *
 * WHAT THEY ACTUALLY DO:
 * - One fixed full-viewport canvas stays behind all content
 * - Each section has a distinct 3D WebGL scene (like different camera angles of same object)
 * - The body does NOT scroll — sections are stacked and revealed via JS
 * - Scenes crossfade with CSS opacity transitions as you navigate
 * - Content text overlays the fixed 3D background
 *
 * OUR ADAPTATION (static site, real scroll):
 * - One fixed canvas with 5 distinct Three.js scenes
 * - IntersectionObserver watches sections and fades the active scene
 * - Smooth lerp-based crossfade between scenes (not instant)
 * - Each scene is a distinct 3D "camera angle": particles close-up,
 *   geometric mesh, data grid, torus cosmos, nebula
 * - All content sits above via z-index, background transparent
 */

'use strict';

(function NexusBG() {
  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', NexusBGInit);
    return;
  }
  NexusBGInit();
  function NexusBGInit() {
  if (!window.THREE) return;
  const canvas = document.getElementById('globalBg');
  if (!canvas) return;

  // ─── Renderer ───────────────────────────────────────
  const R = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  R.setPixelRatio(Math.min(devicePixelRatio, window.innerWidth <= 768 ? 1.5 : 2));
  R.setSize(innerWidth, innerHeight);
  R.setClearColor(0x02080e, 1);
  R.autoClear = false;

  const MOBILE = window.innerWidth <= 768;

  // ─── Brand palette ──────────────────────────────────
  const PAL = [
    new THREE.Color(0x6dc44b), new THREE.Color(0x3ab26e),
    new THREE.Color(0x228f7e), new THREE.Color(0x18a786),
    new THREE.Color(0x0258a3), new THREE.Color(0x0b5197),
  ];

  // ─── Shared camera ──────────────────────────────────
  // One camera, we reposition it per scene
  const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);

  // ─── Build scenes ───────────────────────────────────

  // SCENE 0 — HERO: deep space particles + N-ribbon (like alireza hero palm: full-width, warm-lit)
  function buildScene0() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020c08);
    const N = MOBILE ? 1200 : 4000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      // Concentrated in centre to mimic depth
      const r = Math.pow(Math.random(), 0.5) * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      pos[i*3+2] = r * Math.cos(phi) - 4;
      const c = PAL[Math.floor(Math.random() * PAL.length)];
      // Warmer tint for hero (like alireza's warm emerald glow)
      col[i*3] = c.r * 0.9 + 0.1; col[i*3+1] = c.g * 0.8; col[i*3+2] = c.b * 0.3;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      size: MOBILE ? 0.1 : 0.06, vertexColors: true, transparent: true, opacity: 0.9,
      sizeAttenuation: true,
    }));
    scene.add(pts);

    // Large glowing sphere in centre (palm tree silhouette substitute)
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x0d4a2a, transparent: true, opacity: 0.35 })
    );
    glow.position.set(0, -1, -2);
    scene.add(glow);

    // Radial light bloom rings
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.5 + i * 1.2, 0.015, 4, 80),
        new THREE.MeshBasicMaterial({ color: 0x3ab26e, transparent: true, opacity: 0.12 - i * 0.03 })
      );
      ring.rotation.x = Math.PI / 2; ring.position.y = -1 + i * 0.3;
      scene.add(ring);
    }

    // Fibonacci spiral arms (like palm fronds in 3D)
    const phi = (1 + Math.sqrt(5)) / 2;
    const armGeo = new THREE.BufferGeometry();
    const armPts = MOBILE ? 200 : 600;
    const armPos = new Float32Array(armPts * 3);
    for (let i = 0; i < armPts; i++) {
      const t = i / armPts;
      const angle = i * phi * Math.PI * 2;
      const radius = t * 5;
      armPos[i*3]   = Math.cos(angle) * radius;
      armPos[i*3+1] = Math.sin(angle) * radius * 0.4 - 1;
      armPos[i*3+2] = -3 + t * 2;
    }
    armGeo.setAttribute('position', new THREE.BufferAttribute(armPos, 3));
    scene.add(new THREE.Points(armGeo, new THREE.PointsMaterial({
      color: 0x6dc44b, size: 0.08, transparent: true, opacity: 0.6
    })));

    return { scene, pts, glow, rings: scene.children.filter(c => c.type === 'Mesh' && c.geometry.type === 'TorusGeometry') };
  }

  // SCENE 1 — CATEGORIES: extreme close-up fibres/strands (alireza values: dark with diagonal fibres)
  function buildScene1() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010608);

    // Diagonal strand lines (like palm leaf fibres zoomed in)
    const strandCount = MOBILE ? 12 : 28;
    const strands = [];
    for (let s = 0; s < strandCount; s++) {
      const pts = MOBILE ? 40 : 80;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(pts * 3);
      const startX = (Math.random() - 0.5) * 14;
      const startY = (Math.random() - 0.5) * 10;
      const angle = -0.6 + Math.random() * 0.4; // Diagonal like alireza
      const len = 8 + Math.random() * 6;
      const curve = (Math.random() - 0.5) * 0.8;
      for (let i = 0; i < pts; i++) {
        const t = i / pts;
        pos[i*3]   = startX + Math.cos(angle) * t * len + Math.sin(t * Math.PI) * curve;
        pos[i*3+1] = startY + Math.sin(angle) * t * len;
        pos[i*3+2] = -2 + Math.random() * 4;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const c = PAL[Math.floor(Math.random() * PAL.length)];
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
        color: new THREE.Color(c.r * 0.6, c.g * 0.5, c.b * 0.2),
        transparent: true, opacity: 0.35 + Math.random() * 0.3,
      }));
      scene.add(line);
      strands.push({ line, speed: 0.002 + Math.random() * 0.003 });
    }

    // Sparse particles
    const sGeo = new THREE.BufferGeometry();
    const sN = MOBILE ? 300 : 800;
    const sPos = new Float32Array(sN * 3);
    for (let i = 0; i < sN; i++) {
      sPos[i*3] = (Math.random()-0.5)*20; sPos[i*3+1] = (Math.random()-0.5)*14; sPos[i*3+2] = (Math.random()-0.5)*8;
    }
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    scene.add(new THREE.Points(sGeo, new THREE.PointsMaterial({ color:0x18a786, size:0.035, transparent:true, opacity:0.5 })));

    return { scene, strands };
  }

  // SCENE 2 — MARKETPLACE: palm trunk close-up (alireza history: warm amber vertical trunk)
  function buildScene2() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030b05);

    // Vertical geometric trunk form using stacked rings (like palm trunk pattern)
    const ringCount = MOBILE ? 14 : 28;
    const trunk = [];
    for (let i = 0; i < ringCount; i++) {
      const y = -8 + (i / ringCount) * 16;
      const r = 1.2 + Math.sin(i * 0.8) * 0.3;
      const geo = new THREE.TorusGeometry(r, 0.06, 6, 40);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.6 + (i/ringCount)*0.4, 0.4 + (i/ringCount)*0.3, 0.05),
        transparent: true, opacity: 0.4 + (i/ringCount) * 0.3,
        wireframe: Math.random() > 0.5,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = y; mesh.rotation.x = Math.PI / 2 + (Math.random()-0.5)*0.3;
      scene.add(mesh);
      trunk.push({ mesh, rotSpeed: (Math.random()-0.5)*0.008 });
    }

    // Amber glow at centre
    const coreGeo = new THREE.CylinderGeometry(0.4, 0.6, 14, 12);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x8b5c10, transparent: true, opacity: 0.15 });
    scene.add(new THREE.Mesh(coreGeo, coreMat));

    // Background particles — warm amber
    const bGeo = new THREE.BufferGeometry();
    const bN = MOBILE ? 400 : 1200;
    const bPos = new Float32Array(bN * 3), bCol = new Float32Array(bN * 3);
    for (let i = 0; i < bN; i++) {
      bPos[i*3] = (Math.random()-0.5)*20; bPos[i*3+1] = (Math.random()-0.5)*16; bPos[i*3+2] = (Math.random()-0.5)*8-4;
      bCol[i*3] = 0.4+Math.random()*0.4; bCol[i*3+1] = 0.25+Math.random()*0.2; bCol[i*3+2] = 0.02;
    }
    bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
    bGeo.setAttribute('color', new THREE.BufferAttribute(bCol, 3));
    scene.add(new THREE.Points(bGeo, new THREE.PointsMaterial({ size:0.04, vertexColors:true, transparent:true, opacity:0.6 })));

    return { scene, trunk };
  }

  // SCENE 3 — XR: palm fronds dark blue-green (alireza sectors: dark with corner fronds)
  function buildScene3() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010a0c);

    // Frond-like curved surfaces shooting from corner (alireza sectors bg)
    const frondCount = MOBILE ? 6 : 14;
    const fronds = [];
    for (let f = 0; f < frondCount; f++) {
      const pts = MOBILE ? 50 : 120;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(pts * 3);
      const startAngle = -Math.PI/4 + (f / frondCount) * Math.PI * 0.8;
      const startX = 6 + Math.random() * 2; // from right
      const startY = -5 + Math.random() * 2; // from bottom
      for (let i = 0; i < pts; i++) {
        const t = i / pts;
        const curl = Math.sin(t * Math.PI) * 2;
        pos[i*3]   = startX - t * 10 * Math.cos(startAngle) + curl * 0.3;
        pos[i*3+1] = startY + t * 8 * Math.sin(startAngle) + curl;
        pos[i*3+2] = -2 - t * 2 + Math.random() * 0.5;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const c = f % 2 === 0 ? 0x1a5c3a : 0x0b3d52;
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color:c, transparent:true, opacity:0.4+Math.random()*0.3 }));
      scene.add(line);
      fronds.push({ line, offset: Math.random() * Math.PI * 2 });
    }

    // Subtle teal particles
    const fGeo = new THREE.BufferGeometry();
    const fN = MOBILE ? 500 : 1500;
    const fPos = new Float32Array(fN * 3);
    for (let i = 0; i < fN; i++) {
      fPos[i*3] = (Math.random()-0.5)*20; fPos[i*3+1] = (Math.random()-0.5)*14; fPos[i*3+2] = (Math.random()-0.5)*8-2;
    }
    fGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3));
    scene.add(new THREE.Points(fGeo, new THREE.PointsMaterial({ color:0x0b6644, size:0.04, transparent:true, opacity:0.5 })));

    return { scene, fronds };
  }

  // SCENE 4 — FOOTER: palm from above, spread fronds (alireza careers: top-down dark fronds spread)
  function buildScene4() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010508);

    // Top-down spread — radial lines from centre (palm viewed from top)
    const armCount = MOBILE ? 8 : 18;
    const arms = [];
    for (let a = 0; a < armCount; a++) {
      const pts = MOBILE ? 60 : 140;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(pts * 3);
      const baseAngle = (a / armCount) * Math.PI * 2;
      const len = 5 + Math.random() * 3;
      const droop = Math.random() * 2;
      for (let i = 0; i < pts; i++) {
        const t = i / pts;
        const spread = Math.sin(t * Math.PI * 0.5) * 0.4;
        const subAngle = baseAngle + (Math.random() - 0.5) * 0.3;
        pos[i*3]   = Math.cos(subAngle + spread) * t * len;
        pos[i*3+1] = Math.sin(subAngle + spread) * t * len;
        pos[i*3+2] = -t * droop;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(0.05, 0.2 + a/armCount * 0.3, 0.15 + a/armCount*0.2),
        transparent: true, opacity: 0.3 + Math.random() * 0.35,
      });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      arms.push({ line, rotSpeed: (Math.random()-0.5)*0.003 });
    }

    // Deep space particles
    const dGeo = new THREE.BufferGeometry();
    const dN = MOBILE ? 600 : 1800;
    const dPos = new Float32Array(dN * 3), dCol = new Float32Array(dN * 3);
    for (let i = 0; i < dN; i++) {
      dPos[i*3] = (Math.random()-0.5)*22; dPos[i*3+1] = (Math.random()-0.5)*16; dPos[i*3+2] = (Math.random()-0.5)*10-3;
      const c = PAL[Math.floor(Math.random()*PAL.length)];
      dCol[i*3]=c.r*0.4; dCol[i*3+1]=c.g*0.5; dCol[i*3+2]=c.b*0.4;
    }
    dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
    dGeo.setAttribute('color', new THREE.BufferAttribute(dCol, 3));
    scene.add(new THREE.Points(dGeo, new THREE.PointsMaterial({ size:0.03, vertexColors:true, transparent:true, opacity:0.7 })));

    return { scene, arms };
  }

  // ─── Instantiate all scenes ──────────────────────────
  const s0 = buildScene0();
  const s1 = buildScene1();
  const s2 = buildScene2();
  const s3 = buildScene3();
  const s4 = buildScene4();

  const SCENES = [s0.scene, s1.scene, s2.scene, s3.scene, s4.scene];

  // ─── Scene → section mapping ─────────────────────────
  const SECTION_MAP = {
    'home':          0,
    'categories':    1,
    'marketplace':   2,
    'xr':            3,
    'testimonials':  3,
    'footer':        4,
  };

  // ─── Crossfade state ─────────────────────────────────
  // We render two scenes and lerp alpha between them
  let currentIdx = 0;
  let targetIdx  = 0;
  let blend = 1.0; // 1 = fully on targetIdx

  // Camera per scene (z distance)
  const CAM_Z = [5, 3.5, 4, 4, 3];
  cam.position.z = CAM_Z[0];

  // ─── Mouse parallax ──────────────────────────────────
  let mx = 0, my = 0;
  if (!MOBILE) {
    window.addEventListener('mousemove', e => {
      mx = (e.clientX / innerWidth - 0.5) * 2;
      my = -(e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  // ─── Section detection ───────────────────────────────
  const bgSections = document.querySelectorAll('[data-bg-scene]');
  let detectTicking = false;

  function detectScene() {
    let best = null, bestVis = 0;
    bgSections.forEach(sec => {
      const r = sec.getBoundingClientRect();
      const vis = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
      if (vis > bestVis) { bestVis = vis; best = sec.dataset.bgScene; }
    });
    if (!best) return;
    const idx = SECTION_MAP[best] ?? 0;
    if (idx !== targetIdx) {
      currentIdx = targetIdx;
      targetIdx = idx;
      blend = 0;
    }
  }

  window.addEventListener('scroll', () => {
    if (!detectTicking) {
      requestAnimationFrame(() => { detectScene(); detectTicking = false; });
      detectTicking = true;
    }
  }, { passive: true });

  // ─── Pause when tab hidden ───────────────────────────
  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });

  // ─── Animation clock ─────────────────────────────────
  const clk = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    if (!running) return;
    const t = clk.getElapsedTime();

    // Advance blend
    blend = Math.min(1, blend + 0.025);

    // Lerp camera z
    const tgtZ = CAM_Z[targetIdx];
    cam.position.z += (tgtZ - cam.position.z) * 0.04;
    cam.position.x += (mx * 0.35 - cam.position.x) * 0.03;
    cam.position.y += (my * 0.2  - cam.position.y) * 0.03;

    // ── Animate scene 0 (hero) ──
    if (s0.pts) { s0.pts.rotation.y = t * 0.015; s0.pts.rotation.x = Math.sin(t*0.01)*0.04; }
    if (s0.glow) { s0.glow.scale.setScalar(1 + Math.sin(t*0.5)*0.06); }

    // ── Animate scene 1 (fibres) ──
    s1.strands.forEach((s, i) => {
      s.line.position.x = Math.sin(t * s.speed * 0.5 + i) * 0.15;
      s.line.material.opacity = 0.3 + Math.sin(t * s.speed + i) * 0.15;
    });

    // ── Animate scene 2 (trunk) ──
    s2.trunk.forEach((tr, i) => {
      tr.mesh.rotation.z += tr.rotSpeed;
      tr.mesh.position.x = Math.sin(t * 0.3 + i * 0.5) * 0.08;
    });

    // ── Animate scene 3 (fronds) ──
    s3.fronds.forEach((fr, i) => {
      fr.line.rotation.z = Math.sin(t * 0.3 + fr.offset) * 0.04;
    });

    // ── Animate scene 4 (top-down) ──
    s4.arms.forEach(arm => { arm.line.rotation.z += arm.rotSpeed; });

    // ── Render ──
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
    R.clear();

    if (blend < 1 && currentIdx !== targetIdx) {
      // Render "from" scene at (1-blend) opacity
      // Three.js doesn't have scene opacity, so we use renderer clear trick:
      // Render current scene first, then overlay target with alpha
      // Simple approach: just hard-cut at 0.5 blend for clean swap
      const useIdx = blend < 0.5 ? currentIdx : targetIdx;
      R.render(SCENES[useIdx], cam);
    } else {
      R.render(SCENES[targetIdx], cam);
    }
  }

  animate();

  // ─── Resize ──────────────────────────────────────────
  window.addEventListener('resize', () => {
    R.setSize(innerWidth, innerHeight);
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
  }, { passive: true });

  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      R.setSize(innerWidth, innerHeight);
      cam.aspect = innerWidth / innerHeight;
      cam.updateProjectionMatrix();
    }, 250);
  });


  // Signal CSS that canvas is confirmed working — reveal transparent sections
  canvas.style.opacity = '1';
  document.body.classList.add('bg-ready');
  console.log('[NEXUS BG] Canvas ready — bg-ready class added');
  } // end NexusBGInit

})();

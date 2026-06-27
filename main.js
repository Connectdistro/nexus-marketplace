"use strict";

/* ── Brand color palette (logo-exact) ─────────── */
const C = {
  green:  0x6dc44b,
  greenM: 0x3ab26e,
  teal:   0x228f7e,
  tealL:  0x18a786,
  blue:   0x0258a3,
  blueM:  0x0b5197,
  indigo: 0x250076,
};
// For particle vertex colors (normalized 0-1)
const PAL = [
  [0.427, 0.769, 0.294], // green
  [0.227, 0.698, 0.494], // green-mid
  [0.133, 0.561, 0.494], // teal
  [0.094, 0.655, 0.525], // teal-light
  [0.008, 0.345, 0.639], // blue
  [0.145, 0.318, 0.592], // blue-mid
];

/* ── $ helpers ────────────────────────────────── */
const $ = id => document.getElementById(id);
const $$ = s => document.querySelectorAll(s);

/* ════ THEME SYSTEM ═══════════════════════════ */
const KEY = 'nexus-theme';
const getTheme = () => localStorage.getItem(KEY) || 'dark';
const applyTheme = t => {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem(KEY, t);
  const icon = t === 'dark' ? '🌙' : '☀️';
  [$('themeToggle'), $('themeToggleMob')].forEach(el => { if (el) el.textContent = icon; });
};
const toggleTheme = () => applyTheme(getTheme() === 'dark' ? 'light' : 'dark');

// Apply saved theme immediately
applyTheme(getTheme());
[$('themeToggle'), $('themeToggleMob')].forEach(el => { if (el) el.addEventListener('click', toggleTheme); });

/* ════ FLOATING NAV ═══════════════════════════ */
const nav = $('mainNav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

/* ════ MOBILE MENU ════════════════════════════ */
const burger = $('navBurger');
const mobileMenu = $('mobileMenu');
let menuOpen = false;

function setMenu(state) {
  menuOpen = state;
  mobileMenu.classList.toggle('open', state);
  document.body.style.overflow = state ? 'hidden' : '';
  const spans = burger.querySelectorAll('span');
  spans[0].style.transform = state ? 'rotate(45deg) translate(5px,5px)' : '';
  spans[1].style.opacity   = state ? '0' : '';
  spans[2].style.transform = state ? 'rotate(-45deg) translate(5px,-5px)' : '';
}
burger.addEventListener('click', () => setMenu(!menuOpen));
$$('.mobile-link').forEach(l => l.addEventListener('click', () => setMenu(false)));

// Show mobile theme toggle only on small screens
function syncMobileToggle() {
  const el = $('themeToggleMob');
  if (el) el.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
}
syncMobileToggle();
window.addEventListener('resize', syncMobileToggle);

/* ════ STAT COUNTERS ═════════════════════════ */
function animCount(el, target) {
  const dur = 2400, t0 = performance.now();
  const tick = now => {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
const cObs = new IntersectionObserver(es => {
  es.forEach(e => { if (e.isIntersecting) { animCount(e.target, +e.target.dataset.target); cObs.unobserve(e.target); } });
}, { threshold: 0.5 });
$$('.stat-num').forEach(n => cObs.observe(n));

/* ════ SCROLL REVEAL ════════════════════════ */
const rObs = new IntersectionObserver(es => {
  es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); rObs.unobserve(e.target); } });
}, { threshold: 0.1 });
$$('[data-reveal]').forEach(el => rObs.observe(el));

/* ════ THREE.JS HERO ════════════════════════ */
function initHero() {
  const canvas = $('heroCanvas');
  if (!canvas || !window.THREE) return;
  const R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  R.setPixelRatio(Math.min(devicePixelRatio, 2));
  R.setSize(canvas.offsetWidth, canvas.offsetHeight);
  R.setClearColor(0, 0);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(60, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
  cam.position.z = 5;

  // Particle field — brand colors
  const N = innerWidth < 768 ? 1600 : 4200;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i*3]   = (Math.random() - .5) * 22;
    pos[i*3+1] = (Math.random() - .5) * 22;
    pos[i*3+2] = (Math.random() - .5) * 16;
    const c = PAL[Math.floor(Math.random() * PAL.length)];
    col[i*3] = c[0]; col[i*3+1] = c[1]; col[i*3+2] = c[2];
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.042, vertexColors: true, transparent: true, opacity: 0.78 }));
  scene.add(pts);

  // Floating wireframe shapes in brand colors
  const shapeGeos = [
    new THREE.OctahedronGeometry(0.5, 0),
    new THREE.IcosahedronGeometry(0.4, 0),
    new THREE.TetrahedronGeometry(0.45, 0),
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.TorusGeometry(0.35, 0.12, 8, 20),
  ];
  const shapeColArr = [C.green, C.teal, C.blue, C.greenM, C.tealL, C.indigo, C.blueM];
  const shapes = [];
  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(
      shapeGeos[i % shapeGeos.length],
      new THREE.MeshBasicMaterial({ color: shapeColArr[i % shapeColArr.length], wireframe: true, transparent: true, opacity: 0.22 })
    );
    m.position.set((Math.random()-.5)*14, (Math.random()-.5)*10, (Math.random()-.5)*8-2);
    m.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
    m.userData = { rx: (Math.random()-.5)*.012, ry: (Math.random()-.5)*.012, fy: Math.random()*Math.PI*2, fs: .3+Math.random()*.6 };
    scene.add(m); shapes.push(m);
  }

  // N-ribbon (logo homage) — flowing tube
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.2,-1.6,0), new THREE.Vector3(-2.2,1.6,0),
    new THREE.Vector3(2.2,-1.6,0),  new THREE.Vector3(2.2,1.6,0),
  ]);
  const ribbon = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 80, 0.045, 8, false),
    new THREE.MeshBasicMaterial({ color: C.teal, transparent: true, opacity: 0.12 })
  );
  ribbon.position.z = -3; ribbon.scale.set(1.4, 1.4, 1);
  scene.add(ribbon);

  let mx = 0, my = 0;
  window.addEventListener('mousemove', e => {
    mx = (e.clientX / innerWidth - .5) * 2;
    my = -(e.clientY / innerHeight - .5) * 2;
  });

  const clk = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    const t = clk.getElapsedTime();
    pts.rotation.y = t * .022;
    pts.rotation.x = Math.sin(t * .014) * .07;
    shapes.forEach(s => {
      s.rotation.x += s.userData.rx;
      s.rotation.y += s.userData.ry;
      s.position.y += Math.sin(t * s.userData.fs + s.userData.fy) * .003;
    });
    ribbon.rotation.z = Math.sin(t * .18) * .04;
    cam.position.x += (mx * .5 - cam.position.x) * .04;
    cam.position.y += (my * .25 - cam.position.y) * .04;
    R.render(scene, cam);
  })();

  new ResizeObserver(() => {
    R.setSize(canvas.offsetWidth, canvas.offsetHeight);
    cam.aspect = canvas.offsetWidth / canvas.offsetHeight;
    cam.updateProjectionMatrix();
  }).observe(canvas.parentElement);
}

/* ════ THREE.JS CATEGORY CANVASES ═══════════ */
function initCat(id, colorA, colorB) {
  const canvas = $(id);
  if (!canvas || !window.THREE) return;
  const R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  R.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  R.setSize(canvas.offsetWidth, canvas.offsetHeight);
  R.setClearColor(0, 0);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(50, canvas.offsetWidth/canvas.offsetHeight, .1, 100);
  cam.position.z = 3;

  const outer = new THREE.Mesh(
    new THREE.IcosahedronGeometry(.88, 1),
    new THREE.MeshBasicMaterial({ color: colorA, wireframe: true, transparent: true, opacity: 0.42 })
  );
  const inner = new THREE.Mesh(
    new THREE.OctahedronGeometry(.52, 0),
    new THREE.MeshBasicMaterial({ color: colorB, wireframe: true, transparent: true, opacity: 0.28 })
  );
  scene.add(outer, inner);

  // Orbit ring of dots
  const rGeo = new THREE.BufferGeometry();
  const rp = new Float32Array(120 * 3);
  for (let i = 0; i < 120; i++) {
    const a = (i/120)*Math.PI*2, r = 1.45 + Math.sin(i*.25)*.12;
    rp[i*3]=Math.cos(a)*r; rp[i*3+1]=(Math.random()-.5)*.22; rp[i*3+2]=Math.sin(a)*r;
  }
  rGeo.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  const ring = new THREE.Points(rGeo, new THREE.PointsMaterial({ color: colorB, size: .038, transparent: true, opacity: .85 }));
  scene.add(ring);

  const clk = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    const t = clk.getElapsedTime();
    outer.rotation.x = t*.28; outer.rotation.y = t*.44;
    inner.rotation.x = -t*.4; inner.rotation.y = -t*.55;
    ring.rotation.y = t*.9; ring.rotation.x = Math.sin(t*.38)*.3;
    R.render(scene, cam);
  })();

  new ResizeObserver(() => {
    R.setSize(canvas.offsetWidth, canvas.offsetHeight);
    cam.aspect = canvas.offsetWidth/canvas.offsetHeight;
    cam.updateProjectionMatrix();
  }).observe(canvas);
}

/* ════ THREE.JS PRODUCT THUMBS ══════════════ */
function makeThumb(canvas, type) {
  if (!canvas || !window.THREE) return;
  const R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  R.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const w = canvas.offsetWidth||300, h = canvas.offsetHeight||180;
  R.setSize(w, h); R.setClearColor(0, 0);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(50, w/h, .1, 100);
  cam.position.z = 2.5;

  const cMap = { art: C.green, ads: C.teal, entertainment: C.blue };
  const c2Map = { art: C.greenM, ads: C.tealL, entertainment: C.indigo };
  const c = cMap[type] || C.teal, c2 = c2Map[type] || C.green;

  const rn = Math.random();
  const g = rn < .25 ? new THREE.OctahedronGeometry(.7,0)
    : rn < .5  ? new THREE.TorusGeometry(.5,.2,16,50)
    : rn < .75 ? new THREE.IcosahedronGeometry(.65,0)
    : new THREE.BoxGeometry(.8,.8,.8);

  const mesh  = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color:c,  wireframe:true, transparent:true, opacity:.5 }));
  const inner = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color:c2, wireframe:true, transparent:true, opacity:.2 }));
  inner.scale.set(.55,.55,.55);
  scene.add(mesh, inner);

  const pGeo = new THREE.BufferGeometry();
  const pp = new Float32Array(80*3);
  for(let i=0;i<80;i++){pp[i*3]=(Math.random()-.5)*3;pp[i*3+1]=(Math.random()-.5)*3;pp[i*3+2]=(Math.random()-.5)*3;}
  pGeo.setAttribute('position', new THREE.BufferAttribute(pp,3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({color:c, size:.03, transparent:true, opacity:.5})));

  const off = Math.random()*Math.PI*2, clk = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    const t = clk.getElapsedTime()+off;
    mesh.rotation.x=t*.4; mesh.rotation.y=t*.6;
    inner.rotation.x=-t*.5; inner.rotation.y=-t*.7;
    R.render(scene, cam);
  })();
}

/* ════ PRODUCTS ═════════════════════════════ */
const PRODUCTS = [
  { title:'Chromatic Void #07',        creator:'Aisha Kamara',    price:'$420',   rating:'★ 4.9', type:'art',           tags:['Abstract','Digital','NFT'],        desc:'A mesmerizing deep-space abstraction. High-resolution digital file + certificate of authenticity.' },
  { title:'Brand Launch Package',      creator:'Studio Meridian', price:'$1,200', rating:'★ 5.0', type:'ads',           tags:['Branding','Social','Campaign'],     desc:'Full-service brand launch with 6 creator placements, strategy deck, and performance reporting.' },
  { title:'Solstice — EP',             creator:'David Larsson',   price:'$18',    rating:'★ 4.8', type:'entertainment', tags:['Music','Ambient','Film Score'],     desc:'7-track ambient-electronic EP. FLAC + WAV, full license included for sync use.' },
  { title:'Golden Ratio Study',        creator:'Mara Chen',       price:'$280',   rating:'★ 4.7', type:'art',           tags:['Generative','Math Art','Print'],    desc:'Algorithmic golden ratio study. Limited edition of 10. Museum-grade print available.' },
  { title:'Influencer Campaign Tier A',creator:'ReachLab Agency', price:'$3,500', rating:'★ 4.9', type:'ads',           tags:['Influencer','1M+ Reach','ROI'],     desc:'Managed influencer campaign across 3 creators with 1M+ combined audience. Full analytics.' },
  { title:'Neon Noir — Short Film',    creator:'Priya Nair Films',price:'$8',     rating:'★ 5.0', type:'entertainment', tags:['Film','4K','Festival Winner'],      desc:'Award-winning 12-minute neo-noir. 4K download + director\'s commentary track.' },
  { title:'Fractal Garden',            creator:'Teodor Voss',     price:'$550',   rating:'★ 4.6', type:'art',           tags:['3D','Fractal','Animation'],         desc:'Loop-ready 3D fractal animation, 60fps, 4K. Perfect for installations or collection.' },
  { title:'Podcast Ad Placement',      creator:'SoundWave Media', price:'$900',   rating:'★ 4.8', type:'ads',           tags:['Audio','Podcast','Host Read'],      desc:'Host-read ad in top-50 design podcast. 40k+ listeners per episode, guaranteed.' },
];

function renderGrid(filter='all') {
  const grid = $('productGrid'); if (!grid) return;
  grid.innerHTML = '';
  const list = filter==='all' ? PRODUCTS : PRODUCTS.filter(p=>p.type===filter);
  list.slice(0,8).forEach((p,i) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    const label = p.type==='ads' ? 'Ad Service' : p.type[0].toUpperCase()+p.type.slice(1);
    card.innerHTML = `
      <div class="product-card-inner">
        <div class="product-face">
          <div class="product-thumb">
            <canvas id="pt_${i}"></canvas>
            <span class="product-badge badge--${p.type}">${label}</span>
          </div>
          <div class="product-info">
            <h4>${p.title}</h4>
            <div class="creator">${p.creator}</div>
            <div class="product-price-row">
              <span class="product-price">${p.price}</span>
              <span class="product-rating">${p.rating}</span>
            </div>
          </div>
        </div>
        <div class="product-back">
          <h4>${p.title}</h4>
          <p>${p.desc}</p>
          <div class="tags">${p.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
          <button class="btn-primary" onclick="location.href='contact.html'" style="font-size:13px;padding:10px 22px">Get It →</button>
        </div>
      </div>`;
    card.addEventListener('click', () => { if (innerWidth<=768) card.classList.toggle('tapped'); });
    grid.appendChild(card);
    setTimeout(() => { const c=$(`pt_${i}`); if(c) makeThumb(c,p.type); }, 80+i*45);
  });
}

$$('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    renderGrid(btn.dataset.filter);
  });
});

/* ════ THREE.JS XR CANVAS ══════════════════ */
function initXR() {
  const canvas = $('xrCanvas'); if (!canvas||!window.THREE) return;
  const R = new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  R.setPixelRatio(Math.min(devicePixelRatio,1.5));
  R.setSize(canvas.offsetWidth,canvas.offsetHeight); R.setClearColor(0,0);
  const scene=new THREE.Scene(), cam=new THREE.PerspectiveCamera(50,canvas.offsetWidth/canvas.offsetHeight,.1,100);
  cam.position.z=4;

  const tk=new THREE.Mesh(new THREE.TorusKnotGeometry(1,.3,128,16), new THREE.MeshBasicMaterial({color:C.teal,wireframe:true,transparent:true,opacity:.28}));
  scene.add(tk);
  [[C.green,2.2,Math.PI/3],[C.blue,1.6,Math.PI/4]].forEach(([col,r,rx],i)=>{
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.018,8,120), new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.35}));
    ring.rotation.x=rx; ring.rotation.y=i*.5; scene.add(ring);
  });

  const clk=new THREE.Clock();
  (function animate(){requestAnimationFrame(animate);const t=clk.getElapsedTime();tk.rotation.x=t*.28;tk.rotation.y=t*.44;scene.children.slice(1).forEach((r,i)=>r.rotation.z=t*(i?-.18:.14));R.render(scene,cam);})();
  new ResizeObserver(()=>{R.setSize(canvas.offsetWidth,canvas.offsetHeight);cam.aspect=canvas.offsetWidth/canvas.offsetHeight;cam.updateProjectionMatrix();}).observe(canvas.parentElement);
}

/* ════ THREE.JS FOOTER ══════════════════════ */
function initFooter() {
  const canvas=$('footerCanvas'); if(!canvas||!window.THREE) return;
  const R=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  R.setPixelRatio(1); R.setSize(canvas.offsetWidth,canvas.offsetHeight); R.setClearColor(0,0);
  const scene=new THREE.Scene(), cam=new THREE.PerspectiveCamera(60,canvas.offsetWidth/canvas.offsetHeight,.1,100);
  cam.position.z=3;
  const N=1400, geo=new THREE.BufferGeometry(), pos=new Float32Array(N*3), col=new Float32Array(N*3);
  for(let i=0;i<N;i++){
    pos[i*3]=(Math.random()-.5)*24;pos[i*3+1]=(Math.random()-.5)*14;pos[i*3+2]=(Math.random()-.5)*12;
    const c=PAL[Math.floor(Math.random()*PAL.length)];col[i*3]=c[0];col[i*3+1]=c[1];col[i*3+2]=c[2];
  }
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  const pts=new THREE.Points(geo,new THREE.PointsMaterial({size:.032,vertexColors:true,transparent:true,opacity:.48}));
  scene.add(pts);
  const clk=new THREE.Clock();
  (function animate(){requestAnimationFrame(animate);pts.rotation.y=clk.getElapsedTime()*.038;R.render(scene,cam);})();
  new ResizeObserver(()=>{R.setSize(canvas.offsetWidth,canvas.offsetHeight);cam.aspect=canvas.offsetWidth/canvas.offsetHeight;cam.updateProjectionMatrix();}).observe(canvas.parentElement);
}

/* ════ THREE.JS AR MODAL ════════════════════ */
let arInited = false;
function initAR() {
  if (arInited) return; arInited = true;
  const canvas=$('arCanvas'); if(!canvas||!window.THREE) return;
  const R=new THREE.WebGLRenderer({canvas,antialias:true});
  R.setPixelRatio(Math.min(devicePixelRatio,2)); R.setSize(canvas.offsetWidth,canvas.offsetHeight); R.setClearColor(0x070c18);
  const scene=new THREE.Scene(), cam=new THREE.PerspectiveCamera(60,canvas.offsetWidth/canvas.offsetHeight,.1,100);
  cam.position.z=4;
  const grid=new THREE.GridHelper(12,24,C.teal,C.blue); grid.position.y=-1.5; grid.material.opacity=.28; grid.material.transparent=true; scene.add(grid);
  const frame=new THREE.Mesh(new THREE.BoxGeometry(2,2.5,.1),new THREE.MeshBasicMaterial({color:0x0b1120}));
  const border=new THREE.Mesh(new THREE.BoxGeometry(2.12,2.62,.05),new THREE.MeshBasicMaterial({color:C.teal,wireframe:true}));
  const glow=new THREE.Mesh(new THREE.TorusGeometry(1.9,.022,8,100),new THREE.MeshBasicMaterial({color:C.green}));
  glow.rotation.x=Math.PI/2; glow.position.y=-1.49; scene.add(frame,border,glow);
  const st=$('arStatusText');
  setTimeout(()=>{if(st)st.textContent='Surface detected — AR ready';},1600);
  const clk=new THREE.Clock();
  (function animate(){requestAnimationFrame(animate);const t=clk.getElapsedTime();[frame,border].forEach(m=>m.rotation.y=Math.sin(t*.5)*.22);glow.rotation.z=t*.38;R.render(scene,cam);})();
}

/* ════ AR BUTTON ════════════════════════════ */
$('xrBtn').addEventListener('click',()=>{
  $('arModal').classList.add('active');
  setTimeout(initAR,80);
  if(navigator.xr)navigator.xr.isSessionSupported('immersive-ar').then(s=>{if(s){const el=$('arStatusText');if(el)el.textContent='WebXR AR available — tap to launch';}});
});
$('arClose').addEventListener('click',()=>$('arModal').classList.remove('active'));
$('arModal').addEventListener('click',e=>{if(e.target===$('arModal'))$('arModal').classList.remove('active');});

/* ════ DESKTOP TILT CARDS ═══════════════════ */
if (innerWidth > 768) {
  $$('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--rx', `${((e.clientX-r.left)/r.width-.5)*14}deg`);
      card.style.setProperty('--ry', `${-((e.clientY-r.top)/r.height-.5)*10}deg`);
    });
    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--rx','0deg');
      card.style.setProperty('--ry','0deg');
    });
  });
}

/* ════ TESTIMONIAL LOOP ═════════════════════ */
(function(){
  const t=$('testimonialTrack');
  if(t) t.innerHTML += t.innerHTML;
})();

/* ════ INIT ═════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Staggered hero entrance
  $$('.hero-eyebrow,.hero-title,.hero-sub,.hero-cta,.hero-stats').forEach((el,i)=>{
    el.style.opacity='0'; el.style.transform='translateY(26px)';
    el.style.transition=`opacity 0.85s ease ${i*.13}s, transform 0.85s ease ${i*.13}s`;
    setTimeout(()=>{el.style.opacity='1';el.style.transform='';},60);
  });

  renderGrid();
  initHero();
  initCat('catCanvas0', C.green,  C.greenM);
  initCat('catCanvas1', C.teal,   C.tealL);
  initCat('catCanvas2', C.blue,   C.indigo);
  initXR();
  initFooter();
});

/* ════ KEYBOARD ════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key==='Escape') { setMenu(false); $('arModal').classList.remove('active'); }
});

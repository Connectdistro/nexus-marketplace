/* ═══════════════════════════════════════
   NEXUS NAV — shared across all pages
   Theme · Auth · Menu · Toast
═══════════════════════════════════════ */
'use strict';

/* ── Theme ── */
const THEME_KEY = 'nexus-theme';
function getTheme() { return localStorage.getItem(THEME_KEY) || 'dark'; }
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem(THEME_KEY, t);
}
window.toggleTheme = function() {
  applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
};
applyTheme(getTheme());

/* ── Auth storage ── */
const AUTH_KEY = 'nexus_user';
window.NxAuth = {
  get() { try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; } },
  set(u)  { localStorage.setItem(AUTH_KEY, JSON.stringify(u)); },
  clear() { localStorage.removeItem(AUTH_KEY); },
  isLoggedIn() { return !!this.get(); },
};

/* ── Toast ── */
window.nxToast = function(msg) {
  let el = document.getElementById('nx-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'nx-toast';
    el.className = 'nx-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2800);
};

/* ── Password toggle ── */
window.nxTogglePass = function(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁' : '🙈';
};

/* ── Password strength ── */
window.nxStrength = function(val, fillId, lblId) {
  const fill = document.getElementById(fillId);
  const lbl  = document.getElementById(lblId);
  if (!fill) return;
  let s = 0;
  if (val.length >= 8) s++;
  if (/[A-Z]/.test(val)) s++;
  if (/[0-9]/.test(val)) s++;
  if (/[^A-Za-z0-9]/.test(val)) s++;
  const lvl = val.length === 0
    ? { w:'0%', c:'transparent', t:'' }
    : [
        { w:'15%', c:'#ef4444', t:'Too short' },
        { w:'35%', c:'#f97316', t:'Weak' },
        { w:'60%', c:'#eab308', t:'Fair' },
        { w:'82%', c:'#3ab26e', t:'Good' },
        { w:'100%', c:'#6dc44b', t:'Strong ✓' },
      ][Math.min(s, 4)];
  fill.style.width = lvl.w;
  fill.style.background = lvl.c;
  if (lbl) { lbl.textContent = lvl.t; lbl.style.color = lvl.c; }
};

/* ════════════════════════════════════════
   AUTH MODAL — inline, no external deps
════════════════════════════════════════ */
window.NxModal = {
  overlay: null,
  mode: 'login',
  onSuccess: null,

  _build() {
    if (document.getElementById('nx-modal-overlay')) {
      this.overlay = document.getElementById('nx-modal-overlay');
      return;
    }
    const el = document.createElement('div');
    el.id = 'nx-modal-overlay';
    el.className = 'nx-modal-overlay';
    el.innerHTML = `
<div class="nx-modal-box">
  <button class="nx-modal-close" onclick="NxModal.close()">✕</button>

  <div class="nx-modal-brand">
    <img src="logo.png" alt="NEXUS"/>
    <span>NEXUS</span>
  </div>

  <div class="nx-modal-tabs">
    <button class="nx-modal-tab active" id="mTab-login" onclick="NxModal.tab('login')">Sign In</button>
    <button class="nx-modal-tab" id="mTab-signup" onclick="NxModal.tab('signup')">Create Account</button>
    <div class="nx-modal-tab-bar" id="mTabBar"></div>
  </div>

  <!-- LOGIN -->
  <div id="mForm-login">
    <p class="nx-modal-title">Welcome back</p>
    <p class="nx-modal-sub">Sign in to access the marketplace.</p>
    <div class="nx-field">
      <label>Email</label>
      <div class="nx-input-wrap">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
        <input type="email" id="li-email" placeholder="you@example.com" autocomplete="email"/>
      </div>
    </div>
    <div class="nx-field">
      <label>Password</label>
      <div class="nx-input-wrap">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <input type="password" id="li-pass" placeholder="••••••••" autocomplete="current-password"/>
        <button class="nx-pass-eye" type="button" onclick="nxTogglePass('li-pass',this)">👁</button>
      </div>
    </div>
    <p class="nx-modal-err" id="li-err"></p>
    <button class="nx-modal-submit" id="li-btn" onclick="NxModal.doLogin()">
      <span id="li-btn-txt">Sign In</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </button>
    <div class="nx-modal-div">or</div>
    <div class="nx-social-row">
      <button class="nx-social-btn" onclick="NxModal.social('Google')">
        <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Google
      </button>
      <button class="nx-social-btn" onclick="NxModal.social('Apple')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"/></svg>
        Apple
      </button>
    </div>
  </div>

  <!-- SIGNUP -->
  <div id="mForm-signup" style="display:none">
    <p class="nx-modal-title">Join NEXUS</p>
    <p class="nx-modal-sub">Create your free account.</p>
    <div class="nx-field-row">
      <div class="nx-field">
        <label>First Name</label>
        <div class="nx-input-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <input type="text" id="su-first" placeholder="Aisha" autocomplete="given-name"/>
        </div>
      </div>
      <div class="nx-field">
        <label>Last Name</label>
        <div class="nx-input-wrap no-icon">
          <input type="text" id="su-last" placeholder="Kamara" autocomplete="family-name"/>
        </div>
      </div>
    </div>
    <div class="nx-field">
      <label>Email</label>
      <div class="nx-input-wrap">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
        <input type="email" id="su-email" placeholder="you@example.com" autocomplete="email"/>
      </div>
    </div>
    <div class="nx-field">
      <label>Password</label>
      <div class="nx-input-wrap">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <input type="password" id="su-pass" placeholder="Min 8 characters" autocomplete="new-password"
          oninput="nxStrength(this.value,'su-strength-fill','su-strength-lbl')"/>
        <button class="nx-pass-eye" type="button" onclick="nxTogglePass('su-pass',this)">👁</button>
      </div>
      <div class="nx-strength-bar"><div class="nx-strength-fill" id="su-strength-fill"></div></div>
      <span class="nx-strength-lbl" id="su-strength-lbl"></span>
    </div>
    <div class="nx-field">
      <label>Confirm Password</label>
      <div class="nx-input-wrap">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <input type="password" id="su-pass2" placeholder="Repeat password" autocomplete="new-password"/>
      </div>
    </div>
    <div class="nx-modal-check">
      <input type="checkbox" id="su-terms"/>
      <label for="su-terms">I agree to the <a href="terms.html">Terms</a> and <a href="privacy.html">Privacy Policy</a></label>
    </div>
    <p class="nx-modal-err" id="su-err"></p>
    <button class="nx-modal-submit" id="su-btn" onclick="NxModal.doSignup()">
      <span id="su-btn-txt">Create Account</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </button>
    <div class="nx-modal-div">or sign up with</div>
    <div class="nx-social-row">
      <button class="nx-social-btn" onclick="NxModal.social('Google')">
        <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Google
      </button>
      <button class="nx-social-btn" onclick="NxModal.social('Apple')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"/></svg>
        Apple
      </button>
    </div>
  </div>

  <!-- SUCCESS -->
  <div class="nx-modal-success" id="mSuccess">
    <div class="nx-success-icon">✅</div>
    <h3 id="mSuccess-title">Welcome!</h3>
    <p id="mSuccess-msg">You're signed in.</p>
  </div>
</div>`;
    document.body.appendChild(el);
    this.overlay = el;
    el.addEventListener('click', e => { if (e.target === el) this.close(); });
    el.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.close();
      if (e.key === 'Enter') {
        if (this.mode === 'login') this.doLogin();
        else this.doSignup();
      }
    });
  },

  open(mode = 'login', cb = null) {
    this._build();
    this.onSuccess = cb;
    this.tab(mode);
    this.overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const f = document.getElementById(mode === 'login' ? 'li-email' : 'su-first');
      if (f) f.focus();
    }, 320);
  },

  close() {
    if (!this.overlay) return;
    this.overlay.classList.remove('open');
    document.body.style.overflow = '';
    // Reset success
    const s = document.getElementById('mSuccess');
    if (s) s.classList.remove('show');
    const fl = document.getElementById('mForm-login');
    const fs = document.getElementById('mForm-signup');
    if (fl) fl.style.display = '';
    if (fs) fs.style.display = 'none';
    this._clearErr();
  },

  tab(mode) {
    this._build();
    this.mode = mode;
    const fl = document.getElementById('mForm-login');
    const fs = document.getElementById('mForm-signup');
    if (fl) fl.style.display = mode === 'login' ? '' : 'none';
    if (fs) fs.style.display = mode === 'signup' ? '' : 'none';
    document.getElementById('mTab-login').classList.toggle('active', mode === 'login');
    document.getElementById('mTab-signup').classList.toggle('active', mode === 'signup');
    document.getElementById('mTabBar').style.transform = mode === 'login' ? 'translateX(0)' : 'translateX(100%)';
    this._clearErr();
  },

  _clearErr() {
    ['li-err','su-err'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });
  },

  _err(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  },

  _loading(btnId, txtId, loading, label) {
    const btn = document.getElementById(btnId);
    const txt = document.getElementById(txtId);
    if (btn) btn.disabled = loading;
    if (txt) txt.textContent = loading ? 'Please wait…' : label;
  },

  _success(title, msg) {
    ['mForm-login','mForm-signup'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    document.getElementById('mSuccess-title').textContent = title;
    document.getElementById('mSuccess-msg').textContent = msg;
    document.getElementById('mSuccess').classList.add('show');
  },

  _updateNav() {
    const user = NxAuth.get();
    document.querySelectorAll('[data-nx-auth-target]').forEach(el => {
      if (user) {
        el.innerHTML = `
          <span style="font-size:12px;color:var(--text-60)">Hi, ${user.name.split(' ')[0]}</span>
          <button onclick="NxAuth.clear();location.reload()" style="background:none;border:1px solid var(--border);border-radius:100px;padding:6px 14px;font-family:var(--font);font-size:11px;color:var(--text-60);cursor:pointer;letter-spacing:0.06em;">Sign Out</button>`;
      } else {
        el.innerHTML = `
          <a href="#" onclick="NxModal.open('login');return false;" style="font-size:12px;letter-spacing:0.08em;color:var(--text-60);text-decoration:none;">Sign In</a>
          <span style="color:var(--border);font-size:11px;">|</span>
          <button onclick="NxModal.open('signup')" class="nx-join" style="padding:7px 18px;border:1px solid var(--border);border-radius:100px;font-family:var(--font);font-size:12px;color:var(--text);background:none;cursor:pointer;letter-spacing:0.08em;">Join Free</button>`;
      }
    });
  },

  doLogin() {
    const email = (document.getElementById('li-email').value || '').trim();
    const pass  = document.getElementById('li-pass').value || '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this._err('li-err', 'Enter a valid email.'); return; }
    if (pass.length < 6) { this._err('li-err', 'Password must be at least 6 characters.'); return; }
    this._loading('li-btn','li-btn-txt', true, 'Sign In');
    setTimeout(() => {
      const user = { name: email.split('@')[0], email, avatar: email[0].toUpperCase() };
      NxAuth.set(user);
      this._loading('li-btn','li-btn-txt', false, 'Sign In');
      this._success(`Welcome back, ${user.name}!`, 'You\'re signed in.');
      this._updateNav();
      setTimeout(() => { this.close(); if (this.onSuccess) this.onSuccess(user); }, 1400);
    }, 800);
  },

  doSignup() {
    const first = (document.getElementById('su-first').value || '').trim();
    const email = (document.getElementById('su-email').value || '').trim();
    const pass  = document.getElementById('su-pass').value || '';
    const pass2 = document.getElementById('su-pass2').value || '';
    const terms = document.getElementById('su-terms').checked;
    if (!first) { this._err('su-err','Enter your first name.'); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this._err('su-err','Enter a valid email.'); return; }
    if (pass.length < 8) { this._err('su-err','Password must be at least 8 characters.'); return; }
    if (pass !== pass2) { this._err('su-err','Passwords do not match.'); return; }
    if (!terms) { this._err('su-err','Please agree to the Terms to continue.'); return; }
    this._loading('su-btn','su-btn-txt', true, 'Create Account');
    setTimeout(() => {
      const last = (document.getElementById('su-last').value || '').trim();
      const user = { name: `${first} ${last}`.trim(), email, avatar: first[0].toUpperCase() };
      NxAuth.set(user);
      this._loading('su-btn','su-btn-txt', false, 'Create Account');
      this._success(`Welcome to NEXUS, ${first}!`, 'Your account is ready.');
      this._updateNav();
      setTimeout(() => { this.close(); if (this.onSuccess) this.onSuccess(user); }, 1500);
    }, 900);
  },

  social(provider) {
    this._loading('li-btn','li-btn-txt', true, 'Sign In');
    setTimeout(() => {
      const user = { name: 'Demo User', email: `demo@${provider.toLowerCase()}.com`, avatar: 'D' };
      NxAuth.set(user);
      this._success(`Signed in with ${provider}!`, 'Welcome to NEXUS.');
      this._updateNav();
      setTimeout(() => { this.close(); }, 1300);
    }, 700);
  },
};

/* ════ SHARED NAV INIT ════ */
window.NxNavInit = function() {
  /* Header scroll */
  const hdr = document.querySelector('.nx-hdr');
  if (hdr) {
    window.addEventListener('scroll', () => {
      hdr.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  /* Burger */
  const burger = document.querySelector('.nx-burger');
  const menu   = document.querySelector('.nx-menu');
  if (burger && menu) {
    window.toggleNxMenu = function() {
      const open = !menu.classList.contains('open');
      menu.classList.toggle('open', open);
      burger.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', toggleNxMenu);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menu.classList.contains('open')) toggleNxMenu();
    });
  }

  /* Theme toggle */
  const tog = document.querySelector('.nx-theme-toggle');
  if (tog) tog.addEventListener('click', toggleTheme);

  /* Update nav auth */
  NxModal._updateNav();

  /* 3D card tap on mobile */
  if (window.innerWidth <= 768) {
    document.querySelectorAll('.nx-card-3d').forEach(card => {
      card.addEventListener('click', () => card.classList.toggle('tapped'));
    });
  }
};

document.addEventListener('DOMContentLoaded', NxNavInit);

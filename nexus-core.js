/* ═══════════════════════════════════════════════
   NEXUS CORE — Shared across all pages
   Theme · Auth · Page Transitions · Nav
═══════════════════════════════════════════════ */
"use strict";

/* ════ THEME ════════════════════════════════ */
const THEME_KEY = 'nexus-theme';
const getTheme = () => localStorage.getItem(THEME_KEY) || 'dark';
const applyTheme = t => {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem(THEME_KEY, t);
  document.querySelectorAll('.theme-toggle').forEach(el => {
    el.textContent = t === 'dark' ? '🌙' : '☀️';
  });
};
window.toggleTheme = () => applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
applyTheme(getTheme());

/* ════ AUTH STATE ═══════════════════════════ */
// Simple localStorage-based auth (replace with real backend)
const Auth = {
  KEY: 'nexus_user',

  getUser() {
    try { return JSON.parse(localStorage.getItem(this.KEY)); } catch { return null; }
  },
  isLoggedIn() { return !!this.getUser(); },

  login(name, email, password) {
    // In production: replace with real API call
    const user = { name, email, avatar: name[0].toUpperCase(), joined: new Date().toISOString() };
    localStorage.setItem(this.KEY, JSON.stringify(user));
    return user;
  },

  signup(name, email, password) {
    const user = { name, email, avatar: name[0].toUpperCase(), joined: new Date().toISOString() };
    localStorage.setItem(this.KEY, JSON.stringify(user));
    return user;
  },

  logout() {
    localStorage.removeItem(this.KEY);
    NexusNav.updateNavAuth();
    navigateTo('index.html');
  }
};
window.Auth = Auth;

/* ════ PAGE TRANSITIONS ═════════════════════ */
const PageTransition = {
  curtain: null,

  init() {
    // Create curtain element
    if (!document.getElementById('nx-curtain')) {
      const c = document.createElement('div');
      c.id = 'nx-curtain';
      c.innerHTML = `
        <div class="nx-curtain-inner">
          <div class="nx-curtain-logo">
            <img src="logo.png" alt="NEXUS" />
            <span>NEXUS</span>
          </div>
          <div class="nx-curtain-bar"><div class="nx-curtain-fill"></div></div>
        </div>`;
      document.body.appendChild(c);
      this.curtain = c;
    }
    // Reveal page on load
    this.revealPage();
  },

  revealPage() {
    document.body.classList.add('nx-page-ready');
    const curtain = document.getElementById('nx-curtain');
    if (curtain) {
      curtain.classList.add('nx-curtain-out');
      setTimeout(() => curtain.classList.add('nx-curtain-hidden'), 700);
    }
  },

  leavePage(cb) {
    const curtain = document.getElementById('nx-curtain');
    if (!curtain) { cb(); return; }
    curtain.classList.remove('nx-curtain-hidden', 'nx-curtain-out');
    curtain.classList.add('nx-curtain-in');
    setTimeout(cb, 500);
  }
};

/* ════ NAVIGATE WITH TRANSITION ════════════ */
window.navigateTo = function(url, requireAuth) {
  if (requireAuth && !Auth.isLoggedIn()) {
    AuthModal.open('login', () => navigateTo(url));
    return;
  }
  PageTransition.leavePage(() => { window.location.href = url; });
};

// Intercept all internal links
function interceptLinks() {
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('http') || a.dataset.noTransition) return;
    a.addEventListener('click', e => {
      e.preventDefault();
      const isProtected = a.dataset.protected === 'true' || href === 'marketplace.html';
      navigateTo(href, isProtected);
    });
  });
}

/* ════ AUTH MODAL ═══════════════════════════ */
const AuthModal = {
  overlay: null,
  mode: 'login', // 'login' | 'signup'
  onSuccess: null,

  init() {
    if (document.getElementById('nx-auth-modal')) return;
    const el = document.createElement('div');
    el.id = 'nx-auth-modal';
    el.innerHTML = `
      <div class="nx-auth-box" id="nxAuthBox">
        <button class="nx-auth-close" onclick="AuthModal.close()">✕</button>

        <!-- Logo -->
        <div class="nx-auth-brand">
          <img src="logo.png" alt="NEXUS" class="nx-auth-logo-img"/>
          <span class="nx-auth-brand-name">NEXUS</span>
        </div>

        <!-- Tabs -->
        <div class="nx-auth-tabs">
          <button class="nx-auth-tab" id="tabLogin" onclick="AuthModal.switchMode('login')">Sign In</button>
          <button class="nx-auth-tab" id="tabSignup" onclick="AuthModal.switchMode('signup')">Create Account</button>
          <div class="nx-auth-tab-bar" id="authTabBar"></div>
        </div>

        <!-- Login form -->
        <div class="nx-auth-form" id="formLogin">
          <div class="nx-auth-welcome">
            <h2>Welcome back</h2>
            <p>Sign in to access your account and the marketplace.</p>
          </div>
          <div class="nx-field-group">
            <label>Email address</label>
            <div class="nx-field-wrap">
              <svg class="nx-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
              <input type="email" id="loginEmail" placeholder="you@example.com" autocomplete="email"/>
            </div>
          </div>
          <div class="nx-field-group">
            <label>Password <a href="#" style="float:right;color:var(--teal-light);font-size:12px" onclick="toast('Password reset coming soon')">Forgot?</a></label>
            <div class="nx-field-wrap">
              <svg class="nx-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input type="password" id="loginPass" placeholder="••••••••" autocomplete="current-password"/>
              <button class="nx-pass-toggle" onclick="togglePass('loginPass',this)" type="button">👁</button>
            </div>
          </div>
          <div class="nx-field-group" style="flex-direction:row;align-items:center;gap:10px">
            <input type="checkbox" id="rememberMe" style="accent-color:var(--teal);width:15px;height:15px;cursor:pointer"/>
            <label for="rememberMe" style="font-size:13px;color:var(--text-60);cursor:pointer;margin:0">Keep me signed in</label>
          </div>
          <div class="nx-auth-error" id="loginError"></div>
          <button class="nx-auth-submit" onclick="AuthModal.doLogin()" id="loginBtn">
            <span>Sign In</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <div class="nx-auth-divider"><span>or continue with</span></div>
          <div class="nx-social-btns">
            <button class="nx-social-btn" onclick="AuthModal.socialLogin('Google')">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
            <button class="nx-social-btn" onclick="AuthModal.socialLogin('Apple')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"/><path d="M15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/></svg>
              Apple
            </button>
          </div>
        </div>

        <!-- Signup form -->
        <div class="nx-auth-form" id="formSignup" style="display:none">
          <div class="nx-auth-welcome">
            <h2>Join NEXUS</h2>
            <p>Create your free account and start exploring.</p>
          </div>
          <div class="nx-form-row">
            <div class="nx-field-group">
              <label>First Name</label>
              <div class="nx-field-wrap">
                <svg class="nx-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input type="text" id="signupFirst" placeholder="Aisha" autocomplete="given-name"/>
              </div>
            </div>
            <div class="nx-field-group">
              <label>Last Name</label>
              <div class="nx-field-wrap">
                <input type="text" id="signupLast" placeholder="Kamara" autocomplete="family-name"/>
              </div>
            </div>
          </div>
          <div class="nx-field-group">
            <label>Email address</label>
            <div class="nx-field-wrap">
              <svg class="nx-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
              <input type="email" id="signupEmail" placeholder="you@example.com" autocomplete="email"/>
            </div>
          </div>
          <div class="nx-field-group">
            <label>Password</label>
            <div class="nx-field-wrap">
              <svg class="nx-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input type="password" id="signupPass" placeholder="Min 8 characters" autocomplete="new-password" oninput="checkStrength(this.value)"/>
              <button class="nx-pass-toggle" onclick="togglePass('signupPass',this)" type="button">👁</button>
            </div>
            <div class="nx-strength-bar"><div class="nx-strength-fill" id="strengthFill"></div></div>
            <span class="nx-strength-label" id="strengthLabel"></span>
          </div>
          <div class="nx-field-group">
            <label>Confirm Password</label>
            <div class="nx-field-wrap">
              <svg class="nx-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input type="password" id="signupPassC" placeholder="Repeat password" autocomplete="new-password"/>
            </div>
          </div>
          <div class="nx-field-group" style="flex-direction:row;align-items:flex-start;gap:10px">
            <input type="checkbox" id="agreeTerms" style="accent-color:var(--teal);width:15px;height:15px;cursor:pointer;margin-top:2px;flex-shrink:0"/>
            <label for="agreeTerms" style="font-size:13px;color:var(--text-60);cursor:pointer;margin:0;line-height:1.6">I agree to the <a href="terms.html" style="color:var(--teal-light)" onclick="AuthModal.close()">Terms of Service</a> and <a href="privacy.html" style="color:var(--teal-light)" onclick="AuthModal.close()">Privacy Policy</a></label>
          </div>
          <div class="nx-auth-error" id="signupError"></div>
          <button class="nx-auth-submit" onclick="AuthModal.doSignup()" id="signupBtn">
            <span>Create Account</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <div class="nx-auth-divider"><span>or sign up with</span></div>
          <div class="nx-social-btns">
            <button class="nx-social-btn" onclick="AuthModal.socialLogin('Google')">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
            <button class="nx-social-btn" onclick="AuthModal.socialLogin('Apple')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"/><path d="M15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/></svg>
              Apple
            </button>
          </div>
        </div>

        <!-- Success state -->
        <div class="nx-auth-success" id="authSuccess" style="display:none">
          <div class="nx-success-icon">✅</div>
          <h3 id="successTitle">Welcome back!</h3>
          <p id="successMsg">You're signed in. Redirecting…</p>
        </div>
      </div>`;
    document.body.appendChild(el);
    this.overlay = el;

    // Close on backdrop click
    el.addEventListener('click', e => { if (e.target === el) this.close(); });
    // Enter key submits
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        if (this.mode === 'login') this.doLogin();
        else this.doSignup();
      }
    });
  },

  open(mode = 'login', onSuccess = null) {
    this.init();
    this.onSuccess = onSuccess;
    this.switchMode(mode);
    this.overlay.classList.add('nx-auth-open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const input = document.getElementById(mode === 'login' ? 'loginEmail' : 'signupFirst');
      if (input) input.focus();
    }, 300);
  },

  close() {
    if (!this.overlay) return;
    this.overlay.classList.remove('nx-auth-open');
    document.body.style.overflow = '';
    document.getElementById('authSuccess').style.display = 'none';
    document.getElementById('formLogin').style.display = '';
    document.getElementById('formSignup').style.display = 'none';
    this.clearErrors();
  },

  switchMode(mode) {
    this.init();
    this.mode = mode;
    document.getElementById('formLogin').style.display = mode === 'login' ? '' : 'none';
    document.getElementById('formSignup').style.display = mode === 'signup' ? '' : 'none';
    document.getElementById('authSuccess').style.display = 'none';
    document.getElementById('tabLogin').classList.toggle('active', mode === 'login');
    document.getElementById('tabSignup').classList.toggle('active', mode === 'signup');
    const bar = document.getElementById('authTabBar');
    bar.style.transform = mode === 'login' ? 'translateX(0)' : 'translateX(100%)';
    this.clearErrors();
  },

  clearErrors() {
    ['loginError','signupError'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
  },

  setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.querySelector('span').textContent = loading ? 'Please wait…' : (btnId === 'loginBtn' ? 'Sign In' : 'Create Account');
  },

  showError(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.style.animation = 'none'; el.offsetHeight; el.style.animation = ''; }
  },

  showSuccess(title, msg) {
    document.getElementById('formLogin').style.display = 'none';
    document.getElementById('formSignup').style.display = 'none';
    const s = document.getElementById('authSuccess');
    document.getElementById('successTitle').textContent = title;
    document.getElementById('successMsg').textContent = msg;
    s.style.display = 'flex';
  },

  doLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;
    if (!email) { this.showError('loginError', 'Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this.showError('loginError', 'Please enter a valid email address.'); return; }
    if (!pass) { this.showError('loginError', 'Please enter your password.'); return; }
    if (pass.length < 6) { this.showError('loginError', 'Password must be at least 6 characters.'); return; }

    this.setLoading('loginBtn', true);
    setTimeout(() => {
      const user = Auth.login(document.getElementById('loginEmail').value.trim().split('@')[0], email, pass);
      this.setLoading('loginBtn', false);
      this.showSuccess(`Welcome back, ${user.name}! 👋`, 'You\'re signed in successfully.');
      NexusNav.updateNavAuth();
      setTimeout(() => {
        this.close();
        if (this.onSuccess) this.onSuccess(user);
      }, 1400);
    }, 900);
  },

  doSignup() {
    const first = document.getElementById('signupFirst').value.trim();
    const last = document.getElementById('signupLast').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const pass = document.getElementById('signupPass').value;
    const passC = document.getElementById('signupPassC').value;
    const agreed = document.getElementById('agreeTerms').checked;

    if (!first) { this.showError('signupError', 'Please enter your first name.'); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this.showError('signupError', 'Please enter a valid email address.'); return; }
    if (pass.length < 8) { this.showError('signupError', 'Password must be at least 8 characters.'); return; }
    if (pass !== passC) { this.showError('signupError', 'Passwords do not match.'); return; }
    if (!agreed) { this.showError('signupError', 'Please agree to the Terms of Service to continue.'); return; }

    this.setLoading('signupBtn', true);
    setTimeout(() => {
      const user = Auth.signup(`${first} ${last}`.trim(), email, pass);
      this.setLoading('signupBtn', false);
      this.showSuccess(`Welcome to NEXUS, ${first}! 🎉`, 'Your account is ready. Explore the marketplace.');
      NexusNav.updateNavAuth();
      setTimeout(() => {
        this.close();
        if (this.onSuccess) this.onSuccess(user);
      }, 1500);
    }, 1000);
  },

  socialLogin(provider) {
    this.setLoading('loginBtn', true);
    setTimeout(() => {
      const user = Auth.login('Demo User', `demo@${provider.toLowerCase()}.com`, 'social');
      NexusNav.updateNavAuth();
      this.showSuccess(`Signed in with ${provider}! 👋`, 'Welcome to NEXUS.');
      setTimeout(() => {
        this.close();
        if (this.onSuccess) this.onSuccess(user);
      }, 1400);
    }, 800);
  }
};
window.AuthModal = AuthModal;

/* ── Password toggle ── */
window.togglePass = (id, btn) => {
  const inp = document.getElementById(id);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁' : '🙈';
};

/* ── Password strength ── */
window.checkStrength = pass => {
  const fill = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');
  if (!fill) return;
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  const levels = [
    { pct: '15%',  color: '#ef4444', text: 'Too short' },
    { pct: '35%',  color: '#f97316', text: 'Weak' },
    { pct: '60%',  color: '#eab308', text: 'Fair' },
    { pct: '80%',  color: '#3ab26e', text: 'Good' },
    { pct: '100%', color: '#6dc44b', text: 'Strong ✓' },
  ];
  const l = pass.length === 0 ? { pct: '0%', color: 'transparent', text: '' } : levels[Math.min(score, 4)];
  fill.style.width = l.pct;
  fill.style.background = l.color;
  label.textContent = l.text;
  label.style.color = l.color;
};

/* ════ NAV AUTH STATE ═══════════════════════ */
const NexusNav = {
  updateNavAuth() {
    const user = Auth.getUser();
    // Update all nav-actions on the page
    document.querySelectorAll('.nav-actions-auth').forEach(el => {
      if (user) {
        el.innerHTML = `
          <div class="nx-user-menu-wrap">
            <button class="nx-user-pill" onclick="NexusNav.toggleUserMenu()">
              <span class="nx-user-avatar">${user.avatar}</span>
              <span class="nx-user-name">${user.name.split(' ')[0]}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <div class="nx-user-dropdown" id="userDropdown">
              <div class="nx-user-dd-header">
                <div class="nx-user-dd-avatar">${user.avatar}</div>
                <div><div style="font-weight:600;font-size:14px;color:var(--text)">${user.name}</div><div style="font-size:12px;color:var(--text-30)">${user.email}</div></div>
              </div>
              <a href="marketplace.html" class="nx-user-dd-item" onclick="navigateTo('marketplace.html')">🛒 Marketplace</a>
              <a href="contact.html" class="nx-user-dd-item" onclick="navigateTo('contact.html')">⚙️ Settings</a>
              <div class="nx-user-dd-divider"></div>
              <button class="nx-user-dd-item nx-user-dd-logout" onclick="Auth.logout()">Sign Out</button>
            </div>
          </div>`;
      } else {
        el.innerHTML = `
          <button class="btn-ghost" onclick="AuthModal.open('login')">Sign In</button>
          <button class="btn-primary" onclick="AuthModal.open('signup')">Join Free</button>`;
      }
    });
  },

  toggleUserMenu() {
    const dd = document.getElementById('userDropdown');
    if (dd) dd.classList.toggle('open');
  },

  init() {
    this.updateNavAuth();
    // Close dropdown on outside click
    document.addEventListener('click', e => {
      if (!e.target.closest('.nx-user-menu-wrap')) {
        document.querySelectorAll('.nx-user-dropdown').forEach(d => d.classList.remove('open'));
      }
    });
  }
};
window.NexusNav = NexusNav;

/* ════ NAV SCROLL + BURGER ══════════════════ */
window.addEventListener('scroll', () => {
  const nav = document.getElementById('mainNav');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

document.addEventListener('DOMContentLoaded', () => {
  // Burger
  const burger = document.getElementById('navBurger');
  const mMenu = document.getElementById('mobileMenu');
  if (burger && mMenu) {
    burger.addEventListener('click', () => {
      const open = mMenu.classList.toggle('open');
      document.body.style.overflow = open ? 'hidden' : '';
      burger.querySelectorAll('span').forEach((s, i) => {
        s.style.transform = open ? (i === 0 ? 'rotate(45deg) translate(5px,5px)' : i === 2 ? 'rotate(-45deg) translate(5px,-5px)' : '') : '';
        if (i === 1) s.style.opacity = open ? '0' : '';
      });
    });
    mMenu.querySelectorAll('.mobile-link').forEach(l => {
      l.addEventListener('click', () => { mMenu.classList.remove('open'); document.body.style.overflow = ''; });
    });
  }

  // Mobile theme toggle visibility
  const mobToggle = document.getElementById('themeToggleMob');
  if (mobToggle) {
    const sync = () => mobToggle.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
    sync(); window.addEventListener('resize', sync);
  }

  // Apply theme icons
  applyTheme(getTheme());

  // Init nav auth state
  NexusNav.init();

  // Init page transitions
  PageTransition.init();

  // Intercept links after short delay (allow page JS to run first)
  setTimeout(interceptLinks, 100);
});

/* ════ TOAST ════════════════════════════════ */
window.toast = function(msg, type) {
  let el = document.getElementById('nx-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'nx-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'nx-toast nx-toast-show' + (type ? ' nx-toast-' + type : '');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.className = 'nx-toast', 2800);
};

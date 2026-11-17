/**
 * CivicFix — Layout Injector (v3.5)
 * Injects header, premium footer, favicon, and handles mobile menu + logout.
 */

// ============================================================
// 1. FORCE GLOBAL FAVICON
// ============================================================
(function forceFavicon() {
  if (typeof document === 'undefined' || !document.head) return;

  // Remove any existing favicon links to prevent duplicates
  document.querySelectorAll(
    'link[rel="icon"], link[rel="shortcut icon"], link[rel="alternate icon"]'
  ).forEach((el) => el.remove());

  // Inject SVG favicon
  const svg = document.createElement('link');
  svg.rel = 'icon';
  svg.type = 'image/svg+xml';
  svg.href = '/favicon.svg';
  document.head.appendChild(svg);

  // Inject ICO fallback
  const ico = document.createElement('link');
  ico.rel = 'alternate icon';
  ico.href = '/favicon.ico';
  document.head.appendChild(ico);
})();

// ============================================================
// 2. HEADER & PREMIUM FOOTER
// ============================================================
(function () {
  const user = window.auth ? auth.getUser() : null;
  const isLoggedIn = Boolean(user);
  const currentPath = window.location.pathname;

  function activeIf(href) {
    const here = currentPath === '/' ? '/index.html' : currentPath;
    return here === href ? 'active' : '';
  }

  // ----- Header -----
  const header = document.getElementById('site-header');
  if (header) {
    const initials = user && user.name
      ? user.name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
      : '?';

    header.className = 'site-header';
    header.innerHTML = `
      <div class="header-inner">
        <a href="/" class="brand">
          <span class="brand-icon">🏛️</span>
          <span>CivicFix</span>
        </a>
        <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Toggle menu">☰</button>
        <nav class="site-nav" id="site-nav">
          <a href="/" class="${activeIf('/index.html')}">Home</a>
          <a href="/pages/issues.html" class="${activeIf('/pages/issues.html')}">Issues</a>
          ${isLoggedIn ? `
            <a href="/pages/dashboard.html" class="${activeIf('/pages/dashboard.html')}">Dashboard</a>
            <a href="/pages/report.html" class="${activeIf('/pages/report.html')}">Report</a>
            <a href="/pages/notifications.html" class="${activeIf('/pages/notifications.html')}" id="nav-notifications">
              Notifications <span id="notif-badge" class="hidden" style="background: var(--danger); color: white; padding: 0 6px; border-radius: 999px; font-size: 0.75rem; margin-left: 4px;"></span>
            </a>
            <div class="nav-user">
              <a href="/pages/profile.html" class="avatar" title="${escapeHtml(user.name)}">${initials}</a>
              <button class="btn btn-ghost btn-sm" id="logout-btn">Logout</button>
            </div>
          ` : `
            <a href="/pages/login.html" class="${activeIf('/pages/login.html')}">Login</a>
            <a href="/pages/register.html" class="btn btn-primary btn-sm" style="text-decoration:none;">Sign Up</a>
          `}
        </nav>
      </div>`;
  }

  // ----- Footer (Premium Grid for non-homepage pages) -----
  const footer = document.getElementById('site-footer');
  if (footer) {
    footer.className = 'site-footer';
    footer.innerHTML = `
      <div class="container" style="max-width: 1200px; margin: 0 auto;">
        <div style="display: flex; flex-wrap: wrap; gap: 4rem; justify-content: space-between; margin-bottom: 3rem;">
          
          <!-- Brand Column -->
          <div style="flex: 1; min-width: 250px; max-width: 350px; text-align: left;">
            <a href="/" style="display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none; color: var(--text-main); font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem;">
              <span style="font-size: 1.75rem;">🏛️</span> CivicFix
            </a>
            <p style="color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; margin: 0;">
              Bridging residents and civic authorities with a transparent, accountable reporting platform.
            </p>
          </div>

          <!-- Links Columns -->
          <div style="display: flex; flex-wrap: wrap; gap: 4rem;">
            <!-- Platform -->
            <div style="display: flex; flex-direction: column; gap: 0.75rem; text-align: left;">
              <h4 style="font-size: 0.875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-main); margin: 0; margin-bottom: 0.5rem;">Platform</h4>
              <a href="/pages/issues.html" style="color: var(--text-muted); text-decoration: none; font-size: 0.9375rem;">Browse Issues</a>
              <a href="/pages/report.html" style="color: var(--text-muted); text-decoration: none; font-size: 0.9375rem;">Report an Issue</a>
              <a href="/pages/dashboard.html" style="color: var(--text-muted); text-decoration: none; font-size: 0.9375rem;">Dashboard</a>
            </div>

            <!-- Account -->
            <div style="display: flex; flex-direction: column; gap: 0.75rem; text-align: left;">
              <h4 style="font-size: 0.875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-main); margin: 0; margin-bottom: 0.5rem;">Account</h4>
              <a href="/pages/login.html" style="color: var(--text-muted); text-decoration: none; font-size: 0.9375rem;">Log In</a>
              <a href="/pages/register.html" style="color: var(--text-muted); text-decoration: none; font-size: 0.9375rem;">Create Account</a>
              <a href="/pages/profile.html" style="color: var(--text-muted); text-decoration: none; font-size: 0.9375rem;">My Profile</a>
            </div>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; padding-top: 2rem; border-top: 1px solid var(--border);">
          <p style="margin: 0; color: var(--text-muted); font-size: 0.875rem;">&copy; ${new Date().getFullYear()} CivicFix. All rights reserved.</p>
          <div style="display: flex; gap: 1rem; align-items: center; color: var(--text-muted); font-size: 0.875rem;">
            <a href="#" style="color: var(--text-muted); text-decoration: none;">Privacy Policy</a>
            <span>&middot;</span>
            <a href="#" style="color: var(--text-muted); text-decoration: none;">Terms of Service</a>
          </div>
        </div>
      </div>`;
  }

  // ----- Mobile menu -----
  const menuBtn = document.getElementById('mobile-menu-btn');
  const nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => nav.classList.toggle('open'));
  }

  // ----- Logout -----
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      logoutBtn.textContent = 'Logging out…';
      logoutBtn.disabled = true;
      try {
        await auth.logout();
        window.location.href = '/pages/login.html';
      } catch (err) {
        localStorage.clear();
        window.location.href = '/pages/login.html';
      }
    });
  }

  // ----- Notification badge -----
  if (isLoggedIn) {
    api.notifications.unreadCount()
      .then((res) => {
        const count = res.data.count;
        if (count > 0) {
          const badge = document.getElementById('notif-badge');
          if (badge) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.classList.remove('hidden');
          }
        }
      })
      .catch(() => { /* silent */ });
  }
})();
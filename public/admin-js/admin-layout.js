/**
 * CivicFix — Admin Layout (v3.4)
 * Injects the sidebar + admin header, handles role guard, mobile menu, and logout.
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

  const svg = document.createElement('link');
  svg.rel = 'icon';
  svg.type = 'image/svg+xml';
  svg.href = '/favicon.svg';
  document.head.appendChild(svg);

  const ico = document.createElement('link');
  ico.rel = 'alternate icon';
  ico.href = '/favicon.ico';
  document.head.appendChild(ico);
})();

// ============================================================
// 2. SIDEBAR, HEADER & LOGOUT
// ============================================================
(function () {
  // Role guard
  if (typeof requireAdmin === 'function' && requireAdmin()) return;

  const user = auth.getUser() || {};
  const role = user.role === 'admin' ? 'Admin' : 'Moderator';

  function activeIf(path) {
    return window.location.pathname === path ? 'active' : '';
  }

  // ----- SIDEBAR -----
  const sidebar = document.getElementById('admin-sidebar');
  if (sidebar) {
    sidebar.className = 'admin-sidebar';
    sidebar.innerHTML = `
      <div class="admin-brand">
        <div>
          🏛️ CivicFix
          <small>${role} Console</small>
        </div>
      </div>
      <nav class="admin-nav">
        <a href="/admin/index.html" class="${activeIf('/admin/index.html')}">📊 Dashboard</a>

        <div class="nav-section">Operations</div>
        <a href="/admin/issues.html" class="${activeIf('/admin/issues.html')}">📋 Issues</a>
        ${user.role === 'admin' ? `<a href="/admin/users.html" class="${activeIf('/admin/users.html')}">👥 Users</a>` : ''}
        ${user.role === 'admin' ? `<a href="/admin/categories.html" class="${activeIf('/admin/categories.html')}">📂 Categories</a>` : ''}

        <div class="nav-section">Insights</div>
        <a href="/admin/analytics.html" class="${activeIf('/admin/analytics.html')}">📈 Analytics</a>
        ${user.role === 'admin' ? `<a href="/admin/audit-logs.html" class="${activeIf('/admin/audit-logs.html')}">🔍 Audit Logs</a>` : ''}

        <div class="nav-section">Public</div>
        <a href="/pages/issues.html">🌍 View Public Site</a>
      </nav>
      <div class="admin-sidebar-footer">
        <div style="color: #cbd5e1; margin-bottom: 0.5rem; font-weight: 500;">${escapeHtml(user.name || '')}</div>
        <a href="#" id="admin-logout">Logout →</a>
      </div>`;
  }

  // ----- HEADER -----
  const header = document.getElementById('admin-header');
  if (header) {
    const title = header.dataset.title || 'Admin';
    header.className = 'admin-header';
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <button class="admin-mobile-toggle" id="admin-menu-toggle" aria-label="Toggle menu">☰</button>
        <h1>${escapeHtml(title)}</h1>
      </div>
      <div class="admin-user">
        <span class="badge badge-priority-${user.role === 'admin' ? 'critical' : 'high'}">${role}</span>
        <span>${escapeHtml(user.email || '')}</span>
      </div>`;
  }

  // ----- MOBILE BACKDROP -----
  let backdrop = document.querySelector('.admin-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'admin-backdrop';
    document.body.appendChild(backdrop);
  }

  // Mobile toggle
  const toggle = document.getElementById('admin-menu-toggle');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      backdrop.classList.toggle('show');
    });
    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('open');
      backdrop.classList.remove('show');
    });
  }

  // ----- LOGOUT (Fixed) -----
  const logoutBtn = document.getElementById('admin-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      // Immediate UI feedback
      logoutBtn.textContent = 'Logging out…';
      logoutBtn.style.pointerEvents = 'none';
      logoutBtn.style.opacity = '0.5';

      try {
        await auth.logout(); // Clears localStorage regardless of server response
        window.location.href = '/pages/login.html';
      } catch (err) {
        // Fallback: force clear and redirect
        localStorage.clear();
        window.location.href = '/pages/login.html';
      }
    });
  }
})();
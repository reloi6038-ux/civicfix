/** Show a toast. Types: success, error, info, warning. */
function toast(message, type = 'info', duration = 4000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

/** Format an ISO date as "Jan 15, 2026" or "Jan 15, 2026 at 3:42 PM". */
function formatDate(iso, withTime = false) {
  if (!iso) return '—';
  const d = new Date(iso);
  const opts = { year: 'numeric', month: 'short', day: 'numeric' };
  if (withTime) { opts.hour = 'numeric'; opts.minute = '2-digit'; }
  return d.toLocaleDateString('en-US', opts);
}

/** "3 hours ago", "2 days ago" */
function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

/** Convert "UNDER REVIEW" → "Under Review" */
function titleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Convert status to CSS class: "UNDER REVIEW" → "under-review" */
function statusClass(status) {
  return status.toLowerCase().replace(/\s+/g, '-');
}

/** Escape user-generated text before injecting into innerHTML. */
function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Build a status badge element string. */
function badgeHtml(status) {
  return `<span class="badge badge-${statusClass(status)}">${escapeHtml(status)}</span>`;
}

/** Build a priority badge element string. */
function priorityBadgeHtml(priority) {
  if (!priority) return '';
  return `<span class="badge badge-priority-${priority.toLowerCase()}">${escapeHtml(priority)}</span>`;
}

/** Show / hide a loading block. */
function showLoading(container, message = 'Loading…') {
  if (typeof container === 'string') container = document.getElementById(container);
  if (!container) return;
  container.innerHTML = `<div class="loading-block"><span class="spinner"></span>${escapeHtml(message)}</div>`;
}

function showError(container, message, retryFn = null) {
  if (typeof container === 'string') container = document.getElementById(container);
  if (!container) return;
  container.innerHTML = `
    <div class="error-state">
      <h3>Something went wrong</h3>
      <p>${escapeHtml(message)}</p>
      ${retryFn ? '<button class="btn btn-secondary mt-2" id="retry-btn">Try Again</button>' : ''}
    </div>`;
  if (retryFn) {
    const btn = document.getElementById('retry-btn');
    if (btn) btn.addEventListener('click', retryFn);
  }
}

function showEmpty(container, title = 'Nothing here yet', message = '', cta = '') {
  if (typeof container === 'string') container = document.getElementById(container);
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">📭</div>
      <h3>${escapeHtml(title)}</h3>
      ${message ? `<p>${escapeHtml(message)}</p>` : ''}
      ${cta}
    </div>`;
}

/** Redirect to login if not authenticated. Returns true if redirected. */
function requireAuth() {
  if (!window.auth || !auth.isLoggedIn()) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/pages/login.html?next=${next}`;
    return true;
  }
  return false;
}

/** Format a form's FormData into a plain object (for debugging). */
function formToObject(form) {
  const out = {};
  new FormData(form).forEach((v, k) => { out[k] = v; });
  return out;
}

window.toast = toast;
window.formatDate = formatDate;
window.timeAgo = timeAgo;
window.titleCase = titleCase;
window.statusClass = statusClass;
window.escapeHtml = escapeHtml;
window.badgeHtml = badgeHtml;
window.priorityBadgeHtml = priorityBadgeHtml;
window.showLoading = showLoading;
window.showError = showError;
window.showEmpty = showEmpty;
window.requireAuth = requireAuth;
window.formToObject = formToObject;
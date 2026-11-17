/**
 * Admin API wrapper + role guard.
 * Load order per admin page:
 *   /js/api.js → /js/utils.js → /admin-js/admin-api.js → /admin-js/admin-layout.js → page.js
 */

const adminApi = {
  // ----- Dashboard -----
  dashboard: () => api.get('/admin/dashboard'),

  // ----- Users -----
  users: {
    list: (params = {}) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
      return api.get(`/admin/users${qs ? `?${qs}` : ''}`);
    },
    get: (id) => api.get(`/admin/users/${id}`),
    setRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
    setStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive })
  },

  // ----- Issues (admin) -----
  issues: {
    list: (params = {}) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
      return api.get(`/admin/issues${qs ? `?${qs}` : ''}`);
    },
    remove: (id) => api.delete(`/admin/issues/${id}`),
    assign: (id, moderatorId) => api.patch(`/admin/issues/${id}/assign`, { moderatorId })
  },

  // ----- Moderator tools -----
  moderator: {
    list: (params = {}) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
      return api.get(`/moderator/issues${qs ? `?${qs}` : ''}`);
    },
    verify: (id, note) => api.post(`/moderator/issues/${id}/verify`, { note }),
    reject: (id, reason) => api.post(`/moderator/issues/${id}/reject`, { reason }),
    duplicate: (id, duplicateOf) => api.post(`/moderator/issues/${id}/duplicate`, { duplicateOf }),
    setPriority: (id, priority) => api.patch(`/moderator/issues/${id}/priority`, { priority }),
    officialResponse: (id, message) => api.post(`/moderator/issues/${id}/official-response`, { message })
  },

  // ----- Categories (admin) -----
  categories: {
    list: () => api.get('/categories'),
    create: (payload) => api.post('/categories', payload),
    update: (id, payload) => api.put(`/categories/${id}`, payload),
    remove: (id) => api.delete(`/categories/${id}`)
  },

  // ----- Analytics -----
  analytics: () => api.get('/admin/analytics'),

  // ----- Audit logs -----
  auditLogs: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
    return api.get(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
  }
};

/**
 * Guard: redirect non-admin/moderator users.
 * Call at the top of every admin page's script.
 */
function requireAdmin() {
  if (requireAuth()) return true;
  const user = auth.getUser();
  if (!user || !['admin', 'moderator'].includes(user.role)) {
    toast('You do not have permission to access the admin area', 'error');
    setTimeout(() => (window.location.href = '/pages/dashboard.html'), 800);
    return true;
  }
  return false;
}

/** Only admins (not moderators) can call this for the guard. */
function requireSuperAdmin() {
  if (requireAdmin()) return true;
  if (auth.getUser().role !== 'admin') {
    toast('Admin access required', 'error');
    setTimeout(() => (window.location.href = '/admin/index.html'), 800);
    return true;
  }
  return false;
}

window.adminApi = adminApi;
window.requireAdmin = requireAdmin;
window.requireSuperAdmin = requireSuperAdmin;
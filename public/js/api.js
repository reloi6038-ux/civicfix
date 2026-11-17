/**
 * CivicFix API client.
 * Uses relative URLs (e.g., /api/issues) so the same code works
 * locally (http://localhost:5000) and on Render.
 */

const API_BASE = '/api';

const auth = {
  getToken() { return localStorage.getItem('token'); },
  setToken(token) { localStorage.setItem('token', token); },
  clear() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getUser() {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  },
  setUser(user) { localStorage.setItem('user', JSON.stringify(user)); },
  isLoggedIn() { return Boolean(this.getToken()); },
  hasRole(...roles) {
    const u = this.getUser();
    return u && roles.includes(u.role);
  }
};

async function request(path, options = {}) {
  const token = auth.getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Only set JSON content-type if body is NOT FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let data;
  try { data = await res.json(); }
  catch { data = { success: false, message: `Unexpected server response (${res.status})` }; }

  if (!res.ok) {
    const err = new Error(data.message || `Request failed with status ${res.status}`);
    err.status = res.status;
    err.errors = data.errors || [];

    // Auto-logout on 401 Unauthorized (expired or invalid token)
    // Except if we're already on the login page, or trying to log in / reset password
    if (
      res.status === 401 &&
      !path.startsWith('/auth/login') &&
      !path.startsWith('/auth/register') &&
      !path.startsWith('/auth/forgot-password') &&
      !path.startsWith('/auth/reset-password') &&
      window.location.pathname !== '/pages/login.html'
    ) {
      auth.clear();
      // Redirect to login, and pass the current URL as the "next" param
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/pages/login.html?next=${next}`;
      
      // Return a pending promise so the caller's `catch` block doesn't execute 
      // while the browser is navigating away.
      return new Promise(() => {});
    }

    throw err;
  }
  return data;
}

const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body)
  }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined
  }),
  delete: (path) => request(path, { method: 'DELETE' }),

  // ----- Auth -----
  auth: {
    async register(payload) {
      const data = await api.post('/auth/register', payload);
      auth.setToken(data.data.token);
      auth.setUser(data.data.user);
      return data.data.user;
    },
    async login(payload) {
      const data = await api.post('/auth/login', payload);
      auth.setToken(data.data.token);
      auth.setUser(data.data.user);
      return data.data.user;
    },
    async refreshMe() {
      const data = await api.get('/auth/me');
      auth.setUser({ ...auth.getUser(), ...data.data });
      return data.data;
    },
    async logout() {
      try { 
        // Tell the server (though server-side logout is just a formality with JWTs)
        await api.post('/auth/logout', {}); 
      } catch (_) {
        // Ignore network errors or 401s during logout
      } finally {
        // CRITICAL: Always clear the local storage so the user is logged out
        // on the frontend regardless of what the server says.
        auth.clear();
      }
    }
  },

  // ----- Public data -----
  dashboard: {
    stats: () => api.get('/issues/dashboard/stats')
  },
  categories: {
    list: () => api.get('/categories')
  },
  issues: {
    list: (params = {}) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
      return api.get(`/issues${qs ? `?${qs}` : ''}`);
    },
    get: (id) => api.get(`/issues/${id}`),
    create: (formData) => api.post('/issues', formData),
    follow: (id) => api.post(`/issues/${id}/follow`, {}),
    unfollow: (id) => api.delete(`/issues/${id}/follow`),
    followed: (params = {}) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
      return api.get(`/issues/followed${qs ? `?${qs}` : ''}`);
    },
    comments: (id) => api.get(`/issues/${id}/comments`),
    addComment: (id, body) => api.post(`/issues/${id}/comments`, { body }),
    deleteComment: (commentId) => api.delete(`/comments/${commentId}`)
  },
  users: {
    profile: () => api.get('/users/profile'),
    updateProfile: (payload) => api.put('/users/profile', payload),
    changePassword: (payload) => api.put('/users/change-password', payload),
    myIssues: () => api.get('/users/my-issues')
  },
  notifications: {
    list: (params = {}) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
      return api.get(`/notifications${qs ? `?${qs}` : ''}`);
    },
    unreadCount: () => api.get('/notifications/unread-count'),
    markRead: (id) => api.patch(`/notifications/${id}/read`),
    markAllRead: () => api.patch('/notifications/read-all')
  }
};

window.api = api;
window.auth = auth;
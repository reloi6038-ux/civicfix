(function () {
  if (requireSuperAdmin()) return;

  const container = document.getElementById('users-table');
  const paginationEl = document.getElementById('pagination');
  const form = document.getElementById('user-filters');
  const state = { page: 1, limit: 20, search: '', role: '', isActive: '' };

  function renderPagination(meta) {
    if (!meta || meta.pages <= 1) { paginationEl.innerHTML = ''; return; }
    const { page, pages } = meta;
    const btns = [`<button ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">←</button>`];
    const start = Math.max(1, page - 2), end = Math.min(pages, page + 2);
    for (let p = start; p <= end; p++) btns.push(`<button data-page="${p}" class="${p === page ? 'active' : ''}">${p}</button>`);
    btns.push(`<button ${page === pages ? 'disabled' : ''} data-page="${page + 1}">→</button>`);
    paginationEl.innerHTML = btns.join('');
    paginationEl.querySelectorAll('button[data-page]').forEach((b) => b.addEventListener('click', () => {
      state.page = Number(b.dataset.page);
      load();
    }));
  }

  function userRow(u) {
    const selfId = auth.getUser().id;
    const isSelf = String(u._id) === String(selfId);
    return `
      <tr>
        <td>
          <div style="font-weight: 500;">${escapeHtml(u.name)}</div>
          <div class="text-sm text-muted">${escapeHtml(u.email)}</div>
        </td>
        <td><span class="badge badge-priority-${u.role === 'admin' ? 'critical' : u.role === 'moderator' ? 'high' : 'low'}">${u.role}</span></td>
        <td>${u.isActive ? '<span class="badge badge-resolved">Active</span>' : '<span class="badge badge-rejected">Inactive</span>'}</td>
        <td class="text-sm text-muted">${formatDate(u.createdAt)}</td>
        <td class="actions">
          <select class="form-select" data-role="${u._id}" style="width: auto; display: inline-block; padding: 0.25rem 0.5rem; font-size: 0.8125rem;" ${isSelf ? 'disabled' : ''}>
            <option ${u.role === 'resident' ? 'selected' : ''}>resident</option>
            <option ${u.role === 'moderator' ? 'selected' : ''}>moderator</option>
            <option ${u.role === 'admin' ? 'selected' : ''}>admin</option>
          </select>
          <button class="btn ${u.isActive ? 'btn-ghost' : 'btn-success'} btn-sm" data-toggle="${u._id}" data-active="${u.isActive}" ${isSelf ? 'disabled' : ''}>
            ${u.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </td>
      </tr>`;
  }

  async function load() {
    showLoading(container, 'Loading users…');
    try {
      const res = await adminApi.users.list(state);
      const items = res.data || [];
      if (!items.length) { showEmpty(container, 'No users match the filters'); paginationEl.innerHTML = ''; return; }
      container.innerHTML = `<div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th class="actions">Actions</th></tr></thead>
        <tbody>${items.map(userRow).join('')}</tbody>
      </table></div>`;

      container.querySelectorAll('[data-role]').forEach((sel) => {
        sel.addEventListener('change', async () => {
          try {
            await adminApi.users.setRole(sel.dataset.role, sel.value);
            toast(`Role updated to ${sel.value}`, 'success');
          } catch (err) { toast(err.message, 'error'); load(); }
        });
      });

      container.querySelectorAll('[data-toggle]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const newActive = btn.dataset.active !== 'true';
          try {
            await adminApi.users.setStatus(btn.dataset.toggle, newActive);
            toast(`User ${newActive ? 'activated' : 'deactivated'}`, 'success');
            load();
          } catch (err) { toast(err.message, 'error'); }
        });
      });

      renderPagination(res.pagination);
    } catch (err) { showError(container, err.message, load); }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.search = document.getElementById('search').value.trim();
    state.role = document.getElementById('role').value;
    state.isActive = document.getElementById('status').value;
    state.page = 1;
    load();
  });

  load();
})();
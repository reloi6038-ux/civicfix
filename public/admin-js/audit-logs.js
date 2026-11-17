(function () {
  if (requireSuperAdmin()) return;

  const table = document.getElementById('audit-table');
  const paginationEl = document.getElementById('pagination');
  const form = document.getElementById('audit-filters');
  const state = { page: 1, limit: 50, action: '', resource: '' };

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

  async function load() {
    showLoading(table);
    try {
      const res = await adminApi.auditLogs(state);
      const logs = res.data || [];
      if (!logs.length) { showEmpty(table, 'No audit logs match the filters'); paginationEl.innerHTML = ''; return; }
      table.innerHTML = `<div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th>When</th><th>User</th><th>Action</th><th>Resource</th><th>Description</th></tr></thead>
        <tbody>${logs.map((l) => `
          <tr>
            <td class="text-sm text-muted">${formatDate(l.createdAt, true)}</td>
            <td>
              <div style="font-weight: 500;">${escapeHtml(l.user?.name || '—')}</div>
              <div class="text-sm text-muted">${escapeHtml(l.user?.email || '')}</div>
            </td>
            <td><code style="font-size: 0.75rem; background: var(--bg); padding: 2px 6px; border-radius: 4px;">${escapeHtml(l.action)}</code></td>
            <td>${escapeHtml(l.resource)}</td>
            <td class="text-sm">${escapeHtml(l.description || '')}</td>
          </tr>
        `).join('')}</tbody>
      </table></div>`;
      renderPagination(res.pagination);
    } catch (err) { showError(table, err.message, load); }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.action = document.getElementById('action').value.trim();
    state.resource = document.getElementById('resource').value;
    state.page = 1;
    load();
  });

  load();
})();
(function () {
  if (requireAdmin()) return;

  const container = document.getElementById('issues-table');
  const paginationEl = document.getElementById('pagination');
  const filtersForm = document.getElementById('filters');
  const isAdmin = auth.getUser().role === 'admin';

  const state = { page: 1, limit: 20, keyword: '', status: '', priority: '', city: '' };

  function issueRow(i) {
    return `
      <tr>
        <td><a href="/admin/issue-detail.html?id=${i._id}">${escapeHtml(i.reference)}</a></td>
        <td>
          <div style="font-weight: 500;">${escapeHtml(i.title)}</div>
          <div class="text-sm text-muted">${escapeHtml(i.city || '')}${i.state ? ', ' + escapeHtml(i.state) : ''}</div>
        </td>
        <td>${badgeHtml(i.status)}</td>
        <td>${priorityBadgeHtml(i.priority)}</td>
        <td class="text-sm text-muted">${escapeHtml(i.reporter?.name || '—')}</td>
        <td class="text-sm text-muted">${timeAgo(i.createdAt)}</td>
        <td class="actions">
          <a href="/admin/issue-detail.html?id=${i._id}" class="btn btn-ghost btn-sm">Manage</a>
          ${isAdmin ? `<button class="btn btn-ghost btn-sm" data-delete="${i._id}" style="color: var(--danger);">Delete</button>` : ''}
        </td>
      </tr>`;
  }

  function renderPagination(meta) {
    if (!meta || meta.pages <= 1) { paginationEl.innerHTML = ''; return; }
    const { page, pages } = meta;
    const btns = [
      `<button ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">←</button>`
    ];
    const start = Math.max(1, page - 2), end = Math.min(pages, page + 2);
    for (let p = start; p <= end; p++) {
      btns.push(`<button data-page="${p}" class="${p === page ? 'active' : ''}">${p}</button>`);
    }
    btns.push(`<button ${page === pages ? 'disabled' : ''} data-page="${page + 1}">→</button>`);
    paginationEl.innerHTML = btns.join('');
    paginationEl.querySelectorAll('button[data-page]').forEach((b) => {
      b.addEventListener('click', () => {
        state.page = Number(b.dataset.page);
        load();
      });
    });
  }

  async function load() {
    showLoading(container, 'Loading issues…');
    try {
      const res = await adminApi.issues.list(state);
      const items = res.data || [];
      if (!items.length) {
        showEmpty(container, 'No issues match the filters');
        paginationEl.innerHTML = '';
        return;
      }
      container.innerHTML = `<div class="admin-table-wrap"><table class="admin-table">
        <thead><tr>
          <th>Reference</th><th>Issue</th><th>Status</th><th>Priority</th><th>Reporter</th><th>Created</th><th></th>
        </tr></thead>
        <tbody>${items.map(issueRow).join('')}</tbody>
      </table></div>`;

      container.querySelectorAll('[data-delete]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this issue permanently? This cannot be undone.')) return;
          try {
            await adminApi.issues.remove(btn.dataset.delete);
            toast('Issue deleted', 'success');
            load();
          } catch (err) {
            toast(err.message, 'error');
          }
        });
      });

      renderPagination(res.pagination);
    } catch (err) {
      showError(container, err.message, load);
    }
  }

  filtersForm.addEventListener('submit', (e) => {
    e.preventDefault();
    state.keyword = document.getElementById('keyword').value.trim();
    state.status = document.getElementById('status').value;
    state.priority = document.getElementById('priority').value;
    state.city = document.getElementById('city').value.trim();
    state.page = 1;
    load();
  });

  load();
})();
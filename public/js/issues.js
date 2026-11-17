(function () {
  const container = document.getElementById('issues-container');
  const paginationEl = document.getElementById('pagination-container');
  const filtersForm = document.getElementById('filters-form');
  const categorySelect = document.getElementById('filter-category');

  const state = {
    page: 1,
    limit: 10,
    keyword: '',
    category: '',
    status: '',
    priority: ''
  };

  // Load categories into the filter dropdown
  (async () => {
    try {
      const res = await api.categories.list();
      categorySelect.innerHTML = '<option value="">All</option>' +
        res.data.map((c) => `<option value="${c.slug}">${escapeHtml(c.icon)} ${escapeHtml(c.name)}</option>`).join('');
    } catch (_) {}
  })();

  function issueCard(i) {
    return `
      <div class="issue-card" onclick="window.location.href='/pages/issue-detail.html?id=${i._id}'">
        <div class="issue-card-header">
          <div>
            <div class="issue-card-title">${escapeHtml(i.title)}</div>
            <small>${escapeHtml(i.reference)}</small>
          </div>
          <div class="issue-card-badges">${badgeHtml(i.status)}${priorityBadgeHtml(i.priority)}</div>
        </div>
        <div class="issue-card-excerpt">${escapeHtml(i.description)}</div>
        <div class="issue-card-meta">
          <span>📂 ${escapeHtml(i.category?.name || '—')}</span>
          <span>📍 ${escapeHtml(i.city || '—')}, ${escapeHtml(i.state || '—')}</span>
          <span>🕒 ${timeAgo(i.createdAt)}</span>
        </div>
      </div>`;
  }

  function renderPagination(meta) {
    if (!meta || meta.pages <= 1) { paginationEl.innerHTML = ''; return; }
    const { page, pages } = meta;
    const btns = [];

    btns.push(`<button ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">← Prev</button>`);
    const start = Math.max(1, page - 2);
    const end = Math.min(pages, page + 2);
    if (start > 1) btns.push(`<button data-page="1">1</button>`, '<span>…</span>');
    for (let p = start; p <= end; p++) {
      btns.push(`<button data-page="${p}" class="${p === page ? 'active' : ''}">${p}</button>`);
    }
    if (end < pages) btns.push('<span>…</span>', `<button data-page="${pages}">${pages}</button>`);
    btns.push(`<button ${page === pages ? 'disabled' : ''} data-page="${page + 1}">Next →</button>`);

    paginationEl.innerHTML = btns.join('');
    paginationEl.querySelectorAll('button[data-page]').forEach((b) => {
      b.addEventListener('click', () => {
        state.page = Number(b.dataset.page);
        load();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  async function load() {
    showLoading(container, 'Loading issues…');
    try {
      const res = await api.issues.list(state);
      const items = res.data || [];
      if (!items.length) {
        showEmpty(container, 'No issues match your filters', 'Try adjusting your search or filters.', '<button class="btn btn-secondary mt-2" onclick="window.location.reload()">Reset</button>');
        paginationEl.innerHTML = '';
        return;
      }
      container.innerHTML = `<div class="issue-list">${items.map(issueCard).join('')}</div>`;
      renderPagination(res.pagination);
    } catch (err) {
      showError(container, err.message, load);
      paginationEl.innerHTML = '';
    }
  }

  filtersForm.addEventListener('submit', (e) => {
    e.preventDefault();
    state.keyword = document.getElementById('keyword').value.trim();
    state.category = categorySelect.value;
    state.status = document.getElementById('filter-status').value;
    state.priority = document.getElementById('filter-priority').value;
    state.page = 1;
    load();
  });

  // Pre-fill filters from URL query if provided
  const params = new URLSearchParams(window.location.search);
  ['keyword', 'category', 'status', 'priority'].forEach((k) => {
    if (params.get(k)) {
      state[k] = params.get(k);
      const el = document.getElementById(k === 'keyword' ? 'keyword' : `filter-${k}`);
      if (el) el.value = params.get(k);
    }
  });

  load();
})();
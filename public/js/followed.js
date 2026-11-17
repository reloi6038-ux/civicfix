(function () {
  if (requireAuth()) return;
  const container = document.getElementById('followed-container');

  async function load() {
    showLoading(container);
    try {
      const res = await api.issues.followed({ limit: 50 });
      const items = res.data || [];
      if (!items.length) {
        showEmpty(container, 'You are not following any issues', 'Follow issues to receive updates on their progress.', '<a href="/pages/issues.html" class="btn btn-primary mt-2">Browse Issues</a>');
        return;
      }
      container.innerHTML = `<div class="issue-list">
        ${items.map((i) => `
          <div class="issue-card" onclick="window.location.href='/pages/issue-detail.html?id=${i._id}'">
            <div class="issue-card-header">
              <div>
                <div class="issue-card-title">${escapeHtml(i.title)}</div>
                <small>${escapeHtml(i.reference)}</small>
              </div>
              <div class="issue-card-badges">${badgeHtml(i.status)}${priorityBadgeHtml(i.priority)}</div>
            </div>
            <div class="issue-card-meta">
              <span>📂 ${escapeHtml(i.category?.name || '—')}</span>
              <span>📍 ${escapeHtml(i.city || '—')}</span>
              <span>🕒 ${timeAgo(i.updatedAt || i.createdAt)}</span>
            </div>
          </div>
        `).join('')}
      </div>`;
    } catch (err) {
      showError(container, err.message, load);
    }
  }

  load();
})();
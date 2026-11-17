(function () {
  if (requireAuth()) return;

  const user = auth.getUser();
  document.getElementById('welcome').textContent = `Welcome back, ${user.name}`;

  const statsEl = document.getElementById('user-stats');
  const contentEl = document.getElementById('tab-content');

  let activeTab = 'my-issues';

  async function renderStats() {
    try {
      const [mine, followed] = await Promise.all([
        api.users.myIssues(),
        api.issues.followed({ limit: 100 })
      ]);
      const mineCount = mine.count || 0;
      const mineResolved = (mine.data || []).filter((i) => i.status === 'RESOLVED').length;
      const followedCount = followed.pagination ? followed.pagination.total : 0;

      statsEl.innerHTML = `
        <div class="stat-card"><div class="stat-label">My Reports</div><div class="stat-value primary">${mineCount}</div></div>
        <div class="stat-card"><div class="stat-label">Resolved</div><div class="stat-value success">${mineResolved}</div></div>
        <div class="stat-card"><div class="stat-label">Following</div><div class="stat-value">${followedCount}</div></div>
      `;
    } catch (err) {
      showError(statsEl, err.message);
    }
  }

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
        <div class="issue-card-meta">
          <span>📂 ${escapeHtml(i.category?.name || '—')}</span>
          <span>📍 ${escapeHtml(i.city || '—')}</span>
          <span>🕒 ${timeAgo(i.createdAt)}</span>
        </div>
      </div>`;
  }

  async function renderTab(tab) {
    showLoading(contentEl);
    try {
      if (tab === 'my-issues') {
        const res = await api.users.myIssues();
        const items = res.data || [];
        if (!items.length) {
          showEmpty(contentEl, 'No reports yet', 'Report your first community issue to get started.', '<a href="/pages/report.html" class="btn btn-primary mt-2">Report an Issue</a>');
        } else {
          contentEl.innerHTML = `<div class="issue-list">${items.map(issueCard).join('')}</div>`;
        }
      } else {
        const res = await api.issues.followed({ limit: 50 });
        const items = res.data || [];
        if (!items.length) {
          showEmpty(contentEl, 'Not following any issues', 'Follow issues to keep track of their progress.', '<a href="/pages/issues.html" class="btn btn-secondary mt-2">Browse Issues</a>');
        } else {
          contentEl.innerHTML = `<div class="issue-list">${items.map(issueCard).join('')}</div>`;
        }
      }
    } catch (err) {
      showError(contentEl, err.message, () => renderTab(tab));
    }
  }

  document.querySelectorAll('.tab').forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      tabBtn.classList.add('active');
      activeTab = tabBtn.dataset.tab;
      renderTab(activeTab);
    });
  });

  renderStats();
  renderTab(activeTab);
})();
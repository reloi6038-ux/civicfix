(async function () {
  if (requireAdmin()) return;

  const statsEl = document.getElementById('admin-stats');
  const recentUsersEl = document.getElementById('recent-users');
  const recentIssuesEl = document.getElementById('recent-issues');

  try {
    const res = await adminApi.dashboard();
    const { stats, recentUsers, recentIssues } = res.data;

    // Stats grid
    statsEl.innerHTML = `
      <div class="stat-card"><div class="stat-label">Total Users</div><div class="stat-value primary">${stats.totalUsers}</div></div>
      <div class="stat-card"><div class="stat-label">Total Issues</div><div class="stat-value">${stats.totalIssues}</div></div>
      <div class="stat-card"><div class="stat-label">Pending</div><div class="stat-value warning">${stats.reported}</div></div>
      <div class="stat-card"><div class="stat-label">In Progress</div><div class="stat-value">${stats.inProgress}</div></div>
      <div class="stat-card"><div class="stat-label">Resolved</div><div class="stat-value success">${stats.resolved}</div></div>
      <div class="stat-card"><div class="stat-label">Resolution Rate</div><div class="stat-value success">${stats.resolutionRate}%</div></div>
    `;

    // Status doughnut
    new Chart(document.getElementById('chart-status'), {
      type: 'doughnut',
      data: {
        labels: ['Reported', 'Under Review', 'Verified', 'In Progress', 'Resolved', 'Rejected', 'Duplicate'],
        datasets: [{
          data: [stats.reported, stats.underReview, stats.verified, stats.inProgress, stats.resolved, stats.rejected, stats.duplicate],
          backgroundColor: ['#3b82f6', '#f59e0b', '#6366f1', '#f97316', '#10b981', '#ef4444', '#6b7280']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });

    // Category bar
    const analytics = await adminApi.analytics();
    new Chart(document.getElementById('chart-category'), {
      type: 'bar',
      data: {
        labels: analytics.data.byCategory.map((c) => c.name),
        datasets: [{
          label: 'Reports',
          data: analytics.data.byCategory.map((c) => c.count),
          backgroundColor: '#1a56db'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });

    // Recent users
    if (!recentUsers.length) {
      recentUsersEl.innerHTML = '<p class="text-muted text-sm">No users yet.</p>';
    } else {
      recentUsersEl.innerHTML = `<div class="admin-table-wrap"><table class="admin-table"><tbody>
        ${recentUsers.map((u) => `
          <tr>
            <td>${escapeHtml(u.name)}</td>
            <td class="text-sm text-muted">${escapeHtml(u.email)}</td>
            <td><span class="badge badge-priority-${u.role === 'admin' ? 'critical' : u.role === 'moderator' ? 'high' : 'low'}">${u.role}</span></td>
          </tr>
        `).join('')}
      </tbody></table></div>`;
    }

    // Recent issues
    if (!recentIssues.length) {
      recentIssuesEl.innerHTML = '<p class="text-muted text-sm">No issues yet.</p>';
    } else {
      recentIssuesEl.innerHTML = `<div class="admin-table-wrap"><table class="admin-table"><tbody>
        ${recentIssues.map((i) => `
          <tr>
            <td><a href="/admin/issue-detail.html?id=${i._id}">${escapeHtml(i.reference)}</a></td>
            <td>${escapeHtml(i.title)}</td>
            <td>${badgeHtml(i.status)}</td>
            <td class="text-sm text-muted">${timeAgo(i.createdAt)}</td>
          </tr>
        `).join('')}
      </tbody></table></div>`;
    }
  } catch (err) {
    showError(statsEl, err.message);
  }
})();
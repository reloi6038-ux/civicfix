(function () {
  if (requireAuth()) return;
  const container = document.getElementById('notifications-container');
  const markAllBtn = document.getElementById('mark-all-btn');

  async function load() {
    showLoading(container);
    try {
      const res = await api.notifications.list({ limit: 50 });
      const items = res.data || [];
      if (!items.length) {
        showEmpty(container, 'No notifications yet', 'When someone comments on your issues or changes their status, you will see it here.');
        return;
      }
      container.innerHTML = `<div style="display: flex; flex-direction: column; gap: 0.5rem;">
        ${items.map((n) => `
          <div class="notification-item ${n.isRead ? '' : 'unread'}" data-id="${n._id}" data-issue="${n.issue?._id || ''}">
            ${n.isRead ? '' : '<span class="notification-dot"></span>'}
            <div class="notification-body">
              <div class="notification-title">${escapeHtml(n.title)}</div>
              <div class="notification-message">${escapeHtml(n.message)}</div>
              <div class="notification-date">${timeAgo(n.createdAt)}</div>
            </div>
          </div>
        `).join('')}
      </div>`;

      container.querySelectorAll('.notification-item').forEach((el) => {
        el.addEventListener('click', async () => {
          if (el.classList.contains('unread')) {
            try { await api.notifications.markRead(el.dataset.id); } catch (_) {}
            el.classList.remove('unread');
            const dot = el.querySelector('.notification-dot');
            if (dot) dot.remove();
          }
          if (el.dataset.issue) {
            window.location.href = `/pages/issue-detail.html?id=${el.dataset.issue}`;
          }
        });
      });
    } catch (err) {
      showError(container, err.message, load);
    }
  }

  markAllBtn.addEventListener('click', async () => {
    try {
      await api.notifications.markAllRead();
      toast('All notifications marked as read', 'success');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  load();
})();
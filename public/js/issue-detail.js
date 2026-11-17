(function () {
  const container = document.getElementById('issue-container');
  const params = new URLSearchParams(window.location.search);
  const issueId = params.get('id');

  if (!issueId) {
    container.innerHTML = `<div class="error-state"><h3>No issue selected</h3><p>Please choose an issue from the list.</p><a href="/pages/issues.html" class="btn btn-primary mt-2">Browse Issues</a></div>`;
    return;
  }

  let issue;
  let history = [];
  let currentUser = auth.getUser();
  let isFollowing = false;

  async function load() {
    showLoading(container, 'Loading issue…');
    try {
      const res = await api.issues.get(issueId);
      issue = res.data.issue;
      history = res.data.statusHistory || [];
      isFollowing = currentUser && issue.followers?.some((f) => (f._id || f) === currentUser.id);
      render();
      loadComments();
    } catch (err) {
      showError(container, err.message, load);
    }
  }

  function render() {
    const canFollow = Boolean(currentUser);
    const photoHtml = issue.photo
      ? `<img src="${issue.photo}" alt="Issue photo" class="detail-photo" onerror="this.style.display='none'">`
      : '';

    const timelineHtml = history.map((h) => `
      <li class="timeline-item done">
        <span class="timeline-dot"></span>
        <div class="timeline-title">${escapeHtml(h.newStatus)}</div>
        <div class="timeline-note">
          ${h.changedBy?.name ? `by ${escapeHtml(h.changedBy.name)} · ` : ''}${formatDate(h.createdAt, true)}
          ${h.note ? `<br><em>${escapeHtml(h.note)}</em>` : ''}
        </div>
      </li>
    `).join('');

    container.innerHTML = `
      <div class="detail-header">
        <div class="flex-between mb-2">
          <div>
            <small class="text-muted">${escapeHtml(issue.reference)}</small>
            <h1 class="mb-1">${escapeHtml(issue.title)}</h1>
          </div>
          <div class="issue-card-badges">${badgeHtml(issue.status)}${priorityBadgeHtml(issue.priority)}</div>
        </div>
        <p class="text-muted text-sm">
          Reported by <strong>${escapeHtml(issue.reporter?.name || 'Anonymous')}</strong>
          on ${formatDate(issue.createdAt, true)}
        </p>
        ${photoHtml}
        <div class="mt-3"><strong>Description</strong><p class="mt-1">${escapeHtml(issue.description).replace(/\n/g, '<br>')}</p></div>
        ${issue.officialResponse ? `<div class="card mt-3" style="background: var(--primary-light); border-color: var(--primary);"><strong>📢 Official Response</strong><p class="mt-1">${escapeHtml(issue.officialResponse)}</p></div>` : ''}
      </div>

      <div class="detail-grid">
        <div>
          <div class="card mb-2">
            <div class="card-title mb-2">💬 Comments (<span id="comment-count">${issue.commentCount || 0}</span>)</div>
            <div id="comment-list" class="comment-list"><div class="loading-block"><span class="spinner"></span>Loading comments…</div></div>
            ${currentUser ? `
              <form id="comment-form" class="mt-2">
                <textarea class="form-textarea" id="comment-body" placeholder="Add a comment…" maxlength="2000" required></textarea>
                <button type="submit" class="btn btn-primary mt-2" id="comment-submit">Post Comment</button>
              </form>
            ` : '<p class="text-muted text-sm mt-2"><a href="/pages/login.html">Log in</a> to comment.</p>'}
          </div>
        </div>

        <aside>
          <div class="card mb-2">
            <div class="card-title mb-2">📋 Details</div>
            <p class="text-sm mb-1"><strong>Category:</strong> ${escapeHtml(issue.category?.icon || '')} ${escapeHtml(issue.category?.name || '—')}</p>
            <p class="text-sm mb-1"><strong>Location:</strong> ${escapeHtml(issue.location || '—')}</p>
            <p class="text-sm mb-1"><strong>City:</strong> ${escapeHtml(issue.city || '—')}, ${escapeHtml(issue.state || '—')}</p>
            <p class="text-sm mb-1"><strong>Country:</strong> ${escapeHtml(issue.country || '—')}</p>
            <p class="text-sm mb-1"><strong>Followers:</strong> ${issue.followerCount || 0}</p>
            ${issue.resolvedAt ? `<p class="text-sm"><strong>Resolved:</strong> ${formatDate(issue.resolvedAt, true)}</p>` : ''}
            ${canFollow ? `
              <button class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} btn-block mt-2" id="follow-btn">
                ${isFollowing ? '✓ Following' : '+ Follow Issue'}
              </button>
            ` : ''}
          </div>

          <div class="card">
            <div class="card-title mb-2">📅 Status Timeline</div>
            <ul class="timeline">${timelineHtml || '<li class="text-muted text-sm">No history yet.</li>'}</ul>
          </div>
        </aside>
      </div>
    `;

    // Attach handlers
    const followBtn = document.getElementById('follow-btn');
    if (followBtn) {
      followBtn.addEventListener('click', async () => {
        followBtn.disabled = true;
        try {
          if (isFollowing) {
            await api.issues.unfollow(issue._id);
            isFollowing = false;
            toast('Unfollowed issue', 'info');
          } else {
            await api.issues.follow(issue._id);
            isFollowing = true;
            toast('Now following this issue', 'success');
          }
          followBtn.textContent = isFollowing ? '✓ Following' : '+ Follow Issue';
          followBtn.className = `btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} btn-block mt-2`;
        } catch (err) {
          toast(err.message, 'error');
        } finally {
          followBtn.disabled = false;
        }
      });
    }

    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
      commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = document.getElementById('comment-body').value.trim();
        if (!body) return;
        const btn = document.getElementById('comment-submit');
        btn.disabled = true;
        btn.textContent = 'Posting…';
        try {
          await api.issues.addComment(issue._id, body);
          document.getElementById('comment-body').value = '';
          toast('Comment posted', 'success');
          loadComments();
        } catch (err) {
          toast(err.message, 'error');
        } finally {
          btn.disabled = false;
          btn.textContent = 'Post Comment';
        }
      });
    }
  }

  async function loadComments() {
    const listEl = document.getElementById('comment-list');
    if (!listEl) return;
    try {
      const res = await api.issues.comments(issue._id);
      const comments = res.data || [];
      const countEl = document.getElementById('comment-count');
      if (countEl) countEl.textContent = comments.length;

      if (!comments.length) {
        listEl.innerHTML = '<p class="text-muted text-sm">No comments yet. Be the first to comment!</p>';
        return;
      }

      listEl.innerHTML = comments.map((c) => {
        const isOwn = currentUser && String(c.author?._id) === String(currentUser.id);
        const canDelete = isOwn || (currentUser && ['moderator', 'admin'].includes(currentUser.role));
        const roleLabel = c.author?.role && c.author.role !== 'resident'
          ? `<span class="comment-role ${c.author.role}">${c.author.role}</span>` : '';
        return `
          <div class="comment ${c.isOfficial ? 'official' : ''}">
            <div class="comment-header">
              <div>
                <span class="comment-author">${escapeHtml(c.author?.name || 'Anonymous')}</span>
                ${roleLabel}
                ${c.isOfficial ? '<span class="comment-role">official</span>' : ''}
              </div>
              <span class="comment-date">${timeAgo(c.createdAt)}</span>
            </div>
            <div class="comment-body">${escapeHtml(c.body).replace(/\n/g, '<br>')}</div>
            ${canDelete ? `<div class="comment-actions"><button class="btn btn-ghost btn-sm" data-delete="${c._id}">Delete</button></div>` : ''}
          </div>`;
      }).join('');

      listEl.querySelectorAll('[data-delete]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this comment?')) return;
          try {
            await api.issues.deleteComment(btn.dataset.delete);
            toast('Comment deleted', 'info');
            loadComments();
          } catch (err) {
            toast(err.message, 'error');
          }
        });
      });
    } catch (err) {
      listEl.innerHTML = `<div class="error-state">${escapeHtml(err.message)}</div>`;
    }
  }

  load();
})();
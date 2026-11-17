(function () {
  if (requireAdmin()) return;

  const container = document.getElementById('issue-content');
  const id = new URLSearchParams(window.location.search).get('id');
  const user = auth.getUser();
  const isAdmin = user.role === 'admin';

  if (!id) {
    container.innerHTML = '<div class="error-state"><h3>No issue selected</h3><a href="/admin/issues.html" class="btn btn-primary mt-2">Back to Issues</a></div>';
    return;
  }

  let issue;

  async function load() {
    showLoading(container);
    try {
      const res = await api.issues.get(id);
      issue = res.data.issue;
      render(res.data.statusHistory || []);
    } catch (err) {
      showError(container, err.message, load);
    }
  }

  function render(history) {
    const photos = issue.photo ? `<img src="${issue.photo}" class="detail-photo" alt="Issue photo">` : '';
    const timeline = history.map((h) => `
      <li class="timeline-item done">
        <span class="timeline-dot"></span>
        <div class="timeline-title">${escapeHtml(h.newStatus)}</div>
        <div class="timeline-note">
          ${h.changedBy?.name ? `by ${escapeHtml(h.changedBy.name)} · ` : ''}${formatDate(h.createdAt, true)}
          ${h.note ? `<br><em>${escapeHtml(h.note)}</em>` : ''}
        </div>
      </li>`).join('');

    container.innerHTML = `
      <div class="detail-grid">
        <div>
          <div class="card mb-2">
            <div class="flex-between mb-1">
              <small class="text-muted">${escapeHtml(issue.reference)}</small>
              <div>${badgeHtml(issue.status)} ${priorityBadgeHtml(issue.priority)}</div>
            </div>
            <h1>${escapeHtml(issue.title)}</h1>
            <p class="text-muted text-sm mb-2">
              Reported by ${escapeHtml(issue.reporter?.name || '—')} on ${formatDate(issue.createdAt, true)}
            </p>
            ${photos}
            <div class="mt-2"><strong>Description</strong><p class="mt-1">${escapeHtml(issue.description).replace(/\n/g, '<br>')}</p></div>
            <div class="mt-2">
              <p class="text-sm"><strong>Location:</strong> ${escapeHtml(issue.location || '')} · ${escapeHtml(issue.city || '')}, ${escapeHtml(issue.state || '')}</p>
            </div>
          </div>

          <div class="card mb-2">
            <div class="card-title mb-2">Status Timeline</div>
            <ul class="timeline">${timeline || '<li class="text-muted text-sm">No status changes yet.</li>'}</ul>
          </div>

          <div class="card">
            <div class="card-title mb-2">Comments & Official Responses</div>
            <div id="admin-comment-list"><div class="loading-block"><span class="spinner"></span></div></div>
            <form id="admin-comment-form" class="mt-2">
              <textarea class="form-textarea" id="admin-comment-body" placeholder="Post an official response…" maxlength="2000" required></textarea>
              <button type="submit" class="btn btn-primary mt-2">Post Official Response</button>
            </form>
          </div>
        </div>

        <aside>
          <div class="card toolbox">
            <h3 class="mb-2">Moderator Tools</h3>

            <div class="toolbox-section">
              <h4>Set Priority</h4>
              <select class="form-select" id="priority-select">
                ${['Low','Medium','High','Critical'].map((p) => `<option ${issue.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
              </select>
              <button class="btn btn-secondary btn-sm btn-block mt-1" id="btn-priority">Save Priority</button>
            </div>

            <div class="toolbox-section">
              <h4>Verify</h4>
              <button class="btn btn-success btn-sm btn-block" id="btn-verify">✓ Verify Issue</button>
            </div>

            <div class="toolbox-section">
              <h4>Reject</h4>
              <textarea class="form-textarea" id="reject-reason" rows="2" placeholder="Reason (required)"></textarea>
              <button class="btn btn-danger btn-sm btn-block mt-1" id="btn-reject">Reject</button>
            </div>

            <div class="toolbox-section">
              <h4>Mark Duplicate</h4>
              <input class="form-input" id="duplicate-of" placeholder="Original issue ID">
              <button class="btn btn-secondary btn-sm btn-block mt-1" id="btn-duplicate">Mark Duplicate</button>
            </div>

            ${isAdmin ? `
              <div class="toolbox-section">
                <h4>Assign Moderator</h4>
                <input class="form-input" id="assign-moderator" placeholder="Moderator user ID">
                <button class="btn btn-secondary btn-sm btn-block mt-1" id="btn-assign">Assign</button>
              </div>
              <div class="toolbox-section">
                <h4>Danger Zone</h4>
                <button class="btn btn-danger btn-sm btn-block" id="btn-delete">Delete Issue</button>
              </div>
            ` : ''}
          </div>
        </aside>
      </div>`;

    bindActions();
    loadComments();
  }

  function bindActions() {
    document.getElementById('btn-priority').addEventListener('click', async () => {
      try {
        await adminApi.moderator.setPriority(issue._id, document.getElementById('priority-select').value);
        toast('Priority updated', 'success');
        load();
      } catch (err) { toast(err.message, 'error'); }
    });

    document.getElementById('btn-verify').addEventListener('click', async () => {
      try {
        await adminApi.moderator.verify(issue._id, 'Verified by moderator');
        toast('Issue verified', 'success');
        load();
      } catch (err) { toast(err.message, 'error'); }
    });

    document.getElementById('btn-reject').addEventListener('click', async () => {
      const reason = document.getElementById('reject-reason').value.trim();
      if (reason.length < 3) return toast('Reason is required', 'error');
      try {
        await adminApi.moderator.reject(issue._id, reason);
        toast('Issue rejected', 'success');
        load();
      } catch (err) { toast(err.message, 'error'); }
    });

    document.getElementById('btn-duplicate').addEventListener('click', async () => {
      const dup = document.getElementById('duplicate-of').value.trim();
      if (!dup) return toast('Enter the original issue ID', 'error');
      try {
        await adminApi.moderator.duplicate(issue._id, dup);
        toast('Marked duplicate', 'success');
        load();
      } catch (err) { toast(err.message, 'error'); }
    });

    const btnAssign = document.getElementById('btn-assign');
    if (btnAssign) {
      btnAssign.addEventListener('click', async () => {
        const modId = document.getElementById('assign-moderator').value.trim();
        if (!modId) return toast('Enter a moderator ID', 'error');
        try {
          await adminApi.issues.assign(issue._id, modId);
          toast('Moderator assigned', 'success');
        } catch (err) { toast(err.message, 'error'); }
      });
    }

    const btnDelete = document.getElementById('btn-delete');
    if (btnDelete) {
      btnDelete.addEventListener('click', async () => {
        if (!confirm('Delete this issue permanently?')) return;
        try {
          await adminApi.issues.remove(issue._id);
          toast('Issue deleted', 'success');
          setTimeout(() => (window.location.href = '/admin/issues.html'), 500);
        } catch (err) { toast(err.message, 'error'); }
      });
    }

    document.getElementById('admin-comment-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = document.getElementById('admin-comment-body').value.trim();
      if (!message) return;
      try {
        await adminApi.moderator.officialResponse(issue._id, message);
        toast('Official response posted', 'success');
        document.getElementById('admin-comment-body').value = '';
        loadComments();
      } catch (err) { toast(err.message, 'error'); }
    });
  }

  async function loadComments() {
    const el = document.getElementById('admin-comment-list');
    if (!el) return;
    try {
      const res = await api.issues.comments(issue._id);
      const comments = res.data || [];
      if (!comments.length) {
        el.innerHTML = '<p class="text-muted text-sm">No comments yet.</p>';
        return;
      }
      el.innerHTML = comments.map((c) => `
        <div class="comment ${c.isOfficial ? 'official' : ''}">
          <div class="comment-header">
            <div>
              <span class="comment-author">${escapeHtml(c.author?.name || 'Anonymous')}</span>
              ${c.author?.role && c.author.role !== 'resident' ? `<span class="comment-role ${c.author.role}">${c.author.role}</span>` : ''}
            </div>
            <span class="comment-date">${timeAgo(c.createdAt)}</span>
          </div>
          <div class="comment-body">${escapeHtml(c.body).replace(/\n/g, '<br>')}</div>
        </div>`).join('');
    } catch (err) {
      el.innerHTML = `<div class="error-state">${escapeHtml(err.message)}</div>`;
    }
  }

  load();
})();
(function () {
  if (requireSuperAdmin()) return;

  const table = document.getElementById('cat-table');
  const modal = document.getElementById('cat-modal');
  const form = document.getElementById('cat-form');
  const title = document.getElementById('cat-modal-title');

  function openModal(cat = null) {
    form.reset();
    document.getElementById('cat-id').value = cat?._id || '';
    document.getElementById('cat-name').value = cat?.name || '';
    document.getElementById('cat-slug').value = cat?.slug || '';
    document.getElementById('cat-icon').value = cat?.icon || '';
    document.getElementById('cat-desc').value = cat?.description || '';
    title.textContent = cat ? 'Edit Category' : 'New Category';
    modal.classList.add('show');
  }

  function closeModal() { modal.classList.remove('show'); }

  // Auto-generate slug from name (only when creating)
  document.getElementById('cat-name').addEventListener('input', (e) => {
    if (document.getElementById('cat-id').value) return;
    document.getElementById('cat-slug').value = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  });

  async function load() {
    showLoading(table);
    try {
      const res = await adminApi.categories.list();
      const cats = res.data || [];
      if (!cats.length) { showEmpty(table, 'No categories yet'); return; }
      table.innerHTML = `<div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th>Icon</th><th>Name</th><th>Slug</th><th>Description</th><th>Active</th><th></th></tr></thead>
        <tbody>${cats.map((c) => `
          <tr>
            <td style="font-size: 1.5rem;">${escapeHtml(c.icon || '📋')}</td>
            <td style="font-weight: 500;">${escapeHtml(c.name)}</td>
            <td class="text-sm text-muted">${escapeHtml(c.slug)}</td>
            <td class="text-sm">${escapeHtml(c.description || '')}</td>
            <td>${c.isActive ? '<span class="badge badge-resolved">Active</span>' : '<span class="badge badge-rejected">Inactive</span>'}</td>
            <td class="actions">
              <button class="btn btn-ghost btn-sm" data-edit="${c._id}">Edit</button>
              ${c.isActive ? `<button class="btn btn-ghost btn-sm" data-delete="${c._id}" style="color: var(--danger);">Deactivate</button>` : ''}
            </td>
          </tr>
        `).join('')}</tbody>
      </table></div>`;

      table.querySelectorAll('[data-edit]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const cat = cats.find((c) => c._id === btn.dataset.edit);
          openModal(cat);
        });
      });

      table.querySelectorAll('[data-delete]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm('Deactivate this category?')) return;
          try {
            await adminApi.categories.remove(btn.dataset.delete);
            toast('Category deactivated', 'success');
            load();
          } catch (err) { toast(err.message, 'error'); }
        });
      });
    } catch (err) { showError(table, err.message, load); }
  }

  document.getElementById('btn-new').addEventListener('click', () => openModal());
  document.getElementById('cat-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('cat-id').value;
    const payload = {
      name: document.getElementById('cat-name').value.trim(),
      slug: document.getElementById('cat-slug').value.trim(),
      icon: document.getElementById('cat-icon').value.trim(),
      description: document.getElementById('cat-desc').value.trim()
    };
    const btn = document.getElementById('cat-submit');
    btn.disabled = true;
    btn.textContent = 'Saving…';
    try {
      if (id) await adminApi.categories.update(id, payload);
      else await adminApi.categories.create(payload);
      toast('Category saved', 'success');
      closeModal();
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save';
    }
  });

  load();
})();
(function () {
  if (requireAuth()) return;

  const categorySelect = document.getElementById('category');
  const form = document.getElementById('report-form');

  // Load categories
  (async () => {
    try {
      const res = await api.categories.list();
      categorySelect.innerHTML = '<option value="">Select a category</option>' +
        res.data.map((c) => `<option value="${c._id}">${escapeHtml(c.icon || '📋')} ${escapeHtml(c.name)}</option>`).join('');
    } catch (err) {
      toast('Failed to load categories', 'error');
    }
  })();

  function clearErrors() {
    document.querySelectorAll('[data-error-for]').forEach((el) => { el.textContent = ''; });
    document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach((el) => el.classList.remove('error'));
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = 'Submitting…';

    try {
      const formData = new FormData(form);
      // Remove empty optional fields so backend validation doesn't complain
      ['latitude', 'longitude'].forEach((k) => {
        if (!formData.get(k)) formData.delete(k);
      });
      // Photo: if empty, remove it
      const photo = formData.get('photo');
      if (!photo || !photo.name) formData.delete('photo');

      const res = await api.issues.create(formData);
      toast('Issue reported successfully!', 'success');
      setTimeout(() => {
        window.location.href = `/pages/issue-detail.html?id=${res.data._id}`;
      }, 600);
    } catch (err) {
      if (err.errors && err.errors.length) {
        err.errors.forEach(({ field, message }) => {
          const el = document.querySelector(`[data-error-for="${field}"]`);
          if (el) el.textContent = message;
          const input = document.getElementById(field);
          if (input) input.classList.add('error');
        });
      }
      toast(err.message || 'Failed to submit issue', 'error');
      btn.disabled = false;
      btn.textContent = 'Submit Report';
    }
  });
})();
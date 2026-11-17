(function () {
  if (requireAuth()) return;

  const profileForm = document.getElementById('profile-form');
  const passwordForm = document.getElementById('password-form');

  (async () => {
    try {
      const res = await api.users.profile();
      const u = res.data;
      ['name', 'phone', 'address', 'city', 'state', 'country'].forEach((f) => {
        const el = document.getElementById(f);
        if (el) el.value = u[f] || '';
      });
      document.getElementById('email-display').value = u.email;
    } catch (err) {
      toast(err.message, 'error');
    }
  })();

  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('profile-submit');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      const formData = Object.fromEntries(new FormData(profileForm));
      const res = await api.users.updateProfile(formData);
      auth.setUser({ ...auth.getUser(), name: res.data.name });
      toast('Profile updated', 'success');
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Save Changes';
    }
  });

  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('password-submit');
    btn.disabled = true; btn.textContent = 'Changing…';
    try {
      const formData = Object.fromEntries(new FormData(passwordForm));
      await api.users.changePassword(formData);
      toast('Password changed successfully', 'success');
      passwordForm.reset();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Change Password';
    }
  });
})();
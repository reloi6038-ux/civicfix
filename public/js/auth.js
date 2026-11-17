(function () {
  // Redirect if already logged in
  if (auth.isLoggedIn()) {
    window.location.href = '/pages/dashboard.html';
    return;
  }

  function setFieldError(name, message) {
    const el = document.querySelector(`[data-error-for="${name}"]`);
    if (el) el.textContent = message || '';
  }

  function clearErrors() {
    document.querySelectorAll('[data-error-for]').forEach((el) => { el.textContent = ''; });
    document.querySelectorAll('.form-input').forEach((el) => el.classList.remove('error'));
  }

  function applyServerErrors(errors) {
    (errors || []).forEach(({ field, message }) => {
      setFieldError(field, message);
      const input = document.getElementById(field);
      if (input) input.classList.add('error');
    });
  }

  async function submitHandler(e, mode) {
    e.preventDefault();
    clearErrors();
    const form = e.target;
    const formData = Object.fromEntries(new FormData(form));
    const btn = document.getElementById('submit-btn');

    btn.disabled = true;
    btn.textContent = mode === 'register' ? 'Creating account…' : 'Logging in…';

    try {
      const user = mode === 'register'
        ? await api.auth.register(formData)
        : await api.auth.login({ email: formData.email, password: formData.password });

      toast(`Welcome, ${user.name}!`, 'success');
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      setTimeout(() => {
        window.location.href = next
          ? decodeURIComponent(next)
          : (user.role === 'admin' || user.role === 'moderator' ? '/admin/index.html' : '/pages/dashboard.html');
      }, 500);
    } catch (err) {
      if (err.errors && err.errors.length) {
        applyServerErrors(err.errors);
      }
      toast(err.message || 'Something went wrong', 'error');
      btn.disabled = false;
      btn.textContent = mode === 'register' ? 'Create Account' : 'Log In';
    }
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', (e) => submitHandler(e, 'login'));

  const registerForm = document.getElementById('register-form');
  if (registerForm) registerForm.addEventListener('submit', (e) => submitHandler(e, 'register'));
})();
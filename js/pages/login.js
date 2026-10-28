/**
 * pages/login.js - Authentication login controller
 */

function fillDemo(email, pass) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = pass;
  document.getElementById('login-error-alert').style.display = 'none';
  Utils.showToast(`Filled credentials for ${email}`, 'info');
}

document.addEventListener('DOMContentLoaded', () => {
  Components.init();

  const form = document.getElementById('login-form');
  const errorAlert = document.getElementById('login-error-alert');
  const redirectUrl = Utils.getUrlParam('redirect');
  const msg = Utils.getUrlParam('msg');

  if (msg === 'login_required') {
    Utils.showToast('Please sign in to access this page.', 'warning');
  } else if (msg === 'logged_out') {
    Utils.showToast('You have been logged out safely.', 'info');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value;

    const rules = {
      email: { required: true, email: true },
      password: { required: true, minLength: 4 }
    };

    if (!Utils.validateForm(form, rules)) {
      return;
    }

    const res = Auth.login(email, pass);
    if (!res.success) {
      errorAlert.textContent = res.message;
      errorAlert.style.display = 'block';
      return;
    }

    errorAlert.style.display = 'none';
    Utils.showToast(`Welcome back, ${res.user.name}!`, 'success');

    setTimeout(() => {
      if (redirectUrl) {
        window.location.href = decodeURIComponent(redirectUrl);
      } else if (res.user.role === 'vendor') {
        window.location.href = 'vendor-dashboard.html';
      } else if (res.user.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'index.html';
      }
    }, 500);
  });
});

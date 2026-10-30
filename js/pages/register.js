/**
 * pages/register.js - Customer and Vendor Registration controller
 */

document.addEventListener('DOMContentLoaded', () => {
  Components.init();

  const form = document.getElementById('register-form');
  const roleRadios = document.querySelectorAll('input[name="role"]');
  const vendorFields = document.getElementById('vendor-extra-fields');
  const labelCustomer = document.getElementById('role-label-customer');
  const labelVendor = document.getElementById('role-label-vendor');
  const errorAlert = document.getElementById('reg-error-alert');

  // Preselect role if passed in query param ?role=vendor
  const initialRole = Utils.getUrlParam('role');
  if (initialRole === 'vendor') {
    document.querySelector('input[name="role"][value="vendor"]').checked = true;
    updateRoleSelection('vendor');
  }

  roleRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      updateRoleSelection(radio.value);
    });
  });

  function updateRoleSelection(role) {
    if (role === 'vendor') {
      vendorFields.style.display = 'block';
      labelVendor.style.borderColor = 'var(--accent-primary)';
      labelVendor.style.backgroundColor = 'var(--accent-light)';
      labelCustomer.style.borderColor = 'var(--border-light)';
      labelCustomer.style.backgroundColor = 'transparent';
    } else {
      vendorFields.style.display = 'none';
      labelCustomer.style.borderColor = 'var(--accent-primary)';
      labelCustomer.style.backgroundColor = 'var(--accent-light)';
      labelVendor.style.borderColor = 'var(--border-light)';
      labelVendor.style.backgroundColor = 'transparent';
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const role = document.querySelector('input[name="role"]:checked').value;
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const locality = document.getElementById('reg-locality').value;

    const rules = {
      name: { required: true, minLength: 2 },
      email: { required: true, email: true },
      password: { required: true, minLength: 6 }
    };

    if (role === 'vendor') {
      rules.storeName = { required: true, minLength: 2 };
    }

    if (!Utils.validateForm(form, rules)) {
      return;
    }

    const userData = {
      name,
      email,
      phone,
      password,
      role,
      locality,
      storeName: role === 'vendor' ? document.getElementById('reg-store-name').value.trim() : '',
      storeCategory: role === 'vendor' ? document.getElementById('reg-store-category').value : '',
      storeBio: role === 'vendor' ? document.getElementById('reg-store-bio').value.trim() : ''
    };

    const res = Auth.register(userData);
    if (!res.success) {
      errorAlert.textContent = res.message;
      errorAlert.style.display = 'block';
      return;
    }

    errorAlert.style.display = 'none';
    Utils.showToast(`Account created! Welcome, ${name}.`, 'success');

    setTimeout(() => {
      if (role === 'vendor') {
        window.location.href = 'vendor-dashboard.html';
      } else {
        window.location.href = 'index.html';
      }
    }, 600);
  });
});

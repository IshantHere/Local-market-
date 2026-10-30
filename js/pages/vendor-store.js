/**
 * pages/vendor-store.js - Vendor store profile editor
 */

document.addEventListener('DOMContentLoaded', () => {
  Components.init();

  if (!Auth.requireRole(['vendor'])) return;

  const user = Auth.getUser();
  const vendors = Storage.getVendors();
  let vendor = vendors.find(v => v.id === user.vendorId || (v.ownerEmail && v.ownerEmail.toLowerCase() === user.email.toLowerCase()));

  if (!vendor) {
    vendor = vendors[0];
  }

  const form = document.getElementById('vendor-store-form');

  // Fill existing values
  document.getElementById('store-name').value = vendor.name || '';
  document.getElementById('store-category').value = vendor.category || 'Fresh Produce';
  document.getElementById('store-locality').value = vendor.locality || 'Northwood Hills';
  document.getElementById('store-email').value = vendor.contactEmail || user.email;
  document.getElementById('store-phone').value = vendor.phone || '';
  document.getElementById('store-bio').value = vendor.bio || '';
  document.getElementById('store-is-open').checked = vendor.isOpen !== false;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const rules = {
      name: { required: true, minLength: 2 },
      contactEmail: { required: true, email: true },
      bio: { required: true, minLength: 10 }
    };

    if (!Utils.validateForm(form, rules)) {
      return;
    }

    vendor.name = document.getElementById('store-name').value.trim();
    vendor.category = document.getElementById('store-category').value;
    vendor.locality = document.getElementById('store-locality').value;
    vendor.contactEmail = document.getElementById('store-email').value.trim();
    vendor.phone = document.getElementById('store-phone').value.trim();
    vendor.bio = document.getElementById('store-bio').value.trim();
    vendor.isOpen = document.getElementById('store-is-open').checked;

    const idx = vendors.findIndex(v => v.id === vendor.id);
    if (idx !== -1) {
      vendors[idx] = vendor;
      Storage.saveVendors(vendors);
    }

    Utils.showToast('Store settings saved successfully!', 'success');
  });
});

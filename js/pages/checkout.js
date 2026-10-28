/**
 * pages/checkout.js - Delivery address form validation and order checkout preparation
 */

document.addEventListener('DOMContentLoaded', () => {
  Components.init();

  // Guard: require customer login
  if (!Auth.requireRole(['customer', 'vendor', 'admin'])) return;

  const totals = Cart.getCalculatedTotals();
  if (totals.items.length === 0) {
    Utils.showToast('Your basket is empty. Please add items before checking out.', 'warning');
    setTimeout(() => window.location.href = 'products.html', 800);
    return;
  }

  const user = Auth.getUser();
  const form = document.getElementById('checkout-form');
  const summaryBox = document.getElementById('checkout-summary-box');

  // Pre-fill user details if available
  if (user) {
    if (user.name) document.getElementById('checkout-name').value = user.name;
    if (user.phone) document.getElementById('checkout-phone').value = user.phone;
    if (user.address) document.getElementById('checkout-address').value = user.address;
    if (user.locality) document.getElementById('checkout-locality').value = user.locality;
  }

  // Render Order Summary Sidebar
  summaryBox.innerHTML = `
    <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid var(--border-light);">
      Order Review (${totals.itemCount} items)
    </h3>

    <div style="max-height: 240px; overflow-y: auto; margin-bottom: 14px; display: flex; flex-direction: column; gap: 10px; padding-right: 4px;">
      ${totals.items.map(item => `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 0.86rem;">
          <div style="display: flex; align-items: center; gap: 8px; overflow: hidden;">
            <img src="${item.product.image}" style="width: 36px; height: 36px; border-radius: 4px; object-fit: cover; flex-shrink: 0;">
            <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              <span style="font-weight: 600;">${Utils.escapeHtml(item.product.name)}</span>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Qty: ${item.quantity} &bull; ${item.vendor.name}</div>
            </div>
          </div>
          <strong style="white-space: nowrap;">${Utils.formatCurrency(item.lineTotal)}</strong>
        </div>
      `).join('')}
    </div>

    <hr style="border: none; border-top: 1px solid var(--border-light); margin: 12px 0;">

    <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.88rem;">
      <div style="display: flex; justify-content: space-between;">
        <span style="color: var(--text-muted);">Subtotal</span>
        <span>${Utils.formatCurrency(totals.subtotal)}</span>
      </div>
      ${totals.discount > 0 ? `
        <div style="display: flex; justify-content: space-between; color: var(--success);">
          <span>Discount (${totals.promo ? totals.promo.code : ''})</span>
          <span>-${Utils.formatCurrency(totals.discount)}</span>
        </div>
      ` : ''}
      <div style="display: flex; justify-content: space-between;">
        <span style="color: var(--text-muted);">Neighborhood Delivery</span>
        <span>${totals.deliveryFee === 0 ? '<strong style="color: var(--success);">FREE</strong>' : Utils.formatCurrency(totals.deliveryFee)}</span>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 1.15rem; font-weight: 700; color: var(--accent-primary); border-top: 1px solid var(--border-light); padding-top: 10px; margin-top: 4px;">
        <span>Total Due</span>
        <span>${Utils.formatCurrency(totals.grandTotal)}</span>
      </div>
    </div>
  `;

  // Validation & Form Submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const rules = {
      name: { required: true, minLength: 2, message: 'Please enter recipient name.' },
      phone: { required: true, minLength: 7, message: 'Please provide a valid contact number.' },
      address: { required: true, minLength: 5, message: 'Please provide full street address.' },
      locality: { required: true, message: 'Please select your neighbourhood area.' }
    };

    const isValid = Utils.validateForm(form, rules);
    if (!isValid) {
      Utils.showToast('Please fix required fields.', 'error');
      return;
    }

    const checkoutData = {
      customerEmail: user.email,
      customerName: form.elements['name'].value.trim(),
      phone: form.elements['phone'].value.trim(),
      address: form.elements['address'].value.trim(),
      locality: form.elements['locality'].value,
      notes: form.elements['notes'].value.trim()
    };

    // Save temporary checkout session
    Storage.set('lmarket_active_checkout', checkoutData);
    window.location.href = 'payment.html';
  });
});

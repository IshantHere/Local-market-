/**
 * pages/vendor-promos.js - Vendor promotion code CRUD controller
 */

document.addEventListener('DOMContentLoaded', () => {
  Components.init();

  if (!Auth.requireRole(['vendor'])) return;

  const user = Auth.getUser();
  const vendors = Storage.getVendors();
  let vendor = vendors.find(v => v.id === user.vendorId || (v.ownerEmail && v.ownerEmail.toLowerCase() === user.email.toLowerCase()));

  if (!vendor) vendor = vendors[0];

  const tableWrap = document.getElementById('vendor-promos-table-wrap');
  const modalWrap = document.getElementById('promo-modal-wrap');
  const createBtn = document.getElementById('open-create-promo-btn');

  function renderPromos() {
    const allPromos = Storage.getPromotions();
    // Vendor sees their own promos plus platform-wide
    const vendorPromos = allPromos.filter(p => p.vendorId === vendor.id || p.vendorId === 'all');

    if (vendorPromos.length === 0) {
      tableWrap.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🏷️</div>
          <h2 class="empty-state-title">No promo codes created yet</h2>
          <p class="empty-state-desc">Create special offers like "HARVEST15" or "₹50 OFF" to reward neighborhood repeat customers.</p>
          <button class="btn btn-primary" onclick="openPromoModal()">+ Create Promo Code</button>
        </div>
      `;
      return;
    }

    tableWrap.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Promo Code</th>
              <th>Discount Type & Value</th>
              <th>Minimum Order</th>
              <th>Validity Dates</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${vendorPromos.map(p => {
              const isPlatform = p.vendorId === 'all';
              return `
                <tr>
                  <td>
                    <strong style="font-family: var(--font-mono); font-size: 1rem; color: var(--accent-primary); letter-spacing: 0.5px;">${p.code}</strong>
                    <div style="font-size: 0.76rem; color: var(--text-muted);">${Utils.escapeHtml(p.description)}</div>
                    ${isPlatform ? '<span class="badge badge-info" style="font-size: 0.65rem; margin-top: 2px;">Platform-wide</span>' : ''}
                  </td>
                  <td>
                    <strong>${p.type === 'percent' ? `${p.value}% Off Entire Order` : `${Utils.formatCurrency(p.value)} Flat Discount`}</strong>
                  </td>
                  <td>${p.minOrder ? Utils.formatCurrency(p.minOrder) : 'No minimum'}</td>
                  <td style="font-size: 0.82rem; color: var(--text-muted);">
                    ${p.startDate ? p.startDate : 'Anytime'} &rarr; ${p.endDate ? p.endDate : 'Ongoing'}
                  </td>
                  <td>
                    <span class="badge ${p.active ? 'badge-success' : 'badge-secondary'}">
                      ${p.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    ${!isPlatform ? `
                      <div style="display: flex; gap: 6px;">
                        <button class="btn btn-sm btn-outline" onclick="togglePromoStatus('${p.id}')">
                          ${p.active ? 'Disable' : 'Enable'}
                        </button>
                        <button class="btn btn-sm btn-outline text-danger" onclick="deletePromo('${p.id}')">
                          Delete
                        </button>
                      </div>
                    ` : `
                      <small style="color: var(--text-light);">Managed by Admin</small>
                    `}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderPromos();

  // Create Promo Modal
  window.openPromoModal = function() {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    modalWrap.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Create Promotion Voucher</h3>
            <button class="modal-close-btn" onclick="document.getElementById('promo-modal-wrap').innerHTML=''">&times;</button>
          </div>
          <form id="create-promo-form" novalidate>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Voucher Code (uppercase) *</label>
                <input type="text" id="promo-code" class="form-control" placeholder="e.g. AUTUMN15 or FRESH5" required minlength="3" style="text-transform: uppercase; font-family: var(--font-mono);">
                <small class="form-hint">Shoppers will enter this code at checkout.</small>
              </div>

              <div class="form-row">
                <div class="form-group form-col">
                  <label class="form-label">Discount Type *</label>
                  <select id="promo-type" class="form-control">
                    <option value="percent">Percentage Discount (%)</option>
                    <option value="flat">Flat Rupee Amount (₹)</option>
                  </select>
                </div>
                <div class="form-group form-col">
                  <label class="form-label">Discount Amount *</label>
                  <input type="number" id="promo-value" class="form-control" min="1" step="1" value="10" required>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Minimum Order Requirement (₹)</label>
                <input type="number" id="promo-min" class="form-control" min="0" step="1" value="200" placeholder="200.00">
                <small class="form-hint">Leave 0 for no minimum purchase requirement.</small>
              </div>

              <div class="form-row">
                <div class="form-group form-col">
                  <label class="form-label">Start Date</label>
                  <input type="date" id="promo-start" class="form-control" value="${today}">
                </div>
                <div class="form-group form-col">
                  <label class="form-label">Expiry Date</label>
                  <input type="date" id="promo-end" class="form-control" value="${nextMonth}">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Offer Description *</label>
                <input type="text" id="promo-desc" class="form-control" placeholder="e.g. 15% off fresh farm produce orders over ₹300" required>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-sm btn-outline" onclick="document.getElementById('promo-modal-wrap').innerHTML=''">Cancel</button>
              <button type="submit" class="btn btn-sm btn-primary">Publish Promo Code</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('create-promo-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const code = document.getElementById('promo-code').value.trim().toUpperCase();
      const type = document.getElementById('promo-type').value;
      const value = parseFloat(document.getElementById('promo-value').value);
      const minOrder = parseFloat(document.getElementById('promo-min').value) || 0;
      const startDate = document.getElementById('promo-start').value;
      const endDate = document.getElementById('promo-end').value;
      const desc = document.getElementById('promo-desc').value.trim();

      if (!code || isNaN(value) || !desc) {
        Utils.showToast('Please fill all required promo fields.', 'warning');
        return;
      }

      const allPromos = Storage.getPromotions();
      if (allPromos.some(p => p.code.toUpperCase() === code)) {
        Utils.showToast('A promo code with this name already exists.', 'warning');
        return;
      }

      const newPromo = {
        id: 'promo_' + Date.now(),
        code,
        description: desc,
        type,
        value,
        minOrder,
        active: true,
        vendorId: vendor.id,
        startDate,
        endDate
      };

      allPromos.unshift(newPromo);
      Storage.savePromotions(allPromos);

      Utils.showToast(`Promotion code ${code} is now live!`, 'success');
      modalWrap.innerHTML = '';
      renderPromos();
    });
  };

  // Toggle active/inactive
  window.togglePromoStatus = function(promoId) {
    const allPromos = Storage.getPromotions();
    const p = allPromos.find(x => x.id === promoId);
    if (p) {
      p.active = !p.active;
      Storage.savePromotions(allPromos);
      Utils.showToast(`Promo ${p.code} is now ${p.active ? 'active' : 'disabled'}.`, 'info');
      renderPromos();
    }
  };

  // Delete promo
  window.deletePromo = function(promoId) {
    if (!confirm('Are you sure you want to delete this promo code?')) return;
    let allPromos = Storage.getPromotions();
    allPromos = allPromos.filter(x => x.id !== promoId);
    Storage.savePromotions(allPromos);
    Utils.showToast('Promo code deleted.', 'info');
    renderPromos();
  };

  createBtn.addEventListener('click', openPromoModal);
});

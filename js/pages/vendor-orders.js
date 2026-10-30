/**
 * pages/vendor-orders.js - Vendor order management and delivery pipeline progression
 */

document.addEventListener('DOMContentLoaded', () => {
  Components.init();

  if (!Auth.requireRole(['vendor'])) return;

  const user = Auth.getUser();
  const vendors = Storage.getVendors();
  let vendor = vendors.find(v => v.id === user.vendorId || (v.ownerEmail && v.ownerEmail.toLowerCase() === user.email.toLowerCase()));

  if (!vendor) vendor = vendors[0];

  const container = document.getElementById('vendor-orders-list-container');
  const filterTabs = document.querySelectorAll('.order-filter-tab');
  let currentFilter = 'all';

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => {
        t.classList.remove('btn-primary', 'active');
        t.classList.add('btn-outline');
      });
      tab.classList.remove('btn-outline');
      tab.classList.add('btn-primary', 'active');
      currentFilter = tab.dataset.filter;
      renderOrders();
    });
  });

  function renderOrders() {
    const allVendorOrders = Orders.getForVendor(vendor.id);
    let filtered = allVendorOrders;

    if (currentFilter !== 'all') {
      filtered = allVendorOrders.filter(o => o.status === currentFilter);
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h2 class="empty-state-title">No orders found</h2>
          <p class="empty-state-desc">There are currently no orders in the "${currentFilter}" stage for ${vendor.name}.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        ${filtered.map(order => {
          const myItems = order.items.filter(i => i.vendorId === vendor.id);
          const myTotal = myItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
          const steps = Orders.PIPELINE_STEPS;
          const currentIdx = steps.indexOf(order.status);
          const canAdvance = currentIdx >= 0 && currentIdx < steps.length - 1;
          const nextStepName = canAdvance ? steps[currentIdx + 1] : null;

          return `
            <div class="card" style="padding: 20px;">
              <!-- Header -->
              <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid var(--border-light); padding-bottom: 12px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <strong style="font-size: 1.15rem; color: var(--accent-primary);">Order #${order.id}</strong>
                    ${Utils.getStatusBadge(order.status)}
                  </div>
                  <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
                    Placed: ${Utils.formatDateTime(order.date)} &bull; Customer: <strong>${Utils.escapeHtml(order.customerName)}</strong> (${Utils.escapeHtml(order.locality)})
                  </div>
                </div>

                <div style="text-align: right;">
                  <div style="font-size: 1.15rem; font-weight: 700;">
                    ${Utils.formatCurrency(myTotal)} <small style="font-size: 0.75rem; color: var(--text-muted);">(Your items)</small>
                  </div>
                  <span class="badge ${order.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}">
                    ${order.paymentStatus}
                  </span>
                </div>
              </div>

              <!-- Content Grid: Items & Address -->
              <div style="display: grid; grid-template-columns: 1.8fr 1.2fr; gap: 20px; margin-bottom: 18px;">
                <!-- Store Items in this order -->
                <div>
                  <h4 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">
                    Items to Fulfill:
                  </h4>
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${myItems.map(item => `
                      <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-subtle); padding: 8px 12px; border-radius: var(--radius-sm);">
                        <div style="display: flex; align-items: center; gap: 10px;">
                          <img src="${item.image}" style="width: 36px; height: 36px; border-radius: 4px; object-fit: cover;">
                          <div>
                            <strong style="font-size: 0.88rem;">${Utils.escapeHtml(item.name)}</strong>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">Qty: <strong>${item.quantity}</strong> &times; ${Utils.formatCurrency(item.price)}</div>
                          </div>
                        </div>
                        <strong style="font-size: 0.9rem;">${Utils.formatCurrency(item.price * item.quantity)}</strong>
                      </div>
                    `).join('')}
                  </div>
                </div>

                <!-- Customer Address & Note -->
                <div style="background: var(--bg-surface); border: 1px solid var(--border-light); padding: 12px; border-radius: var(--radius-sm); font-size: 0.84rem; line-height: 1.45;">
                  <h4 style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">
                    Delivery Information:
                  </h4>
                  <div><strong>${Utils.escapeHtml(order.customerName)}</strong></div>
                  <div>${Utils.escapeHtml(order.address)}</div>
                  <div>📍 ${Utils.escapeHtml(order.locality)}</div>
                  <div>Phone: ${Utils.escapeHtml(order.phone)}</div>
                  ${order.notes ? `
                    <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--border-light); color: var(--text-main);">
                      <em>Courier Note: "${Utils.escapeHtml(order.notes)}"</em>
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- Pipeline Progression Footer -->
              <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; border-top: 1px solid var(--border-light); padding-top: 14px; background: var(--bg-subtle); margin: -20px -20px -20px -20px; padding: 14px 20px; border-radius: 0 0 var(--radius-md) var(--radius-md);">
                <div style="font-size: 0.84rem;">
                  Current Pipeline Stage: <strong style="color: var(--accent-primary);">${order.status}</strong>
                </div>

                <div style="display: flex; gap: 8px;">
                  ${canAdvance ? `
                    <button class="btn btn-sm btn-primary" onclick="advanceOrder('${order.id}', '${nextStepName}')">
                      Advance to &ldquo;${nextStepName}&rdquo; &rarr;
                    </button>
                  ` : `
                    <span class="badge badge-success" style="padding: 6px 10px;">${order.status === 'Delivered' ? '✓ Delivered' : order.status}</span>
                  `}

                  ${order.status !== 'Delivered' && order.status !== 'Cancelled' ? `
                    <button class="btn btn-sm btn-outline text-danger" onclick="cancelOrder('${order.id}')">
                      Reject / Cancel
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  window.advanceOrder = function(orderId, nextStep) {
    const res = Orders.advanceStatus(orderId, nextStep);
    if (res.success) {
      Utils.showToast(`Order #${orderId} moved to stage: ${nextStep}`, 'success');
      renderOrders();
    } else {
      Utils.showToast(res.message, 'warning');
    }
  };

  window.cancelOrder = function(orderId) {
    const reason = prompt('Please enter reason for rejecting/cancelling this order:', 'Item out of season / harvest unavailable');
    if (!reason) return;

    const res = Orders.cancelOrder(orderId, reason);
    if (res.success) {
      Utils.showToast(`Order #${orderId} cancelled. Stock restored.`, 'info');
      renderOrders();
    }
  };

  renderOrders();
});

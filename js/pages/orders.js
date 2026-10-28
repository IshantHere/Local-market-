/**
 * pages/orders.js - Customer orders list view
 */

document.addEventListener('DOMContentLoaded', () => {
  Components.init();

  if (!Auth.requireRole(['customer', 'vendor', 'admin'])) return;

  const user = Auth.getUser();
  const container = document.getElementById('customer-orders-container');

  function renderOrdersList() {
    const orders = Orders.getForCustomer(user.email);

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <h2 class="empty-state-title">No orders found</h2>
          <p class="empty-state-desc">You haven't placed any orders with local vendors yet.</p>
          <a href="products.html" class="btn btn-primary">Browse Fresh Produce & Goods</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${orders.map(order => {
          const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
          return `
            <div class="card" style="padding: 20px;">
              <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; border-bottom: 1px solid var(--border-light); padding-bottom: 12px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <strong style="font-size: 1.05rem; color: var(--accent-primary);">#${order.id}</strong>
                    ${Utils.getStatusBadge(order.status)}
                  </div>
                  <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
                    Placed on ${Utils.formatDateTime(order.date)} &bull; ${order.paymentMethod} (${order.paymentStatus})
                  </div>
                </div>

                <div style="text-align: right;">
                  <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-main);">
                    ${Utils.formatCurrency(order.total)}
                  </div>
                  <div style="font-size: 0.78rem; color: var(--text-muted);">
                    ${itemCount} item${itemCount === 1 ? '' : 's'}
                  </div>
                </div>
              </div>

              <!-- Items preview -->
              <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                  ${order.items.slice(0, 4).map(item => `
                    <div style="display: flex; align-items: center; gap: 6px; background: var(--bg-subtle); padding: 4px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-light);">
                      <img src="${item.image}" style="width: 28px; height: 28px; border-radius: 2px; object-fit: cover;">
                      <span style="font-size: 0.82rem; font-weight: 500;">${Utils.escapeHtml(item.name)} &times; ${item.quantity}</span>
                    </div>
                  `).join('')}
                  ${order.items.length > 4 ? `
                    <span style="font-size: 0.8rem; color: var(--text-muted);">+${order.items.length - 4} more</span>
                  ` : ''}
                </div>

                <div>
                  <a href="order.html?id=${order.id}" class="btn btn-sm btn-primary">
                    View Order & Track Delivery &rarr;
                  </a>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderOrdersList();
});

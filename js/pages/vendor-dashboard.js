/**
 * pages/vendor-dashboard.js - Vendor overview stats, low stock warnings, and recent store activity.
 */

document.addEventListener('DOMContentLoaded', () => {
  Components.init();

  if (!Auth.requireRole(['vendor'])) return;

  const user = Auth.getUser();
  const vendors = Storage.getVendors();
  let vendor = vendors.find(v => v.id === user.vendorId || (v.ownerEmail && v.ownerEmail.toLowerCase() === user.email.toLowerCase()));

  // Fallback if not linked, link to first or create
  if (!vendor) {
    vendor = vendors[0];
  }

  // Header Title & Meta
  document.getElementById('vendor-store-title').textContent = `${vendor.name} Dashboard`;
  document.getElementById('vendor-store-meta').textContent = `📍 ${vendor.locality} • Category: ${vendor.category} • Status: ${vendor.isOpen ? 'Open for Orders' : 'Temporarily Closed'}`;

  // Vendor's products
  const allProducts = Storage.getProducts();
  const vendorProducts = allProducts.filter(p => p.vendorId === vendor.id);

  // Vendor's orders
  const vendorOrders = Orders.getForVendor(vendor.id);

  // Calculate metrics
  const totalSales = vendorOrders.reduce((sum, order) => {
    const myItems = order.items.filter(i => i.vendorId === vendor.id);
    const orderSum = myItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    return sum + orderSum;
  }, 0);

  const pendingOrders = vendorOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
  const lowStockProducts = vendorProducts.filter(p => p.stock <= 5);

  // 1. Low Stock Alert Banner
  const lowStockAlert = document.getElementById('vendor-low-stock-alert');
  if (lowStockProducts.length > 0) {
    lowStockAlert.innerHTML = `
      <div style="background: var(--warning-light); border: 1px solid var(--warning); padding: 14px 18px; border-radius: var(--radius-md); margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 1.4rem;">⚠️</span>
          <div>
            <strong style="color: var(--warning); font-size: 0.95rem;">
              Low Stock Warning (${lowStockProducts.length} item${lowStockProducts.length === 1 ? '' : 's'})
            </strong>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 2px;">
              ${lowStockProducts.map(p => `<strong>${Utils.escapeHtml(p.name)}</strong> (${p.stock} left)`).join(', ')}.
            </p>
          </div>
        </div>
        <a href="vendor-products.html" class="btn btn-sm btn-outline">Restock Inventory &rarr;</a>
      </div>
    `;
  } else {
    lowStockAlert.innerHTML = '';
  }

  // 2. Stat Cards Grid
  const statsGrid = document.getElementById('vendor-stats-grid');
  statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Store Revenue</div>
      <div class="stat-value" style="color: var(--accent-primary);">${Utils.formatCurrency(totalSales)}</div>
      <div class="stat-hint">Across ${vendorOrders.length} customer order(s)</div>
    </div>

    <div class="stat-card">
      <div class="stat-label">Pending Deliveries</div>
      <div class="stat-value" style="color: var(--warning);">${pendingOrders.length}</div>
      <div class="stat-hint">Active pipeline orders</div>
    </div>

    <div class="stat-card">
      <div class="stat-label">Active Catalog Items</div>
      <div class="stat-value">${vendorProducts.length}</div>
      <div class="stat-hint">In ${vendor.category}</div>
    </div>

    <div class="stat-card">
      <div class="stat-label">Customer Rating</div>
      <div class="stat-value" style="color: var(--rating-gold);">${vendor.rating.toFixed(1)} ★</div>
      <div class="stat-hint">${vendor.reviewCount} total customer reviews</div>
    </div>
  `;

  // 3. Recent Orders List
  const recentOrdersList = document.getElementById('vendor-recent-orders-list');
  if (vendorOrders.length === 0) {
    recentOrdersList.innerHTML = `
      <div class="empty-state" style="padding: 24px; border: none;">
        <p style="color: var(--text-muted); font-size: 0.9rem;">No orders placed for your store yet.</p>
      </div>
    `;
  } else {
    recentOrdersList.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Items for you</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${vendorOrders.slice(0, 5).map(o => {
            const myItems = o.items.filter(i => i.vendorId === vendor.id);
            return `
              <tr>
                <td><strong>#${o.id}</strong></td>
                <td>
                  <div>${Utils.escapeHtml(o.customerName)}</div>
                  <small style="color: var(--text-muted);">${Utils.escapeHtml(o.locality)}</small>
                </td>
                <td>
                  <small>${myItems.map(i => `${i.quantity}x ${Utils.escapeHtml(i.name)}`).join(', ')}</small>
                </td>
                <td>${Utils.getStatusBadge(o.status)}</td>
                <td>
                  <a href="vendor-orders.html" class="btn btn-sm btn-outline">Update &rarr;</a>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  // 4. Store Status Card
  const storeStatusCard = document.getElementById('vendor-store-status-card');
  storeStatusCard.innerHTML = `
    <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">Store Operational Status</h3>
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
      <div>
        <span class="badge ${vendor.isOpen ? 'badge-success' : 'badge-secondary'}">
          ${vendor.isOpen ? '● Currently Open' : '○ Temporarily Closed'}
        </span>
      </div>
      <a href="vendor-store.html" style="font-size: 0.8rem; font-weight: 600;">Edit Settings &rarr;</a>
    </div>
    <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.45;">
      When marked open, your items appear in the marketplace search and catalog. You can close temporarily for holidays or farm harvests.
    </p>
  `;

  // 5. Active Promotions Mini List
  const promosMiniList = document.getElementById('vendor-promos-mini-list');
  const promos = Storage.getPromotions().filter(p => p.active && (p.vendorId === vendor.id || p.vendorId === 'all'));
  if (promos.length === 0) {
    promosMiniList.innerHTML = `<p style="font-size: 0.82rem; color: var(--text-muted);">No active promos. Create a discount code to boost sales!</p>`;
  } else {
    promosMiniList.innerHTML = promos.map(p => `
      <div style="padding: 8px; background: var(--bg-subtle); border-radius: var(--radius-sm); margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="font-family: var(--font-mono); color: var(--accent-primary); font-size: 0.88rem;">${p.code}</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${p.type === 'percent' ? `${p.value}% OFF` : `₹${p.value} OFF`} (Min ₹${p.minOrder})</div>
        </div>
        <span class="badge badge-success" style="font-size: 0.65rem;">Active</span>
      </div>
    `).join('');
  }
});

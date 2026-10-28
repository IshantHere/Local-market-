/**
 * pages/admin.js - Marketplace administration, moderation, and platform oversight controller
 */

document.addEventListener('DOMContentLoaded', () => {
  Components.init();

  if (!Auth.requireRole(['admin'])) return;

  // Tab switching
  const tabs = document.querySelectorAll('.admin-tab-btn');
  const tabContents = document.querySelectorAll('.admin-tab-content');

  function switchTab(tabId) {
    tabs.forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-primary', 'active');
      } else {
        btn.classList.remove('btn-primary', 'active');
        btn.classList.add('btn-outline');
      }
    });

    tabContents.forEach(content => {
      content.style.display = content.id === tabId ? 'block' : 'none';
    });
  }

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
      window.location.hash = btn.dataset.tab;
    });
  });

  // Check URL hash on load
  const hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById(hash)) {
    switchTab(hash);
  }

  // 1. Stats Grid
  function renderStats() {
    const users = Storage.getUsers();
    const vendors = Storage.getVendors();
    const products = Storage.getProducts();
    const orders = Storage.getOrders();

    const platformRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'Paid' ? o.total : 0), 0);

    document.getElementById('admin-stats-grid').innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Platform Gross Revenue</div>
        <div class="stat-value" style="color: var(--accent-primary);">${Utils.formatCurrency(platformRevenue)}</div>
        <div class="stat-hint">${orders.length} total orders placed</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Registered Vendors</div>
        <div class="stat-value">${vendors.length}</div>
        <div class="stat-hint">${vendors.filter(v => v.status === 'approved').length} approved stores</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Catalog Products</div>
        <div class="stat-value">${products.length}</div>
        <div class="stat-hint">${products.filter(p => p.status === 'active').length} active listings</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Registered Users</div>
        <div class="stat-value">${users.length}</div>
        <div class="stat-hint">Customers, vendors & staff</div>
      </div>
    `;
  }

  // 2. Vendors Moderation
  function renderVendors() {
    const vendors = Storage.getVendors();
    const tableWrap = document.getElementById('admin-vendors-table-wrap');

    tableWrap.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Store / Brand</th>
              <th>Owner Contact</th>
              <th>Locality</th>
              <th>Category</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Moderation Action</th>
            </tr>
          </thead>
          <tbody>
            ${vendors.map(v => {
              const isApproved = v.status === 'approved';
              return `
                <tr>
                  <td>
                    <strong>${Utils.escapeHtml(v.name)}</strong>
                    <div style="font-size: 0.74rem; color: var(--text-muted);">${v.isOpen ? '● Open today' : '○ Closed'}</div>
                  </td>
                  <td>
                    <small>${v.contactEmail || v.ownerEmail}</small>
                    <div style="font-size: 0.74rem; color: var(--text-muted);">${v.phone || 'No phone'}</div>
                  </td>
                  <td>📍 ${Utils.escapeHtml(v.locality)}</td>
                  <td><span class="badge badge-secondary">${Utils.escapeHtml(v.category)}</span></td>
                  <td>${Utils.renderStars(v.rating, v.reviewCount)}</td>
                  <td>
                    <span class="badge ${isApproved ? 'badge-success' : 'badge-danger'}">
                      ${v.status}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-sm ${isApproved ? 'btn-outline text-danger' : 'btn-primary'}" onclick="toggleVendorStatus('${v.id}')">
                      ${isApproved ? 'Suspend Store' : 'Approve Store'}
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  window.toggleVendorStatus = function(vendorId) {
    const vendors = Storage.getVendors();
    const v = vendors.find(x => x.id === vendorId);
    if (!v) return;

    if (v.status === 'approved') {
      if (!confirm(`Suspend "${v.name}"? Their products will be hidden from the public marketplace.`)) return;
      v.status = 'suspended';
      v.isOpen = false;
      Utils.showToast(`Vendor ${v.name} suspended.`, 'warning');
    } else {
      v.status = 'approved';
      v.isOpen = true;
      Utils.showToast(`Vendor ${v.name} approved.`, 'success');
    }

    Storage.saveVendors(vendors);
    renderVendors();
    renderStats();
  };

  // 3. Products Moderation
  function renderProducts(searchQuery = '') {
    const products = Storage.getProducts();
    const vendors = Storage.getVendors();
    const tableWrap = document.getElementById('admin-products-table-wrap');

    const filtered = products.filter(p => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    });

    tableWrap.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Vendor</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(p => {
              const v = vendors.find(x => x.id === p.vendorId) || { name: 'Unknown' };
              const isActive = p.status === 'active';
              return `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <img src="${p.image}" style="width: 32px; height: 32px; border-radius: 4px; object-fit: cover;">
                      <a href="product.html?id=${p.id}" target="_blank"><strong>${Utils.escapeHtml(p.name)}</strong></a>
                    </div>
                  </td>
                  <td><small>${Utils.escapeHtml(v.name)}</small></td>
                  <td><span class="badge badge-secondary">${Utils.escapeHtml(p.category)}</span></td>
                  <td><strong>${Utils.formatCurrency(p.price)}</strong></td>
                  <td>${p.stock} units</td>
                  <td>
                    <span class="badge ${isActive ? 'badge-success' : 'badge-secondary'}">
                      ${p.status}
                    </span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn btn-sm btn-outline" onclick="toggleProductStatus('${p.id}')">
                        ${isActive ? 'Hide Listing' : 'Show Listing'}
                      </button>
                      <button class="btn btn-sm btn-outline text-danger" onclick="adminDeleteProduct('${p.id}')">
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  const prodSearch = document.getElementById('admin-product-search');
  if (prodSearch) {
    prodSearch.addEventListener('input', (e) => renderProducts(e.target.value));
  }

  window.toggleProductStatus = function(productId) {
    const products = Storage.getProducts();
    const p = products.find(x => x.id === productId);
    if (!p) return;
    p.status = p.status === 'active' ? 'hidden' : 'active';
    Storage.saveProducts(products);
    Utils.showToast(`Product is now ${p.status}.`, 'info');
    renderProducts(prodSearch ? prodSearch.value : '');
    renderStats();
  };

  window.adminDeleteProduct = function(productId) {
    if (!confirm('Are you sure you want to completely delete this product?')) return;
    let products = Storage.getProducts();
    products = products.filter(x => x.id !== productId);
    Storage.saveProducts(products);
    Utils.showToast('Product removed.', 'info');
    renderProducts(prodSearch ? prodSearch.value : '');
    renderStats();
  };

  // 4. All Orders Audit
  function renderOrders() {
    const orders = Storage.getOrders();
    const tableWrap = document.getElementById('admin-orders-table-wrap');

    tableWrap.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Delivery Area</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(o => `
              <tr>
                <td><strong>#${o.id}</strong></td>
                <td><small>${Utils.formatDateTime(o.date)}</small></td>
                <td>
                  <strong>${Utils.escapeHtml(o.customerName)}</strong>
                  <div style="font-size: 0.74rem; color: var(--text-muted);">${o.customerEmail}</div>
                </td>
                <td>${Utils.escapeHtml(o.locality)}</td>
                <td style="font-weight: 700;">${Utils.formatCurrency(o.total)}</td>
                <td><span class="badge ${o.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}">${o.paymentMethod}</span></td>
                <td>${Utils.getStatusBadge(o.status)}</td>
                <td>
                  <a href="order.html?id=${o.id}" class="btn btn-sm btn-outline">Audit &rarr;</a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // 5. Category Management
  function renderCategories() {
    const categories = Storage.getCategories();
    const list = document.getElementById('admin-categories-list');

    list.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${categories.map(cat => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-subtle); border-radius: var(--radius-sm); border: 1px solid var(--border-light);">
            <strong>${cat}</strong>
            <button class="btn btn-sm btn-outline text-danger" onclick="deleteCategory('${cat}')">&times; Delete</button>
          </div>
        `).join('')}
      </div>
    `;
  }

  const addCatForm = document.getElementById('admin-add-category-form');
  if (addCatForm) {
    addCatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = document.getElementById('new-cat-name').value.trim();
      if (!val) return;

      const cats = Storage.getCategories();
      if (cats.some(c => c.toLowerCase() === val.toLowerCase())) {
        Utils.showToast('Category already exists.', 'warning');
        return;
      }
      cats.push(val);
      Storage.saveCategories(cats);
      Utils.showToast(`Category "${val}" added!`, 'success');
      document.getElementById('new-cat-name').value = '';
      renderCategories();
    });
  }

  window.deleteCategory = function(catName) {
    if (!confirm(`Delete category "${catName}"?`)) return;
    let cats = Storage.getCategories();
    cats = cats.filter(c => c !== catName);
    Storage.saveCategories(cats);
    Utils.showToast('Category removed.', 'info');
    renderCategories();
  };

  // 6. Promotions Moderation
  function renderPromos() {
    const promos = Storage.getPromotions();
    const tableWrap = document.getElementById('admin-promos-table-wrap');

    tableWrap.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th>Discount</th>
              <th>Scope</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${promos.map(p => `
              <tr>
                <td><strong style="font-family: var(--font-mono); color: var(--accent-primary);">${p.code}</strong></td>
                <td>${Utils.escapeHtml(p.description)}</td>
                <td>${p.type === 'percent' ? `${p.value}%` : Utils.formatCurrency(p.value)}</td>
                <td><span class="badge ${p.vendorId === 'all' ? 'badge-primary' : 'badge-secondary'}">${p.vendorId === 'all' ? 'Platform-wide' : 'Vendor Specific'}</span></td>
                <td><span class="badge ${p.active ? 'badge-success' : 'badge-secondary'}">${p.active ? 'Active' : 'Disabled'}</span></td>
                <td>
                  <button class="btn btn-sm btn-outline" onclick="adminTogglePromo('${p.id}')">
                    ${p.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  window.adminTogglePromo = function(promoId) {
    const promos = Storage.getPromotions();
    const p = promos.find(x => x.id === promoId);
    if (!p) return;
    p.active = !p.active;
    Storage.savePromotions(promos);
    Utils.showToast(`Promo ${p.code} is now ${p.active ? 'active' : 'disabled'}.`, 'info');
    renderPromos();
  };

  // 7. Users Directory
  function renderUsers() {
    const users = Storage.getUsers();
    const tableWrap = document.getElementById('admin-users-table-wrap');

    tableWrap.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td><strong>${Utils.escapeHtml(u.name)}</strong></td>
                <td>${u.email}</td>
                <td>
                  <span class="badge ${u.role === 'admin' ? 'badge-danger' : (u.role === 'vendor' ? 'badge-warning' : 'badge-success')}">
                    ${u.role}
                  </span>
                </td>
                <td>${u.phone || 'N/A'}</td>
                <td><small>${u.joinedDate || '2026-10-01'}</small></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Initial calls
  renderStats();
  renderVendors();
  renderProducts();
  renderOrders();
  renderCategories();
  renderPromos();
  renderUsers();
});

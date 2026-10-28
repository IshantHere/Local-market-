/**
 * components.js - Shared Header, Navigation, Footer, and Demo Switcher.
 * Automatically injects the UI chrome on every page for consistent look and navigation.
 */

const Components = {
  init() {
    // 1. Initialize data storage if needed
    Storage.init();

    // 2. Render Header & Footer
    this.renderHeader();
    this.renderFooter();

    // 3. Attach global listeners
    this.bindEvents();
    this.updateCounters();
  },

  renderHeader() {
    const headerContainer = document.getElementById('site-header');
    if (!headerContainer) return;

    const user = Auth.getUser();
    const categories = Storage.getCategories();
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    // Top announcement & quick demo switcher bar
    const topBarHtml = `
      <div class="top-announcement-bar">
        <div class="container top-bar-content">
          <div class="top-announcement-text">
            <span class="pulse-dot"></span> Supporting neighborhood small vendors &bull; Use code <strong>LOCAL10</strong> for 10% off
          </div>
          <div class="demo-account-switcher">
            <span class="switcher-label">Switch Demo Role:</span>
            <button class="switcher-btn ${user && user.role === 'customer' ? 'active' : ''}" onclick="Auth.quickSwitch('customer@demo.com')">
              Customer
            </button>
            <button class="switcher-btn ${user && user.role === 'vendor' ? 'active' : ''}" onclick="Auth.quickSwitch('vendor@demo.com')">
              Vendor
            </button>
            <button class="switcher-btn ${user && user.role === 'admin' ? 'active' : ''}" onclick="Auth.quickSwitch('admin@demo.com')">
              Admin
            </button>
          </div>
        </div>
      </div>
    `;

    // User authentication links
    let authNavHtml = '';
    if (!user) {
      authNavHtml = `
        <div class="header-auth-group">
          <a href="login.html" class="nav-link btn-link">Sign In</a>
          <a href="register.html" class="btn btn-sm btn-outline">Register</a>
        </div>
      `;
    } else {
      let roleSpecificLinks = '';
      if (user.role === 'customer') {
        roleSpecificLinks = `
          <a href="orders.html" class="dropdown-item">My Orders</a>
          <a href="compare.html" class="dropdown-item">Compare Products</a>
        `;
      } else if (user.role === 'vendor') {
        roleSpecificLinks = `
          <a href="vendor-dashboard.html" class="dropdown-item">Vendor Dashboard</a>
          <a href="vendor-products.html" class="dropdown-item">My Products</a>
          <a href="vendor-orders.html" class="dropdown-item">Store Orders</a>
          <a href="vendor-promos.html" class="dropdown-item">Promotions</a>
          <a href="vendor-store.html" class="dropdown-item">Store Settings</a>
        `;
      } else if (user.role === 'admin') {
        roleSpecificLinks = `
          <a href="admin.html" class="dropdown-item">Admin Dashboard</a>
          <a href="admin.html#vendors-tab" class="dropdown-item">Manage Vendors</a>
          <a href="admin.html#products-tab" class="dropdown-item">Moderate Products</a>
          <a href="admin.html#orders-tab" class="dropdown-item">All Orders</a>
        `;
      }

      authNavHtml = `
        <div class="header-user-dropdown" id="user-menu-wrapper">
          <button class="user-menu-btn" id="user-menu-toggle" aria-expanded="false">
            <span class="user-avatar-circle">${user.name.charAt(0)}</span>
            <div class="user-name-wrapper">
              <span class="user-greeting-name">${Utils.escapeHtml(user.name)}</span>
              <span class="user-role-badge role-${user.role}">${user.role}</span>
            </div>
            <span class="dropdown-arrow">&#9662;</span>
          </button>
          <div class="user-dropdown-menu" id="user-dropdown-menu">
            <div class="dropdown-header">
              <strong>${Utils.escapeHtml(user.name)}</strong>
              <small>${user.email}</small>
            </div>
            <hr class="dropdown-divider">
            ${roleSpecificLinks}
            <a href="notifications.html" class="dropdown-item">Notifications</a>
            <hr class="dropdown-divider">
            <button class="dropdown-item text-danger" onclick="Auth.logout()">Log Out</button>
          </div>
        </div>
      `;
    }

    // Category navigation links
    let categoryLinksHtml = `<a href="products.html" class="category-nav-link ${currentPath === 'products.html' && !Utils.getUrlParam('cat') ? 'active' : ''}">All Products</a>`;
    categories.forEach(cat => {
      const isSelected = Utils.getUrlParam('cat') === cat;
      categoryLinksHtml += `<a href="products.html?cat=${encodeURIComponent(cat)}" class="category-nav-link ${isSelected ? 'active' : ''}">${cat}</a>`;
    });

    // Check if role is vendor or admin to show quick shortcut in header
    let portalShortcut = '';
    if (user && user.role === 'vendor') {
      portalShortcut = `<a href="vendor-dashboard.html" class="portal-badge-link">Vendor Studio &rarr;</a>`;
    } else if (user && user.role === 'admin') {
      portalShortcut = `<a href="admin.html" class="portal-badge-link admin-pill">Admin Console &rarr;</a>`;
    }

    headerContainer.innerHTML = `
      ${topBarHtml}
      <header class="main-header">
        <div class="container header-container">
          <!-- Logo -->
          <div class="header-logo-group">
            <a href="index.html" class="site-logo">
              <span class="logo-leaf">🌿</span>
              <span class="logo-text">Local<strong>Market</strong></span>
            </a>
            ${portalShortcut}
          </div>

          <!-- Search Bar -->
          <div class="header-search-bar">
            <form id="global-search-form" action="products.html" method="GET" class="search-form">
              <input 
                type="text" 
                name="q" 
                id="global-search-input" 
                class="search-input" 
                placeholder="Search local produce, bakery, crafts..." 
                value="${Utils.escapeHtml(Utils.getUrlParam('q') || '')}"
              />
              <button type="submit" class="search-submit-btn" aria-label="Search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </button>
            </form>
          </div>

          <!-- Utility Icons / Actions -->
          <div class="header-actions">
            <!-- Compare Link -->
            <a href="compare.html" class="action-icon-link" title="Compare Products" id="header-compare-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
              <span class="badge-count" id="header-compare-count" style="display: none;">0</span>
            </a>

            <!-- Notifications Bell -->
            <a href="notifications.html" class="action-icon-link" title="Notifications" id="header-notif-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <span class="badge-count" id="header-notif-count" style="display: none;">0</span>
            </a>

            <!-- Cart Icon -->
            <a href="cart.html" class="action-icon-link cart-action-link" title="Shopping Cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              <span class="cart-label">Cart</span>
              <span class="badge-count" id="header-cart-count">0</span>
            </a>

            <!-- User Auth -->
            ${authNavHtml}
          </div>
        </div>
      </header>

      <!-- Category Navigation Strip -->
      <nav class="category-nav-bar">
        <div class="container category-nav-container">
          <div class="category-links-scroll">
            ${categoryLinksHtml}
          </div>
        </div>
      </nav>
    `;
  },

  renderFooter() {
    const footerContainer = document.getElementById('site-footer');
    if (!footerContainer) return;

    footerContainer.innerHTML = `
      <footer class="main-footer">
        <div class="container footer-container">
          <div class="footer-grid">
            <!-- Col 1 -->
            <div class="footer-col">
              <div class="footer-logo">
                <span class="logo-leaf">🌿</span>
                <span class="logo-text">Local<strong>Market</strong></span>
              </div>
              <p class="footer-desc">
                Connecting neighborhood families directly with nearby organic growers, artisan bakers, farm creamers, and independent craftspeople.
              </p>
              <div class="demo-tag">CSE 326 CA-2 Project </div>
            </div>

            <!-- Col 2 -->
            <div class="footer-col">
              <h4 class="footer-heading">Shop by Category</h4>
              <ul class="footer-links">
                <li><a href="products.html?cat=Fresh+Produce">Fresh Produce</a></li>
                <li><a href="products.html?cat=Bakery">Artisan Bakery</a></li>
                <li><a href="products.html?cat=Dairy+%26+Eggs">Dairy & Eggs</a></li>
                <li><a href="products.html?cat=Pantry+%26+Groceries">Pantry & Groceries</a></li>
                <li><a href="products.html?cat=Handmade+Crafts">Handmade Crafts</a></li>
              </ul>
            </div>

            <!-- Col 3 -->
            <div class="footer-col">
              <h4 class="footer-heading">Vendor & Community</h4>
              <ul class="footer-links">
                <li><a href="register.html?role=vendor">Open a Vendor Store</a></li>
                <li><a href="vendor-dashboard.html">Vendor Studio</a></li>
                <li><a href="orders.html">Track Deliveries</a></li>
                <li><a href="compare.html">Product Comparison</a></li>
                <li><a href="admin.html">Platform Administration</a></li>
              </ul>
            </div>

            <!-- Col 4 
            <div class="footer-col">
              <h4 class="footer-heading">Active Demo Accounts</h4>
              <p class="footer-small-text">
                Password for all demo accounts: <code>demo123</code>
              </p>
              <div class="demo-credential-box">
                <div><strong>Customer:</strong> customer@demo.com</div>
                <div><strong>Vendor:</strong> vendor@demo.com</div>
                <div><strong>Admin:</strong> admin@demo.com</div>
              </div>
              <div class="footer-reset-btn-wrapper">
                <button class="btn btn-sm btn-outline text-muted" onclick="Storage.resetDemoData()">
                  &#8635; Reset All Demo Data
                </button>
              </div>
            </div>
          </div> -->

          <div class="footer-bottom-bar">
            <p>&copy; ${new Date().getFullYear()} Local Market Online Store. Built with HTML, CSS, and JavaScript.</p>
            <div class="footer-bottom-links">
              <span></span> &bull;
              <span></span>
            </div>
          </div>
        </div>
      </footer>
    `;
  },

  bindEvents() {
    // Dropdown toggle
    const toggleBtn = document.getElementById('user-menu-toggle');
    const menu = document.getElementById('user-dropdown-menu');

    if (toggleBtn && menu) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
      });

      document.addEventListener('click', () => {
        menu.classList.remove('show');
      });
    }

    // Listen for cart and compare updates
    window.addEventListener('cart-updated', () => this.updateCounters());
    window.addEventListener('compare-updated', () => this.updateCounters());
  },

  updateCounters() {
    // 1. Cart Count
    const cartCountEl = document.getElementById('header-cart-count');
    if (cartCountEl) {
      const count = Cart.getCount();
      cartCountEl.textContent = count;
      cartCountEl.style.display = count > 0 ? 'inline-block' : 'inline-block';
    }

    // 2. Compare Count
    const compareCountEl = document.getElementById('header-compare-count');
    if (compareCountEl) {
      const count = Compare.getCount();
      compareCountEl.textContent = count;
      compareCountEl.style.display = count > 0 ? 'inline-block' : 'none';
    }

    // 3. Notification Count
    const notifCountEl = document.getElementById('header-notif-count');
    if (notifCountEl) {
      const user = Auth.getUser();
      const count = user ? Notifications.getUnreadCount(user.email) : 0;
      notifCountEl.textContent = count;
      notifCountEl.style.display = count > 0 ? 'inline-block' : 'none';
    }
  }
};

window.Components = Components;

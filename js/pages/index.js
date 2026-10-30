/**
 * pages/index.js - Homepage controller
 */

document.addEventListener('DOMContentLoaded', () => {
  Components.init();

  const productsGrid = document.getElementById('featured-products-grid');
  const vendorsGrid = document.getElementById('home-vendors-grid');

  const products = Storage.getProducts();
  const vendors = Storage.getVendors();

  // 1. Render Featured Products
  if (productsGrid) {
    const featured = products.filter(p => p.featured && p.status === 'active');
    // If fewer than 6 featured, pad with active products
    const displayList = featured.length >= 4 ? featured : products.slice(0, 8);

    if (displayList.length === 0) {
      productsGrid.innerHTML = '<div class="empty-state">No products currently available.</div>';
    } else {
      productsGrid.innerHTML = displayList.map(prod => {
        const vendor = vendors.find(v => v.id === prod.vendorId) || { name: 'Local Vendor', locality: '' };
        const isOutOfStock = prod.stock <= 0;
        const isLowStock = prod.stock > 0 && prod.stock <= 5;
        
        let stockLabel = `${prod.stock} in stock`;
        let stockClass = '';
        if (isOutOfStock) {
          stockLabel = 'Out of Stock';
          stockClass = 'out-of-stock';
        } else if (isLowStock) {
          stockLabel = `Only ${prod.stock} left`;
          stockClass = 'low-stock';
        }

        return `
          <div class="product-card" data-product-id="${prod.id}">
            <div class="product-card-img-wrap">
              <img src="${prod.image}" alt="${Utils.escapeHtml(prod.name)}" loading="lazy">
              <span class="product-card-badge">${Utils.escapeHtml(prod.category)}</span>
              <button class="product-card-compare-btn" title="Compare this product" onclick="Compare.add('${prod.id}')">
                &#8644;
              </button>
            </div>
            <div class="product-card-body">
              <a href="products.html?vendor=${prod.vendorId}" class="product-vendor-link">
                📍 ${Utils.escapeHtml(vendor.name)}
              </a>
              <h3 class="product-card-title">
                <a href="product.html?id=${prod.id}">${Utils.escapeHtml(prod.name)}</a>
              </h3>
              <div class="product-card-rating">
                ${Utils.renderStars(prod.rating, prod.reviewCount)}
              </div>
              <div class="product-card-footer">
                <div class="product-price-block">
                  <span class="product-price">${Utils.formatCurrency(prod.price)}</span>
                  <span class="product-stock-hint ${stockClass}">${stockLabel}</span>
                </div>
                <button 
                  class="btn btn-sm btn-primary" 
                  onclick="Cart.addItem('${prod.id}', 1)"
                  ${isOutOfStock ? 'disabled' : ''}
                >
                  ${isOutOfStock ? 'Sold Out' : '+ Add'}
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 2. Render Nearby Vendors
  if (vendorsGrid) {
    const activeVendors = vendors.filter(v => v.status === 'approved');
    if (activeVendors.length === 0) {
      vendorsGrid.innerHTML = '<div class="empty-state">No vendors found.</div>';
    } else {
      vendorsGrid.innerHTML = activeVendors.map(v => {
        const vendorProds = products.filter(p => p.vendorId === v.id && p.status === 'active');
        return `
          <div class="vendor-card">
            <div class="vendor-card-header">
              <h3 class="vendor-card-title">
                <a href="products.html?vendor=${v.id}">${Utils.escapeHtml(v.name)}</a>
              </h3>
              <span class="badge ${v.isOpen ? 'badge-success' : 'badge-secondary'}">
                ${v.isOpen ? 'Open Today' : 'Closed'}
              </span>
            </div>
            <div class="vendor-card-meta">
              <span>📍 ${Utils.escapeHtml(v.locality)}</span> &bull;
              <span>🏷️ ${Utils.escapeHtml(v.category)}</span>
            </div>
            <p class="vendor-card-bio">${Utils.escapeHtml(v.bio)}</p>
            <div class="vendor-card-footer">
              <div>
                ${Utils.renderStars(v.rating, v.reviewCount)}
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                  ${vendorProds.length} product(s) in catalog
                </div>
              </div>
              <a href="products.html?vendor=${v.id}" class="btn btn-sm btn-outline">
                Visit Store &rarr;
              </a>
            </div>
          </div>
        `;
      }).join('');
    }
  }
});

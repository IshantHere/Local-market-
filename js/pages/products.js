/**
 * pages/products.js - Catalog controller with category, vendor, price, in-stock filtering & sorting.
 */

document.addEventListener('DOMContentLoaded', () => {
  Components.init();

  const productsGrid = document.getElementById('products-catalog-grid');
  const resultsCountEl = document.getElementById('catalog-results-count');
  const pageTitleEl = document.getElementById('catalog-page-title');
  const sortSelect = document.getElementById('sort-select');
  const sidebarSearch = document.getElementById('sidebar-search');
  const categoryFiltersContainer = document.getElementById('category-filters-container');
  const vendorFiltersContainer = document.getElementById('vendor-filters-container');
  const priceSlider = document.getElementById('price-slider');
  const priceDisplay = document.getElementById('price-slider-display');
  const inStockCheckbox = document.getElementById('in-stock-only');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');

  const allProducts = Storage.getProducts();
  const allVendors = Storage.getVendors();
  const allCategories = Storage.getCategories();

  // Read URL params
  const initialQuery = Utils.getUrlParam('q') || '';
  const initialCat = Utils.getUrlParam('cat') || '';
  const initialVendor = Utils.getUrlParam('vendor') || '';

  if (sidebarSearch) sidebarSearch.value = initialQuery;

  // 1. Populate Category checkboxes
  if (categoryFiltersContainer) {
    categoryFiltersContainer.innerHTML = allCategories.map(cat => {
      const checked = initialCat && initialCat.toLowerCase() === cat.toLowerCase() ? 'checked' : '';
      return `
        <label class="filter-checkbox-label">
          <input type="checkbox" name="category" value="${cat}" ${checked}>
          <span>${cat}</span>
        </label>
      `;
    }).join('');
  }

  // 2. Populate Vendor checkboxes
  if (vendorFiltersContainer) {
    vendorFiltersContainer.innerHTML = allVendors.map(v => {
      const checked = initialVendor === v.id ? 'checked' : '';
      return `
        <label class="filter-checkbox-label">
          <input type="checkbox" name="vendor" value="${v.id}" ${checked}>
          <span>${v.name}</span>
        </label>
      `;
    }).join('');
  }

  // 3. Update Price Display
  if (priceSlider && priceDisplay) {
    priceSlider.addEventListener('input', () => {
      priceDisplay.textContent = `₹${priceSlider.value}`;
      renderFilteredProducts();
    });
  }

  // 4. Attach event listeners
  [sidebarSearch, sortSelect, inStockCheckbox].forEach(el => {
    if (el) el.addEventListener('input', renderFilteredProducts);
  });

  if (categoryFiltersContainer) {
    categoryFiltersContainer.addEventListener('change', renderFilteredProducts);
  }
  if (vendorFiltersContainer) {
    vendorFiltersContainer.addEventListener('change', renderFilteredProducts);
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      if (sidebarSearch) sidebarSearch.value = '';
      if (priceSlider) {
        priceSlider.value = 800;
        priceDisplay.textContent = '₹800';
      }
      if (inStockCheckbox) inStockCheckbox.checked = false;
      if (sortSelect) sortSelect.value = 'default';

      document.querySelectorAll('input[name="category"]').forEach(cb => cb.checked = false);
      document.querySelectorAll('input[name="vendor"]').forEach(cb => cb.checked = false);

      // Clean URL without reloading
      window.history.replaceState({}, '', 'products.html');
      renderFilteredProducts();
    });
  }

  // Render products function
  function renderFilteredProducts() {
    // Collect active filters
    const query = (sidebarSearch ? sidebarSearch.value : '').trim().toLowerCase();
    const maxPrice = priceSlider ? parseFloat(priceSlider.value) : 10000;
    const inStockOnly = inStockCheckbox ? inStockCheckbox.checked : false;
    const sortVal = sortSelect ? sortSelect.value : 'default';

    const selectedCategories = Array.from(
      document.querySelectorAll('input[name="category"]:checked')
    ).map(cb => cb.value.toLowerCase());

    const selectedVendors = Array.from(
      document.querySelectorAll('input[name="vendor"]:checked')
    ).map(cb => cb.value);

    // Filter
    let filtered = allProducts.filter(p => {
      // Must not be hidden by admin
      if (p.status !== 'active') return false;

      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.category.toLowerCase())) {
        return false;
      }

      // Vendor filter
      if (selectedVendors.length > 0 && !selectedVendors.includes(p.vendorId)) {
        return false;
      }

      // Price filter
      if (p.price > maxPrice) return false;

      // In-stock filter
      if (inStockOnly && p.stock <= 0) return false;

      // Text query
      if (query) {
        const vendor = allVendors.find(v => v.id === p.vendorId) || { name: '' };
        const matchName = p.name.toLowerCase().includes(query);
        const matchDesc = p.description.toLowerCase().includes(query);
        const matchVendor = vendor.name.toLowerCase().includes(query);
        const matchCat = p.category.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchVendor && !matchCat) return false;
      }

      return true;
    });

    // Sort
    if (sortVal === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortVal === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortVal === 'rating-high') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortVal === 'name-asc') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Update title / counter
    if (resultsCountEl) {
      resultsCountEl.textContent = `Showing ${filtered.length} product${filtered.length === 1 ? '' : 's'}`;
    }

    if (pageTitleEl) {
      if (selectedCategories.length === 1) {
        pageTitleEl.textContent = selectedCategories[0];
      } else if (selectedVendors.length === 1) {
        const v = allVendors.find(x => x.id === selectedVendors[0]);
        pageTitleEl.textContent = v ? `${v.name}'s Catalog` : 'Vendor Products';
      } else {
        pageTitleEl.textContent = 'All Local Market Products';
      }
    }

    // Render Grid
    if (!productsGrid) return;

    if (filtered.length === 0) {
      productsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🔍</div>
          <h3 class="empty-state-title">No matching products found</h3>
          <p class="empty-state-desc">Try adjusting your filters, clearing the search term, or browsing our full category list.</p>
          <button class="btn btn-outline btn-sm" onclick="document.getElementById('reset-filters-btn').click()">Reset Filters</button>
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = filtered.map(prod => {
      const vendor = allVendors.find(v => v.id === prod.vendorId) || { name: 'Local Vendor' };
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

  // Initial render
  renderFilteredProducts();
});

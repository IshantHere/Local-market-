/**
 * pages/vendor-products.js - Vendor catalog CRUD and inventory stock controller
 */

document.addEventListener('DOMContentLoaded', () => {
  Components.init();

  if (!Auth.requireRole(['vendor'])) return;

  const user = Auth.getUser();
  const vendors = Storage.getVendors();
  let vendor = vendors.find(v => v.id === user.vendorId || (v.ownerEmail && v.ownerEmail.toLowerCase() === user.email.toLowerCase()));

  if (!vendor) vendor = vendors[0];

  const tableWrap = document.getElementById('vendor-products-table-wrap');
  const modalContainer = document.getElementById('product-modal-container');
  const openAddBtn = document.getElementById('open-add-product-btn');

  function renderTable() {
    const allProducts = Storage.getProducts();
    const vendorProducts = allProducts.filter(p => p.vendorId === vendor.id);

    if (vendorProducts.length === 0) {
      tableWrap.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <h2 class="empty-state-title">No products in your catalog yet</h2>
          <p class="empty-state-desc">Start adding your seasonal harvest, artisan bakes, or handcrafted items to start receiving orders.</p>
          <button class="btn btn-primary" onclick="openProductModal()">+ Add Your First Product</button>
        </div>
      `;
      return;
    }

    tableWrap.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Product Details</th>
              <th>Category</th>
              <th>Price</th>
              <th>Inventory Stock</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${vendorProducts.map(p => {
              const isLow = p.stock <= 5 && p.stock > 0;
              const isOut = p.stock <= 0;
              let stockBadge = `<span class="badge badge-success">${p.stock} units</span>`;
              if (isOut) stockBadge = `<span class="badge badge-danger">Out of Stock (0)</span>`;
              else if (isLow) stockBadge = `<span class="badge badge-warning">Low: ${p.stock} left</span>`;

              return `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <img src="${p.image}" style="width: 44px; height: 44px; border-radius: 4px; object-fit: cover; flex-shrink: 0; background: var(--bg-subtle);">
                      <div>
                        <strong>${Utils.escapeHtml(p.name)}</strong>
                        <div style="font-size: 0.76rem; color: var(--text-muted); max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          ${Utils.escapeHtml(p.description)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><span class="badge badge-secondary">${Utils.escapeHtml(p.category)}</span></td>
                  <td style="font-weight: 700;">${Utils.formatCurrency(p.price)}</td>
                  <td>${stockBadge}</td>
                  <td>${Utils.renderStars(p.rating, p.reviewCount)}</td>
                  <td>
                    <span class="badge ${p.status === 'active' ? 'badge-primary' : 'badge-secondary'}">
                      ${p.status}
                    </span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn btn-sm btn-outline" onclick="openProductModal('${p.id}')">Edit</button>
                      <button class="btn btn-sm btn-outline text-danger" onclick="deleteProduct('${p.id}')">Delete</button>
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

  renderTable();

  // Open Modal for Add or Edit
  window.openProductModal = function(productId = null) {
    const isEdit = !!productId;
    const categories = Storage.getCategories();
    let product = {
      id: '',
      name: '',
      category: vendor.category || 'Fresh Produce',
      price: '',
      stock: 10,
      description: '',
      status: 'active'
    };

    if (isEdit) {
      const found = Storage.getProductById(productId);
      if (found) product = { ...found };
    }

    modalContainer.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">${isEdit ? 'Edit Product' : 'Add New Local Product'}</h3>
            <button class="modal-close-btn" onclick="document.getElementById('product-modal-container').innerHTML=''">&times;</button>
          </div>
          <form id="vendor-product-form" novalidate>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Product Title *</label>
                <input type="text" id="modal-p-name" class="form-control" value="${Utils.escapeHtml(product.name)}" placeholder="e.g. Heirloom Honeycrisp Apples (1 kg)" required minlength="3">
              </div>

              <div class="form-row">
                <div class="form-group form-col">
                  <label class="form-label">Category *</label>
                  <select id="modal-p-cat" class="form-control">
                    ${categories.map(c => `<option value="${c}" ${c === product.category ? 'selected' : ''}>${c}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group form-col">
                  <label class="form-label">Price (₹) *</label>
                  <input type="number" id="modal-p-price" class="form-control" step="1" min="1" value="${product.price}" placeholder="120" required>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group form-col">
                  <label class="form-label">Available Stock (Units) *</label>
                  <input type="number" id="modal-p-stock" class="form-control" min="0" value="${product.stock}" required>
                </div>
                <div class="form-group form-col">
                  <label class="form-label">Catalog Status</label>
                  <select id="modal-p-status" class="form-control">
                    <option value="active" ${product.status === 'active' ? 'selected' : ''}>Active (Visible)</option>
                    <option value="hidden" ${product.status === 'hidden' ? 'selected' : ''}>Hidden (Draft)</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Description & Sourcing Details *</label>
                <textarea id="modal-p-desc" class="form-control" rows="3" placeholder="Describe taste, harvest method, or ingredients..." required minlength="10">${Utils.escapeHtml(product.description)}</textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Illustration Icon Style</label>
                <select id="modal-p-icon" class="form-control">
                  <option value="tomato">Tomato / Fresh Veg</option>
                  <option value="spinach">Spinach / Greens</option>
                  <option value="apples">Apples / Orchard Fruit</option>
                  <option value="bread">Sourdough Loaf</option>
                  <option value="buns">Pastry / Buns</option>
                  <option value="eggs">Pasture Farm Eggs</option>
                  <option value="cheese">Aged Farm Cheese</option>
                  <option value="butter">Cultured Butter</option>
                  <option value="milk">Whole Glass Milk</option>
                  <option value="honey">Wildflower Honey</option>
                  <option value="oil">Cold-Pressed Olive Oil</option>
                  <option value="jam">Fruit Jam / Preserves</option>
                  <option value="mug">Ceramic Pottery Mug</option>
                  <option value="candle">Beeswax Candle</option>
                  <option value="towels">Woven Linen Towels</option>
                </select>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-sm btn-outline" onclick="document.getElementById('product-modal-container').innerHTML=''">Cancel</button>
              <button type="submit" class="btn btn-sm btn-primary">${isEdit ? 'Update Product' : 'Add to Catalog'}</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('vendor-product-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('modal-p-name').value.trim();
      const cat = document.getElementById('modal-p-cat').value;
      const price = parseFloat(document.getElementById('modal-p-price').value);
      const stock = parseInt(document.getElementById('modal-p-stock').value, 10);
      const status = document.getElementById('modal-p-status').value;
      const desc = document.getElementById('modal-p-desc').value.trim();
      const iconKey = document.getElementById('modal-p-icon').value;

      if (!name || isNaN(price) || isNaN(stock) || !desc) {
        Utils.showToast('Please fill all required fields.', 'warning');
        return;
      }

      const allProds = Storage.getProducts();

      // Generate SVG placeholder
      const iconSvg = ICONS[iconKey] || ICONS.tomato;
      const generatedImage = makeProductSvg(name.substring(0, 16), '#f1f5f9', iconSvg);

      if (isEdit) {
        const idx = allProds.findIndex(p => p.id === productId);
        if (idx !== -1) {
          allProds[idx] = {
            ...allProds[idx],
            name,
            category: cat,
            price,
            stock,
            status,
            description: desc,
            image: allProds[idx].image || generatedImage
          };
          Storage.saveProducts(allProds);
          Utils.showToast('Product updated successfully.', 'success');
        }
      } else {
        const newProduct = {
          id: 'p_' + Date.now(),
          vendorId: vendor.id,
          name,
          category: cat,
          price,
          stock,
          description: desc,
          image: generatedImage,
          rating: 5.0,
          reviewCount: 0,
          featured: false,
          status
        };
        allProds.unshift(newProduct);
        Storage.saveProducts(allProds);
        Utils.showToast('New product added to your catalog!', 'success');
      }

      modalContainer.innerHTML = '';
      renderTable();
    });
  };

  // Delete product
  window.deleteProduct = function(productId) {
    if (!confirm('Are you sure you want to permanently remove this product from your store catalog?')) {
      return;
    }

    let allProds = Storage.getProducts();
    allProds = allProds.filter(p => p.id !== productId);
    Storage.saveProducts(allProds);

    Utils.showToast('Product deleted.', 'info');
    renderTable();
  };

  openAddBtn.addEventListener('click', () => openProductModal());
});

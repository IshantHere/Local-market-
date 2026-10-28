/**
 * pages/compare.js - Side-by-side comparison table
 */

document.addEventListener('DOMContentLoaded', () => {
  Components.init();

  const container = document.getElementById('compare-table-container');
  const clearBtn = document.getElementById('clear-compare-btn');

  function renderComparison() {
    const items = Compare.getItems();
    const vendors = Storage.getVendors();

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚖️</div>
          <h2 class="empty-state-title">No products in comparison</h2>
          <p class="empty-state-desc">You haven't added any products to compare yet. Click the compare icon (⇄) on any product card in our catalog.</p>
          <a href="products.html" class="btn btn-primary">Browse Catalog</a>
        </div>
      `;
      if (clearBtn) clearBtn.style.display = 'none';
      return;
    }

    if (clearBtn) clearBtn.style.display = 'inline-block';

    const colWidth = `${100 / (items.length + 1)}%`;

    let html = `
      <div style="background: #fff; border: 1px solid var(--border-light); border-radius: var(--radius-md); overflow-x: auto;">
        <table class="data-table" style="table-layout: fixed;">
          <colgroup>
            <col style="width: 180px;">
            ${items.map(() => `<col style="width: 260px;">`).join('')}
          </colgroup>
          <tbody>
            <!-- Row: Image & Name -->
            <tr>
              <th style="vertical-align: top;">Product</th>
              ${items.map(p => `
                <td style="vertical-align: top; text-align: center; padding: 18px;">
                  <div style="aspect-ratio: 4/3; width: 140px; margin: 0 auto 10px auto; border-radius: var(--radius-sm); overflow: hidden; background: var(--bg-subtle);">
                    <img src="${p.image}" alt="${Utils.escapeHtml(p.name)}" style="width: 100%; height: 100%; object-fit: cover;">
                  </div>
                  <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 6px;">
                    <a href="product.html?id=${p.id}">${Utils.escapeHtml(p.name)}</a>
                  </h3>
                  <button class="btn btn-sm btn-outline text-danger" style="margin-top: 4px;" onclick="Compare.remove('${p.id}')">
                    &times; Remove
                  </button>
                </td>
              `).join('')}
            </tr>

            <!-- Row: Price -->
            <tr>
              <th>Price</th>
              ${items.map(p => `
                <td style="font-size: 1.15rem; font-weight: 700; color: var(--accent-primary); text-align: center;">
                  ${Utils.formatCurrency(p.price)}
                </td>
              `).join('')}
            </tr>

            <!-- Row: Vendor & Locality -->
            <tr>
              <th>Vendor & Area</th>
              ${items.map(p => {
                const v = vendors.find(x => x.id === p.vendorId) || { name: 'Local Maker', locality: 'Local' };
                return `
                  <td style="text-align: center;">
                    <strong>${Utils.escapeHtml(v.name)}</strong>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">📍 ${Utils.escapeHtml(v.locality)}</div>
                  </td>
                `;
              }).join('')}
            </tr>

            <!-- Row: Category -->
            <tr>
              <th>Category</th>
              ${items.map(p => `
                <td style="text-align: center;">
                  <span class="badge badge-secondary">${Utils.escapeHtml(p.category)}</span>
                </td>
              `).join('')}
            </tr>

            <!-- Row: Stock Status -->
            <tr>
              <th>Inventory Status</th>
              ${items.map(p => {
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock > 0 && p.stock <= 5;
                if (isOutOfStock) return `<td style="text-align: center;"><span class="badge badge-danger">Out of Stock</span></td>`;
                if (isLowStock) return `<td style="text-align: center;"><span class="badge badge-warning">Only ${p.stock} units</span></td>`;
                return `<td style="text-align: center;"><span class="badge badge-success">${p.stock} units in stock</span></td>`;
              }).join('')}
            </tr>

            <!-- Row: Rating -->
            <tr>
              <th>Customer Rating</th>
              ${items.map(p => `
                <td style="text-align: center;">
                  ${Utils.renderStars(p.rating, p.reviewCount)}
                </td>
              `).join('')}
            </tr>

            <!-- Row: Description -->
            <tr>
              <th style="vertical-align: top;">Description</th>
              ${items.map(p => `
                <td style="font-size: 0.84rem; color: var(--text-muted); line-height: 1.45;">
                  ${Utils.escapeHtml(p.description)}
                </td>
              `).join('')}
            </tr>

            <!-- Row: Action -->
            <tr>
              <th>Action</th>
              ${items.map(p => `
                <td style="text-align: center; padding: 16px;">
                  <button 
                    class="btn btn-sm btn-primary" 
                    onclick="Cart.addItem('${p.id}', 1)"
                    ${p.stock <= 0 ? 'disabled' : ''}
                  >
                    ${p.stock <= 0 ? 'Sold Out' : '🛒 Add to Cart'}
                  </button>
                </td>
              `).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;
  }

  renderComparison();

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      Compare.clear();
      renderComparison();
    });
  }

  window.addEventListener('compare-updated', renderComparison);
});

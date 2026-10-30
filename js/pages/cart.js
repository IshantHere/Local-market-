/**
 * pages/cart.js - Cart rendering, quantity changes, promo code application, and summary calculation.
 */

document.addEventListener('DOMContentLoaded', () => {
  Components.init();

  const container = document.getElementById('cart-content-wrapper');

  function renderCart() {
    const totals = Cart.getCalculatedTotals();

    if (totals.items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🛒</div>
          <h2 class="empty-state-title">Your basket is currently empty</h2>
          <p class="empty-state-desc">Explore hand-harvested organic produce, sourdough bread, fresh farm dairy, and artisanal crafts from local makers.</p>
          <a href="products.html" class="btn btn-primary">Start Shopping</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 28px; align-items: flex-start;">
        <!-- Left: Cart Items Table -->
        <div style="background: #fff; border: 1px solid var(--border-light); border-radius: var(--radius-md); overflow: hidden;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${totals.items.map(item => `
                  <tr>
                    <td>
                      <div class="cart-item-cell">
                        <img src="${item.product.image}" alt="${Utils.escapeHtml(item.product.name)}" class="cart-item-img">
                        <div>
                          <a href="product.html?id=${item.product.id}" style="font-weight: 600; color: var(--text-main); display: block;">
                            ${Utils.escapeHtml(item.product.name)}
                          </a>
                          <small style="color: var(--text-muted);">
                            By ${Utils.escapeHtml(item.vendor.name)}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td style="font-weight: 600;">
                      ${Utils.formatCurrency(item.product.price)}
                    </td>
                    <td>
                      <div class="qty-control">
                        <button type="button" class="qty-btn" onclick="Cart.updateQuantity('${item.product.id}', ${item.quantity - 1})">&minus;</button>
                        <input type="number" class="qty-input" value="${item.quantity}" min="1" max="${item.product.stock}" onchange="Cart.updateQuantity('${item.product.id}', this.value)">
                        <button type="button" class="qty-btn" onclick="Cart.updateQuantity('${item.product.id}', ${item.quantity + 1})">&plus;</button>
                      </div>
                    </td>
                    <td style="font-weight: 700; color: var(--accent-primary);">
                      ${Utils.formatCurrency(item.lineTotal)}
                    </td>
                    <td>
                      <button class="btn-link text-danger" title="Remove Item" onclick="Cart.removeItem('${item.product.id}')">
                        &times;
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div style="padding: 14px 18px; border-top: 1px solid var(--border-light); background: var(--bg-subtle); display: flex; justify-content: space-between; align-items: center;">
            <a href="products.html" style="font-size: 0.88rem; font-weight: 600;">&larr; Continue Shopping</a>
            <button class="btn btn-sm btn-outline text-danger" onclick="Cart.clear()">Clear Basket</button>
          </div>
        </div>

        <!-- Right: Order Summary & Voucher -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Promo Code Box -->
          <div class="card">
            <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 10px;">Apply Promotion Code</h3>
            ${totals.promo ? `
              <div style="background: var(--accent-light); border: 1px solid var(--accent-border); padding: 10px 12px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <strong style="color: var(--accent-primary); font-family: var(--font-mono); font-size: 0.95rem;">${totals.promo.code}</strong>
                  <div style="font-size: 0.78rem; color: var(--text-muted);">${totals.promo.description}</div>
                </div>
                <button class="btn btn-sm btn-outline text-danger" style="padding: 2px 6px;" id="remove-promo-btn">&times;</button>
              </div>
            ` : `
              <form id="promo-form" style="display: flex; gap: 8px;">
                <input type="text" id="promo-code-input" class="form-control" placeholder="Try LOCAL10" style="text-transform: uppercase; font-family: var(--font-mono); font-size: 0.88rem;">
                <button type="submit" class="btn btn-outline" style="white-space: nowrap; padding: 6px 14px;">Apply</button>
              </form>
              <small style="color: var(--text-muted); font-size: 0.75rem; margin-top: 6px; display: block;">
                Hint: Enter <strong>LOCAL10</strong> for 10% off (min ₹200)
              </small>
            `}
          </div>

          <!-- Totals Breakdown Card -->
          <div class="card">
            <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid var(--border-light);">
              Order Summary
            </h3>
            <div style="display: flex; flex-direction: column; gap: 10px; font-size: 0.9rem;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Basket Subtotal (${totals.itemCount} items)</span>
                <strong>${Utils.formatCurrency(totals.subtotal)}</strong>
              </div>

              ${totals.discount > 0 ? `
                <div style="display: flex; justify-content: space-between; color: var(--success);">
                  <span>Promo Discount (${totals.promo ? totals.promo.code : ''})</span>
                  <strong>-${Utils.formatCurrency(totals.discount)}</strong>
                </div>
              ` : ''}

              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Neighborhood Delivery</span>
                <span>
                  ${totals.deliveryFee === 0 ? '<strong style="color: var(--success);">FREE</strong>' : Utils.formatCurrency(totals.deliveryFee)}
                </span>
              </div>
              ${totals.subtotal < 500 ? `
                <small style="color: var(--text-muted); font-size: 0.75rem;">
                  Add ${Utils.formatCurrency(500 - totals.subtotal)} more for free delivery!
                </small>
              ` : ''}

              <hr style="border: none; border-top: 1px solid var(--border-light); margin: 6px 0;">

              <div style="display: flex; justify-content: space-between; font-size: 1.15rem; font-weight: 700; color: var(--text-main);">
                <span>Total Amount</span>
                <span style="color: var(--accent-primary);">${Utils.formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>

            <a href="checkout.html" class="btn btn-primary btn-block" style="margin-top: 18px; padding: 12px;">
              Proceed to Delivery Checkout &rarr;
            </a>
          </div>
        </div>
      </div>
    `;

    // Attach promo listeners
    const promoForm = document.getElementById('promo-form');
    if (promoForm) {
      promoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = document.getElementById('promo-code-input').value.trim();
        const res = Cart.applyPromo(code);
        if (res.success) {
          Utils.showToast(res.message, 'success');
        } else {
          Utils.showToast(res.message, 'warning');
        }
        renderCart();
      });
    }

    const removePromoBtn = document.getElementById('remove-promo-btn');
    if (removePromoBtn) {
      removePromoBtn.addEventListener('click', () => {
        Cart.removePromo();
        Utils.showToast('Promo code removed.', 'info');
        renderCart();
      });
    }
  }

  renderCart();
  window.addEventListener('cart-updated', renderCart);
});

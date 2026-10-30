/**
 * pages/order.js - Order details, delivery pipeline tracking, and customer review submission.
 */

document.addEventListener('DOMContentLoaded', () => {
  Components.init();

  if (!Auth.requireRole(['customer', 'vendor', 'admin'])) return;

  const orderId = Utils.getUrlParam('id');
  const container = document.getElementById('order-detail-view');
  const user = Auth.getUser();

  if (!orderId) {
    window.location.href = 'orders.html';
    return;
  }

  function renderOrderDetail() {
    const order = Orders.getById(orderId);

    if (!order) {
      container.innerHTML = `
        <div class="empty-state">
          <h2 class="empty-state-title">Order Not Found</h2>
          <p class="empty-state-desc">The requested order #${Utils.escapeHtml(orderId)} does not exist in local records.</p>
          <a href="orders.html" class="btn btn-primary">Back to Orders</a>
        </div>
      `;
      return;
    }

    document.getElementById('breadcrumb-order-id').textContent = `#${order.id}`;

    // Delivery pipeline stepper calculation
    const steps = Orders.PIPELINE_STEPS;
    const currentStepIndex = steps.indexOf(order.status);
    const isCancelled = order.status === 'Cancelled' || order.status === 'Rejected';

    let stepperHtml = '';
    if (isCancelled) {
      stepperHtml = `
        <div style="background: var(--danger-light); border: 1px solid var(--danger); padding: 16px; border-radius: var(--radius-md); text-align: center; margin: 20px 0;">
          <strong style="color: var(--danger); font-size: 1.1rem;">Order Cancelled / Rejected</strong>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">This order was cancelled. Any reservation or charge has been restored.</p>
        </div>
      `;
    } else {
      stepperHtml = `
        <div class="pipeline-stepper">
          ${steps.map((step, idx) => {
            let stepClass = '';
            if (idx < currentStepIndex) stepClass = 'completed';
            else if (idx === currentStepIndex) stepClass = 'current';

            return `
              <div class="pipeline-step ${stepClass}">
                <div class="step-circle">
                  ${idx < currentStepIndex ? '✓' : (idx + 1)}
                </div>
                <span class="step-label">${step}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    container.innerHTML = `
      <!-- Header Banner -->
      <div class="card" style="margin-bottom: 24px;">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-bottom: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <h1 style="font-size: 1.35rem; font-weight: 700; color: var(--text-main);">Order #${order.id}</h1>
              ${Utils.getStatusBadge(order.status)}
            </div>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
              Placed on ${Utils.formatDateTime(order.date)} &bull; ${order.items.length} items
            </div>
          </div>

          <div style="text-align: right;">
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-primary);">
              ${Utils.formatCurrency(order.total)}
            </div>
            <span class="badge ${order.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}">
              ${order.paymentStatus} via ${order.paymentMethod}
            </span>
          </div>
        </div>

        <!-- Visual Delivery Stepper -->
        ${stepperHtml}
      </div>

      <!-- Main Columns: Tracking Events & Items Details -->
      <div style="display: grid; grid-template-columns: 1.3fr 1.7fr; gap: 24px; align-items: flex-start;">
        <!-- Left: Delivery Timeline & Shipping Details -->
        <div style="display: flex; flex-direction: column; gap: 18px;">
          <!-- Timeline Log -->
          <div class="card">
            <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid var(--border-light);">
              🚚 Delivery Progress History
            </h3>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${(order.trackingHistory || []).slice().reverse().map(event => `
                <div style="display: flex; gap: 12px; font-size: 0.86rem; border-left: 2px solid var(--accent-primary); padding-left: 12px; margin-left: 6px;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <strong style="color: var(--text-main);">${event.step}</strong>
                      <small style="color: var(--text-muted); font-size: 0.74rem;">${Utils.formatDateTime(event.timestamp)}</small>
                    </div>
                    <p style="color: var(--text-muted); font-size: 0.82rem; margin-top: 2px;">${Utils.escapeHtml(event.note)}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Destination Card -->
          <div class="card">
            <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 10px;">📍 Delivery Destination</h3>
            <div style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5;">
              <div><strong style="color: var(--text-main);">${Utils.escapeHtml(order.customerName)}</strong></div>
              <div>${Utils.escapeHtml(order.address)}</div>
              <div>${Utils.escapeHtml(order.locality)}, Local Metro</div>
              <div>Phone: ${Utils.escapeHtml(order.phone)}</div>
              ${order.notes ? `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-light); font-style: italic;">
                  Courier note: "${Utils.escapeHtml(order.notes)}"
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Payment Card -->
          <div class="card">
            <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 8px;">💳 Payment Information</h3>
            <div style="font-size: 0.88rem; color: var(--text-muted);">
              <div><strong>Method:</strong> ${order.paymentMethod}</div>
              <div><strong>Details:</strong> ${order.paymentDetails || 'Verified'}</div>
              <div><strong>Status:</strong> ${order.paymentStatus}</div>
            </div>
          </div>
        </div>

        <!-- Right: Ordered Items & Review Prompt -->
        <div style="display: flex; flex-direction: column; gap: 18px;">
          <!-- Items Table -->
          <div class="card" style="padding: 0; overflow: hidden;">
            <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-light);">
              <h3 style="font-size: 1.05rem; font-weight: 700;">Ordered Items</h3>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Vendor</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${item.image}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">
                        <a href="product.html?id=${item.productId}" style="font-weight: 600; color: var(--text-main);">
                          ${Utils.escapeHtml(item.name)}
                        </a>
                      </div>
                    </td>
                    <td>
                      <small style="color: var(--text-muted);">${Utils.escapeHtml(item.vendorName)}</small>
                    </td>
                    <td>${Utils.formatCurrency(item.price)}</td>
                    <td style="font-weight: 600;">${item.quantity}</td>
                    <td style="font-weight: 700;">${Utils.formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Financial Summary -->
            <div style="padding: 16px 20px; background: var(--bg-subtle); border-top: 1px solid var(--border-light); font-size: 0.88rem;">
              <div style="display: flex; flex-direction: column; gap: 6px; max-width: 300px; margin-left: auto;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">Items Subtotal:</span>
                  <strong>${Utils.formatCurrency(order.subtotal)}</strong>
                </div>
                ${order.discount > 0 ? `
                  <div style="display: flex; justify-content: space-between; color: var(--success);">
                    <span>Discount (${order.promoCode || 'Voucher'}):</span>
                    <strong>-${Utils.formatCurrency(order.discount)}</strong>
                  </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">Neighborhood Delivery:</span>
                  <span>${order.deliveryFee === 0 ? 'FREE' : Utils.formatCurrency(order.deliveryFee)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 700; color: var(--accent-primary); border-top: 1px solid var(--border-light); padding-top: 8px;">
                  <span>Order Total:</span>
                  <span>${Utils.formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Product Reviews Card (If order is delivered) -->
          ${order.status === 'Delivered' ? `
            <div class="card" style="background: #fafbfa; border: 1px solid var(--accent-border);">
              <h3 style="font-size: 1rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 6px;">
                ⭐ Rate & Review Your Delivered Goods
              </h3>
              <p style="font-size: 0.84rem; color: var(--text-muted); margin-bottom: 14px;">
                Help your neighborhood vendors and fellow shoppers by reviewing your fresh items.
              </p>

              <div style="display: flex; flex-direction: column; gap: 12px;">
                ${order.items.map(item => {
                  const alreadyReviewed = (order.reviewedProductIds || []).includes(item.productId);
                  return `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: #fff; border: 1px solid var(--border-light); border-radius: var(--radius-sm);">
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <img src="${item.image}" style="width: 32px; height: 32px; border-radius: 4px; object-fit: cover;">
                        <strong style="font-size: 0.88rem;">${Utils.escapeHtml(item.name)}</strong>
                      </div>
                      ${alreadyReviewed ? `
                        <span class="badge badge-success">&#10003; Reviewed</span>
                      ` : `
                        <button class="btn btn-sm btn-outline" onclick="openReviewModal('${order.id}', '${item.productId}', '${Utils.escapeHtml(item.name)}')">
                          Write Review &rarr;
                        </button>
                      `}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : `
            <div class="card" style="background: var(--bg-subtle);">
              <p style="font-size: 0.85rem; color: var(--text-muted); text-align: center;">
                Reviews unlock once this delivery arrives at your door! Currently at stage: <strong>${order.status}</strong>.
              </p>
            </div>
          `}
        </div>
      </div>

      <!-- Review Modal Container -->
      <div id="order-review-modal-wrap"></div>
    `;
  }

  renderOrderDetail();

  // Review modal trigger
  window.openReviewModal = function(ordId, prodId, prodName) {
    const modalWrap = document.getElementById('order-review-modal-wrap');
    modalWrap.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Review ${Utils.escapeHtml(prodName)}</h3>
            <button class="modal-close-btn" onclick="document.getElementById('order-review-modal-wrap').innerHTML=''">&times;</button>
          </div>
          <form id="order-item-review-form">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Rating *</label>
                <select id="modal-rating-select" class="form-control">
                  <option value="5">★★★★★ - 5 (Excellent)</option>
                  <option value="4">★★★★☆ - 4 (Very Good)</option>
                  <option value="3">★★★☆☆ - 3 (Good)</option>
                  <option value="2">★★☆☆☆ - 2 (Fair)</option>
                  <option value="1">★☆☆☆☆ - 1 (Poor)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Your Comments *</label>
                <textarea id="modal-comment-text" class="form-control" rows="3" placeholder="How was the taste, packaging, and freshness?" required minlength="5"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-sm btn-outline" onclick="document.getElementById('order-review-modal-wrap').innerHTML=''">Cancel</button>
              <button type="submit" class="btn btn-sm btn-primary">Submit Review</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('order-item-review-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const rating = document.getElementById('modal-rating-select').value;
      const comment = document.getElementById('modal-comment-text').value;

      Orders.submitReview(ordId, prodId, rating, comment, user.name, user.email);
      Utils.showToast('Review recorded! Product rating updated.', 'success');
      modalWrap.innerHTML = '';
      renderOrderDetail();
    });
  };
});

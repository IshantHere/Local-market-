/**
 * pages/product.js - Product detail page and review management
 */

document.addEventListener('DOMContentLoaded', () => {
  Components.init();

  const productId = Utils.getUrlParam('id');
  if (!productId) {
    window.location.href = 'products.html';
    return;
  }

  const product = Storage.getProductById(productId);
  if (!product) {
    document.getElementById('product-detail-container').innerHTML = `
      <div class="empty-state">
        <h2 class="empty-state-title">Product Not Found</h2>
        <p class="empty-state-desc">This product may have been archived or removed by the vendor.</p>
        <a href="products.html" class="btn btn-primary">Return to Catalog</a>
      </div>
    `;
    return;
  }

  const vendor = Storage.getVendorById(product.vendorId) || { name: 'Local Vendor', locality: 'Neighbourhood' };
  const user = Auth.getUser();

  // Populate Breadcrumbs
  document.getElementById('breadcrumb-category').textContent = product.category;
  document.getElementById('breadcrumb-product-name').textContent = product.name;

  // Populate Details
  document.title = `${product.name} - Local Market`;
  document.getElementById('detail-img').src = product.image;
  document.getElementById('detail-img').alt = product.name;
  document.getElementById('detail-title').textContent = product.name;
  document.getElementById('detail-category-badge').textContent = product.category;
  document.getElementById('detail-description').textContent = product.description;
  document.getElementById('detail-price').textContent = Utils.formatCurrency(product.price);

  // Vendor link
  const vendorLink = document.getElementById('detail-vendor-link');
  vendorLink.textContent = `📍 ${vendor.name}`;
  vendorLink.href = `products.html?vendor=${vendor.id}`;
  document.getElementById('detail-vendor-locality').textContent = ` • ${vendor.locality}`;

  // Stock
  const stockBadge = document.getElementById('detail-stock-badge');
  const stockCount = document.getElementById('detail-stock-count');
  const addCartBtn = document.getElementById('detail-add-cart-btn');
  const qtyInput = document.getElementById('detail-qty');
  const qtyMinus = document.getElementById('qty-minus-btn');
  const qtyPlus = document.getElementById('qty-plus-btn');
  const qtyError = document.getElementById('qty-error');

  if (product.stock <= 0) {
    stockBadge.textContent = 'Out of Stock';
    stockBadge.className = 'badge badge-danger';
    stockCount.textContent = 'Currently unavailable from this maker.';
    addCartBtn.disabled = true;
    addCartBtn.textContent = 'Out of Stock';
    qtyInput.disabled = true;
    qtyMinus.disabled = true;
    qtyPlus.disabled = true;
  } else if (product.stock <= 5) {
    stockBadge.textContent = 'Low Stock';
    stockBadge.className = 'badge badge-warning';
    stockCount.textContent = `Hurry! Only ${product.stock} left in stock.`;
  } else {
    stockBadge.textContent = 'In Stock';
    stockBadge.className = 'badge badge-success';
    stockCount.textContent = `${product.stock} units available`;
  }

  // Ratings
  function renderRatingSummary() {
    const reviews = Storage.getReviewsForProduct(product.id);
    document.getElementById('detail-rating-wrapper').innerHTML = Utils.renderStars(product.rating, reviews.length);
    document.getElementById('reviews-summary-text').textContent = `${reviews.length} customer review(s) &bull; Average rating: ${product.rating.toFixed(1)} / 5.0`;
  }
  renderRatingSummary();

  // Compare Button
  document.getElementById('detail-compare-btn').addEventListener('click', () => {
    Compare.add(product.id);
  });

  // Quantity controls
  qtyMinus.addEventListener('click', () => {
    let current = parseInt(qtyInput.value, 10) || 1;
    if (current > 1) {
      qtyInput.value = current - 1;
      validateQty();
    }
  });

  qtyPlus.addEventListener('click', () => {
    let current = parseInt(qtyInput.value, 10) || 1;
    if (current < product.stock) {
      qtyInput.value = current + 1;
      validateQty();
    } else {
      Utils.showToast(`Cannot order more than available stock (${product.stock}).`, 'warning');
    }
  });

  qtyInput.addEventListener('change', validateQty);

  function validateQty() {
    let val = parseInt(qtyInput.value, 10) || 1;
    if (val < 1) val = 1;
    if (val > product.stock) {
      val = product.stock;
      qtyError.style.display = 'block';
      qtyError.textContent = `Maximum quantity available is ${product.stock}.`;
    } else {
      qtyError.style.display = 'none';
    }
    qtyInput.value = val;
  }

  // Add to Cart
  addCartBtn.addEventListener('click', () => {
    const qty = parseInt(qtyInput.value, 10) || 1;
    Cart.addItem(product.id, qty);
  });

  // Reviews logic
  const reviewsList = document.getElementById('product-reviews-list');
  const toggleReviewBtn = document.getElementById('toggle-review-form-btn');
  const reviewFormContainer = document.getElementById('review-form-container');
  const cancelReviewBtn = document.getElementById('cancel-review-btn');
  const reviewForm = document.getElementById('product-review-form');

  if (user) {
    document.getElementById('review-author-name').value = user.name;
  }

  toggleReviewBtn.addEventListener('click', () => {
    reviewFormContainer.style.display = reviewFormContainer.style.display === 'none' ? 'block' : 'none';
  });

  cancelReviewBtn.addEventListener('click', () => {
    reviewFormContainer.style.display = 'none';
  });

  // Render Reviews List
  function renderReviews() {
    const reviews = Storage.getReviewsForProduct(product.id);
    if (reviews.length === 0) {
      reviewsList.innerHTML = `
        <div class="empty-state" style="padding: 24px;">
          <p style="color: var(--text-muted); font-size: 0.9rem;">No reviews yet for this product. Be the first to share your thoughts!</p>
        </div>
      `;
      return;
    }

    reviewsList.innerHTML = reviews.map(rev => `
      <div style="padding: 14px; border: 1px solid var(--border-light); border-radius: var(--radius-sm); background: #fafafa;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <div>
            <strong>${Utils.escapeHtml(rev.customerName)}</strong>
            <span class="badge badge-success" style="margin-left: 6px; font-size: 0.65rem;">Verified Buyer</span>
          </div>
          <span style="font-size: 0.78rem; color: var(--text-muted);">${Utils.formatDate(rev.date)}</span>
        </div>
        <div style="margin-bottom: 6px;">
          ${Utils.renderStars(rev.rating)}
        </div>
        <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.45;">
          ${Utils.escapeHtml(rev.comment)}
        </p>
      </div>
    `).join('');
  }
  renderReviews();

  // Review submission
  reviewForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const authorName = document.getElementById('review-author-name').value.trim();
    const rating = parseInt(document.getElementById('review-rating-select').value, 10);
    const comment = document.getElementById('review-comment').value.trim();

    if (!authorName || !comment) {
      Utils.showToast('Please fill in your name and comment.', 'warning');
      return;
    }

    const reviews = Storage.getReviews();
    const newRev = {
      id: 'rev_' + Date.now(),
      productId: product.id,
      customerName: authorName,
      customerEmail: user ? user.email : 'guest@local.test',
      rating,
      comment,
      date: new Date().toISOString().split('T')[0]
    };
    reviews.unshift(newRev);
    Storage.saveReviews(reviews);

    // Recalculate average rating
    const prodReviews = reviews.filter(r => r.productId === product.id);
    const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
    product.rating = Math.round(avg * 10) / 10;
    product.reviewCount = prodReviews.length;

    const allProducts = Storage.getProducts();
    const idx = allProducts.findIndex(p => p.id === product.id);
    if (idx !== -1) {
      allProducts[idx] = product;
      Storage.saveProducts(allProducts);
    }

    Utils.showToast('Thank you! Your review has been posted.', 'success');
    reviewForm.reset();
    reviewFormContainer.style.display = 'none';

    renderRatingSummary();
    renderReviews();
  });
});

/**
 * pages/payment.js - Simulated payment processing, gateway format validation, and order placement.
 */

document.addEventListener('DOMContentLoaded', () => {
  Components.init();

  if (!Auth.requireRole(['customer', 'vendor', 'admin'])) return;

  const checkoutData = Storage.get('lmarket_active_checkout');
  const totals = Cart.getCalculatedTotals();

  if (!checkoutData || totals.items.length === 0) {
    Utils.showToast('No active checkout found.', 'warning');
    window.location.href = 'cart.html';
    return;
  }

  // Populate header displays
  document.getElementById('payment-amount-display').textContent = Utils.formatCurrency(totals.grandTotal);
  document.getElementById('payment-recipient-display').textContent = `Delivering to ${checkoutData.customerName}`;
  document.getElementById('payment-locality-display').textContent = `📍 ${checkoutData.locality}`;

  // Method switcher logic
  const methodCards = document.querySelectorAll('.payment-method-card');
  const sectionUpi = document.getElementById('section-upi');
  const sectionCard = document.getElementById('section-card');
  const sectionCod = document.getElementById('section-cod');
  let currentMethod = 'upi';

  methodCards.forEach(card => {
    card.addEventListener('click', () => {
      methodCards.forEach(c => {
        c.classList.remove('active');
        c.style.borderColor = 'var(--border-light)';
        c.style.backgroundColor = 'transparent';
      });

      card.classList.add('active');
      card.style.borderColor = 'var(--accent-primary)';
      card.style.backgroundColor = 'var(--accent-light)';

      const radio = card.querySelector('input[type="radio"]');
      radio.checked = true;
      currentMethod = card.dataset.method;

      // Toggle sections
      sectionUpi.style.display = currentMethod === 'upi' ? 'block' : 'none';
      sectionCard.style.display = currentMethod === 'card' ? 'block' : 'none';
      sectionCod.style.display = currentMethod === 'cod' ? 'block' : 'none';
    });
  });

  // Set initial active style
  const defaultActive = document.querySelector('.payment-method-card.active');
  if (defaultActive) {
    defaultActive.style.borderColor = 'var(--accent-primary)';
    defaultActive.style.backgroundColor = 'var(--accent-light)';
  }

  // Card formatting helpers
  const cardNumInput = document.getElementById('card-number');
  if (cardNumInput) {
    cardNumInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 16);
      val = val.match(/.{1,4}/g)?.join(' ') || val;
      e.target.value = val;
    });
  }

  const expiryInput = document.getElementById('card-expiry');
  if (expiryInput) {
    expiryInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (val.length >= 3) {
        val = val.substring(0, 2) + '/' + val.substring(2);
      }
      e.target.value = val;
    });
  }

  // Payment Submission
  const form = document.getElementById('payment-form');
  const processingBox = document.getElementById('payment-processing-box');
  const actionButtons = document.getElementById('payment-action-buttons');
  const payBtn = document.getElementById('pay-submit-btn');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let paymentDetails = '';
    let paymentStatus = 'Paid';

    // 1. Validate based on method
    if (currentMethod === 'upi') {
      const upiId = document.getElementById('upi-id').value.trim();
      if (!upiId || !/^[\w.-]+@[\w.-]+$/.test(upiId)) {
        Utils.showToast('Please enter a valid UPI ID (e.g. user@bank).', 'error');
        document.getElementById('upi-id').classList.add('input-error');
        return;
      }
      paymentDetails = `UPI: ${upiId} (Txn #${Date.now().toString().slice(-6)})`;
      paymentStatus = 'Paid';
    } else if (currentMethod === 'card') {
      const cardName = document.getElementById('card-name').value.trim();
      const cardNum = document.getElementById('card-number').value.replace(/\s/g, '');
      const expiry = document.getElementById('card-expiry').value.trim();
      const cvv = document.getElementById('card-cvv').value.trim();

      if (!cardName || cardName.length < 3) {
        Utils.showToast('Please enter full cardholder name.', 'error');
        return;
      }
      if (!cardNum || cardNum.length < 16) {
        Utils.showToast('Please enter a valid 16-digit card number.', 'error');
        return;
      }
      if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
        Utils.showToast('Please enter expiry as MM/YY.', 'error');
        return;
      }
      if (!cvv || cvv.length < 3) {
        Utils.showToast('Please enter a valid CVV.', 'error');
        return;
      }

      paymentDetails = `Card: •••• ${cardNum.slice(-4)} (${cardName})`;
      paymentStatus = 'Paid';
    } else if (currentMethod === 'cod') {
      paymentDetails = 'Cash on Delivery (Pending verification at doorstep)';
      paymentStatus = 'Pending (COD)';
    }

    // 2. Show simulated processing state
    processingBox.style.display = 'block';
    actionButtons.style.display = 'none';
    payBtn.disabled = true;

    // Simulate 1.2 second network call
    setTimeout(() => {
      const orderPayload = {
        ...checkoutData,
        paymentMethod: currentMethod === 'upi' ? 'UPI' : (currentMethod === 'card' ? 'Card' : 'Cash on Delivery'),
        paymentDetails,
        paymentStatus
      };

      const result = Orders.createOrder(orderPayload);
      if (result.success) {
        Storage.remove('lmarket_active_checkout');
        Utils.showToast('Payment successful! Order confirmed.', 'success');
        setTimeout(() => {
          window.location.href = `order.html?id=${result.order.id}&placed=true`;
        }, 600);
      } else {
        processingBox.style.display = 'none';
        actionButtons.style.display = 'flex';
        payBtn.disabled = false;
        Utils.showToast(result.message || 'Error creating order.', 'error');
      }
    }, 1200);
  });
});

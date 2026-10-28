/**
 * orders.js - Order lifecycle, inventory decrement, delivery tracking pipeline, and reviews.
 */

const PIPELINE_STEPS = [
  'Placed',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out for delivery',
  'Delivered'
];

const Orders = {
  PIPELINE_STEPS,

  getAll() {
    return Storage.getOrders();
  },

  getById(id) {
    return Storage.getOrderById(id);
  },

  // Get orders for a customer
  getForCustomer(email) {
    if (!email) return [];
    return this.getAll()
      .filter(o => o.customerEmail && o.customerEmail.toLowerCase() === email.toLowerCase())
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  // Get orders that contain products belonging to a specific vendor
  getForVendor(vendorId) {
    if (!vendorId) return [];
    return this.getAll()
      .filter(order => order.items.some(item => item.vendorId === vendorId))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  // Place a new order from checkout / payment
  createOrder(checkoutData) {
    const {
      customerEmail,
      customerName,
      phone,
      address,
      locality,
      notes,
      paymentMethod,
      paymentDetails,
      paymentStatus = 'Paid'
    } = checkoutData;

    const cartTotals = Cart.getCalculatedTotals();
    if (!cartTotals.items || cartTotals.items.length === 0) {
      return { success: false, message: 'Cart is empty.' };
    }

    const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
    const nowIso = new Date().toISOString();
    const formattedDate = nowIso.replace('T', ' ').substring(0, 16);

    // Prepare order items
    const orderItems = cartTotals.items.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      vendorId: item.product.vendorId,
      vendorName: item.vendor ? item.vendor.name : 'Local Vendor',
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.image
    }));

    // Construct new order
    const newOrder = {
      id: orderId,
      customerEmail: customerEmail.toLowerCase(),
      customerName,
      phone,
      address,
      locality,
      notes: notes || '',
      date: formattedDate,
      status: 'Placed',
      items: orderItems,
      subtotal: cartTotals.subtotal,
      discount: cartTotals.discount,
      deliveryFee: cartTotals.deliveryFee,
      total: cartTotals.grandTotal,
      promoCode: cartTotals.promo ? cartTotals.promo.code : '',
      paymentMethod,
      paymentDetails: paymentDetails || `${paymentMethod} - Completed`,
      paymentStatus, // 'Paid' or 'Pending (COD)'
      trackingHistory: [
        {
          step: 'Placed',
          timestamp: formattedDate,
          note: `Order received with ${paymentMethod} payment (${paymentStatus}).`
        }
      ],
      reviewed: false,
      reviewedProductIds: []
    };

    // 1. Decrement inventory stock
    const products = Storage.getProducts();
    const vendors = Storage.getVendors();
    const notifiedVendors = new Set();

    cartTotals.items.forEach(cartItem => {
      const prod = products.find(p => p.id === cartItem.product.id);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - cartItem.quantity);

        // Check if low stock
        if (prod.stock <= 5) {
          const v = vendors.find(x => x.id === prod.vendorId);
          if (v && v.ownerEmail) {
            Notifications.send(
              v.ownerEmail,
              'Low Stock Warning',
              `Inventory alert: "${prod.name}" has only ${prod.stock} unit(s) left in stock.`,
              'alert',
              'vendor-products.html'
            );
          }
        }

        // Prepare vendor notification
        const v = vendors.find(x => x.id === prod.vendorId);
        if (v && v.ownerEmail && !notifiedVendors.has(v.ownerEmail)) {
          notifiedVendors.add(v.ownerEmail);
          Notifications.send(
            v.ownerEmail,
            'New Order Received!',
            `Order #${orderId} was just placed containing items from your store.`,
            'order',
            'vendor-orders.html'
          );
        }
      }
    });

    Storage.saveProducts(products);

    // 2. Save order
    const allOrders = this.getAll();
    allOrders.unshift(newOrder);
    Storage.saveOrders(allOrders);

    // 3. Customer notification
    Notifications.send(
      customerEmail,
      'Order Confirmed (# ' + orderId + ')',
      `Thank you for supporting local vendors! Your order of ${Utils.formatCurrency(newOrder.total)} has been placed.`,
      'order',
      `order.html?id=${orderId}`
    );

    // 4. Empty cart & promo
    Cart.clear();

    return { success: true, order: newOrder };
  },

  // Advance delivery status along the pipeline
  advanceStatus(orderId, targetStep = null, customNote = '') {
    const orders = this.getAll();
    const order = orders.find(o => o.id === orderId);

    if (!order) {
      return { success: false, message: 'Order not found.' };
    }

    const currentIndex = PIPELINE_STEPS.indexOf(order.status);
    let nextStep = targetStep;

    if (!nextStep) {
      if (currentIndex >= 0 && currentIndex < PIPELINE_STEPS.length - 1) {
        nextStep = PIPELINE_STEPS[currentIndex + 1];
      } else {
        return { success: false, message: 'Order is already delivered or in final stage.' };
      }
    }

    const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const defaultNotes = {
      'Confirmed': 'Order verified and accepted by local vendors.',
      'Packed': 'Items freshly packed in temperature-conscious packaging.',
      'Shipped': 'Dispatched with local neighborhood delivery courier.',
      'Out for delivery': 'Courier is in transit to your locality.',
      'Delivered': 'Order safely delivered to recipient.'
    };

    order.status = nextStep;
    order.trackingHistory.push({
      step: nextStep,
      timestamp: nowFormatted,
      note: customNote || defaultNotes[nextStep] || `Status updated to ${nextStep}.`
    });

    Storage.saveOrders(orders);

    // Notify customer
    Notifications.send(
      order.customerEmail,
      `Order ${nextStep} (#${order.id})`,
      `Your local market order is now: ${nextStep}.`,
      'order',
      `order.html?id=${order.id}`
    );

    return { success: true, order };
  },

  // Reject / Cancel order
  cancelOrder(orderId, reason = 'Cancelled by vendor') {
    const orders = this.getAll();
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found.' };

    const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 16);
    order.status = 'Cancelled';
    order.trackingHistory.push({
      step: 'Cancelled',
      timestamp: nowFormatted,
      note: reason
    });

    // Restore stock
    const products = Storage.getProducts();
    order.items.forEach(item => {
      const p = products.find(x => x.id === item.productId);
      if (p) p.stock += item.quantity;
    });
    Storage.saveProducts(products);
    Storage.saveOrders(orders);

    Notifications.send(
      order.customerEmail,
      `Order #${order.id} Cancelled`,
      `Your order has been cancelled: ${reason}. Any charge will be refunded.`,
      'alert',
      `order.html?id=${order.id}`
    );

    return { success: true, order };
  },

  // Submit product review after delivery
  submitReview(orderId, productId, rating, comment, customerName, customerEmail) {
    const orders = this.getAll();
    const order = orders.find(o => o.id === orderId);

    if (!order) {
      return { success: false, message: 'Order not found.' };
    }

    const reviews = Storage.getReviews();
    const newReview = {
      id: 'rev_' + Date.now(),
      productId,
      orderId,
      customerName: customerName || 'Verified Buyer',
      customerEmail: customerEmail || 'customer@demo.com',
      rating: parseInt(rating, 10) || 5,
      comment: comment.trim(),
      date: new Date().toISOString().split('T')[0]
    };

    reviews.push(newReview);
    Storage.saveReviews(reviews);

    // Recalculate product rating
    const products = Storage.getProducts();
    const product = products.find(p => p.id === productId);
    if (product) {
      const prodReviews = reviews.filter(r => r.productId === productId);
      const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
      product.rating = Math.round(avg * 10) / 10;
      product.reviewCount = prodReviews.length;
      Storage.saveProducts(products);
    }

    // Mark product as reviewed in order
    if (!order.reviewedProductIds) order.reviewedProductIds = [];
    order.reviewedProductIds.push(productId);
    if (order.reviewedProductIds.length >= order.items.length) {
      order.reviewed = true;
    }
    Storage.saveOrders(orders);

    return { success: true, review: newReview };
  }
};

window.Orders = Orders;

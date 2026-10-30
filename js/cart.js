/**
 * cart.js - Shopping cart, promotions engine, and product comparison logic.
 */

const Cart = {
  // Get raw items in cart: [{ productId, quantity }]
  getItems() {
    return Storage.getCart();
  },

  // Save cart
  saveItems(items) {
    Storage.saveCart(items);
    this.broadcastChange();
  },

  // Total count of distinct or sum of items
  getCount() {
    const items = this.getItems();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },

  // Add item with stock limit validation
  addItem(productId, quantity = 1) {
    const qty = parseInt(quantity, 10) || 1;
    const product = Storage.getProductById(productId);

    if (!product) {
      Utils.showToast('Product not found.', 'error');
      return { success: false, message: 'Product not found' };
    }

    if (product.stock <= 0) {
      Utils.showToast('Sorry, this product is currently out of stock.', 'warning');
      return { success: false, message: 'Out of stock' };
    }

    const items = this.getItems();
    const existing = items.find(i => i.productId === productId);
    const currentQtyInCart = existing ? existing.quantity : 0;
    const targetQty = currentQtyInCart + qty;

    if (targetQty > product.stock) {
      const allowed = product.stock - currentQtyInCart;
      if (allowed <= 0) {
        Utils.showToast(`You already have all available ${product.stock} units in your cart!`, 'warning');
        return { success: false, message: 'Stock limit reached' };
      }
      Utils.showToast(`Only ${allowed} more unit(s) available in stock. Added maximum available.`, 'warning');
      if (existing) {
        existing.quantity = product.stock;
      } else {
        items.push({ productId, quantity: product.stock });
      }
    } else {
      if (existing) {
        existing.quantity = targetQty;
      } else {
        items.push({ productId, quantity: targetQty });
      }
      Utils.showToast(`Added ${product.name} to cart.`, 'success');
    }

    this.saveItems(items);
    return { success: true };
  },

  // Update item quantity directly
  updateQuantity(productId, newQty) {
    const qty = parseInt(newQty, 10);
    const product = Storage.getProductById(productId);
    const items = this.getItems();
    const index = items.findIndex(i => i.productId === productId);

    if (index === -1) return;

    if (qty <= 0) {
      items.splice(index, 1);
      Utils.showToast('Item removed from cart.', 'info');
    } else if (product && qty > product.stock) {
      items[index].quantity = product.stock;
      Utils.showToast(`Maximum available stock for ${product.name} is ${product.stock}.`, 'warning');
    } else {
      items[index].quantity = qty;
    }

    this.saveItems(items);
  },

  // Remove item completely
  removeItem(productId) {
    let items = this.getItems();
    items = items.filter(i => i.productId !== productId);
    this.saveItems(items);
    Utils.showToast('Item removed from cart.', 'info');
  },

  // Empty cart
  clear() {
    this.saveItems([]);
    this.removePromo();
  },

  // Promo code handling
  getAppliedPromo() {
    return Storage.get('lmarket_applied_promo', null);
  },

  applyPromo(code) {
    if (!code) {
      return { success: false, message: 'Please enter a promo code.' };
    }

    const promo = Storage.getPromoByCode(code);
    if (!promo) {
      return { success: false, message: 'Invalid or inactive promo code.' };
    }

    const today = new Date().toISOString().split('T')[0];
    if (promo.startDate && promo.startDate > today) {
      return { success: false, message: 'This promo code is not active yet.' };
    }
    if (promo.endDate && promo.endDate < today) {
      return { success: false, message: 'This promo code has expired.' };
    }

    // Check minimum order
    const rawTotals = this.getCalculatedTotals(null);
    if (promo.minOrder && rawTotals.subtotal < promo.minOrder) {
      return {
        success: false,
        message: `Order subtotal must be at least ${Utils.formatCurrency(promo.minOrder)} to use code ${promo.code}.`
      };
    }

    Storage.set('lmarket_applied_promo', promo);
    return {
      success: true,
      message: `Promo code ${promo.code} applied successfully!`,
      promo
    };
  },

  removePromo() {
    Storage.remove('lmarket_applied_promo');
  },

  // Calculate full cart details and breakdown
  getCalculatedTotals(forcedPromo = undefined) {
    const items = this.getItems();
    const products = Storage.getProducts();
    const vendors = Storage.getVendors();

    let subtotal = 0;
    const enrichedItems = [];

    items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        const vendor = vendors.find(v => v.id === prod.vendorId) || { name: 'Local Vendor' };
        const lineTotal = prod.price * item.quantity;
        subtotal += lineTotal;
        enrichedItems.push({
          ...item,
          product: prod,
          vendor: vendor,
          lineTotal
        });
      }
    });

    const activePromo = forcedPromo !== undefined ? forcedPromo : this.getAppliedPromo();
    let discount = 0;

    if (activePromo && subtotal >= (activePromo.minOrder || 0)) {
      if (activePromo.type === 'percent') {
        discount = (subtotal * activePromo.value) / 100;
      } else if (activePromo.type === 'flat') {
        discount = activePromo.value;
      }
      if (discount > subtotal) discount = subtotal;
    }

    // Delivery fee rule: ₹40.00 flat, or free delivery if subtotal >= ₹500
    const deliveryFee = subtotal > 0 ? (subtotal >= 500 ? 0.00 : 40.00) : 0.00;
    const grandTotal = Math.max(0, subtotal - discount + deliveryFee);

    return {
      items: enrichedItems,
      itemCount: enrichedItems.reduce((acc, i) => acc + i.quantity, 0),
      subtotal,
      discount,
      deliveryFee,
      grandTotal,
      promo: activePromo
    };
  },

  // Notify listeners to update header count badge
  broadcastChange() {
    window.dispatchEvent(new CustomEvent('cart-updated'));
  }
};

/**
 * Compare Products (up to 3 products)
 */
const Compare = {
  getItems() {
    const ids = Storage.getCompare() || [];
    const products = Storage.getProducts();
    return ids.map(id => products.find(p => p.id === id)).filter(Boolean);
  },

  add(productId) {
    const list = Storage.getCompare() || [];
    if (list.includes(productId)) {
      Utils.showToast('Product already in comparison list.', 'info');
      return false;
    }
    if (list.length >= 3) {
      Utils.showToast('You can compare a maximum of 3 products at a time.', 'warning');
      return false;
    }
    list.push(productId);
    Storage.saveCompare(list);
    Utils.showToast('Product added to comparison.', 'success');
    window.dispatchEvent(new CustomEvent('compare-updated'));
    return true;
  },

  remove(productId) {
    let list = Storage.getCompare() || [];
    list = list.filter(id => id !== productId);
    Storage.saveCompare(list);
    Utils.showToast('Removed from comparison.', 'info');
    window.dispatchEvent(new CustomEvent('compare-updated'));
  },

  clear() {
    Storage.saveCompare([]);
    window.dispatchEvent(new CustomEvent('compare-updated'));
  },

  getCount() {
    return (Storage.getCompare() || []).length;
  }
};

window.Cart = Cart;
window.Compare = Compare;

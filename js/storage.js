/**
 * storage.js - LocalStorage management for the Local Market Online Store
 * Handles persistence, retrieval, and demo data re-seeding.
 */

const STORAGE_KEYS = {
  SEEDED: 'lmarket_seeded_v5',
  USERS: 'lmarket_users',
  CURRENT_USER: 'lmarket_current_user',
  VENDORS: 'lmarket_vendors',
  PRODUCTS: 'lmarket_products',
  CATEGORIES: 'lmarket_categories',
  PROMOTIONS: 'lmarket_promotions',
  ORDERS: 'lmarket_orders',
  CART: 'lmarket_cart',
  COMPARE: 'lmarket_compare',
  REVIEWS: 'lmarket_reviews',
  NOTIFICATIONS: 'lmarket_notifications'
};

const Storage = {
  // Generic JSON get/set
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage:`, e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error writing ${key} to localStorage:`, e);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing ${key} from localStorage:`, e);
    }
  },

  // Initialize storage with seed data if not yet seeded
  init() {
    const isSeeded = localStorage.getItem(STORAGE_KEYS.SEEDED);
    if (!isSeeded && typeof MarketplaceSeedData !== 'undefined') {
      this.seedAll(MarketplaceSeedData);
    }
  },

  seedAll(seedData) {
    this.set(STORAGE_KEYS.USERS, seedData.users || []);
    this.set(STORAGE_KEYS.VENDORS, seedData.vendors || []);
    this.set(STORAGE_KEYS.PRODUCTS, seedData.products || []);
    this.set(STORAGE_KEYS.CATEGORIES, seedData.categories || []);
    this.set(STORAGE_KEYS.PROMOTIONS, seedData.promotions || []);
    this.set(STORAGE_KEYS.ORDERS, seedData.orders || []);
    this.set(STORAGE_KEYS.REVIEWS, seedData.reviews || []);
    this.set(STORAGE_KEYS.NOTIFICATIONS, seedData.notifications || []);
    this.set(STORAGE_KEYS.CART, []);
    this.set(STORAGE_KEYS.COMPARE, []);

    // Set demo customer as current user initially for instant testability
    const defaultUser = seedData.users && seedData.users[0] ? seedData.users[0] : null;
    if (defaultUser) {
      this.setCurrentUser(defaultUser);
    }

    localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
    console.log('Local Market: Seed data initialized successfully.');
  },

  resetDemoData() {
    localStorage.clear();
    if (typeof MarketplaceSeedData !== 'undefined') {
      this.seedAll(MarketplaceSeedData);
      window.location.reload();
    }
  },

  // Users
  getUsers() { return this.get(STORAGE_KEYS.USERS, []); },
  saveUsers(users) { return this.set(STORAGE_KEYS.USERS, users); },
  getUserByEmail(email) {
    const users = this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  // Current session
  getCurrentUser() { return this.get(STORAGE_KEYS.CURRENT_USER, null); },
  setCurrentUser(user) {
    // Never persist password in session state
    if (!user) {
      this.remove(STORAGE_KEYS.CURRENT_USER);
      return;
    }
    const safeUser = { ...user };
    delete safeUser.password;
    this.set(STORAGE_KEYS.CURRENT_USER, safeUser);
  },
  clearCurrentUser() { this.remove(STORAGE_KEYS.CURRENT_USER); },

  // Vendors
  getVendors() { return this.get(STORAGE_KEYS.VENDORS, []); },
  saveVendors(vendors) { return this.set(STORAGE_KEYS.VENDORS, vendors); },
  getVendorById(id) {
    const vendors = this.getVendors();
    return vendors.find(v => v.id === id);
  },
  getVendorByOwner(email) {
    const vendors = this.getVendors();
    return vendors.find(v => v.ownerEmail && v.ownerEmail.toLowerCase() === email.toLowerCase());
  },

  // Products
  getProducts() { return this.get(STORAGE_KEYS.PRODUCTS, []); },
  saveProducts(products) { return this.set(STORAGE_KEYS.PRODUCTS, products); },
  getProductById(id) {
    const products = this.getProducts();
    return products.find(p => p.id === id);
  },

  // Categories
  getCategories() { return this.get(STORAGE_KEYS.CATEGORIES, []); },
  saveCategories(categories) { return this.set(STORAGE_KEYS.CATEGORIES, categories); },

  // Promotions
  getPromotions() { return this.get(STORAGE_KEYS.PROMOTIONS, []); },
  savePromotions(promotions) { return this.set(STORAGE_KEYS.PROMOTIONS, promotions); },
  getPromoByCode(code) {
    if (!code) return null;
    const promos = this.getPromotions();
    const clean = code.trim().toUpperCase();
    return promos.find(p => p.code.toUpperCase() === clean && p.active);
  },

  // Orders
  getOrders() { return this.get(STORAGE_KEYS.ORDERS, []); },
  saveOrders(orders) { return this.set(STORAGE_KEYS.ORDERS, orders); },
  getOrderById(id) {
    const orders = this.getOrders();
    return orders.find(o => o.id === id);
  },

  // Cart
  getCart() { return this.get(STORAGE_KEYS.CART, []); },
  saveCart(cart) { return this.set(STORAGE_KEYS.CART, cart); },

  // Compare
  getCompare() { return this.get(STORAGE_KEYS.COMPARE, []); },
  saveCompare(compare) { return this.set(STORAGE_KEYS.COMPARE, compare); },

  // Reviews
  getReviews() { return this.get(STORAGE_KEYS.REVIEWS, []); },
  saveReviews(reviews) { return this.set(STORAGE_KEYS.REVIEWS, reviews); },
  getReviewsForProduct(productId) {
    const reviews = this.getReviews();
    return reviews.filter(r => r.productId === productId);
  },

  // Notifications
  getNotifications() { return this.get(STORAGE_KEYS.NOTIFICATIONS, []); },
  saveNotifications(notifs) { return this.set(STORAGE_KEYS.NOTIFICATIONS, notifs); }
};

window.Storage = Storage;

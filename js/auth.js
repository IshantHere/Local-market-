/**
 * auth.js - Role-based authentication and route guard for the Local Market Store.
 * Supports Customer, Vendor, and Admin roles.
 */

const Auth = {
  // Get currently authenticated user
  getUser() {
    return Storage.getCurrentUser();
  },

  // Check if someone is logged in
  isLoggedIn() {
    return !!this.getUser();
  },

  // Check if current user has a specific role
  hasRole(role) {
    const user = this.getUser();
    return user && user.role === role;
  },

  // Route protection guard
  // allowedRoles: array like ['customer'], ['vendor'], ['admin'], or ['customer', 'vendor', 'admin']
  requireRole(allowedRoles = []) {
    const user = this.getUser();
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if (!user) {
      // Not logged in -> redirect to login with return target
      const returnUrl = encodeURIComponent(currentPage + window.location.search);
      window.location.href = `login.html?redirect=${returnUrl}&msg=login_required`;
      return false;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      // Wrong role
      alert(`Access Restricted: This page requires ${allowedRoles.join(' or ')} privileges. You are currently logged in as a ${user.role}.`);
      window.location.href = 'index.html';
      return false;
    }

    return true;
  },

  // Authenticate user by email & password
  login(email, password) {
    if (!email || !password) {
      return { success: false, message: 'Please enter both email and password.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = Storage.getUsers();
    const foundUser = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!foundUser) {
      return { success: false, message: 'No account found with this email address.' };
    }

    if (foundUser.password !== password) {
      return { success: false, message: 'Incorrect password. (Hint: demo accounts use "demo123")' };
    }

    // Set active session
    Storage.setCurrentUser(foundUser);
    return { success: true, user: foundUser };
  },

  // Register a new customer or vendor
  register(userData) {
    const { name, email, password, role, phone, address, locality, storeName, storeCategory, storeBio } = userData;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !password || !name) {
      return { success: false, message: 'All required fields must be filled.' };
    }

    const users = Storage.getUsers();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    let vendorId = null;

    // If registering as vendor, create their store profile
    if (role === 'vendor') {
      const vendors = Storage.getVendors();
      vendorId = 'v_' + Date.now();
      const newVendor = {
        id: vendorId,
        name: storeName || `${name}'s Farm & Goods`,
        ownerEmail: cleanEmail,
        locality: locality || 'Neighbourhood',
        category: storeCategory || 'Fresh Produce',
        bio: storeBio || 'Local independent vendor bringing quality artisan goods to our neighbourhood community.',
        contactEmail: cleanEmail,
        phone: phone || '',
        status: 'approved',
        isOpen: true,
        rating: 5.0,
        reviewCount: 0,
        establishedYear: new Date().getFullYear()
      };
      vendors.push(newVendor);
      Storage.saveVendors(vendors);

      // Add welcome notification for new vendor
      Notifications.send(
        cleanEmail,
        'Welcome to the Vendor Community!',
        `Your store "${newVendor.name}" has been created. Start adding products from your vendor dashboard.`,
        'system',
        'vendor-products.html'
      );
    } else {
      // Welcome notification for customer
      Notifications.send(
        cleanEmail,
        'Welcome to Local Market!',
        'Thank you for joining our community. Use coupon code LOCAL10 for 10% off your first artisan purchase.',
        'promo',
        'products.html'
      );
    }

    const newUser = {
      id: 'u_' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      password: password,
      role: role || 'customer',
      phone: phone || '',
      address: address || '',
      locality: locality || '',
      vendorId: vendorId,
      joinedDate: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);
    Storage.saveUsers(users);

    // Auto log in new user
    Storage.setCurrentUser(newUser);
    return { success: true, user: newUser };
  },

  // Log out current session
  logout() {
    Storage.clearCurrentUser();
    window.location.href = 'login.html?msg=logged_out';
  },

  // Fast switch for easy demo evaluation
  quickSwitch(email) {
    const user = Storage.getUserByEmail(email);
    if (user) {
      Storage.setCurrentUser(user);
      Utils.showToast(`Switched active account to ${user.name} (${user.role})`, 'success');
      setTimeout(() => {
        if (user.role === 'vendor') window.location.href = 'vendor-dashboard.html';
        else if (user.role === 'admin') window.location.href = 'admin.html';
        else window.location.href = 'index.html';
      }, 500);
    }
  }
};

window.Auth = Auth;

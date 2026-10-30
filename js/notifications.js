/**
 * notifications.js - Notification management for customers, vendors, and admins.
 */

const Notifications = {
  getAll() {
    return Storage.getNotifications();
  },

  getUserNotifications(email) {
    if (!email) {
      const user = Storage.getCurrentUser();
      email = user ? user.email : '';
    }
    if (!email) return [];
    const all = this.getAll();
    return all
      .filter(n => n.userEmail.toLowerCase() === email.toLowerCase())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  getUnreadCount(email) {
    const list = this.getUserNotifications(email);
    return list.filter(n => !n.read).length;
  },

  send(userEmail, title, message, type = 'info', link = '') {
    const all = this.getAll();
    const newNotif = {
      id: 'notif_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      userEmail: userEmail.toLowerCase(),
      title,
      message,
      type, // 'order', 'promo', 'alert', 'system'
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      read: false,
      link
    };
    all.unshift(newNotif);
    Storage.saveNotifications(all);
    return newNotif;
  },

  markAsRead(id) {
    const all = this.getAll();
    const target = all.find(n => n.id === id);
    if (target) {
      target.read = true;
      Storage.saveNotifications(all);
    }
  },

  markAllAsRead(email) {
    if (!email) {
      const user = Storage.getCurrentUser();
      email = user ? user.email : '';
    }
    if (!email) return;
    const all = this.getAll();
    all.forEach(n => {
      if (n.userEmail.toLowerCase() === email.toLowerCase()) {
        n.read = true;
      }
    });
    Storage.saveNotifications(all);
  },

  clearAll(email) {
    if (!email) {
      const user = Storage.getCurrentUser();
      email = user ? user.email : '';
    }
    if (!email) return;
    const all = this.getAll().filter(n => n.userEmail.toLowerCase() !== email.toLowerCase());
    Storage.saveNotifications(all);
  }
};

window.Notifications = Notifications;

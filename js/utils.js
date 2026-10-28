/**
 * utils.js - General utility functions for formatting, icons, validation, and toast notifications.
 */

const Utils = {
  // Format numbers to Indian Rupee currency string e.g. ₹350.00
  formatCurrency(value) {
    const num = Number(value) || 0;
    return '₹' + num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  },

  // Format ISO/date string into readable format
  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  },

  formatDateTime(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  },

  // Get URL search parameters
  getUrlParam(param) {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
  },

  // Star ratings generator
  renderStars(rating, reviewCount = null) {
    const r = Math.round((Number(rating) || 0) * 2) / 2;
    let starsHtml = '<span class="star-rating" title="' + rating + ' out of 5 stars">';
    for (let i = 1; i <= 5; i++) {
      if (r >= i) {
        starsHtml += '<span class="star star-full">★</span>';
      } else if (r >= i - 0.5) {
        starsHtml += '<span class="star star-half">★</span>';
      } else {
        starsHtml += '<span class="star star-empty">☆</span>';
      }
    }
    starsHtml += ` <strong class="rating-number">${Number(rating).toFixed(1)}</strong>`;
    if (reviewCount !== null) {
      starsHtml += ` <span class="rating-count">(${reviewCount})</span>`;
    }
    starsHtml += '</span>';
    return starsHtml;
  },

  // Toast notification displayer
  showToast(message, type = 'info', duration = 3500) {
    if (typeof document === 'undefined') {
      console.log(`[Toast ${type}]: ${message}`);
      return;
    }

    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Choose icon
    let icon = 'ℹ';
    if (type === 'success') icon = '✓';
    if (type === 'error' || type === 'danger') icon = '✕';
    if (type === 'warning') icon = '⚠';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    // Auto-remove
    setTimeout(() => {
      toast.classList.add('toast-fading');
      setTimeout(() => {
        if (toast.parentElement) toast.remove();
      }, 400);
    }, duration);
  },

  // Client-side form validator helper
  // Takes a form element and rules object:
  // { 'inputName': { required: true, email: true, minLength: 3, pattern: /regex/, message: '...' } }
  validateForm(form, rules) {
    let isValid = true;
    // Clear previous error messages
    form.querySelectorAll('.form-error-msg').forEach(el => el.remove());
    form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));

    for (const [fieldName, fieldRules] of Object.entries(rules)) {
      const field = form.elements[fieldName];
      if (!field) continue;

      const val = field.value !== undefined ? field.value.trim() : '';
      let error = null;

      if (fieldRules.required && !val) {
        error = fieldRules.message || `${field.dataset.label || fieldName} is required.`;
      } else if (fieldRules.email && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        error = 'Please enter a valid email address.';
      } else if (fieldRules.minLength && val && val.length < fieldRules.minLength) {
        error = `Must be at least ${fieldRules.minLength} characters.`;
      } else if (fieldRules.min !== undefined && val && Number(val) < fieldRules.min) {
        error = `Value must be at least ${fieldRules.min}.`;
      } else if (fieldRules.max !== undefined && val && Number(val) > fieldRules.max) {
        error = `Value cannot exceed ${fieldRules.max}.`;
      } else if (fieldRules.pattern && val && !fieldRules.pattern.test(val)) {
        error = fieldRules.message || 'Invalid format.';
      }

      if (error) {
        isValid = false;
        field.classList.add('input-error');
        const errSpan = document.createElement('span');
        errSpan.className = 'form-error-msg';
        errSpan.textContent = error;
        // Insert after field or its container
        if (field.parentElement) {
          field.parentElement.appendChild(errSpan);
        }
      }
    }

    return isValid;
  },

  // Safe HTML escaper
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // Delivery status badge styling
  getStatusBadge(status) {
    const s = (status || '').toLowerCase();
    let badgeClass = 'badge-secondary';
    if (s === 'delivered') badgeClass = 'badge-success';
    else if (s === 'out for delivery' || s === 'shipped') badgeClass = 'badge-info';
    else if (s === 'packed' || s === 'confirmed') badgeClass = 'badge-warning';
    else if (s === 'placed') badgeClass = 'badge-primary';
    else if (s === 'cancelled' || s === 'rejected') badgeClass = 'badge-danger';

    return `<span class="badge ${badgeClass}">${status}</span>`;
  }
};

window.Utils = Utils;

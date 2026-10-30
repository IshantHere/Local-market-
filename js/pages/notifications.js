/**
 * pages/notifications.js - Notifications center view and interaction
 */

document.addEventListener('DOMContentLoaded', () => {
  Components.init();

  if (!Auth.requireRole(['customer', 'vendor', 'admin'])) return;

  const user = Auth.getUser();
  const container = document.getElementById('notifications-list-container');
  const markAllBtn = document.getElementById('mark-all-read-btn');
  const clearAllBtn = document.getElementById('clear-notifications-btn');

  function renderNotifications() {
    const notifs = Notifications.getUserNotifications(user.email);

    if (notifs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔔</div>
          <h2 class="empty-state-title">No notifications yet</h2>
          <p class="empty-state-desc">You are all caught up! Order updates and discount alerts will show up here.</p>
          <a href="products.html" class="btn btn-primary">Browse Store</a>
        </div>
      `;
      markAllBtn.style.display = 'none';
      clearAllBtn.style.display = 'none';
      return;
    }

    markAllBtn.style.display = 'inline-block';
    clearAllBtn.style.display = 'inline-block';

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${notifs.map(n => {
          let typeIcon = '📢';
          let badgeColor = 'badge-info';
          if (n.type === 'order') { typeIcon = '📦'; badgeColor = 'badge-primary'; }
          else if (n.type === 'promo') { typeIcon = '🏷️'; badgeColor = 'badge-warning'; }
          else if (n.type === 'alert') { typeIcon = '⚠️'; badgeColor = 'badge-danger'; }

          return `
            <div class="card" style="padding: 16px; border-left: 4px solid ${n.read ? 'var(--border-dark)' : 'var(--accent-primary)'}; background: ${n.read ? '#fff' : 'var(--accent-light)'};">
              <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;">
                <div style="display: flex; gap: 12px; align-items: flex-start;">
                  <span style="font-size: 1.4rem;">${typeIcon}</span>
                  <div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <strong style="font-size: 0.95rem; color: var(--text-main);">${Utils.escapeHtml(n.title)}</strong>
                      ${!n.read ? '<span class="badge badge-primary" style="font-size: 0.65rem;">NEW</span>' : ''}
                    </div>
                    <p style="font-size: 0.88rem; color: var(--text-muted); margin-top: 4px; line-height: 1.45;">
                      ${Utils.escapeHtml(n.message)}
                    </p>
                    <div style="display: flex; align-items: center; gap: 14px; margin-top: 8px; font-size: 0.78rem;">
                      <span style="color: var(--text-light);">${Utils.formatDateTime(n.timestamp)}</span>
                      ${n.link ? `
                        <a href="${n.link}" style="font-weight: 600; color: var(--accent-primary);" onclick="Notifications.markAsRead('${n.id}')">
                          View Details &rarr;
                        </a>
                      ` : ''}
                    </div>
                  </div>
                </div>

                <div>
                  ${!n.read ? `
                    <button class="btn btn-sm btn-outline" style="font-size: 0.75rem; padding: 2px 6px;" onclick="Notifications.markAsRead('${n.id}'); window.location.reload();">
                      Mark read
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderNotifications();

  markAllBtn.addEventListener('click', () => {
    Notifications.markAllAsRead(user.email);
    Utils.showToast('All notifications marked as read.', 'success');
    renderNotifications();
    Components.updateCounters();
  });

  clearAllBtn.addEventListener('click', () => {
    Notifications.clearAll(user.email);
    Utils.showToast('Cleared notifications history.', 'info');
    renderNotifications();
    Components.updateCounters();
  });
});

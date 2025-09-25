// client/js/notifications-page.js
document.addEventListener('DOMContentLoaded', async () => {
    const notificationsListContainer = document.getElementById('notifications-list');

    if (!localStorage.getItem('alumniConnectToken')) {
        window.location.href = 'login.html';
        return;
    }

    const loadNotifications = async () => {
        notificationsListContainer.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
        try {
            const notifications = await window.api.get('/notifications');

            if (notifications.length > 0) {
                notificationsListContainer.innerHTML = notifications.map(notification => {
                    const isReadClass = notification.is_read ? '' : 'notification-unread';
                    return `
                        <div class="notification-item card ${isReadClass}">
                            <div class="notification-content">
                                <p>${sanitizeHTML(notification.message)}</p>
                                <small>${new Date(notification.created_at).toLocaleString()}</small>
                                ${notification.link ? `<a href="${notification.link}" class="btn btn-secondary btn-sm">View Details</a>` : ''}
                            </div>
                            <button class="notification-delete-btn" data-id="${notification.notification_id}" title="Delete Notification">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                }).join('');
            } else {
                notificationsListContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-bell-slash"></i>
                        <h3>No Notifications</h3>
                        <p>You don't have any notifications yet. We'll let you know when something new happens!</p>
                    </div>`;
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            notificationsListContainer.innerHTML = '<p class="info-message error">Failed to load notifications.</p>';
        }
    };

    notificationsListContainer.addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.notification-delete-btn');
        if (deleteButton) {
            const notificationId = deleteButton.dataset.id;
            if (confirm('Are you sure you want to delete this notification?')) {
                try {
                    await window.api.del(`/notifications/${notificationId}`);
                    showToast('Notification deleted.', 'success');
                    await loadNotifications();
                } catch (error) {
                    console.error('Error deleting notification:', error);
                    showToast('An error occurred.', 'error');
                }
            }
        }
    });

    await loadNotifications();
});
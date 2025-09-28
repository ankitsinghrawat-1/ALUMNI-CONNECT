// client/js/real-time-notifications.js
// Real-time notification system with WebSocket support

class RealTimeNotifications {
    constructor(options = {}) {
        this.options = {
            endpoint: '/api/notifications',
            wsEndpoint: 'ws://localhost:3000/notifications',
            maxNotifications: 100,
            soundEnabled: true,
            enableWebSocket: true,
            pushEnabled: false,
            ...options
        };
        
        this.notifications = [];
        this.unreadCount = 0;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        
        this.init();
    }

    async init() {
        this.createNotificationCenter();
        await this.loadNotifications();
        this.setupEventListeners();
        
        if (this.options.enableWebSocket) {
            this.setupWebSocket();
        }
        
        if (this.options.pushEnabled) {
            await this.requestPushPermission();
        }
        
        this.startPeriodicSync();
    }

    createNotificationCenter() {
        // Create notification center HTML
        const notificationHTML = `
            <div id="notification-center" class="notification-center">
                <div class="notification-header">
                    <h3>
                        <i class="fas fa-bell"></i>
                        Notifications
                        <span class="notification-count" id="notification-count">0</span>
                    </h3>
                    <div class="notification-actions">
                        <button class="btn-icon mark-all-read" title="Mark all as read">
                            <i class="fas fa-check-double"></i>
                        </button>
                        <button class="btn-icon notification-settings" title="Settings">
                            <i class="fas fa-cog"></i>
                        </button>
                        <button class="btn-icon close-notifications" title="Close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="notification-filters">
                    <button class="filter-btn active" data-filter="all">All</button>
                    <button class="filter-btn" data-filter="unread">Unread</button>
                    <button class="filter-btn" data-filter="mentions">Mentions</button>
                    <button class="filter-btn" data-filter="messages">Messages</button>
                </div>
                
                <div class="notification-list" id="notification-list">
                    <div class="notification-loading">
                        <div class="loading-spinner">
                            <div class="spinner"></div>
                            <span>Loading notifications...</span>
                        </div>
                    </div>
                </div>
                
                <div class="notification-footer">
                    <button class="btn btn-sm load-more" id="load-more-notifications">
                        Load More
                    </button>
                </div>
            </div>
            
            <div id="notification-overlay" class="notification-overlay"></div>
        `;

        // Create notification bell for navbar
        const bellHTML = `
            <div class="notification-bell" id="notification-bell">
                <button class="btn-icon notification-toggle" title="Notifications">
                    <i class="fas fa-bell"></i>
                    <span class="notification-badge" id="notification-badge">0</span>
                </button>
            </div>
        `;

        // Insert into page
        document.body.insertAdjacentHTML('beforeend', notificationHTML);
        
        // Find navbar and add bell
        const navbar = document.querySelector('.nav-links, .main-nav');
        if (navbar) {
            navbar.insertAdjacentHTML('beforeend', bellHTML);
        }

        // Get elements
        this.elements = {
            center: document.getElementById('notification-center'),
            overlay: document.getElementById('notification-overlay'),
            bell: document.getElementById('notification-bell'),
            toggle: document.querySelector('.notification-toggle'),
            list: document.getElementById('notification-list'),
            count: document.getElementById('notification-count'),
            badge: document.getElementById('notification-badge'),
            markAllRead: document.querySelector('.mark-all-read'),
            close: document.querySelector('.close-notifications'),
            loadMore: document.getElementById('load-more-notifications'),
            filters: document.querySelectorAll('.filter-btn')
        };
    }

    setupEventListeners() {
        // Toggle notification center
        this.elements.toggle.addEventListener('click', () => {
            this.toggleNotificationCenter();
        });

        // Close notification center
        this.elements.close.addEventListener('click', () => {
            this.closeNotificationCenter();
        });

        this.elements.overlay.addEventListener('click', () => {
            this.closeNotificationCenter();
        });

        // Mark all as read
        this.elements.markAllRead.addEventListener('click', () => {
            this.markAllAsRead();
        });

        // Filter buttons
        this.elements.filters.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveFilter(e.target.dataset.filter);
            });
        });

        // Load more
        this.elements.loadMore.addEventListener('click', () => {
            this.loadMoreNotifications();
        });

        // Notification item clicks
        this.elements.list.addEventListener('click', (e) => {
            const notificationItem = e.target.closest('.notification-item');
            if (notificationItem) {
                this.handleNotificationClick(notificationItem);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'n') {
                e.preventDefault();
                this.toggleNotificationCenter();
            }
            
            if (e.key === 'Escape' && this.isNotificationCenterOpen()) {
                this.closeNotificationCenter();
            }
        });
    }

    setupWebSocket() {
        if (!window.WebSocket) {
            console.warn('WebSocket not supported, falling back to polling');
            return;
        }

        try {
            const token = localStorage.getItem('alumniConnectToken');
            const wsUrl = `${this.options.wsEndpoint}?token=${token}`;
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleRealtimeNotification(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.attemptReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
        } catch (error) {
            console.error('Failed to setup WebSocket:', error);
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
            
            setTimeout(() => {
                console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                this.setupWebSocket();
            }, delay);
        }
    }

    handleRealtimeNotification(data) {
        switch (data.type) {
            case 'new_notification':
                this.addNotification(data.notification);
                break;
            case 'notification_read':
                this.markNotificationAsRead(data.notificationId);
                break;
            case 'notification_deleted':
                this.removeNotification(data.notificationId);
                break;
        }
    }

    async loadNotifications(offset = 0, limit = 20) {
        try {
            const params = new URLSearchParams({
                offset,
                limit,
                include_read: true
            });

            const response = await window.api.get(`${this.options.endpoint}?${params}`);
            
            if (offset === 0) {
                this.notifications = response.notifications || [];
            } else {
                this.notifications.push(...(response.notifications || []));
            }
            
            this.updateUnreadCount();
            this.renderNotifications();
            
        } catch (error) {
            console.error('Failed to load notifications:', error);
            this.showError('Failed to load notifications');
        }
    }

    async loadMoreNotifications() {
        await this.loadNotifications(this.notifications.length);
    }

    addNotification(notification) {
        // Add to beginning of array
        this.notifications.unshift(notification);
        
        // Keep only max notifications
        if (this.notifications.length > this.options.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.options.maxNotifications);
        }
        
        this.updateUnreadCount();
        this.renderNotifications();
        this.showNotificationToast(notification);
        this.playNotificationSound();
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
            this.showBrowserNotification(notification);
        }
    }

    async markNotificationAsRead(notificationId) {
        try {
            await window.api.put(`${this.options.endpoint}/${notificationId}/read`);
            
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.read = true;
                this.updateUnreadCount();
                this.renderNotifications();
            }
            
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            await window.api.put(`${this.options.endpoint}/mark-all-read`);
            
            this.notifications.forEach(n => n.read = true);
            this.updateUnreadCount();
            this.renderNotifications();
            
            if (window.toastManager) {
                window.toastManager.show('All notifications marked as read', 'success');
            }
            
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    }

    async removeNotification(notificationId) {
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.updateUnreadCount();
        this.renderNotifications();
    }

    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        
        // Update badge
        if (this.elements.badge) {
            this.elements.badge.textContent = this.unreadCount;
            this.elements.badge.style.display = this.unreadCount > 0 ? 'block' : 'none';
        }
        
        // Update count
        if (this.elements.count) {
            this.elements.count.textContent = this.unreadCount;
        }
        
        // Update page title
        if (this.unreadCount > 0) {
            document.title = `(${this.unreadCount}) ${document.title.replace(/^\(\d+\) /, '')}`;
        } else {
            document.title = document.title.replace(/^\(\d+\) /, '');
        }
    }

    renderNotifications() {
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        let filteredNotifications = this.notifications;
        
        // Apply filters
        if (activeFilter !== 'all') {
            filteredNotifications = this.notifications.filter(n => {
                switch (activeFilter) {
                    case 'unread':
                        return !n.read;
                    case 'mentions':
                        return n.type === 'mention';
                    case 'messages':
                        return n.type === 'message';
                    default:
                        return true;
                }
            });
        }
        
        if (filteredNotifications.length === 0) {
            this.elements.list.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }
        
        const notificationsHTML = filteredNotifications.map(notification => 
            this.renderNotificationItem(notification)
        ).join('');
        
        this.elements.list.innerHTML = notificationsHTML;
    }

    renderNotificationItem(notification) {
        const timeAgo = this.timeAgo(new Date(notification.created_at));
        const readClass = notification.read ? 'read' : 'unread';
        
        return `
            <div class="notification-item ${readClass}" data-id="${notification.id}">
                <div class="notification-avatar">
                    ${notification.avatar_url ? 
                        `<img src="${notification.avatar_url}" alt="${notification.sender_name}">` :
                        `<i class="${this.getNotificationIcon(notification.type)}"></i>`
                    }
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-meta">
                        <span class="notification-time">${timeAgo}</span>
                        ${notification.sender_name ? `<span class="notification-sender">from ${notification.sender_name}</span>` : ''}
                    </div>
                </div>
                <div class="notification-actions">
                    ${!notification.read ? '<div class="unread-indicator"></div>' : ''}
                    <button class="btn-icon notification-delete" data-id="${notification.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getNotificationIcon(type) {
        const icons = {
            'message': 'fas fa-envelope',
            'mention': 'fas fa-at',
            'like': 'fas fa-heart',
            'comment': 'fas fa-comment',
            'follow': 'fas fa-user-plus',
            'job': 'fas fa-briefcase',
            'event': 'fas fa-calendar',
            'system': 'fas fa-cog'
        };
        
        return icons[type] || 'fas fa-bell';
    }

    handleNotificationClick(notificationItem) {
        const notificationId = notificationItem.dataset.id;
        const notification = this.notifications.find(n => n.id === parseInt(notificationId));
        
        if (!notification) return;
        
        // Mark as read if unread
        if (!notification.read) {
            this.markNotificationAsRead(parseInt(notificationId));
        }
        
        // Handle notification action
        if (notification.action_url) {
            window.location.href = notification.action_url;
        }
        
        this.closeNotificationCenter();
    }

    showNotificationToast(notification) {
        if (window.toastManager) {
            window.toastManager.show(
                `${notification.title}: ${notification.message}`,
                'info',
                5000
            );
        }
    }

    showBrowserNotification(notification) {
        if (Notification.permission !== 'granted') return;
        
        const browserNotification = new Notification(notification.title, {
            body: notification.message,
            icon: notification.avatar_url || '/images/icon-192x192.png',
            tag: `notification-${notification.id}`,
            requireInteraction: false
        });
        
        browserNotification.onclick = () => {
            window.focus();
            this.handleNotificationClick(
                document.querySelector(`[data-id="${notification.id}"]`)
            );
            browserNotification.close();
        };
        
        // Auto close after 5 seconds
        setTimeout(() => {
            browserNotification.close();
        }, 5000);
    }

    playNotificationSound() {
        if (!this.options.soundEnabled) return;
        
        try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {
                // Ignore errors (audio might be blocked by browser)
            });
        } catch (error) {
            // Ignore errors
        }
    }

    async requestPushPermission() {
        if (!('Notification' in window)) {
            console.warn('Browser does not support notifications');
            return false;
        }
        
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        
        return Notification.permission === 'granted';
    }

    toggleNotificationCenter() {
        if (this.isNotificationCenterOpen()) {
            this.closeNotificationCenter();
        } else {
            this.openNotificationCenter();
        }
    }

    openNotificationCenter() {
        this.elements.center.classList.add('active');
        this.elements.overlay.classList.add('active');
        document.body.classList.add('notification-center-open');
    }

    closeNotificationCenter() {
        this.elements.center.classList.remove('active');
        this.elements.overlay.classList.remove('active');
        document.body.classList.remove('notification-center-open');
    }

    isNotificationCenterOpen() {
        return this.elements.center.classList.contains('active');
    }

    setActiveFilter(filter) {
        this.elements.filters.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.renderNotifications();
    }

    startPeriodicSync() {
        // Sync notifications every 5 minutes
        setInterval(() => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                this.loadNotifications();
            }
        }, 5 * 60 * 1000);
    }

    timeAgo(date) {
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
        
        return date.toLocaleDateString();
    }

    showError(message) {
        if (this.elements.list) {
            this.elements.list.innerHTML = `
                <div class="notification-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    destroy() {
        if (this.ws) {
            this.ws.close();
        }
        
        // Remove elements
        if (this.elements.center) this.elements.center.remove();
        if (this.elements.overlay) this.elements.overlay.remove();
        if (this.elements.bell) this.elements.bell.remove();
    }
}

// Initialize notifications when user is logged in
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('alumniConnectToken');
    if (token) {
        window.notificationManager = new RealTimeNotifications();
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealTimeNotifications;
}
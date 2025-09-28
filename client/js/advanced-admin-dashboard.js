// client/js/advanced-admin-dashboard.js
// Advanced admin dashboard with comprehensive management tools

class AdvancedAdminDashboard {
    constructor(options = {}) {
        this.options = {
            endpoint: '/api/admin',
            realTimeUpdates: true,
            autoRefresh: true,
            refreshInterval: 30000,
            enableNotifications: true,
            ...options
        };
        
        this.charts = {};
        this.data = {};
        this.filters = {};
        this.selectedItems = new Set();
        this.bulkActions = [];
        
        this.init();
    }

    async init() {
        await this.checkAdminAccess();
        this.createDashboard();
        this.loadInitialData();
        this.setupEventListeners();
        this.setupRealTimeUpdates();
        this.setupBulkActions();
    }

    async checkAdminAccess() {
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'admin') {
            window.location.href = 'dashboard.html';
            throw new Error('Access denied: Admin privileges required');
        }
    }

    createDashboard() {
        const container = document.querySelector('#admin-dashboard') || document.body;
        
        const dashboardHTML = `
            <div class="advanced-admin-dashboard">
                <!-- Admin Header with Quick Actions -->
                <div class="admin-header">
                    <div class="admin-title">
                        <h1>Advanced Admin Dashboard</h1>
                        <p>Comprehensive platform management and analytics</p>
                    </div>
                    
                    <div class="admin-quick-actions">
                        <div class="admin-search">
                            <input type="text" id="global-admin-search" placeholder="Search users, content, logs...">
                            <button class="search-btn">
                                <i class="fas fa-search"></i>
                            </button>
                        </div>
                        
                        <div class="admin-notifications">
                            <button class="notification-btn" id="admin-notifications">
                                <i class="fas fa-bell"></i>
                                <span class="notification-count">3</span>
                            </button>
                        </div>
                        
                        <div class="admin-profile-menu">
                            <button class="profile-menu-btn">
                                <i class="fas fa-user-shield"></i>
                                <span>Admin</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Admin Navigation Tabs -->
                <div class="admin-nav-tabs">
                    <div class="tab-nav">
                        <button class="tab-btn active" data-tab="overview">Overview</button>
                        <button class="tab-btn" data-tab="users">User Management</button>
                        <button class="tab-btn" data-tab="content">Content Control</button>
                        <button class="tab-btn" data-tab="security">Security Center</button>
                        <button class="tab-btn" data-tab="analytics">Analytics</button>
                        <button class="tab-btn" data-tab="system">System Health</button>
                        <button class="tab-btn" data-tab="logs">Audit Logs</button>
                    </div>
                </div>

                <!-- Overview Tab -->
                <div class="tab-content active" id="overview-tab">
                    ${this.createOverviewTab()}
                </div>

                <!-- User Management Tab -->
                <div class="tab-content" id="users-tab">
                    ${this.createUserManagementTab()}
                </div>

                <!-- Content Control Tab -->
                <div class="tab-content" id="content-tab">
                    ${this.createContentControlTab()}
                </div>

                <!-- Security Center Tab -->
                <div class="tab-content" id="security-tab">
                    ${this.createSecurityCenterTab()}
                </div>

                <!-- Analytics Tab -->
                <div class="tab-content" id="analytics-tab">
                    ${this.createAnalyticsTab()}
                </div>

                <!-- System Health Tab -->
                <div class="tab-content" id="system-tab">
                    ${this.createSystemHealthTab()}
                </div>

                <!-- Audit Logs Tab -->
                <div class="tab-content" id="logs-tab">
                    ${this.createAuditLogsTab()}
                </div>

                <!-- Bulk Action Bar -->
                <div class="bulk-action-bar" id="bulk-action-bar" style="display: none;">
                    <div class="bulk-info">
                        <span id="selected-count">0</span> items selected
                    </div>
                    <div class="bulk-actions">
                        <button class="bulk-btn" data-action="approve">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="bulk-btn" data-action="reject">
                            <i class="fas fa-times"></i> Reject
                        </button>
                        <button class="bulk-btn" data-action="delete">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                        <button class="bulk-btn" data-action="export">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </div>
                    <button class="bulk-close" id="close-bulk-actions">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;

        if (container.id === 'admin-dashboard') {
            container.innerHTML = dashboardHTML;
        } else {
            container.insertAdjacentHTML('beforeend', dashboardHTML);
        }

        this.elements = {
            dashboard: document.querySelector('.advanced-admin-dashboard'),
            tabs: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content'),
            bulkActionBar: document.getElementById('bulk-action-bar'),
            selectedCount: document.getElementById('selected-count'),
            globalSearch: document.getElementById('global-admin-search')
        };
    }

    createOverviewTab() {
        return `
            <div class="overview-content">
                <!-- Key Metrics Grid -->
                <div class="metrics-overview">
                    <div class="metric-card urgent">
                        <div class="metric-header">
                            <h3>Pending Approvals</h3>
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="metric-value" id="pending-approvals">-</div>
                        <div class="metric-trend">
                            <span class="trend-indicator">+12%</span>
                            <span>vs last week</span>
                        </div>
                    </div>
                    
                    <div class="metric-card success">
                        <div class="metric-header">
                            <h3>Active Users</h3>
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="metric-value" id="active-users">-</div>
                        <div class="metric-trend">
                            <span class="trend-indicator positive">+8%</span>
                            <span>vs last month</span>
                        </div>
                    </div>
                    
                    <div class="metric-card warning">
                        <div class="metric-header">
                            <h3>Security Alerts</h3>
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <div class="metric-value" id="security-alerts">-</div>
                        <div class="metric-trend">
                            <span class="trend-indicator">3 new</span>
                            <span>today</span>
                        </div>
                    </div>
                    
                    <div class="metric-card info">
                        <div class="metric-header">
                            <h3>System Health</h3>
                            <i class="fas fa-heartbeat"></i>
                        </div>
                        <div class="metric-value" id="system-health">-</div>
                        <div class="metric-trend">
                            <span class="trend-indicator positive">Excellent</span>
                            <span>99.9% uptime</span>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions Grid -->
                <div class="quick-actions-grid">
                    <div class="action-card" data-action="manage-users">
                        <i class="fas fa-user-cog"></i>
                        <h4>Manage Users</h4>
                        <p>View and manage user accounts</p>
                    </div>
                    
                    <div class="action-card" data-action="content-moderation">
                        <i class="fas fa-filter"></i>
                        <h4>Content Moderation</h4>
                        <p>Review pending content</p>
                    </div>
                    
                    <div class="action-card" data-action="security-center">
                        <i class="fas fa-lock"></i>
                        <h4>Security Center</h4>
                        <p>Monitor security events</p>
                    </div>
                    
                    <div class="action-card" data-action="system-backup">
                        <i class="fas fa-database"></i>
                        <h4>System Backup</h4>
                        <p>Backup and restore data</p>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="recent-activity">
                    <div class="section-header">
                        <h3>Recent Admin Activity</h3>
                        <button class="view-all-btn">View All</button>
                    </div>
                    <div class="activity-list" id="recent-activity-list">
                        <div class="activity-loading">Loading recent activity...</div>
                    </div>
                </div>
            </div>
        `;
    }

    createUserManagementTab() {
        return `
            <div class="user-management-content">
                <!-- User Management Header -->
                <div class="management-header">
                    <div class="header-actions">
                        <button class="btn btn-primary" id="add-user-btn">
                            <i class="fas fa-plus"></i> Add User
                        </button>
                        <button class="btn btn-outline" id="bulk-user-actions">
                            <i class="fas fa-tasks"></i> Bulk Actions
                        </button>
                        <button class="btn btn-outline" id="export-users">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </div>
                    
                    <div class="header-filters">
                        <select id="user-role-filter">
                            <option value="">All Roles</option>
                            <option value="alumni">Alumni</option>
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                            <option value="employer">Employer</option>
                        </select>
                        
                        <select id="user-status-filter">
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                            <option value="pending">Pending</option>
                        </select>
                        
                        <input type="text" id="user-search" placeholder="Search users...">
                    </div>
                </div>

                <!-- User Statistics -->
                <div class="user-stats-grid">
                    <div class="stat-card">
                        <div class="stat-value" id="total-users-stat">0</div>
                        <div class="stat-label">Total Users</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="new-users-stat">0</div>
                        <div class="stat-label">New This Month</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="active-users-stat">0</div>
                        <div class="stat-label">Active Today</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="pending-users-stat">0</div>
                        <div class="stat-label">Pending Approval</div>
                    </div>
                </div>

                <!-- Users Table -->
                <div class="data-table-container">
                    <table class="advanced-data-table" id="users-table">
                        <thead>
                            <tr>
                                <th>
                                    <input type="checkbox" id="select-all-users">
                                </th>
                                <th data-sort="name">User</th>
                                <th data-sort="role">Role</th>
                                <th data-sort="status">Status</th>
                                <th data-sort="created_at">Joined</th>
                                <th data-sort="last_active">Last Active</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="users-table-body">
                            <tr class="loading-row">
                                <td colspan="7">
                                    <div class="loading-spinner">Loading users...</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div class="table-pagination">
                    <div class="pagination-info">
                        Showing <span id="users-start">0</span> to <span id="users-end">0</span> 
                        of <span id="users-total">0</span> users
                    </div>
                    <div class="pagination-controls">
                        <button class="pagination-btn" id="users-prev" disabled>Previous</button>
                        <div class="page-numbers" id="users-pages"></div>
                        <button class="pagination-btn" id="users-next">Next</button>
                    </div>
                </div>
            </div>
        `;
    }

    createContentControlTab() {
        return `
            <div class="content-control-content">
                <!-- Content Moderation Queue -->
                <div class="moderation-queue">
                    <div class="queue-header">
                        <h3>Content Moderation Queue</h3>
                        <div class="queue-stats">
                            <span class="queue-stat">
                                <span class="stat-number" id="pending-blogs">0</span>
                                <span class="stat-label">Blog Posts</span>
                            </span>
                            <span class="queue-stat">
                                <span class="stat-number" id="pending-jobs">0</span>
                                <span class="stat-label">Job Postings</span>
                            </span>
                            <span class="queue-stat">
                                <span class="stat-number" id="pending-events">0</span>
                                <span class="stat-label">Events</span>
                            </span>
                        </div>
                    </div>
                    
                    <div class="moderation-filters">
                        <select id="content-type-filter">
                            <option value="">All Content</option>
                            <option value="blog">Blog Posts</option>
                            <option value="job">Job Postings</option>
                            <option value="event">Events</option>
                            <option value="comment">Comments</option>
                        </select>
                        
                        <select id="content-status-filter">
                            <option value="pending">Pending Review</option>
                            <option value="flagged">Flagged Content</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    
                    <div class="content-queue-list" id="content-queue">
                        <div class="loading-message">Loading content queue...</div>
                    </div>
                </div>

                <!-- Content Analytics -->
                <div class="content-analytics">
                    <div class="analytics-header">
                        <h3>Content Analytics</h3>
                        <div class="time-range-selector">
                            <button class="time-btn active" data-range="7d">7 Days</button>
                            <button class="time-btn" data-range="30d">30 Days</button>
                            <button class="time-btn" data-range="90d">90 Days</button>
                        </div>
                    </div>
                    
                    <div class="analytics-grid">
                        <div class="analytics-card">
                            <canvas id="content-creation-chart"></canvas>
                        </div>
                        <div class="analytics-card">
                            <canvas id="content-engagement-chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createSecurityCenterTab() {
        return `
            <div class="security-center-content">
                <!-- Security Dashboard -->
                <div class="security-overview">
                    <div class="security-status">
                        <div class="status-indicator healthy">
                            <div class="status-dot"></div>
                            <span>System Secure</span>
                        </div>
                        <div class="last-scan">
                            Last security scan: <strong>2 hours ago</strong>
                        </div>
                    </div>
                    
                    <div class="security-actions">
                        <button class="btn btn-primary" id="run-security-scan">
                            <i class="fas fa-shield-alt"></i> Run Security Scan
                        </button>
                        <button class="btn btn-outline" id="view-security-logs">
                            <i class="fas fa-list"></i> View Security Logs
                        </button>
                    </div>
                </div>

                <!-- Security Alerts -->
                <div class="security-alerts">
                    <div class="section-header">
                        <h3>Recent Security Alerts</h3>
                        <span class="alert-count">3 active alerts</span>
                    </div>
                    
                    <div class="alerts-list" id="security-alerts-list">
                        <div class="loading-message">Loading security alerts...</div>
                    </div>
                </div>

                <!-- Access Control -->
                <div class="access-control">
                    <div class="section-header">
                        <h3>Access Control</h3>
                        <button class="btn btn-sm" id="manage-permissions">
                            Manage Permissions
                        </button>
                    </div>
                    
                    <div class="access-stats">
                        <div class="access-stat">
                            <div class="stat-value" id="failed-logins">0</div>
                            <div class="stat-label">Failed Logins (24h)</div>
                        </div>
                        <div class="access-stat">
                            <div class="stat-value" id="blocked-ips">0</div>
                            <div class="stat-label">Blocked IPs</div>
                        </div>
                        <div class="access-stat">
                            <div class="stat-value" id="active-sessions">0</div>
                            <div class="stat-label">Active Sessions</div>
                        </div>
                    </div>
                </div>

                <!-- Backup & Recovery -->
                <div class="backup-recovery">
                    <div class="section-header">
                        <h3>Backup & Recovery</h3>
                        <div class="backup-actions">
                            <button class="btn btn-primary" id="create-backup">
                                <i class="fas fa-database"></i> Create Backup
                            </button>
                            <button class="btn btn-outline" id="schedule-backup">
                                <i class="fas fa-clock"></i> Schedule
                            </button>
                        </div>
                    </div>
                    
                    <div class="backup-status">
                        <div class="backup-info">
                            <div class="backup-item">
                                <span class="backup-label">Last Backup:</span>
                                <span class="backup-value">Today at 3:00 AM</span>
                                <span class="backup-status-badge success">Success</span>
                            </div>
                            <div class="backup-item">
                                <span class="backup-label">Next Scheduled:</span>
                                <span class="backup-value">Tomorrow at 3:00 AM</span>
                                <span class="backup-status-badge scheduled">Scheduled</span>
                            </div>
                            <div class="backup-item">
                                <span class="backup-label">Storage Used:</span>
                                <span class="backup-value">2.4 GB of 10 GB</span>
                                <div class="storage-progress">
                                    <div class="storage-bar" style="width: 24%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createAnalyticsTab() {
        return `
            <div class="analytics-content">
                <!-- Analytics will use the existing AnalyticsDashboard component -->
                <div id="advanced-analytics-container"></div>
            </div>
        `;
    }

    createSystemHealthTab() {
        return `
            <div class="system-health-content">
                <!-- System Status Overview -->
                <div class="system-status-overview">
                    <div class="status-card">
                        <div class="status-header">
                            <h3>Server Status</h3>
                            <div class="status-indicator online">
                                <div class="status-dot"></div>
                                <span>Online</span>
                            </div>
                        </div>
                        <div class="status-metrics">
                            <div class="metric">
                                <span class="metric-label">Uptime</span>
                                <span class="metric-value" id="server-uptime">99.9%</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Response Time</span>
                                <span class="metric-value" id="response-time">142ms</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="status-card">
                        <div class="status-header">
                            <h3>Database</h3>
                            <div class="status-indicator online">
                                <div class="status-dot"></div>
                                <span>Healthy</span>
                            </div>
                        </div>
                        <div class="status-metrics">
                            <div class="metric">
                                <span class="metric-label">Connections</span>
                                <span class="metric-value" id="db-connections">45/100</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Query Time</span>
                                <span class="metric-value" id="query-time">8ms</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="status-card">
                        <div class="status-header">
                            <h3>Storage</h3>
                            <div class="status-indicator warning">
                                <div class="status-dot"></div>
                                <span>75% Used</span>
                            </div>
                        </div>
                        <div class="status-metrics">
                            <div class="metric">
                                <span class="metric-label">Used Space</span>
                                <span class="metric-value" id="storage-used">7.5 GB</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Available</span>
                                <span class="metric-value" id="storage-available">2.5 GB</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Performance Metrics -->
                <div class="performance-metrics">
                    <div class="section-header">
                        <h3>Performance Metrics</h3>
                        <div class="refresh-controls">
                            <button class="btn btn-sm" id="refresh-metrics">
                                <i class="fas fa-sync-alt"></i> Refresh
                            </button>
                        </div>
                    </div>
                    
                    <div class="metrics-grid">
                        <div class="metric-chart">
                            <h4>CPU Usage</h4>
                            <canvas id="cpu-usage-chart"></canvas>
                        </div>
                        <div class="metric-chart">
                            <h4>Memory Usage</h4>
                            <canvas id="memory-usage-chart"></canvas>
                        </div>
                        <div class="metric-chart">
                            <h4>Network Traffic</h4>
                            <canvas id="network-traffic-chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createAuditLogsTab() {
        return `
            <div class="audit-logs-content">
                <!-- Log Filters -->
                <div class="log-filters">
                    <div class="filter-group">
                        <label for="log-level-filter">Log Level:</label>
                        <select id="log-level-filter">
                            <option value="">All Levels</option>
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="error">Error</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="log-category-filter">Category:</label>
                        <select id="log-category-filter">
                            <option value="">All Categories</option>
                            <option value="authentication">Authentication</option>
                            <option value="user_management">User Management</option>
                            <option value="content_moderation">Content Moderation</option>
                            <option value="security">Security</option>
                            <option value="system">System</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="log-date-range">Date Range:</label>
                        <input type="date" id="log-start-date">
                        <span>to</span>
                        <input type="date" id="log-end-date">
                    </div>
                    
                    <div class="filter-actions">
                        <button class="btn btn-primary" id="apply-log-filters">Apply Filters</button>
                        <button class="btn btn-outline" id="export-logs">Export Logs</button>
                    </div>
                </div>

                <!-- Audit Logs Table -->
                <div class="logs-table-container">
                    <table class="logs-table" id="audit-logs-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Level</th>
                                <th>Category</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Details</th>
                                <th>IP Address</th>
                            </tr>
                        </thead>
                        <tbody id="logs-table-body">
                            <tr class="loading-row">
                                <td colspan="7">
                                    <div class="loading-spinner">Loading audit logs...</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Log Pagination -->
                <div class="logs-pagination">
                    <div class="pagination-info">
                        Showing <span id="logs-start">0</span> to <span id="logs-end">0</span> 
                        of <span id="logs-total">0</span> log entries
                    </div>
                    <div class="pagination-controls">
                        <button class="pagination-btn" id="logs-prev" disabled>Previous</button>
                        <div class="page-numbers" id="logs-pages"></div>
                        <button class="pagination-btn" id="logs-next">Next</button>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Tab switching
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Global search
        this.elements.globalSearch.addEventListener('input', (e) => {
            this.performGlobalSearch(e.target.value);
        });

        // Quick action cards
        document.addEventListener('click', (e) => {
            const actionCard = e.target.closest('.action-card');
            if (actionCard) {
                this.handleQuickAction(actionCard.dataset.action);
            }
        });

        // Bulk actions
        const bulkActionBtns = document.querySelectorAll('.bulk-btn');
        bulkActionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleBulkAction(e.target.dataset.action);
            });
        });

        // Close bulk actions
        const closeBulkBtn = document.getElementById('close-bulk-actions');
        if (closeBulkBtn) {
            closeBulkBtn.addEventListener('click', () => {
                this.closeBulkActions();
            });
        }
    }

    async loadInitialData() {
        try {
            // Load overview data
            await this.loadOverviewData();
            
            // Load current tab data
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab) {
                await this.loadTabData(activeTab.dataset.tab);
            }
        } catch (error) {
            console.error('Failed to load initial admin data:', error);
            this.showError('Failed to load admin dashboard data');
        }
    }

    async loadOverviewData() {
        try {
            const response = await window.api.get(`${this.options.endpoint}/overview`);
            this.updateOverviewMetrics(response.metrics);
            this.updateRecentActivity(response.recentActivity);
        } catch (error) {
            console.error('Failed to load overview data:', error);
        }
    }

    updateOverviewMetrics(metrics) {
        if (!metrics) return;
        
        // Update metric values with animations
        Object.keys(metrics).forEach(key => {
            const element = document.getElementById(key.replace('_', '-'));
            if (element) {
                this.animateValue(element, metrics[key]);
            }
        });
    }

    updateRecentActivity(activities) {
        const activityList = document.getElementById('recent-activity-list');
        if (!activityList || !activities) return;

        const activityHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <i class="${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-meta">
                        <span class="activity-user">${activity.user}</span>
                        <span class="activity-time">${this.formatTime(activity.timestamp)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        activityList.innerHTML = activityHTML;
    }

    switchTab(tabName) {
        // Update tab buttons
        this.elements.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab content
        this.elements.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        // Load tab-specific data
        this.loadTabData(tabName);
    }

    async loadTabData(tabName) {
        switch (tabName) {
            case 'users':
                await this.loadUserManagementData();
                break;
            case 'content':
                await this.loadContentControlData();
                break;
            case 'security':
                await this.loadSecurityData();
                break;
            case 'analytics':
                await this.loadAnalyticsData();
                break;
            case 'system':
                await this.loadSystemHealthData();
                break;
            case 'logs':
                await this.loadAuditLogsData();
                break;
        }
    }

    async loadUserManagementData() {
        try {
            const response = await window.api.get(`${this.options.endpoint}/users`);
            this.updateUsersTable(response.users);
            this.updateUserStats(response.stats);
        } catch (error) {
            console.error('Failed to load user management data:', error);
        }
    }

    setupRealTimeUpdates() {
        if (!this.options.realTimeUpdates) return;

        // WebSocket connection for real-time updates
        try {
            const token = localStorage.getItem('alumniConnectToken');
            const wsUrl = `ws://localhost:3000/admin-updates?token=${token}`;
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealTimeUpdate(data);
            };
            
        } catch (error) {
            console.error('Failed to setup real-time updates:', error);
        }
    }

    handleRealTimeUpdate(data) {
        switch (data.type) {
            case 'user_registered':
                this.updateUserCount();
                this.addRecentActivity(data);
                break;
            case 'content_submitted':
                this.updateContentQueue();
                this.addRecentActivity(data);
                break;
            case 'security_alert':
                this.addSecurityAlert(data);
                break;
        }
    }

    setupBulkActions() {
        // Select all checkbox
        const selectAllCheckbox = document.getElementById('select-all-users');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        // Individual checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('item-checkbox')) {
                this.updateSelectedItems();
            }
        });
    }

    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.item-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
        this.updateSelectedItems();
    }

    updateSelectedItems() {
        const checkedBoxes = document.querySelectorAll('.item-checkbox:checked');
        this.selectedItems = new Set(Array.from(checkedBoxes).map(cb => cb.value));
        
        this.elements.selectedCount.textContent = this.selectedItems.size;
        
        if (this.selectedItems.size > 0) {
            this.elements.bulkActionBar.style.display = 'flex';
        } else {
            this.elements.bulkActionBar.style.display = 'none';
        }
    }

    async handleBulkAction(action) {
        if (this.selectedItems.size === 0) return;

        const confirmed = await this.confirmBulkAction(action, this.selectedItems.size);
        if (!confirmed) return;

        try {
            await window.api.post(`${this.options.endpoint}/bulk-action`, {
                action,
                items: Array.from(this.selectedItems)
            });

            this.showSuccess(`Bulk ${action} completed successfully`);
            this.closeBulkActions();
            this.refreshCurrentTab();
        } catch (error) {
            console.error(`Bulk ${action} failed:`, error);
            this.showError(`Bulk ${action} failed`);
        }
    }

    animateValue(element, targetValue) {
        // Reuse animation function from analytics dashboard
        const startValue = parseInt(element.textContent.replace(/[^\d]/g, '')) || 0;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = Math.floor(startValue + (targetValue - startValue) * this.easeOutQuart(progress));
            element.textContent = currentValue.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    getActivityIcon(type) {
        const icons = {
            'user_action': 'fas fa-user',
            'content_action': 'fas fa-file',
            'security_action': 'fas fa-shield-alt',
            'system_action': 'fas fa-cog'
        };
        return icons[type] || 'fas fa-circle';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        
        return date.toLocaleDateString();
    }

    showSuccess(message) {
        if (window.toastManager) {
            window.toastManager.show(message, 'success');
        }
    }

    showError(message) {
        if (window.toastManager) {
            window.toastManager.show(message, 'error');
        }
    }

    destroy() {
        if (this.ws) {
            this.ws.close();
        }
        
        if (this.elements.dashboard) {
            this.elements.dashboard.remove();
        }
    }
}

// Auto-initialize for admin users
document.addEventListener('DOMContentLoaded', () => {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin' && document.querySelector('#admin-dashboard')) {
        window.advancedAdminDashboard = new AdvancedAdminDashboard();
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedAdminDashboard;
}
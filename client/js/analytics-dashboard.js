// client/js/analytics-dashboard.js
// Advanced analytics dashboard with interactive charts and real-time data

class AnalyticsDashboard {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            endpoint: '/api/analytics',
            autoRefresh: true,
            refreshInterval: 30000, // 30 seconds
            theme: 'light',
            animations: true,
            ...options
        };
        
        this.charts = {};
        this.data = {};
        this.refreshTimer = null;
        
        this.init();
    }

    async init() {
        this.render();
        await this.loadData();
        this.setupEventListeners();
        
        if (this.options.autoRefresh) {
            this.startAutoRefresh();
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="analytics-dashboard">
                <!-- Key Metrics Cards -->
                <div class="metrics-grid">
                    <div class="metric-card" data-metric="users">
                        <div class="metric-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value" id="total-users">-</div>
                            <div class="metric-label">Total Users</div>
                            <div class="metric-change" id="users-change">-</div>
                        </div>
                    </div>
                    
                    <div class="metric-card" data-metric="active">
                        <div class="metric-icon">
                            <i class="fas fa-user-check"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value" id="active-users">-</div>
                            <div class="metric-label">Active Users</div>
                            <div class="metric-change" id="active-change">-</div>
                        </div>
                    </div>
                    
                    <div class="metric-card" data-metric="engagement">
                        <div class="metric-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value" id="engagement-rate">-</div>
                            <div class="metric-label">Engagement Rate</div>
                            <div class="metric-change" id="engagement-change">-</div>
                        </div>
                    </div>
                    
                    <div class="metric-card" data-metric="connections">
                        <div class="metric-icon">
                            <i class="fas fa-network-wired"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value" id="total-connections">-</div>
                            <div class="metric-label">Connections Made</div>
                            <div class="metric-change" id="connections-change">-</div>
                        </div>
                    </div>
                </div>

                <!-- Charts Section -->
                <div class="charts-section">
                    <div class="chart-container">
                        <div class="chart-header">
                            <h3>User Growth Trend</h3>
                            <div class="chart-controls">
                                <select class="time-range-selector" data-chart="userGrowth">
                                    <option value="7d">Last 7 Days</option>
                                    <option value="30d" selected>Last 30 Days</option>
                                    <option value="90d">Last 90 Days</option>
                                    <option value="1y">Last Year</option>
                                </select>
                            </div>
                        </div>
                        <canvas id="userGrowthChart" class="chart-canvas"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-header">
                            <h3>User Activity</h3>
                            <div class="chart-controls">
                                <select class="time-range-selector" data-chart="userActivity">
                                    <option value="24h">Last 24 Hours</option>
                                    <option value="7d" selected>Last 7 Days</option>
                                    <option value="30d">Last 30 Days</option>
                                </select>
                            </div>
                        </div>
                        <canvas id="userActivityChart" class="chart-canvas"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-header">
                            <h3>Content Engagement</h3>
                            <div class="chart-controls">
                                <button class="chart-type-btn active" data-type="bar" data-chart="contentEngagement">
                                    <i class="fas fa-chart-bar"></i>
                                </button>
                                <button class="chart-type-btn" data-type="pie" data-chart="contentEngagement">
                                    <i class="fas fa-chart-pie"></i>
                                </button>
                            </div>
                        </div>
                        <canvas id="contentEngagementChart" class="chart-canvas"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-header">
                            <h3>Geographic Distribution</h3>
                        </div>
                        <div id="geographicMap" class="map-container">
                            <div class="map-placeholder">
                                <i class="fas fa-globe-americas"></i>
                                <p>Interactive map loading...</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Data Tables Section -->
                <div class="tables-section">
                    <div class="table-container">
                        <div class="table-header">
                            <h3>Top Performing Content</h3>
                            <div class="table-controls">
                                <input type="text" class="table-search" placeholder="Search content...">
                                <select class="content-type-filter">
                                    <option value="">All Types</option>
                                    <option value="blog">Blog Posts</option>
                                    <option value="event">Events</option>
                                    <option value="job">Job Postings</option>
                                </select>
                            </div>
                        </div>
                        <div class="table-wrapper">
                            <table class="data-table" id="topContentTable">
                                <thead>
                                    <tr>
                                        <th data-sort="title">Title</th>
                                        <th data-sort="type">Type</th>
                                        <th data-sort="views">Views</th>
                                        <th data-sort="engagement">Engagement</th>
                                        <th data-sort="date">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr class="loading-row">
                                        <td colspan="5">
                                            <div class="loading-spinner">
                                                <div class="spinner"></div>
                                                <span>Loading data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="table-container">
                        <div class="table-header">
                            <h3>Recent User Activity</h3>
                            <div class="table-controls">
                                <button class="btn btn-sm refresh-data" data-table="userActivity">
                                    <i class="fas fa-sync-alt"></i>
                                    Refresh
                                </button>
                            </div>
                        </div>
                        <div class="table-wrapper">
                            <table class="data-table" id="userActivityTable">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Action</th>
                                        <th>Target</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr class="loading-row">
                                        <td colspan="4">
                                            <div class="loading-spinner">
                                                <div class="spinner"></div>
                                                <span>Loading activity...</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Real-time Activity Feed -->
                <div class="activity-feed">
                    <div class="feed-header">
                        <h3>Live Activity Feed</h3>
                        <div class="feed-controls">
                            <button class="btn-icon toggle-feed" title="Pause/Resume">
                                <i class="fas fa-pause"></i>
                            </button>
                            <button class="btn-icon clear-feed" title="Clear">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="feed-content" id="activityFeed">
                        <div class="feed-empty">
                            <i class="fas fa-stream"></i>
                            <p>Waiting for activity...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.elements = {
            dashboard: this.container.querySelector('.analytics-dashboard'),
            metricCards: this.container.querySelectorAll('.metric-card'),
            charts: {
                userGrowth: this.container.querySelector('#userGrowthChart'),
                userActivity: this.container.querySelector('#userActivityChart'),
                contentEngagement: this.container.querySelector('#contentEngagementChart')
            },
            tables: {
                topContent: this.container.querySelector('#topContentTable'),
                userActivity: this.container.querySelector('#userActivityTable')
            },
            activityFeed: this.container.querySelector('#activityFeed'),
            controls: {
                timeRangeSelectors: this.container.querySelectorAll('.time-range-selector'),
                chartTypeButtons: this.container.querySelectorAll('.chart-type-btn'),
                refreshButtons: this.container.querySelectorAll('.refresh-data'),
                searchInputs: this.container.querySelectorAll('.table-search'),
                feedToggle: this.container.querySelector('.toggle-feed'),
                feedClear: this.container.querySelector('.clear-feed')
            }
        };
    }

    setupEventListeners() {
        // Time range selectors
        this.elements.controls.timeRangeSelectors.forEach(select => {
            select.addEventListener('change', (e) => {
                const chartName = e.target.dataset.chart;
                const timeRange = e.target.value;
                this.updateChart(chartName, { timeRange });
            });
        });

        // Chart type buttons
        this.elements.controls.chartTypeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chartName = e.target.dataset.chart;
                const chartType = e.target.dataset.type;
                
                // Update active state
                e.target.parentNode.querySelectorAll('.chart-type-btn').forEach(b => 
                    b.classList.remove('active')
                );
                e.target.classList.add('active');
                
                this.updateChart(chartName, { type: chartType });
            });
        });

        // Refresh buttons
        this.elements.controls.refreshButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const table = e.target.dataset.table;
                this.refreshTable(table);
            });
        });

        // Search inputs
        this.elements.controls.searchInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.filterTable(e.target.closest('.table-container'), e.target.value);
            });
        });

        // Activity feed controls
        if (this.elements.controls.feedToggle) {
            this.elements.controls.feedToggle.addEventListener('click', () => {
                this.toggleActivityFeed();
            });
        }

        if (this.elements.controls.feedClear) {
            this.elements.controls.feedClear.addEventListener('click', () => {
                this.clearActivityFeed();
            });
        }

        // Table sorting
        this.container.querySelectorAll('[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const table = th.closest('table');
                const column = th.dataset.sort;
                this.sortTable(table, column);
            });
        });

        // Metric card clicks for drilling down
        this.elements.metricCards.forEach(card => {
            card.addEventListener('click', () => {
                const metric = card.dataset.metric;
                this.drillDownMetric(metric);
            });
        });
    }

    async loadData() {
        try {
            const response = await window.api.get(this.options.endpoint);
            this.data = response;
            
            this.updateMetrics();
            this.updateCharts();
            this.updateTables();
            this.updateGeographicMap();
            
        } catch (error) {
            console.error('Failed to load analytics data:', error);
            this.showError('Failed to load analytics data');
        }
    }

    updateMetrics() {
        const metrics = this.data.metrics || {};
        
        // Update metric values with animation
        Object.keys(metrics).forEach(key => {
            const valueElement = this.container.querySelector(`#${key.replace('_', '-')}`);
            const changeElement = this.container.querySelector(`#${key.replace('_', '-')}-change`);
            
            if (valueElement) {
                this.animateValue(valueElement, metrics[key].current);
            }
            
            if (changeElement && metrics[key].change !== undefined) {
                const change = metrics[key].change;
                const changeText = change > 0 ? `+${change}%` : `${change}%`;
                const changeClass = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
                
                changeElement.textContent = changeText;
                changeElement.className = `metric-change ${changeClass}`;
            }
        });
    }

    updateCharts() {
        if (this.data.charts) {
            Object.keys(this.data.charts).forEach(chartName => {
                this.createChart(chartName, this.data.charts[chartName]);
            });
        }
    }

    createChart(chartName, chartData) {
        const canvas = this.elements.charts[chartName];
        if (!canvas) return;

        // Destroy existing chart
        if (this.charts[chartName]) {
            this.charts[chartName].destroy();
        }

        const ctx = canvas.getContext('2d');
        
        // Chart.js configuration
        const config = this.getChartConfig(chartName, chartData);
        
        this.charts[chartName] = new Chart(ctx, config);
    }

    getChartConfig(chartName, data) {
        const baseConfig = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            animation: {
                duration: this.options.animations ? 1000 : 0,
                easing: 'easeInOutQuart'
            }
        };

        switch (chartName) {
            case 'userGrowth':
                return {
                    type: 'line',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            label: 'New Users',
                            data: data.newUsers,
                            borderColor: '#4A90E2',
                            backgroundColor: 'rgba(74, 144, 226, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4
                        }, {
                            label: 'Total Users',
                            data: data.totalUsers,
                            borderColor: '#50E3C2',
                            backgroundColor: 'rgba(80, 227, 194, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        ...baseConfig,
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.1)'
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                }
                            }
                        }
                    }
                };

            case 'userActivity':
                return {
                    type: 'bar',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            label: 'Active Users',
                            data: data.activeUsers,
                            backgroundColor: '#4A90E2',
                            borderRadius: 8,
                            borderSkipped: false
                        }]
                    },
                    options: {
                        ...baseConfig,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                };

            case 'contentEngagement':
                return {
                    type: data.type || 'doughnut',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            data: data.values,
                            backgroundColor: [
                                '#4A90E2',
                                '#50E3C2',
                                '#F5A623',
                                '#D0021B',
                                '#7ED321',
                                '#BD10E0'
                            ],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        ...baseConfig,
                        cutout: data.type === 'doughnut' ? '60%' : 0
                    }
                };

            default:
                return baseConfig;
        }
    }

    updateTables() {
        if (this.data.tables) {
            Object.keys(this.data.tables).forEach(tableName => {
                this.populateTable(tableName, this.data.tables[tableName]);
            });
        }
    }

    populateTable(tableName, tableData) {
        const table = this.elements.tables[tableName];
        if (!table) return;

        const tbody = table.querySelector('tbody');
        
        if (!tableData || tableData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="100%" class="no-data">No data available</td></tr>';
            return;
        }

        const rows = tableData.map(row => {
            return `
                <tr>
                    ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows;
    }

    updateGeographicMap() {
        // Placeholder for geographic map implementation
        // This would integrate with a mapping library like Leaflet or Google Maps
        const mapContainer = this.container.querySelector('#geographicMap');
        if (this.data.geographic) {
            mapContainer.innerHTML = `
                <div class="geographic-stats">
                    ${this.data.geographic.map(country => `
                        <div class="country-stat">
                            <span class="country-name">${country.name}</span>
                            <span class="country-users">${country.users}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    animateValue(element, targetValue) {
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

    async updateChart(chartName, options = {}) {
        try {
            const params = new URLSearchParams({
                chart: chartName,
                ...options
            });
            
            const response = await window.api.get(`${this.options.endpoint}/chart?${params}`);
            this.createChart(chartName, response);
            
        } catch (error) {
            console.error(`Failed to update ${chartName} chart:`, error);
        }
    }

    async refreshTable(tableName) {
        const refreshBtn = this.container.querySelector(`[data-table="${tableName}"]`);
        if (refreshBtn) {
            refreshBtn.classList.add('loading');
        }

        try {
            const response = await window.api.get(`${this.options.endpoint}/table/${tableName}`);
            this.populateTable(tableName, response);
            
        } catch (error) {
            console.error(`Failed to refresh ${tableName} table:`, error);
        } finally {
            if (refreshBtn) {
                refreshBtn.classList.remove('loading');
            }
        }
    }

    filterTable(tableContainer, searchTerm) {
        const table = tableContainer.querySelector('table');
        const rows = table.querySelectorAll('tbody tr:not(.loading-row)');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
        });
    }

    sortTable(table, column) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr:not(.loading-row)'));
        const headerCell = table.querySelector(`[data-sort="${column}"]`);
        
        // Toggle sort direction
        const isAsc = headerCell.classList.contains('sort-asc');
        
        // Remove all sort classes
        table.querySelectorAll('[data-sort]').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });
        
        // Add new sort class
        headerCell.classList.add(isAsc ? 'sort-desc' : 'sort-asc');
        
        // Sort rows
        rows.sort((a, b) => {
            const aValue = a.querySelector(`td:nth-child(${headerCell.cellIndex + 1})`).textContent;
            const bValue = b.querySelector(`td:nth-child(${headerCell.cellIndex + 1})`).textContent;
            
            const comparison = isNaN(aValue) ? aValue.localeCompare(bValue) : parseFloat(aValue) - parseFloat(bValue);
            return isAsc ? -comparison : comparison;
        });
        
        // Reorder DOM
        rows.forEach(row => tbody.appendChild(row));
    }

    drillDownMetric(metric) {
        // Implement metric drill-down functionality
        console.log(`Drilling down into ${metric} metric`);
        // This would open a detailed view or navigate to a specific page
    }

    addActivityFeedItem(activity) {
        if (!this.activityFeedActive) return;

        const feedContent = this.elements.activityFeed;
        const emptyState = feedContent.querySelector('.feed-empty');
        
        if (emptyState) {
            emptyState.remove();
        }

        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="${this.getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-description">${activity.description}</div>
                <div class="activity-time">${this.formatTime(activity.timestamp)}</div>
            </div>
        `;

        feedContent.insertBefore(activityItem, feedContent.firstChild);

        // Remove items beyond limit
        const items = feedContent.querySelectorAll('.activity-item');
        if (items.length > 50) {
            items[items.length - 1].remove();
        }

        // Animate in
        activityItem.style.transform = 'translateX(-100%)';
        setTimeout(() => {
            activityItem.style.transform = 'translateX(0)';
        }, 10);
    }

    getActivityIcon(type) {
        const icons = {
            'user_signup': 'fas fa-user-plus',
            'user_login': 'fas fa-sign-in-alt',
            'content_created': 'fas fa-plus-circle',
            'connection_made': 'fas fa-handshake',
            'message_sent': 'fas fa-envelope',
            'event_created': 'fas fa-calendar-plus'
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

    toggleActivityFeed() {
        this.activityFeedActive = !this.activityFeedActive;
        const icon = this.elements.controls.feedToggle.querySelector('i');
        icon.className = this.activityFeedActive ? 'fas fa-pause' : 'fas fa-play';
    }

    clearActivityFeed() {
        this.elements.activityFeed.innerHTML = `
            <div class="feed-empty">
                <i class="fas fa-stream"></i>
                <p>Waiting for activity...</p>
            </div>
        `;
    }

    startAutoRefresh() {
        this.refreshTimer = setInterval(() => {
            this.loadData();
        }, this.options.refreshInterval);
    }

    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    showError(message) {
        if (window.toastManager) {
            window.toastManager.show(message, 'error');
        }
    }

    destroy() {
        this.stopAutoRefresh();
        
        // Destroy charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        this.container.innerHTML = '';
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsDashboard;
}
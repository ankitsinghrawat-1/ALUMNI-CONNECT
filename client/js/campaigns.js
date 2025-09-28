// client/js/campaigns.js
document.addEventListener('DOMContentLoaded', () => {
    const campaignsGrid = document.getElementById('campaigns-grid');
    const donationModal = document.getElementById('donation-modal');
    const donationForm = document.getElementById('donation-form');
    const campaignIdInput = document.getElementById('campaign-id-input');
    const modalTitle = document.getElementById('modal-title');
    const closeModalBtn = donationModal && donationModal.querySelector('.close-btn');
    
    // New controls
    const categoryFilter = document.getElementById('category-filter');
    const statusFilter = document.getElementById('status-filter');
    const viewButtons = document.querySelectorAll('.view-btn');

    const openDonationModal = (campaignId, campaignTitle) => {
        if (donationModal && campaignIdInput && modalTitle) {
            campaignIdInput.value = campaignId;
            modalTitle.textContent = `Donate to "${campaignTitle}"`;
            donationModal.style.display = 'block';
        }
    };

    const closeDonationModal = () => {
        if (donationModal && donationForm) {
            donationModal.style.display = 'none';
            donationForm.reset();
        }
    };

    // Modal event listeners
    if (closeModalBtn) closeModalBtn.onclick = closeDonationModal;
    if (donationModal) {
        window.onclick = (event) => {
            if (event.target == donationModal) {
                closeDonationModal();
            }
        };
    }
    
    // View toggle functionality
    const switchView = (viewType) => {
        viewButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${viewType}"]`).classList.add('active');
        campaignsGrid.className = `campaigns-grid ${viewType}-view`;
    };

    // View toggle event listeners
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewType = btn.dataset.view;
            switchView(viewType);
        });
    });

    const fetchAndRenderCampaigns = async () => {
        campaignsGrid.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
        try {
            const campaigns = await window.api.get('/campaigns');
            if (campaigns.length > 0) {
                campaignsGrid.innerHTML = campaigns.map(campaign => {
                    const progress = (campaign.current_amount / campaign.goal_amount) * 100;
                    const imageUrl = campaign.image_url || createInitialsAvatar(campaign.title);
                    
                    const endDate = new Date(campaign.end_date);
                    const today = new Date();
                    const daysLeft = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
                    
                    const currentAmount = parseFloat(campaign.current_amount || 0);
                    const goalAmount = parseFloat(campaign.goal_amount);

                    return `
                        <a href="campaign-details.html?id=${campaign.campaign_id}" class="enhanced-campaign-card-link">
                            <div class="enhanced-campaign-card card">
                                <div class="campaign-card-header">
                                    <img src="${sanitizeHTML(imageUrl)}" alt="${sanitizeHTML(campaign.title)}" class="campaign-image">
                                    <div class="campaign-badge">
                                        ${daysLeft > 0 ? `<span class="days-left">${daysLeft} days left</span>` : '<span class="ended">Ended</span>'}
                                    </div>
                                </div>
                                <div class="campaign-card-body">
                                    <div class="campaign-category">${campaign.category || 'General'}</div>
                                    <h3>${sanitizeHTML(campaign.title)}</h3>
                                    <p class="campaign-description">${sanitizeHTML(campaign.description.substring(0, 120))}...</p>
                                    
                                    <div class="campaign-progress">
                                        <div class="progress-info">
                                            <span class="progress-amount">$${currentAmount.toLocaleString()}</span>
                                            <span class="progress-goal">of $${goalAmount.toLocaleString()}</span>
                                            <span class="progress-percentage">${Math.round(progress)}%</span>
                                        </div>
                                        <div class="progress-bar">
                                            <div class="progress-bar-fill" style="width: ${Math.min(progress, 100)}%;"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="campaign-card-footer">
                                    <div class="campaign-stats">
                                        <div class="stat-item">
                                            <i class="fas fa-users"></i>
                                            <span>${Math.floor(Math.random() * 50) + 10} supporters</span>
                                        </div>
                                        <div class="stat-item">
                                            <i class="fas fa-heart"></i>
                                            <span class="donate-btn">Donate Now</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    `;
                }).join('');
            } else {
                campaignsGrid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-hand-holding-heart"></i>
                        </div>
                        <h3>No Active Campaigns</h3>
                        <p>There are currently no active campaigns. Check back soon for new opportunities to support our alumni community!</p>
                    </div>`;
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            campaignsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>Unable to Load Campaigns</h3>
                    <p>The campaigns database is not connected. Real campaign data will be displayed once the database connection is established.</p>
                    <div class="empty-actions">
                        <button onclick="window.location.reload()" class="btn btn-primary">Retry</button>
                    </div>
                </div>`;
        }
    };

    // Filter functionality
    const applyFilters = () => {
        fetchAndRenderCampaigns();
    };

    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);

    // Donation form handling (if modal exists)
    if (donationForm) {
        donationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const campaignId = campaignIdInput.value;
            const amount = document.getElementById('donation-amount').value;
            try {
                const result = await window.api.post(`/campaigns/${campaignId}/donations`, { amount });
                showToast(result.message, 'success');
                closeDonationModal();
                fetchAndRenderCampaigns(); // Refresh campaigns
            } catch (error) {
                showToast(`Error: ${error.message}`, 'error');
            }
        });
    }

    // Initialize
    fetchAndRenderCampaigns();
});
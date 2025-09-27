// client/js/campaigns.js
document.addEventListener('DOMContentLoaded', () => {
    const campaignsGrid = document.getElementById('campaigns-grid');
    const donationModal = document.getElementById('donation-modal');
    const donationForm = document.getElementById('donation-form');
    const campaignIdInput = document.getElementById('campaign-id-input');
    const modalTitle = document.getElementById('modal-title');
    const closeModalBtn = donationModal.querySelector('.close-btn');

    const openDonationModal = (campaignId, campaignTitle) => {
        campaignIdInput.value = campaignId;
        modalTitle.textContent = `Donate to "${campaignTitle}"`;
        donationModal.style.display = 'block';
    };

    const closeDonationModal = () => {
        donationModal.style.display = 'none';
        donationForm.reset();
    };

    closeModalBtn.onclick = closeDonationModal;
    window.onclick = (event) => {
        if (event.target == donationModal) {
            closeDonationModal();
        }
    };

    const fetchAndRenderCampaigns = async () => {
        campaignsGrid.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
        try {
            const campaigns = await window.api.get('/campaigns');
            if (campaigns.length > 0) {
                campaignsGrid.innerHTML = campaigns.map(campaign => {
                    const progress = (campaign.current_amount / campaign.goal_amount) * 100;
                    const imageUrl = campaign.image_url || 'https://via.placeholder.com/400x200?text=Alumni+Cause';
                    
                    const endDate = new Date(campaign.end_date);
                    const today = new Date();
                    const daysLeft = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));

                    return `
                        <a href="campaign-details.html?id=${campaign.campaign_id}" class="campaign-card-link">
                            <div class="campaign-card card">
                                <img src="${sanitizeHTML(imageUrl)}" alt="${sanitizeHTML(campaign.title)}" class="campaign-image">
                                <div class="campaign-content">
                                    <h3>${sanitizeHTML(campaign.title)}</h3>
                                    <p>${sanitizeHTML(campaign.description.substring(0, 100))}...</p>
                                    <div class="progress-bar">
                                        <div class="progress-bar-fill" style="width: ${progress.toFixed(2)}%;"></div>
                                    </div>
                                    <div class="campaign-stats">
                                        <span><b>$${parseFloat(campaign.current_amount || 0).toLocaleString()}</b> raised</span>
                                        <span>Goal: $${parseFloat(campaign.goal_amount).toLocaleString()}</span>
                                    </div>
                                    <div class="campaign-meta">
                                        <span><i class="fas fa-users"></i> ${campaign.donor_count} Donors</span>
                                        <span><i class="fas fa-clock"></i> ${daysLeft} Days Left</span>
                                    </div>
                                    <div class="btn btn-primary campaign-cta">View Details</div>
                                </div>
                            </div>
                        </a>
                    `;
                }).join('');
            } else {
                campaignsGrid.innerHTML = '<p class="info-message">No active campaigns at this time.</p>';
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            campaignsGrid.innerHTML = '<p class="info-message error">Could not load campaigns.</p>';
        }
    };

    // Note: The donation button on this page is removed in favor of clicking the card.
    // The modal logic is kept for the details page.
    donationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const campaignId = campaignIdInput.value;
        const amount = document.getElementById('donation-amount').value;
        try {
            const result = await window.api.post(`/campaigns/${campaignId}/donations`, { amount });
            showToast(result.message, 'success');
            closeDonationModal();
            // This form is now only used on the details page, which will refresh itself.
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    });

    fetchAndRenderCampaigns();
});
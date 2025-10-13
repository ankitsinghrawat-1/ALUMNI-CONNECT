// client/js/campaign-details.js
document.addEventListener('DOMContentLoaded', async () => {
    const detailsContainer = document.getElementById('campaign-details-container');
    const params = new URLSearchParams(window.location.search);
    const campaignId = params.get('id');

    if (!campaignId) {
        detailsContainer.innerHTML = '<h1>Campaign not found</h1>';
        return;
    }

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
    
    const fetchAndRenderDetails = async () => {
        detailsContainer.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
        try {
            const data = await window.api.get(`/campaigns/${campaignId}`);
            const campaign = data.campaign;
            const donors = data.donors;
            
            document.title = campaign.title;

            const progress = (campaign.current_amount / campaign.goal_amount) * 100;
            const imageUrl = campaign.image_url || createInitialsAvatar(campaign.title);
            const endDate = new Date(campaign.end_date);
            const today = new Date();
            const daysLeft = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));

            let donorsHtml = '<h4>No donations yet.</h4>';
            if (donors.length > 0) {
                donorsHtml = donors.map(donor => `
                    <div class="donor-item">
                        <img src="${donor.profile_pic_url ? `http://localhost:3000/${donor.profile_pic_url}` : createInitialsAvatar(donor.full_name)}" alt="${donor.full_name}" class="alumnus-pfp-round small">
                        <div>
                            <strong>${sanitizeHTML(donor.full_name)}</strong>
                            <small>Donated $${parseFloat(donor.amount).toLocaleString()}</small>
                        </div>
                    </div>
                `).join('');
            }

            detailsContainer.innerHTML = `
                <div class="campaign-details-card card">
                    <img src="${sanitizeHTML(imageUrl)}" alt="${sanitizeHTML(campaign.title)}" class="campaign-details-image">
                    <h1>${sanitizeHTML(campaign.title)}</h1>
                    <div class="campaign-full-description">
                        <p>${sanitizeHTML(campaign.description).replace(/\n/g, '<br>')}</p>
                    </div>

                    <div class="campaign-details-grid">
                        <div class="campaign-progress-box">
                            <div class="progress-bar">
                                <div class="progress-bar-fill" style="width: ${progress.toFixed(2)}%;"></div>
                            </div>
                            <div class="campaign-stats">
                                <span><b>$${parseFloat(campaign.current_amount || 0).toLocaleString()}</b> raised of $${parseFloat(campaign.goal_amount).toLocaleString()}</span>
                            </div>
                            <div class="campaign-meta">
                                <span><i class="fas fa-users"></i> ${donors.length} Donors</span>
                                <span><i class="fas fa-clock"></i> ${daysLeft} Days Left</span>
                            </div>
                            <button id="donate-btn" class="btn btn-primary btn-full-width">Donate Now</button>
                        </div>
                        <div class="recent-donors-box">
                            <h3>Recent Donors</h3>
                            <div class="donors-list">${donorsHtml}</div>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('donate-btn').addEventListener('click', () => {
                openDonationModal(campaign.campaign_id, campaign.title);
            });

        } catch (error) {
            detailsContainer.innerHTML = '<h1>Error loading campaign</h1><p class="info-message error">The campaign could not be found or there was a server error.</p>';
        }
    };

    donationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = campaignIdInput.value;
        const amount = document.getElementById('donation-amount').value;
        try {
            const result = await window.api.post(`/campaigns/${id}/donations`, { amount });
            showToast(result.message, 'success');
            closeDonationModal();
            fetchAndRenderDetails(); // Refresh details to show new donation
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    });

    fetchAndRenderDetails();
});
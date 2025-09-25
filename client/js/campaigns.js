// client/js/campaigns.js
document.addEventListener('DOMContentLoaded', () => {
    const campaignsGrid = document.getElementById('campaigns-grid');

    const campaignItemRenderer = (campaign) => {
        const progress = (campaign.current_amount / campaign.goal_amount) * 100;
        const imageUrl = campaign.image_url || 'https://via.placeholder.com/400x200?text=Alumni+Cause';
        return `
            <div class="campaign-card card">
                <img src="${sanitizeHTML(imageUrl)}" alt="${sanitizeHTML(campaign.title)}" class="campaign-image">
                <div class="campaign-content">
                    <h3>${sanitizeHTML(campaign.title)}</h3>
                    <p>${sanitizeHTML(campaign.description.substring(0, 120))}...</p>
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${progress.toFixed(2)}%;"></div>
                    </div>
                    <div class="campaign-stats">
                        <span><b>$${parseFloat(campaign.current_amount).toLocaleString()}</b> raised</span>
                        <span>Goal: $${parseFloat(campaign.goal_amount).toLocaleString()}</span>
                    </div>
                    <a href="#" class="btn btn-primary campaign-cta">Donate Now</a>
                </div>
            </div>
        `;
    };

    renderData('/campaigns', campaignsGrid, campaignItemRenderer, {
        gridClass: 'campaigns-grid',
        emptyMessage: '<p class="info-message">No active campaigns at this time.</p>'
    });
});
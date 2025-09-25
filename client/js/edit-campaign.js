document.addEventListener('DOMContentLoaded', async () => {
    const editCampaignForm = document.getElementById('edit-campaign-form');
    const params = new URLSearchParams(window.location.search);
    const campaignId = params.get('id');

    if (localStorage.getItem('userRole') !== 'admin' || !campaignId) {
        window.location.href = 'index.html';
        return;
    }

    const fetchCampaignData = async () => {
        try {
            const campaign = await window.api.get(`/campaigns/${campaignId}`);
            document.getElementById('title').value = campaign.title;
            document.getElementById('description').value = campaign.description;
            document.getElementById('goal_amount').value = campaign.goal_amount;
            document.getElementById('image_url').value = campaign.image_url;
            document.getElementById('start_date').value = new Date(campaign.start_date).toISOString().split('T')[0];
            document.getElementById('end_date').value = new Date(campaign.end_date).toISOString().split('T')[0];
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    editCampaignForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const campaignData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            goal_amount: document.getElementById('goal_amount').value,
            start_date: document.getElementById('start_date').value,
            end_date: document.getElementById('end_date').value,
            image_url: document.getElementById('image_url').value
        };

        try {
            const result = await window.api.put(`/campaigns/${campaignId}`, campaignData);
            showToast(result.message, 'success');
            setTimeout(() => window.location.href = 'campaign-management.html', 1500);
        } catch (error) {
            console.error('Error updating campaign:', error);
            showToast(`Error: ${error.message}`, 'error');
        }
    });

    await fetchCampaignData();
});
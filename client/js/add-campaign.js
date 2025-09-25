document.addEventListener('DOMContentLoaded', () => {
    const addCampaignForm = document.getElementById('add-campaign-form');

    if (localStorage.getItem('userRole') !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    addCampaignForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const campaignData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            goal_amount: document.getElementById('goal_amount').value,
            start_date: document.getElementById('start_date').value,
            end_date: document.getElementById('end_date').value,
            image_url: document.getElementById('image_url').value,
        };

        try {
            const result = await window.api.post('/campaigns', campaignData);
            showToast(result.message, 'success');
            addCampaignForm.reset();
        } catch (error) {
            console.error('Error creating campaign:', error);
            showToast(`Error: ${error.message}`, 'error');
        }
    });
});
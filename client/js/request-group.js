// client/js/request-group.js
document.addEventListener('DOMContentLoaded', () => {
    const requestGroupForm = document.getElementById('request-group-form');

    if (!localStorage.getItem('alumniConnectToken')) {
        window.location.href = 'login.html';
        return;
    }

    requestGroupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const requestData = {
            group_name: document.getElementById('group_name').value,
            group_description: document.getElementById('group_description').value,
        };

        if (!requestData.group_name || !requestData.group_description) {
            showToast('Please fill out both fields.', 'error');
            return;
        }

        try {
            const result = await window.api.post('/groups/request-creation', requestData);
            showToast(result.message, 'success');
            requestGroupForm.reset();
        } catch (error) {
            console.error('Error requesting group:', error);
            showToast(`Error: ${error.message}`, 'error');
        }
    });
});
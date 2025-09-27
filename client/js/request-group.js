// client/js/request-group.js
document.addEventListener('DOMContentLoaded', () => {
    const requestGroupForm = document.getElementById('request-group-form');
    if (!localStorage.getItem('alumniConnectToken')) {
        window.location.href = 'login.html';
        return;
    }
    requestGroupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('group_name', document.getElementById('group_name').value);
        formData.append('group_description', document.getElementById('group_description').value);
        
        const logoFile = document.getElementById('group_logo').files[0];
        if (logoFile) {
            formData.append('group_logo', logoFile);
        }
        const backgroundFile = document.getElementById('group_background').files[0];
        if (backgroundFile) {
            formData.append('group_background', backgroundFile);
        }

        if (!formData.get('group_name') || !formData.get('group_description')) {
            showToast('Please fill out both name and description.', 'error');
            return;
        }
        try {
            const result = await window.api.postForm('/groups/request-creation', formData);
            showToast(result.message, 'success');
            requestGroupForm.reset();
        } catch (error) {
            console.error('Error requesting group:', error);
            showToast(`Error: ${error.message}`, 'error');
        }
    });
});
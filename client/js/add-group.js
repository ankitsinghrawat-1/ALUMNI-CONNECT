// client/js/add-group.js
document.addEventListener('DOMContentLoaded', () => {
    const addGroupForm = document.getElementById('add-group-form');
    if (!localStorage.getItem('alumniConnectToken')) {
        window.location.href = 'login.html';
        return;
    }
    addGroupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', document.getElementById('name').value);
        formData.append('description', document.getElementById('description').value);
        const imageFile = document.getElementById('group_image').files[0];
        if (imageFile) {
            formData.append('group_image', imageFile);
        }
        if (!formData.get('name') || !formData.get('description')) {
            showToast('Group Name and Description are required.', 'error');
            return;
        }
        try {
            const result = await window.api.postForm('/groups', formData);
            showToast(result.message, 'success');
            setTimeout(() => window.location.href = `group-details.html?id=${result.groupId}`, 1500);
        } catch (error) {
            console.error('Error creating group:', error);
            showToast(`Error: ${error.message}`, 'error');
        }
    });
});
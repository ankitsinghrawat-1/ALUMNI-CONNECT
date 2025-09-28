document.addEventListener('DOMContentLoaded', () => {
    const requestGroupForm = document.getElementById('request-group-form');
    if (!requestGroupForm) return;

    if (!localStorage.getItem('alumniConnectToken')) {
        window.location.href = 'login.html';
        return;
    }

    requestGroupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = requestGroupForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        try {
            const formData = new FormData(requestGroupForm);
            
            if (!formData.get('group_name') || !formData.get('group_description')) {
                showToast('Please fill out both name and description.', 'error');
                // No early return, let finally block handle the button
            } else {
                const result = await window.api.postForm('/groups/request-creation', formData);
                showToast(result.message, 'success');
                requestGroupForm.reset();
                setTimeout(() => window.location.href = 'groups.html', 1500);
            }
        } catch (error) {
            console.error('Error requesting group:', error);
            showToast(`Error: ${error.message}`, 'error');
        } finally {
            // This 'finally' block ensures the button is ALWAYS re-enabled.
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Request';
        }
    });
});
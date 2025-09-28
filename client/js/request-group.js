document.addEventListener('DOMContentLoaded', () => {
    const requestGroupForm = document.getElementById('request-group-form');
    
    // If the form doesn't exist on this page, do nothing.
    if (!requestGroupForm) {
        return;
    }

    // Redirect to login if the user is not authenticated.
    if (!localStorage.getItem('alumniConnectToken')) {
        window.location.href = 'login.html';
        return;
    }

    requestGroupForm.addEventListener('submit', async (e) => {
        // Prevent the default form submission which causes a page refresh.
        e.preventDefault();
        
        const submitButton = requestGroupForm.querySelector('button[type="submit"]');
        
        // Disable the button and show a "Submitting..." message to prevent multiple clicks.
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        try {
            // Use the FormData constructor with the form element to easily capture all fields, including files.
            const formData = new FormData(requestGroupForm);

            // Basic client-side validation.
            if (!formData.get('group_name') || !formData.get('group_description')) {
                showToast('Please fill out both name and description.', 'error');
                // We don't return here so the `finally` block can still execute.
            } else {
                // If validation passes, send the form data to the server.
                const result = await window.api.postForm('/groups/request-creation', formData);
                
                // On success, show a message, reset the form, and redirect.
                showToast(result.message, 'success');
                requestGroupForm.reset();
                setTimeout(() => {
                    window.location.href = 'groups.html';
                }, 1500);
            }
        } catch (error) {
            // If the server returns an error, log it and show an error toast to the user.
            console.error('Error requesting group:', error);
            showToast(error.message || 'An unknown error occurred.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Request';
        }
    });
});
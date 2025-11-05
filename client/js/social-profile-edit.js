// client/js/social-profile-edit.js
document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('social-profile-form');
    
    // Field mappings
    const fields = {
        'bio': 'bio',
        'job_title': 'job_title',
        'company': 'company',
        'location': 'location',
        'skills': 'skills',
        'interests': 'interests',
        'current_project': 'current_project',
        'website': 'website',
        'linkedin': 'linkedin',
        'twitter': 'twitter',
        'github': 'github',
        'available_mentor': 'available_mentor'
    };

    // Load profile data
    async function loadProfileData() {
        try {
            const data = await window.api.get('/users/profile');
            
            // Populate fields
            Object.keys(fields).forEach(field => {
                const displayField = document.querySelector(`[data-field="${field}"]`);
                const inputField = document.getElementById(`${field}_input`);
                
                if (displayField && inputField) {
                    const value = data[field] || '';
                    
                    if (field === 'available_mentor') {
                        displayField.textContent = value ? 'Yes' : 'No';
                        inputField.value = value ? 'true' : 'false';
                    } else {
                        displayField.textContent = value || '';
                        inputField.value = value;
                    }
                    
                    // Show display field by default
                    displayField.style.display = '';
                    inputField.style.display = 'none';
                    
                    // Add click handler to toggle edit mode
                    displayField.parentElement.style.cursor = 'pointer';
                    displayField.parentElement.addEventListener('click', function(e) {
                        if (e.target.closest('.display-field')) {
                            toggleEdit(field);
                        }
                    });
                }
            });
        } catch (error) {
            console.error('Error loading profile:', error);
            showToast('Error loading profile data', 'error');
        }
    }

    // Toggle edit mode for a field
    function toggleEdit(field) {
        const displayField = document.querySelector(`[data-field="${field}"]`);
        const inputField = document.getElementById(`${field}_input`);
        
        if (displayField && inputField) {
            displayField.style.display = 'none';
            inputField.style.display = 'block';
            inputField.focus();
            
            // Add blur handler to save on blur
            inputField.addEventListener('blur', function() {
                const value = inputField.value;
                
                if (field === 'available_mentor') {
                    displayField.textContent = value === 'true' ? 'Yes' : 'No';
                } else {
                    displayField.textContent = value || '';
                }
                
                displayField.style.display = '';
                inputField.style.display = 'none';
            }, { once: true });
        }
    }

    // Handle form submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {};
            
            Object.keys(fields).forEach(field => {
                const inputField = document.getElementById(`${field}_input`);
                if (inputField) {
                    if (field === 'available_mentor') {
                        formData[field] = inputField.value === 'true';
                    } else {
                        formData[field] = inputField.value;
                    }
                }
            });
            
            try {
                await window.api.put('/users/profile', formData);
                showToast('Social profile updated successfully!', 'success');
                
                // Reload the profile data
                setTimeout(() => {
                    loadProfileData();
                }, 1000);
                
            } catch (error) {
                console.error('Error updating profile:', error);
                showToast(error.message || 'Error updating profile', 'error');
            }
        });
    }

    // Load initial data
    await loadProfileData();
});

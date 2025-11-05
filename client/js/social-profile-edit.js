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
                    
                    // Store original value
                    displayField.setAttribute('data-original-value', value);
                    
                    // Show display field by default
                    displayField.style.display = 'flex';
                    inputField.style.display = 'none';
                }
            });
            
            // Setup inline editing after data is loaded
            setupInlineEditing();
        } catch (error) {
            console.error('Error loading profile:', error);
            showToast('Error loading profile data', 'error');
        }
    }

    // Setup inline editing for all display fields
    function setupInlineEditing() {
        document.querySelectorAll('.display-field[data-field]').forEach(displayField => {
            const fieldName = displayField.getAttribute('data-field');
            const parent = displayField.closest('.profile-field');
            
            if (!parent) return;
            
            const inputField = parent.querySelector(`#${fieldName}_input`);
            
            if (!inputField) return;
            
            // Make display field clickable
            displayField.style.cursor = 'pointer';
            displayField.title = 'Click to edit';
            
            // Click handler
            displayField.addEventListener('click', function() {
                displayField.style.display = 'none';
                inputField.style.display = 'block';
                inputField.focus();
            });
            
            // Blur handler
            function handleBlur() {
                const newValue = inputField.value.trim();
                
                // Update display
                if (fieldName === 'available_mentor') {
                    displayField.textContent = newValue === 'true' ? 'Yes' : 'No';
                } else if (inputField.tagName === 'SELECT') {
                    const selectedOption = inputField.options[inputField.selectedIndex];
                    displayField.textContent = selectedOption ? selectedOption.text : '';
                } else {
                    displayField.textContent = newValue || '';
                }
                
                inputField.style.display = 'none';
                displayField.style.display = 'flex';
            }
            
            inputField.addEventListener('blur', handleBlur);
            
            // Enter key to save (except textareas)
            if (inputField.tagName !== 'TEXTAREA') {
                inputField.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        inputField.blur();
                    }
                });
            }
            
            // Escape key to cancel
            inputField.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    inputField.value = displayField.getAttribute('data-original-value') || '';
                    inputField.style.display = 'none';
                    displayField.style.display = 'flex';
                }
            });
        });
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

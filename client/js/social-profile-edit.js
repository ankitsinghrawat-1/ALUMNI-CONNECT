// client/js/social-profile-edit.js
document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('social-profile-form');
    
    // Field mappings - maps HTML data-field names to database column names
    const fieldMappings = {
        'bio': 'bio',
        'job_title': 'job_title',
        'company': 'company',
        'location': 'location',
        'skills': 'skills',
        'interests': 'interests',
        'current_project': 'current_project',
        'website': 'website',
        'linkedin': 'linkedin_profile',
        'twitter': 'twitter_profile',
        'github': 'github_profile',
        'available_mentor': 'available_mentor'
    };

    // Load profile data
    async function loadProfileData() {
        try {
            const data = await window.api.get('/users/profile');
            
            // Populate fields
            Object.keys(fieldMappings).forEach(htmlField => {
                const dbField = fieldMappings[htmlField];
                const displayField = document.querySelector(`[data-field="${htmlField}"]`);
                const inputField = document.getElementById(`${htmlField}_input`);
                
                if (displayField && inputField) {
                    const value = data[dbField] || '';
                    
                    if (htmlField === 'available_mentor') {
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
            const dbFieldName = fieldMappings[fieldName] || fieldName;
            const parent = displayField.closest('.profile-field');
            
            if (!parent) return;
            
            const inputField = parent.querySelector(`#${fieldName}_input`);
            
            if (!inputField) return;
            
            // Make display field clickable
            displayField.style.cursor = 'text';
            displayField.title = 'Click to edit';
            
            // Click handler
            displayField.addEventListener('click', function() {
                displayField.style.display = 'none';
                inputField.style.display = 'block';
                inputField.focus();
            });
            
            // Blur handler - saves to database
            async function handleBlur() {
                const newValue = inputField.value.trim();
                const oldValue = displayField.getAttribute('data-original-value') || '';
                
                // Only save if value changed
                if (newValue !== oldValue) {
                    try {
                        // Save to database using the correct database field name
                        const updateData = {};
                        if (fieldName === 'available_mentor') {
                            updateData[dbFieldName] = newValue === 'true';
                        } else {
                            updateData[dbFieldName] = newValue;
                        }
                        
                        await window.api.put('/users/profile', updateData);
                        
                        // Update display after successful save
                        if (fieldName === 'available_mentor') {
                            displayField.textContent = newValue === 'true' ? 'Yes' : 'No';
                        } else if (inputField.tagName === 'SELECT') {
                            const selectedOption = inputField.options[inputField.selectedIndex];
                            displayField.textContent = selectedOption ? selectedOption.text : '';
                        } else {
                            displayField.textContent = newValue || '';
                        }
                        
                        // Update stored original value
                        displayField.setAttribute('data-original-value', newValue);
                        
                        // Show success feedback
                        showToast(`${fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} updated`, 'success');
                    } catch (error) {
                        console.error(`Error updating ${fieldName}:`, error);
                        showToast(error.message || `Error updating ${fieldName}`, 'error');
                        // Revert to old value on error
                        inputField.value = oldValue;
                    }
                }
                
                // Update display
                if (fieldName === 'available_mentor') {
                    displayField.textContent = inputField.value === 'true' ? 'Yes' : 'No';
                } else if (inputField.tagName === 'SELECT') {
                    const selectedOption = inputField.options[inputField.selectedIndex];
                    displayField.textContent = selectedOption ? selectedOption.text : '';
                } else {
                    displayField.textContent = inputField.value || '';
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
                        handleBlur();
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
            
            Object.keys(fieldMappings).forEach(htmlField => {
                const dbField = fieldMappings[htmlField];
                const inputField = document.getElementById(`${htmlField}_input`);
                if (inputField) {
                    if (htmlField === 'available_mentor') {
                        formData[dbField] = inputField.value === 'true';
                    } else {
                        formData[dbField] = inputField.value;
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

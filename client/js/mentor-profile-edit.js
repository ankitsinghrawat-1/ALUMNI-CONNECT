// client/js/mentor-profile-edit.js
document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('mentor-profile-form');
    
    // Field mappings
    const fields = {
        'bio': 'bio',
        'job_title': 'job_title',
        'company': 'company',
        'industry': 'industry',
        'experience_years': 'experience_years',
        'hourly_rate': 'hourly_rate',
        'timezone': 'timezone',
        'mentoring_style': 'mentoring_style',
        'skills': 'skills',
        'languages': 'languages',
        'achievements': 'achievements',
        'linkedin_url': 'linkedin_url',
        'github_url': 'github_url',
        'portfolio_url': 'portfolio_url',
        'available_days': 'available_days',
        'preferred_times': 'preferred_times'
    };

    // Load mentor profile data
    async function loadMentorProfile() {
        try {
            const data = await window.api.get('/mentors/profile');
            
            // Populate fields
            Object.keys(fields).forEach(field => {
                const displayField = document.querySelector(`[data-field="${field}"]`);
                const inputField = document.getElementById(`${field}_input`);
                
                if (displayField && inputField) {
                    const value = data[field] || '';
                    
                    // Format display based on field type
                    if (field === 'mentoring_style') {
                        const styleMap = {
                            'one_on_one': 'One-on-One Sessions',
                            'group': 'Group Mentoring',
                            'workshop': 'Workshops',
                            'mixed': 'Mixed Approach'
                        };
                        displayField.textContent = styleMap[value] || value;
                    } else if (field === 'hourly_rate' && value) {
                        displayField.textContent = `$${value}/hour`;
                    } else {
                        displayField.textContent = value || '';
                    }
                    
                    inputField.value = value;
                    
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
            console.error('Error loading mentor profile:', error);
            showToast('Error loading mentor profile data', 'error');
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
                        // Save to database
                        const updateData = {};
                        updateData[fieldName] = newValue;
                        
                        await window.api.put('/mentors/profile', updateData);
                        
                        // Update display after successful save
                        if (fieldName === 'mentoring_style') {
                            const styleMap = {
                                'one_on_one': 'One-on-One Sessions',
                                'group': 'Group Mentoring',
                                'workshop': 'Workshops',
                                'mixed': 'Mixed Approach'
                            };
                            displayField.textContent = styleMap[newValue] || newValue;
                        } else if (fieldName === 'hourly_rate' && newValue) {
                            displayField.textContent = `$${newValue}/hour`;
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
                if (fieldName === 'mentoring_style') {
                    const styleMap = {
                        'one_on_one': 'One-on-One Sessions',
                        'group': 'Group Mentoring',
                        'workshop': 'Workshops',
                        'mixed': 'Mixed Approach'
                    };
                    displayField.textContent = styleMap[inputField.value] || inputField.value;
                } else if (fieldName === 'hourly_rate' && inputField.value) {
                    displayField.textContent = `$${inputField.value}/hour`;
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
            
            Object.keys(fields).forEach(field => {
                const inputField = document.getElementById(`${field}_input`);
                if (inputField) {
                    formData[field] = inputField.value;
                }
            });
            
            try {
                await window.api.put('/mentors/profile', formData);
                showToast('Mentor profile updated successfully!', 'success');
                
                // Reload the profile data
                setTimeout(() => {
                    loadMentorProfile();
                }, 1000);
                
            } catch (error) {
                console.error('Error updating mentor profile:', error);
                showToast(error.message || 'Error updating mentor profile', 'error');
            }
        });
    }

    // Load initial data
    await loadMentorProfile();
});

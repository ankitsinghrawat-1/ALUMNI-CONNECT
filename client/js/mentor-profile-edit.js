// Mentor Profile Edit Page
document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const loadingState = document.getElementById('loading-state');
    const editContainer = document.getElementById('edit-container');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
    const editProfileForm = document.getElementById('edit-profile-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const previewChangesBtn = document.getElementById('preview-changes-btn');
    const previewModal = document.getElementById('preview-modal');
    const closePreviewModal = document.getElementById('close-preview-modal');
    const backToEditBtn = document.getElementById('back-to-edit-btn');
    const confirmSaveBtn = document.getElementById('confirm-save-btn');

    // State
    let currentMentor = null;
    let mentorId = null;

    // Check authentication
    if (!localStorage.getItem('alumniConnectToken')) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize
    await initializePage();

    // Event Listeners
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', handleProfileUpdate);
    }
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Redirect back to view page
            window.location.href = mentorId ? `mentor-profile.html?id=${mentorId}` : 'mentor-profile.html';
        });
    }
    if (previewChangesBtn) {
        previewChangesBtn.addEventListener('click', showPreview);
    }
    if (closePreviewModal) {
        closePreviewModal.addEventListener('click', closePreview);
    }
    if (backToEditBtn) {
        backToEditBtn.addEventListener('click', closePreview);
    }
    if (confirmSaveBtn) {
        confirmSaveBtn.addEventListener('click', confirmAndSave);
    }

    // Availability checkbox handlers
    document.querySelectorAll('.availability-checkbox input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const day = this.closest('.availability-day').dataset.day;
            const startInput = document.querySelector(`input[name="${day}_start"]`);
            const endInput = document.querySelector(`input[name="${day}_end"]`);
            
            if (this.checked) {
                startInput.disabled = false;
                endInput.disabled = false;
                startInput.required = true;
                endInput.required = true;
            } else {
                startInput.disabled = true;
                endInput.disabled = true;
                startInput.required = false;
                endInput.required = false;
                startInput.value = '';
                endInput.value = '';
            }
        });
    });

    async function initializePage() {
        try {
            // Get current user's mentor status
            const statusData = await window.api.get('/mentors/status');
            if (!statusData.isMentor || !statusData.mentorId) {
                showError('You must be a registered mentor to edit your profile');
                return;
            }

            mentorId = statusData.mentorId;
            
            // Load mentor profile
            await loadMentorProfile(mentorId);
            
        } catch (error) {
            console.error('Error initializing:', error);
            showError('Failed to load your mentor profile');
        }
    }

    async function loadMentorProfile(profileMentorId) {
        showLoading(true);
        
        try {
            // Fetch mentor data
            currentMentor = await window.api.get(`/mentors/${profileMentorId}`);
            
            // Populate edit form
            populateEditForm(currentMentor);
            
            // Show edit container
            editContainer.style.display = 'block';
            
        } catch (error) {
            console.error('Error loading mentor profile:', error);
            showError(error.message || 'Failed to load mentor profile');
        } finally {
            showLoading(false);
        }
    }

    function populateEditForm(mentor) {
        document.getElementById('edit-bio').value = mentor.bio || '';
        document.getElementById('edit-industry').value = mentor.industry || '';
        document.getElementById('edit-experience-years').value = mentor.experience_years || '';
        document.getElementById('edit-hourly-rate').value = mentor.hourly_rate || '';
        document.getElementById('edit-timezone').value = mentor.timezone || 'UTC';
        document.getElementById('edit-skills').value = mentor.skills || '';
        document.getElementById('edit-languages').value = mentor.languages || '';
        document.getElementById('edit-mentoring-style').value = mentor.mentoring_style || 'one_on_one';
        document.getElementById('edit-linkedin-url').value = mentor.linkedin_url || '';
        document.getElementById('edit-github-url').value = mentor.github_url || '';
        document.getElementById('edit-portfolio-url').value = mentor.portfolio_url || '';
        
        // Populate availability
        if (mentor.availability && mentor.availability.length > 0) {
            mentor.availability.forEach(avail => {
                const day = avail.day_of_week.toLowerCase();
                const checkbox = document.querySelector(`input[name="availability_${day}"]`);
                const startInput = document.querySelector(`input[name="${day}_start"]`);
                const endInput = document.querySelector(`input[name="${day}_end"]`);
                
                if (checkbox) {
                    checkbox.checked = true;
                    if (startInput) {
                        startInput.disabled = false;
                        startInput.required = true;
                        startInput.value = avail.start_time || '';
                    }
                    if (endInput) {
                        endInput.disabled = false;
                        endInput.required = true;
                        endInput.value = avail.end_time || '';
                    }
                }
            });
        }
    }

    async function handleProfileUpdate(e) {
        e.preventDefault();

        const formData = new FormData(editProfileForm);
        const updates = {};
        const availability = [];

        // Process regular form fields
        for (const [key, value] of formData.entries()) {
            // Skip availability fields, we'll process them separately
            if (key.startsWith('availability_') || key.includes('_start') || key.includes('_end')) {
                continue;
            }
            if (value && value.trim()) {
                updates[key] = value.trim();
            }
        }

        // Process availability
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        days.forEach(day => {
            if (formData.get(`availability_${day}`)) {
                const start = formData.get(`${day}_start`);
                const end = formData.get(`${day}_end`);
                if (start && end) {
                    availability.push({
                        day_of_week: day,
                        start_time: start,
                        end_time: end
                    });
                }
            }
        });

        if (availability.length > 0) {
            updates.availability = availability;
        }

        try {
            showToast('Updating profile...', 'info');
            
            await window.api.put('/mentors/profile', updates);
            
            showToast('Profile updated successfully!', 'success');
            
            // Redirect back to view page after 1.5 seconds
            setTimeout(() => {
                window.location.href = `mentor-profile.html?id=${mentorId}`;
            }, 1500);
            
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast(error.message || 'Failed to update profile', 'error');
        }
    }

    // Preview Changes
    function showPreview() {
        const formData = new FormData(editProfileForm);
        const previewData = {};
        
        for (const [key, value] of formData.entries()) {
            if (value && value.trim()) {
                previewData[key] = value.trim();
            }
        }
        
        // Build preview HTML
        let previewHTML = `
            <div class="preview-content">
                <h3>Profile Preview</h3>
                <div class="preview-section">
                    <h4><i class="fas fa-user"></i> Basic Information</h4>
                    <p><strong>Bio:</strong> ${sanitizeHTML(previewData.bio || currentMentor.bio || 'Not provided')}</p>
                    <p><strong>Industry:</strong> ${sanitizeHTML(previewData.industry || currentMentor.industry || 'Not provided')}</p>
                    <p><strong>Experience:</strong> ${previewData.experience_years || currentMentor.experience_years || 'Not provided'} years</p>
                    <p><strong>Hourly Rate:</strong> $${previewData.hourly_rate || currentMentor.hourly_rate || 'Not set'}/hour</p>
                    <p><strong>Timezone:</strong> ${previewData.timezone || currentMentor.timezone || 'UTC'}</p>
                    <p><strong>Mentoring Style:</strong> ${formatMentoringStyle(previewData.mentoring_style || currentMentor.mentoring_style)}</p>
                </div>
                
                <div class="preview-section">
                    <h4><i class="fas fa-tools"></i> Skills & Languages</h4>
                    <p><strong>Skills:</strong> ${sanitizeHTML(previewData.skills || currentMentor.skills || 'Not provided')}</p>
                    <p><strong>Languages:</strong> ${sanitizeHTML(previewData.languages || currentMentor.languages || 'Not provided')}</p>
                </div>
                
                <div class="preview-section">
                    <h4><i class="fas fa-link"></i> Social Links</h4>
                    <p><strong>LinkedIn:</strong> ${previewData.linkedin_url || currentMentor.linkedin_url || 'Not provided'}</p>
                    <p><strong>GitHub:</strong> ${previewData.github_url || currentMentor.github_url || 'Not provided'}</p>
                    <p><strong>Portfolio:</strong> ${previewData.portfolio_url || currentMentor.portfolio_url || 'Not provided'}</p>
                </div>
                
                <div class="preview-section">
                    <h4><i class="fas fa-calendar-alt"></i> Availability</h4>
                    ${generateAvailabilityPreview(formData)}
                </div>
            </div>
        `;
        
        document.getElementById('preview-modal-body').innerHTML = previewHTML;
        previewModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function generateAvailabilityPreview(formData) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const availDays = [];
        
        days.forEach(day => {
            if (formData.get(`availability_${day}`)) {
                const start = formData.get(`${day}_start`);
                const end = formData.get(`${day}_end`);
                if (start && end) {
                    availDays.push(`<p>${capitalizeFirst(day)}: ${start} - ${end}</p>`);
                }
            }
        });
        
        return availDays.length > 0 ? availDays.join('') : '<p>No availability set</p>';
    }

    function closePreview() {
        previewModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    async function confirmAndSave() {
        closePreview();
        await handleProfileUpdate(new Event('submit'));
    }

    // Helper Functions
    function showLoading(show) {
        loadingState.style.display = show ? 'flex' : 'none';
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorState.style.display = 'flex';
        loadingState.style.display = 'none';
        editContainer.style.display = 'none';
    }

    function sanitizeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatMentoringStyle(style) {
        if (!style) return 'Not specified';
        const styles = {
            'one_on_one': 'One-on-One Sessions',
            'group': 'Group Mentoring',
            'workshop': 'Workshops',
            'mixed': 'Mixed Approach'
        };
        return styles[style] || style;
    }

    function capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
});

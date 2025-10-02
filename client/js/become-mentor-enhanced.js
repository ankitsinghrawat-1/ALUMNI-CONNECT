// Enhanced Become Mentor JavaScript - Redesigned
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!localStorage.getItem('alumniConnectToken')) {
        window.location.href = 'login.html';
        return;
    }

    // DOM Elements
    const form = document.getElementById('become-mentor-form');
    const steps = document.querySelectorAll('.form-step');
    const progressStepItems = document.querySelectorAll('.progress-step-item');
    const progressPercentage = document.getElementById('progress-percentage');
    const currentTip = document.getElementById('current-tip');
    const nextButtons = document.querySelectorAll('.next-step');
    const prevButtons = document.querySelectorAll('.prev-step');
    const submitButton = document.querySelector('.submit-application');
    const messageDiv = document.getElementById('message');

    // Skills functionality
    const skillsInput = document.getElementById('skills-input');
    const skillsContainer = document.getElementById('skills-tags');
    const skillsHidden = document.getElementById('skills');
    
    // Specializations functionality
    const specializationsContainer = document.getElementById('specializations-container');
    const addSpecializationBtn = document.getElementById('add-specialization');

    // Character counter
    const bioTextarea = document.getElementById('bio');
    const bioCounter = document.getElementById('bio-count');

    // State
    let currentStep = 1;
    let skillsArray = [];
    let completedSteps = [];
    
    // Pro tips for each step
    const proTips = {
        1: 'Complete all sections to increase your visibility to potential mentees.',
        2: 'Add at least 5 skills to make your profile more searchable.',
        3: 'Being flexible with your availability increases connection opportunities.',
        4: 'Setting competitive pricing helps attract more mentees.'
    };

    // Initialize
    initializeForm();

    // Event Listeners
    nextButtons.forEach(btn => btn.addEventListener('click', nextStep));
    prevButtons.forEach(btn => btn.addEventListener('click', prevStep));
    form.addEventListener('submit', handleSubmit);
    
    // Prevent Enter key from submitting the form (except on submit button, textarea, and skills input)
    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && 
            e.target.type !== 'textarea' && 
            e.target.type !== 'submit' &&
            e.target.id !== 'skills-input') {
            e.preventDefault();
            return false;
        }
    });

    // Skills functionality
    if (skillsInput) {
        skillsInput.addEventListener('keypress', handleSkillInput);
    }
    if (addSpecializationBtn) {
        addSpecializationBtn.addEventListener('click', addSpecialization);
    }

    // Bio character counter
    if (bioTextarea) {
        bioTextarea.addEventListener('input', updateCharCounter);
    }

    // Availability handling
    setupAvailabilityHandlers();

    // Day checkbox handlers
    const dayCheckboxes = document.querySelectorAll('input[name="available_days"]');
    dayCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', toggleDayAvailability);
    });
    
    // Smooth scroll for hero button
    const scrollBtn = document.querySelector('.btn-scroll-down');
    if (scrollBtn) {
        scrollBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('application-form').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        });
    }

    function initializeForm() {
        showStep(1);
        updateProgress();
        updateCharCounter();
        
        // Initialize with one specialization
        if (specializationsContainer && specializationsContainer.children.length === 0) {
            addSpecialization();
        }

        // Set up remove handlers for existing specializations
        setupSpecializationHandlers();
    }

    function showStep(stepNumber) {
        // Hide all steps
        steps.forEach(step => step.classList.remove('active'));
        progressStepItems.forEach(step => {
            step.classList.remove('active');
            if (completedSteps.includes(parseInt(step.dataset.step))) {
                step.classList.add('completed');
            }
        });

        // Show current step
        const currentStepElement = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
        const currentProgressItem = document.querySelector(`.progress-step-item[data-step="${stepNumber}"]`);
        
        if (currentStepElement) {
            currentStepElement.classList.add('active');
        }
        
        if (currentProgressItem) {
            currentProgressItem.classList.add('active');
        }

        currentStep = stepNumber;
        
        // Update tip
        if (currentTip && proTips[stepNumber]) {
            currentTip.textContent = proTips[stepNumber];
        }
        
        // Update progress percentage
        updateProgress();
    }
    
    function updateProgress() {
        const totalSteps = 4;
        const percentage = Math.round((completedSteps.length / totalSteps) * 100);
        if (progressPercentage) {
            progressPercentage.textContent = percentage + '%';
        }
    }

    function nextStep() {
        if (validateCurrentStep()) {
            // Mark current step as completed
            if (!completedSteps.includes(currentStep)) {
                completedSteps.push(currentStep);
            }
            if (currentStep < 4) {
                showStep(currentStep + 1);
            }
        }
    }

    function prevStep() {
        if (currentStep > 1) {
            showStep(currentStep - 1);
        }
    }

    function validateCurrentStep() {
        const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
        const requiredFields = currentStepElement.querySelectorAll('[required]');
        let isValid = true;

        // Clear previous errors
        currentStepElement.querySelectorAll('.error').forEach(el => {
            el.classList.remove('error');
        });

        // Validate required fields
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error');
                isValid = false;
            }
        });

        // Custom validations
        switch (currentStep) {
            case 1:
                // Validate bio length
                const bio = document.getElementById('bio').value;
                if (bio.length < 50) {
                    document.getElementById('bio').classList.add('error');
                    showToast('Bio must be at least 50 characters long', 'error');
                    isValid = false;
                }
                break;

            case 2:
                // Validate expertise areas
                const expertise = document.getElementById('expertise_areas').value;
                if (expertise.length < 20) {
                    document.getElementById('expertise_areas').classList.add('error');
                    showToast('Please provide more detailed expertise areas', 'error');
                    isValid = false;
                }
                break;

            case 3:
                // Validate at least one day is selected
                const checkedDays = document.querySelectorAll('input[name="available_days"]:checked');
                if (checkedDays.length === 0) {
                    showToast('Please select at least one available day', 'error');
                    isValid = false;
                }
                
                // Validate time slots for checked days
                let hasValidTimeSlots = false;
                checkedDays.forEach(dayCheckbox => {
                    const day = dayCheckbox.value;
                    const startTimes = document.querySelectorAll(`input[name="${day}_start[]"]`);
                    const endTimes = document.querySelectorAll(`input[name="${day}_end[]"]`);
                    
                    for (let i = 0; i < startTimes.length; i++) {
                        if (startTimes[i].value && endTimes[i].value) {
                            hasValidTimeSlots = true;
                            break;
                        }
                    }
                });
                
                if (!hasValidTimeSlots) {
                    showToast('Please set at least one time slot for your available days', 'error');
                    isValid = false;
                }
                break;

            case 4:
                // Validate agreements
                const termsAgreement = document.getElementById('terms_agreement');
                const qualityCommitment = document.getElementById('quality_commitment');
                
                if (!termsAgreement.checked) {
                    showToast('Please agree to the Terms of Service', 'error');
                    isValid = false;
                }
                
                if (!qualityCommitment.checked) {
                    showToast('Please commit to quality mentorship standards', 'error');
                    isValid = false;
                }
                break;
        }

        if (!isValid) {
            // Scroll to first error
            const firstError = currentStepElement.querySelector('.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        return isValid;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        
        if (!validateCurrentStep()) {
            return;
        }

        const submitBtn = e.target.querySelector('.submit-application');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Profile...';

            const formData = collectFormData();
            console.log('Submitting mentor data:', formData);

            const result = await window.api.post('/mentors', formData);
            
            showToast('Mentor profile created successfully!', 'success');
            messageDiv.className = 'form-message success';
            messageDiv.textContent = result.message;
            
            // Redirect after success
            setTimeout(() => {
                window.location.href = 'browse-mentors.html';
            }, 2000);

        } catch (error) {
            console.error('Error creating mentor profile:', error);
            showToast(error.message || 'Failed to create mentor profile', 'error');
            messageDiv.className = 'form-message error';
            messageDiv.textContent = `Error: ${error.message}`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    function collectFormData() {
        const formData = new FormData(form);
        const data = {};

        // Basic form fields
        for (let [key, value] of formData.entries()) {
            if (key.includes('[]')) {
                // Handle array fields
                const fieldName = key.replace('[]', '');
                if (!data[fieldName]) data[fieldName] = [];
                if (value) data[fieldName].push(value);
            } else {
                data[key] = value;
            }
        }

        // Process communication methods
        const communicationMethods = [];
        document.querySelectorAll('input[name="communication_methods"]:checked').forEach(cb => {
            communicationMethods.push(cb.value);
        });
        data.communication_methods = communicationMethods;

        // Process specializations
        const specializations = [];
        const specNames = document.querySelectorAll('input[name="specialization[]"]');
        const specLevels = document.querySelectorAll('select[name="proficiency[]"]');
        const specYears = document.querySelectorAll('input[name="spec_years[]"]');

        for (let i = 0; i < specNames.length; i++) {
            if (specNames[i].value.trim()) {
                specializations.push({
                    specialization: specNames[i].value.trim(),
                    proficiency_level: specLevels[i].value,
                    years_experience: parseInt(specYears[i].value) || 0
                });
            }
        }
        data.specializations = specializations;

        // Process availability
        const availability = [];
        const checkedDays = document.querySelectorAll('input[name="available_days"]:checked');
        
        checkedDays.forEach(dayCheckbox => {
            const day = dayCheckbox.value;
            const startTimes = document.querySelectorAll(`input[name="${day}_start[]"]`);
            const endTimes = document.querySelectorAll(`input[name="${day}_end[]"]`);
            
            for (let i = 0; i < startTimes.length; i++) {
                if (startTimes[i].value && endTimes[i].value) {
                    availability.push({
                        day_of_week: day,
                        start_time: startTimes[i].value,
                        end_time: endTimes[i].value
                    });
                }
            }
        });
        data.availability = availability;

        // Process skills
        data.skills = skillsArray.join(', ');

        // Convert numeric fields
        if (data.experience_years) data.experience_years = parseInt(data.experience_years);
        if (data.hourly_rate) data.hourly_rate = parseFloat(data.hourly_rate);
        if (data.response_time_hours) data.response_time_hours = parseInt(data.response_time_hours);
        if (data.max_mentees_active) data.max_mentees_active = parseInt(data.max_mentees_active);
        if (data.preferred_session_length) data.preferred_session_length = parseInt(data.preferred_session_length);
        if (data.advance_booking_days) data.advance_booking_days = parseInt(data.advance_booking_days);
        if (data.buffer_time_minutes) data.buffer_time_minutes = parseInt(data.buffer_time_minutes);

        // Boolean fields
        data.notification_email = document.querySelector('input[name="notification_email"]').checked;
        data.notification_sms = document.querySelector('input[name="notification_sms"]').checked;
        data.auto_accept_requests = document.querySelector('input[name="auto_accept_requests"]').checked;
        data.weekend_availability = document.querySelector('input[name="weekend_availability"]').checked;

        return data;
    }

    // Skills functionality
    function handleSkillInput(e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addSkill();
        }
    }

    function addSkill() {
        const skill = skillsInput.value.trim();
        if (skill && !skillsArray.includes(skill)) {
            skillsArray.push(skill);
            renderSkills();
            skillsInput.value = '';
            updateSkillsHidden();
        }
    }

    function removeSkill(index) {
        skillsArray.splice(index, 1);
        renderSkills();
        updateSkillsHidden();
    }

    function renderSkills() {
        skillsContainer.innerHTML = '';
        skillsArray.forEach((skill, index) => {
            const skillTag = document.createElement('div');
            skillTag.className = 'skill-tag';
            skillTag.innerHTML = `
                <span>${sanitizeHTML(skill)}</span>
                <button type="button" class="remove-skill" onclick="removeSkill(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            skillsContainer.appendChild(skillTag);
        });
    }

    function updateSkillsHidden() {
        skillsHidden.value = skillsArray.join(', ');
    }

    // Expose removeSkill globally
    window.removeSkill = removeSkill;

    // Specializations functionality
    function addSpecialization() {
        const specializationItem = document.createElement('div');
        specializationItem.className = 'specialization-item';
        specializationItem.innerHTML = `
            <div class="spec-inputs">
                <input type="text" placeholder="Specialization (e.g., Machine Learning)" 
                       name="specialization[]" class="spec-name" required>
                <select name="proficiency[]" class="spec-level">
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                </select>
                <input type="number" placeholder="Years" name="spec_years[]" 
                       class="spec-years" min="0" max="50">
                <button type="button" class="remove-spec" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        specializationsContainer.appendChild(specializationItem);
        setupSpecializationHandlers();
    }

    function setupSpecializationHandlers() {
        const removeButtons = document.querySelectorAll('.remove-spec');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                if (specializationsContainer.children.length > 1) {
                    this.closest('.specialization-item').remove();
                } else {
                    showToast('At least one specialization is required', 'warning');
                }
            });
        });
    }

    // Character counter
    function updateCharCounter() {
        const count = bioTextarea.value.length;
        bioCounter.textContent = count;
        
        if (count > 500) {
            bioCounter.style.color = 'var(--mentor-accent)';
            bioTextarea.value = bioTextarea.value.substring(0, 500);
            bioCounter.textContent = 500;
        } else if (count < 50) {
            bioCounter.style.color = 'var(--mentor-gray-500)';
        } else {
            bioCounter.style.color = 'var(--become-mentor-success)';
        }
    }

    // Availability functionality
    function setupAvailabilityHandlers() {
        // Add time slot buttons
        const addTimeButtons = document.querySelectorAll('.add-time-slot');
        addTimeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const day = this.dataset.day;
                addTimeSlot(day);
            });
        });

        // Remove time slot buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-time-slot') || 
                e.target.closest('.remove-time-slot')) {
                const timeSlot = e.target.closest('.time-slot');
                const timeSlotsContainer = timeSlot.parentElement;
                
                if (timeSlotsContainer.children.length > 1) {
                    timeSlot.remove();
                } else {
                    showToast('At least one time slot is required for each selected day', 'warning');
                }
            }
        });
    }

    function toggleDayAvailability(e) {
        const day = e.target.value;
        const timeSlots = document.querySelector(`[data-day="${day}"]`);
        const addButton = document.querySelector(`[data-day="${day}"] + .add-time-slot`);
        const inputs = timeSlots.querySelectorAll('input');
        
        if (e.target.checked) {
            inputs.forEach(input => {
                input.disabled = false;
                input.required = true;
            });
            addButton.disabled = false;
        } else {
            inputs.forEach(input => {
                input.disabled = true;
                input.required = false;
                input.value = '';
            });
            addButton.disabled = true;
        }
    }

    function addTimeSlot(day) {
        const timeSlotsContainer = document.querySelector(`[data-day="${day}"]`);
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        timeSlot.innerHTML = `
            <input type="time" name="${day}_start[]" class="time-input" required>
            <span>to</span>
            <input type="time" name="${day}_end[]" class="time-input" required>
            <button type="button" class="remove-time-slot">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        timeSlotsContainer.appendChild(timeSlot);
    }

    // Toast notifications
    function showToast(message, type = 'info') {
        if (window.Toastify) {
            const backgrounds = {
                success: 'linear-gradient(to right, #00b09b, #96c93d)',
                error: 'linear-gradient(to right, #ff5f6d, #ffc371)',
                info: 'linear-gradient(to right, #667eea, #764ba2)',
                warning: 'linear-gradient(to right, #f093fb, #f5576c)'
            };

            window.Toastify({
                text: message,
                duration: 4000,
                gravity: 'top',
                position: 'right',
                background: backgrounds[type] || backgrounds.info,
                stopOnFocus: true
            }).showToast();
        } else {
            alert(message); // Fallback
        }
    }

    // Utility function
    function sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Add error styling
    const style = document.createElement('style');
    style.textContent = `
        .error {
            border-color: var(--mentor-accent) !important;
            box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1) !important;
        }
        
        .error:focus {
            box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.2) !important;
        }
    `;
    document.head.appendChild(style);

    // Auto-save to localStorage (optional)
    function autoSave() {
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        data.skills = skillsArray;
        data.currentStep = currentStep;
        
        localStorage.setItem('mentorApplicationDraft', JSON.stringify(data));
    }

    // Load draft (optional)
    function loadDraft() {
        const draft = localStorage.getItem('mentorApplicationDraft');
        if (draft) {
            try {
                const data = JSON.parse(draft);
                
                // Populate form fields
                Object.keys(data).forEach(key => {
                    const field = document.querySelector(`[name="${key}"]`);
                    if (field && key !== 'skills' && key !== 'currentStep') {
                        field.value = data[key];
                    }
                });

                // Restore skills
                if (data.skills && Array.isArray(data.skills)) {
                    skillsArray = data.skills;
                    renderSkills();
                    updateSkillsHidden();
                }

                // Restore step
                if (data.currentStep) {
                    showStep(data.currentStep);
                }

                showToast('Draft restored', 'info');
            } catch (error) {
                console.error('Error loading draft:', error);
            }
        }
    }

    // Uncomment to enable auto-save functionality
    // setInterval(autoSave, 30000); // Auto-save every 30 seconds
    // loadDraft(); // Load draft on page load

    // Clear draft after successful submission
    window.addEventListener('beforeunload', (e) => {
        if (currentStep < 4) {
            autoSave();
        }
    });
});
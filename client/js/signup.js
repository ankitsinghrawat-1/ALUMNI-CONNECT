// client/js/signup.js
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const roleTabs = document.querySelectorAll('.role-tab');
    const roleInput = document.getElementById('role-input');

    const fieldsConfig = {
        alumni: ['full_name', 'email', 'password', 'confirm_password', 'dob', 'address', 'city', 'country', 'phone_number', 'linkedin_profile', 'academic', 'professional', 'bio', 'skills'],
        student: ['full_name', 'email', 'password', 'confirm_password', 'dob', 'address', 'city', 'country', 'phone_number', 'linkedin_profile', 'academic', 'bio', 'skills'],
        faculty: ['full_name', 'email', 'password', 'confirm_password', 'dob', 'address', 'city', 'country', 'phone_number', 'linkedin_profile', 'professional', 'bio', 'skills'],
        employer: ['full_name', 'email', 'password', 'confirm_password', 'address', 'city', 'country', 'phone_number', 'website', 'industry', 'bio'],
        institute: ['full_name', 'email', 'password', 'confirm_password', 'address', 'city', 'country', 'phone_number', 'website', 'bio']
    };

    const updateFormFields = (role) => {
        // Hide all fields first
        document.querySelectorAll('[data-role-field]').forEach(field => {
            field.style.display = 'none';
        });

        // Show fields for the selected role
        const fieldsToShow = fieldsConfig[role];
        if (fieldsToShow) {
            fieldsToShow.forEach(fieldName => {
                document.querySelectorAll(`[data-role-field="${fieldName}"]`).forEach(field => {
                    field.style.display = 'block'; // Or 'flex' for form-row
                });
            });
        }
        
        // Handle name field label
        const nameLabel = document.querySelector('[data-role-field="full_name"] label');
        if (role === 'employer' || role === 'institute') {
            nameLabel.textContent = role.charAt(0).toUpperCase() + role.slice(1) + ' Name';
        } else {
            nameLabel.textContent = 'Full Name';
        }
    };

    roleTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            roleTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Set role value and update fields
            const selectedRole = tab.dataset.role;
            roleInput.value = selectedRole;
            updateFormFields(selectedRole);
        });
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;

        if (password !== confirmPassword) {
            showToast('Passwords do not match.', 'error');
            return;
        }

        const formData = new FormData(signupForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('http://localhost:3000/api/users/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                showToast('Account created successfully. Please log in.', 'success');
                setTimeout(() => window.location.href = 'login.html', 2000);
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('An error occurred. Please try again.', 'error');
        }
    });

    // Initialize form for the default role
    updateFormFields('alumni');
});
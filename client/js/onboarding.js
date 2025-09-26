// client/js/onboarding.js
document.addEventListener('DOMContentLoaded', async () => {
    const onboardForm = document.getElementById('onboard-form');
    const messageDiv = document.getElementById('message');

    const loggedInUserEmail = localStorage.getItem('loggedInUserEmail');
    const userRole = localStorage.getItem('userRole');

    if (!loggedInUserEmail) {
        window.location.href = 'login.html';
        return;
    }

    if (userRole === 'admin') {
        window.location.href = 'admin.html';
        return;
    }

    if (onboardForm) {
        onboardForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const onboardData = {
                institute_name: document.getElementById('institute_name').value,
                city: document.getElementById('city').value,
                graduation_year: document.getElementById('graduation-year').value,
                major: document.getElementById('major').value,
                department: document.getElementById('department').value,
                company: document.getElementById('company').value,
                job_title: document.getElementById('job-title').value,
                bio: document.getElementById('bio').value,
                linkedin_profile: document.getElementById('linkedin_profile').value,
                skills: document.getElementById('skills').value,
            };

            try {
                const data = await window.api.post('/users/onboard', onboardData);
                messageDiv.textContent = data.message;
                messageDiv.className = 'form-message success';
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } catch (error) {
                messageDiv.textContent = `Error: ${error.message}`;
                messageDiv.className = 'form-message error';
                console.error('Onboarding error:', error);
            }
        });
    }
});
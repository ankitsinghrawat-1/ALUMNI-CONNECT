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
    
    const emailInput = document.getElementById('university-email');
    if (emailInput) {
        emailInput.value = loggedInUserEmail;
    }

    if (onboardForm) {
        onboardForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const onboardData = {
                university: document.getElementById('university').value,
                university_email: document.getElementById('university-email').value,
                graduation_year: document.getElementById('graduation-year').value,
                major: document.getElementById('major').value,
                degree: document.getElementById('degree').value,
                current_company: document.getElementById('current-company').value,
                job_title: document.getElementById('job-title').value,
                city: document.getElementById('city').value,
                bio: document.getElementById('bio').value,
                linkedin: document.getElementById('linkedin').value
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
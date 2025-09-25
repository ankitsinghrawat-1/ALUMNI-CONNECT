document.addEventListener('DOMContentLoaded', () => {
    const adminForm = document.getElementById('admin-login-form');
    const messageContainer = document.getElementById('message-container');

    // If a token already exists, redirect to the dashboard
    if (localStorage.getItem('alumniConnectToken')) {
        window.location.href = 'admin.html';
        return;
    }

    if (adminForm) {
        adminForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('http://localhost:3000/api/admin/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    // Store the token and other info in localStorage
                    localStorage.setItem('alumniConnectToken', data.token);
                    localStorage.setItem('loggedInUserEmail', data.email);
                    localStorage.setItem('userRole', data.role);
                    
                    window.location.href = 'admin.html';
                } else {
                    messageContainer.textContent = data.message;
                    messageContainer.className = 'form-message error';
                }
            } catch (error) {
                messageContainer.textContent = 'An error occurred. Please try again.';
                messageContainer.className = 'form-message error';
                console.error('Admin login error:', error);
            }
        });
    }
});
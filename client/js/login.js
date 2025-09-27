// client/js/login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const messageDiv = document.getElementById('message');

    if (!loginForm) {
        console.error("Error: The login form element with ID 'login-form' was not found.");
        return;
    }

    if (!messageDiv) {
        console.error("Error: The message element with ID 'message' was not found.");
    }

    const token = localStorage.getItem('alumniConnectToken');
    if (token) {
        const userRole = localStorage.getItem('userRole');
        switch (userRole) {
            case 'admin':
                window.location.href = 'admin.html';
                break;
            case 'student':
                window.location.href = 'student-dashboard.html';
                break;
            case 'faculty':
                window.location.href = 'faculty-dashboard.html';
                break;
            case 'employer':
                window.location.href = 'employer-dashboard.html';
                break;
            case 'institute':
                window.location.href = 'institute-dashboard.html';
                break;
            default:
                window.location.href = 'dashboard.html'; // Alumni dashboard
        }
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) {
            showToast('Please enter both email and password.', 'error');
            return;
        }

        if (messageDiv) {
            messageDiv.textContent = 'Logging in...';
            messageDiv.className = 'form-message info';
        }

        try {
            const response = await fetch('http://localhost:3000/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store all necessary info in localStorage
                localStorage.setItem('alumniConnectToken', data.token);
                localStorage.setItem('loggedInUserEmail', data.email);
                localStorage.setItem('userRole', data.role);
                localStorage.setItem('loggedInUserName', data.full_name);
                localStorage.setItem('loggedInUserId', data.user_id); // UPDATED: Store the user's ID


                if (messageDiv) {
                    messageDiv.textContent = 'Login successful!';
                    messageDiv.className = 'form-message success';
                }

                switch (data.role) {
                    case 'admin':
                        window.location.href = 'admin.html';
                        break;
                    case 'student':
                        window.location.href = 'student-dashboard.html';
                        break;
                    case 'faculty':
                        window.location.href = 'faculty-dashboard.html';
                        break;
                    case 'employer':
                        window.location.href = 'employer-dashboard.html';
                        break;
                    case 'institute':
                        window.location.href = 'institute-dashboard.html';
                        break;
                    default:
                        window.location.href = 'dashboard.html'; // Alumni dashboard
                }
            } else {
                if (messageDiv) {
                    messageDiv.textContent = data.message;
                    messageDiv.className = 'form-message error';
                }
            }
        } catch (error) {
            if (messageDiv) {
                messageDiv.textContent = 'An error occurred. Please try again.';
                messageDiv.className = 'form-message error';
            }
            console.error('Login error:', error);
        }
    });
});
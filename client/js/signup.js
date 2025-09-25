// docs/signup.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signup-form');
    const fullNameInput = document.getElementById('full_name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Function to validate email format
    const isValidEmail = (email) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // --- Validation Checks ---
        if (!fullName) {
            showToast('Please enter your full name.', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showToast('Please enter a valid email address.', 'error');
            return;
        }

        if (password.length < 8) {
            showToast('Password must be at least 8 characters long.', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/users/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ full_name: fullName, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Account created successfully. Please log in.', 'success');
                setTimeout(() => window.location.href = 'login.html', 2000);
            } else {
                showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('An error occurred. Please try again.', 'error');
        }
    });
});
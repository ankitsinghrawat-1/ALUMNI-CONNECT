document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('forgot-password-form');
    const emailInput = document.getElementById('email');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value;

        try {
            const response = await fetch('http://localhost:3000/api/users/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                showToast(data.message, 'success');
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
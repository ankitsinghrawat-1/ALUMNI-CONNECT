document.addEventListener('DOMContentLoaded', () => {
    const userEmail = localStorage.getItem('userEmail');
    const joinNowBtn = document.getElementById('join-now-btn');

    if (userEmail && joinNowBtn) {
        // If the user is logged in, hide the "Join Now" button
        joinNowBtn.style.display = 'none';
    }
});
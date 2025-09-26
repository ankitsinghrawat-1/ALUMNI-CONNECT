// client/js/faculty-dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
    const userEmail = localStorage.getItem('loggedInUserEmail');
    if (!userEmail) {
        window.location.href = 'login.html';
        return;
    }

    // Personalized Greeting
    const greetingElement = document.getElementById('dashboard-greeting');
    const hour = new Date().getHours();
    let greeting = (hour < 12) ? 'Good Morning' : (hour < 18) ? 'Good Afternoon' : 'Good Evening';
    greetingElement.textContent = `${greeting}, ${localStorage.getItem('loggedInUserName') || 'Faculty'}!`;

    try {
        const userProfile = await window.api.get(`/users/profile`);
        document.getElementById('profile-pic').src = userProfile.profile_pic_url 
            ? `http://localhost:3000/${userProfile.profile_pic_url}` 
            : createInitialsAvatar(userProfile.full_name);
    } catch (error) {
        console.error('Error fetching profile picture:', error);
    }

    const blogContainer = document.getElementById('blog-feed');

    try {
        const blogs = await window.api.get('/blogs');

        if (blogs.length > 0) {
            blogContainer.innerHTML = blogs.slice(0, 5).map(blog => `
                <div class="recommendation-item">
                    <strong>${sanitizeHTML(blog.title)}</strong>
                    <p>by ${sanitizeHTML(blog.author)}</p>
                    <a href="blog-post.html?id=${blog.blog_id}" class="btn btn-secondary btn-sm">Read More</a>
                </div>
            `).join('');
        } else {
            blogContainer.innerHTML = '<p>No recent blogs from alumni.</p>';
        }
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        blogContainer.innerHTML = '<p class="info-message error">Could not load blog feed.</p>';
    }
});
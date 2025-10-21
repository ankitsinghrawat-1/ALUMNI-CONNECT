// client/js/blogs.js
document.addEventListener('DOMContentLoaded', () => {
    const blogListContainer = document.getElementById('blog-list');

    const blogItemRenderer = (post) => {
        const summary = sanitizeHTML(post.content.substring(0, 200) + '...');
        const postDate = new Date(post.created_at).toLocaleDateString();
        const imageUrl = post.image_url 
            ? `http://localhost:3000/${post.image_url}` 
            : ''; // No image if URL is null

        return `
            <div class="blog-post-summary card">
                ${imageUrl ? `<img src="${imageUrl}" alt="${sanitizeHTML(post.title)}" class="blog-summary-image">` : ''}
                <div class="blog-summary-content">
                    <h3>${sanitizeHTML(post.title)}</h3>
                    <p class="post-meta">By <a href="profile.html?email=${post.author_email}">${sanitizeHTML(post.author)}</a> on ${postDate}</p>
                    <p>${summary}</p>
                    <a href="blog-post.html?id=${post.blog_id}" class="btn btn-secondary">Read More</a>
                </div>
            </div>
        `;
    };

    renderData('/blogs', blogListContainer, blogItemRenderer, {
        emptyMessage: `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-blog"></i>
                </div>
                <h3>No Stories Yet</h3>
                <p>Be the first to share your alumni journey and inspire others!</p>
                <div class="empty-actions">
                    <a href="add-blog.html" class="btn btn-primary">Share Your Story</a>
                </div>
            </div>
        `,
        loadingMessage: `
            <div class="loading-container">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
                <p>Loading inspiring stories...</p>
            </div>
        `
    });
});
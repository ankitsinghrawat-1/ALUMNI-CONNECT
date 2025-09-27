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
                    <p class="post-meta">By <a href="view-profile.html?email=${post.author_email}">${sanitizeHTML(post.author)}</a> on ${postDate}</p>
                    <p>${summary}</p>
                    <a href="blog-post.html?id=${post.blog_id}" class="btn btn-secondary">Read More</a>
                </div>
            </div>
        `;
    };

    renderData('/blogs', blogListContainer, blogItemRenderer, {
        emptyMessage: '<p class="info-message">No blog posts have been written yet.</p>'
    });
});
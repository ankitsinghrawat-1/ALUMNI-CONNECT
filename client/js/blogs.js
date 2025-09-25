// client/js/blogs.js
document.addEventListener('DOMContentLoaded', () => {
    const blogListContainer = document.getElementById('blog-list');

    const blogItemRenderer = (post) => {
        const summary = sanitizeHTML(post.content.substring(0, 200) + '...');
        const postDate = new Date(post.created_at).toLocaleDateString();
        return `
            <div class="blog-post-summary card">
                <h3>${sanitizeHTML(post.title)}</h3>
                <p class="post-meta">By ${sanitizeHTML(post.author)} on ${postDate}</p>
                <p>${summary}</p>
                <a href="blog-post.html?id=${post.blog_id}" class="btn btn-secondary">Read More</a>
            </div>
        `;
    };

    renderData('/blogs', blogListContainer, blogItemRenderer, {
        emptyMessage: '<p class="info-message">No blog posts have been written yet.</p>'
    });
});
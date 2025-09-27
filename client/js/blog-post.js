// client/js/blog-post.js
document.addEventListener('DOMContentLoaded', async () => {
    const postContainer = document.getElementById('blog-post-content');
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    if (!postId) {
        postContainer.innerHTML = '<h1>Post not found</h1>';
        return;
    }

    postContainer.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

    try {
        const post = await window.api.get(`/blogs/${postId}`);
        document.title = post.title;

        const postDate = new Date(post.created_at).toLocaleDateString();
        const imageUrl = post.image_url ? `http://localhost:3000/${post.image_url}` : '';

        postContainer.innerHTML = `
            <article class="blog-post-full card">
                ${imageUrl ? `<img src="${imageUrl}" alt="${sanitizeHTML(post.title)}" class="blog-post-image">` : ''}
                <h1>${sanitizeHTML(post.title)}</h1>
                <p class="post-meta">By <a href="view-profile.html?email=${post.author_email}">${sanitizeHTML(post.author)}</a> on ${postDate}</p>
                <div class="post-content">${sanitizeHTML(post.content).replace(/\n/g, '<br>')}</div>
            </article>
        `;
    } catch (error) {
        console.error('Error fetching post:', error);
        postContainer.innerHTML = '<h1>Error loading post</h1><p class="info-message error">The post could not be found or there was a server error.</p>';
    }
});
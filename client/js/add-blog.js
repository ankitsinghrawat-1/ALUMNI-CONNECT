// client/js/add-blog.js
document.addEventListener('DOMContentLoaded', () => {
    const addBlogForm = document.getElementById('add-blog-form');
    const messageDiv = document.getElementById('message');

    if (!localStorage.getItem('alumniConnectToken')) {
        window.location.href = 'login.html';
        return;
    }

    if (addBlogForm) {
        addBlogForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const blogData = {
                title: document.getElementById('title').value,
                content: document.getElementById('content').value,
            };

            if (!blogData.title || !blogData.content) {
                showToast('Please fill out both the title and content fields.', 'error');
                return;
            }

            try {
                await window.api.post('/blogs', blogData);
                showToast('Blog post submitted successfully!', 'success');
                messageDiv.textContent = 'Post submitted! Redirecting you to your blog posts...';
                messageDiv.className = 'form-message success';
                addBlogForm.reset();
                setTimeout(() => {
                    window.location.href = 'my-blogs.html';
                }, 2000);
            } catch (error) {
                console.error('Error adding blog post:', error);
                showToast(`Error: ${error.message}`, 'error');
                messageDiv.textContent = `Error: ${error.message}`;
                messageDiv.className = 'form-message error';
            }
        });
    }
});
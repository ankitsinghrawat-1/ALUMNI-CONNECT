// client/js/my-blogs.js
document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('my-blogs-list');

    if (!localStorage.getItem('alumniConnectToken')) {
        window.location.href = 'login.html';
        return;
    }

    const loadMyBlogs = async () => {
        listContainer.innerHTML = '<tr><td colspan="3"><div class="loading-spinner"><div class="spinner"></div></div></td></tr>';
        try {
            const blogs = await window.api.get('/blogs/user/my-blogs');
            
            if (blogs.length > 0) {
                listContainer.innerHTML = blogs.map(blog => `
                    <tr>
                        <td>${sanitizeHTML(blog.title)}</td>
                        <td>${new Date(blog.created_at).toLocaleDateString()}</td>
                        <td>
                            <a href="edit-blog.html?id=${blog.blog_id}&user=true" class="btn btn-secondary btn-sm">Edit</a>
                            <button class="btn btn-danger btn-sm delete-btn" data-id="${blog.blog_id}">Delete</button>
                        </td>
                    </tr>
                `).join('');
            } else {
                listContainer.innerHTML = '<tr><td colspan="3" class="info-message">You have not created any blog posts yet. <a href="add-blog.html">Create one now!</a></td></tr>';
            }
        } catch (error) {
            console.error('Error fetching your blogs:', error);
            listContainer.innerHTML = '<tr><td colspan="3" class="info-message error">Could not load your blogs. Please try again.</td></tr>';
        }
    };

    listContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const blogId = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this blog post?')) {
                try {
                    await window.api.del(`/blogs/${blogId}`);
                    showToast('Blog post deleted successfully.', 'success');
                    await loadMyBlogs();
                } catch (error) {
                    console.error('Error deleting blog post:', error);
                    showToast(`Error: ${error.message}`, 'error');
                }
            }
        }
    });

    await loadMyBlogs();
});
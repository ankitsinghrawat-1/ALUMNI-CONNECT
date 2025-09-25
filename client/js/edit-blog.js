document.addEventListener('DOMContentLoaded', async () => {
    const editBlogForm = document.getElementById('edit-blog-form');
    const params = new URLSearchParams(window.location.search);
    const blogId = params.get('id');

    if (!blogId || !localStorage.getItem('alumniConnectToken')) {
        window.location.href = 'index.html';
        return;
    }

    const fetchBlogData = async () => {
        try {
            const blog = await window.api.get(`/blogs/${blogId}`);
            document.getElementById('title').value = blog.title;
            document.getElementById('content').value = blog.content;
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    editBlogForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const blogData = {
            title: document.getElementById('title').value,
            content: document.getElementById('content').value,
        };

        try {
            const result = await window.api.put(`/blogs/${blogId}`, blogData);
            showToast(result.message, 'success');
            setTimeout(() => window.location.href = 'my-blogs.html', 1500);
        } catch (error) {
            console.error('Error updating blog post:', error);
            showToast(`Error: ${error.message}`, 'error');
        }
    });

    await fetchBlogData();
});
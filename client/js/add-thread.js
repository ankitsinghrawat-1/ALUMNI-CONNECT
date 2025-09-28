// client/js/add-thread.js
document.addEventListener('DOMContentLoaded', () => {
    const addThreadForm = document.getElementById('add-thread-form');
    const contentTextarea = document.getElementById('content');
    const mediaInput = document.getElementById('thread_media');
    const mediaPreview = document.getElementById('media-preview');
    const mediaPreviewContent = document.getElementById('media-preview-content');
    const removeMediaBtn = document.getElementById('remove-media');
    const messageDiv = document.getElementById('message');
    const submitBtn = document.getElementById('submit-btn');
    const charCountSpan = document.querySelector('.char-count');

    let selectedFile = null;

    // Character count update
    contentTextarea.addEventListener('input', () => {
        const charCount = contentTextarea.value.length;
        charCountSpan.textContent = `${charCount}/500 characters`;
        
        if (charCount > 450) {
            charCountSpan.style.color = 'var(--warning-color)';
        } else if (charCount > 480) {
            charCountSpan.style.color = 'var(--danger-color)';
        } else {
            charCountSpan.style.color = 'var(--text-color-light)';
        }
    });

    // Media file selection
    mediaInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            showToast('File size must be less than 10MB', 'error');
            mediaInput.value = '';
            return;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/avi'];
        if (!allowedTypes.includes(file.type)) {
            showToast('Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, AVI) are allowed', 'error');
            mediaInput.value = '';
            return;
        }

        selectedFile = file;
        showMediaPreview(file);
    });

    // Show media preview
    const showMediaPreview = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileUrl = e.target.result;
            
            if (file.type.startsWith('image/')) {
                mediaPreviewContent.innerHTML = `
                    <div class="image-preview">
                        <img src="${fileUrl}" alt="Preview" style="max-width: 100%; max-height: 300px; border-radius: 8px;">
                    </div>
                `;
            } else if (file.type.startsWith('video/')) {
                mediaPreviewContent.innerHTML = `
                    <div class="video-preview">
                        <video controls style="max-width: 100%; max-height: 300px; border-radius: 8px;">
                            <source src="${fileUrl}" type="${file.type}">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                `;
            }
            
            mediaPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    };

    // Remove media
    removeMediaBtn.addEventListener('click', () => {
        selectedFile = null;
        mediaInput.value = '';
        mediaPreview.style.display = 'none';
        mediaPreviewContent.innerHTML = '';
    });

    // Form submission
    addThreadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const content = contentTextarea.value.trim();
        
        // Validate input
        if (!content && !selectedFile) {
            showToast('Please add some content or media to your thread', 'error');
            return;
        }

        if (content.length > 500) {
            showToast('Content must be 500 characters or less', 'error');
            return;
        }

        // Disable form during submission
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
        
        try {
            const formData = new FormData();
            if (content) {
                formData.append('content', content);
            }
            if (selectedFile) {
                formData.append('thread_media', selectedFile);
            }

            const response = await window.api.postForm('/threads', formData);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create thread');
            }

            const result = await response.json();
            
            showToast('Thread posted successfully!', 'success');
            
            // Redirect to threads page
            setTimeout(() => {
                window.location.href = 'threads.html';
            }, 1500);
            
        } catch (error) {
            console.error('Error creating thread:', error);
            showToast(`Error: ${error.message}`, 'error');
            
            // Re-enable form
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Post Thread';
        }
    });

    // Auto-resize textarea
    contentTextarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Initialize
    const init = () => {
        // Focus on content textarea
        contentTextarea.focus();
        
        // Check if user is logged in
        if (!localStorage.getItem('alumniConnectToken')) {
            try {
                showToast('Please log in to create threads', 'error');
            } catch (error) {
                console.log('Please log in to create threads');
            }
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    };

    init();
});
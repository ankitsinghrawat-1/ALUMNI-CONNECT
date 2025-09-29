// client/js/add-thread.js
document.addEventListener('DOMContentLoaded', () => {
    const addThreadForm = document.getElementById('add-thread-form');
    const contentTextarea = document.getElementById('content');
    const locationInput = document.getElementById('location');
    const hashtagsInput = document.getElementById('hashtags');
    const mentionsInput = document.getElementById('mentions');
    const mediaInput = document.getElementById('thread_media');
    const mediaUploadArea = document.getElementById('media-upload-area');
    const mediaPreview = document.getElementById('media-preview');
    const mediaPreviewContent = document.getElementById('media-preview-content');
    const mediaCaptionInput = document.getElementById('media-caption');
    const removeMediaBtn = document.getElementById('remove-media');
    const messageDiv = document.getElementById('message');
    const submitBtn = document.getElementById('submit-btn');
    const charCountSpan = document.getElementById('char-count');
    const storyToggle = document.getElementById('story-toggle');
    const storyOptions = document.getElementById('story-options');
    const hashtagSuggestions = document.getElementById('hashtag-suggestions');
    const hashtagTags = document.getElementById('hashtag-tags');
    const mentionSuggestions = document.getElementById('mention-suggestions');
    
    let selectedFile = null;
    let selectedHashtags = [];
    let selectedMentions = [];
    let hashtagSuggestionTimeout = null;
    let mentionSuggestionTimeout = null;

    // Character count update
    contentTextarea.addEventListener('input', () => {
        const charCount = contentTextarea.value.length;
        charCountSpan.textContent = charCount;
        
        if (charCount > 450) {
            charCountSpan.style.color = 'var(--warning-color, #f39c12)';
        } else if (charCount > 480) {
            charCountSpan.style.color = 'var(--error-color, #e74c3c)';
        } else {
            charCountSpan.style.color = 'var(--subtle-text-color)';
        }
        
        // Auto-resize textarea
        contentTextarea.style.height = 'auto';
        contentTextarea.style.height = (contentTextarea.scrollHeight) + 'px';
    });

    // Story toggle functionality
    storyToggle.addEventListener('change', () => {
        if (storyToggle.checked) {
            storyOptions.classList.add('active');
        } else {
            storyOptions.classList.remove('active');
        }
    });

    // Enhanced drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        mediaUploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        mediaUploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        mediaUploadArea.addEventListener(eventName, unhighlight, false);
    });

    mediaUploadArea.addEventListener('drop', handleDrop, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        mediaUploadArea.classList.add('dragover');
    }

    function unhighlight() {
        mediaUploadArea.classList.remove('dragover');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    }

    // Click to upload
    mediaUploadArea.addEventListener('click', () => {
        mediaInput.click();
    });

    // File selection handler
    mediaInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelection(file);
        }
    });

    function handleFileSelection(file) {
        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            showToast('File size must be less than 10MB', 'error');
            return;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/avi'];
        if (!allowedTypes.includes(file.type)) {
            showToast('Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, AVI) are allowed', 'error');
            return;
        }

        selectedFile = file;
        showMediaPreview(file);
    }

    // Show media preview
    function showMediaPreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileUrl = e.target.result;
            
            if (file.type.startsWith('image/')) {
                mediaPreviewContent.innerHTML = `
                    <div class="image-preview">
                        <img src="${fileUrl}" alt="Preview" style="max-width: 100%; max-height: 300px; border-radius: 8px; display: block;">
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
    }

    // Remove media
    removeMediaBtn.addEventListener('click', () => {
        selectedFile = null;
        mediaInput.value = '';
        mediaPreview.style.display = 'none';
        mediaPreviewContent.innerHTML = '';
        mediaCaptionInput.value = '';
    });

    // Hashtag functionality
    hashtagsInput.addEventListener('input', () => {
        const value = hashtagsInput.value;
        
        if (hashtagSuggestionTimeout) {
            clearTimeout(hashtagSuggestionTimeout);
        }
        
        if (value.length >= 2) {
            hashtagSuggestionTimeout = setTimeout(() => {
                fetchHashtagSuggestions(value);
            }, 300);
        } else {
            hashtagSuggestions.style.display = 'none';
        }
    });

    hashtagsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
            e.preventDefault();
            addHashtagFromInput();
        }
    });

    async function fetchHashtagSuggestions(query) {
        try {
            const cleanQuery = query.replace('#', '').toLowerCase();
            const response = await window.api.get(`/threads/hashtags/search?q=${encodeURIComponent(cleanQuery)}`);
            
            if (response.length > 0) {
                showHashtagSuggestions(response);
            } else {
                hashtagSuggestions.style.display = 'none';
            }
        } catch (error) {
            console.error('Error fetching hashtag suggestions:', error);
        }
    }

    function showHashtagSuggestions(suggestions) {
        hashtagSuggestions.innerHTML = suggestions.map(tag => 
            `<div class="hashtag-suggestion" onclick="selectHashtag('${tag}')">#${tag}</div>`
        ).join('');
        hashtagSuggestions.style.display = 'block';
    }

    window.selectHashtag = function(tag) {
        if (!selectedHashtags.includes(tag)) {
            selectedHashtags.push(tag);
            updateHashtagDisplay();
        }
        hashtagsInput.value = '';
        hashtagSuggestions.style.display = 'none';
    };

    function addHashtagFromInput() {
        const value = hashtagsInput.value.trim().replace('#', '').toLowerCase();
        if (value && !selectedHashtags.includes(value)) {
            selectedHashtags.push(value);
            updateHashtagDisplay();
        }
        hashtagsInput.value = '';
        hashtagSuggestions.style.display = 'none';
    }

    function updateHashtagDisplay() {
        hashtagTags.innerHTML = selectedHashtags.map(tag => 
            `<span class="hashtag-tag">
                #${tag}
                <i class="fas fa-times remove-tag" onclick="removeHashtag('${tag}')"></i>
            </span>`
        ).join('');
    }

    window.removeHashtag = function(tag) {
        selectedHashtags = selectedHashtags.filter(t => t !== tag);
        updateHashtagDisplay();
    };

    // Mention functionality
    mentionsInput.addEventListener('input', () => {
        const value = mentionsInput.value;
        
        if (mentionSuggestionTimeout) {
            clearTimeout(mentionSuggestionTimeout);
        }
        
        if (value.length >= 2) {
            mentionSuggestionTimeout = setTimeout(() => {
                fetchMentionSuggestions(value);
            }, 300);
        } else {
            mentionSuggestions.style.display = 'none';
        }
    });

    async function fetchMentionSuggestions(query) {
        try {
            const cleanQuery = query.replace('@', '');
            const token = localStorage.getItem('alumniConnectToken');
            if (!token) return;
            
            const response = await window.api.get(`/threads/users/search?q=${encodeURIComponent(cleanQuery)}`);
            
            if (response.length > 0) {
                showMentionSuggestions(response);
            } else {
                mentionSuggestions.style.display = 'none';
            }
        } catch (error) {
            console.error('Error fetching mention suggestions:', error);
        }
    }

    function showMentionSuggestions(users) {
        mentionSuggestions.innerHTML = users.map(user => 
            `<div class="mention-suggestion" onclick="selectMention('${user.email}', '${user.full_name}')">
                <div class="mention-avatar">${user.full_name.charAt(0).toUpperCase()}</div>
                <div>
                    <div style="font-weight: 600;">${user.full_name}</div>
                    <div style="font-size: 0.875rem; color: var(--subtle-text-color);">${user.email}</div>
                </div>
            </div>`
        ).join('');
        mentionSuggestions.style.display = 'block';
    }

    window.selectMention = function(email, name) {
        if (!selectedMentions.find(m => m.email === email)) {
            selectedMentions.push({ email, name });
        }
        mentionsInput.value = '';
        mentionSuggestions.style.display = 'none';
        showToast(`Mentioned ${name}`, 'success');
    };

    // Click outside to close suggestions
    document.addEventListener('click', (e) => {
        if (!hashtagsInput.contains(e.target) && !hashtagSuggestions.contains(e.target)) {
            hashtagSuggestions.style.display = 'none';
        }
        if (!mentionsInput.contains(e.target) && !mentionSuggestions.contains(e.target)) {
            mentionSuggestions.style.display = 'none';
        }
    });

    // Form submission
    addThreadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const content = contentTextarea.value.trim();
        const location = locationInput.value.trim();
        const mediaCaption = mediaCaptionInput.value.trim();
        
        // Validate input
        if (!content && !selectedFile) {
            showToast('Please add some content or media to your discussion', 'error');
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
            if (mediaCaption) {
                formData.append('media_caption', mediaCaption);
            }
            if (location) {
                formData.append('location', location);
            }
            if (selectedHashtags.length > 0) {
                formData.append('hashtags', JSON.stringify(selectedHashtags));
            }
            if (selectedMentions.length > 0) {
                formData.append('mentions', JSON.stringify(selectedMentions.map(m => m.email)));
            }

            // Create thread
            const result = await window.api.postForm('/threads', formData);
            
            // Create story if enabled
            if (storyToggle.checked) {
                const storyFormData = new FormData();
                if (content) {
                    storyFormData.append('content', content);
                }
                if (selectedFile) {
                    storyFormData.append('story_media', selectedFile);
                }
                storyFormData.append('background_color', document.getElementById('story-bg-color').value);
                storyFormData.append('text_color', document.getElementById('story-text-color').value);
                
                try {
                    await window.api.postForm('/stories', storyFormData);
                } catch (storyError) {
                    console.error('Error creating story:', storyError);
                    // Don't fail the whole operation if story creation fails
                }
            }
            
            showToast('Discussion posted successfully!', 'success');
            
            // Redirect to threads page
            setTimeout(() => {
                window.location.href = 'threads.html';
            }, 1500);
            
        } catch (error) {
            console.error('Error creating thread:', error);
            showToast(`Error: ${error.message}`, 'error');
            
            // Re-enable form
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Share Discussion';
        }
    });

    // Initialize
    const init = () => {
        // Focus on content textarea
        contentTextarea.focus();
        
        // Check if user is logged in
        if (!localStorage.getItem('alumniConnectToken')) {
            try {
                showToast('Please log in to create discussions', 'error');
            } catch (error) {
                console.log('Please log in to create discussions');
            }
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    };

    init();
});
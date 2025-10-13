// client/js/add-thread.js
document.addEventListener('DOMContentLoaded', () => {
    const addThreadForm = document.getElementById('add-thread-form');
    const titleInput = document.getElementById('title');
    const titleCountSpan = document.getElementById('title-count');
    const contentTextarea = document.getElementById('content');
    const locationInput = document.getElementById('location');
    const hashtagsInput = document.getElementById('hashtags');
    const mentionsInput = document.getElementById('mentions');
    const mediaInput = document.getElementById('thread_media');
    const photoBtn = document.getElementById('photo-btn');
    const videoBtn = document.getElementById('video-btn');
    const mediaPreview = document.getElementById('media-preview');
    const mediaPreviewContent = document.getElementById('media-preview-content');
    const mediaCaptionInput = document.getElementById('media-caption');
    const removeMediaBtn = document.getElementById('remove-media');
    const messageDiv = document.getElementById('message');
    const submitBtn = document.getElementById('submit-btn');
    const draftBtn = document.querySelector('.draft-btn');
    const charCountSpan = document.getElementById('char-count');
    const charLimitSpan = document.getElementById('char-limit');
    const storyToggle = document.getElementById('story-toggle');
    const storyOptions = document.getElementById('story-options');
    const hashtagSuggestions = document.getElementById('hashtag-suggestions');
    const hashtagTags = document.getElementById('hashtag-tags');
    const mentionSuggestions = document.getElementById('mention-suggestions');
    const mentionTags = document.getElementById('mention-tags');
    const advancedToggle = document.getElementById('advanced-toggle');
    const advancedOptions = document.getElementById('advanced-options');
    const threadTypeSelect = document.getElementById('thread-type');
    const pollSection = document.getElementById('poll-section');
    const toolbarBtns = document.querySelectorAll('.toolbar-btn[data-command]');
    
    let selectedFile = null;
    let selectedHashtags = [];
    let selectedMentions = [];
    let hashtagSuggestionTimeout = null;
    let mentionSuggestionTimeout = null;

    // Title field character counter
    if (titleInput && titleCountSpan) {
        titleInput.addEventListener('input', () => {
            const charCount = titleInput.value.length;
            titleCountSpan.textContent = charCount;
            
            // Enable/disable draft button based on title
            if (draftBtn) {
                draftBtn.disabled = charCount === 0;
            }
        });
    }

    // Character count update with higher limit
    contentTextarea.addEventListener('input', () => {
        const content = contentTextarea.value;
        const charCount = content.length;
        const maxLength = 2000;
        charCountSpan.textContent = charCount;
        
        if (charCount > maxLength * 0.9) {
            charCountSpan.style.color = 'var(--warning-color, #f39c12)';
        } else if (charCount > maxLength * 0.95) {
            charCountSpan.style.color = 'var(--error-color, #e74c3c)';
        } else {
            charCountSpan.style.color = 'var(--subtle-text-color)';
        }
        
        // Auto-resize textarea with smooth animation
        contentTextarea.style.height = 'auto';
        contentTextarea.style.height = Math.max(140, contentTextarea.scrollHeight) + 'px';
        
        // Add visual feedback for active typing
        contentTextarea.style.transform = charCount > 0 ? 'translateY(-2px)' : 'translateY(0)';
        
        // Smart hashtag suggestions based on content
        if (charCount > 10 && selectedHashtags.length < 5) {
            const words = content.toLowerCase().split(/\s+/);
            const suggestedTags = words.filter(word => 
                word.length > 4 && 
                /^[a-zA-Z]+$/.test(word) &&
                !commonWords.includes(word) &&
                !selectedHashtags.includes(word)
            ).slice(0, 3);
            
            if (suggestedTags.length > 0) {
                showSmartHashtagSuggestions(suggestedTags);
            }
        }
    });
    
    // Advanced options toggle
    if (advancedToggle && advancedOptions) {
        advancedToggle.addEventListener('click', () => {
            const isVisible = advancedOptions.style.display !== 'none';
            advancedOptions.style.display = isVisible ? 'none' : 'block';
            const icon = advancedToggle.querySelector('i');
            if (icon) {
                icon.className = isVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
            }
        });
    }
    
    // Thread type selector - show/hide poll section
    if (threadTypeSelect && pollSection) {
        threadTypeSelect.addEventListener('change', () => {
            pollSection.style.display = threadTypeSelect.value === 'poll' ? 'block' : 'none';
        });
    }
    
    // Toolbar buttons for rich text formatting with contentEditable
    toolbarBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const command = btn.dataset.command;
            
            // For emoji and link buttons, handle separately
            if (command === 'emoji' || command === 'link') {
                return; // These will be handled by their specific click handlers
            }
            
            if (command && contentTextarea) {
                const start = contentTextarea.selectionStart;
                const end = contentTextarea.selectionEnd;
                const selectedText = contentTextarea.value.substring(start, end);
                
                // If no text selected, just insert markers
                if (!selectedText) {
                    let markers = '';
                    if (command === 'bold') markers = '****';
                    else if (command === 'italic') markers = '**';
                    else if (command === 'underline') markers = '____';
                    
                    const newStart = start + markers.length / 2;
                    contentTextarea.value = contentTextarea.value.substring(0, start) + markers + contentTextarea.value.substring(end);
                    contentTextarea.focus();
                    contentTextarea.setSelectionRange(newStart, newStart);
                    return;
                }
                
                // Apply formatting to selected text
                let formattedText = selectedText;
                if (command === 'bold') {
                    formattedText = `**${selectedText}**`;
                } else if (command === 'italic') {
                    formattedText = `*${selectedText}*`;
                } else if (command === 'underline') {
                    formattedText = `__${selectedText}__`;
                } else if (command === 'insertUnorderedList') {
                    formattedText = `• ${selectedText}`;
                } else if (command === 'insertOrderedList') {
                    formattedText = `1. ${selectedText}`;
                }
                
                contentTextarea.value = contentTextarea.value.substring(0, start) + formattedText + contentTextarea.value.substring(end);
                contentTextarea.focus();
                contentTextarea.setSelectionRange(start, start + formattedText.length);
                
                // Trigger input event to update character count
                contentTextarea.dispatchEvent(new Event('input'));
            }
        });
    });
    
    // Draft button functionality
    if (draftBtn) {
        draftBtn.addEventListener('click', () => {
            const draft = {
                title: titleInput?.value || '',
                content: contentTextarea?.value || '',
                category: document.getElementById('category')?.value || '',
                visibility: document.getElementById('visibility')?.value || 'public',
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('threadDraft', JSON.stringify(draft));
            showToast('Draft saved successfully!', 'success');
        });
        
        // Load draft if exists
        const savedDraft = localStorage.getItem('threadDraft');
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                if (titleInput) titleInput.value = draft.title || '';
                if (contentTextarea) contentTextarea.value = draft.content || '';
                if (document.getElementById('category')) document.getElementById('category').value = draft.category || '';
                if (document.getElementById('visibility')) document.getElementById('visibility').value = draft.visibility || 'public';
                showToast('Draft loaded', 'info');
            } catch (e) {
                console.error('Error loading draft:', e);
            }
        }
    }
    
    // Common words to exclude from hashtag suggestions
    const commonWords = ['with', 'that', 'this', 'from', 'they', 'have', 'been', 'will', 'would', 'could', 'should', 'about', 'after', 'before', 'during', 'through', 'between', 'among', 'under', 'over'];
    
    // Toast notification helper
    function showToast(message, type = 'info') {
        if (typeof Toastify !== 'undefined') {
            Toastify({
                text: message,
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
                stopOnFocus: true
            }).showToast();
        } else {
            alert(message);
        }
    }

    // Story toggle functionality
    storyToggle.addEventListener('change', () => {
        if (storyToggle.checked) {
            storyOptions.style.display = 'block';
        } else {
            storyOptions.style.display = 'none';
        }
    });

    // Media button handlers
    photoBtn.addEventListener('click', () => {
        mediaInput.accept = 'image/*';
        mediaInput.click();
    });

    videoBtn.addEventListener('click', () => {
        mediaInput.accept = 'video/*';
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
                    <img src="${fileUrl}" alt="Preview" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 12px;">
                `;
            } else if (file.type.startsWith('video/')) {
                mediaPreviewContent.innerHTML = `
                    <video controls style="width: 100%; max-height: 300px; border-radius: 12px;">
                        <source src="${fileUrl}" type="${file.type}">
                        Your browser does not support the video tag.
                    </video>
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

    // Enhanced hashtag functionality with better parsing
    hashtagsInput.addEventListener('input', (e) => {
        const value = hashtagsInput.value;
        
        if (hashtagSuggestionTimeout) {
            clearTimeout(hashtagSuggestionTimeout);
        }
        
        // Auto-add hashtag prefix if user types without it
        if (value && !value.startsWith('#')) {
            hashtagsInput.value = '#' + value;
            return;
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
        // Prevent entering special characters except # and alphanumeric
        if (!/[a-zA-Z0-9#_]/.test(e.key) && !['Enter', ' ', ',', 'Backspace', 'Delete'].includes(e.key)) {
            e.preventDefault();
        }
    });

    // Enhanced mention functionality
    mentionsInput.addEventListener('input', (e) => {
        const value = mentionsInput.value;
        
        if (mentionSuggestionTimeout) {
            clearTimeout(mentionSuggestionTimeout);
        }
        
        // Auto-add mention prefix if user types without it
        if (value && !value.startsWith('@')) {
            mentionsInput.value = '@' + value;
            return;
        }
        
        if (value.length >= 3) {
            mentionSuggestionTimeout = setTimeout(() => {
                fetchMentionSuggestions(value);
            }, 300);
        } else {
            mentionSuggestions.style.display = 'none';
        }
    });

    mentionsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
            e.preventDefault();
            // For mentions, we need a selected suggestion, not just text
            if (mentionSuggestions.style.display !== 'none') {
                const firstSuggestion = mentionSuggestions.querySelector('.mention-suggestion');
                if (firstSuggestion) {
                    firstSuggestion.click();
                }
            }
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
    
    function showSmartHashtagSuggestions(suggestions) {
        if (!hashtagSuggestions) return;
        
        // Create smart suggestions with better styling
        hashtagSuggestions.innerHTML = `
            <div class="suggestion-header">
                <i class="fas fa-lightbulb"></i>
                <span>Suggested hashtags from your content:</span>
            </div>
            ${suggestions.map(tag => 
                `<div class="hashtag-suggestion smart-suggestion" onclick="selectHashtag('${tag}')">
                    <i class="fas fa-hashtag"></i>
                    <span>${tag}</span>
                    <small class="add-btn">Add</small>
                </div>`
            ).join('')}
        `;
        hashtagSuggestions.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (hashtagSuggestions.style.display === 'block') {
                hashtagSuggestions.style.display = 'none';
            }
        }, 5000);
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
            updateMentionDisplay();
        }
        mentionsInput.value = '';
        mentionSuggestions.style.display = 'none';
    };

    function updateMentionDisplay() {
        mentionTags.innerHTML = selectedMentions.map(mention => 
            `<span class="mention-tag">
                @${mention.name}
                <i class="fas fa-times remove-tag" onclick="removeMention('${mention.email}')"></i>
            </span>`
        ).join('');
    }

    window.removeMention = function(email) {
        selectedMentions = selectedMentions.filter(m => m.email !== email);
        updateMentionDisplay();
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

    // Emoji button handler
    const emojiBtn = document.getElementById('add-emoji-btn');
    if (emojiBtn && typeof window.ProfessionalEmojiPicker !== 'undefined') {
        const emojiPicker = new window.ProfessionalEmojiPicker(emojiBtn, {
            onSelect: (emoji) => {
                const start = contentTextarea.selectionStart;
                const end = contentTextarea.selectionEnd;
                contentTextarea.value = contentTextarea.value.substring(0, start) + emoji + contentTextarea.value.substring(end);
                contentTextarea.focus();
                contentTextarea.setSelectionRange(start + emoji.length, start + emoji.length);
                contentTextarea.dispatchEvent(new Event('input'));
            }
        });
    }
    
    // Link button handler
    const linkBtn = document.getElementById('add-link-btn');
    if (linkBtn) {
        linkBtn.addEventListener('click', () => {
            const url = prompt('Enter URL:');
            if (url) {
                const linkText = prompt('Enter link text (optional):') || url;
                const start = contentTextarea.selectionStart;
                const end = contentTextarea.selectionEnd;
                const linkMarkdown = `[${linkText}](${url})`;
                contentTextarea.value = contentTextarea.value.substring(0, start) + linkMarkdown + contentTextarea.value.substring(end);
                contentTextarea.focus();
                contentTextarea.setSelectionRange(start + linkMarkdown.length, start + linkMarkdown.length);
                contentTextarea.dispatchEvent(new Event('input'));
            }
        });
    }
    
    // Form submission
    addThreadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = titleInput.value.trim();
        const content = contentTextarea.value.trim();
        const location = locationInput.value.trim();
        const mediaCaption = mediaCaptionInput.value.trim();
        const threadType = threadTypeSelect?.value || 'discussion';
        const category = document.getElementById('category')?.value || '';
        const visibility = document.getElementById('visibility')?.value || 'public';
        const anonymous = document.getElementById('anonymous')?.checked || false;
        
        // Validate title
        if (!title || title.length < 5 || title.length > 200) {
            showToast('Title is required and must be between 5-200 characters', 'error');
            titleInput.focus();
            return;
        }
        
        // Validate input
        if (!content && !selectedFile) {
            showToast('Please add some content or media to your discussion', 'error');
            return;
        }

        if (content.length > 2000) {
            showToast('Content must be 2000 characters or less', 'error');
            return;
        }

        // Disable form during submission
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
        
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('thread_type', threadType);
            formData.append('category', category);
            formData.append('visibility', visibility);
            formData.append('anonymous', anonymous ? '1' : '0');
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
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Share';
        }
    });

    // Load current user info
    const loadCurrentUser = async () => {
        try {
            const user = await window.api.get('/users/profile');
            const userNameElement = document.getElementById('current-user-name');
            const userAvatarElement = document.getElementById('current-user-avatar');
            
            if (user) {
                userNameElement.textContent = user.full_name || 'You';
                
                if (user.profile_pic_url) {
                    userAvatarElement.innerHTML = `<img src="http://localhost:3000/${user.profile_pic_url}" alt="${user.full_name}">`;
                } else {
                    userAvatarElement.innerHTML = user.full_name ? user.full_name.charAt(0).toUpperCase() : '<i class="fas fa-user"></i>';
                }
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    };

    // Initialize
    const init = () => {
        // Focus on content textarea
        contentTextarea.focus();
        
        // Check if user is logged in
        if (!localStorage.getItem('alumniConnectToken')) {
            try {
                showToast('Please log in to create discussions', 'error');
            } catch (error) {
            }
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            loadCurrentUser();
        }
    };

    init();

    // Initialize Emoji Picker
    if (typeof EmojiPicker !== 'undefined') {
        const emojiBtn = document.getElementById('add-emoji-btn');
        if (emojiBtn) {
            const emojiPicker = new EmojiPicker({
                target: emojiBtn,
                position: 'top',
                onSelect: (emoji) => {
                    const textarea = document.getElementById('content');
                    const cursorPos = textarea.selectionStart;
                    const textBefore = textarea.value.substring(0, cursorPos);
                    const textAfter = textarea.value.substring(cursorPos);
                    textarea.value = textBefore + emoji + textAfter;
                    textarea.focus();
                    textarea.selectionStart = textarea.selectionEnd = cursorPos + emoji.length;
                    
                    // Trigger input event for character count
                    const event = new Event('input', { bubbles: true });
                    textarea.dispatchEvent(event);
                }
            });

            emojiBtn.addEventListener('click', (e) => {
                e.preventDefault();
                emojiPicker.toggle();
            });
        }
    }

    // Initialize Autocomplete for Mentions
    if (typeof ProfessionalAutocomplete !== 'undefined') {
        const mentionsInput = document.getElementById('mentions');
        if (mentionsInput) {
            new ProfessionalAutocomplete(mentionsInput, {
                type: 'mention',
                minChars: 1,
                maxResults: 10,
                onSelect: (item) => {
                }
            });
        }
    }

    // Initialize Autocomplete for Hashtags
    if (typeof ProfessionalAutocomplete !== 'undefined') {
        const hashtagsInput = document.getElementById('hashtags');
        if (hashtagsInput) {
            new ProfessionalAutocomplete(hashtagsInput, {
                type: 'hashtag',
                minChars: 1,
                maxResults: 10,
                onSelect: (item) => {
                }
            });
        }
    }
});
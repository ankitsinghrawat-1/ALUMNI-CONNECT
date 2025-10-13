// Add Story Page - Comprehensive Functionality
class StoryCreator {
    constructor() {
        this.selectedFile = null;
        this.storyType = 'text';
        this.mentionedUsers = [];
        this.currentLocation = null;
        this.storyDraft = null;
        this.templates = {
            graduation: { bg: '#4facfe', text: '#ffffff', effects: 'glow' },
            achievement: { bg: '#fa709a', text: '#ffffff', effects: 'shadow' },
            networking: { bg: '#a8edea', text: '#333333', effects: 'outline' },
            career: { bg: '#ff9a9e', text: '#ffffff', effects: 'none' }
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDraftIfExists();
        this.initializePreview();
        this.setupAutoSave();
        this.requestLocationPermission();
        
        // Add fade-in animation to main content
        setTimeout(() => {
            document.querySelector('.story-creation-container').classList.add('fade-in');
        }, 100);
    }

    bindEvents() {
        // Story type selection
        document.querySelectorAll('.story-type-card').forEach(card => {
            card.addEventListener('click', () => {
                const type = card.dataset.type;
                this.selectStoryType(type);
            });
        });

        // Template selection
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                const template = card.dataset.template;
                this.applyTemplate(template);
            });
        });

        // Text input and preview
        const textInput = document.getElementById('story-text');
        const textCharCount = document.getElementById('text-char-count');
        
        textInput?.addEventListener('input', () => {
            this.updateCharCount(textInput, textCharCount, 500);
            this.updatePreview();
            this.saveDraft();
        });

        // Media caption
        const captionInput = document.getElementById('media-caption');
        const captionCharCount = document.getElementById('caption-char-count');
        
        captionInput?.addEventListener('input', () => {
            this.updateCharCount(captionInput, captionCharCount, 200);
        });

        // Color pickers
        document.getElementById('bg-color')?.addEventListener('change', () => {
            this.updatePreview();
        });
        
        document.getElementById('text-color')?.addEventListener('change', () => {
            this.updatePreview();
        });

        // Color presets
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', (e) => {
                const color = preset.dataset.color;
                const container = preset.closest('.color-picker-container');
                const colorInput = container.querySelector('input[type="color"]');
                colorInput.value = color;
                this.updatePreview();
            });
        });

        // Text effects
        document.querySelectorAll('.effect-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.effect-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updatePreview();
            });
        });

        // Media upload
        const mediaUploadArea = document.getElementById('media-upload-area');
        const mediaFileInput = document.getElementById('media-file');
        
        mediaUploadArea?.addEventListener('click', () => {
            mediaFileInput.click();
        });

        mediaUploadArea?.addEventListener('dragover', (e) => {
            e.preventDefault();
            mediaUploadArea.style.borderColor = 'var(--primary-color)';
            mediaUploadArea.style.background = 'rgba(102, 126, 234, 0.1)';
        });

        mediaUploadArea?.addEventListener('dragleave', (e) => {
            e.preventDefault();
            mediaUploadArea.style.borderColor = '';
            mediaUploadArea.style.background = '';
        });

        mediaUploadArea?.addEventListener('drop', (e) => {
            e.preventDefault();
            mediaUploadArea.style.borderColor = '';
            mediaUploadArea.style.background = '';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelection(files[0]);
            }
        });

        mediaFileInput?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelection(e.target.files[0]);
            }
        });

        // Media controls
        document.getElementById('remove-media')?.addEventListener('click', () => {
            this.removeMedia();
        });

        // Mention system
        const mentionInput = document.getElementById('mention-input');
        mentionInput?.addEventListener('input', (e) => {
            this.handleMentionInput(e.target.value);
        });

        mentionInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });

        // Location
        const locationInput = document.getElementById('location-input');
        locationInput?.addEventListener('input', (e) => {
            this.handleLocationInput(e.target.value);
        });

        // Poll options
        document.getElementById('add-poll-option')?.addEventListener('click', () => {
            this.addPollOption();
        });

        // Form submission
        const storyForm = document.getElementById('story-form');
        storyForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.publishStory();
        });

        // Draft saving
        document.getElementById('save-draft-btn')?.addEventListener('click', () => {
            this.saveDraft(true);
        });
        
        document.getElementById('save-draft-bottom')?.addEventListener('click', () => {
            this.saveDraft(true);
        });
    }

    selectStoryType(type) {
        this.storyType = type;
        
        // Update active button
        document.querySelectorAll('.story-type-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('active');

        // Show appropriate content section
        document.querySelectorAll('.content-section > div').forEach(div => {
            div.classList.remove('active');
        });
        
        const contentMap = {
            'text': 'text-content',
            'photo': 'media-content',
            'video': 'media-content',
            'poll': 'poll-content'
        };
        
        document.getElementById(contentMap[type])?.classList.add('active');
        
        if (type === 'video') {
            const mediaInput = document.getElementById('media-file');
            if (mediaInput) {
                mediaInput.accept = 'video/*';
            }
        } else if (type === 'photo') {
            const mediaInput = document.getElementById('media-file');
            if (mediaInput) {
                mediaInput.accept = 'image/*';
            }
        }

        this.updatePreview();
    }

    applyTemplate(templateName) {
        const template = this.templates[templateName];
        if (!template) return;

        document.getElementById('bg-color').value = template.bg;
        document.getElementById('text-color').value = template.text;
        
        // Apply text effect
        document.querySelectorAll('.effect-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-effect="${template.effects}"]`)?.classList.add('active');

        this.updatePreview();
        this.showNotification('Template applied! ✨', 'success');
    }

    updatePreview() {
        const preview = document.getElementById('story-preview');
        const previewText = document.getElementById('preview-text');
        
        if (!preview || !previewText) return;

        if (this.storyType === 'text') {
            const textInput = document.getElementById('story-text');
            const bgColor = document.getElementById('bg-color').value;
            const textColor = document.getElementById('text-color').value;
            const activeEffect = document.querySelector('.effect-btn.active')?.dataset.effect || 'none';

            const text = textInput?.value.trim() || '✨ Your story will appear here...';
            previewText.textContent = text;
            
            // Apply background gradient
            const gradient = this.createGradient(bgColor);
            preview.style.background = gradient;
            
            // Apply text color
            previewText.style.color = textColor;
            
            // Apply text effects
            this.applyTextEffect(previewText, activeEffect);
            
        } else if (this.storyType === 'poll') {
            const pollQuestion = document.getElementById('poll-question')?.value || 'Your poll question here';
            previewText.innerHTML = `
                <div class="poll-preview">
                    <div class="poll-question-preview">${pollQuestion}</div>
                    <div class="poll-options-preview">
                        <div class="poll-option-preview">Option 1</div>
                        <div class="poll-option-preview">Option 2</div>
                    </div>
                </div>
            `;
            preview.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
        }
    }

    createGradient(baseColor) {
        const hex = baseColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        return `linear-gradient(135deg, ${baseColor} 0%, rgba(${r}, ${g}, ${b}, 0.8) 50%, rgba(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)}, 0.9) 100%)`;
    }

    applyTextEffect(element, effect) {
        // Reset all effects
        element.style.textShadow = '';
        element.style.webkitTextStroke = '';
        element.style.filter = '';

        switch (effect) {
            case 'shadow':
                element.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
                break;
            case 'outline':
                element.style.webkitTextStroke = '1px rgba(0,0,0,0.5)';
                break;
            case 'glow':
                element.style.textShadow = '0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.6)';
                break;
        }
    }

    updateCharCount(input, counter, maxLength) {
        const length = input.value.length;
        counter.textContent = length;
        
        counter.className = 'char-counter';
        if (length > maxLength * 0.8) counter.classList.add('warning');
        if (length > maxLength * 0.9) counter.classList.add('danger');
    }

    handleFileSelection(file) {
        // Validate file size
        const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for image
        
        if (file.size > maxSize) {
            this.showNotification(`File size must be less than ${maxSize / (1024 * 1024)}MB`, 'error');
            return;
        }

        // Validate file type
        const validTypes = this.storyType === 'video' ? ['video/mp4', 'video/webm'] : ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        
        if (!validTypes.some(type => file.type.startsWith(type.split('/')[0]))) {
            this.showNotification('Invalid file type', 'error');
            return;
        }

        this.selectedFile = file;
        this.showMediaPreview(file);
    }

    showMediaPreview(file) {
        const uploadArea = document.getElementById('media-upload-area');
        const preview = document.getElementById('media-preview');
        const previewContent = document.getElementById('media-preview-content');

        const reader = new FileReader();
        reader.onload = (e) => {
            const fileUrl = e.target.result;
            
            if (file.type.startsWith('image/')) {
                previewContent.innerHTML = `
                    <img src="${fileUrl}" alt="Preview" style="width: 100%; height: auto; max-height: 400px; object-fit: cover;">
                `;
            } else if (file.type.startsWith('video/')) {
                previewContent.innerHTML = `
                    <video controls style="width: 100%; height: auto; max-height: 400px;">
                        <source src="${fileUrl}" type="${file.type}">
                        Your browser does not support the video tag.
                    </video>
                `;
            }
            
            uploadArea.style.display = 'none';
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    removeMedia() {
        this.selectedFile = null;
        document.getElementById('media-upload-area').style.display = 'block';
        document.getElementById('media-preview').style.display = 'none';
        document.getElementById('media-preview-content').innerHTML = '';
        document.getElementById('media-file').value = '';
    }

    handleMentionInput(value) {
        if (value.includes('@')) {
            const query = value.split('@').pop().trim();
            if (query.length >= 2) {
                this.fetchMentionSuggestions(query);
            } else {
                this.hideMentionSuggestions();
            }
        } else {
            this.hideMentionSuggestions();
        }
    }

    async fetchMentionSuggestions(query) {
        try {
            const response = await window.api.get(`/threads/users/search?q=${encodeURIComponent(query)}`);
            this.showMentionSuggestions(response);
        } catch (error) {
        }
    }

    showMentionSuggestions(users) {
        const suggestions = document.getElementById('mention-suggestions');
        suggestions.innerHTML = users.map(user => `
            <div class="mention-suggestion" onclick="storyCreator.selectMention('${user.email}', '${user.full_name}')">
                <div class="mention-avatar">${user.full_name.charAt(0).toUpperCase()}</div>
                <div>
                    <div style="font-weight: 600;">${user.full_name}</div>
                    <div style="font-size: 0.875rem; color: var(--subtle-text-color);">${user.email}</div>
                </div>
            </div>
        `).join('');
        suggestions.style.display = 'block';
    }

    hideMentionSuggestions() {
        document.getElementById('mention-suggestions').style.display = 'none';
    }

    selectMention(email, name) {
        if (!this.mentionedUsers.find(u => u.email === email)) {
            this.mentionedUsers.push({ email, name });
            this.updateMentionedUsersDisplay();
        }
        
        document.getElementById('mention-input').value = '';
        this.hideMentionSuggestions();
    }

    updateMentionedUsersDisplay() {
        const container = document.getElementById('mentioned-users');
        container.innerHTML = this.mentionedUsers.map(user => `
            <div class="mentioned-user">
                <span>@${user.name}</span>
                <i class="fas fa-times remove-mention" onclick="storyCreator.removeMention('${user.email}')"></i>
            </div>
        `).join('');
    }

    removeMention(email) {
        this.mentionedUsers = this.mentionedUsers.filter(u => u.email !== email);
        this.updateMentionedUsersDisplay();
    }

    handleLocationInput(value) {
        if (value.length >= 3) {
            this.fetchLocationSuggestions(value);
        }
    }

    async fetchLocationSuggestions(query) {
        // Simulate location API call (you can integrate with Google Places API or similar)
        const suggestions = [
            `${query} University`,
            `${query} Campus`,
            `${query} City`,
            `${query} College`
        ];
        
        this.showLocationSuggestions(suggestions);
    }

    showLocationSuggestions(locations) {
        const suggestions = document.getElementById('location-suggestions');
        suggestions.innerHTML = locations.map(location => `
            <div class="location-suggestion" onclick="storyCreator.selectLocation('${location}')">
                <i class="fas fa-map-marker-alt"></i>
                <span>${location}</span>
            </div>
        `).join('');
        suggestions.style.display = 'block';
    }

    selectLocation(location) {
        this.currentLocation = location;
        document.getElementById('location-input').value = location;
        document.getElementById('location-suggestions').style.display = 'none';
    }

    addPollOption() {
        const container = document.querySelector('.poll-option-container');
        const optionCount = container.querySelectorAll('.poll-option-input').length + 1;
        
        if (optionCount > 6) {
            this.showNotification('Maximum 6 poll options allowed', 'warning');
            return;
        }

        const optionHTML = `
            <div class="poll-option-input">
                <input type="text" placeholder="Option ${optionCount}" maxlength="50">
                <button type="button" class="remove-option-btn" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', optionHTML);
    }

    saveDraft(showMessage = false) {
        const draft = {
            type: this.storyType,
            content: this.getStoryContent(),
            mentions: this.mentionedUsers,
            location: this.currentLocation,
            settings: this.getStorySettings(),
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('storyDraft', JSON.stringify(draft));
        
        if (showMessage) {
            this.showNotification('Draft saved! 💾', 'success');
        }
    }

    loadDraftIfExists() {
        const draft = localStorage.getItem('storyDraft');
        if (draft) {
            try {
                const parsedDraft = JSON.parse(draft);
                this.loadDraft(parsedDraft);
                this.showNotification('Draft restored! Continue where you left off', 'info');
            } catch (error) {
            }
        }
    }

    loadDraft(draft) {
        // Load story type
        this.selectStoryType(draft.type);
        
        // Load content based on type
        if (draft.type === 'text' && draft.content.text) {
            document.getElementById('story-text').value = draft.content.text;
            document.getElementById('bg-color').value = draft.content.bgColor || '#667eea';
            document.getElementById('text-color').value = draft.content.textColor || '#ffffff';
        }
        
        // Load mentions
        this.mentionedUsers = draft.mentions || [];
        this.updateMentionedUsersDisplay();
        
        // Load location
        if (draft.location) {
            this.currentLocation = draft.location;
            document.getElementById('location-input').value = draft.location;
        }

        this.updatePreview();
    }

    getStoryContent() {
        switch (this.storyType) {
            case 'text':
                return {
                    text: document.getElementById('story-text')?.value || '',
                    bgColor: document.getElementById('bg-color')?.value || '#667eea',
                    textColor: document.getElementById('text-color')?.value || '#ffffff',
                    effect: document.querySelector('.effect-btn.active')?.dataset.effect || 'none'
                };
            case 'photo':
            case 'video':
                return {
                    caption: document.getElementById('media-caption')?.value || '',
                    file: this.selectedFile ? this.selectedFile.name : null
                };
            case 'poll':
                const pollOptions = Array.from(document.querySelectorAll('.poll-option-input input'))
                    .map(input => input.value.trim())
                    .filter(value => value);
                return {
                    question: document.getElementById('poll-question')?.value || '',
                    options: pollOptions,
                    allowMultiple: document.getElementById('allow-multiple-votes')?.checked || false,
                    showResultsImmediately: document.getElementById('show-results-immediately')?.checked || false
                };
            default:
                return {};
        }
    }

    getStorySettings() {
        return {
            privacy: document.getElementById('story-privacy')?.value || 'public',
            duration: parseInt(document.getElementById('story-duration')?.value) || 24,
            allowReactions: document.getElementById('allow-reactions')?.checked !== false,
            allowReplies: document.getElementById('allow-replies')?.checked !== false,
            showViewCount: document.getElementById('show-view-count')?.checked !== false,
            allowScreenshot: document.getElementById('allow-screenshot')?.checked || false
        };
    }

    async publishStory() {
        const publishBtn = document.getElementById('publish-story');
        
        try {
            publishBtn.disabled = true;
            publishBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>Publishing...';

            const content = this.getStoryContent();
            const settings = this.getStorySettings();

            // Validate content
            if (!this.validateStoryContent(content)) {
                return;
            }

            const formData = new FormData();
            
            // Add basic story data
            formData.append('type', this.storyType);
            formData.append('privacy', settings.privacy);
            formData.append('duration_hours', settings.duration);
            formData.append('allow_reactions', settings.allowReactions);
            formData.append('allow_replies', settings.allowReplies);
            formData.append('show_view_count', settings.showViewCount);
            formData.append('allow_screenshot', settings.allowScreenshot);

            // Add mentions
            if (this.mentionedUsers.length > 0) {
                formData.append('mentions', JSON.stringify(this.mentionedUsers.map(u => u.email)));
            }

            // Add location
            if (this.currentLocation) {
                formData.append('location', this.currentLocation);
            }

            // Add content based on type
            if (this.storyType === 'text') {
                formData.append('content', content.text);
                formData.append('background_color', content.bgColor);
                formData.append('text_color', content.textColor);
                formData.append('text_effect', content.effect);
            } else if (this.storyType === 'photo' || this.storyType === 'video') {
                if (this.selectedFile) {
                    formData.append('story_media', this.selectedFile);
                }
                if (content.caption) {
                    formData.append('content', content.caption);
                }
            } else if (this.storyType === 'poll') {
                formData.append('poll_question', content.question);
                formData.append('poll_options', JSON.stringify(content.options));
                formData.append('poll_allow_multiple', content.allowMultiple);
                formData.append('poll_show_results_immediately', content.showResultsImmediately);
            }

            // Submit to server
            const response = await window.api.postForm('/stories/create', formData);
            
            // Clear draft
            localStorage.removeItem('storyDraft');
            
            // Show success modal
            this.showSuccessModal(response);
            
        } catch (error) {
            this.showNotification(error.message || 'Failed to publish story', 'error');
        } finally {
            publishBtn.disabled = false;
            publishBtn.innerHTML = '<i class="fas fa-paper-plane"></i>Share Story';
        }
    }

    validateStoryContent(content) {
        switch (this.storyType) {
            case 'text':
                if (!content.text || content.text.trim().length === 0) {
                    this.showNotification('Please add some text to your story', 'error');
                    return false;
                }
                break;
            case 'photo':
            case 'video':
                if (!this.selectedFile) {
                    this.showNotification(`Please select a ${this.storyType} file`, 'error');
                    return false;
                }
                break;
            case 'poll':
                if (!content.question || content.question.trim().length === 0) {
                    this.showNotification('Please add a poll question', 'error');
                    return false;
                }
                if (content.options.length < 2) {
                    this.showNotification('Poll must have at least 2 options', 'error');
                    return false;
                }
                break;
        }
        return true;
    }

    showSuccessModal(response) {
        document.getElementById('success-modal').style.display = 'flex';
        
        // Auto close after 3 seconds if no interaction
        setTimeout(() => {
            const modal = document.getElementById('success-modal');
            if (modal.style.display === 'flex') {
                window.location.href = 'threads.html';
            }
        }, 3000);
    }

    setupAutoSave() {
        // Auto-save every 30 seconds
        setInterval(() => {
            this.saveDraft();
        }, 30000);
    }

    async requestLocationPermission() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                // Could use this for location suggestions
                this.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
            });
        }
    }

    initializePreview() {
        this.updatePreview();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            z-index: 10001;
            font-weight: 600;
            max-width: 350px;
            animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
        `;
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas fa-${icons[type] || icons.info}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add CSS animation if not exists
        if (!document.querySelector('#notification-animations')) {
            const style = document.createElement('style');
            style.id = 'notification-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove after 4 seconds with animation
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 4000);
    }
}

// Global functions for template usage
window.selectStoryType = (type) => {
    window.storyCreator.selectStoryType(type);
};

window.createAnotherStory = () => {
    localStorage.removeItem('storyDraft');
    window.location.reload();
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.storyCreator = new StoryCreator();
});

// Additional utility functions for enhanced functionality
class StoryAnalytics {
    static trackStoryCreation(type) {
        // Analytics tracking
    }

    static trackTemplateUsage(template) {
        // Template usage analytics
    }
}

class StoryValidator {
    static validateText(text, maxLength = 500) {
        return text && text.trim().length > 0 && text.length <= maxLength;
    }

    static validateFile(file, type) {
        const maxSizes = { photo: 10, video: 50 }; // MB
        const allowedTypes = {
            photo: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
            video: ['video/mp4', 'video/webm']
        };

        return file.size <= (maxSizes[type] * 1024 * 1024) && 
               allowedTypes[type].some(t => file.type.includes(t.split('/')[1]));
    }
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StoryCreator, StoryAnalytics, StoryValidator };
}

// Initialize professional features for story creation
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Emoji Picker for story text
    if (typeof EmojiPicker !== 'undefined') {
        const storyTextarea = document.getElementById('story-text');
        if (storyTextarea) {
            const emojiBtn = document.createElement('button');
            emojiBtn.type = 'button';
            emojiBtn.className = 'emoji-trigger-btn';
            emojiBtn.innerHTML = '<i class="fas fa-smile"></i>';
            emojiBtn.style.cssText = 'position: absolute; right: 10px; top: 10px; background: transparent; border: none; font-size: 20px; cursor: pointer; z-index: 10;';
            
            const textareaContainer = storyTextarea.closest('.textarea-container');
            if (textareaContainer) {
                textareaContainer.style.position = 'relative';
                textareaContainer.appendChild(emojiBtn);
                
                const emojiPicker = new EmojiPicker({
                    target: emojiBtn,
                    position: 'bottom',
                    onSelect: (emoji) => {
                        const cursorPos = storyTextarea.selectionStart;
                        const textBefore = storyTextarea.value.substring(0, cursorPos);
                        const textAfter = storyTextarea.value.substring(cursorPos);
                        storyTextarea.value = textBefore + emoji + textAfter;
                        storyTextarea.focus();
                        storyTextarea.selectionStart = storyTextarea.selectionEnd = cursorPos + emoji.length;
                        
                        // Trigger input event
                        const event = new Event('input', { bubbles: true });
                        storyTextarea.dispatchEvent(event);
                    }
                });

                emojiBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    emojiPicker.toggle();
                });
            }
        }
    }

    // Initialize Autocomplete for Mentions in story
    if (typeof ProfessionalAutocomplete !== 'undefined') {
        const mentionInput = document.getElementById('mention-input');
        if (mentionInput) {
            new ProfessionalAutocomplete(mentionInput, {
                type: 'mention',
                minChars: 1,
                maxResults: 10,
                onSelect: (item) => {
                }
            });
        }
    }
});
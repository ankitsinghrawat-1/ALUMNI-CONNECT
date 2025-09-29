// Enhanced Story Modal Functionality
class StoryModal {
    constructor() {
        this.selectedFile = null;
        this.storyType = 'text';
        this.init();
    }

    init() {
        this.loadCSS();
    }

    loadCSS() {
        // Load the story modal CSS if not already loaded
        if (!document.querySelector('link[href*="story-modal.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'css/story-modal.css';
            document.head.appendChild(link);
        }
    }

    open() {
        // Check if user is logged in
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            if (typeof showToast === 'function') {
                showToast('Please log in to add stories', 'error');
            } else {
                alert('Please log in to add stories');
            }
            return;
        }

        this.create();
    }

    create() {
        // Remove existing modal if any
        const existingModal = document.querySelector('.add-story-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'add-story-modal';
        
        modal.innerHTML = `
            <div class="story-modal-overlay" onclick="window.storyModal.close()">
                <div class="story-modal-content" onclick="event.stopPropagation()">
                    <div class="story-modal-header">
                        <h3><i class="fas fa-plus-circle"></i>Create Your Story</h3>
                        <button class="modal-close-btn" onclick="window.storyModal.close()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="story-creation-area">
                        <!-- Story Type Selection -->
                        <div class="story-type-selector">
                            <button class="story-type-btn active" data-type="text" onclick="window.storyModal.selectType('text')">
                                <i class="fas fa-font"></i>
                                <span>Text</span>
                            </button>
                            <button class="story-type-btn" data-type="photo" onclick="window.storyModal.selectType('photo')">
                                <i class="fas fa-image"></i>
                                <span>Photo</span>
                            </button>
                            <button class="story-type-btn" data-type="video" onclick="window.storyModal.selectType('video')">
                                <i class="fas fa-video"></i>
                                <span>Video</span>
                            </button>
                        </div>

                        <!-- Story Content Area -->
                        <div class="story-content-area" id="story-content-area">
                            <!-- Text Story Content -->
                            <div class="story-text-content active" id="text-content">
                                <div class="story-preview" id="story-preview">
                                    <div class="story-preview-text" id="preview-text">✨ Your story text will appear here...</div>
                                </div>
                                <div class="story-controls">
                                    <div style="position: relative;">
                                        <textarea 
                                            id="story-text-input" 
                                            placeholder="Share what's on your mind... 💭"
                                            maxlength="200"
                                            rows="3"
                                        ></textarea>
                                        <div class="char-count" id="text-char-count">0/200</div>
                                    </div>
                                    <div class="story-styling-controls">
                                        <div class="color-control">
                                            <label>Background</label>
                                            <input type="color" id="story-bg-color" value="#667eea" onchange="window.storyModal.updatePreview()">
                                        </div>
                                        <div class="color-control">
                                            <label>Text</label>
                                            <input type="color" id="story-text-color" value="#ffffff" onchange="window.storyModal.updatePreview()">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Photo/Video Story Content -->
                            <div class="story-media-content" id="media-content">
                                <div class="media-upload-area" onclick="document.getElementById('story-media-input').click()">
                                    <div class="upload-placeholder">
                                        <i class="fas fa-cloud-upload-alt"></i>
                                        <p>Drag & drop or click to upload</p>
                                        <small>Images and videos up to 10MB • JPG, PNG, MP4</small>
                                    </div>
                                </div>
                                <input type="file" id="story-media-input" accept="image/*,video/*" style="display: none;" onchange="window.storyModal.handleMediaUpload(event)">
                                <div class="media-preview" id="media-preview" style="display: none;">
                                    <div class="media-preview-content" id="media-preview-content"></div>
                                    <button class="remove-media-btn" onclick="window.storyModal.removeMedia()">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                <div class="media-caption-area">
                                    <div style="position: relative;">
                                        <textarea 
                                            id="story-caption-input" 
                                            placeholder="Write a caption... 📝"
                                            maxlength="150"
                                            rows="2"
                                        ></textarea>
                                        <div class="char-count" id="caption-char-count">0/150</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="story-modal-footer">
                        <button class="btn-secondary" onclick="window.storyModal.close()">
                            <i class="fas fa-times"></i>
                            Cancel
                        </button>
                        <button class="btn-primary" id="publish-story-btn" onclick="window.storyModal.publish()">
                            <i class="fas fa-paper-plane"></i>
                            Share Story
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Initialize event listeners
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Character counting for text input
        const storyTextInput = document.getElementById('story-text-input');
        const textCharCount = document.getElementById('text-char-count');
        const captionInput = document.getElementById('story-caption-input');
        const captionCharCount = document.getElementById('caption-char-count');

        storyTextInput?.addEventListener('input', () => {
            const length = storyTextInput.value.length;
            textCharCount.textContent = `${length}/200`;
            textCharCount.className = 'char-count';
            if (length > 160) textCharCount.classList.add('warning');
            if (length > 180) textCharCount.classList.add('danger');
            this.updatePreview();
        });

        captionInput?.addEventListener('input', () => {
            const length = captionInput.value.length;
            captionCharCount.textContent = `${length}/150`;
            captionCharCount.className = 'char-count';
            if (length > 120) captionCharCount.classList.add('warning');
            if (length > 135) captionCharCount.classList.add('danger');
        });

        // Initialize preview
        this.updatePreview();
    }

    selectType(type) {
        this.storyType = type;

        // Update active button
        document.querySelectorAll('.story-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('active');

        // Show appropriate content area
        document.querySelectorAll('.story-text-content, .story-media-content').forEach(area => {
            area.classList.remove('active');
        });

        if (type === 'text') {
            document.getElementById('text-content').classList.add('active');
        } else {
            document.getElementById('media-content').classList.add('active');
        }
    }

    updatePreview() {
        const textInput = document.getElementById('story-text-input');
        const preview = document.getElementById('story-preview');
        const previewText = document.getElementById('preview-text');
        const bgColor = document.getElementById('story-bg-color');
        const textColor = document.getElementById('story-text-color');

        if (textInput && preview && previewText && bgColor && textColor) {
            const text = textInput.value.trim();
            previewText.textContent = text || '✨ Your story text will appear here...';
            
            // Apply colors with gradient background
            const baseColor = bgColor.value;
            const gradient = this.createGradient(baseColor);
            preview.style.background = gradient;
            previewText.style.color = textColor.value;
        }
    }

    createGradient(baseColor) {
        // Convert hex to RGB
        const hex = baseColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Create a beautiful gradient
        return `linear-gradient(135deg, ${baseColor} 0%, rgba(${r}, ${g}, ${b}, 0.8) 50%, rgba(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)}, 0.9) 100%)`;
    }

    handleMediaUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            if (typeof showToast === 'function') {
                showToast('File size must be less than 10MB', 'error');
            } else {
                alert('File size must be less than 10MB');
            }
            return;
        }

        this.selectedFile = file;
        this.showMediaPreview(file);
    }

    showMediaPreview(file) {
        const mediaPreview = document.getElementById('media-preview');
        const mediaPreviewContent = document.getElementById('media-preview-content');

        const reader = new FileReader();
        reader.onload = (e) => {
            const fileUrl = e.target.result;
            
            if (file.type.startsWith('image/')) {
                mediaPreviewContent.innerHTML = `
                    <img src="${fileUrl}" alt="Preview" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 16px;">
                `;
            } else if (file.type.startsWith('video/')) {
                mediaPreviewContent.innerHTML = `
                    <video controls style="width: 100%; max-height: 300px; border-radius: 16px;">
                        <source src="${fileUrl}" type="${file.type}">
                        Your browser does not support the video tag.
                    </video>
                `;
            }
            
            mediaPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    removeMedia() {
        this.selectedFile = null;
        const mediaPreview = document.getElementById('media-preview');
        const mediaPreviewContent = document.getElementById('media-preview-content');
        const mediaInput = document.getElementById('story-media-input');

        mediaPreview.style.display = 'none';
        mediaPreviewContent.innerHTML = '';
        mediaInput.value = '';
    }

    async publish() {
        const publishBtn = document.getElementById('publish-story-btn');
        
        try {
            publishBtn.disabled = true;
            publishBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';

            const formData = new FormData();
            
            if (this.storyType === 'text') {
                const textInput = document.getElementById('story-text-input');
                const content = textInput.value.trim();
                
                if (!content) {
                    throw new Error('Please add some text to your story');
                }
                
                formData.append('content', content);
                formData.append('background_color', document.getElementById('story-bg-color').value);
                formData.append('text_color', document.getElementById('story-text-color').value);
            } else {
                if (!this.selectedFile) {
                    throw new Error('Please select a media file');
                }
                
                formData.append('story_media', this.selectedFile);
                const caption = document.getElementById('story-caption-input').value.trim();
                if (caption) {
                    formData.append('content', caption);
                }
            }

            // Post to stories API
            const response = await window.api.postForm('/stories', formData);
            
            if (typeof showToast === 'function') {
                showToast('Story published successfully!', 'success');
            }
            
            this.close();
            
            // Refresh stories if we're on the threads page
            if (window.location.pathname.includes('threads.html') && typeof loadStories === 'function') {
                setTimeout(loadStories, 1000);
            }
            
        } catch (error) {
            console.error('Error publishing story:', error);
            if (typeof showToast === 'function') {
                showToast(error.message || 'Failed to publish story', 'error');
            } else {
                alert(error.message || 'Failed to publish story');
            }
        } finally {
            publishBtn.disabled = false;
            publishBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Share Story';
        }
    }

    close() {
        const modal = document.querySelector('.add-story-modal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
        this.selectedFile = null;
        this.storyType = 'text';
    }
}

// Initialize global story modal instance
window.storyModal = new StoryModal();

// Global functions for backward compatibility
window.openAddStoryModal = () => {
    window.storyModal.open();
};

window.closeAddStoryModal = () => {
    window.storyModal.close();
};

window.selectStoryType = (type) => {
    window.storyModal.selectType(type);
};

window.updateStoryPreview = () => {
    window.storyModal.updatePreview();
};

window.handleStoryMediaUpload = (event) => {
    window.storyModal.handleMediaUpload(event);
};

window.removeStoryMedia = () => {
    window.storyModal.removeMedia();
};

window.publishStory = () => {
    window.storyModal.publish();
};
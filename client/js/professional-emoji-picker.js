/**
 * Professional Emoji Picker
 * Modern emoji selector for social feed
 */

class EmojiPicker {
    constructor(options = {}) {
        this.options = {
            target: options.target || null,
            onSelect: options.onSelect || null,
            position: options.position || 'bottom',
            ...options
        };
        
        this.picker = null;
        this.isOpen = false;
        this.currentCategory = 'smileys';
        
        this.categories = {
            smileys: {
                name: 'Smileys & People',
                icon: '😀',
                emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖']
            },
            gestures: {
                name: 'Gestures',
                icon: '👋',
                emojis: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏']
            },
            hearts: {
                name: 'Hearts',
                icon: '❤️',
                emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟']
            },
            objects: {
                name: 'Objects',
                icon: '🎉',
                emojis: ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '💼', '📚', '📱', '💻', '⌚', '📷', '🎥', '🎮', '🎧', '🎵', '🎸', '🎹', '🎤', '🎪', '🎨', '🎭', '🎬']
            },
            symbols: {
                name: 'Symbols',
                icon: '🔥',
                emojis: ['🔥', '⭐', '✨', '💫', '⚡', '💥', '💢', '💦', '💨', '🌟', '✅', '❌', '❗', '❓', '⁉️', '‼️', '🔴', '🟢', '🟡', '🔵', '🟣', '⚫', '⚪', '🟤', '💯', '🔔', '🔕', '📣', '📢', '🎯', '🚀', '⚙️', '🔑']
            }
        };
        
        this.init();
    }
    
    init() {
        this.createPicker();
    }
    
    createPicker() {
        this.picker = document.createElement('div');
        this.picker.className = 'emoji-picker';
        this.picker.innerHTML = `
            <div class="emoji-categories">
                ${Object.entries(this.categories).map(([key, cat]) => `
                    <button class="emoji-category-btn ${key === this.currentCategory ? 'active' : ''}" 
                            data-category="${key}"
                            title="${cat.name}">
                        ${cat.icon}
                    </button>
                `).join('')}
            </div>
            <div class="emoji-search">
                <input type="text" placeholder="Search emojis..." class="emoji-search-input">
            </div>
            <div class="emoji-grid"></div>
        `;
        
        this.attachEventListeners();
        this.renderEmojis(this.currentCategory);
    }
    
    attachEventListeners() {
        // Category switching
        this.picker.querySelectorAll('.emoji-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.switchCategory(category);
            });
        });
        
        // Search
        const searchInput = this.picker.querySelector('.emoji-search-input');
        searchInput.addEventListener('input', (e) => {
            this.search(e.target.value);
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.picker.contains(e.target) && 
                !(this.options.target && this.options.target.contains(e.target))) {
                this.close();
            }
        });
    }
    
    switchCategory(category) {
        this.currentCategory = category;
        
        // Update active category button
        this.picker.querySelectorAll('.emoji-category-btn').forEach(btn => {
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        this.renderEmojis(category);
    }
    
    renderEmojis(category) {
        const grid = this.picker.querySelector('.emoji-grid');
        const emojis = this.categories[category].emojis;
        
        grid.innerHTML = emojis.map(emoji => `
            <button class="emoji-btn" data-emoji="${emoji}">${emoji}</button>
        `).join('');
        
        // Attach click handlers
        grid.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectEmoji(e.currentTarget.dataset.emoji);
            });
        });
    }
    
    search(query) {
        if (!query) {
            this.renderEmojis(this.currentCategory);
            return;
        }
        
        const grid = this.picker.querySelector('.emoji-grid');
        const allEmojis = Object.values(this.categories).flatMap(cat => cat.emojis);
        
        // Simple emoji search (in a real app, you'd have emoji names/keywords)
        const results = allEmojis.slice(0, 50); // Show first 50 for demo
        
        grid.innerHTML = results.map(emoji => `
            <button class="emoji-btn" data-emoji="${emoji}">${emoji}</button>
        `).join('');
        
        grid.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectEmoji(e.currentTarget.dataset.emoji);
            });
        });
    }
    
    selectEmoji(emoji) {
        if (this.options.onSelect) {
            this.options.onSelect(emoji);
        }
        this.close();
    }
    
    open() {
        if (!this.picker.parentElement) {
            document.body.appendChild(this.picker);
        }
        
        // Position the picker
        if (this.options.target) {
            const rect = this.options.target.getBoundingClientRect();
            
            if (this.options.position === 'top') {
                this.picker.style.bottom = `${window.innerHeight - rect.top}px`;
                this.picker.style.left = `${rect.left}px`;
            } else {
                this.picker.style.top = `${rect.bottom + 5}px`;
                this.picker.style.left = `${rect.left}px`;
            }
        }
        
        this.picker.classList.add('active');
        this.isOpen = true;
    }
    
    close() {
        this.picker.classList.remove('active');
        this.isOpen = false;
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    destroy() {
        if (this.picker && this.picker.parentElement) {
            this.picker.parentElement.removeChild(this.picker);
        }
    }
}

// Export for use in other scripts
window.EmojiPicker = EmojiPicker;

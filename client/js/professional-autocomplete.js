/**
 * Professional Autocomplete System
 * For mentions (@) and hashtags (#) in social feed
 */

class ProfessionalAutocomplete {
    constructor(inputElement, options = {}) {
        this.input = inputElement;
        this.options = {
            type: options.type || 'mention', // 'mention' or 'hashtag'
            minChars: options.minChars || 1,
            maxResults: options.maxResults || 10,
            fetchData: options.fetchData || this.defaultFetchData.bind(this),
            onSelect: options.onSelect || null,
            ...options
        };
        
        this.dropdown = null;
        this.isOpen = false;
        this.currentQuery = '';
        this.selectedIndex = -1;
        this.results = [];
        
        this.init();
    }
    
    init() {
        this.createDropdown();
        this.attachEventListeners();
    }
    
    createDropdown() {
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'autocomplete-dropdown';
        this.dropdown.style.display = 'none';
        this.input.parentElement.style.position = 'relative';
        this.input.parentElement.appendChild(this.dropdown);
    }
    
    attachEventListeners() {
        this.input.addEventListener('input', this.handleInput.bind(this));
        this.input.addEventListener('keydown', this.handleKeydown.bind(this));
        document.addEventListener('click', this.handleClickOutside.bind(this));
    }
    
    handleInput(e) {
        const value = e.target.value;
        const cursorPos = e.target.selectionStart;
        
        // Find the trigger character before cursor
        const textBeforeCursor = value.substring(0, cursorPos);
        const trigger = this.options.type === 'mention' ? '@' : '#';
        const lastTriggerIndex = textBeforeCursor.lastIndexOf(trigger);
        
        if (lastTriggerIndex === -1) {
            this.close();
            return;
        }
        
        // Check if there's a space after the trigger
        const textAfterTrigger = textBeforeCursor.substring(lastTriggerIndex + 1);
        if (textAfterTrigger.includes(' ')) {
            this.close();
            return;
        }
        
        // Extract query
        const query = textAfterTrigger;
        
        if (query.length < this.options.minChars) {
            this.close();
            return;
        }
        
        this.currentQuery = query;
        this.search(query);
    }
    
    handleKeydown(e) {
        if (!this.isOpen) return;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectNext();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectPrevious();
                break;
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0) {
                    this.selectItem(this.results[this.selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                this.close();
                break;
        }
    }
    
    handleClickOutside(e) {
        if (!this.dropdown.contains(e.target) && e.target !== this.input) {
            this.close();
        }
    }
    
    async search(query) {
        try {
            this.results = await this.options.fetchData(query, this.options.type);
            this.render();
        } catch (error) {
            this.close();
        }
    }
    
    async defaultFetchData(query, type) {
        // Default implementation - fetch from API
        if (type === 'mention') {
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=${this.options.maxResults}`);
            const data = await response.json();
            return data.users || [];
        } else if (type === 'hashtag') {
            const response = await fetch(`/api/hashtags/search?q=${encodeURIComponent(query)}&limit=${this.options.maxResults}`);
            const data = await response.json();
            return data.hashtags || [];
        }
        return [];
    }
    
    render() {
        if (this.results.length === 0) {
            this.close();
            return;
        }
        
        this.dropdown.innerHTML = '';
        this.selectedIndex = -1;
        
        this.results.forEach((item, index) => {
            const element = this.createItemElement(item, index);
            this.dropdown.appendChild(element);
        });
        
        this.open();
    }
    
    createItemElement(item, index) {
        const div = document.createElement('div');
        div.className = 'autocomplete-item';
        div.dataset.index = index;
        
        if (this.options.type === 'mention') {
            div.innerHTML = `
                ${item.profile_pic_url 
                    ? `<img src="${item.profile_pic_url}" alt="${item.full_name}" class="autocomplete-avatar">` 
                    : '<div class="autocomplete-avatar"><i class="fas fa-user"></i></div>'}
                <div class="autocomplete-info">
                    <div class="autocomplete-name">${item.full_name}</div>
                    <div class="autocomplete-meta">@${item.username || item.email.split('@')[0]}</div>
                </div>
            `;
        } else if (this.options.type === 'hashtag') {
            div.innerHTML = `
                <div class="autocomplete-info">
                    <div class="autocomplete-name">#${item.tag_name}</div>
                    <div class="autocomplete-meta">${this.formatNumber(item.thread_count || 0)} threads</div>
                </div>
            `;
        }
        
        div.addEventListener('click', () => this.selectItem(item));
        div.addEventListener('mouseenter', () => this.highlightItem(index));
        
        return div;
    }
    
    selectNext() {
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
        this.updateSelection();
    }
    
    selectPrevious() {
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection();
    }
    
    highlightItem(index) {
        this.selectedIndex = index;
        this.updateSelection();
    }
    
    updateSelection() {
        const items = this.dropdown.querySelectorAll('.autocomplete-item');
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('active');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    selectItem(item) {
        const value = this.input.value;
        const cursorPos = this.input.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPos);
        
        const trigger = this.options.type === 'mention' ? '@' : '#';
        const lastTriggerIndex = textBeforeCursor.lastIndexOf(trigger);
        
        const textBeforeTrigger = value.substring(0, lastTriggerIndex);
        const textAfterCursor = value.substring(cursorPos);
        
        let replacement;
        if (this.options.type === 'mention') {
            replacement = `@${item.username || item.email.split('@')[0]}`;
        } else {
            replacement = `#${item.tag_name}`;
        }
        
        this.input.value = textBeforeTrigger + replacement + ' ' + textAfterCursor;
        
        const newCursorPos = textBeforeTrigger.length + replacement.length + 1;
        this.input.setSelectionRange(newCursorPos, newCursorPos);
        this.input.focus();
        
        if (this.options.onSelect) {
            this.options.onSelect(item, this.options.type);
        }
        
        this.close();
    }
    
    open() {
        this.dropdown.style.display = 'block';
        this.isOpen = true;
    }
    
    close() {
        this.dropdown.style.display = 'none';
        this.isOpen = false;
        this.selectedIndex = -1;
        this.results = [];
    }
    
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
    
    destroy() {
        if (this.dropdown && this.dropdown.parentElement) {
            this.dropdown.parentElement.removeChild(this.dropdown);
        }
        document.removeEventListener('click', this.handleClickOutside.bind(this));
    }
}

// Export for use in other scripts
window.ProfessionalAutocomplete = ProfessionalAutocomplete;

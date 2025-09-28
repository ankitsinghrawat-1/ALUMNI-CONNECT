// client/js/advanced-search.js
// Advanced search component with filters, suggestions, and real-time results

class AdvancedSearch {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            placeholder: 'Search...',
            endpoint: null,
            debounceDelay: 300,
            minChars: 2,
            maxResults: 10,
            showFilters: true,
            showSuggestions: true,
            filters: [],
            onSelect: null,
            onSearch: null,
            ...options
        };
        
        this.searchTimeout = null;
        this.currentQuery = '';
        this.currentFilters = {};
        this.suggestions = [];
        this.isOpen = false;
        
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.setupKeyboardNavigation();
    }

    render() {
        const filtersHTML = this.options.showFilters ? this.renderFilters() : '';
        
        this.container.innerHTML = `
            <div class="advanced-search-wrapper">
                <div class="search-input-wrapper">
                    <div class="search-input-container">
                        <i class="search-icon fas fa-search"></i>
                        <input 
                            type="text" 
                            class="search-input" 
                            placeholder="${this.options.placeholder}"
                            autocomplete="off"
                            spellcheck="false"
                        >
                        <button class="search-clear-btn" style="display: none;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    ${filtersHTML}
                </div>
                
                <div class="search-dropdown" style="display: none;">
                    <div class="search-suggestions"></div>
                    <div class="search-results"></div>
                    <div class="search-footer">
                        <small class="search-hint">Press Enter to search or Escape to close</small>
                    </div>
                </div>
                
                <div class="search-loading" style="display: none;">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <span>Searching...</span>
                    </div>
                </div>
            </div>
        `;

        this.elements = {
            wrapper: this.container.querySelector('.advanced-search-wrapper'),
            input: this.container.querySelector('.search-input'),
            clearBtn: this.container.querySelector('.search-clear-btn'),
            dropdown: this.container.querySelector('.search-dropdown'),
            suggestions: this.container.querySelector('.search-suggestions'),
            results: this.container.querySelector('.search-results'),
            loading: this.container.querySelector('.search-loading'),
            filters: this.container.querySelectorAll('.search-filter')
        };
    }

    renderFilters() {
        if (!this.options.filters.length) return '';
        
        const filtersHTML = this.options.filters.map(filter => {
            if (filter.type === 'select') {
                return `
                    <select class="search-filter" data-filter="${filter.key}">
                        <option value="">${filter.placeholder}</option>
                        ${filter.options.map(opt => 
                            `<option value="${opt.value}">${opt.label}</option>`
                        ).join('')}
                    </select>
                `;
            } else if (filter.type === 'checkbox') {
                return `
                    <div class="filter-checkbox-group">
                        <label class="filter-checkbox">
                            <input type="checkbox" class="search-filter" data-filter="${filter.key}">
                            <span>${filter.label}</span>
                        </label>
                    </div>
                `;
            }
            return '';
        }).join('');

        return `
            <div class="search-filters">
                ${filtersHTML}
            </div>
        `;
    }

    setupEventListeners() {
        // Input events
        this.elements.input.addEventListener('input', (e) => {
            this.handleInput(e.target.value);
        });

        this.elements.input.addEventListener('focus', () => {
            this.handleFocus();
        });

        this.elements.input.addEventListener('blur', (e) => {
            // Delay hiding to allow clicking on results
            setTimeout(() => this.handleBlur(), 150);
        });

        // Clear button
        this.elements.clearBtn.addEventListener('click', () => {
            this.clear();
        });

        // Filter events
        this.elements.filters.forEach(filter => {
            filter.addEventListener('change', (e) => {
                this.handleFilterChange(e.target);
            });
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.close();
            }
        });

        // Results click handling
        this.elements.results.addEventListener('click', (e) => {
            const resultItem = e.target.closest('.search-result-item');
            if (resultItem) {
                this.selectResult(resultItem);
            }
        });

        // Suggestion click handling
        this.elements.suggestions.addEventListener('click', (e) => {
            const suggestionItem = e.target.closest('.search-suggestion-item');
            if (suggestionItem) {
                this.selectSuggestion(suggestionItem);
            }
        });
    }

    setupKeyboardNavigation() {
        this.elements.input.addEventListener('keydown', (e) => {
            const items = this.container.querySelectorAll('.search-result-item, .search-suggestion-item');
            const activeItem = this.container.querySelector('.search-item-active');
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateResults('down', items, activeItem);
                    break;
                
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateResults('up', items, activeItem);
                    break;
                
                case 'Enter':
                    e.preventDefault();
                    if (activeItem) {
                        this.selectItem(activeItem);
                    } else {
                        this.performSearch();
                    }
                    break;
                
                case 'Escape':
                    e.preventDefault();
                    this.close();
                    break;
            }
        });
    }

    handleInput(value) {
        this.currentQuery = value;
        
        // Show/hide clear button
        this.elements.clearBtn.style.display = value ? 'flex' : 'none';
        
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.performSearch();
        }, this.options.debounceDelay);

        if (value.length >= this.options.minChars) {
            this.open();
        } else {
            this.close();
        }
    }

    handleFocus() {
        if (this.currentQuery.length >= this.options.minChars) {
            this.open();
        }
    }

    handleBlur() {
        this.close();
    }

    handleFilterChange(filter) {
        const key = filter.dataset.filter;
        const value = filter.type === 'checkbox' ? filter.checked : filter.value;
        
        this.currentFilters[key] = value;
        this.performSearch();
    }

    async performSearch() {
        if (this.currentQuery.length < this.options.minChars && Object.keys(this.currentFilters).length === 0) {
            this.close();
            return;
        }

        try {
            this.showLoading(true);

            const searchParams = {
                q: this.currentQuery,
                ...this.currentFilters,
                limit: this.options.maxResults
            };

            let results = [];
            
            if (this.options.endpoint) {
                // API search
                const response = await window.api.get(this.options.endpoint + '?' + new URLSearchParams(searchParams));
                results = response.results || response;
            } else if (this.options.onSearch) {
                // Custom search function
                results = await this.options.onSearch(searchParams);
            }

            this.displayResults(results);
            
            if (this.options.showSuggestions) {
                this.displaySuggestions();
            }

        } catch (error) {
            console.error('Search error:', error);
            this.displayError('Search failed. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    displayResults(results) {
        if (!results || results.length === 0) {
            this.elements.results.innerHTML = `
                <div class="search-no-results">
                    <i class="fas fa-search"></i>
                    <p>No results found for "${this.currentQuery}"</p>
                </div>
            `;
            return;
        }

        const resultsHTML = results.map((result, index) => `
            <div class="search-result-item" data-index="${index}" data-id="${result.id}">
                <div class="result-icon">
                    <i class="${result.icon || 'fas fa-circle'}"></i>
                </div>
                <div class="result-content">
                    <div class="result-title">${this.highlightText(result.title || result.name)}</div>
                    <div class="result-subtitle">${result.subtitle || result.description || ''}</div>
                    ${result.category ? `<div class="result-category">${result.category}</div>` : ''}
                </div>
                <div class="result-meta">
                    ${result.meta || ''}
                </div>
            </div>
        `).join('');

        this.elements.results.innerHTML = resultsHTML;
    }

    displaySuggestions() {
        const suggestions = this.generateSuggestions();
        
        if (suggestions.length === 0) {
            this.elements.suggestions.innerHTML = '';
            return;
        }

        const suggestionsHTML = suggestions.map((suggestion, index) => `
            <div class="search-suggestion-item" data-index="${index}" data-query="${suggestion}">
                <i class="fas fa-history"></i>
                <span>${this.highlightText(suggestion)}</span>
            </div>
        `).join('');

        this.elements.suggestions.innerHTML = `
            <div class="suggestions-header">Recent searches</div>
            ${suggestionsHTML}
        `;
    }

    generateSuggestions() {
        // Get recent searches from localStorage
        const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        return recentSearches
            .filter(search => search.toLowerCase().includes(this.currentQuery.toLowerCase()))
            .slice(0, 5);
    }

    highlightText(text) {
        if (!this.currentQuery) return text;
        
        const regex = new RegExp(`(${this.currentQuery})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    displayError(message) {
        this.elements.results.innerHTML = `
            <div class="search-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }

    navigateResults(direction, items, activeItem) {
        if (items.length === 0) return;

        let nextIndex = 0;

        if (activeItem) {
            const currentIndex = Array.from(items).indexOf(activeItem);
            nextIndex = direction === 'down' 
                ? (currentIndex + 1) % items.length
                : (currentIndex - 1 + items.length) % items.length;
            
            activeItem.classList.remove('search-item-active');
        }

        items[nextIndex].classList.add('search-item-active');
        items[nextIndex].scrollIntoView({ block: 'nearest' });
    }

    selectItem(item) {
        if (item.classList.contains('search-result-item')) {
            this.selectResult(item);
        } else if (item.classList.contains('search-suggestion-item')) {
            this.selectSuggestion(item);
        }
    }

    selectResult(item) {
        const resultId = item.dataset.id;
        const resultIndex = parseInt(item.dataset.index);
        
        // Save to recent searches
        this.saveToRecentSearches(this.currentQuery);
        
        if (this.options.onSelect) {
            this.options.onSelect({
                type: 'result',
                id: resultId,
                index: resultIndex,
                query: this.currentQuery
            });
        }

        this.close();
    }

    selectSuggestion(item) {
        const query = item.dataset.query;
        this.elements.input.value = query;
        this.currentQuery = query;
        this.performSearch();
    }

    saveToRecentSearches(query) {
        if (!query || query.length < 2) return;

        let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        
        // Remove if already exists
        recentSearches = recentSearches.filter(search => search !== query);
        
        // Add to beginning
        recentSearches.unshift(query);
        
        // Keep only last 10
        recentSearches = recentSearches.slice(0, 10);
        
        localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    }

    showLoading(show) {
        this.elements.loading.style.display = show ? 'flex' : 'none';
    }

    open() {
        this.isOpen = true;
        this.elements.dropdown.style.display = 'block';
        this.elements.wrapper.classList.add('search-open');
    }

    close() {
        this.isOpen = false;
        this.elements.dropdown.style.display = 'none';
        this.elements.wrapper.classList.remove('search-open');
        
        // Clear active states
        this.container.querySelectorAll('.search-item-active').forEach(item => {
            item.classList.remove('search-item-active');
        });
    }

    clear() {
        this.elements.input.value = '';
        this.currentQuery = '';
        this.elements.clearBtn.style.display = 'none';
        this.close();
        this.elements.input.focus();
    }

    setValue(value) {
        this.elements.input.value = value;
        this.currentQuery = value;
        this.elements.clearBtn.style.display = value ? 'flex' : 'none';
    }

    getValue() {
        return this.currentQuery;
    }

    getFilters() {
        return { ...this.currentFilters };
    }

    destroy() {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        this.container.innerHTML = '';
    }
}

// CSS for advanced search (add to style.css or include separately)
const advancedSearchCSS = `
.advanced-search-wrapper {
    position: relative;
    width: 100%;
}

.search-input-wrapper {
    position: relative;
    z-index: 2;
}

.search-input-container {
    position: relative;
    display: flex;
    align-items: center;
}

.search-input {
    width: 100%;
    padding: 0.875rem 1rem 0.875rem 3rem;
    border: 2px solid var(--border-color);
    border-radius: 25px;
    font-size: 1rem;
    background: var(--card-bg);
    color: var(--text-color);
    transition: all var(--transition-fast);
}

.search-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px var(--primary-light);
}

.search-open .search-input {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
}

.search-icon {
    position: absolute;
    left: 1rem;
    color: var(--text-color-muted);
    z-index: 3;
}

.search-clear-btn {
    position: absolute;
    right: 0.5rem;
    background: none;
    border: none;
    color: var(--text-color-muted);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: all var(--transition-fast);
    z-index: 3;
}

.search-clear-btn:hover {
    background: var(--danger-light);
    color: var(--danger-color);
}

.search-filters {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
}

.search-filter {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 20px;
    font-size: 0.875rem;
    background: var(--card-bg);
    color: var(--text-color);
}

.search-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--card-bg);
    border: 2px solid var(--primary-color);
    border-top: none;
    border-radius: 0 0 8px 8px;
    box-shadow: var(--shadow-medium);
    max-height: 400px;
    overflow-y: auto;
    z-index: 1000;
}

.search-suggestions, .search-results {
    max-height: 300px;
    overflow-y: auto;
}

.suggestions-header {
    padding: 0.75rem 1rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-color-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--border-color);
}

.search-suggestion-item, .search-result-item {
    padding: 1rem;
    cursor: pointer;
    transition: background-color var(--transition-fast);
    border-bottom: 1px solid var(--border-light);
}

.search-suggestion-item:hover, .search-result-item:hover,
.search-item-active {
    background: var(--primary-light);
}

.search-suggestion-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
}

.search-result-item {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.result-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary-light);
    border-radius: 50%;
    color: var(--primary-color);
}

.result-content {
    flex: 1;
    min-width: 0;
}

.result-title {
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 0.25rem;
}

.result-subtitle {
    font-size: 0.875rem;
    color: var(--text-color-light);
    margin-bottom: 0.25rem;
}

.result-category {
    font-size: 0.75rem;
    color: var(--primary-color);
    font-weight: 600;
}

.result-meta {
    font-size: 0.75rem;
    color: var(--text-color-muted);
}

.search-no-results, .search-error {
    padding: 2rem;
    text-align: center;
    color: var(--text-color-light);
}

.search-no-results i, .search-error i {
    font-size: 2rem;
    margin-bottom: 1rem;
    opacity: 0.5;
}

.search-footer {
    padding: 0.75rem 1rem;
    background: var(--background-light);
    border-top: 1px solid var(--border-color);
    text-align: center;
}

.search-hint {
    color: var(--text-color-muted);
    font-size: 0.75rem;
}

.search-loading {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--card-bg);
    border: 2px solid var(--primary-color);
    border-top: none;
    border-radius: 0 0 8px 8px;
    padding: 1rem;
    text-align: center;
    z-index: 1001;
}

.search-loading .loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: var(--text-color-light);
}

mark {
    background: var(--warning-light);
    color: var(--warning-color);
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
}
`;

// Inject CSS if not already present
if (!document.querySelector('#advanced-search-styles')) {
    const style = document.createElement('style');
    style.id = 'advanced-search-styles';
    style.textContent = advancedSearchCSS;
    document.head.appendChild(style);
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedSearch;
}
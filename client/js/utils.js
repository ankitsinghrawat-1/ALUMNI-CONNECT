// client/js/utils.js
// Enhanced utilities for Alumni Connect

/**
 * Enhanced Theme Management System
 */
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'auto';
        this.init();
    }

    init() {
        this.applyTheme();
        this.setupThemeToggle();
        this.watchSystemTheme();
    }

    applyTheme() {
        const html = document.documentElement;
        html.className = '';
        
        if (this.theme === 'dark') {
            html.classList.add('dark-mode');
        } else if (this.theme === 'light') {
            html.classList.add('light-mode');
        }
        // 'auto' uses system preference via CSS media query
    }

    toggleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.theme);
        this.theme = themes[(currentIndex + 1) % themes.length];
        
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: this.theme } 
        }));
    }

    setupThemeToggle() {
        const toggleButtons = document.querySelectorAll('.theme-toggle');
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => this.toggleTheme());
        });
    }

    watchSystemTheme() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', () => {
                if (this.theme === 'auto') {
                    this.applyTheme();
                }
            });
        }
    }
}

/**
 * Enhanced Navigation Manager
 */
class NavigationManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupMobileToggle();
        this.setupActiveLinks();
        this.setupScrollBehavior();
    }

    setupMobileToggle() {
        const toggle = document.querySelector('.nav-toggle');
        const navLinks = document.querySelector('.nav-links');
        
        if (toggle && navLinks) {
            toggle.addEventListener('click', () => {
                toggle.classList.toggle('active');
                navLinks.classList.toggle('active');
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
                    toggle.classList.remove('active');
                    navLinks.classList.remove('active');
                }
            });
        }
    }

    setupActiveLinks() {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-links a');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath) {
                link.classList.add('active');
            }
        });
    }

    setupScrollBehavior() {
        const header = document.querySelector('.main-header');
        if (!header) return;

        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > 100) {
                header.style.background = 'var(--nav-bg)';
                header.style.backdropFilter = 'blur(20px)';
            } else {
                header.style.background = '';
                header.style.backdropFilter = '';
            }
            
            lastScrollY = currentScrollY;
        });
    }
}

/**
 * Enhanced Form Validation System
 */
class FormValidator {
    constructor(form, rules = {}) {
        this.form = form;
        this.rules = rules;
        this.init();
    }

    init() {
        this.setupValidation();
        this.setupRealTimeValidation();
    }

    setupValidation() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateForm()) {
                this.onSuccess();
            }
        });
    }

    setupRealTimeValidation() {
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    validateForm() {
        let isValid = true;
        const inputs = this.form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(field) {
        const name = field.name;
        const value = field.value.trim();
        const rules = this.rules[name] || {};
        
        // Clear previous validation state
        this.clearFieldError(field);
        
        // Required validation
        if (rules.required && !value) {
            this.showFieldError(field, 'This field is required');
            return false;
        }
        
        // Email validation
        if (rules.email && value && !this.isValidEmail(value)) {
            this.showFieldError(field, 'Please enter a valid email address');
            return false;
        }
        
        // Min length validation
        if (rules.minLength && value && value.length < rules.minLength) {
            this.showFieldError(field, `Minimum ${rules.minLength} characters required`);
            return false;
        }
        
        // Max length validation
        if (rules.maxLength && value && value.length > rules.maxLength) {
            this.showFieldError(field, `Maximum ${rules.maxLength} characters allowed`);
            return false;
        }
        
        // Password strength
        if (rules.password && value && !this.isStrongPassword(value)) {
            this.showFieldError(field, 'Password must contain at least 8 characters, including uppercase, lowercase, and number');
            return false;
        }
        
        // Custom validation
        if (rules.custom && typeof rules.custom === 'function') {
            const result = rules.custom(value);
            if (result !== true) {
                this.showFieldError(field, result);
                return false;
            }
        }
        
        this.showFieldSuccess(field);
        return true;
    }

    showFieldError(field, message) {
        field.classList.add('invalid');
        field.classList.remove('valid');
        
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.textContent = message;
        } else {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.textContent = message;
            field.parentNode.appendChild(errorDiv);
        }
    }

    showFieldSuccess(field) {
        field.classList.add('valid');
        field.classList.remove('invalid');
        this.clearFieldError(field);
    }

    clearFieldError(field) {
        field.classList.remove('invalid');
        const error = field.parentNode.querySelector('.field-error');
        if (error) {
            error.remove();
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isStrongPassword(password) {
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        return strongRegex.test(password);
    }

    onSuccess() {
        // Override this method
        console.log('Form validated successfully');
    }
}

/**
 * Enhanced Loading States and Animations
 */
class LoadingManager {
    static showSkeleton(container) {
        if (!container) return;
        
        const skeletonHTML = `
            <div class="loading-skeleton" style="height: 20px; margin-bottom: 10px; border-radius: 4px;"></div>
            <div class="loading-skeleton" style="height: 20px; margin-bottom: 10px; border-radius: 4px; width: 80%;"></div>
            <div class="loading-skeleton" style="height: 20px; margin-bottom: 10px; border-radius: 4px; width: 60%;"></div>
        `;
        
        container.innerHTML = skeletonHTML;
    }

    static showSpinner(container, message = 'Loading...') {
        if (!container) return;
        
        container.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p style="margin-top: 1rem; color: var(--text-color-muted);">${message}</p>
            </div>
        `;
    }

    static hide(container) {
        if (!container) return;
        
        const loadingElements = container.querySelectorAll('.loading-skeleton, .loading-spinner');
        loadingElements.forEach(el => el.remove());
    }
}

/**
 * Enhanced Toast Notification System
 */
class ToastManager {
    constructor() {
        this.container = this.createContainer();
    }

    createContainer() {
        const existing = document.querySelector('.toast-container');
        if (existing) return existing;

        const container = document.createElement('div');
        container.className = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 1rem;
            right: 1rem;
            z-index: var(--z-toast);
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            pointer-events: none;
        `;
        
        document.body.appendChild(container);
        return container;
    }

    show(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-left: 4px solid var(--${type === 'info' ? 'info' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'danger'}-color);
            color: var(--text-color);
            padding: 1rem;
            border-radius: 8px;
            box-shadow: var(--shadow-medium);
            max-width: 400px;
            pointer-events: auto;
            transform: translateX(100%);
            transition: all var(--transition-normal);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;

        const icon = this.getIcon(type);
        toast.innerHTML = `
            <span style="font-size: 1.125rem;">${icon}</span>
            <span>${message}</span>
            <button style="margin-left: auto; background: none; border: none; color: var(--text-color-muted); cursor: pointer; font-size: 1.125rem;">&times;</button>
        `;

        const closeBtn = toast.querySelector('button');
        closeBtn.addEventListener('click', () => this.hide(toast));

        this.container.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);

        // Auto hide
        if (duration > 0) {
            setTimeout(() => this.hide(toast), duration);
        }

        return toast;
    }

    hide(toast) {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    getIcon(type) {
        const icons = {
            success: '✓',
            error: '⚠',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }
}

/**
 * A universal function to fetch data and render it to a container.
 * Enhanced version with better error handling and loading states.
 */
const renderData = async (endpoint, container, itemRenderer, options = {}) => {
    const { 
        emptyMessage = '<p class="info-message">No items to display.</p>',
        gridClass = '',
        useSkeletons = true 
    } = options;

    if (!container) return;

    if (useSkeletons) {
        LoadingManager.showSkeleton(container);
    } else {
        LoadingManager.showSpinner(container);
    }

    try {
        const items = await window.api.get(endpoint);
        
        if (items.length > 0) {
            container.innerHTML = items.map(itemRenderer).join('');
            if (gridClass) {
                container.className = gridClass;
            }
        } else {
            container.innerHTML = emptyMessage;
        }
    } catch (error) {
        console.error(`Error fetching data from ${endpoint}:`, error);
        container.innerHTML = `<p class="info-message error">Failed to load content. Please try again later.</p>`;
        
        // Show toast notification
        if (window.toastManager) {
            window.toastManager.show('Failed to load content. Please try again.', 'error');
        }
    }
};

// Legacy function for backwards compatibility
const showToast = (message, type = 'info') => {
    if (!window.toastManager) {
        window.toastManager = new ToastManager();
    }
    return window.toastManager.show(message, type);
};

// Initialize managers when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
    window.navigationManager = new NavigationManager();
    window.toastManager = new ToastManager();
    window.LoadingManager = LoadingManager;
    window.FormValidator = FormValidator;
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ThemeManager,
        NavigationManager,
        FormValidator,
        LoadingManager,
        ToastManager,
        renderData,
        showToast
    };
}

/**
 * Sanitizes a string to prevent XSS attacks by converting HTML special characters.
 * @param {string} str The string to sanitize.
 * @returns {string} The sanitized string.
 */
const sanitizeHTML = (str) => {
    if (str === null || str === undefined) {
        return '';
    }
    const temp = document.createElement('div');
    temp.textContent = String(str);
    return temp.innerHTML;
};

/**
 * Creates a beautiful SVG avatar with a user's initials and a unique background color.
 * @param {string} name The full name of the user.
 * @returns {string} A Data URL representing the SVG image.
 */
const createInitialsAvatar = (name) => {
    if (!name) name = 'No Name';

    // Get initials (up to 2)
    const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    // Generate a unique, consistent color based on the name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }
    const hue = hash % 360;
    const backgroundColor = `hsl(${hue}, 50%, 60%)`;
    const textColor = '#FFFFFF';

    // Create the SVG markup
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
            <rect width="100%" height="100%" fill="${backgroundColor}" />
            <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="${textColor}" font-size="60" font-family="Poppins, sans-serif" font-weight="600">
                ${initials}
            </text>
        </svg>
    `;

    // Return as a Base64-encoded Data URL
    return `data:image/svg+xml;base64,${btoa(svg)}`;
};
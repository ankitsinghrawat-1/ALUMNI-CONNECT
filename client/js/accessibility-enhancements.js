// client/js/accessibility-enhancements.js
// Advanced accessibility features and WCAG 2.1 compliance

class AccessibilityEnhancer {
    constructor(options = {}) {
        this.options = {
            enableKeyboardNavigation: true,
            enableFocusManagement: true,
            enableScreenReaderSupport: true,
            enableHighContrast: true,
            enableFontScaling: true,
            enableMotionControl: true,
            enableColorBlindSupport: true,
            announcePageChanges: true,
            skipLinkTarget: '#main-content',
            ...options
        };
        
        this.focusHistory = [];
        this.currentFocusIndex = -1;
        this.isHighContrast = false;
        this.fontSize = 100;
        this.reducedMotion = false;
        
        this.init();
    }

    init() {
        this.createAccessibilityPanel();
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
        this.setupScreenReaderSupport();
        this.setupSkipLinks();
        this.setupAccessibilitySettings();
        this.loadUserPreferences();
        this.observePageChanges();
        
        // Detect system preferences
        this.detectSystemPreferences();
    }

    createAccessibilityPanel() {
        const panelHTML = `
            <div id="accessibility-panel" class="accessibility-panel" role="dialog" aria-labelledby="a11y-panel-title" aria-hidden="true">
                <div class="a11y-panel-content">
                    <div class="a11y-panel-header">
                        <h2 id="a11y-panel-title">Accessibility Settings</h2>
                        <button class="a11y-panel-close" aria-label="Close accessibility settings">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="a11y-panel-body">
                        <!-- Visual Settings -->
                        <fieldset class="a11y-fieldset">
                            <legend>Visual Settings</legend>
                            
                            <div class="a11y-control">
                                <label for="font-size-control">Font Size</label>
                                <div class="font-size-controls">
                                    <button type="button" class="btn btn-sm" data-action="decrease-font">A-</button>
                                    <span id="font-size-display">100%</span>
                                    <button type="button" class="btn btn-sm" data-action="increase-font">A+</button>
                                </div>
                            </div>
                            
                            <div class="a11y-control">
                                <label class="a11y-toggle">
                                    <input type="checkbox" id="high-contrast-toggle">
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-label">High Contrast Mode</span>
                                </label>
                            </div>
                            
                            <div class="a11y-control">
                                <label for="color-scheme">Color Scheme</label>
                                <select id="color-scheme" class="a11y-select">
                                    <option value="default">Default</option>
                                    <option value="protanopia">Protanopia (Red-blind)</option>
                                    <option value="deuteranopia">Deuteranopia (Green-blind)</option>
                                    <option value="tritanopia">Tritanopia (Blue-blind)</option>
                                    <option value="monochrome">Monochrome</option>
                                </select>
                            </div>
                        </fieldset>
                        
                        <!-- Motion Settings -->
                        <fieldset class="a11y-fieldset">
                            <legend>Motion Settings</legend>
                            
                            <div class="a11y-control">
                                <label class="a11y-toggle">
                                    <input type="checkbox" id="reduce-motion-toggle">
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-label">Reduce Motion</span>
                                </label>
                            </div>
                            
                            <div class="a11y-control">
                                <label class="a11y-toggle">
                                    <input type="checkbox" id="disable-animations-toggle">
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-label">Disable Animations</span>
                                </label>
                            </div>
                        </fieldset>
                        
                        <!-- Navigation Settings -->
                        <fieldset class="a11y-fieldset">
                            <legend>Navigation Settings</legend>
                            
                            <div class="a11y-control">
                                <label class="a11y-toggle">
                                    <input type="checkbox" id="focus-indicators-toggle" checked>
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-label">Enhanced Focus Indicators</span>
                                </label>
                            </div>
                            
                            <div class="a11y-control">
                                <label class="a11y-toggle">
                                    <input type="checkbox" id="skip-links-toggle" checked>
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-label">Skip Navigation Links</span>
                                </label>
                            </div>
                        </fieldset>
                        
                        <!-- Screen Reader Settings -->
                        <fieldset class="a11y-fieldset">
                            <legend>Screen Reader Settings</legend>
                            
                            <div class="a11y-control">
                                <label class="a11y-toggle">
                                    <input type="checkbox" id="verbose-descriptions-toggle">
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-label">Verbose Descriptions</span>
                                </label>
                            </div>
                            
                            <div class="a11y-control">
                                <label class="a11y-toggle">
                                    <input type="checkbox" id="announce-changes-toggle" checked>
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-label">Announce Page Changes</span>
                                </label>
                            </div>
                        </fieldset>
                    </div>
                    
                    <div class="a11y-panel-footer">
                        <button type="button" class="btn btn-primary" data-action="save-settings">Save Settings</button>
                        <button type="button" class="btn btn-outline" data-action="reset-settings">Reset to Default</button>
                    </div>
                </div>
            </div>
            
            <!-- Accessibility Toggle Button -->
            <button id="accessibility-toggle" class="accessibility-toggle" aria-label="Open accessibility settings" title="Accessibility Settings">
                <i class="fas fa-universal-access"></i>
            </button>
            
            <!-- Screen Reader Announcements -->
            <div id="sr-announcements" class="sr-only" aria-live="polite" aria-atomic="true"></div>
            <div id="sr-announcements-assertive" class="sr-only" aria-live="assertive" aria-atomic="true"></div>
        `;

        document.body.insertAdjacentHTML('beforeend', panelHTML);
        
        this.elements = {
            panel: document.getElementById('accessibility-panel'),
            toggle: document.getElementById('accessibility-toggle'),
            close: document.querySelector('.a11y-panel-close'),
            announcements: document.getElementById('sr-announcements'),
            announcementsAssertive: document.getElementById('sr-announcements-assertive')
        };
        
        this.setupPanelEventListeners();
    }

    setupPanelEventListeners() {
        // Toggle panel
        this.elements.toggle.addEventListener('click', () => {
            this.toggleAccessibilityPanel();
        });

        // Close panel
        this.elements.close.addEventListener('click', () => {
            this.closeAccessibilityPanel();
        });

        // Panel controls
        this.elements.panel.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                this.handlePanelAction(action, e.target);
            }
        });

        // Settings toggles
        this.elements.panel.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') {
                this.handleSettingChange(e.target);
            }
        });

        // Close panel with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPanelOpen()) {
                this.closeAccessibilityPanel();
            }
        });
    }

    setupKeyboardNavigation() {
        if (!this.options.enableKeyboardNavigation) return;

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Alt + A = Accessibility Panel
            if (e.altKey && e.key === 'a') {
                e.preventDefault();
                this.toggleAccessibilityPanel();
            }
            
            // Alt + S = Skip to main content
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                this.skipToMainContent();
            }
            
            // Tab navigation enhancement
            if (e.key === 'Tab') {
                this.handleTabNavigation(e);
            }
            
            // Arrow key navigation for components
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                this.handleArrowNavigation(e);
            }
        });

        // Add keyboard navigation to cards and interactive elements
        this.enhanceKeyboardNavigation();
    }

    setupFocusManagement() {
        if (!this.options.enableFocusManagement) return;

        // Track focus changes
        document.addEventListener('focusin', (e) => {
            this.trackFocus(e.target);
        });

        // Handle focus trapping in modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.trapFocusInModal(e);
            }
        });
    }

    setupScreenReaderSupport() {
        if (!this.options.enableScreenReaderSupport) return;

        // Add missing ARIA labels and descriptions
        this.addAriaLabels();
        
        // Enhance form labels
        this.enhanceFormLabels();
        
        // Add landmark roles
        this.addLandmarkRoles();
        
        // Setup live regions
        this.setupLiveRegions();
    }

    setupSkipLinks() {
        const skipLinksHTML = `
            <div class="skip-links">
                <a href="#main-content" class="skip-link">Skip to main content</a>
                <a href="#navigation" class="skip-link">Skip to navigation</a>
                <a href="#search" class="skip-link">Skip to search</a>
            </div>
        `;

        document.body.insertAdjacentHTML('afterbegin', skipLinksHTML);
    }

    setupAccessibilitySettings() {
        // Create main content landmark if it doesn't exist
        let mainContent = document.querySelector('#main-content, main[role="main"], main');
        if (!mainContent) {
            mainContent = document.querySelector('main') || document.createElement('main');
            mainContent.id = 'main-content';
            mainContent.setAttribute('role', 'main');
        }
    }

    detectSystemPreferences() {
        // Detect reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            this.setReducedMotion(true);
        }

        // Detect high contrast preference
        const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
        if (prefersHighContrast) {
            this.setHighContrast(true);
        }

        // Detect color scheme preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            document.documentElement.classList.add('dark-mode');
        }

        // Listen for changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.setReducedMotion(e.matches);
        });

        window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
            this.setHighContrast(e.matches);
        });
    }

    handlePanelAction(action, element) {
        switch (action) {
            case 'increase-font':
                this.changeFontSize(10);
                break;
            case 'decrease-font':
                this.changeFontSize(-10);
                break;
            case 'save-settings':
                this.saveUserPreferences();
                break;
            case 'reset-settings':
                this.resetSettings();
                break;
        }
    }

    handleSettingChange(element) {
        const id = element.id;
        const value = element.type === 'checkbox' ? element.checked : element.value;

        switch (id) {
            case 'high-contrast-toggle':
                this.setHighContrast(value);
                break;
            case 'reduce-motion-toggle':
                this.setReducedMotion(value);
                break;
            case 'disable-animations-toggle':
                this.setAnimationsDisabled(value);
                break;
            case 'focus-indicators-toggle':
                this.setFocusIndicators(value);
                break;
            case 'skip-links-toggle':
                this.setSkipLinks(value);
                break;
            case 'verbose-descriptions-toggle':
                this.setVerboseDescriptions(value);
                break;
            case 'announce-changes-toggle':
                this.setAnnounceChanges(value);
                break;
            case 'color-scheme':
                this.setColorScheme(value);
                break;
        }
    }

    changeFontSize(change) {
        this.fontSize = Math.max(75, Math.min(150, this.fontSize + change));
        document.documentElement.style.fontSize = `${this.fontSize}%`;
        
        const display = document.getElementById('font-size-display');
        if (display) {
            display.textContent = `${this.fontSize}%`;
        }

        this.announceToScreenReader(`Font size changed to ${this.fontSize}%`);
    }

    setHighContrast(enabled) {
        this.isHighContrast = enabled;
        document.documentElement.classList.toggle('high-contrast', enabled);
        
        const toggle = document.getElementById('high-contrast-toggle');
        if (toggle) {
            toggle.checked = enabled;
        }

        this.announceToScreenReader(`High contrast mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    setReducedMotion(enabled) {
        this.reducedMotion = enabled;
        document.documentElement.classList.toggle('reduce-motion', enabled);
        
        const toggle = document.getElementById('reduce-motion-toggle');
        if (toggle) {
            toggle.checked = enabled;
        }

        this.announceToScreenReader(`Reduced motion ${enabled ? 'enabled' : 'disabled'}`);
    }

    setAnimationsDisabled(disabled) {
        document.documentElement.classList.toggle('disable-animations', disabled);
        this.announceToScreenReader(`Animations ${disabled ? 'disabled' : 'enabled'}`);
    }

    setFocusIndicators(enabled) {
        document.documentElement.classList.toggle('enhanced-focus', enabled);
        this.announceToScreenReader(`Enhanced focus indicators ${enabled ? 'enabled' : 'disabled'}`);
    }

    setSkipLinks(enabled) {
        const skipLinks = document.querySelector('.skip-links');
        if (skipLinks) {
            skipLinks.style.display = enabled ? 'block' : 'none';
        }
    }

    setVerboseDescriptions(enabled) {
        document.documentElement.classList.toggle('verbose-descriptions', enabled);
        if (enabled) {
            this.addVerboseDescriptions();
        }
    }

    setAnnounceChanges(enabled) {
        this.options.announcePageChanges = enabled;
    }

    setColorScheme(scheme) {
        // Remove existing color scheme classes
        document.documentElement.classList.remove(
            'protanopia', 'deuteranopia', 'tritanopia', 'monochrome'
        );
        
        if (scheme !== 'default') {
            document.documentElement.classList.add(scheme);
        }

        this.announceToScreenReader(`Color scheme changed to ${scheme}`);
    }

    addAriaLabels() {
        // Add labels to buttons without labels
        document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(button => {
            const text = button.textContent.trim() || button.title;
            if (text) {
                button.setAttribute('aria-label', text);
            }
        });

        // Add labels to links without descriptive text
        document.querySelectorAll('a:not([aria-label]):not([aria-labelledby])').forEach(link => {
            const text = link.textContent.trim();
            if (!text || text.length < 3) {
                const title = link.title || link.href;
                if (title) {
                    link.setAttribute('aria-label', title);
                }
            }
        });

        // Add labels to form controls
        document.querySelectorAll('input, select, textarea').forEach(input => {
            if (!input.labels || input.labels.length === 0) {
                const label = input.getAttribute('placeholder') || input.name || input.id;
                if (label && !input.getAttribute('aria-label')) {
                    input.setAttribute('aria-label', label);
                }
            }
        });
    }

    enhanceFormLabels() {
        // Mark required fields
        document.querySelectorAll('input[required], select[required], textarea[required]').forEach(input => {
            const label = input.labels && input.labels[0];
            if (label && !label.querySelector('.required-indicator')) {
                label.insertAdjacentHTML('beforeend', '<span class="required-indicator" aria-label="required">*</span>');
            }
        });

        // Add error states
        document.querySelectorAll('.error input, input.error').forEach(input => {
            input.setAttribute('aria-invalid', 'true');
            const errorMsg = input.parentNode.querySelector('.error-message');
            if (errorMsg && !input.getAttribute('aria-describedby')) {
                const errorId = `error-${input.id || Date.now()}`;
                errorMsg.id = errorId;
                input.setAttribute('aria-describedby', errorId);
            }
        });
    }

    addLandmarkRoles() {
        // Add main landmark
        const main = document.querySelector('main');
        if (main && !main.getAttribute('role')) {
            main.setAttribute('role', 'main');
        }

        // Add navigation landmarks
        document.querySelectorAll('nav').forEach(nav => {
            if (!nav.getAttribute('role')) {
                nav.setAttribute('role', 'navigation');
            }
        });

        // Add banner and contentinfo roles
        const header = document.querySelector('header');
        if (header && !header.getAttribute('role')) {
            header.setAttribute('role', 'banner');
        }

        const footer = document.querySelector('footer');
        if (footer && !footer.getAttribute('role')) {
            footer.setAttribute('role', 'contentinfo');
        }
    }

    setupLiveRegions() {
        // Existing live regions are created in createAccessibilityPanel
        
        // Monitor form validation messages
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    const target = mutation.target;
                    if (target.classList && target.classList.contains('error-message')) {
                        this.announceToScreenReader(target.textContent, 'assertive');
                    }
                }
            });
        });

        // Observe form error messages
        document.querySelectorAll('.error-message, .form-message').forEach(element => {
            observer.observe(element, {
                childList: true,
                characterData: true,
                subtree: true
            });
        });
    }

    addVerboseDescriptions() {
        // Add detailed descriptions to interactive elements
        document.querySelectorAll('button, a, [role="button"]').forEach(element => {
            if (!element.getAttribute('aria-describedby')) {
                const description = this.generateVerboseDescription(element);
                if (description) {
                    const descId = `desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    const descElement = document.createElement('span');
                    descElement.id = descId;
                    descElement.className = 'sr-only';
                    descElement.textContent = description;
                    element.parentNode.insertBefore(descElement, element.nextSibling);
                    element.setAttribute('aria-describedby', descId);
                }
            }
        });
    }

    generateVerboseDescription(element) {
        const tag = element.tagName.toLowerCase();
        const role = element.getAttribute('role') || tag;
        const text = element.textContent.trim();
        const href = element.getAttribute('href');
        
        let description = '';
        
        if (tag === 'a' && href) {
            if (href.startsWith('http')) {
                description = `External link to ${href}`;
            } else if (href.startsWith('mailto:')) {
                description = `Email link to ${href.replace('mailto:', '')}`;
            } else {
                description = `Internal link`;
            }
        } else if (role === 'button') {
            description = 'Button';
            if (element.type === 'submit') {
                description += ' to submit form';
            }
        }
        
        return description;
    }

    handleTabNavigation(e) {
        // Enhanced tab navigation logic
        this.trackFocus(e.target);
    }

    handleArrowNavigation(e) {
        // Handle arrow key navigation in grids, lists, and menus
        const currentElement = e.target;
        const parent = currentElement.closest('[role="grid"], [role="listbox"], [role="menu"], .card-grid');
        
        if (parent) {
            e.preventDefault();
            this.navigateWithArrows(currentElement, parent, e.key);
        }
    }

    navigateWithArrows(currentElement, container, key) {
        const focusableElements = container.querySelectorAll('[tabindex]:not([tabindex="-1"]), button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
        const elementArray = Array.from(focusableElements);
        const currentIndex = elementArray.indexOf(currentElement);
        
        let nextIndex;
        
        switch (key) {
            case 'ArrowRight':
            case 'ArrowDown':
                nextIndex = (currentIndex + 1) % elementArray.length;
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                nextIndex = (currentIndex - 1 + elementArray.length) % elementArray.length;
                break;
        }
        
        if (nextIndex !== undefined && elementArray[nextIndex]) {
            elementArray[nextIndex].focus();
        }
    }

    enhanceKeyboardNavigation() {
        // Make cards focusable and navigable
        document.querySelectorAll('.card, .feature-card').forEach(card => {
            if (!card.getAttribute('tabindex')) {
                card.setAttribute('tabindex', '0');
                card.setAttribute('role', 'article');
            }
            
            // Add keyboard activation
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const link = card.querySelector('a');
                    if (link) {
                        link.click();
                    }
                }
            });
        });
    }

    trackFocus(element) {
        // Track focus history for better navigation
        if (this.focusHistory.length > 10) {
            this.focusHistory.shift();
        }
        
        this.focusHistory.push(element);
        this.currentFocusIndex = this.focusHistory.length - 1;
    }

    trapFocusInModal(e) {
        const modal = document.querySelector('.modal.active, .notification-center.active, .accessibility-panel[aria-hidden="false"]');
        if (!modal) return;

        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }

    toggleAccessibilityPanel() {
        if (this.isPanelOpen()) {
            this.closeAccessibilityPanel();
        } else {
            this.openAccessibilityPanel();
        }
    }

    openAccessibilityPanel() {
        this.elements.panel.setAttribute('aria-hidden', 'false');
        this.elements.panel.classList.add('active');
        
        // Focus first interactive element
        const firstInput = this.elements.panel.querySelector('input, button, select');
        if (firstInput) {
            firstInput.focus();
        }

        this.announceToScreenReader('Accessibility settings panel opened');
    }

    closeAccessibilityPanel() {
        this.elements.panel.setAttribute('aria-hidden', 'true');
        this.elements.panel.classList.remove('active');
        
        // Return focus to toggle button
        this.elements.toggle.focus();

        this.announceToScreenReader('Accessibility settings panel closed');
    }

    isPanelOpen() {
        return this.elements.panel.getAttribute('aria-hidden') === 'false';
    }

    skipToMainContent() {
        const mainContent = document.querySelector(this.options.skipLinkTarget);
        if (mainContent) {
            mainContent.focus();
            mainContent.scrollIntoView({ behavior: 'smooth' });
            this.announceToScreenReader('Skipped to main content');
        }
    }

    observePageChanges() {
        if (!this.options.announcePageChanges) return;

        // Observe title changes
        const titleObserver = new MutationObserver(() => {
            this.announceToScreenReader(`Page title changed to: ${document.title}`);
        });

        titleObserver.observe(document.querySelector('title'), {
            childList: true,
            characterData: true
        });

        // Observe main content changes
        const mainContent = document.querySelector('main, #main-content');
        if (mainContent) {
            const contentObserver = new MutationObserver((mutations) => {
                let hasSignificantChange = false;
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        hasSignificantChange = true;
                    }
                });
                
                if (hasSignificantChange) {
                    this.announceToScreenReader('Page content has been updated');
                }
            });

            contentObserver.observe(mainContent, {
                childList: true,
                subtree: true
            });
        }
    }

    announceToScreenReader(message, priority = 'polite') {
        const container = priority === 'assertive' ? 
            this.elements.announcementsAssertive : 
            this.elements.announcements;
            
        if (container) {
            container.textContent = message;
            
            // Clear after announcement
            setTimeout(() => {
                container.textContent = '';
            }, 1000);
        }
    }

    saveUserPreferences() {
        const preferences = {
            fontSize: this.fontSize,
            highContrast: this.isHighContrast,
            reducedMotion: this.reducedMotion,
            colorScheme: document.documentElement.className.match(/(?:protanopia|deuteranopia|tritanopia|monochrome)/)?.[0] || 'default'
        };

        localStorage.setItem('a11y-preferences', JSON.stringify(preferences));
        this.announceToScreenReader('Accessibility preferences saved');
    }

    loadUserPreferences() {
        const saved = localStorage.getItem('a11y-preferences');
        if (saved) {
            try {
                const preferences = JSON.parse(saved);
                
                if (preferences.fontSize) {
                    this.fontSize = preferences.fontSize;
                    this.changeFontSize(0); // Apply without change
                }
                
                if (preferences.highContrast) {
                    this.setHighContrast(true);
                }
                
                if (preferences.reducedMotion) {
                    this.setReducedMotion(true);
                }
                
                if (preferences.colorScheme && preferences.colorScheme !== 'default') {
                    this.setColorScheme(preferences.colorScheme);
                }
                
            } catch (error) {
                console.error('Failed to load accessibility preferences:', error);
            }
        }
    }

    resetSettings() {
        this.fontSize = 100;
        this.changeFontSize(0);
        this.setHighContrast(false);
        this.setReducedMotion(false);
        this.setColorScheme('default');
        
        localStorage.removeItem('a11y-preferences');
        this.announceToScreenReader('Accessibility settings reset to default');
    }

    destroy() {
        // Remove created elements
        const elementsToRemove = [
            '#accessibility-panel',
            '#accessibility-toggle',
            '#sr-announcements',
            '#sr-announcements-assertive',
            '.skip-links'
        ];

        elementsToRemove.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.remove();
            }
        });

        // Remove classes
        document.documentElement.classList.remove(
            'high-contrast',
            'reduce-motion',
            'disable-animations',
            'enhanced-focus',
            'verbose-descriptions',
            'protanopia',
            'deuteranopia',
            'tritanopia',
            'monochrome'
        );

        // Reset font size
        document.documentElement.style.fontSize = '';
    }
}

// Auto-initialize accessibility enhancements
document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityEnhancer = new AccessibilityEnhancer();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityEnhancer;
}
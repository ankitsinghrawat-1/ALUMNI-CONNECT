// client/js/login.js
// Enhanced login functionality with advanced features

class LoginManager {
    constructor() {
        this.form = document.getElementById('login-form');
        this.messageDiv = document.getElementById('message');
        this.loginBtn = document.getElementById('login-btn');
        this.passwordToggle = document.getElementById('password-toggle');
        this.rememberCheckbox = document.getElementById('remember');
        this.isLoading = false;
        
        this.init();
    }

    init() {
        if (!this.form) {
            console.error("Error: The login form element with ID 'login-form' was not found.");
            return;
        }

        // Check if already logged in
        this.checkExistingSession();
        
        // Setup form validation
        this.setupValidation();
        
        // Setup password toggle
        this.setupPasswordToggle();
        
        // Setup form submission
        this.setupFormSubmission();
        
        // Setup social login
        this.setupSocialLogin();
        
        // Setup remember me functionality
        this.setupRememberMe();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    checkExistingSession() {
        const token = localStorage.getItem('alumniConnectToken');
        if (token) {
            const userRole = localStorage.getItem('userRole');
            this.redirectToDashboard(userRole);
            return;
        }
    }

    redirectToDashboard(userRole) {
        const dashboardMap = {
            'admin': 'admin.html',
            'student': 'student-dashboard.html',
            'faculty': 'faculty-dashboard.html',
            'employer': 'employer-dashboard.html',
            'institute': 'institute-dashboard.html'
        };
        
        window.location.href = dashboardMap[userRole] || 'dashboard.html';
    }

    setupValidation() {
        const validationRules = {
            email: {
                required: true,
                email: true
            },
            password: {
                required: true,
                minLength: 6
            }
        };
        
        this.validator = new FormValidator(this.form, validationRules);
        this.validator.onSuccess = () => this.handleFormSubmission();
    }

    setupPasswordToggle() {
        if (this.passwordToggle) {
            const passwordInput = document.getElementById('password');
            
            this.passwordToggle.addEventListener('click', () => {
                const isPassword = passwordInput.type === 'password';
                passwordInput.type = isPassword ? 'text' : 'password';
                
                const icon = this.passwordToggle.querySelector('i');
                icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
                
                this.passwordToggle.setAttribute('aria-label', 
                    isPassword ? 'Hide password' : 'Show password'
                );
            });
        }
    }

    setupFormSubmission() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (this.isLoading) return;
            
            // Trigger validation
            if (!this.validator.validateForm()) {
                return;
            }
            
            await this.handleFormSubmission();
        });
    }

    async handleFormSubmission() {
        try {
            this.setLoadingState(true);
            this.hideMessage();

            // Get values directly from form elements
            const emailInput = this.form.querySelector('#email');
            const passwordInput = this.form.querySelector('#password');
            const rememberInput = this.form.querySelector('#remember');
            
            const email = emailInput ? emailInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value.trim() : '';
            const remember = rememberInput ? rememberInput.checked : false;

            if (!email || !password) {
                throw new Error('Please enter both email and password.');
            }

            // Simulate network delay for better UX
            await new Promise(resolve => setTimeout(resolve, 500));

            const response = await window.api.post('/users/login', {
                email,
                password
            });

            if (response.token) {
                this.handleLoginSuccess(response, remember);
            } else {
                throw new Error(response.message || 'Login failed');
            }

        } catch (error) {
            this.handleLoginError(error);
        } finally {
            this.setLoadingState(false);
        }
    }

    handleLoginSuccess(response, remember) {
        // Store authentication data
        localStorage.setItem('alumniConnectToken', response.token);
        localStorage.setItem('userRole', response.role);
        localStorage.setItem('userEmail', response.email);
        localStorage.setItem('userId', response.user_id);
        localStorage.setItem('fullName', response.full_name);

        // Handle remember me
        if (remember) {
            localStorage.setItem('rememberLogin', 'true');
            // Set extended expiration
            const expirationDate = new Date();
            expirationDate.setTime(expirationDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
            localStorage.setItem('loginExpiration', expirationDate.getTime());
        }

        this.showMessage('Login successful! Redirecting...', 'success');
        
        // Show success toast
        if (window.toastManager) {
            window.toastManager.show(`Welcome back, ${response.full_name}!`, 'success');
        }

        // Redirect after short delay
        setTimeout(() => {
            this.redirectToDashboard(response.role);
        }, 1500);
    }

    handleLoginError(error) {
        console.error('Login error:', error);
        
        let errorMessage = 'An error occurred during login.';
        
        if (error.message) {
            errorMessage = error.message;
        }
        
        // Handle specific error types
        if (error.message?.includes('Invalid email or password')) {
            errorMessage = 'Invalid email or password. Please try again.';
            this.shakeForm();
        } else if (error.message?.includes('Account not verified')) {
            errorMessage = 'Please verify your email address before logging in.';
        } else if (error.message?.includes('Account suspended')) {
            errorMessage = 'Your account has been suspended. Please contact support.';
        }

        this.showMessage(errorMessage, 'error');
        
        // Show error toast
        if (window.toastManager) {
            window.toastManager.show(errorMessage, 'error');
        }
    }

    setupSocialLogin() {
        const googleBtn = document.querySelector('.google-btn');
        const linkedinBtn = document.querySelector('.linkedin-btn');

        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.handleSocialLogin('google'));
        }

        if (linkedinBtn) {
            linkedinBtn.addEventListener('click', () => this.handleSocialLogin('linkedin'));
        }
    }

    async handleSocialLogin(provider) {
        try {
            if (window.toastManager) {
                window.toastManager.show(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login coming soon!`, 'info');
            }
            
            // TODO: Implement OAuth flow
            console.log(`Initiating ${provider} login...`);
            
        } catch (error) {
            console.error(`${provider} login error:`, error);
            if (window.toastManager) {
                window.toastManager.show(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login failed. Please try again.`, 'error');
            }
        }
    }

    setupRememberMe() {
        // Check if user should be remembered
        const rememberLogin = localStorage.getItem('rememberLogin');
        const loginExpiration = localStorage.getItem('loginExpiration');
        
        if (rememberLogin === 'true' && loginExpiration) {
            const expirationDate = new Date(parseInt(loginExpiration));
            if (new Date() < expirationDate) {
                // Auto-fill remember me checkbox
                if (this.rememberCheckbox) {
                    this.rememberCheckbox.checked = true;
                }
            } else {
                // Clear expired remember me data
                localStorage.removeItem('rememberLogin');
                localStorage.removeItem('loginExpiration');
            }
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to submit form
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (!this.isLoading) {
                    this.form.dispatchEvent(new Event('submit'));
                }
            }
        });
    }

    setLoadingState(loading) {
        this.isLoading = loading;
        
        if (loading) {
            this.loginBtn.classList.add('loading');
            this.loginBtn.disabled = true;
        } else {
            this.loginBtn.classList.remove('loading');
            this.loginBtn.disabled = false;
        }

        // Disable all form inputs during loading
        const inputs = this.form.querySelectorAll('input, button');
        inputs.forEach(input => {
            if (loading) {
                input.disabled = true;
            } else {
                input.disabled = false;
            }
        });
    }

    showMessage(message, type = 'info') {
        if (this.messageDiv) {
            this.messageDiv.textContent = message;
            this.messageDiv.className = `form-message ${type}`;
            this.messageDiv.style.display = 'block';
            
            // Auto-hide success messages
            if (type === 'success') {
                setTimeout(() => this.hideMessage(), 5000);
            }
        }
    }

    hideMessage() {
        if (this.messageDiv) {
            this.messageDiv.style.display = 'none';
            this.messageDiv.textContent = '';
            this.messageDiv.className = 'form-message';
        }
    }

    shakeForm() {
        this.form.classList.add('animate-shake');
        setTimeout(() => {
            this.form.classList.remove('animate-shake');
        }, 500);
    }
}

// Initialize enhanced login functionality
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});
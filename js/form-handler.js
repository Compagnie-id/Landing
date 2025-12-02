/**
 * Form Submission Handler for Tawazn Time Capsule
 * Integrates with Google Sheets via Google Apps Script
 */

class FormHandler {
    constructor() {
        this.config = window.APP_CONFIG;
        this.form = document.getElementById('capsuleForm');
        this.waitlistForm = document.getElementById('waitlistForm');
        this.successModal = document.getElementById('successModal');

        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleTimeCapsuleSubmit(e));
        }

        if (this.waitlistForm) {
            this.waitlistForm.addEventListener('submit', (e) => this.handleWaitlistSubmit(e));
        }

        // Check rate limiting on page load
        this.checkAndUpdateRateLimitDisplay();
    }

    async handleTimeCapsuleSubmit(e) {
        e.preventDefault();

        // Check rate limit first
        if (!this.canSubmit()) {
            this.showRateLimitError();
            return;
        }

        const submitButton = this.form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;

        try {
            // Show loading state
            this.setLoading(submitButton, '📤 Sending...');
            this.disableForm(this.form, true);

            // Get form data
            const formData = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                resolution: document.getElementById('resolution').value.trim(),
                type: 'timecapsule',
                timestamp: new Date().toISOString(),
                deliveryDate: this.config?.DELIVERY_DATE || '2027-01-01'
            };

            // Validate form data
            if (!this.validateFormData(formData)) {
                throw new Error('Please fill in all required fields correctly.');
            }

            // Submit to Google Script
            const response = await this.submitToGoogleScript(formData);

            if (response.success) {
                // Record this submission for rate limiting
                this.recordSubmission();

                this.showSuccess(formData);
                this.form.reset();
            } else {
                // Use the error type from the response if available
                const errorType = response.errorType || 'serverError';
                this.showError(response.error || 'Failed to submit form. Please try again.', errorType);
            }

        } catch (error) {
            console.error('Form submission error:', error);

            // Determine error type for catch block
            let errorType = 'unknownError';
            if (error.message && error.message.includes('fetch')) {
                errorType = 'networkError';
            } else if (error.message && error.message.includes('NetworkError')) {
                errorType = 'networkError';
            }

            this.showError(error.message || 'An unexpected error occurred.', errorType);
        } finally {
            // Reset button state
            this.setLoading(submitButton, originalText);
            this.disableForm(this.form, false);
        }
    }

    async handleWaitlistSubmit(e) {
        e.preventDefault();

        // Check rate limit first
        if (!this.canSubmit()) {
            this.showRateLimitError();
            return;
        }

        const submitButton = this.waitlistForm.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        const emailInput = this.waitlistForm.querySelector('input[type="email"]');

        try {
            // Show loading state
            this.setLoading(submitButton, '📤 Adding...');

            // Get email data
            const formData = {
                email: emailInput.value.trim(),
                type: 'waitlist',
                timestamp: new Date().toISOString()
            };

            // Validate email
            if (!this.validateEmail(formData.email)) {
                throw new Error('Please enter a valid email address.');
            }

            // Submit to Google Script
            const response = await this.submitToGoogleScript(formData);

            if (response.success) {
                // Record this submission for rate limiting
                this.recordSubmission();

                this.showWaitlistSuccess(this.waitlistForm);
            } else {
                // Use the error type from the response if available
                const errorType = response.errorType || 'serverError';
                this.showError(response.error || 'Failed to join waitlist. Please try again.', errorType);
            }

        } catch (error) {
            console.error('Waitlist submission error:', error);

            // Determine error type for catch block
            let errorType = 'unknownError';
            if (error.message && error.message.includes('fetch')) {
                errorType = 'networkError';
            } else if (error.message && error.message.includes('NetworkError')) {
                errorType = 'networkError';
            }

            this.showError(error.message || 'An unexpected error occurred.', errorType);
            this.setLoading(submitButton, originalText);
        }
    }

    async submitToGoogleScript(data) {
        if (!this.config?.GOOGLE_SCRIPT_URL) {
            console.warn('Google Script URL not configured. Using fallback mode.');
           return { success: true, message: 'Data logged (development mode)' };
        }

        try {
            const response = await fetch(this.config.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Google Apps Script requires no-cors mode
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            // With no-cors mode, we can't read the response directly
            // We assume success if no error is thrown
            return { success: true, message: 'Form submitted successfully' };

        } catch (error) {
            console.error('Google Script submission error:', error);
            return {
                success: false,
                error: 'Network error. Please check your connection and try again.'
            };
        }
    }

    validateFormData(data) {
        if (!data.name || data.name.length < 2) {
            this.showError('Please enter your name (at least 2 characters).', 'validationError');
            return false;
        }

        if (!this.validateEmail(data.email)) {
            this.showError('Please enter a valid email address.', 'validationError');
            return false;
        }

        if (!data.resolution || data.resolution.length < 10) {
            this.showError('Please write a more detailed resolution (at least 10 characters).', 'validationError');
            return false;
        }

        return true;
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async submitToGoogleScript(data) {
        if (!this.config?.GOOGLE_SCRIPT_URL) {
            console.warn('Google Script URL not configured. Using fallback mode.');
           return { success: true, message: 'Data logged (development mode)' };
        }

        try {
            const response = await fetch(this.config.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Google Apps Script requires no-cors mode
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            // With no-cors mode, we can't read the response directly
            // We assume success if no error is thrown
            return { success: true, message: 'Form submitted successfully' };

        } catch (error) {
            console.error('Google Script submission error:', error);

            // Determine error type based on error message
            let errorType = 'serverError';
            if (error.message && error.message.includes('fetch')) {
                errorType = 'networkError';
            } else if (error.message && error.message.includes('Failed to fetch')) {
                errorType = 'networkError';
            } else if (error.message && error.message.includes('NetworkError')) {
                errorType = 'networkError';
            }

            return {
                success: false,
                error: this.getErrorMessage(errorType),
                errorType: errorType
            };
        }
    }

    getErrorMessage(errorType) {
        const i18n = window.i18n;

        if (i18n && i18n.t) {
            return i18n.t(`errorModal.${errorType}`) || i18n.t('errorModal.unknownError');
        }

        // Fallback English messages
        const fallbackMessages = {
            networkError: 'Network error. Please check your connection and try again.',
            validationError: 'Please fill in all required fields correctly.',
            rateLimitError: 'Too many submission attempts. Please try again later.',
            serverError: 'Server error. Please try again in a few moments.',
            unknownError: 'Something went wrong. Please try again.'
        };

        return fallbackMessages[errorType] || fallbackMessages.unknownError;
    }

    setLoading(button, text) {
        button.innerHTML = text;
        button.disabled = true;
    }

    disableForm(form, disabled) {
        const inputs = form.querySelectorAll('input, textarea, button');
        inputs.forEach(input => {
            input.disabled = disabled;
        });
    }

    showSuccess(data) {
        if (this.successModal) {
            // Update modal with personalized content
            const modalMessage = this.successModal.querySelector('.modal-message');
            const modalDate = this.successModal.querySelector('.modal-date strong');

            if (modalMessage) {
                modalMessage.textContent = `Your resolution is safely stored, ${data.name}! We'll send it back with your Tawazn journey summary.`;
            }

            if (modalDate && this.config?.DELIVERY_DATE) {
                const date = new Date(this.config.DELIVERY_DATE);
                modalDate.textContent = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }

            this.successModal.classList.add('active');
        }
        
    }

    showWaitlistSuccess(form) {
        const container = form.parentElement;
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--neu-yellow);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
                <h3 style="font-size: 1.5rem; font-weight: 900; margin-bottom: 0.5rem;">You're on the list!</h3>
                <p style="font-weight: 600;">We'll notify you when Tawazn launches.</p>
            </div>
        `;

        console.log('✅ Waitlist submission successful');
    }

    // ========== RATE LIMITING METHODS ==========

    /**
     * Check if user can submit based on rate limiting
     */
    canSubmit() {
        if (!this.config?.RATE_LIMIT) {
            return true; // Rate limiting disabled
        }

        const attempts = this.getSubmissionAttempts();
        const maxAttempts = this.config.RATE_LIMIT.MAX_ATTEMPTS_PER_HOUR;
        const windowHours = this.config.RATE_LIMIT.ATTEMPT_WINDOW_HOURS;
        const now = Date.now();
        const windowStart = now - (windowHours * 60 * 60 * 1000);

        // Filter attempts within the time window
        const recentAttempts = attempts.filter(timestamp => timestamp > windowStart);

        return recentAttempts.length < maxAttempts;
    }

    /**
     * Record a submission attempt
     */
    recordSubmission() {
        if (!this.config?.RATE_LIMIT) {
            return; // Rate limiting disabled
        }

        const attempts = this.getSubmissionAttempts();
        attempts.push(Date.now());

        // Keep only attempts within the time window
        const windowHours = this.config.RATE_LIMIT.ATTEMPT_WINDOW_HOURS;
        const now = Date.now();
        const windowStart = now - (windowHours * 60 * 60 * 1000);

        const recentAttempts = attempts.filter(timestamp => timestamp > windowStart);

        // Save back to storage
        this.saveSubmissionAttempts(recentAttempts);

        // Update display
        this.checkAndUpdateRateLimitDisplay();
    }

    /**
     * Get all submission attempts from local storage
     */
    getSubmissionAttempts() {
        if (!this.config?.RATE_LIMIT) {
            return [];
        }

        try {
            const stored = localStorage.getItem(this.config.RATE_LIMIT.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error reading submission attempts:', error);
            return [];
        }
    }

    /**
     * Save submission attempts to local storage
     */
    saveSubmissionAttempts(attempts) {
        if (!this.config?.RATE_LIMIT) {
            return;
        }

        try {
            localStorage.setItem(this.config.RATE_LIMIT.STORAGE_KEY, JSON.stringify(attempts));
        } catch (error) {
            console.error('Error saving submission attempts:', error);
        }
    }

    /**
     * Show rate limit error message
     */
    showRateLimitError() {
        const message = this.config?.RATE_LIMIT?.BLOCK_MESSAGE || 'Too many submission attempts. Please try again later.';
        this.showError(message, 'rateLimitError');

        // Update form button to show rate limit status
        if (this.form) {
            const submitButton = this.form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.textContent = '⏱️ Rate Limited';
                submitButton.disabled = true;
            }
        }

        if (this.waitlistForm) {
            const submitButton = this.waitlistForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.textContent = '⏱️ Rate Limited';
                submitButton.disabled = true;
            }
        }
    }

    /**
     * Check and update rate limit display on forms
     */
    checkAndUpdateRateLimitDisplay() {
        if (!this.config?.RATE_LIMIT) {
            return;
        }

        const attempts = this.getSubmissionAttempts();
        const maxAttempts = this.config.RATE_LIMIT.MAX_ATTEMPTS_PER_HOUR;
        const windowHours = this.config.RATE_LIMIT.ATTEMPT_WINDOW_HOURS;
        const now = Date.now();
        const windowStart = now - (windowHours * 60 * 60 * 1000);

        // Filter attempts within the time window
        const recentAttempts = attempts.filter(timestamp => timestamp > windowStart);
        const remainingAttempts = Math.max(0, maxAttempts - recentAttempts.length);

        // Update form buttons and displays
        this.updateRateLimitDisplay(remainingAttempts, maxAttempts);

        // Calculate when attempts reset
        if (recentAttempts.length > 0 && remainingAttempts === 0) {
            const oldestAttempt = Math.min(...recentAttempts);
            const resetTime = oldestAttempt + (windowHours * 60 * 60 * 1000);
            this.scheduleRateLimitReset(resetTime);
        }
    }

    /**
     * Update rate limit display on form buttons
     */
    updateRateLimitDisplay(remaining, max) {
        const isLimited = remaining === 0;

        // Update time capsule form
        if (this.form) {
            const submitButton = this.form.querySelector('button[type="submit"]');
            if (submitButton) {
                if (isLimited) {
                    submitButton.textContent = '⏱️ Rate Limited';
                    submitButton.disabled = true;
                } else {
                    submitButton.disabled = false;
                    // Don't change the button text if it's not rate limited
                    // (let it show the original submit text)
                }
            }

            // Add or update rate limit indicator
            this.addRateLimitIndicator(this.form, remaining, max);
        }

        // Update waitlist form
        if (this.waitlistForm) {
            const submitButton = this.waitlistForm.querySelector('button[type="submit"]');
            if (submitButton) {
                if (isLimited) {
                    submitButton.textContent = '⏱️ Rate Limited';
                    submitButton.disabled = true;
                } else {
                    submitButton.disabled = false;
                }
            }

            // Add or update rate limit indicator
            this.addRateLimitIndicator(this.waitlistForm, remaining, max);
        }
    }

    /**
     * Add rate limit indicator to form
     */
    addRateLimitIndicator(form, remaining, max) {
        // Remove existing indicator
        const existing = form.querySelector('.rate-limit-indicator');
        if (existing) {
            existing.remove();
        }

        // Only show indicator if attempts are being used
        const attempts = max - remaining;
        if (attempts === 0) {
            return; // Don't show indicator if no attempts made
        }

        const indicator = document.createElement('div');
        indicator.className = 'rate-limit-indicator';
        indicator.style.cssText = `
            font-size: 0.75rem;
            font-weight: 600;
            text-align: center;
            margin-top: 0.75rem;
            padding: 0.5rem;
            border-radius: 4px;
            color: ${remaining === 0 ? 'var(--error)' : 'var(--text-secondary-light)'};
            background: ${remaining === 0 ? 'var(--neu-red)' : 'var(--background-light)'};
            border: 2px solid var(--neu-black);
        `;

        indicator.textContent = remaining === 0
            ? '⏱️ Rate limit reached. Try again in an hour.'
            : `📝 ${attempts}/${max} submissions used (${remaining} remaining)`;

        form.appendChild(indicator);
    }

    /**
     * Schedule rate limit reset
     */
    scheduleRateLimitReset(resetTime) {
        const now = Date.now();
        const delay = Math.max(0, resetTime - now);

        if (delay <= 0) {
            // Reset immediately
            this.resetRateLimit();
            return;
        }

        // Clear any existing timeout
        if (this.resetTimeout) {
            clearTimeout(this.resetTimeout);
        }

        // Schedule reset
        this.resetTimeout = setTimeout(() => {
            this.resetRateLimit();
        }, delay);
    }

    /**
     * Reset rate limiting
     */
    resetRateLimit() {
        if (!this.config?.RATE_LIMIT) {
            return;
        }

        // Clear attempts from storage
        localStorage.removeItem(this.config.RATE_LIMIT.STORAGE_KEY);

        // Update displays
        this.checkAndUpdateRateLimitDisplay();

        // Re-enable form buttons
        if (this.form) {
            const submitButton = this.form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = false;
            }
        }

        if (this.waitlistForm) {
            const submitButton = this.waitlistForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = false;
            }
        }

        console.log('Rate limit reset');
    }

    /**
     * Get next reset time for display
     */
    getNextResetTime() {
        if (!this.config?.RATE_LIMIT) {
            return null;
        }

        const attempts = this.getSubmissionAttempts();
        const windowHours = this.config.RATE_LIMIT.ATTEMPT_WINDOW_HOURS;
        const now = Date.now();
        const windowStart = now - (windowHours * 60 * 60 * 1000);

        // Filter attempts within the time window
        const recentAttempts = attempts.filter(timestamp => timestamp > windowStart);

        if (recentAttempts.length === 0) {
            return null;
        }

        const oldestAttempt = Math.min(...recentAttempts);
        return oldestAttempt + (windowHours * 60 * 60 * 1000);
    }

    showError(message, errorType = 'unknownError') {
        // Check if i18n is available
        const i18n = window.i18n;

        // Get translated error message if i18n is available
        let errorMessage = message;
        if (i18n && i18n.t) {
            errorMessage = i18n.t(`errorModal.${errorType}`) || message;
        }

        // Update error modal content
        const errorModal = document.getElementById('errorModal');
        const errorMessageElement = document.getElementById('errorMessage');

        if (errorModal && errorMessageElement) {
            errorMessageElement.textContent = errorMessage;

            // Update modal title if i18n is available
            const modalTitle = errorModal.querySelector('.modal-title');
            if (modalTitle && i18n && i18n.t) {
                modalTitle.textContent = i18n.t('errorModal.title');
            }

            // Update button text if i18n is available
            const modalButton = errorModal.querySelector('.btn');
            if (modalButton && i18n && i18n.t) {
                modalButton.textContent = i18n.t('errorModal.tryAgain');
            }

            // Show error modal
            errorModal.classList.add('active');
        } else {
            // Fallback to console error if modal is not available
            console.error('❌ Form Error:', errorMessage);

            // Create inline error as fallback
            this.createInlineError(errorMessage);
        }
    }

    createInlineError(message) {
        // Create or update error message
        let errorDiv = document.querySelector('.form-error');

        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            errorDiv.style.cssText = `
                background: var(--neu-red);
                color: white;
                padding: 1rem;
                margin: 1rem 0;
                border: 2px solid var(--neu-black);
                font-weight: 600;
                font-size: 0.9rem;
            `;

            // Insert after the form
            if (this.form) {
                this.form.parentNode.insertBefore(errorDiv, this.form.nextSibling);
            }
        }

        errorDiv.textContent = message;
        errorDiv.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }, 5000);
    }
}

// Initialize form handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for config to be available
    if (window.APP_CONFIG) {
        window.formHandler = new FormHandler();
    } else {
        // Fallback: wait a bit and retry
        setTimeout(() => {
            window.formHandler = new FormHandler();
        }, 100);
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormHandler;
}
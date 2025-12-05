/**
 * Forgot Password Manager
 * Handles the complete forgot password flow with OTP verification
 */

class ForgotPasswordManager {
    constructor() {
        this.modal = document.getElementById('forgot-password-modal');
        this.currentStep = 1;
        this.identifier = '';
        this.resetToken = '';
        this.otpTimer = null;
        this.resendTimer = null;
        this.otpExpiryTime = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupOTPInputs();
        this.setupPasswordValidation();
    }

    setupEventListeners() {
        // Open modal
        const forgotLink = document.getElementById('forgot-password-link');
        if (forgotLink) {
            forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal();
            });
        }

        // Close modal buttons
        ['close-modal', 'close-modal-2', 'close-modal-3', 'close-modal-success'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => this.closeModal());
            }
        });

        // Close on overlay click
        const overlay = this.modal?.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.closeModal());
        }

        // Back buttons
        document.getElementById('back-to-login')?.addEventListener('click', () => this.closeModal());
        document.getElementById('back-to-step-1')?.addEventListener('click', () => this.goToStep(1));
        document.getElementById('back-to-step-2')?.addEventListener('click', () => this.goToStep(2));

        // Form submissions
        document.getElementById('forgot-password-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSendCode();
        });

        document.getElementById('verify-otp-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleVerifyOTP();
        });

        document.getElementById('reset-password-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleResetPassword();
        });

        // Resend OTP
        document.getElementById('resend-otp')?.addEventListener('click', () => this.handleResendOTP());

        // Go to login from success
        document.getElementById('go-to-login')?.addEventListener('click', () => this.closeModal());

        // Password toggle
        document.getElementById('toggle-new-password')?.addEventListener('click', () => {
            const input = document.getElementById('new-password');
            const eyeOpen = document.querySelector('#toggle-new-password .eye-open');
            const eyeClosed = document.querySelector('#toggle-new-password .eye-closed');

            if (input.type === 'password') {
                input.type = 'text';
                eyeOpen.style.display = 'none';
                eyeClosed.style.display = 'inline';
            } else {
                input.type = 'password';
                eyeOpen.style.display = 'inline';
                eyeClosed.style.display = 'none';
            }
        });
    }

    setupOTPInputs() {
        const inputs = document.querySelectorAll('.otp-input');

        inputs.forEach((input, index) => {
            // Auto-focus next input
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }

                // Mark as filled
                if (e.target.value) {
                    e.target.classList.add('filled');
                } else {
                    e.target.classList.remove('filled');
                }
            });

            // Handle backspace
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });

            // Only allow numbers
            input.addEventListener('keypress', (e) => {
                if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                }
            });

            // Handle paste
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text').slice(0, 6);

                if (/^\d+$/.test(pastedData)) {
                    pastedData.split('').forEach((char, i) => {
                        if (inputs[i]) {
                            inputs[i].value = char;
                            inputs[i].classList.add('filled');
                        }
                    });

                    if (pastedData.length < 6) {
                        inputs[pastedData.length].focus();
                    }
                }
            });
        });
    }

    setupPasswordValidation() {
        const passwordInput = document.getElementById('new-password');
        if (!passwordInput) return;

        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            this.validatePassword(password);
        });
    }

    validatePassword(password) {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };

        // Update requirement indicators
        document.getElementById('req-length')?.classList.toggle('met', requirements.length);
        document.getElementById('req-uppercase')?.classList.toggle('met', requirements.uppercase);
        document.getElementById('req-lowercase')?.classList.toggle('met', requirements.lowercase);
        document.getElementById('req-number')?.classList.toggle('met', requirements.number);
        document.getElementById('req-special')?.classList.toggle('met', requirements.special);

        // Update strength bars
        const metCount = Object.values(requirements).filter(Boolean).length;
        const bars = document.querySelectorAll('#password-strength-reset .strength-bar');

        bars.forEach((bar, index) => {
            bar.classList.remove('active', 'weak', 'medium', 'strong');

            if (index < metCount) {
                bar.classList.add('active');

                if (metCount <= 2) {
                    bar.classList.add('weak');
                } else if (metCount <= 4) {
                    bar.classList.add('medium');
                } else {
                    bar.classList.add('strong');
                }
            }
        });

        return Object.values(requirements).every(Boolean);
    }

    openModal() {
        this.modal.style.display = 'flex';
        this.goToStep(1);
        this.resetForm();
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.stopTimers();
        this.resetForm();
    }

    goToStep(step) {
        // Hide all steps
        document.querySelectorAll('.modal-step').forEach(s => s.classList.remove('active'));

        // Show target step
        const targetStep = document.getElementById(`step-${step}`);
        if (targetStep) {
            targetStep.classList.add('active');
            this.currentStep = step;
        }
    }

    resetForm() {
        document.getElementById('forgot-password-form')?.reset();
        document.getElementById('verify-otp-form')?.reset();
        document.getElementById('reset-password-form')?.reset();

        // Clear OTP inputs
        document.querySelectorAll('.otp-input').forEach(input => {
            input.value = '';
            input.classList.remove('filled', 'error');
        });

        // Reset password requirements
        document.querySelectorAll('.requirements-list li').forEach(li => {
            li.classList.remove('met');
        });

        // Reset strength bars
        document.querySelectorAll('#password-strength-reset .strength-bar').forEach(bar => {
            bar.classList.remove('active', 'weak', 'medium', 'strong');
        });
    }

    /**
     * Mask email address for privacy
     * Example: user@example.com -> u***@ex*****.com
     */
    maskEmail(email) {
        if (!email || !email.includes('@')) return email;

        const [localPart, domain] = email.split('@');

        // Mask local part (show first 1-2 chars)
        let maskedLocal;
        if (localPart.length <= 2) {
            maskedLocal = localPart[0] + '*';
        } else if (localPart.length <= 4) {
            maskedLocal = localPart[0] + '***';
        } else {
            maskedLocal = localPart.substring(0, 2) + '***';
        }

        // Mask domain (show first 2 chars and TLD)
        const domainParts = domain.split('.');
        let maskedDomain;

        if (domainParts.length >= 2) {
            const domainName = domainParts[0];
            const tld = domainParts.slice(1).join('.');

            if (domainName.length <= 2) {
                maskedDomain = domainName[0] + '*.' + tld;
            } else {
                maskedDomain = domainName.substring(0, 2) + '*****.' + tld;
            }
        } else {
            maskedDomain = domain[0] + '***';
        }

        return maskedLocal + '@' + maskedDomain;
    }

    async handleSendCode() {
        const identifier = document.getElementById('identifier').value.trim();

        if (!identifier) {
            this.showError('Please enter your email or contact number');
            return;
        }

        // Show loading state
        Swal.fire({
            title: 'Sending Code...',
            html: 'Please wait while we send the verification code',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const response = await fetch('php/forgot-password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier })
            });

            const data = await response.json();

            if (data.success) {
                this.identifier = identifier;

                // Use the actual email address where OTP was sent
                const sentToEmail = data.sentTo || identifier;
                const maskedEmail = this.maskEmail(sentToEmail);

                // Display masked email to user
                document.getElementById('sent-to').textContent = maskedEmail;

                // Close loading
                Swal.close();

                // Show OTP in console if in dev mode
                if (data.dev_mode && data.otp) {
                    // OTP logging removed for security

                    // Show prominent alert with OTP
                    Swal.fire({
                        title: '🔐 Development Mode',
                        html: `<div style="font-size: 18px; margin: 20px 0;">
                                   <p>OTP sent to: <strong>${maskedEmail}</strong></p>
                                   <div style="background: linear-gradient(135deg, #3b82f6, #14b8a6); 
                                               color: white; 
                                               padding: 20px; 
                                               border-radius: 12px; 
                                               font-size: 32px; 
                                               font-weight: bold; 
                                               letter-spacing: 8px;
                                               margin: 20px 0;
                                               font-family: monospace;">
                                       ${data.otp}
                                   </div>
                                   <p style="color: #64748b; font-size: 14px;">Enter this code in the verification step</p>
                               </div>`,
                        icon: 'info',
                        confirmButtonText: 'Got it!'
                    });
                } else {
                    this.showSuccess(`Verification code sent to ${maskedEmail}`);
                }

                this.goToStep(2);
                this.startOTPTimer(data.expiresIn || 600);
                this.startResendCooldown(120);
            } else {
                // Close loading
                Swal.close();

                if (data.showSignup) {
                    this.showErrorWithAction(
                        data.error,
                        'Sign Up',
                        () => window.location.href = 'register.html'
                    );
                } else if (data.waitTime) {
                    this.showError(data.error);
                } else {
                    this.showError(data.error);
                }
            }
        } catch (error) {
            // Close loading
            Swal.close();
            console.error('Send code error:', error);
            this.showError('Failed to send verification code. Please try again.');
        }
    }

    async handleVerifyOTP() {
        const otpInputs = document.querySelectorAll('.otp-input');
        const otp = Array.from(otpInputs).map(input => input.value).join('');

        if (otp.length !== 6) {
            this.showError('Please enter the complete 6-digit code');
            otpInputs.forEach(input => input.classList.add('error'));
            setTimeout(() => {
                otpInputs.forEach(input => input.classList.remove('error'));
            }, 500);
            return;
        }

        // Show loading state
        Swal.fire({
            title: 'Verifying Code...',
            html: 'Please wait while we verify your code',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const response = await fetch('php/verify-otp.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identifier: this.identifier,
                    otp: otp
                })
            });

            const data = await response.json();

            if (data.success) {
                this.resetToken = data.resetToken;

                // Close loading
                Swal.close();

                this.showSuccess(data.message);
                this.stopTimers();
                this.goToStep(3);
            } else {
                // Close loading
                Swal.close();

                this.showError(data.error);

                if (data.expired) {
                    // Clear OTP inputs
                    otpInputs.forEach(input => {
                        input.value = '';
                        input.classList.remove('filled');
                        input.classList.add('error');
                    });

                    setTimeout(() => {
                        otpInputs.forEach(input => input.classList.remove('error'));
                    }, 500);
                }
            }
        } catch (error) {
            // Close loading
            Swal.close();
            console.error('Verify OTP error:', error);
            this.showError('Failed to verify code. Please try again.');
        }
    }

    async handleResetPassword() {
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-new-password').value;

        // Validate password
        if (!this.validatePassword(newPassword)) {
            this.showError('Password does not meet all requirements');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        // Show loading state
        Swal.fire({
            title: 'Resetting Password...',
            html: 'Please wait while we reset your password',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const response = await fetch('php/reset-password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resetToken: this.resetToken,
                    newPassword: newPassword,
                    confirmPassword: confirmPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                // Close loading
                Swal.close();

                this.showSuccess(data.message);
                this.goToStep('success');

                // Auto-redirect after 3 seconds
                setTimeout(() => {
                    this.closeModal();
                }, 3000);
            } else {
                // Close loading
                Swal.close();

                if (data.errors) {
                    this.showError(data.errors.join('<br>'));
                } else {
                    this.showError(data.error);
                }
            }
        } catch (error) {
            // Close loading
            Swal.close();
            console.error('Reset password error:', error);
            this.showError('Failed to reset password. Please try again.');
        }
    }

    async handleResendOTP() {
        try {
            const response = await fetch('php/resend-otp.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: this.identifier })
            });

            const data = await response.json();

            if (data.success) {
                // Show OTP in console if in dev mode
                if (data.dev_mode && data.otp) {
                    // OTP logging removed for security
                    this.showInfo(`New OTP sent! Check console: ${data.otp}`);
                } else {
                    this.showSuccess(data.message);
                }

                this.startOTPTimer(data.expiresIn || 600);
                this.startResendCooldown(data.cooldown || 120);

                // Clear OTP inputs
                document.querySelectorAll('.otp-input').forEach(input => {
                    input.value = '';
                    input.classList.remove('filled');
                });
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            this.showError('Failed to resend code. Please try again.');
        }
    }

    startOTPTimer(seconds) {
        this.stopTimers();

        const timerElement = document.getElementById('otp-timer');
        let remaining = seconds;

        const updateTimer = () => {
            const minutes = Math.floor(remaining / 60);
            const secs = remaining % 60;
            timerElement.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;

            // Add expiring class when less than 2 minutes
            if (remaining < 120) {
                timerElement.classList.add('expiring');
            } else {
                timerElement.classList.remove('expiring');
            }

            if (remaining <= 0) {
                clearInterval(this.otpTimer);
                timerElement.textContent = 'Expired';
                this.showError('Verification code has expired. Please request a new one.');
            }

            remaining--;
        };

        updateTimer();
        this.otpTimer = setInterval(updateTimer, 1000);
    }

    startResendCooldown(seconds) {
        const resendButton = document.getElementById('resend-otp');
        const timerSpan = document.getElementById('resend-timer');
        let remaining = seconds;

        resendButton.disabled = true;

        const updateCooldown = () => {
            timerSpan.textContent = `(${remaining}s)`;

            if (remaining <= 0) {
                clearInterval(this.resendTimer);
                resendButton.disabled = false;
                timerSpan.textContent = '';
            }

            remaining--;
        };

        updateCooldown();
        this.resendTimer = setInterval(updateCooldown, 1000);
    }

    stopTimers() {
        if (this.otpTimer) {
            clearInterval(this.otpTimer);
            this.otpTimer = null;
        }

        if (this.resendTimer) {
            clearInterval(this.resendTimer);
            this.resendTimer = null;
        }
    }

    showSuccess(message) {
        Swal.fire({
            title: 'Success!',
            text: message,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });
    }

    showError(message) {
        Swal.fire({
            title: 'Error',
            html: message,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }

    showInfo(message) {
        Swal.fire({
            title: 'Info',
            text: message,
            icon: 'info',
            confirmButtonText: 'OK'
        });
    }

    showErrorWithAction(message, buttonText, callback) {
        Swal.fire({
            title: 'Error',
            text: message,
            icon: 'error',
            showCancelButton: true,
            confirmButtonText: buttonText,
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed && callback) {
                callback();
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ForgotPasswordManager();
});

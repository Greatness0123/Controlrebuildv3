class SignupPage {
    constructor() {
        // For the website we use Supabase for account creation.
        this.supabase = new SupabaseService();
        this.selectedPlan = 'Free';
        this.setupEventListeners();
    }

    setupEventListeners() {
        const signupForm = document.getElementById('signupForm');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.signup();
        });

        // Password strength indicator
        passwordInput.addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target.value);
        });

        // Plan selection
        document.querySelectorAll('.plan-option').forEach(option => {
            option.addEventListener('click', () => {
                this.selectPlan(option);
            });
        });

        // Confirm password validation
        confirmPasswordInput.addEventListener('input', (e) => {
            this.validatePasswords();
        });

        // Auto-focus first name field
        document.getElementById('firstName').focus();
    }

    selectPlan(selectedOption) {
        document.querySelectorAll('.plan-option').forEach(option => {
            option.classList.remove('selected');
        });
        selectedOption.classList.add('selected');
        this.selectedPlan = selectedOption.dataset.plan;
    }

    updatePasswordStrength(password) {
        const strengthBar = document.getElementById('passwordStrengthBar');
        
        if (password.length === 0) {
            strengthBar.className = 'password-strength-bar';
            return;
        }

        let strength = 0;
        
        // Length check
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        
        // Character variety checks
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        // Update UI
        if (strength <= 2) {
            strengthBar.className = 'password-strength-bar weak';
        } else if (strength <= 4) {
            strengthBar.className = 'password-strength-bar medium';
        } else {
            strengthBar.className = 'password-strength-bar strong';
        }
    }

    validatePasswords() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (confirmPassword && password !== confirmPassword) {
            document.getElementById('confirmPassword').style.borderColor = '#ef4444';
            return false;
        } else {
            document.getElementById('confirmPassword').style.borderColor = '';
            return true;
        }
    }

    async signup() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            this.showError('Please fill in all fields');
            return;
        }

        if (password.length < 8) {
            this.showError('Password must be at least 8 characters long');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        this.setLoading(true);
        this.hideMessages();

        try {
            // 1) Create Supabase Auth user
            const authRes = await this.supabase.signUpWithEmailPassword(email, password);
            if (!authRes.success) {
                throw new Error(authRes.message || 'Failed to create auth user');
            }

            // NOTE: If email confirmations are enabled, Supabase may not create a session immediately.
            // For this website flow, disable email confirmations in Supabase Auth settings OR
            // have the user sign in after confirming email.
            const authUserId = authRes?.data?.user?.id;
            if (!authUserId) {
                throw new Error('Auth user created but no user id returned');
            }

            // 2) Create profile row in public.users (protected by RLS: auth.uid() = auth_id)
            const entryId = await this.supabase.generateUserId();
            const userData = {
                id: entryId,
                auth_id: authUserId,
                name: `${firstName} ${lastName}`,
                email: email,
                plan: this.selectedPlan.toLowerCase(),
                member_since: new Date().toISOString()
            };

            const profileRes = await this.supabase.createUser(userData);
            if (!profileRes.success) {
                throw new Error(profileRes.message || 'Failed to create user profile');
            }

            // Show success message with User ID
            this.showSuccessMessage(`Account created successfully! Your User ID is: ${entryId}`);
            this.displayUserId(entryId);
            
            // Reset form
            document.getElementById('signupForm').reset();
            document.getElementById('passwordStrengthBar').className = 'password-strength-bar';

        } catch (error) {
            console.error('Signup error:', error);
            this.showError('An error occurred during signup. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    displayUserId(userId) {
        const userIdDisplay = document.getElementById('userIdDisplay');
        const userIdValue = document.getElementById('userIdValue');
        
        userIdValue.textContent = userId;
        userIdDisplay.classList.add('show');
    }

    setLoading(loading) {
        const signupBtn = document.getElementById('signupBtn');
        if (loading) {
            signupBtn.classList.add('loading');
            signupBtn.disabled = true;
        } else {
            signupBtn.classList.remove('loading');
            signupBtn.disabled = false;
        }
    }

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');
        
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        successMessage.classList.remove('show');
    }

    showSuccessMessage(message) {
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');
        
        successMessage.textContent = message;
        successMessage.classList.add('show');
        errorMessage.classList.remove('show');
    }

    hideMessages() {
        document.getElementById('errorMessage').classList.remove('show');
        document.getElementById('successMessage').classList.remove('show');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SignupPage();
});
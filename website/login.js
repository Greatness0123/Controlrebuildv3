// Import Firebase service (assuming it's shared)
// In a real app, this would be imported from a shared file

class LoginPage {
    constructor() {
        this.db = new SupabaseService();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const userIdInput = document.getElementById('userId');
        const passwordInput = document.getElementById('password');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.login();
        });

        // Auto-focus user ID field
        userIdInput.focus();

        // Format user ID as user types
        userIdInput.addEventListener('input', (e) => {
            this.formatUserId(e.target);
        });
    }

    formatUserId(input) {
        // Remove all non-alphanumeric characters
        let value = input.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

        // Auto-format as XXXX-XXXX-XXXX-XXXX-XXXX (24 chars with 4 hyphens)
        let formatted = '';
        for (let i = 0; i < value.length && i < 20; i++) {
            if (i > 0 && i % 4 === 0) formatted += '-';
            formatted += value[i];
        }

        input.value = formatted;
    }

    async login() {
        const userId = document.getElementById('userId').value.trim();
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');
        const loginBtn = document.getElementById('loginBtn');

        // Validation
        if (!userId || !password) {
            this.showError('Please enter both User ID and password');
            return;
        }

        // 20 chars + 4 hyphens = 24 chars
        if (userId.length !== 24) {
            this.showError('Invalid User ID format');
            return;
        }

        this.setLoading(true);
        this.hideError();

        try {
            // In a real app, we'd verify the password
            // For demo, we'll just authenticate by User ID
            const result = await this.db.signIn(userId);

            if (result.success) {
                // Redirect to dashboard
                window.location.href = 'index.html';
            } else {
                this.showError(result.message || 'Invalid User ID or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('An error occurred during login. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        const loginBtn = document.getElementById('loginBtn');
        if (loading) {
            loginBtn.classList.add('loading');
            loginBtn.disabled = true;
        } else {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    }

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
    }

    hideError() {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.classList.remove('show');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
});
class LoginPage {
    constructor() {
        this.db = new SupabaseService();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.login();
        });

        emailInput.focus();
    }

    async login() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');
        const loginBtn = document.getElementById('loginBtn');

        if (!email || !password) {
            this.showError('Please enter both email and password');
            return;
        }

        this.setLoading(true);
        this.hideError();

        try {
            const result = await this.db.signIn(email, password);

            if (result.success) {

                window.location.href = 'index.html';
            } else {
                this.showError(result.message || 'Invalid email or password');
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

document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
});

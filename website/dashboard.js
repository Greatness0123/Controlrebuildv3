class Dashboard {
    constructor() {
        this.db = new SupabaseService();
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Check authentication
        this.currentUser = await this.db.getCurrentUser();

        if (!this.currentUser) {
            // Redirect to login if not authenticated
            window.location.href = 'login.html';
            return;
        }

        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // Copy User ID
        document.getElementById('copyUserId').addEventListener('click', () => {
            this.copyToClipboard('userId');
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Password modal
        document.getElementById('changePasswordBtn').addEventListener('click', () => {
            this.showPasswordModal();
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.hidePasswordModal();
        });

        document.getElementById('passwordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });

        // Close modal on outside click
        document.getElementById('passwordModal').addEventListener('click', (e) => {
            if (e.target.id === 'passwordModal') {
                this.hidePasswordModal();
            }
        });
    }

    updateUI() {
        if (!this.currentUser) return;

        try {
            // Update profile information
            const name = this.currentUser.name || 'User';
            const names = name.trim().split(/\s+/);
            const initials = names.length > 1
                ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
                : names[0][0].toUpperCase();

            document.getElementById('profileInitials').textContent = initials;
            document.getElementById('profileName').textContent = name;
            document.getElementById('profileEmail').textContent = this.currentUser.email || '';
            document.getElementById('userId').textContent = this.currentUser.id;

            // Update stats
            const stats = document.querySelectorAll('.stat-value');
            if (stats.length >= 3) {
                stats[0].textContent = this.currentUser.tasksCompleted || 0;
                stats[1].textContent = this.currentUser.hoursSaved || 0;
                stats[2].textContent = (this.currentUser.successRate || 0) + '%';
            }

            // Update password info
            const lastChanged = this.currentUser.passwordLastChanged ? new Date(this.currentUser.passwordLastChanged) : new Date();
            const monthsAgo = Math.floor((new Date() - lastChanged) / (1000 * 60 * 60 * 24 * 30));
            document.getElementById('passwordInfo').textContent =
                `Last changed ${monthsAgo} month${monthsAgo !== 1 ? 's' : ''} ago`;

            // Update plan
            const planBadge = document.querySelector('.plan-badge');
            if (planBadge && this.currentUser.plan) {
                planBadge.textContent = this.currentUser.plan;
            }
        } catch (error) {
            console.error('Error updating UI:', error);
        }
    }

    copyToClipboard(elementId) {
        const text = document.getElementById(elementId).textContent;

        navigator.clipboard.writeText(text).then(() => {
            this.showToast('User ID copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('User ID copied to clipboard!', 'success');
        });
    }

    showPasswordModal() {
        document.getElementById('passwordModal').classList.add('show');
        document.getElementById('passwordForm').reset();
    }

    hidePasswordModal() {
        document.getElementById('passwordModal').classList.remove('show');
    }

    async changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation
        if (newPassword.length < 8) {
            this.showToast('Password must be at least 8 characters long', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showToast('Passwords do not match', 'error');
            return;
        }

        try {
            const result = await this.db.changePassword(
                this.currentUser.id,
                currentPassword,
                newPassword
            );

            if (result.success) {
                this.showToast('Password changed successfully!', 'success');
                this.hidePasswordModal();
                this.updateUI(); // Update the "last changed" text
            } else {
                this.showToast(result.message || 'Failed to change password', 'error');
            }
        } catch (error) {
            console.error('Password change error:', error);
            this.showToast('An error occurred while changing password', 'error');
        }
    }

    async logout() {
        try {
            await this.db.signOut();
            this.showToast('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        } catch (error) {
            console.error('Logout error:', error);
            this.showToast('Failed to logout', 'error');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});

// Export for use in other files
window.Dashboard = Dashboard;

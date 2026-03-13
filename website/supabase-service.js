class SupabaseService {
    constructor() {
        this.currentUser = null;
    }

    async signIn(email, password) {
        try {
            // Find user by email in local storage
            const users = this.getAllUsers();
            const user = users.find(u => u.email === email);

            if (user) {
                // Simplified password check for demo
                this.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                return { success: true, user: this.currentUser };
            }

            return { success: false, message: 'Invalid email or password' };
        } catch (error) {
            return { success: false, message: 'Authentication failed' };
        }
    }

    getAllUsers() {
        const users = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('user_')) {
                users.push(JSON.parse(localStorage.getItem(key)));
            }
        }
        return users;
    }

    async signOut() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        return { success: true };
    }

    async getCurrentUser() {
        if (this.currentUser) return this.currentUser;
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            this.currentUser = JSON.parse(stored);
            return this.currentUser;
        }
        return null;
    }

    async generateUserId() {
        // Match the 12-digit numeric ID expected by verifyEntryID
        let result = '';
        for (let i = 0; i < 12; i++) {
            result += Math.floor(Math.random() * 10);
        }
        return result;
    }

    async createUser(userData) {
        // In real use: await supabase.from('users').insert(userData);
        localStorage.setItem('user_' + userData.id, JSON.stringify(userData));
        return { success: true };
    }

    async changePassword(userId, currentPassword, newPassword) {
        const user = JSON.parse(localStorage.getItem('user_' + userId));
        if (user) {
            user.password = 'hashed_' + newPassword;
            user.passwordLastChanged = new Date();
            localStorage.setItem('user_' + userId, JSON.stringify(user));
            if (this.currentUser && this.currentUser.id === userId) {
                this.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
            }
            return { success: true };
        }
        return { success: false, message: 'User not found' };
    }
}

window.SupabaseService = SupabaseService;

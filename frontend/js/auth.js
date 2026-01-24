// Authentication Module
class Auth {
    constructor() {
        this.currentUser = this.getCurrentUser();
        this.userType = localStorage.getItem('user_type') || null;
    }

    getCurrentUser() {
        const userStr = localStorage.getItem('current_user');
        return userStr ? JSON.parse(userStr) : null;
    }

    setCurrentUser(user) {
        this.currentUser = user;
        if (user) {
            localStorage.setItem('current_user', JSON.stringify(user));
            localStorage.setItem('user_type', user.user_type);
        } else {
            localStorage.removeItem('current_user');
            localStorage.removeItem('user_type');
        }
    }

    async login(email, password, userType) {
        try {
            const response = await API.login(email, password, userType);
            if (response.token) {
                api.setToken(response.token);
                this.setCurrentUser(response.user);
                this.userType = userType;
                return { success: true, user: response.user };
            }
            throw new Error('Login failed');
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    async register(email, password, userType) {
        try {
            const response = await API.register(email, password, userType);
            if (response.token) {
                api.setToken(response.token);
                this.setCurrentUser(response.user);
                this.userType = userType;
                return { success: true, user: response.user };
            }
            throw new Error('Registration failed');
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    }

    async logout() {
        await API.logout();
        this.setCurrentUser(null);
        this.userType = null;
        
        // Очищаем все данные пользователя из localStorage
        localStorage.removeItem('current_user');
        localStorage.removeItem('user_type');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('client_settings');
        localStorage.removeItem('company_settings');
        localStorage.removeItem('bookings');
        localStorage.removeItem('client_blacklist');
        localStorage.removeItem('company_blacklist');
        localStorage.removeItem('favorites');
        localStorage.removeItem('client_rating');
        
        window.location.href = 'index.html';
    }

    isAuthenticated() {
        return !!this.currentUser && !!api.token;
    }

    isClient() {
        return this.userType === 'client';
    }

    isCompany() {
        return this.userType === 'company';
    }

    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
        }
    }

    requireClient() {
        if (!this.isAuthenticated() || !this.isClient()) {
            window.location.href = 'index.html';
        }
    }

    requireCompany() {
        if (!this.isAuthenticated() || !this.isCompany()) {
            window.location.href = 'index.html';
        }
    }
}

// Create global auth instance
const auth = new Auth();

// Helper functions for backward compatibility
async function login(email, password, userType) {
    return auth.login(email, password, userType);
}

async function register(email, password, userType) {
    return auth.register(email, password, userType);
}

async function logout() {
    return auth.logout();
}


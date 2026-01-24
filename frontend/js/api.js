// API Client for Backend Communication
class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL || CONFIG.API_URL;
        this.token = localStorage.getItem('auth_token');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);
            
            // Check if response is JSON
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(`Server returned non-JSON: ${text}`);
            }
            
            if (!response.ok) {
                throw new Error(data.error || `Request failed with status ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            console.error('URL:', url);
            console.error('Config:', config);
            
            // If it's a network error, provide helpful message
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Failed to connect to server. Make sure backend is running on http://localhost:5000');
            }
            
            throw error;
        }
    }

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }
}

// Create global API client instance
const api = new APIClient();

// API Methods
const API = {
    // Auth
    async login(email, password, userType) {
        return api.post('/auth/login', { email, password, user_type: userType });
    },

    async register(email, password, userType) {
        return api.post('/auth/register', { email, password, user_type: userType });
    },

    async logout() {
        api.setToken(null);
        return Promise.resolve();
    },

    // Services
    async searchServices(query, filters = {}) {
        return api.post('/services/search', { query, ...filters });
    },

    async getService(serviceId) {
        return api.get(`/services/${serviceId}`);
    },

    async getServiceMasters(serviceId) {
        return api.get(`/services/${serviceId}/masters`);
    },

    async getServiceReviews(serviceId, filters = {}) {
        return api.get(`/services/${serviceId}/reviews`, { params: filters });
    },

    async getServiceExamples(serviceId) {
        return api.get(`/services/${serviceId}/examples`);
    },

    async getAvailableTimeSlots(serviceId, masterId, date) {
        return api.get(`/services/${serviceId}/time-slots?master_id=${masterId}&date=${date}`);
    },

    // Bookings
    async createBooking(bookingData) {
        return api.post('/bookings', bookingData);
    },

    async getBookings(userId) {
        return api.get(`/bookings?user_id=${userId}`);
    },

    async rescheduleBooking(bookingId, newDate, newTime) {
        return api.put(`/bookings/${bookingId}/reschedule`, {
            date: newDate,
            time: newTime,
        });
    },

    async cancelBooking(bookingId) {
        return api.delete(`/bookings/${bookingId}`);
    },

    // Favorites
    async addToFavorites(serviceId) {
        return api.post('/favorites', { service_id: serviceId });
    },

    async removeFromFavorites(serviceId) {
        return api.delete(`/favorites/${serviceId}`);
    },

    async getFavorites() {
        return api.get('/favorites');
    },

    // Client Settings
    async updateClientSettings(settings) {
        return api.put('/clients/settings', settings);
    },

    async getClientSettings() {
        return api.get('/clients/settings');
    },

    async addToBlacklist(companyId) {
        return api.post('/clients/blacklist', { company_id: companyId });
    },

    async removeFromBlacklist(companyId) {
        return api.delete(`/clients/blacklist/${companyId}`);
    },

    // Company Settings
    async updateCompanySettings(settings) {
        return api.put('/companies/settings', settings);
    },

    async getCompanySettings() {
        return api.get('/companies/settings');
    },

    async getMasters() {
        return api.get('/companies/masters');
    },

    async createMaster(masterData) {
        return api.post('/companies/masters', masterData);
    },

    async updateMaster(masterId, masterData) {
        return api.put(`/companies/masters/${masterId}`, masterData);
    },

    async deleteMaster(masterId) {
        return api.delete(`/companies/masters/${masterId}`);
    },

    async createPromotion(promotionData) {
        return api.post('/companies/promotions', promotionData);
    },

    async getPromotions() {
        return api.get('/companies/promotions');
    },

    async deletePromotion(promotionId) {
        return api.delete(`/companies/promotions/${promotionId}`);
    },
};


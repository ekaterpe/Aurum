// Mock Data for Development
const MOCK_DATA = {
    services: [
        {
            id: 1,
            name: 'Haircut and Styling',
            company: 'Elegant Beauty Salon',
            category: 'beauty',
            price: 35,
            rating: 4.8,
            distance: 2.5,
            image: 'https://via.placeholder.com/300x200',
            description: 'Professional haircut and styling services',
        },
        {
            id: 2,
            name: 'Back Massage',
            company: 'Relax Spa Center',
            category: 'health',
            price: 55,
            rating: 4.9,
            distance: 1.8,
            image: 'https://via.placeholder.com/300x200',
            description: 'Relaxing back and neck massage',
        },
        {
            id: 3,
            name: 'Phone Repair',
            company: 'TechFix Service Center',
            category: 'repair',
            price: 65,
            rating: 4.7,
            distance: 3.2,
            image: 'https://via.placeholder.com/300x200',
            description: 'Screen repair and battery replacement',
        },
        {
            id: 4,
            name: 'Deep Cleaning',
            company: 'Sparkle Cleaning Co.',
            category: 'cleaning',
            price: 120,
            rating: 4.6,
            distance: 4.1,
            image: 'https://via.placeholder.com/300x200',
            description: 'Complete apartment or office cleaning',
        },
        {
            id: 5,
            name: 'Manicure & Pedicure',
            company: 'Elegant Beauty Salon',
            category: 'beauty',
            price: 45,
            rating: 4.7,
            distance: 2.5,
            image: 'https://via.placeholder.com/300x200',
            description: 'Professional nail care and polish',
        },
        {
            id: 6,
            name: 'Personal Training',
            company: 'FitLife Gym',
            category: 'health',
            price: 40,
            rating: 4.9,
            distance: 1.2,
            image: 'https://via.placeholder.com/300x200',
            description: 'One-on-one fitness training session',
        },
    ],

    masters: [
        {
            id: 1,
            name: 'Anna Petrova',
            photo: 'https://via.placeholder.com/80',
            specialization: 'Hair Stylist',
            rating: 4.9,
            serviceId: 1,
        },
        {
            id: 2,
            name: 'Maria Ivanova',
            photo: 'https://via.placeholder.com/80',
            specialization: 'Massage Therapist',
            rating: 4.8,
            serviceId: 2,
        },
        {
            id: 3,
            name: 'Ivan Sidorov',
            photo: 'https://via.placeholder.com/80',
            specialization: 'Repair Specialist',
            rating: 4.7,
            serviceId: 3,
        },
        {
            id: 4,
            name: 'Elena Smirnova',
            photo: 'https://via.placeholder.com/80',
            specialization: 'Nail Artist',
            rating: 4.8,
            serviceId: 5,
        },
        {
            id: 5,
            name: 'Alex Johnson',
            photo: 'https://via.placeholder.com/80',
            specialization: 'Personal Trainer',
            rating: 4.9,
            serviceId: 6,
        },
    ],

    reviews: [
        {
            id: 1,
            author: 'Elena K.',
            rating: 5,
            date: '2026-01-15',
            text: 'Excellent service! Very happy with the results.',
            serviceId: 1,
        },
        {
            id: 2,
            author: 'Dmitry S.',
            rating: 4,
            date: '2026-01-14',
            text: 'Good, but could be better.',
            serviceId: 1,
        },
        {
            id: 3,
            author: 'Olga M.',
            rating: 5,
            date: '2026-01-13',
            text: 'Wonderful massage, highly recommend!',
            serviceId: 2,
        },
        {
            id: 4,
            author: 'James R.',
            rating: 5,
            date: '2026-01-12',
            text: 'Fixed my phone in just an hour. Great work!',
            serviceId: 3,
        },
    ],

    workExamples: [
        {
            id: 1,
            serviceId: 1,
            image: 'https://via.placeholder.com/200',
            description: 'Bob haircut',
        },
        {
            id: 2,
            serviceId: 1,
            image: 'https://via.placeholder.com/200',
            description: 'Long hair styling',
        },
        {
            id: 3,
            serviceId: 2,
            image: 'https://via.placeholder.com/200',
            description: 'Massage therapy session',
        },
        {
            id: 4,
            serviceId: 5,
            image: 'https://via.placeholder.com/200',
            description: 'Gel manicure design',
        },
    ],

    bookings: [
        {
            id: 1,
            serviceId: 1,
            serviceName: 'Haircut and Styling',
            masterId: 1,
            masterName: 'Anna Petrova',
            date: '2026-01-25',
            time: '14:00',
            status: 'confirmed',
        },
        {
            id: 2,
            serviceId: 2,
            serviceName: 'Back Massage',
            masterId: 2,
            masterName: 'Maria Ivanova',
            date: '2026-01-28',
            time: '16:00',
            status: 'pending',
        },
    ],

    tariffs: [
        {
            id: 1,
            name: 'Basic',
            price: 0,
            features: [
                'Up to 10 services per month',
                'Basic statistics',
                'Email support',
            ],
        },
        {
            id: 2,
            name: 'Professional',
            price: 29,
            features: [
                'Unlimited services',
                'Advanced statistics',
                'Priority support',
                'Custom design',
            ],
        },
        {
            id: 3,
            name: 'Premium',
            price: 79,
            features: [
                'Everything from Professional',
                'Personal manager',
                'API access',
                'Integrations',
            ],
        },
    ],
};

// Helper functions to work with mock data
const MockAPI = {
    async searchServices(query, filters = {}) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        
        let results = MOCK_DATA.services.filter(service => {
            const matchesQuery = !query || 
                service.name.toLowerCase().includes(query.toLowerCase()) ||
                service.company.toLowerCase().includes(query.toLowerCase());
            
            const matchesCategory = !filters.category || service.category === filters.category;
            const matchesPrice = !filters.price || this.matchesPriceRange(service.price, filters.price);
            const matchesRating = !filters.rating || service.rating >= parseFloat(filters.rating);
            const matchesDistance = !filters.distance || service.distance <= parseFloat(filters.distance);
            
            return matchesQuery && matchesCategory && matchesPrice && matchesRating && matchesDistance;
        });
        
        return { services: results };
    },

    matchesPriceRange(price, range) {
        if (range === '0-50') return price <= 50;
        if (range === '50-100') return price >= 50 && price <= 100;
        if (range === '100+') return price >= 100;
        return true;
    },

    async getService(serviceId) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_DATA.services.find(s => s.id === parseInt(serviceId)) || null;
    },

    async getServiceMasters(serviceId) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { masters: MOCK_DATA.masters.filter(m => m.serviceId === parseInt(serviceId)) };
    },

    async getServiceReviews(serviceId) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { reviews: MOCK_DATA.reviews.filter(r => r.serviceId === parseInt(serviceId)) };
    },

    async getServiceExamples(serviceId) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { examples: MOCK_DATA.workExamples.filter(e => e.serviceId === parseInt(serviceId)) };
    },

    async getBookings() {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { bookings: MOCK_DATA.bookings };
    },

    async getTariffs() {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { tariffs: MOCK_DATA.tariffs };
    },
};

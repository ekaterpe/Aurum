// Service Page Logic
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceId = urlParams.get('id');

    if (!serviceId) {
        alert('Service not found');
        window.location.href = 'index.html';
        return;
    }

    // Initialize elements
    const favoriteBtn = document.getElementById('favoriteBtn');
    const shareBtn = document.getElementById('shareBtn');
    const bookBtn = document.getElementById('bookBtn');
    const contactBtn = document.getElementById('contactBtn');
    const contactModal = document.getElementById('contactModal');
    const closeContactModal = document.getElementById('closeContactModal');
    const contactForm = document.getElementById('contactForm');
    const calendar = document.getElementById('calendar');
    const timeSlots = document.getElementById('timeSlots');
    const mastersList = document.getElementById('mastersList');
    const reviewsList = document.getElementById('reviewsList');
    const examplesGallery = document.getElementById('examplesGallery');
    const priceValue = document.getElementById('priceValue');
    const distanceValue = document.getElementById('distanceValue');
    const mapContainer = document.getElementById('map');

    let selectedDate = null;
    let selectedTime = null;
    let selectedMaster = null;
    let serviceData = null;
    let isFavorite = false;

    // Load service data
    await loadService(serviceId);

    // Initialize user location
    if (typeof mapsService !== 'undefined') {
        await mapsService.getUserLocation();
    }

    // Event listeners
    favoriteBtn.addEventListener('click', toggleFavorite);
    shareBtn.addEventListener('click', shareService);
    bookBtn.addEventListener('click', handleBooking);
    contactBtn.addEventListener('click', () => {
        contactModal.classList.add('show');
    });
    closeContactModal.addEventListener('click', () => {
        contactModal.classList.remove('show');
    });
    contactForm.addEventListener('submit', handleContact);

    // Initialize calendar
    initCalendar();

    async function loadService(id) {
        try {
            // Check if this is a Google Maps service
            const isGoogleService = id.startsWith('google_');
            
            // Try API first, fallback to mock
            try {
                serviceData = await API.getService(id);
            } catch (error) {
                console.warn('API failed, using mock data:', error);
                if (!isGoogleService) {
                    serviceData = await MockAPI.getService(id);
                }
            }

            // If it's a Google Maps service and we don't have data, show placeholder
            if (isGoogleService && (!serviceData || serviceData.source === 'google_maps')) {
                serviceData = serviceData || {
                    id: id,
                    name: 'External Service',
                    description: 'This service was found via Google Maps. Contact them directly for more information.',
                    price: 0,
                    source: 'google_maps'
                };
                
                // Update page with limited info
                document.getElementById('serviceName').textContent = serviceData.name || 'External Service';
                priceValue.textContent = 'Contact for price';
                
                // Show message for Google services
                if (mastersList) {
                    mastersList.innerHTML = '<p class="info-message">This service was found via Google Maps. Visit their page for booking information.</p>';
                }
                if (reviewsList) {
                    reviewsList.innerHTML = '<p class="info-message">Reviews not available for external services.</p>';
                }
                if (examplesGallery) {
                    examplesGallery.innerHTML = '<p class="info-message">Examples not available for external services.</p>';
                }
                
                // Disable booking for Google services
                if (bookBtn) {
                    bookBtn.textContent = 'Contact Service';
                    bookBtn.onclick = () => {
                        alert('This is an external service found via Google Maps. Please contact them directly.');
                    };
                }
                
                return;
            }

            if (!serviceData) {
                throw new Error('Service not found');
            }

            // Update page
            document.getElementById('serviceName').textContent = serviceData.name;
            priceValue.textContent = serviceData.price ? `€${serviceData.price}` : 'Contact for price';

            // Load masters
            await loadMasters(id);
            
            // Load reviews
            await loadReviews(id);
            
            // Load examples
            await loadExamples(id);

            // Calculate distance and show map
            if (typeof mapsService !== 'undefined' && mapsService.userLocation) {
                try {
                    let serviceLocation = null;
                    
                    if (serviceData.location && serviceData.location.lat) {
                        serviceLocation = serviceData.location;
                    } else if (serviceData.address) {
                        serviceLocation = await mapsService.geocodeAddress(serviceData.address);
                    }
                    
                    if (serviceLocation) {
                        const distance = await mapsService.calculateDistance(
                            mapsService.userLocation,
                            serviceLocation
                        );
                        if (distance !== null) {
                            distanceValue.textContent = mapsService.formatDistance(distance);
                        }
                        
                        // Show map with location
                        if (mapContainer) {
                            mapsService.renderStaticMap('map', serviceLocation);
                        }
                    }
                } catch (error) {
                    console.error('Distance calculation error:', error);
                }
            }

            // Check if favorite
            checkFavoriteStatus(id);
        } catch (error) {
            console.error('Error loading service:', error);
            alert('Error loading service');
        }
    }

    async function loadMasters(serviceId) {
        try {
            let result;
            try {
                result = await API.getServiceMasters(serviceId);
            } catch (error) {
                result = await MockAPI.getServiceMasters(serviceId);
            }

            const masters = result.masters || [];
            mastersList.innerHTML = masters.map(master => `
                <div class="master-card" data-master-id="${master.id}">
                    <img src="${master.photo || 'https://via.placeholder.com/80'}" 
                         alt="${master.name}" 
                         class="master-photo"
                         onerror="this.src='https://via.placeholder.com/80'">
                    <div class="master-info">
                        <div class="master-name">${master.name}</div>
                        <div class="master-specialization">${master.specialization}</div>
                        <div class="master-rating">${generateStars(master.rating)} ${master.rating}</div>
                    </div>
                </div>
            `).join('');

            // Add click handlers
            document.querySelectorAll('.master-card').forEach(card => {
                card.addEventListener('click', () => {
                    document.querySelectorAll('.master-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    selectedMaster = parseInt(card.dataset.masterId);
                    loadTimeSlots();
                });
            });

            // Select first master by default
            if (masters.length > 0) {
                selectedMaster = masters[0].id;
                document.querySelector(`[data-master-id="${selectedMaster}"]`)?.classList.add('selected');
            }
        } catch (error) {
            console.error('Error loading masters:', error);
        }
    }

    async function loadReviews(serviceId) {
        try {
            let result;
            try {
                result = await API.getServiceReviews(serviceId);
            } catch (error) {
                result = await MockAPI.getServiceReviews(serviceId);
            }

            const reviews = result.reviews || [];
            reviewsList.innerHTML = reviews.map(review => `
                <div class="review-card">
                    <div class="review-header">
                        <span class="review-author">${review.author}</span>
                        <div class="review-rating">${generateStars(review.rating)}</div>
                    </div>
                    <div class="review-date">${formatDate(review.date)}</div>
                    <div class="review-text">${review.text}</div>
                </div>
            `).join('');

            // Filter buttons
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    filterReviews(parseInt(btn.dataset.rating));
                });
            });
        } catch (error) {
            console.error('Error loading reviews:', error);
        }
    }

    async function loadExamples(serviceId) {
        try {
            let result;
            try {
                result = await API.getServiceExamples(serviceId);
            } catch (error) {
                result = await MockAPI.getServiceExamples(serviceId);
            }

            const examples = result.examples || [];
            examplesGallery.innerHTML = examples.map(example => `
                <img src="${example.image || 'https://via.placeholder.com/200'}" 
                     alt="${example.description || ''}" 
                     class="example-image"
                     onerror="this.src='https://via.placeholder.com/200'">
            `).join('');
        } catch (error) {
            console.error('Error loading examples:', error);
        }
    }

    function initCalendar() {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        renderCalendar(currentMonth, currentYear);
    }

    function renderCalendar(month, year) {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        let html = `
            <div class="calendar-month-header">
                <button class="calendar-nav-btn" onclick="changeMonth(-1)">←</button>
                <span>${monthNames[month]} ${year}</span>
                <button class="calendar-nav-btn" onclick="changeMonth(1)">→</button>
            </div>
        `;

        // Day headers
        dayNames.forEach(day => {
            html += `<div class="calendar-header">${day}</div>`;
        });

        // Empty cells for days before month start
        for (let i = 0; i < firstDay - 1; i++) {
            html += '<div class="calendar-day"></div>';
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === today.toDateString();
            const isPast = date < today;
            const classes = ['calendar-day'];
            if (isToday) classes.push('today');
            if (isPast) classes.push('disabled');

            html += `<div class="${classes.join(' ')}" data-date="${formatDateForAPI(date)}">${day}</div>`;
        }

        calendar.innerHTML = html;

        // Add click handlers
        document.querySelectorAll('.calendar-day:not(.disabled)').forEach(day => {
            day.addEventListener('click', () => {
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                day.classList.add('selected');
                selectedDate = day.dataset.date;
                loadTimeSlots();
            });
        });
    }

    window.changeMonth = function(delta) {
        // This will be handled by calendar state
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        renderCalendar(currentMonth + delta, currentYear);
    };

    async function loadTimeSlots() {
        if (!selectedDate || !selectedMaster) return;

        try {
            // Generate time slots (9:00 - 18:00, every hour)
            const slots = [];
            for (let hour = 9; hour < 18; hour++) {
                slots.push(`${hour.toString().padStart(2, '0')}:00`);
            }

            timeSlots.innerHTML = slots.map(slot => `
                <div class="time-slot" data-time="${slot}">${slot}</div>
            `).join('');

            // Add click handlers
            document.querySelectorAll('.time-slot').forEach(slot => {
                slot.addEventListener('click', () => {
                    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                    slot.classList.add('selected');
                    selectedTime = slot.dataset.time;
                });
            });
        } catch (error) {
            console.error('Error loading time slots:', error);
        }
    }

    async function toggleFavorite() {
        try {
            if (isFavorite) {
                await API.removeFromFavorites(serviceId);
                isFavorite = false;
                favoriteBtn.style.color = '';
            } else {
                await API.addToFavorites(serviceId);
                isFavorite = true;
                favoriteBtn.style.color = 'var(--danger-color)';
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            // Fallback to localStorage
            const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            if (isFavorite) {
                const index = favorites.indexOf(serviceId);
                if (index > -1) favorites.splice(index, 1);
            } else {
                favorites.push(serviceId);
            }
            localStorage.setItem('favorites', JSON.stringify(favorites));
            isFavorite = !isFavorite;
            favoriteBtn.style.color = isFavorite ? 'var(--danger-color)' : '';
        }
    }

    async function checkFavoriteStatus(id) {
        try {
            const favorites = await API.getFavorites();
            isFavorite = favorites.some(f => f.service_id === id);
        } catch (error) {
            // Check localStorage
            const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            isFavorite = favorites.includes(parseInt(id));
        }
        if (isFavorite) {
            favoriteBtn.style.color = 'var(--danger-color)';
        }
    }

    function shareService() {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: serviceData.name,
                text: `Check out this service: ${serviceData.name}`,
                url: url,
            });
        } else {
            navigator.clipboard.writeText(url).then(() => {
                alert('Link copied to clipboard');
            });
        }
    }

    async function handleBooking() {
        if (!auth.isAuthenticated()) {
            alert('Please log in');
            window.location.href = 'index.html';
            return;
        }

        if (!selectedDate || !selectedTime || !selectedMaster) {
            alert('Please select date, time and master');
            return;
        }

        try {
            await API.createBooking({
                service_id: serviceId,
                master_id: selectedMaster,
                date: selectedDate,
                time: selectedTime,
            });
            alert('Booking created successfully!');
            window.location.href = 'client-settings.html';
        } catch (error) {
            console.error('Booking error:', error);
            alert('Error creating booking');
        }
    }

    function handleContact(e) {
        e.preventDefault();
        alert('Message sent!');
        contactModal.classList.remove('show');
        contactForm.reset();
    }

    function filterReviews(rating) {
        const reviews = document.querySelectorAll('.review-card');
        reviews.forEach(review => {
            const reviewRating = parseInt(review.querySelector('.review-rating').textContent.match(/\d/)?.[0] || '0');
            if (rating === 0 || reviewRating === rating) {
                review.style.display = 'block';
            } else {
                review.style.display = 'none';
            }
        });
    }

    function generateStars(rating) {
        const fullStars = Math.floor(rating);
        return '★'.repeat(fullStars);
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function formatDateForAPI(date) {
        return date.toISOString().split('T')[0];
    }
});


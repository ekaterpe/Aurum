// Home Page Logic
document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('loginSection');
    const searchSection = document.getElementById('searchSection');
    const servicesSection = document.getElementById('servicesSection');
    const loginForm = document.getElementById('loginForm');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const voiceBtn = document.getElementById('voiceBtn');
    const accountBtn = document.getElementById('accountBtn');
    const accountDropdown = document.getElementById('accountDropdown');
    const logoutBtn = document.getElementById('logoutBtn');
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const filters = {
        category: document.getElementById('categoryFilter'),
        price: document.getElementById('priceFilter'),
        rating: document.getElementById('ratingFilter'),
        distance: document.getElementById('distanceFilter'),
    };

    // Check authentication
    if (auth.isAuthenticated()) {
        showSearchSection();
        updateAccountMenu();
    } else {
        showLoginSection();
    }
    
    function updateAccountMenu() {
        const settingsLink = document.getElementById('settingsLink');
        if (settingsLink && auth.isAuthenticated()) {
            if (auth.isClient()) {
                settingsLink.href = 'client-settings.html';
                settingsLink.textContent = 'Client Settings';
            } else if (auth.isCompany()) {
                settingsLink.href = 'company-settings.html';
                settingsLink.textContent = 'Company Settings';
            }
            settingsLink.style.display = 'block';
        }
    }

    // Toggle login type
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Login form
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const userType = document.querySelector('.toggle-btn.active').dataset.type;

        const result = await auth.login(email, password, userType);
        if (result.success) {
            showSearchSection();
            updateAccountMenu();
        } else {
            alert('Login error: ' + (result.error || 'Invalid email or password'));
        }
    });

    // Account menu
    accountBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        accountDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!accountBtn.contains(e.target) && !accountDropdown.contains(e.target)) {
            accountDropdown.classList.remove('show');
        }
    });

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await auth.logout();
        });
    }

    // Search
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Voice input - using Web Speech API for real-time transcription
    voiceBtn.addEventListener('click', async () => {
        if (voiceService.isRecording) {
            voiceService.isRecording = false;
            voiceBtn.classList.remove('recording');
            return;
        }

        // Set up callback to update search input with transcription
        voiceService.onTranscription = (text, isFinal) => {
            searchInput.value = text;
            if (isFinal) {
                voiceBtn.classList.remove('recording');
                performSearch();
            }
        };

        voiceBtn.classList.add('recording');
        
        try {
            await voiceService.startSpeechRecognition();
        } catch (error) {
            console.error('Voice recognition error:', error);
            voiceBtn.classList.remove('recording');
            alert('Voice recognition failed. Please try again or type your search.');
        }
    });

    // Filter changes
    Object.values(filters).forEach(filter => {
        if (filter) {
            filter.addEventListener('change', performSearch);
        }
    });

    async function performSearch(allowEmpty = false) {
        const query = searchInput.value.trim();
        if (!query && !allowEmpty) {
            alert('Please enter a search query');
            return;
        }

        const filterValues = {
            category: filters.category?.value || '',
            price: filters.price?.value || '',
            rating: filters.rating?.value || '',
            distance: filters.distance?.value || '',
        };

        // Get user location for Google Maps search
        let userLocation = null;
        if (mapsService && mapsService.userLocation) {
            userLocation = mapsService.userLocation;
        }

        // Show loading indicator and clear previous results
        showLoading();

        try {
            // Try API first, fallback to mock data
            let result;
            try {
                result = await API.searchServices(query, { ...filterValues, user_location: userLocation });
            } catch (error) {
                console.warn('API failed, using mock data:', error);
                result = await MockAPI.searchServices(query, filterValues);
            }

            hideLoading();
            displayServices(result.services || []);
        } catch (error) {
            console.error('Search error:', error);
            hideLoading();
            alert('Search error. Please try again later.');
        }
    }

    function showLoading() {
        const grid = document.getElementById('servicesGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Searching...</p>
                </div>
            `;
        }
        servicesSection.style.display = 'block';
    }

    function hideLoading() {
        // Loading will be replaced by displayServices
    }

    function displayServices(services) {
        const grid = document.getElementById('servicesGrid');
        if (!grid) return;

        if (services.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>No services found</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = services.map(service => `
            <div class="service-card" onclick="window.location.href='service.html?id=${service.id}'">
                <img src="${service.image || 'https://via.placeholder.com/300x200'}" 
                     alt="${service.name}" 
                     class="service-card-image"
                     onerror="this.src='https://via.placeholder.com/300x200'">
                <div class="service-card-content">
                    <h3 class="service-card-title">${service.name}</h3>
                    <p class="service-card-company">${service.company || ''}</p>
                    <div class="service-card-info">
                        <div class="service-card-rating">
                            ${generateStars(service.rating)}
                            <span>${service.rating}</span>
                        </div>
                        <div class="service-card-price">${service.price ? '€' + service.price : 'Price on request'}</div>
                    </div>
                    ${service.distance ? `<p class="service-card-distance">${typeof mapsService !== 'undefined' ? mapsService.formatDistance(service.distance) : service.distance + ' км'}</p>` : ''}
                </div>
            </div>
        `).join('');

        servicesSection.style.display = 'block';
    }

    function generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '★'.repeat(fullStars);
        if (hasHalfStar) stars += '½';
        return stars;
    }

    function showLoginSection() {
        loginSection.style.display = 'block';
        searchSection.style.display = 'none';
        servicesSection.style.display = 'none';
    }

    function showSearchSection() {
        loginSection.style.display = 'none';
        searchSection.style.display = 'block';
        // Load initial services or suggestions
        loadInitialServices();
    }

    async function loadInitialServices() {
        showLoading();
        try {
            // Load all services on initial page load
            let result;
            try {
                result = await API.searchServices('', {});
            } catch (error) {
                console.warn('API failed, using mock data:', error);
                result = { services: MOCK_DATA.services };
            }
            hideLoading();
            displayServices(result.services || []);
        } catch (error) {
            console.error('Load services error:', error);
            hideLoading();
            displayServices(MOCK_DATA.services || []);
        }
    }

    // Load user's location for distance calculations
    if (typeof mapsService !== 'undefined') {
        mapsService.getUserLocation();
    }
});

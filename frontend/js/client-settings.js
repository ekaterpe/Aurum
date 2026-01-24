// Client Settings Page Logic
document.addEventListener('DOMContentLoaded', async () => {
    // Проверка типа пользователя
    if (!auth.isAuthenticated()) {
        alert('Please log in');
        window.location.href = 'index.html';
        return;
    }
    
    if (!auth.isClient()) {
        alert('This page is only available for clients');
        window.location.href = 'index.html';
        return;
    }
    
    auth.requireClient();

    // Initialize elements
    const basicSettingsForm = document.getElementById('basicSettingsForm');
    const bookingsCalendar = document.getElementById('bookingsCalendar');
    const bookingsList = document.getElementById('bookingsList');
    const bookingActions = document.getElementById('bookingActions');
    const bookingDetails = document.getElementById('bookingDetails');
    const rescheduleBtn = document.getElementById('rescheduleBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const rescheduleModal = document.getElementById('rescheduleModal');
    const cancelModal = document.getElementById('cancelModal');
    const rescheduleForm = document.getElementById('rescheduleForm');
    const closeRescheduleModal = document.getElementById('closeRescheduleModal');
    const closeCancelModal = document.getElementById('closeCancelModal');
    const cancelCancelBtn = document.getElementById('cancelCancelBtn');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    const blacklistList = document.getElementById('blacklistList');
    const clientRating = document.getElementById('clientRating');
    const clientStars = document.getElementById('clientStars');

    let selectedBooking = null;
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    // Initialize address autocomplete
    if (window.google) {
        mapsService.initAutocomplete('address', (location) => {
            console.log('Address selected:', location);
        });
    }

    // Load data
    await loadClientSettings();
    await loadBookings();
    await loadBlacklist();
    await loadClientRating();

    // Initialize calendar
    initBookingsCalendar();

    // Event listeners
    basicSettingsForm.addEventListener('submit', handleBasicSettings);
    rescheduleBtn.addEventListener('click', () => {
        rescheduleModal.classList.add('show');
    });
    cancelBtn.addEventListener('click', () => {
        cancelModal.classList.add('show');
    });
    closeRescheduleModal.addEventListener('click', () => {
        rescheduleModal.classList.remove('show');
    });
    closeCancelModal.addEventListener('click', () => {
        cancelModal.classList.remove('show');
    });
    cancelCancelBtn.addEventListener('click', () => {
        cancelModal.classList.remove('show');
    });
    confirmCancelBtn.addEventListener('click', handleCancelBooking);
    rescheduleForm.addEventListener('submit', handleReschedule);

    async function loadClientSettings() {
        try {
            // Загружаем настройки для текущего пользователя
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            
            const settings = await API.getClientSettings();
            if (settings && settings.id === currentUser.id) {
                document.getElementById('fullName').value = settings.full_name || '';
                document.getElementById('email').value = settings.email || '';
                document.getElementById('address').value = settings.address || '';
            } else {
                // Если нет настроек, используем данные из текущего пользователя
                document.getElementById('fullName').value = currentUser.full_name || '';
                document.getElementById('email').value = currentUser.email || '';
                document.getElementById('address').value = currentUser.address || '';
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            // Загружаем из localStorage только для текущего пользователя
            const currentUser = auth.currentUser;
            if (currentUser) {
                const settingsKey = `client_settings_${currentUser.id}`;
                const settings = JSON.parse(localStorage.getItem(settingsKey) || '{}');
                document.getElementById('fullName').value = settings.full_name || currentUser.full_name || '';
                document.getElementById('email').value = settings.email || currentUser.email || '';
                document.getElementById('address').value = settings.address || currentUser.address || '';
            }
        }
    }

    async function handleBasicSettings(e) {
        e.preventDefault();
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        
        const settings = {
            full_name: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            address: document.getElementById('address').value,
        };

        try {
            await API.updateClientSettings(settings);
            alert('Settings saved');
            // Сохраняем с привязкой к ID пользователя
            const settingsKey = `client_settings_${currentUser.id}`;
            localStorage.setItem(settingsKey, JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving settings:', error);
            const settingsKey = `client_settings_${currentUser.id}`;
            localStorage.setItem(settingsKey, JSON.stringify(settings));
            alert('Settings saved locally');
        }
    }

    async function loadBookings() {
        try {
            const result = await API.getBookings(auth.currentUser.id);
            const bookings = result.bookings || [];
            displayBookings(bookings);
        } catch (error) {
            console.error('Error loading bookings:', error);
            // Use mock data
            const result = await MockAPI.getBookings();
            displayBookings(result.bookings || []);
        }
    }

    function displayBookings(bookings) {
        bookingsList.innerHTML = bookings.map(booking => `
            <div class="booking-item" data-booking-id="${booking.id}">
                <div class="booking-header">
                    <div class="booking-service">${booking.serviceName || 'Service'}</div>
                    <span class="booking-status ${booking.status}">${getStatusText(booking.status)}</span>
                </div>
                <div class="booking-details">
                    Master: ${booking.masterName || 'Not specified'}<br>
                    Date: ${formatDate(booking.date)}<br>
                    Time: ${booking.time}
                </div>
            </div>
        `).join('');

        // Add click handlers
        document.querySelectorAll('.booking-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.booking-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                selectedBooking = bookings.find(b => b.id === parseInt(item.dataset.bookingId));
                showBookingActions(selectedBooking);
            });
        });
    }

    function showBookingActions(booking) {
        bookingDetails.innerHTML = `
            <h3>${booking.serviceName}</h3>
            <p>Master: ${booking.masterName}</p>
            <p>Date: ${formatDate(booking.date)}</p>
            <p>Time: ${booking.time}</p>
        `;
        bookingActions.style.display = 'block';
    }

    function initBookingsCalendar() {
        renderBookingsCalendar(currentMonth, currentYear);
    }

    function renderBookingsCalendar(month, year) {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

        let html = `
            <div class="calendar-month-header">
                <button class="calendar-nav-btn" onclick="changeBookingMonth(-1)">←</button>
                <span>${monthNames[month]} ${year}</span>
                <button class="calendar-nav-btn" onclick="changeBookingMonth(1)">→</button>
            </div>
        `;

        dayNames.forEach(day => {
            html += `<div class="calendar-day-header">${day}</div>`;
        });

        for (let i = 0; i < firstDay - 1; i++) {
            html += '<div class="calendar-day-cell"></div>';
        }

        // Get bookings for this month
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const monthBookings = bookings.filter(b => {
            const bookingDate = new Date(b.date);
            return bookingDate.getMonth() === month && bookingDate.getFullYear() === year;
        });

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = formatDateForAPI(date);
            const hasBooking = monthBookings.some(b => b.date === dateStr);
            const classes = ['calendar-day-cell'];
            if (hasBooking) classes.push('has-booking');

            html += `<div class="${classes.join(' ')}" data-date="${dateStr}">${day}</div>`;
        }

        bookingsCalendar.innerHTML = html;
    }

    window.changeBookingMonth = function(delta) {
        currentMonth += delta;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        } else if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderBookingsCalendar(currentMonth, currentYear);
    };

    async function handleReschedule(e) {
        e.preventDefault();
        if (!selectedBooking) return;

        const newDate = document.getElementById('newDate').value;
        const newTime = document.getElementById('newTime').value;

        try {
            await API.rescheduleBooking(selectedBooking.id, newDate, newTime);
            alert('Booking rescheduled');
            rescheduleModal.classList.remove('show');
            await loadBookings();
            renderBookingsCalendar(currentMonth, currentYear);
        } catch (error) {
            console.error('Error rescheduling:', error);
            alert('Error rescheduling booking');
        }
    }

    async function handleCancelBooking() {
        if (!selectedBooking) return;

        try {
            await API.cancelBooking(selectedBooking.id);
            alert('Booking cancelled');
            cancelModal.classList.remove('show');
            bookingActions.style.display = 'none';
            await loadBookings();
            renderBookingsCalendar(currentMonth, currentYear);
        } catch (error) {
            console.error('Error canceling:', error);
            alert('Error cancelling booking');
        }
    }

    async function loadBlacklist() {
        try {
            // This would come from API
            const blacklist = JSON.parse(localStorage.getItem('client_blacklist') || '[]');
            displayBlacklist(blacklist);
        } catch (error) {
            console.error('Error loading blacklist:', error);
        }
    }

    function displayBlacklist(blacklist) {
        if (blacklist.length === 0) {
            blacklistList.innerHTML = '<p>Blacklist is empty</p>';
            return;
        }

        blacklistList.innerHTML = blacklist.map(item => `
            <div class="blacklist-item">
                <span class="blacklist-name">${item.name}</span>
                <button class="btn btn-danger btn-sm" onclick="removeFromBlacklist(${item.id})">Удалить</button>
            </div>
        `).join('');
    }

    window.removeFromBlacklist = async function(companyId) {
        try {
            await API.removeFromBlacklist(companyId);
            await loadBlacklist();
        } catch (error) {
            console.error('Error removing from blacklist:', error);
            const blacklist = JSON.parse(localStorage.getItem('client_blacklist') || '[]');
            const filtered = blacklist.filter(item => item.id !== companyId);
            localStorage.setItem('client_blacklist', JSON.stringify(filtered));
            await loadBlacklist();
        }
    };

    async function loadClientRating() {
        try {
            // This would come from API
            const rating = parseFloat(localStorage.getItem('client_rating') || '5.0');
            clientRating.textContent = rating.toFixed(1);
            clientStars.innerHTML = generateStars(rating);
        } catch (error) {
            console.error('Error loading rating:', error);
        }
    }

    function getStatusText(status) {
        const statusMap = {
            confirmed: 'Confirmed',
            pending: 'Pending',
            cancelled: 'Cancelled',
        };
        return statusMap[status] || status;
    }

    function generateStars(rating) {
        const fullStars = Math.floor(rating);
        return '★'.repeat(fullStars);
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    }

    function formatDateForAPI(date) {
        return date.toISOString().split('T')[0];
    }
});


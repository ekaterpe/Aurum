// Company Settings Page Logic
document.addEventListener('DOMContentLoaded', async () => {
    // Проверка типа пользователя
    if (!auth.isAuthenticated()) {
        alert('Please log in');
        window.location.href = 'index.html';
        return;
    }
    
    if (!auth.isCompany()) {
        alert('This page is only available for companies');
        window.location.href = 'index.html';
        return;
    }
    
    auth.requireCompany();

    // Initialize elements
    const companyInfoForm = document.getElementById('companyInfoForm');
    const breakSettingsForm = document.getElementById('breakSettingsForm');
    const cancellationPolicyForm = document.getElementById('cancellationPolicyForm');
    const workingHoursForm = document.getElementById('workingHoursForm');
    const designForm = document.getElementById('designForm');
    const billingForm = document.getElementById('billingForm');
    const addMasterBtn = document.getElementById('addMasterBtn');
    const mastersEditor = document.getElementById('mastersEditor');
    const masterModal = document.getElementById('masterModal');
    const masterForm = document.getElementById('masterForm');
    const closeMasterModal = document.getElementById('closeMasterModal');
    const addPromotionBtn = document.getElementById('addPromotionBtn');
    const promotionsList = document.getElementById('promotionsList');
    const promotionModal = document.getElementById('promotionModal');
    const promotionForm = document.getElementById('promotionForm');
    const closePromotionModal = document.getElementById('closePromotionModal');
    const tariffsGrid = document.getElementById('tariffsGrid');
    const clientBlacklistList = document.getElementById('clientBlacklistList');
    const blacklistSearch = document.getElementById('blacklistSearch');
    const designPreview = document.getElementById('designPreview');
    const deductionType = document.getElementById('deductionType');
    const deductionValueGroup = document.getElementById('deductionValueGroup');
    const deductionValueLabel = document.getElementById('deductionValueLabel');

    let editingMasterId = null;
    let editingPromotionId = null;

    // Load data
    await loadCompanySettings();
    await loadMasters();
    await loadPromotions();
    await loadTariffs();
    await loadClientBlacklist();

    // Event listeners
    companyInfoForm.addEventListener('submit', handleCompanyInfo);
    breakSettingsForm.addEventListener('submit', handleBreakSettings);
    cancellationPolicyForm.addEventListener('submit', handleCancellationPolicy);
    workingHoursForm.addEventListener('submit', handleWorkingHours);
    designForm.addEventListener('submit', handleDesign);
    billingForm.addEventListener('submit', handleBilling);
    addMasterBtn.addEventListener('click', () => {
        editingMasterId = null;
        document.getElementById('masterModalTitle').textContent = 'Add Master';
        masterForm.reset();
        masterModal.classList.add('show');
    });
    closeMasterModal.addEventListener('click', () => {
        masterModal.classList.remove('show');
    });
    masterForm.addEventListener('submit', handleMasterSubmit);
    addPromotionBtn.addEventListener('click', () => {
        editingPromotionId = null;
        promotionForm.reset();
        promotionModal.classList.add('show');
    });
    closePromotionModal.addEventListener('click', () => {
        promotionModal.classList.remove('show');
    });
    promotionForm.addEventListener('submit', handlePromotionSubmit);
    deductionType.addEventListener('change', updateDeductionType);
    blacklistSearch.addEventListener('input', filterBlacklist);

    // Initialize working hours
    initWorkingHours();

    // Initialize design preview
    initDesignPreview();

    async function handleCompanyInfo(e) {
        e.preventDefault();
        const companyName = document.getElementById('companyName').value;
        try {
            await API.updateCompanySettings({ name: companyName });
            alert('Company name saved');
        } catch (error) {
            console.error('Error saving company name:', error);
            alert('Error saving company name');
        }
    }

    async function loadCompanySettings() {
        try {
            const settings = await API.getCompanySettings();
            if (settings) {
                document.getElementById('companyName').value = settings.name || '';
                document.getElementById('breakDuration').value = settings.break_duration || 15;
                document.getElementById('minCancelHours').value = settings.min_cancel_hours || 24;
                document.getElementById('cancelPenalty').value = settings.cancel_penalty || 0;
                document.getElementById('allowReschedule').checked = settings.allow_reschedule !== false;
                document.getElementById('breakStart').value = settings.break_start || '13:00';
                document.getElementById('breakEnd').value = settings.break_end || '14:00';
                document.getElementById('billingFrequency').value = settings.billing_frequency || 'monthly';
                document.getElementById('autoDeduction').checked = settings.auto_deduction !== false;
                document.getElementById('deductionType').value = settings.deduction_type || 'percentage';
                document.getElementById('deductionValue').value = settings.deduction_value || 10;
                updateDeductionType();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async function handleBreakSettings(e) {
        e.preventDefault();
        const breakDuration = document.getElementById('breakDuration').value;
        try {
            await API.updateCompanySettings({ break_duration: parseInt(breakDuration) });
            alert('Settings saved');
        } catch (error) {
            console.error('Error saving break settings:', error);
            alert('Error saving settings');
        }
    }

    async function handleCancellationPolicy(e) {
        e.preventDefault();
        const policy = {
            min_cancel_hours: parseInt(document.getElementById('minCancelHours').value),
            cancel_penalty: parseInt(document.getElementById('cancelPenalty').value),
            allow_reschedule: document.getElementById('allowReschedule').checked,
        };
        try {
            await API.updateCompanySettings(policy);
            alert('Settings saved');
        } catch (error) {
            console.error('Error saving policy:', error);
            alert('Error saving settings');
        }
    }

    async function handleWorkingHours(e) {
        e.preventDefault();
        const workingHours = {};
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        days.forEach(day => {
            const enabled = document.getElementById(`${day}Enabled`).checked;
            const start = document.getElementById(`${day}Start`).value;
            const end = document.getElementById(`${day}End`).value;
            workingHours[day] = { enabled, start, end };
        });
        workingHours.break_start = document.getElementById('breakStart').value;
        workingHours.break_end = document.getElementById('breakEnd').value;

        try {
            await API.updateCompanySettings({ working_hours: workingHours });
            alert('Settings saved');
        } catch (error) {
            console.error('Error saving working hours:', error);
            alert('Error saving settings');
        }
    }

    function initWorkingHours() {
        const days = [
            { id: 'monday', name: 'Monday' },
            { id: 'tuesday', name: 'Tuesday' },
            { id: 'wednesday', name: 'Wednesday' },
            { id: 'thursday', name: 'Thursday' },
            { id: 'friday', name: 'Friday' },
            { id: 'saturday', name: 'Saturday' },
            { id: 'sunday', name: 'Sunday' },
        ];

        const grid = document.getElementById('workingHoursGrid');
        grid.innerHTML = days.map(day => `
            <div class="working-day">
                <div class="day-label">
                    <input type="checkbox" id="${day.id}Enabled" checked>
                    <label for="${day.id}Enabled">${day.name}</label>
                </div>
                <div class="time-inputs">
                    <input type="time" id="${day.id}Start" value="09:00">
                    <span>—</span>
                    <input type="time" id="${day.id}End" value="18:00">
                </div>
            </div>
        `).join('');
    }

    async function loadMasters() {
        try {
            const result = await API.getMasters();
            displayMasters(result.masters || []);
        } catch (error) {
            console.error('Error loading masters:', error);
        }
    }

    function displayMasters(masters) {
        if (masters.length === 0) {
            mastersEditor.innerHTML = '<p>No masters added</p>';
            return;
        }

        mastersEditor.innerHTML = masters.map(master => `
            <div class="master-editor-item">
                <img src="${master.photo || 'https://via.placeholder.com/60'}" 
                     alt="${master.name}" 
                     class="master-editor-photo"
                     onerror="this.src='https://via.placeholder.com/60'">
                <div class="master-editor-info">
                    <div class="master-editor-name">${master.name}</div>
                    <div class="master-editor-specialization">${master.specialization}</div>
                </div>
                <div class="master-editor-actions">
                    <button class="btn btn-outline btn-sm" onclick="editMaster(${master.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteMaster(${master.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    window.editMaster = function(masterId) {
        editingMasterId = masterId;
        // Load master data and populate form
        document.getElementById('masterModalTitle').textContent = 'Edit Master';
        masterModal.classList.add('show');
    };

    window.deleteMaster = async function(masterId) {
        if (!confirm('Delete master?')) return;
        try {
            await API.deleteMaster(masterId);
            await loadMasters();
        } catch (error) {
            console.error('Error deleting master:', error);
            alert('Error deleting master');
        }
    };

    async function handleMasterSubmit(e) {
        e.preventDefault();
        const masterData = {
            name: document.getElementById('masterName').value,
            photo: document.getElementById('masterPhoto').value,
            specialization: document.getElementById('masterSpecialization').value,
        };

        try {
            if (editingMasterId) {
                await API.updateMaster(editingMasterId, masterData);
            } else {
                await API.createMaster(masterData);
            }
            masterModal.classList.remove('show');
            await loadMasters();
        } catch (error) {
            console.error('Error saving master:', error);
            alert('Error saving settings');
        }
    }

    function initDesignPreview() {
        const primaryColor = document.getElementById('primaryColor');
        const secondaryColor = document.getElementById('secondaryColor');
        const logoUrl = document.getElementById('logoUrl');

        [primaryColor, secondaryColor, logoUrl].forEach(input => {
            if (input) {
                input.addEventListener('input', updateDesignPreview);
            }
        });
    }

    function updateDesignPreview() {
        const primaryColor = document.getElementById('primaryColor').value;
        const secondaryColor = document.getElementById('secondaryColor').value;
        const logoUrl = document.getElementById('logoUrl').value;

        designPreview.style.setProperty('--preview-primary', primaryColor);
        designPreview.style.setProperty('--preview-secondary', secondaryColor);
        
        if (logoUrl) {
            const logo = designPreview.querySelector('.preview-logo') || document.createElement('img');
            logo.src = logoUrl;
            logo.className = 'preview-logo';
            logo.style.maxWidth = '100px';
            if (!designPreview.querySelector('.preview-logo')) {
                designPreview.querySelector('.preview-header').appendChild(logo);
            }
        }
    }

    async function handleDesign(e) {
        e.preventDefault();
        const design = {
            primary_color: document.getElementById('primaryColor').value,
            secondary_color: document.getElementById('secondaryColor').value,
            logo_url: document.getElementById('logoUrl').value,
        };

        try {
            await API.updateCompanySettings({ design });
            alert('Design saved');
        } catch (error) {
            console.error('Error saving design:', error);
            alert('Error saving settings');
        }
    }

    async function loadTariffs() {
        try {
            const result = await MockAPI.getTariffs();
            displayTariffs(result.tariffs || []);
        } catch (error) {
            console.error('Error loading tariffs:', error);
        }
    }

    function displayTariffs(tariffs) {
        tariffsGrid.innerHTML = tariffs.map(tariff => `
            <div class="tariff-card" data-tariff-id="${tariff.id}">
                <div class="tariff-name">${tariff.name}</div>
                <div class="tariff-price">${tariff.price === 0 ? 'Free' : `€${tariff.price}/month`}</div>
                <ul class="tariff-features">
                    ${tariff.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
                <button class="btn btn-primary" onclick="selectTariff(${tariff.id})">Select</button>
            </div>
        `).join('');
    }

    window.selectTariff = async function(tariffId) {
        try {
            await API.updateCompanySettings({ tariff_id: tariffId });
            document.querySelectorAll('.tariff-card').forEach(card => card.classList.remove('selected'));
            document.querySelector(`[data-tariff-id="${tariffId}"]`).classList.add('selected');
            alert('Tariff selected');
        } catch (error) {
            console.error('Error selecting tariff:', error);
            alert('Error selecting tariff');
        }
    };

    async function loadPromotions() {
        try {
            const result = await API.getPromotions();
            displayPromotions(result.promotions || []);
        } catch (error) {
            console.error('Error loading promotions:', error);
        }
    }

    function displayPromotions(promotions) {
        if (promotions.length === 0) {
            promotionsList.innerHTML = '<p>No promotions created</p>';
            return;
        }

        promotionsList.innerHTML = promotions.map(promotion => `
            <div class="promotion-item">
                <div class="promotion-info">
                    <div class="promotion-title">${promotion.type === 'visit_discount' ? 'Visit Discount' : 'Discount'}</div>
                    <div class="promotion-description">${promotion.description}</div>
                </div>
                <div class="promotion-discount">-${promotion.discount}%</div>
                <button class="btn btn-danger btn-sm" onclick="deletePromotion(${promotion.id})">Delete</button>
            </div>
        `).join('');
    }

    async function handlePromotionSubmit(e) {
        e.preventDefault();
        const type = document.getElementById('promotionType').value;
        const promotionData = {
            type,
            discount: parseInt(document.getElementById('promotionDiscount').value),
            description: document.getElementById('promotionDescription').value,
        };

        if (type === 'visit_discount') {
            promotionData.visit_count = parseInt(document.getElementById('visitCount').value);
        }

        try {
            if (editingPromotionId) {
                await API.updatePromotion(editingPromotionId, promotionData);
            } else {
                await API.createPromotion(promotionData);
            }
            promotionModal.classList.remove('show');
            await loadPromotions();
        } catch (error) {
            console.error('Error saving promotion:', error);
            alert('Error saving settings');
        }
    }

    window.deletePromotion = async function(promotionId) {
        if (!confirm('Delete promotion?')) return;
        try {
            await API.deletePromotion(promotionId);
            await loadPromotions();
        } catch (error) {
            console.error('Error deleting promotion:', error);
            alert('Error deleting master');
        }
    };

    // Show/hide visit count field based on promotion type
    document.getElementById('promotionType').addEventListener('change', (e) => {
        const visitCountGroup = document.getElementById('visitCountGroup');
        visitCountGroup.style.display = e.target.value === 'visit_discount' ? 'block' : 'none';
    });

    async function loadClientBlacklist() {
        try {
            // This would come from API
            const blacklist = JSON.parse(localStorage.getItem('company_blacklist') || '[]');
            displayClientBlacklist(blacklist);
        } catch (error) {
            console.error('Error loading blacklist:', error);
        }
    }

    function displayClientBlacklist(blacklist) {
        if (blacklist.length === 0) {
            clientBlacklistList.innerHTML = '<p>Blacklist is empty</p>';
            return;
        }

        clientBlacklistList.innerHTML = blacklist.map(item => `
            <div class="blacklist-item">
                <span class="blacklist-name">${item.name}</span>
                <button class="btn btn-danger btn-sm" onclick="removeClientFromBlacklist(${item.id})">Remove</button>
            </div>
        `).join('');
    }

    function filterBlacklist() {
        const query = blacklistSearch.value.toLowerCase();
        document.querySelectorAll('.blacklist-item').forEach(item => {
            const name = item.querySelector('.blacklist-name').textContent.toLowerCase();
            item.style.display = name.includes(query) ? 'block' : 'none';
        });
    }

    window.removeClientFromBlacklist = async function(clientId) {
        // This would call API
        const blacklist = JSON.parse(localStorage.getItem('company_blacklist') || '[]');
        const filtered = blacklist.filter(item => item.id !== clientId);
        localStorage.setItem('company_blacklist', JSON.stringify(filtered));
        await loadClientBlacklist();
    };

    async function handleBilling(e) {
        e.preventDefault();
        const billing = {
            billing_frequency: document.getElementById('billingFrequency').value,
            auto_deduction: document.getElementById('autoDeduction').checked,
            deduction_type: document.getElementById('deductionType').value,
            deduction_value: parseInt(document.getElementById('deductionValue').value),
        };

        try {
            await API.updateCompanySettings({ billing });
            alert('Settings saved');
        } catch (error) {
            console.error('Error saving billing:', error);
            alert('Error saving settings');
        }
    }

    function updateDeductionType() {
        const type = deductionType.value;
        if (type === 'percentage') {
            deductionValueLabel.textContent = 'Percentage of earnings';
            document.getElementById('deductionValue').max = 100;
        } else {
            deductionValueLabel.textContent = 'Fixed Amount (€)';
            document.getElementById('deductionValue').max = 999999;
        }
    }
});


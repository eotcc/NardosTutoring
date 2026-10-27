// Days Configuration
const DAYS = [
    { id: 'mon', name: 'Monday' },
    { id: 'tue', name: 'Tuesday' },
    { id: 'wed', name: 'Wednesday' },
    { id: 'thu', name: 'Thursday' },
    { id: 'fri', name: 'Friday' },
    { id: 'sat', name: 'Saturday' },
    { id: 'sun', name: 'Sunday' }
];

// Global State storing active selected days and stored entries
let selectedDaysState = {};
let records = JSON.parse(localStorage.getItem('student_registrations') || '[]');

// Initialize App on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    renderDayCheckboxes();
    updateRecordsBadge();
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// REDIRECT TO ADMIN DASHBOARD IF USER CLICKS BROWSER BACK BUTTON
window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
        window.location.href = 'index.html';
    }
});

// 1. Render Day Selector Checkboxes
function renderDayCheckboxes() {
    const container = document.getElementById('day-buttons-container');
    if (!container) return;

    container.innerHTML = DAYS.map(day => `
        <label class="cursor-pointer select-none">
            <input type="checkbox" id="check-${day.id}" class="sr-only peer" onchange="toggleDay('${day.id}', '${day.name}')">
            <div class="px-3 py-2.5 text-center text-xs font-medium rounded-xl border border-slate-200 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 hover:bg-slate-50 transition-all shadow-sm">
                ${day.name.slice(0, 3)}
            </div>
        </label>
    `).join('');
}

// 2. Handle Day Selection Toggle & Dynamic Time Inputs
function toggleDay(dayId, dayName) {
    const checkbox = document.getElementById(`check-${dayId}`);
    if (checkbox.checked) {
        selectedDaysState[dayId] = { name: dayName, startTime: '09:00', endTime: '17:00' };
    } else {
        delete selectedDaysState[dayId];
    }
    renderScheduleTimeInputs();
}

function renderScheduleTimeInputs() {
    const container = document.getElementById('schedule-slots-container');
    if (!container) return;

    const activeDays = Object.keys(selectedDaysState);

    if (activeDays.length === 0) {
        container.innerHTML = `
            <div id="empty-days-placeholder" class="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <i data-lucide="calendar" class="w-8 h-8 text-slate-400 mx-auto mb-2"></i>
                <p class="text-sm text-slate-500 font-medium">No days selected yet.</p>
                <p class="text-xs text-slate-400 mt-1">Select one or more days above to configure start and end times.</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    container.innerHTML = activeDays.map(dayId => {
        const day = selectedDaysState[dayId];
        return `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl gap-3 animate-fade-in">
                <div class="flex items-center space-x-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <span class="font-semibold text-sm text-slate-800">${day.name}</span>
                </div>
                <div class="flex items-center space-x-3 text-xs">
                    <div class="flex items-center space-x-1.5">
                        <span class="text-slate-500 font-medium">Start:</span>
                        <input type="time" value="${day.startTime}" onchange="updateDayTime('${dayId}', 'startTime', this.value)" required class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700">
                    </div>
                    <span class="text-slate-400">-</span>
                    <div class="flex items-center space-x-1.5">
                        <span class="text-slate-500 font-medium">End:</span>
                        <input type="time" value="${day.endTime}" onchange="updateDayTime('${dayId}', 'endTime', this.value)" required class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700">
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function updateDayTime(dayId, field, value) {
    if (selectedDaysState[dayId]) {
        selectedDaysState[dayId][field] = value;
    }
}

// 3. Unique Code Generator: [First Initial][Last Initial][4-Digit Random Number]
function generateUniqueCode(firstName, lastName) {
    const firstInitial = firstName.trim().charAt(0).toUpperCase() || 'X';
    const lastInitial = lastName.trim().charAt(0).toUpperCase() || 'X';
    const randomNumber = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    
    return `${firstInitial}${lastInitial}${randomNumber}`;
}

// 4. Form Submission Handler
function handleFormSubmit(event) {
    event.preventDefault();

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const grade = document.getElementById('grade').value;
    const phone = document.getElementById('phone').value.trim();

    if (Object.keys(selectedDaysState).length === 0) {
        showToast('Please select at least one day for attendance.', 'error');
        return;
    }

    // Generate code directly in JS variable
    const generatedCode = generateUniqueCode(firstName, lastName);

    // Data object structure ready for storage / Firebase
    const registrationPayload = {
        id: generatedCode,
        createdAt: new Date().toISOString(),
        firstName: firstName,
        lastName: lastName,
        fullName: `${firstName} ${lastName}`,
        grade: grade,
        phone: phone,
        schedules: { ...selectedDaysState }
    };

    // Store entry locally
    records.unshift(registrationPayload);
    localStorage.setItem('student_registrations', JSON.stringify(records));

    // Reset Form & Feedback
    resetForm();
    updateRecordsBadge();
    showToast(`Registration Complete! Code generated: ${generatedCode}`, 'success');
    
    // Automatically redirect back to the Admin Dashboard page after a short delay
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// Reset Form Controls
function resetForm() {
    const form = document.getElementById('registrationForm');
    if (form) form.reset();
    selectedDaysState = {};
    DAYS.forEach(day => {
        const el = document.getElementById(`check-${day.id}`);
        if (el) el.checked = false;
    });
    renderScheduleTimeInputs();
}

// 5. Render Recorded Submissions
function renderRecords(dataToRender = records) {
    const container = document.getElementById('records-list-container');
    if (!container) return;
    
    if (dataToRender.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <i data-lucide="folder-open" class="w-10 h-10 text-slate-300 mx-auto mb-3"></i>
                <h3 class="text-slate-600 font-semibold text-base">No Recorded Entries Found</h3>
                <p class="text-slate-400 text-xs mt-1">Submit a registration form to view recorded student entries here.</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    container.innerHTML = dataToRender.map(entry => `
        <div class="border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 transition-all bg-white shadow-sm">
            <div class="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
                <div class="flex items-center space-x-3">
                    <div class="bg-indigo-100 text-indigo-700 font-bold px-3 py-2 rounded-xl text-base tracking-wider font-mono">
                        ${entry.id}
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-900 text-lg leading-snug">${entry.fullName}</h3>
                        <p class="text-xs text-slate-500 flex items-center gap-2">
                            <span><i data-lucide="graduation-cap" class="inline w-3.5 h-3.5"></i> ${entry.grade}</span> • 
                            <span><i data-lucide="phone" class="inline w-3.5 h-3.5"></i> ${entry.phone}</span>
                        </p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-medium">
                        Added ${new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                    <button onclick="deleteRecord('${entry.id}')" title="Delete record" class="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>

            <!-- Daily Schedules -->
            <div>
                <h4 class="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">Assigned Time Slots</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    ${Object.values(entry.schedules).map(s => `
                        <div class="bg-slate-50 border border-slate-200/60 px-3 py-2 rounded-xl flex items-center justify-between text-xs">
                            <span class="font-semibold text-indigo-900">${s.name}</span>
                            <span class="font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">${formatTime(s.startTime)} - ${formatTime(s.endTime)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Helper: Format 24hr time to 12hr AM/PM
function formatTime(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
}

// Filter Records Search
function filterRecords() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    const query = searchInput.value.toLowerCase();
    const filtered = records.filter(r => 
        r.fullName.toLowerCase().includes(query) || 
        r.id.toLowerCase().includes(query) ||
        r.grade.toLowerCase().includes(query) ||
        r.phone.includes(query)
    );
    renderRecords(filtered);
}

// Delete Single Record
function deleteRecord(id) {
    records = records.filter(r => r.id !== id);
    localStorage.setItem('student_registrations', JSON.stringify(records));
    renderRecords();
    updateRecordsBadge();
    showToast('Record deleted.', 'info');
}

// Clear All Records
function clearAllRecords() {
    if (records.length === 0) return;
    records = [];
    localStorage.removeItem('student_registrations');
    renderRecords();
    updateRecordsBadge();
    showToast('All entries cleared.', 'info');
}

// Switch Navigation Tabs
function switchTab(tabName) {
    const registerTab = document.getElementById('tab-register');
    const recordsTab = document.getElementById('tab-records');
    const regBtn = document.getElementById('nav-register-btn');
    const recBtn = document.getElementById('nav-records-btn');

    if (!registerTab || !recordsTab) return;

    if (tabName === 'register') {
        registerTab.classList.remove('hidden');
        recordsTab.classList.add('hidden');
        
        if (regBtn) regBtn.className = "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 bg-white text-indigo-600 shadow-sm";
        if (recBtn) recBtn.className = "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 text-slate-600 hover:text-slate-900";
    } else {
        recordsTab.classList.remove('hidden');
        registerTab.classList.add('hidden');
        
        if (recBtn) recBtn.className = "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 bg-white text-indigo-600 shadow-sm";
        if (regBtn) regBtn.className = "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 text-slate-600 hover:text-slate-900";
        
        renderRecords();
    }
}

function updateRecordsBadge() {
    const badge = document.getElementById('records-count-badge');
    if (badge) badge.innerText = records.length;
}

// Toast Feedback Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    if (!toast || !toastMsg || !toastIcon) return;

    toastMsg.innerText = message;
    
    if (type === 'error') {
        toastIcon.setAttribute('data-lucide', 'alert-circle');
        toastIcon.className = "w-5 h-5 text-rose-400";
    } else if (type === 'info') {
        toastIcon.setAttribute('data-lucide', 'info');
        toastIcon.className = "w-5 h-5 text-sky-400";
    } else {
        toastIcon.setAttribute('data-lucide', 'check-circle-2');
        toastIcon.className = "w-5 h-5 text-emerald-400";
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();

    toast.classList.remove('translate-x-full');
    setTimeout(() => {
        toast.classList.add('translate-x-full');
    }, 3500);
}

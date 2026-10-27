import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-analytics.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

// YOUR NEW FIREBASE CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyB3E6n_VRbeW0MfEvksjvLFTwvDmx0Jk9I",
    authDomain: "nrdstut.firebaseapp.com",
    projectId: "nrdstut",
    storageBucket: "nrdstut.firebasestorage.app",
    messagingSenderId: "4814258678",
    appId: "1:4814258678:web:5f8ea96c5c930eb1c847d7",
    measurementId: "G-NWWNY3VHP6"
};

// INITIALIZE FIREBASE & FIRESTORE
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// DAYS CONFIGURATION
const DAYS = [
    { id: 'mon', name: 'Monday' },
    { id: 'tue', name: 'Tuesday' },
    { id: 'wed', name: 'Wednesday' },
    { id: 'thu', name: 'Thursday' },
    { id: 'fri', name: 'Friday' },
    { id: 'sat', name: 'Saturday' },
    { id: 'sun', name: 'Sunday' }
];

let selectedDaysState = {};
let records = [];

// INITIALIZE APP ON DOM LOAD
document.addEventListener('DOMContentLoaded', async () => {
    renderDayCheckboxes();
    await fetchRecordsFromFirebase();
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// FETCH RECORDS FROM FIRESTORE
async function fetchRecordsFromFirebase() {
    try {
        const querySnapshot = await getDocs(collection(db, "student_registrations"));
        records = [];
        querySnapshot.forEach((docSnap) => {
            records.push({ firestoreId: docSnap.id, ...docSnap.data() });
        });
        updateRecordsBadge();
        if (document.getElementById('records-list-container')) {
            renderRecords();
        }
    } catch (error) {
        console.error("Error fetching records:", error);
        showToast("Error loading student records.", "error");
    }
}

// 1. RENDER DAY SELECTOR CHECKBOXES
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

// 2. HANDLE DAY SELECTION & TIME INPUTS
window.toggleDay = function(dayId, dayName) {
    const checkbox = document.getElementById(`check-${dayId}`);
    if (checkbox.checked) {
        selectedDaysState[dayId] = { name: dayName, startTime: '09:00', endTime: '17:00' };
    } else {
        delete selectedDaysState[dayId];
    }
    renderScheduleTimeInputs();
};

function renderScheduleTimeInputs() {
    const container = document.getElementById('schedule-slots-container');
    if (!container) return;

    const activeDays = Object.keys(selectedDaysState);

    if (activeDays.length === 0) {
        container.innerHTML = `
            <div id="empty-days-placeholder" class="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <p class="text-sm text-slate-500 font-medium">No days selected yet.</p>
                <p class="text-xs text-slate-400 mt-1">Select one or more days above to configure start and end times.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = activeDays.map(dayId => {
        const day = selectedDaysState[dayId];
        return `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl gap-3">
                <div class="flex items-center space-x-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <span class="font-semibold text-sm text-slate-800">${day.name}</span>
                </div>
                <div class="flex items-center space-x-3 text-xs">
                    <div class="flex items-center space-x-1.5">
                        <span class="text-slate-500 font-medium">Start:</span>
                        <input type="time" value="${day.startTime}" onchange="updateDayTime('${dayId}', 'startTime', this.value)" required class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg">
                    </div>
                    <span class="text-slate-400">-</span>
                    <div class="flex items-center space-x-1.5">
                        <span class="text-slate-500 font-medium">End:</span>
                        <input type="time" value="${day.endTime}" onchange="updateDayTime('${dayId}', 'endTime', this.value)" required class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg">
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

window.updateDayTime = function(dayId, field, value) {
    if (selectedDaysState[dayId]) {
        selectedDaysState[dayId][field] = value;
    }
};

// 3. GENERATE UNIQUE CODE
function generateUniqueCode(firstName, lastName) {
    const firstInitial = firstName.trim().charAt(0).toUpperCase() || 'X';
    const lastInitial = lastName.trim().charAt(0).toUpperCase() || 'X';
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `${firstInitial}${lastInitial}${randomNumber}`;
}

// 4. SAVE REGISTRATION TO FIRESTORE
window.handleFormSubmit = async function(event) {
    event.preventDefault();

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const grade = document.getElementById('grade').value;
    const phone = document.getElementById('phone').value.trim();

    if (Object.keys(selectedDaysState).length === 0) {
        showToast('Please select at least one day for attendance.', 'error');
        return;
    }

    const generatedCode = generateUniqueCode(firstName, lastName);

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

    try {
        await addDoc(collection(db, "student_registrations"), registrationPayload);
        resetForm();
        await fetchRecordsFromFirebase();
        showToast(`Registration Complete! Code: ${generatedCode}`, 'success');
        
        setTimeout(() => {
            window.location.href = 'Dashbrd.html';
        }, 1500);
    } catch (error) {
        console.error("Error saving record to Firebase:", error);
        showToast("Failed to save registration.", "error");
    }
};

// RESET FORM
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

// DELETE RECORD FROM FIRESTORE
window.deleteRecord = async function(firestoreId) {
    try {
        await deleteDoc(doc(db, "student_registrations", firestoreId));
        await fetchRecordsFromFirebase();
        showToast('Record deleted.', 'info');
    } catch (error) {
        console.error("Error deleting document:", error);
        showToast('Failed to delete record.', 'error');
    }
};

function updateRecordsBadge() {
    const badge = document.getElementById('records-count-badge');
    if (badge) badge.innerText = records.length;
}

// TOAST NOTIFICATIONS
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    if (!toast || !toastMsg || !toastIcon) return;

    toastMsg.innerText = message;
    
    if (type === 'error') {
        toastIcon.setAttribute('data-lucide', 'alert-circle');

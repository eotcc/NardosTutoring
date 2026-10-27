import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-analytics.js";
import { 
    getAuth, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

// YOUR FIREBASE CONFIGURATION (`nrdstut`)
const firebaseConfig = {
    apiKey: "AIzaSyB3E6n_VRbeW0MfEvksjvLFTwvDmx0Jk9I",
    authDomain: "nrdstut.firebaseapp.com",
    projectId: "nrdstut",
    storageBucket: "nrdstut.firebasestorage.app",
    messagingSenderId: "4814258678",
    appId: "1:4814258678:web:5f8ea96c5c930eb1c847d7",
    measurementId: "G-NWWNY3VHP6"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

let allStudents = [];

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await fetchStudentSchedules();
        } else {
            window.location.href = 'admin.html';
        }
    });
});

async function fetchStudentSchedules() {
    try {
        const querySnapshot = await getDocs(collection(db, "student_registrations"));
        allStudents = [];
        querySnapshot.forEach((docSnap) => {
            allStudents.push({ firestoreId: docSnap.id, ...docSnap.data() });
        });
        renderStudentList(allStudents);
        updateCountBadge(allStudents.length);
    } catch (error) {
        console.error("Error fetching schedules:", error);
        showToast("Failed to load student schedules.", "error");
    }
}

function renderStudentList(students) {
    const container = document.getElementById('attendance-list-container');
    if (!container) return;

    if (students.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <i data-lucide="users" class="w-10 h-10 text-slate-300 mx-auto mb-2"></i>
                <h3 class="text-slate-600 font-semibold text-sm">No Student Records Found</h3>
                <p class="text-slate-400 text-xs mt-1">Register students first to view their schedules here.</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    container.innerHTML = students.map(student => `
        <div class="student-card">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
                <div class="flex items-center space-x-3">
                    <!-- ID Code Badge -->
                    <span class="bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-xl text-sm font-mono tracking-wider">
                        ${student.id || 'N/A'}
                    </span>
                    <div>
                        <h3 class="font-bold text-slate-900 text-base">${student.fullName || `${student.firstName} ${student.lastName}`}</h3>
                        <p class="text-xs text-slate-500">Grade: <span class="font-medium text-slate-700">${student.grade}</span></p>
                    </div>
                </div>
                <span class="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 w-fit">
                    Phone: ${student.phone}
                </span>
            </div>

            <!-- Days & Hours Slots -->
            <div>
                <h4 class="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Enrolled Days & Hours</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    ${student.schedules ? Object.values(student.schedules).map(slot => `
                        <div class="schedule-pill">
                            <span class="schedule-day">${slot.name}</span>
                            <span class="schedule-hours">${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}</span>
                        </div>
                    `).join('') : '<p class="text-xs text-slate-400 italic">No schedule slots assigned.</p>'}
                </div>
            </div>
        </div>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Format 24hr time to 12hr AM/PM
function formatTime(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
}

window.filterAttendanceList = function() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const filtered = allStudents.filter(s => 
        (s.fullName && s.fullName.toLowerCase().includes(query)) || 
        (s.id && s.id.toLowerCase().includes(query)) ||
        (s.grade && s.grade.toLowerCase().includes(query))
    );
    renderStudentList(filtered);
    updateCountBadge(filtered.length);
};

function updateCountBadge(count) {
    const badge = document.getElementById('total-count');
    if (badge) badge.innerText = `${count} Student${count === 1 ? '' : 's'}`;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    if (!toast || !toastMsg || !toastIcon) return;
    toastMsg.innerText = message;
    toastIcon.setAttribute('data-lucide', type === 'error' ? 'alert-circle' : 'check-circle-2');
    if (typeof lucide !== 'undefined') lucide.createIcons();

    toast.classList.remove('translate-x-full');
    setTimeout(() => toast.classList.add('translate-x-full'), 3500);
}

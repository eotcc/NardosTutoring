import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-analytics.js";
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    addDoc
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
const db = getFirestore(app);

let currentStudent = null;

// 1. VERIFY STUDENT CODE FROM REGISTRATION RECORDS
window.verifyStudentCode = async function(event) {
    event.preventDefault();
    const codeInput = document.getElementById('studentCodeInput');
    const enteredCode = codeInput.value.trim().toUpperCase();

    if (!enteredCode) return;

    try {
        console.log("Searching for student code:", enteredCode);

        // Query student_registrations collection for the unique ID code
        const q = query(collection(db, "student_registrations"), where("id", "==", enteredCode));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            // Fallback check: try fetching all records and matching manually (helpful if case sensitivity or indexing differs)
            const allDocs = await getDocs(collection(db, "student_registrations"));
            let found = false;
            
            allDocs.forEach((docSnap) => {
                const data = docSnap.data();
                if (data.id && data.id.toUpperCase() === enteredCode) {
                    currentStudent = { firestoreId: docSnap.id, ...data };
                    found = true;
                }
            });

            if (!found) {
                showToast("Invalid Student Code. Please check your registration code.", "error");
                return;
            }
        } else {
            querySnapshot.forEach((docSnap) => {
                currentStudent = { firestoreId: docSnap.id, ...docSnap.data() };
            });
        }

        console.log("Student found:", currentStudent);

        // Populate student profile info onto the UI
        document.getElementById('display-student-name').innerText = currentStudent.fullName || `${currentStudent.firstName} ${currentStudent.lastName}`;
        document.getElementById('display-student-grade').innerText = currentStudent.grade || 'N/A';
        document.getElementById('display-student-id').innerText = currentStudent.id;
        
        const fName = currentStudent.firstName || 'S';
        const lName = currentStudent.lastName || 'T';
        const initials = `${fName.charAt(0)}${lName.charAt(0)}`.toUpperCase();
        document.getElementById('student-initials-badge').innerText = initials;

        // Show header badge
        document.getElementById('header-student-name').innerText = currentStudent.fullName || `${currentStudent.firstName} ${currentStudent.lastName}`;
        document.getElementById('student-badge-header').classList.remove('hidden');
        document.getElementById('student-badge-header').classList.add('flex');

        // Switch views from login card to messaging card
        document.getElementById('step-login-card').classList.add('hidden');
        document.getElementById('step-messaging-card').classList.remove('hidden');

        showToast(`Welcome back, ${currentStudent.fullName || currentStudent.firstName}!`, 'success');
        
        // Fetch past messages for this student
        await fetchStudentMessages();

    } catch (error) {
        console.error("Error verifying code:", error);
        showToast("Verification failed. Check console for details.", "error");
    }
};

// 2. SEND DIRECT MESSAGE LINKED TO STUDENT ID & NAME
window.sendStudentMessage = async function(event) {
    event.preventDefault();
    if (!currentStudent) return;

    const messageInput = document.getElementById('messageText');
    const messageContent = messageInput.value.trim();

    if (!messageContent) return;

    const messagePayload = {
        studentId: currentStudent.id,
        studentName: currentStudent.fullName || `${currentStudent.firstName} ${currentStudent.lastName}`,
        grade: currentStudent.grade || 'N/A',
        message: messageContent,
        createdAt: new Date().toISOString(),
        sender: 'student'
    };

    try {
        await addDoc(collection(db, "student_communications"), messagePayload);
        
        messageInput.value = '';
        showToast("Message sent successfully!", "success");
        
        await fetchStudentMessages();
    } catch (error) {
        console.error("Error sending message:", error);
        showToast("Failed to send message.", "error");
    }
};

// 3. FETCH STUDENT'S PREVIOUS MESSAGES
async function fetchStudentMessages() {
    if (!currentStudent) return;
    const container = document.getElementById('student-messages-list');

    try {
        const q = query(
            collection(db, "student_communications"), 
            where("studentId", "==", currentStudent.id)
        );
        const querySnapshot = await getDocs(q);
        
        let messages = [];
        querySnapshot.forEach((docSnap) => {
            messages.push(docSnap.data());
        });

        // Sort by date newest first
        messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (messages.length === 0) {
            container.innerHTML = `<p class="text-xs text-slate-400 italic text-center py-4">No messages sent yet.</p>`;
            return;
        }

        container.innerHTML = messages.map(msg => `
            <div class="message-bubble bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                <div class="flex items-center justify-between text-slate-400 mb-1">
                    <span class="font-semibold text-indigo-600">${msg.sender === 'admin' ? 'Tutor / Admin' : 'You'}</span>
                    <span>${new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p class="text-slate-700 whitespace-pre-wrap">${escapeHtml(msg.message)}</p>
            </div>
        `).join('');

    } catch (error) {
        console.error("Error fetching messages:", error);
    }
}

// 4. LOGOUT / SWITCH STUDENT CODE
window.logoutStudent = function() {
    currentStudent = null;
    document.getElementById('studentCodeInput').value = '';
    document.getElementById('step-messaging-card').classList.add('hidden');
    document.getElementById('step-login-card').classList.remove('hidden');
    document.getElementById('student-badge-header').classList.remove('flex');
    document.getElementById('student-badge-header').classList.add('hidden');
    showToast("Logged out of session.", "info");
};

// Helper: Escape HTML
function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
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
    setTimeout(() => toast.classList.add('translate-x-full'), 3500);
}

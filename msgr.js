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

window.verifyStudentCode = async function(event) {
    event.preventDefault();
    const codeInput = document.getElementById('studentCodeInput');
    const enteredId = codeInput.value.trim().toUpperCase();

    if (!enteredId) {
        showToast("Please enter an ID code.", "error");
        return;
    }

    try {
        // Query student_registrations matching the 'id' field
        const q = query(collection(db, "student_registrations"), where("id", "==", enteredId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            const allDocs = await getDocs(collection(db, "student_registrations"));
            let found = false;
            
            allDocs.forEach((docSnap) => {
                const data = docSnap.data();
                if (data.id && data.id.trim().toUpperCase() === enteredId) {
                    currentStudent = { firestoreId: docSnap.id, ...data };
                    found = true;
                }
            });

            if (!found) {
                showToast("Invalid ID Code. Please check and try again.", "error");
                return;
            }
        } else {
            querySnapshot.forEach((docSnap) => {
                currentStudent = { firestoreId: docSnap.id, ...docSnap.data() };
            });
        }

        const studentName = currentStudent.fullName || `${currentStudent.firstName || ''} ${currentStudent.lastName || ''}`.trim() || 'Student';
        const studentGrade = currentStudent.grade || 'N/A';
        const studentIdCode = currentStudent.id || enteredId;

        document.getElementById('display-student-name').innerText = studentName;
        document.getElementById('display-student-grade').innerText = studentGrade;
        document.getElementById('display-student-id').innerText = studentIdCode;
        
        const initials = studentName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'ST';
        document.getElementById('student-initials-badge').innerText = initials;
        document.getElementById('header-student-name').innerText = studentName;
        
        const badgeHeader = document.getElementById('student-badge-header');
        badgeHeader.classList.remove('hidden');
        badgeHeader.classList.add('flex');

        const loginCard = document.getElementById('step-login-card');
        const messagingCard = document.getElementById('step-messaging-card');

        if (loginCard && messagingCard) {
            loginCard.style.display = 'none';
            messagingCard.classList.remove('hidden');
            messagingCard.style.display = 'block';
        }

        showToast(`Welcome back, ${studentName}!`, 'success');
        await fetchStudentMessages();

    } catch (error) {
        console.error("Error during verification:", error);
        showToast("Error connecting to database.", "error");
    }
};

window.sendStudentMessage = async function(event) {
    event.preventDefault();
    if (!currentStudent) return;

    const messageInput = document.getElementById('messageText');
    const messageContent = messageInput.value.trim();

    if (!messageContent) return;

    const messagePayload = {
        id: currentStudent.id, // Using 'id' instead of studentId
        studentName: currentStudent.fullName || `${currentStudent.firstName || ''} ${currentStudent.lastName || ''}`.trim(),
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

async function fetchStudentMessages() {
    if (!currentStudent) return;
    const container = document.getElementById('student-messages-list');
    if (!container) return;

    try {
        // Query student_communications matching 'id'
        const q = query(
            collection(db, "student_communications"), 
            where("id", "==", currentStudent.id)
        );
        const querySnapshot = await getDocs(q);
        
        let messages = [];
        querySnapshot.forEach((docSnap) => {
            messages.push(docSnap.data());
        });

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
        console.error("Error fetching past messages:", error);
    }
}

window.logoutStudent = function() {
    currentStudent = null;
    document.getElementById('studentCodeInput').value = '';
    
    const loginCard = document.getElementById('step-login-card');
    const messagingCard = document.getElementById('step-messaging-card');
    if (loginCard) loginCard.style.display = 'block';
    if (messagingCard) {
        messagingCard.classList.add('hidden');
        messagingCard.style.display = 'none';
    }

    const badgeHeader = document.getElementById('student-badge-header');
    badgeHeader.classList.remove('flex');
    badgeHeader.classList.add('hidden');
    
    showToast("Logged out.", "info");
};

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
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

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

// VERIFY STUDENT ID CODE
window.verifyStudentCode = async function(event) {
    event.preventDefault();
    const codeInput = document.getElementById('studentCodeInput');
    const enteredId = codeInput.value.trim().toUpperCase();

    if (!enteredId) return;

    try {
        // Query student_registrations collection where the 'id' field matches the entered code
        const q = query(collection(db, "student_registrations"), where("id", "==", enteredId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            // Fallback manual scan just in case of case differences
            const allDocs = await getDocs(collection(db, "student_registrations"));
            let found = false;
            
            allDocs.forEach((docSnap) => {
                const data = docSnap.data();
                if (data.id && data.id.toUpperCase() === enteredId) {
                    currentStudent = { firestoreId: docSnap.id, ...data };
                    found = true;
                }
            });

            if (!found) {
                showToast("Invalid Student ID Code. Please check and try again.", "error");
                return;
            }
        } else {
            querySnapshot.forEach((docSnap) => {
                currentStudent = { firestoreId: docSnap.id, ...docSnap.data() };
            });
        }

        // Display student profile info in UI
        document.getElementById('display-student-name').innerText = currentStudent.fullName || `${currentStudent.firstName} ${currentStudent.lastName}`; document.getElementById('display-student-grade').innerText = currentStudent.grade \vert{}\vert{} 'N/A'; document.getElementById('display-student-id').innerText = currentStudent.id;  const fName = currentStudent.firstName \vert{}\vert{} 'S'; const lName = currentStudent.lastName \vert{}\vert{} 'T'; document.getElementById('student-initials-badge').innerText = `${fName.charAt(0)}${lName.charAt(0)}`.toUpperCase();  document.getElementById('header-student-name').innerText = currentStudent.fullName \vert{}\vert{} `${currentStudent.firstName} ${currentStudent.lastName}`; document.getElementById('student-badge-header').classList.remove('hidden'); document.getElementById('student-badge-header').classList.add('flex');  // Switch to messaging interface document.getElementById('step-login-card').classList.add('hidden'); document.getElementById('step-messaging-card').classList.remove('hidden');  showToast(`Welcome, ${currentStudent.fullName || currentStudent.firstName}!`, 'success');
        await fetchStudentMessages();

    } catch (error) {
        console.error("Error verifying ID code:", error);
        showToast("Verification failed. Please try again.", "error");
    }
};

// SEND MESSAGE TIED TO STUDENT ID
window.sendStudentMessage = async function(event) {
    event.preventDefault();
    if (!currentStudent) return;

    const messageInput = document.getElementById('messageText');
    const messageContent = messageInput.value.trim();

    if (!messageContent) return;

    const messagePayload = {
        studentId: currentStudent.id, // Explicitly using the ID code
        studentName: currentStudent.fullName || `${currentStudent.firstName}${currentStudent.lastName}`,
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

// FETCH MESSAGES FOR THIS ID
async function fetchStudentMessages() {
    if (!currentStudent) return;
    const container = document.getElementById('student-messages-list');

    try {
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
        console.error("Error fetching messages:", error);
    }
}

window.logoutStudent = function() {
    currentStudent = null;
    document.getElementById('studentCodeInput').value = '';
    document.getElementById('step-messaging-card').classList.add('hidden');
    document.getElementById('step-login-card').classList.remove('hidden');
    document.getElementById('student-badge-header').classList.remove('flex');
    document.getElementById('student-badge-header').classList.add('hidden');
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

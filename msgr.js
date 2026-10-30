import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
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
const db = getFirestore(app);

let allStudents = [];
let activeStudent = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchTeacherData();
});

window.fetchTeacherData = async function() {
    try {
        const querySnapshot = await getDocs(collection(db, "student_registrations"));
        allStudents = [];
        querySnapshot.forEach((docSnap) => {
            allStudents.push({ firestoreId: docSnap.id, ...docSnap.data() });
        });

        renderStudentList(allStudents);
        if (activeStudent) {
            loadStudentThread(activeStudent);
        }
    } catch (error) {
        console.error("Error loading teacher data:", error);
        showToast("Error loading student records.", "error");
    }
};

function renderStudentList(students) {
    const container = document.getElementById('teacher-student-list');
    if (!container) return;

    if (students.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 italic text-center py-4">No students found.</p>`;
        return;
    }

    container.innerHTML = students.map(student => {
        const name = student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
        const isSelected = activeStudent && activeStudent.id === student.id;

        return `
            <div 
                onclick="selectStudent('${student.id}')"
                class="p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${isSelected ? 'bg-indigo-50 border-indigo-400' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}"
            >
                <div>
                    <h4 class="font-semibold text-slate-800 text-xs">${escapeHtml(name)}</h4>
                    <p class="text-[10px] text-slate-400">ID: ${student.id || 'N/A'} | Grade: ${student.grade || 'N/A'}</p>
                </div>
                <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400"></i>
            </div>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.filterStudentList = function() {
    const queryVal = document.getElementById('teacher-search').value.toLowerCase();
    const filtered = allStudents.filter(s => {
        const name = (s.fullName || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase();
        const id = (s.id || '').toLowerCase();
        return name.includes(queryVal) || id.includes(queryVal);
    });
    renderStudentList(filtered);
};

window.selectStudent = function(studentId) {
    activeStudent = allStudents.find(s => s.id === studentId);
    if (!activeStudent) return;

    renderStudentList(allStudents);

    document.getElementById('no-student-selected').classList.add('hidden');
    document.getElementById('active-chat-container').classList.remove('hidden');

    const name = activeStudent.fullName || `${activeStudent.firstName || ''} ${activeStudent.lastName || ''}`.trim();
    document.getElementById('chat-student-name').innerText = name;
    document.getElementById('chat-student-meta').innerText = `ID: ${activeStudent.id || 'N/A'} | Grade: ${activeStudent.grade || 'N/A'}`;

    loadStudentThread(activeStudent);
};

async function loadStudentThread(student) {
    const threadContainer = document.getElementById('teacher-messages-thread');

    try {
        const q = query(
            collection(db, "student_communications"),
            where("id", "==", student.id)
        );
        const querySnapshot = await getDocs(q);

        let messages = [];
        querySnapshot.forEach((docSnap) => {
            messages.push(docSnap.data());
        });

        messages.sort((a, b) => new Date(a.createdAt) - new Date(a.createdAt));

        if (messages.length === 0) {
            threadContainer.innerHTML = `<p class="text-xs text-slate-400 italic text-center py-6">No messages from this student yet.</p>`;
            return;
        }

        threadContainer.innerHTML = messages.map(msg => `
            <div class="message-bubble ${msg.sender === 'admin' || msg.sender === 'teacher' ? 'bg-indigo-600 text-white ml-8' : 'bg-slate-100 text-slate-800 mr-8'} rounded-xl p-3 text-xs shadow-sm">
                <div class="flex items-center justify-between text-[10px] ${msg.sender === 'admin' || msg.sender === 'teacher' ? 'text-indigo-200' : 'text-slate-400'} mb-1">
                    <span class="font-bold">${msg.sender === 'admin' || msg.sender === 'teacher' ? 'You (Teacher)' : msg.studentName || 'Student'}</span>
                    <span>${new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p class="whitespace-pre-wrap">${escapeHtml(msg.message)}</p>
            </div>
        `).join('');

        threadContainer.scrollTop = threadContainer.scrollHeight;

    } catch (error) {
        console.error("Error fetching student thread:", error);
    }
}

window.sendTeacherReply = async function(event) {
    event.preventDefault();
    if (!activeStudent) return;

    const replyInput = document.getElementById('replyText');
    const content = replyInput.value.trim();

    if (!content) return;

    const payload = {
        id: activeStudent.id,
        studentName: activeStudent.fullName || `${activeStudent.firstName || ''} ${activeStudent.lastName || ''}`.trim(),
        grade: activeStudent.grade || 'N/A',
        message: content,
        createdAt: new Date().toISOString(),
        sender: 'teacher'
    };

    try {
        await addDoc(collection(db, "student_communications"), payload);
        replyInput.value = '';
        showToast("Reply sent to student!", "success");
        await loadStudentThread(activeStudent);
    } catch (error) {
        console.error("Error sending teacher reply:", error);
        showToast("Failed to send reply.", "error");
    }
};

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    if (!toast || !toastMsg) return;
    toastMsg.innerText = message;
    if (toastIcon) {
        toastIcon.setAttribute('data-lucide', type === 'error' ? 'alert-circle' : 'check-circle-2');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    toast.classList.remove('translate-x-full');
    setTimeout(() => toast.classList.add('translate-x-full'), 3500);
}

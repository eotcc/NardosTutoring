import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
    getAuth,
    setPersistence,
    browserSessionPersistence,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// FIREBASE CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyD5DlfgTwgbohbj4fpqQdXzuox63P6GJQA",
    authDomain: "saturdaychurchschool.firebaseapp.com",
    projectId: "saturdaychurchschool",
    storageBucket: "saturdaychurchschool.firebasestorage.app",
    messagingSenderId: "1098070001648",
    appId: "1:1098070001648:web:ce1e14aea3c7a374853f35",
    measurementId: "G-QGES69P8QR"
};

// INITIALIZE FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// PERSISTENCE SETUP
try {
    await setPersistence(auth, browserSessionPersistence);
} catch (error) {
    console.error("Firebase persistence error:", error);
}

// DOM ELEMENTS
const loginForm = document.getElementById("adminLoginForm");
const loginMessage = document.getElementById("loginMessage");
const loginContainer = document.getElementById("adminLogin");
const dashboard = document.getElementById("adminDashboard");
const loginButton = document.getElementById("loginButton");
const signOutButton = document.getElementById("signOutButton");
const dashboardMessage = document.getElementById("dashboardMessage");
const emailInput = document.getElementById("adminEmail");
const passwordInput = document.getElementById("adminPassword");

// UNIFIED LOGOUT CLEANUP
const handleLogout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        // Ignore if already signed out
    }
    
    if (emailInput) emailInput.value = "";
    if (passwordInput) passwordInput.value = "";
    if (loginForm) loginForm.reset();
    if (loginMessage) loginMessage.textContent = "";
    if (dashboardMessage) dashboardMessage.textContent = "";
    
    if (loginContainer) loginContainer.style.display = "block";
    if (dashboard) dashboard.style.display = "none";
};

// HANDLE BACK NAVIGATION: LET FIREBASE RE-VERIFY SESSION OR RESTORE DASHBOARD
window.addEventListener("pageshow", async (event) => {
    if (event.persisted) {
        // If cached, let auth state or a quick refresh handle it, 
        // but if a user is active, keep them on the dashboard.
        if (auth.currentUser) {
            if (loginContainer) loginContainer.style.display = "none";
            if (dashboard) dashboard.style.display = "block";
        } else {
            if (loginContainer) loginContainer.style.display = "block";
            if (dashboard) dashboard.style.display = "none";
        }
    }
});

// AUTHENTICATION STATE LISTENER
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (loginContainer) loginContainer.style.display = "none";
        if (dashboard) dashboard.style.display = "block";
    } else {
        if (loginContainer) loginContainer.style.display = "block";
        if (dashboard) dashboard.style.display = "none";
    }
});

// SIGN IN HANDLER
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    loginMessage.textContent = "Signing in...";
    loginButton.disabled = true;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        loginMessage.textContent = "";
    } catch (error) {
        console.error("Firebase sign-in error:", error);

        switch (error.code) {
            case "auth/invalid-credential":
            case "auth/wrong-password":
            case "auth/user-not-found":
                loginMessage.textContent = "Incorrect email or password.";
                break;
            case "auth/invalid-email":
                loginMessage.textContent = "Please enter a valid email address.";
                break;
            case "auth/too-many-requests":
                loginMessage.textContent = "Too many attempts. Please try again later.";
                break;
            default:
                loginMessage.textContent = "Sign-in failed. Please try again.";
                break;
        }
    } finally {
        loginButton.disabled = false;
    }
});

// SIGN OUT HANDLER
signOutButton.addEventListener("click", async () => {
    await handleLogout();
});

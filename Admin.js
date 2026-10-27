import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
    getAuth,
    setPersistence,
    browserSessionPersistence,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyB3E6n_VRbeW0MfEvksjvLFTwvDmx0Jk9I",
  authDomain: "nrdstut.firebaseapp.com",
  projectId: "nrdstut",
  storageBucket: "nrdstut.firebasestorage.app",
  messagingSenderId: "4814258678",
  appId: "1:4814258678:web:5f8ea96c5c930eb1c847d7",
  measurementId: "G-NWWNY3VHP6"
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
const loginButton = document.getElementById("loginButton");
const emailInput = document.getElementById("adminEmail");
const passwordInput = document.getElementById("adminPassword");

// 🟢 ADD THIS HERE: Clears cached inputs and passwords when hitting back/cache reload
window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
        if (loginForm) loginForm.reset();
        if (emailInput) emailInput.value = "";
        if (passwordInput) passwordInput.value = "";
        if (loginMessage) loginMessage.textContent = "";
    }
});

// SIGN IN HANDLER
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        loginMessage.textContent = "Signing in...";
        loginButton.disabled = true;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            loginMessage.textContent = "";
            // Clear inputs right before redirecting so they aren't stored in cache
            loginForm.reset();
            window.location.href = "Dashbrd.html";
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
}

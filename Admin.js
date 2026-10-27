import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
    getAuth,
    setPersistence,
    browserSessionPersistence,
    signInWithEmailAndPassword
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
const loginButton = document.getElementById("loginButton");
const emailInput = document.getElementById("adminEmail");
const passwordInput = document.getElementById("adminPassword");

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
            // Redirect straight to dashboard on successful authentication
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

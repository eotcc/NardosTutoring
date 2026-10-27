import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
    getAuth,
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

// DOM ELEMENTS
const signOutButton = document.getElementById("signOutButton");
const dashboardMessage = document.getElementById("dashboardMessage");

// PROTECT ROUTE: Redirect to sign-in if user is not authenticated
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "admin.html";
    }
});

// SIGN OUT HANDLER
if (signOutButton) {
    signOutButton.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "admin.html";
        } catch (error) {
            console.error("Sign-out error:", error);
            if (dashboardMessage) {
                dashboardMessage.textContent = "Error signing out. Please try again.";
            }
        }
    });
}

// BROWSER CACHE / BACK BUTTON SAFETY
window.addEventListener("pageshow", (event) => {
    if (event.persisted && !auth.currentUser) {
        window.location.href = "admin.html";
    }
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut
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

// DOM ELEMENTS
const signOutButton = document.getElementById("signOutButton");
const dashboardMessage = document.getElementById("dashboardMessage");

// PROTECT ROUTE: Redirect to sign-in if user is not authenticated
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "index.html";
    }
});

// SIGN OUT HANDLER
if (signOutButton) {
    signOutButton.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "index.html";
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
        window.location.href = "index.html";
    }
});

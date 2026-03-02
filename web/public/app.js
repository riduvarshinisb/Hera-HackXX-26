import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// 🔹 PASTE YOUR REAL CONFIG HERE
const firebaseConfig = {
    apiKey: "AIzaSyBKfkquw2rwnjJOD6Bm7K352ZYJT1bG0-Y",
    authDomain: "herahack.firebaseapp.com",
    projectId: "herahack",
    storageBucket: "herahack.firebasestorage.app",
    messagingSenderId: "107731899994",
    appId: "1:107731899994:web:de2f0aaf1fcacc4cff2a63"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
getFirestore(app); // reserved for next steps

const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const googleBtn = document.getElementById("googleBtn");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authStatus = document.getElementById("authStatus");

function setStatus(msg, isError = false) {
  authStatus.textContent = msg;
  authStatus.style.color = isError ? "crimson" : "inherit";
}

// Google Sign-In
googleBtn.addEventListener("click", async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    setStatus("Google login successful ✅");
  } catch (e) {
    setStatus(e.message, true);
  }
});

// Email/Password Signup
signupBtn.addEventListener("click", async () => {
  try {
    const email = emailEl.value.trim();
    const password = passEl.value;

    if (!email || !password) {
      setStatus("Enter email and password.", true);
      return;
    }

    await createUserWithEmailAndPassword(auth, email, password);
    setStatus("Signup successful ✅");
  } catch (e) {
    setStatus(e.message, true);
  }
});

// Email/Password Login
loginBtn.addEventListener("click", async () => {
  try {
    const email = emailEl.value.trim();
    const password = passEl.value;

    if (!email || !password) {
      setStatus("Enter email and password.", true);
      return;
    }

    await signInWithEmailAndPassword(auth, email, password);
    setStatus("Login successful ✅");
  } catch (e) {
    setStatus(e.message, true);
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    setStatus("Logged out ✅");
  } catch (e) {
    setStatus(e.message, true);
  }
});

// Auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    logoutBtn.disabled = false;
    const label = user.email ? user.email : user.uid;
    setStatus(`Logged in as ${label}`);
  } else {
    logoutBtn.disabled = true;
    setStatus("Not logged in");
  }
});
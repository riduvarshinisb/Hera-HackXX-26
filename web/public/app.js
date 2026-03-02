import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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
const db = getFirestore(app);

const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authStatus = document.getElementById("authStatus");

function setStatus(msg, isError = false) {
  authStatus.textContent = msg;
  authStatus.style.color = isError ? "crimson" : "inherit";
}

signupBtn.addEventListener("click", async () => {
  try {
    await createUserWithEmailAndPassword(auth, emailEl.value, passEl.value);
    setStatus("Signup successful ✅");
  } catch (e) {
    setStatus(e.message, true);
  }
});

loginBtn.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, emailEl.value, passEl.value);
    setStatus("Login successful ✅");
  } catch (e) {
    setStatus(e.message, true);
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    setStatus("Logged out ✅");
  } catch (e) {
    setStatus(e.message, true);
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    logoutBtn.disabled = false;
    setStatus(`Logged in as ${user.email}`);
  } else {
    logoutBtn.disabled = true;
    setStatus("Not logged in");
  }
});
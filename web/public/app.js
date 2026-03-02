import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBKfkquw2rwnjJOD6Bm7K352ZYJT1bG0-Y",
    authDomain: "herahack.firebaseapp.com",
    projectId: "herahack",
    storageBucket: "herahack.firebasestorage.app",
    messagingSenderId: "107731899994",
    appId: "1:107731899994:web:de2f0aaf1fcacc4cff2a63"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const googleBtn = document.getElementById("googleBtn");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const authStatus = document.getElementById("authStatus");

function setStatus(msg, isError = false) {
  authStatus.textContent = msg;
  authStatus.style.color = isError ? "crimson" : "inherit";
}

// ====== UI Elements (Evidence) ======
const evidenceCard = document.getElementById("evidenceCard");
const evidenceTitleEl = document.getElementById("evidenceTitle");
const evidenceTypeEl = document.getElementById("evidenceType");
const evidenceFileEl = document.getElementById("evidenceFile");
const uploadEvidenceBtn = document.getElementById("uploadEvidenceBtn");
const uploadStatusEl = document.getElementById("uploadStatus");
const escalateBtn = document.getElementById("escalateBtn");

function setUploadStatus(msg, isError = false) {
  uploadStatusEl.textContent = msg;
  uploadStatusEl.style.color = isError ? "crimson" : "inherit";
}

// ====== Google Sign-In ======
googleBtn.addEventListener("click", async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    setStatus("Google login successful ✅");
    window.location.href = "/upload.html";
  } catch (e) {
    setStatus(e.message, true);
  }
});

signupBtn.addEventListener("click", async () => {
  try {
    const email = emailEl.value.trim();
    const password = passEl.value;
    if (!email || !password) return setStatus("Enter email and password.", true);

    await createUserWithEmailAndPassword(auth, email, password);
    setStatus("Signup successful ✅");
    window.location.href = "/upload.html";
  } catch (e) {
    setStatus(e.message, true);
  }
});

loginBtn.addEventListener("click", async () => {
  try {
    const email = emailEl.value.trim();
    const password = passEl.value;
    if (!email || !password) return setStatus("Enter email and password.", true);

    await signInWithEmailAndPassword(auth, email, password);
    setStatus("Login successful ✅");
    window.location.href = "/upload.html";
  } catch (e) {
    setStatus(e.message, true);
  }
});

// Backup: if already logged in, go straight to upload page
onAuthStateChanged(auth, (user) => {
  if (user && !window.location.pathname.endsWith("/upload.html")) {
    window.location.href = "/upload.html";
  }
});
// ====== Escalation Routing ======
if (escalateBtn) {
  escalateBtn.addEventListener("click", () => {
    window.location.href = "escalate.html";
  });
}

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
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ====== YOUR FIREBASE CONFIG (keep your real values) ======
const firebaseConfig = {
    apiKey: "AIzaSyBKfkquw2rwnjJOD6Bm7K352ZYJT1bG0-Y",
    authDomain: "herahack.firebaseapp.com",
    projectId: "herahack",
    storageBucket: "herahack.firebasestorage.app",
    messagingSenderId: "107731899994",
    appId: "1:107731899994:web:de2f0aaf1fcacc4cff2a63"
  };

// ====== CLOUDINARY CONFIG (from you) ======
const CLOUDINARY_CLOUD_NAME = "dacassfrk";
const CLOUDINARY_UPLOAD_PRESET = "sheild_unsigned";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ====== UI Elements (Auth) ======
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
  } catch (e) {
    setStatus(e.message, true);
  }
});

// ====== Email/Password Signup ======
signupBtn.addEventListener("click", async () => {
  try {
    const email = emailEl.value.trim();
    const password = passEl.value;
    if (!email || !password) return setStatus("Enter email and password.", true);

    await createUserWithEmailAndPassword(auth, email, password);
    setStatus("Signup successful ✅");
  } catch (e) {
    setStatus(e.message, true);
  }
});

// ====== Email/Password Login ======
loginBtn.addEventListener("click", async () => {
  try {
    const email = emailEl.value.trim();
    const password = passEl.value;
    if (!email || !password) return setStatus("Enter email and password.", true);

    await signInWithEmailAndPassword(auth, email, password);
    setStatus("Login successful ✅");
  } catch (e) {
    setStatus(e.message, true);
  }
});

// ====== Logout ======
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    setStatus("Logged out ✅");
  } catch (e) {
    setStatus(e.message, true);
  }
});

// ====== SHA-256 hashing (intrinsic integrity step) ======
async function sha256Hex(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ====== Upload to Cloudinary ======
async function uploadToCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(url, { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Cloudinary upload failed");
  }
  return data; // includes secure_url, public_id, etc.
}

// ====== Evidence Upload Handler ======
uploadEvidenceBtn.addEventListener("click", async () => {
  try {
    const user = auth.currentUser;
    if (!user) return setUploadStatus("Please login first.", true);

    const title = (evidenceTitleEl.value || "").trim();
    const type = evidenceTypeEl.value;
    const file = evidenceFileEl.files?.[0];

    if (!title) return setUploadStatus("Please enter an evidence title.", true);
    if (!file) return setUploadStatus("Please choose a file.", true);

    uploadEvidenceBtn.disabled = true;
    setUploadStatus("Generating SHA-256 hash...");

    // 1) Intrinsic integrity: hash
    const hash = await sha256Hex(file);

    // 2) Metadata extraction (basic, hackathon-safe)
    const metadata = {
      fileName: file.name,
      fileType: file.type || "unknown",
      fileSize: file.size,
      clientTimeISO: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    setUploadStatus("Uploading to Cloudinary...");
    const cloud = await uploadToCloudinary(file);

    setUploadStatus("Saving record to Firestore...");
    await addDoc(collection(db, "evidence"), {
      uid: user.uid,
      userEmail: user.email || null,
      title,
      type,
      sha256: hash,
      metadata,
      cloudinary: {
        secure_url: cloud.secure_url,
        public_id: cloud.public_id,
        resource_type: cloud.resource_type,
        format: cloud.format,
        bytes: cloud.bytes
      },
      integrityStatus: "VALID", // blockchain step later after checks
      createdAt: serverTimestamp()
    });

    setUploadStatus("Evidence uploaded and logged ✅");
    evidenceTitleEl.value = "";
    evidenceFileEl.value = "";
  } catch (e) {
    setUploadStatus(e.message, true);
  } finally {
    uploadEvidenceBtn.disabled = false;
  }
});

// ====== Auth state ======
onAuthStateChanged(auth, (user) => {
  if (user) {
    logoutBtn.disabled = false;
    evidenceCard.style.display = "block";
    const label = user.email ? user.email : user.uid;
    setStatus(`Logged in as ${label}`);
    setUploadStatus("");
  } else {
    logoutBtn.disabled = true;
    evidenceCard.style.display = "none";
    setStatus("Not logged in");
    setUploadStatus("");
  }
});

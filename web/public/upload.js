import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  limit,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ===== Firebase =====
const firebaseConfig = {
  apiKey: "AIzaSyBKfkquw2rwnjJOD6Bm7K352ZYJT1bG0-Y",
  authDomain: "herahack.firebaseapp.com",
  projectId: "herahack",
  storageBucket: "herahack.firebasestorage.app",
  messagingSenderId: "107731899994",
  appId: "1:107731899994:web:de2f0aaf1fcacc4cff2a63"
};

// ===== Cloudinary =====
const CLOUDINARY_CLOUD_NAME = "dacassfrk";
const CLOUDINARY_UPLOAD_PRESET = "sheild_unsigned";

// ✅ Vercel backend
const VERCEL_API_BASE = "https://hera-hack-xx-26.vercel.app";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// UI
const evidenceTitleEl = document.getElementById("evidenceTitle");
const evidenceTypeEl = document.getElementById("evidenceType");
const evidenceFileEl = document.getElementById("evidenceFile");
const uploadEvidenceBtn = document.getElementById("uploadEvidenceBtn");
const logoutBtn = document.getElementById("logoutBtn");
const uploadStatusEl = document.getElementById("uploadStatus");
const whoamiEl = document.getElementById("whoami");

function setUploadStatus(msg, isError = false) {
  uploadStatusEl.textContent = msg;
  uploadStatusEl.style.color = isError ? "crimson" : "inherit";
}

async function sha256Hex(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function uploadToCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(url, { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Cloudinary upload failed");
  return data;
}

async function evidenceAlreadyExists(uid, sha256) {
  const q = query(
    collection(db, "evidence"),
    where("uid", "==", uid),
    where("sha256", "==", sha256),
    limit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

uploadEvidenceBtn.addEventListener("click", async () => {
  let docRef = null;

  try {
    const user = auth.currentUser;
    if (!user) return setUploadStatus("Not logged in. Redirecting...", true);

    const title = (evidenceTitleEl.value || "").trim();
    const type = evidenceTypeEl.value;
    const file = evidenceFileEl.files?.[0];

    if (!title) return setUploadStatus("Please enter an evidence title.", true);
    if (!file) return setUploadStatus("Please choose a file.", true);

    uploadEvidenceBtn.disabled = true;

    setUploadStatus("Generating SHA-256 hash...");
    const hash = await sha256Hex(file);

    setUploadStatus("Checking if evidence already exists...");
    const exists = await evidenceAlreadyExists(user.uid, hash);
    if (exists) {
      setUploadStatus("This evidence has already been securely stored ");
      return;
    }

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
    docRef = await addDoc(collection(db, "evidence"), {
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
      createdAt: serverTimestamp(),
      blockchain: { status: "PENDING" }
    });

    // === Notarize ===
    setUploadStatus("Notarizing on Sepolia...");

    let notarizeRes;
    try {
      notarizeRes = await fetch(`${VERCEL_API_BASE}/api/notarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sha256: hash, evidenceId: docRef.id })
      });
    } catch (netErr) {
      // ✅ If fetch fails, mark as FAILED (no more stuck PENDING)
      await updateDoc(doc(db, "evidence", docRef.id), {
        blockchain: { status: "FAILED", error: "Network error calling notarize API" }
      });
      throw new Error("Failed to fetch notarize API (network/CORS/server crash).");
    }

    // Parse response safely
    let notarizeData = null;
    try {
      notarizeData = await notarizeRes.json();
    } catch {
      const txt = await notarizeRes.text();
      notarizeData = { ok: false, error: txt || "Invalid JSON response from notarize API" };
    }

    if (!notarizeRes.ok || !notarizeData.ok) {
      await updateDoc(doc(db, "evidence", docRef.id), {
        blockchain: { status: "FAILED", error: notarizeData?.error || "Unknown error" }
      });
      throw new Error(notarizeData?.error || "Blockchain notarization failed");
    }

    await updateDoc(doc(db, "evidence", docRef.id), {
      blockchain: {
        status: "CONFIRMED",
        txHash: notarizeData.txHash,
        blockNumber: notarizeData.blockNumber
      }
    });

    setUploadStatus("Evidence uploaded and notarized ");

    evidenceTitleEl.value = "";
    evidenceFileEl.value = "";
  } catch (e) {
    setUploadStatus(e.message, true);
  } finally {
    uploadEvidenceBtn.disabled = false;
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "/index.html";
});

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "/index.html";
    return;
  }
  whoamiEl.textContent = `Logged in as: ${user.email || user.uid}`;
});
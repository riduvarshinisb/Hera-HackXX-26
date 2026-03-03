import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { PDFDocument, StandardFonts } from "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm";

const firebaseConfig = {
  apiKey: "AIzaSyBKfkquw2rwnjJOD6Bm7K352ZYJT1bG0-Y",
  authDomain: "herahack.firebaseapp.com",
  projectId: "herahack",
  storageBucket: "herahack.firebasestorage.app",
  messagingSenderId: "107731899994",
  appId: "1:107731899994:web:de2f0aaf1fcacc4cff2a63"
};

const VERCEL_API_BASE = "https://hera-hack-xx-26.vercel.app";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// UI
const whoami = document.getElementById("whoami");
const logoutBtn = document.getElementById("logoutBtn");
const statusEl = document.getElementById("status");

const victimName = document.getElementById("victimName");
const victimPhone = document.getElementById("victimPhone");
const victimEmail = document.getElementById("victimEmail");
const platform = document.getElementById("platform");
const category = document.getElementById("category");
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");
const suspect = document.getElementById("suspect");
const summary = document.getElementById("summary");
const notes = document.getElementById("notes");

const loadEvidenceBtn = document.getElementById("loadEvidenceBtn");
const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const portalBtn = document.getElementById("portalBtn");

const evidenceListEl = document.getElementById("evidenceList");
const draftPreview = document.getElementById("draftPreview");

let selectedEvidence = [];
let latestDraft = "";

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? "crimson" : "inherit";
}

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "/index.html";
});

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "/index.html";
    return;
  }
  whoami.textContent = `Logged in as: ${user.email || user.uid}`;
  if (!victimEmail.value) victimEmail.value = user.email || "";
});

async function loadMyEvidence() {
  const user = auth.currentUser;
  if (!user) return;

  setStatus("Loading your evidence...");
  evidenceListEl.textContent = "";
  selectedEvidence = [];

  const q = query(
    collection(db, "evidence"),
    where("uid", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  if (snap.empty) {
    evidenceListEl.textContent = "No evidence found yet.";
    setStatus("No evidence found.", true);
    return;
  }

  const docs = [];
  snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));

  // Auto-select latest up to 5
  selectedEvidence = docs.slice(0, 5).map((e) => ({
    id: e.id,
    title: e.title || "Untitled",
    type: e.type || "unknown",
    url: e.cloudinary?.secure_url || "",
    txHash: e.blockchain?.txHash || "",
    blockNumber: e.blockchain?.blockNumber || ""
  }));

  evidenceListEl.innerHTML = selectedEvidence
    .map((e) => `
      <div class="item">
        <div><b>${escapeHtml(e.title)}</b> <span class="chip">${escapeHtml(e.type)}</span></div>
        <div>Cloud: <a href="${e.url}" target="_blank">Open Evidence</a></div>
        <div>Blockchain Proof: <code>${escapeHtml(e.txHash || "Pending/Not available")}</code></div>
      </div>
    `)
    .join("");

  setStatus(`Loaded ${selectedEvidence.length} evidence item(s) `);
}

loadEvidenceBtn.addEventListener("click", () => {
  loadMyEvidence().catch((e) => setStatus(e.message, true));
});

generateBtn.addEventListener("click", async () => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const incidentSummary = summary.value.trim();
    if (!incidentSummary) {
      setStatus("Please enter the incident summary.", true);
      return;
    }

    generateBtn.disabled = true;
    downloadBtn.disabled = true;
    portalBtn.disabled = true;
    draftPreview.textContent = "";
    latestDraft = "";

    setStatus("Generating draft...");
    const payload = {
      victim: {
        name: victimName.value.trim(),
        phone: victimPhone.value.trim(),
        email: (victimEmail.value || user.email || "").trim()
      },
      incident: {
        category: category.value,
        summary: incidentSummary,
        platform: platform.value.trim(),
        startDate: startDate.value || "",
        endDate: endDate.value || "",
        notes: notes.value.trim(),
        suspect: suspect.value.trim()
      },
      // Hash stays backend-only: we do NOT send it
      evidenceList: selectedEvidence.map((e) => ({
        title: e.title,
        type: e.type,
        url: e.url,
        txHash: e.txHash,
        blockNumber: e.blockNumber
      }))
    };

    const r = await fetch(`${VERCEL_API_BASE}/api/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data?.error || "Report generation failed");

    latestDraft = data.draft || "";
    draftPreview.textContent = latestDraft;

    //Enable both PDF + Portal buttons AFTER draft success
    setStatus("Draft generated. Download PDF or proceed to the portal.");
    downloadBtn.disabled = false;
    portalBtn.disabled = false;
  } catch (e) {
    setStatus(e.message, true);
  } finally {
    generateBtn.disabled = false;
  }
});

downloadBtn.addEventListener("click", async () => {
  try {
    if (!latestDraft) {
      setStatus("Generate a draft first.", true);
      return;
    }
    setStatus("Generating PDF...");

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const margin = 50;
    const fontSize = 11;
    const lineHeight = 14;
    let y = 800;

    const lines = wrapText(latestDraft, 90);
    for (const line of lines) {
      if (y < margin) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = 800;
      }
      page.drawText(line, { x: margin, y, size: fontSize, font });
      y -= lineHeight;
    }

    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "SHEild_Legal_Report.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setStatus("PDF downloaded ✅ You can now proceed to the portal.");
    // portal stays enabled
  } catch (e) {
    setStatus(e.message, true);
  }
});

portalBtn.addEventListener("click", () => {
  // ✅ Redirect/forward to national portal
  window.open("https://cybercrime.gov.in/", "_blank");
});

function wrapText(text, maxLen) {
  const words = text.replace(/\r/g, "").split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxLen) {
      lines.push(line.trim());
      line = w;
    } else {
      line += " " + w;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function escapeHtml(s) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
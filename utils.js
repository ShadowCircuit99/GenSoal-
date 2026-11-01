/* ============================================================
   GenSoal — utils.js
   Konstanta, utilitas DOM, dan helper shared
   ============================================================ */

/* --- Constants --- */
export const CONSTANTS = {
  STORAGE_KEY: "gensoal",
  STORAGE_VERSION: 3,
  MAX_JUMLAH_SOAL: 50,
  MIN_JUMLAH_SOAL: 1,
  TOAST_DURATION: 2200,
  PRINT_DELAY: 150,
  CP_MAX_LENGTH: 500,
  MAPEL: [
    "Bahasa Indonesia",
    "Matematika",
    "Fisika",
    "Biologi",
    "Sejarah",
    "Sosiologi",
    "Ekonomi",
    "Geografi"
  ],
  LEVEL_LABEL: {
    C4: "C4 · Analisis",
    C5: "C5 · Evaluasi",
    C6: "C6 · Mencipta"
  },
  /* Setiap kelas punya fase Kurikulum Merdeka masing-masing */
  KELAS: [
    { kode: "X", label: "Kelas X", fase: "E" },
    { kode: "XI", label: "Kelas XI", fase: "F" },
    { kode: "XII", label: "Kelas XII", fase: "F" },
    { kode: "VII", label: "Kelas VII (SMP)", fase: "D" },
    { kode: "VIII", label: "Kelas VIII (SMP)", fase: "D" },
    { kode: "IX", label: "Kelas IX (SMP)", fase: "D" }
  ],
  FASE_LABEL: {
    E: "Fase E (Kelas X)",
    F: "Fase F (Kelas XI–XII)",
    D: "Fase D (Kelas VII–IX, SMP)"
  }
};

/* --- Escape HTML (XSS protection) --- */
export function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* --- Cut text for display --- */
export function cut(s, n) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

/* --- Format fase label --- */
export function formatFase(kode) {
  return CONSTANTS.FASE_LABEL[kode] || kode;
}

/* --- Ambil data kelas berdasarkan kode --- */
export function getKelas(kode) {
  return CONSTANTS.KELAS.find(k => k.kode === kode) || CONSTANTS.KELAS[0];
}

/* --- Format label kelas --- */
export function formatKelas(kode) {
  return getKelas(kode).label;
}

/* --- Fase dari kode kelas --- */
export function faseDariKelas(kode) {
  return getKelas(kode).fase;
}

/* --- Format level label --- */
export function formatLevel(kode) {
  return CONSTANTS.LEVEL_LABEL[kode] || kode;
}

/* --- Toast notification (accessible) --- */
let toastTimer;
export function toast(msg, duration = CONSTANTS.TOAST_DURATION) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.setAttribute("aria-live", "polite");
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove("show");
    el.removeAttribute("aria-live");
  }, duration);
}

/* --- Debounce --- */
export function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/* --- Validate CP input --- */
export function validateCP(cp) {
  const errors = [];
  if (!cp || cp.trim().length === 0) {
    errors.push("Materi / Capaian Pembelajaran harus diisi.");
  }
  if (cp.trim().length > CONSTANTS.CP_MAX_LENGTH) {
    errors.push(`Maksimal ${CONSTANTS.CP_MAX_LENGTH} karakter.`);
  }
  return errors;
}

/* --- Validate jumlah soal --- */
export function validateJumlah(val) {
  const errors = [];
  const n = parseInt(val, 10);
  if (!n || n < CONSTANTS.MIN_JUMLAH_SOAL) {
    errors.push(`Jumlah soal minimal ${CONSTANTS.MIN_JUMLAH_SOAL}.`);
  }
  if (n > CONSTANTS.MAX_JUMLAH_SOAL) {
    errors.push(`Jumlah soal maksimal ${CONSTANTS.MAX_JUMLAH_SOAL}.`);
  }
  return errors;
}

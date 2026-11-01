/* ============================================================
   GenSoal — app.js
   Routing, rendering, event binding, dan navigasi keyboard
   ============================================================ */

import {
  CONSTANTS,
  escapeHtml,
  cut,
  formatFase,
  formatLevel,
  formatKelas,
  faseDariKelas,
  toast,
  debounce,
  validateCP,
  validateJumlah
} from "./utils.js";
import {
  getState,
  setState,
  updatePreview,
  updateSaved,
  subscribe,
  load,
  clearAll
} from "./store.js";
import { buildSheet, printSheet, exportWord } from "./print.js";

/* ================== DOM ELEMENTS ================== */
const els = {
  tabsNav: document.getElementById("tabs"),
  loginNama: document.getElementById("login-nama"),
  loginSekolah: document.getElementById("login-sekolah"),
  fMapel: document.getElementById("f-mapel"),
  fKelas: document.getElementById("f-kelas"),
  fCp: document.getElementById("f-cp"),
  fLevel: document.getElementById("f-level"),
  fTipe: document.getElementById("f-tipe"),
  fJumlah: document.getElementById("f-jumlah"),
  fCpField: document.getElementById("f-cp").closest(".field"),
  fJumlahField: document.getElementById("f-jumlah").closest(".field"),
  previewCard: document.getElementById("preview-card"),
  previewBody: document.getElementById("preview-body"),
  greet: document.getElementById("greet"),
  statTotal: document.getElementById("stat-total"),
  statSets: document.getElementById("stat-sets"),
  statMapel: document.getElementById("stat-mapel"),
  searchBank: document.getElementById("search-bank"),
  bankBody: document.getElementById("bank-body"),
  pNama: document.getElementById("p-nama"),
  pSekolah: document.getElementById("p-sekolah"),
  themeToggle: document.getElementById("theme-toggle"),
  toast: document.getElementById("toast")
};

/* ================== STATE ================== */
/* templatesByMapel dideklarasikan di bagian TEMPLATES */

/* ================== VIEWS ================== */
const VIEWS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "buat", label: "Buat Soal" },
  { id: "bank", label: "Bank Soal" },
  { id: "profil", label: "Profil" }
];

/* ================== INIT ================== */
export async function init() {
  buildTabs();
  populateMapel();
  populateKelas();
  bindGlobalEvents();
  bindAuthEvents();
  bindDashboardEvents();
  bindBuatEvents();
  bindBankEvents();
  bindProfilEvents();
  bindPrintEvents();

  await loadTemplates();
  const restored = load(); /* store */

  /* Subscribe ke store agar dashboard ikut ter-refresh saat state berubah */
  subscribe(() => {
    renderDashboard();
  });

  /* Bila sesi sebelumnya masih ada, langsung ke dashboard */
  if (restored.user) {
    els.loginNama.value = restored.user.nama || "";
    els.loginSekolah.value = restored.user.sekolah || "";
    showView("dashboard", { focus: false });
  } else {
    showView("login", { focus: false });
  }

  registerServiceWorker();
}

/* ================== SERVICE WORKER (PWA offline) ================== */
function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol === "file:") return; /* SW butuh http/https */

  const register = () => {
    navigator.serviceWorker.register("./sw.js").catch((e) => {
      console.warn("Service worker gagal didaftarkan:", e.message);
    });
  };

  /* Bila dokumen sudah selesai dimuat, daftarkan langsung */
  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register);
  }
}

/* ================== TEMPLATES (fetch JSON) ================== */
let templatesByMapel = {}; /* data.mapel dari templates.json */

async function loadTemplates() {
  try {
    const res = await fetch("templates.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("Gagal memuat templates.json");
    const data = await res.json();
    templatesByMapel = data.mapel || {};
  } catch (e) {
    console.warn("Gagal memuat templates, menggunakan fallback:", e.message);
    templatesByMapel = buildFallbackTemplates();
  }
}

/* Fallback minimal jika JSON gagal dimuat */
function buildFallbackTemplates() {
  const set = {
    C4: [{
      stem: "Analisislah {M}. Sebutkan hubungan utama yang ditemukan.",
      opsi: ["Hubungan sebab-akibat", "Tidak ada hubungan", "Tidak dapat ditentukan", "Lainnya"],
      jawab: "Hubungan sebab-akibat",
      rubrik: "Siswa dapat menganalisis {M}."
    }],
    C5: [{
      stem: "Evaluasikan {M}. Pendapat manakah yang paling dapat dipertanggungjawabkan?",
      opsi: ["Pendapat berbasis bukti", "Pendapat tanpa bukti", "Pendapat populer", "Pendapat tokoh"],
      jawab: "Pendapat berbasis bukti",
      rubrik: "Siswa dapat mengevaluasi {M}."
    }],
    C6: [{
      stem: "Rancanglah solusi untuk {M}. Jelaskan langkah-langkahnya.",
      opsi: null,
      jawab: "Solusi yang logis dan runtut",
      rubrik: "Siswa dapat merancang solusi untuk {M}."
    }]
  };
  const out = {};
  CONSTANTS.MAPEL.forEach(m => { out[m] = set; });
  return out;
}

/* ================== NAVIGASI ================== */
function buildTabs() {
  const nav = els.tabsNav;
  nav.innerHTML = "";
  VIEWS.forEach((v, idx) => {
    const b = document.createElement("button");
    b.textContent = v.label;
    b.dataset.view = v.id;
    b.type = "button";
    b.id = `tab-${v.id}`;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-controls", `view-${v.id}`);
    b.setAttribute("aria-selected", idx === 0 ? "true" : "false");
    b.setAttribute("tabindex", idx === 0 ? "0" : "-1");
    b.onclick = () => showView(v.id);
    nav.appendChild(b);
  });

  /* Navigasi papan tombol: panah kiri/kanan, Home, End */
  nav.addEventListener("keydown", (e) => {
    const tabs = Array.from(nav.querySelectorAll("button"));
    const current = tabs.indexOf(document.activeElement);
    if (current === -1) return;

    let next = null;
    if (e.key === "ArrowRight") next = (current + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;

    e.preventDefault();
    const target = tabs[next];
    target.focus();
    showView(target.dataset.view);
  });
}

export function showView(id, options = {}) {
  const { focus = true } = options;
  const state = getState();
  /* Akses kontrol: view selain login butuh user */
  const target = (id !== "login" && !state.user) ? "login" : id;

  document.querySelectorAll(".view").forEach(s => s.classList.remove("active"));
  const targetView = document.getElementById(`view-${target}`);
  if (targetView) targetView.classList.add("active");

  /* Update tab ARIA */
  document.querySelectorAll("#tabs button").forEach(b => {
    const active = b.dataset.view === target;
    b.setAttribute("aria-selected", active ? "true" : "false");
    b.setAttribute("tabindex", active ? "0" : "-1");
  });
  document.getElementById("tabs").style.visibility = state.user ? "visible" : "hidden";

  /* Pindahkan fokus ke judul view agar pembaca layar tahu halaman berganti */
  if (focus) {
    const heading = targetView?.querySelector("h1");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus();
    }
  }

  /* View-specific render */
  if (target === "dashboard") renderDashboard();
  if (target === "bank") renderBank();
  if (target === "profil") fillProfil();
}

/* ================== AUTH ================== */
function bindAuthEvents() {
  els.loginNama.addEventListener("input", () => {
    clearFieldError(els.loginNama);
  });
  els.loginSekolah.addEventListener("input", () => {
    clearFieldError(els.loginSekolah);
  });

  /* Enter di nama = login */
  els.loginNama.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doLogin();
  });

  /* Tombol masuk dan keluar */
  document.getElementById("btn-login").addEventListener("click", doLogin);
  document.getElementById("btn-logout").addEventListener("click", logout);
}

function doLogin() {
  const nama = els.loginNama.value.trim();
  const sekolah = els.loginSekolah.value.trim();

  if (!nama) {
    setFieldError(els.loginNama, "Nama harus diisi");
    els.loginNama.focus();
    return;
  }

  clearFieldError(els.loginNama);

  setState({
    user: { nama, sekolah },
    preview: null
  });
  showView("dashboard");
  toast(`Selamat datang, ${escapeHtml(nama)}!`);
}

function logout() {
  clearAll();
  els.loginNama.value = "";
  els.loginSekolah.value = "";
  showView("login");
  toast("Anda telah keluar");
}

/* ================== DASHBOARD ================== */
function bindDashboardEvents() {
  /* Tombol-tombol di dashboard di-bind lewat onclick di HTML, tapi kita pastikan focus */
}

export function renderDashboard() {
  const state = getState();
  if (state.user) els.greet.textContent = `Halo, ${escapeHtml(state.user.nama)}`;

  const sets = state.saved || [];
  const total = sets.reduce((n, s) => n + (s.soal?.length || 0), 0);
  const uniq = new Set(sets.map(s => s.mapel).filter(Boolean)).size;

  els.statTotal.textContent = total;
  els.statSets.textContent = sets.length;
  els.statMapel.textContent = uniq;
}

/* ================== BUAT SOAL ================== */
function bindBuatEvents() {
  populateMapel();
  populateKelas();

  /* Generate tombol */
  document.getElementById("btn-generate").addEventListener("click", generateSoal);
  document.getElementById("btn-reset").addEventListener("click", resetForm);
  document.getElementById("btn-print-no-key").addEventListener("click", () => printSheet(false));
  document.getElementById("btn-print-with-key").addEventListener("click", () => printSheet(true));
  document.getElementById("btn-download-no-key").addEventListener("click", () => {
    if (exportWord(false)) toast("Berkas Word sedang diunduh");
  });
  document.getElementById("btn-download-with-key").addEventListener("click", () => {
    if (exportWord(true)) toast("Berkas Word sedang diunduh");
  });
  document.getElementById("btn-simpan").addEventListener("click", simpanSoal);

  /* CP textarea: Enter tanpa Shift = generate */
  els.fCp.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      generateSoal();
    }
  });

  /* Validasi real-time */
  els.fCp.addEventListener("blur", () => {
    const errors = validateCP(els.fCp.value);
    if (errors.length) setFieldError(els.fCp, errors[0]);
    else clearFieldError(els.fCp);
  });

  els.fJumlah.addEventListener("blur", () => {
    const errors = validateJumlah(els.fJumlah.value);
    if (errors.length) setFieldError(els.fJumlah, errors[0]);
    else clearFieldError(els.fJumlah);
  });
}

function populateMapel() {
  const sel = els.fMapel;
  sel.innerHTML = CONSTANTS.MAPEL.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join("");
}

function populateKelas() {
  const sel = els.fKelas;
  sel.innerHTML = CONSTANTS.KELAS
    .map(k => `<option value="${escapeHtml(k.kode)}">${escapeHtml(k.label)}</option>`)
    .join("");
}

function pickTemplate(mapel, level, i) {
  const set = templatesByMapel[mapel] || {};
  const arr = set[level] || [];
  if (arr.length === 0) return null;
  return arr[i % arr.length];
}

export function generateSoal() {
  const mapel = els.fMapel.value;
  const kelas = els.fKelas.value;
  const fase = faseDariKelas(kelas);
  const cp = els.fCp.value.trim();
  const level = els.fLevel.value;
  const tipe = els.fTipe.value;
  let jumlah = parseInt(els.fJumlah.value, 10);

  /* Validasi */
  const cpErrors = validateCP(cp);
  if (cpErrors.length) {
    setFieldError(els.fCp, cpErrors[0]);
    els.fCp.focus();
    return;
  }
  clearFieldError(els.fCp);

  const jumlahErrors = validateJumlah(els.fJumlah.value);
  if (jumlahErrors.length) {
    setFieldError(els.fJumlah, jumlahErrors[0]);
    els.fJumlah.focus();
    return;
  }
  clearFieldError(els.fJumlah);

  if (!jumlah || jumlah < CONSTANTS.MIN_JUMLAH_SOAL) jumlah = CONSTANTS.MIN_JUMLAH_SOAL;
  if (jumlah > CONSTANTS.MAX_JUMLAH_SOAL) jumlah = CONSTANTS.MAX_JUMLAH_SOAL;

  const soal = [];
  const isEssay = tipe === "essay";
  const pool = (templatesByMapel[mapel] || {})[level] || [];

  /* Bila mapel/level tidak punya template, hentikan dengan pesan jelas */
  if (pool.length === 0) {
    toast("Template untuk pilihan ini belum tersedia");
    return;
  }

  for (let i = 0; i < jumlah; i++) {
    const t = pickTemplate(mapel, level, i);
    const jawabMentah = t.jawab || "";
    const rubrikMentah = t.rubrik || "";
    soal.push({
      level,
      tipe,
      stem: escapeHtml(t.stem).replace(/\{M\}/g, `<strong>${escapeHtml(cp)}</strong>`),
      opsi: isEssay ? null : (t.opsi || []).map(o => escapeHtml(o).replace(/\{M\}/g, escapeHtml(cp))),
      jawab: escapeHtml(jawabMentah).replace(/\{M\}/g, escapeHtml(cp)),
      rubrik: escapeHtml(rubrikMentah).replace(/\{M\}/g, escapeHtml(cp))
    });
  }

  const preview = {
    mapel,
    kelas,
    fase,
    cp: escapeHtml(cp),
    level,
    tipe,
    soal,
    tanggal: new Date().toLocaleString("id-ID")
  };

  updatePreview(preview);
  renderPreview(preview);
  toast(`${jumlah} soal berhasil dibuat`);
}

export function renderPreview(p, container) {
  const data = p || getState().preview;
  const card = els.previewCard;
  const body = container || els.previewBody;

  if (!data) {
    if (card) card.style.display = "none";
    return;
  }
  if (card) card.style.display = "block";

  const faseLabel = formatFase(data.fase);
  const kelasLabel = data.kelas ? formatKelas(data.kelas) : faseLabel;
  const isEssay = data.tipe === "essay";

  let html = `
    <div style="margin-bottom:16px">
      <div style="font-weight:700;font-size:16px">${escapeHtml(data.mapel)} · ${escapeHtml(kelasLabel)}</div>
      <div class="hint">Materi: ${data.cp}</div>
      <div class="hint">Level: ${formatLevel(data.level)} · Bentuk: ${isEssay ? "Uraian" : "Pilihan Ganda"} · ${data.soal.length} soal</div>
    </div>`;

  data.soal.forEach((s, i) => {
    html += `<div class="soal-item">
      <div><span class="no">${i + 1}.</span>
        <span class="badge ${data.level.toLowerCase()}">${formatLevel(data.level)}</span></div>
      <div class="stem">${s.stem}</div>`;

    if (!isEssay && s.opsi) {
      s.opsi.forEach((o, k) => {
        html += `<div class="opsi"><strong>${String.fromCharCode(65 + k)}.</strong> ${o}</div>`;
      });
    }

    html += `<div class="jawab"><strong>Kunci / Jawaban:</strong> ${s.jawab}`;
    if (s.rubrik) html += `<br><strong>Rubrik:</strong> ${s.rubrik}`;
    html += `</div></div>`;
  });

  body.innerHTML = html;
}

export function resetForm() {
  els.fCp.value = "";
  els.fJumlah.value = "5";
  els.previewCard.style.display = "none";
  updatePreview(null);
  clearFieldError(els.fCp);
  clearFieldError(els.fJumlah);
  toast("Form di-reset");
}

export function simpanSoal() {
  const state = getState();
  if (!state.preview) {
    toast("Belum ada soal untuk disimpan");
    return;
  }

  const saved = [...(state.saved || [])];
  saved.unshift(JSON.parse(JSON.stringify(state.preview)));
  updateSaved(saved);
  toast("Soal disimpan ke Bank Soal");
  renderDashboard();
}

/* ================== BANK SOAL ================== */
function bindBankEvents() {
  els.searchBank.addEventListener("input", debounce(() => renderBank(), 150));
  document.getElementById("btn-reset-bank").addEventListener("click", resetBank);
}

export function renderBank() {
  const state = getState();
  const q = (els.searchBank.value || "").toLowerCase().trim();
  const all = state.saved || [];

  const filtered = all.filter(s => {
    if (!q) return true;
    const haystack = `${s.mapel || ""} ${s.cp || ""}`.toLowerCase();
    return haystack.includes(q);
  });

  if (filtered.length === 0) {
    els.bankBody.innerHTML = `<div class="empty">Belum ada soal tersimpan.<br>Buat soal di menu "Buat Soal" lalu simpan.</div>`;
    return;
  }

  let html = `<table><thead><tr><th>Tanggal</th><th>Mapel</th><th>Materi</th><th>Level</th><th>Jumlah</th><th>Aksi</th></tr></thead><tbody>`;
  filtered.forEach((s) => {
    const idx = all.indexOf(s);
    html += `<tr>
      <td class="hint">${escapeHtml(s.tanggal || "-")}</td>
      <td><strong>${escapeHtml(s.mapel || "-")}</strong></td>
      <td>${cut(s.cp || "", 50)}</td>
      <td><span class="badge ${(s.level || "c4").toLowerCase()}">${formatLevel(s.level || "C4")}</span></td>
      <td>${s.soal?.length || 0}</td>
      <td class="actions">
        <button class="btn ghost small" type="button" onclick="appOpenSaved(${idx})" title="Buka soal ini">Buka</button>
        <button class="btn ghost small" type="button" onclick="appDeleteSaved(${idx})" title="Hapus soal ini">Hapus</button>
      </td>
    </tr>`;
  });
  html += `</tbody></table>`;
  els.bankBody.innerHTML = html;
}

export function appOpenSaved(idx) {
  const state = getState();
  const item = state.saved[idx];
  if (!item) return;
  updatePreview(item);
  showView("buat");
  renderPreview(item);
  toast("Soal dibuka dari Bank Soal");
}

export function appDeleteSaved(idx) {
  const state = getState();
  if (!confirm("Hapus soal ini dari Bank Soal?")) return;
  const saved = [...state.saved];
  saved.splice(idx, 1);
  updateSaved(saved);
  renderBank();
  renderDashboard();
  toast("Soal dihapus");
}

export function resetBank() {
  if (!confirm("Hapus semua soal di Bank Soal?")) return;
  updateSaved([]);
  renderBank();
  renderDashboard();
  toast("Bank Soal dikosongkan");
}

/* ================== PROFIL ================== */
function bindProfilEvents() {
  document.getElementById("btn-simpan-profil").addEventListener("click", saveProfil);
}

function fillProfil() {
  const state = getState();
  els.pNama.value = state.user?.nama || "";
  els.pSekolah.value = state.user?.sekolah || "";
}

function saveProfil() {
  const state = getState();
  const nama = els.pNama.value.trim() || "Guru";
  const sekolah = els.pSekolah.value.trim();

  setState({ user: { nama, sekolah } });
  toast("Profil disimpan");
  renderDashboard();
}

/* ================== GLOBAL EVENTS ================== */
function bindGlobalEvents() {
  /* Theme toggle */
  if (els.themeToggle) {
    els.themeToggle.addEventListener("click", toggleTheme);
    /* Load saved theme */
    const savedTheme = localStorage.getItem("gensoal-theme");
    if (savedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      els.themeToggle.textContent = "☀️";
    } else {
      els.themeToggle.textContent = "🌙";
    }
  }

  /* Keyboard: Escape = logout jika sudah login */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const state = getState();
      if (state.user && document.activeElement.closest(".view")?.id !== "view-login") {
        logout();
      }
    }
  });
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute("data-theme") === "dark";
  if (isDark) {
    html.removeAttribute("data-theme");
    localStorage.setItem("gensoal-theme", "light");
    if (els.themeToggle) els.themeToggle.textContent = "🌙";
  } else {
    html.setAttribute("data-theme", "dark");
    localStorage.setItem("gensoal-theme", "dark");
    if (els.themeToggle) els.themeToggle.textContent = "☀️";
  }
}

/* ================== FIELD ERROR HELPERS ================== */
function setFieldError(inputEl, msg) {
  /* Hapus error lama jika ada */
  clearFieldError(inputEl);
  const field = inputEl.closest(".field");
  if (!field) return;
  field.classList.add("error");
  const err = document.createElement("div");
  err.className = "error-text";
  err.id = `error-${inputEl.id}`;
  err.setAttribute("role", "alert");
  err.textContent = msg;
  field.appendChild(err);
  inputEl.setAttribute("aria-invalid", "true");
  inputEl.setAttribute("aria-describedby", err.id);
}

function clearFieldError(inputEl) {
  const field = inputEl.closest(".field");
  if (!field) return;
  field.classList.remove("error");
  const err = field.querySelector(".error-text");
  if (err) err.remove();
  inputEl.removeAttribute("aria-invalid");
  inputEl.removeAttribute("aria-describedby");
}

/* ================== PRINT EVENTS ================== */
function bindPrintEvents() {
  /* Tombol cetak/unduh sudah di-bind di bindBuatEvents lewat id */
}

/* Expose untuk atribut onclick di HTML */
window.appShowView = showView;
window.appOpenSaved = appOpenSaved;
window.appDeleteSaved = appDeleteSaved;

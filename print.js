/* ============================================================
   GenSoal — print.js
   Membangun lembar soal bersih, mencetak, dan mengekspor ke Word
   ============================================================ */

import { CONSTANTS, escapeHtml, formatFase, formatLevel, formatKelas } from "./utils.js";
import { getState } from "./store.js";

/* ---------- Helper garis jawaban untuk soal uraian ---------- */
function answerLines(count) {
  let html = "";
  for (let i = 0; i < count; i++) {
    html += `<div class="answer-line"></div>`;
  }
  return html;
}

/* ---------- Bangun isi lembar soal (string HTML) ---------- */
export function buildSheet(data, withKey) {
  const d = data || getState().preview;
  if (!d) return "";

  const user = getState().user || {};
  const isEssay = d.tipe === "essay";

  /* Identitas sekolah dan guru diambil dari profil, boleh kosong */
  const sekolah = user.sekolah || "";
  const guru = user.nama || "";

  let html = "";

  /* Kepala lembar soal */
  html += `<h1>LEMBAR SOAL</h1>`;
  const kelasLabel = d.kelas ? formatKelas(d.kelas) : formatFase(d.fase);
  html += `<div class="meta">${escapeHtml(d.mapel)} · ${escapeHtml(kelasLabel)}</div>`;
  html += `<div class="meta">Materi: ${escapeHtml(d.cp || "")}</div>`;
  html += `<div class="meta">Level kognitif: ${escapeHtml(formatLevel(d.level))} · Bentuk soal: ${isEssay ? "Uraian" : "Pilihan Ganda"}</div>`;
  if (sekolah) html += `<div class="meta">Sekolah: ${escapeHtml(sekolah)}</div>`;
  if (guru) html += `<div class="meta">Guru: ${escapeHtml(guru)}</div>`;
  html += `<div class="meta">Nama: ________________________  Kelas: ____________  Tanggal: ____________</div>`;
  html += `<hr class="rule">`;

  /* Daftar soal */
  d.soal.forEach((s, i) => {
    html += `<div class="q">`;
    html += `<div class="stem"><strong>${i + 1}.</strong> ${s.stem}</div>`;

    if (!isEssay && Array.isArray(s.opsi)) {
      html += `<div class="opts">`;
      s.opsi.forEach((o, k) => {
        html += `<div>${String.fromCharCode(65 + k)}. ${o}</div>`;
      });
      html += `</div>`;
    }

    /* Ruang menjawab untuk soal uraian */
    if (isEssay && !withKey) {
      html += answerLines(4);
    }

    /* Kunci jawaban hanya bila diminta */
    if (withKey) {
      html += `<div class="kunci">Kunci / Jawaban: ${s.jawab || "-"}</div>`;
      if (s.rubrik) html += `<div class="kunci">Rubrik: ${s.rubrik}</div>`;
    }

    html += `</div>`;
  });

  return html;
}

/* ---------- Cetak lembar soal ---------- */
export function printSheet(withKey) {
  const sheet = document.getElementById("sheet");
  if (!sheet) return;

  const data = getState().preview;
  if (!data) {
    return;
  }

  sheet.innerHTML = buildSheet(data, withKey);

  /* Mode cetak: sembunyikan aplikasi, tampilkan lembar */
  document.body.classList.add("printing");

  const cleanUp = () => {
    document.body.classList.remove("printing");
    window.removeEventListener("afterprint", cleanUp);
  };
  window.addEventListener("afterprint", cleanUp);

  /* Cetak setelah render selesai */
  requestAnimationFrame(() => {
    window.print();
    /* Jaring pengaman bila afterprint tidak dipicu (beberapa browser mobile) */
    setTimeout(cleanUp, 1200);
  });
}

/* ---------- Ekspor ke Word (.doc via HTML) ---------- */
export function exportWord(withKey) {
  const data = getState().preview;
  if (!data) return false;

  const judul = `Soal ${data.mapel} - ${formatLevel(data.level)}`;
  const body = buildSheet(data, withKey);

  const doc = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${escapeHtml(judul)}</title>
<style>
  @page { size: A4; margin: 2cm; }
  body { font-family: "Times New Roman", serif; font-size: 12pt; line-height: 1.4; }
  h1 { font-size: 14pt; text-align: center; }
  .meta { font-size: 11pt; }
  .rule { border-top: 1.5px solid #000; }
  .q { margin-bottom: 14pt; }
  .opts { margin-left: 18pt; }
  .answer-line { border-bottom: 1px solid #999; height: 24pt; }
  .kunci { font-size: 10.5pt; font-style: italic; color: #333; }
</style>
</head>
<body>
${body}
</body>
</html>`;

  const blob = new Blob(["\ufeff", doc], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(judul)}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);

  return true;
}

/* ---------- Ubah judul jadi nama file aman ---------- */
function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "soal";
}

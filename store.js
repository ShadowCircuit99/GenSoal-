/* ============================================================
   GenSoal — store.js
   State management dengan localStorage sync (schema-safe)
   ============================================================ */

import { CONSTANTS } from "./utils.js";

/* Default state */
const DEFAULT_STATE = {
  user: null,
  preview: null,
  saved: []
};

/* Current state */
let state = { ...DEFAULT_STATE };

/* Subscribers for reactive UI */
const subscribers = new Set();

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function getState() {
  return state;
}

export function setState(next) {
  state = { ...state, ...next };
  persist();
  notify();
}

export function updatePreview(preview) {
  state.preview = preview;
  persist();
  notify();
}

export function updateSaved(saved) {
  state.saved = saved;
  persist();
  notify();
}

function persist() {
  try {
    const payload = {
      version: CONSTANTS.STORAGE_VERSION,
      data: state
    };
    localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    // Quota exceeded atau private mode — abaikan, tetap berjalan di memori
    console.warn("localStorage tidak tersedia:", e.message);
  }
}

function notify() {
  subscribers.forEach(fn => fn(state));
}

/* Load with version + schema validation */
export function load() {
  try {
    const raw = localStorage.getItem(CONSTANTS.STORAGE_KEY);
    if (!raw) {
      state = { ...DEFAULT_STATE };
      return state;
    }
    const parsed = JSON.parse(raw);

    /* Version check */
    if (!parsed || parsed.version !== CONSTANTS.STORAGE_VERSION) {
      /* Migrasi sederhana atau reset */
      state = { ...DEFAULT_STATE };
      return state;
    }

    const data = parsed.data || {};

    /* Schema minimal validation */
    if (
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      state = { ...DEFAULT_STATE };
      return state;
    }

    state = {
      user: data.user || null,
      preview: data.preview || null,
      saved: Array.isArray(data.saved) ? data.saved : []
    };
  } catch (e) {
    console.warn("Gagal memuat state dari localStorage:", e.message);
    state = { ...DEFAULT_STATE };
  }
  return state;
}

export function clearAll() {
  state = { ...DEFAULT_STATE };
  persist();
  notify();
}

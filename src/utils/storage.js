// localStorage can throw (private mode, blocked storage, quota) or contain
// corrupted/tampered data. These helpers never throw and validate the shape.
export function readJSON(key, fallback, validate) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return validate && !validate(parsed) ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function readString(key, fallback = null) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}

export function writeString(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

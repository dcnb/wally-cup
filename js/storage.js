// Browser-only persistence for tournaments. Everything lives in localStorage.
const KEY = 'wallycup.tournament.v1';

export function loadTournament() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function saveTournament(t) {
  try { localStorage.setItem(KEY, JSON.stringify(t)); return true; } catch { return false; }
}
export function clearTournament() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function downloadFile(name, text, mime = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type: mime + ';charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

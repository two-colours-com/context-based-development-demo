// Reguły ekranu liczone z danych, bez przeglądarki: sekcje „Na dziś” i postęp projektu.
// Importuje je app.js i testy (tests/na-dzis.test.mjs), więc nie dotykają DOM-u.

// Status w sekcji „zamkniete” kończy sprawę: szansa zamknięta, zadanie zrobione, projekt zakończony.
// Nieznany status traktujemy jak otwarty, żeby rekord nie zniknął z ekranu po literówce.
export const isClosed = (statusList, id) => (Array.isArray(statusList) ? statusList : []).some((s) => s.id === id && s.sekcja === 'zamkniete');

// Projekt zadania. Uszkodzony plik nie ma pola `projekt`, ale numer w nazwie pliku go zdradza (002.1-03 → 002.1).
export const taskProject = (t) => (t?.blad ? String(t.id ?? '').replace(/-\d+$/, '') : (t?.projekt ?? null));

const byDate = (a, b) => String(a.rec.data ?? '').localeCompare(String(b.rec.data ?? ''));

// „Na dziś” dla bieżącego użytkownika. Każdy wpis to { typ: 'szansa' | 'zadanie', rec }.
// - Do zrobienia: moje sprawy z terminem na dziś i wcześniej. Szansa bez terminu też (tak było od początku).
// - Przyszłe: moje sprawy z terminem po dziś.
// - Nieprzypisane: sprawy bez osoby, niezależnie od terminu.
// Zadanie bez terminu i zadanie zrobione nie trafiają do żadnej sekcji. Uszkodzone pliki też nie.
export function todayBuckets({ deals = [], tasks = [], dzis, me, statusy = [], statusyZadan = [] }) {
  const items = [
    ...deals.filter((s) => !s.blad && !isClosed(statusy, s.status)).map((rec) => ({ typ: 'szansa', rec })),
    ...tasks.filter((t) => !t.blad && t.data && !isClosed(statusyZadan, t.status)).map((rec) => ({ typ: 'zadanie', rec })),
  ].sort(byDate);
  const mine = items.filter((x) => x.rec.uzytkownik === me);
  return {
    doZrobienia: mine.filter((x) => !x.rec.data || x.rec.data <= dzis),
    przyszle: mine.filter((x) => x.rec.data > dzis),
    nieprzypisane: items.filter((x) => !x.rec.uzytkownik),
  };
}

// Ile dni po terminie (0, gdy termin jest dziś, w przyszłości albo go nie ma).
export function daysOverdue(data, dzis) {
  if (!data || !dzis) return 0;
  const n = Math.round((Date.parse(dzis) - Date.parse(String(data).slice(0, 10))) / 864e5);
  return n > 0 ? n : 0;
}

// Postęp projektu „X z Y”: zrobione zadania z wszystkich zadań projektu (uszkodzone liczą się do Y).
export function progress(projectId, tasks = [], statusyZadan = []) {
  const own = tasks.filter((t) => taskProject(t) === projectId);
  return { zrobione: own.filter((t) => !t.blad && isClosed(statusyZadan, t.status)).length, wszystkie: own.length };
}

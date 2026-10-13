// Numeracja projektów i zadań (doc/decisions/0002-numeracja.md, plan projekty-klienta).
// Czyste funkcje bez dostępu do dysku: korzysta z nich serwer i testy.
//
//   organizacja 002  →  projekt 002.1, 002.2 … 002.10  →  zadanie 002.1-01, 002.1-02

export const ORG_ID = /^\d{3}$/;
export const PROJECT_ID = /^(\d{3})\.([1-9]\d*)$/;
export const TASK_ID = /^(\d{3}\.[1-9]\d*)-(\d{2,})$/;

export const isProjectId = (id) => typeof id === 'string' && PROJECT_ID.test(id);
export const isTaskId = (id) => typeof id === 'string' && TASK_ID.test(id);

// 002.1 → 002, 002.1-03 → 002.1. Zły format → null.
export const orgOfProject = (id) => (typeof id === 'string' ? (PROJECT_ID.exec(id)?.[1] ?? null) : null);
export const projectOfTask = (id) => (typeof id === 'string' ? (TASK_ID.exec(id)?.[1] ?? null) : null);

// Kolejny numer projektu klienta: numer organizacji, kropka, największa użyta liczba tej organizacji + 1.
// Liczby porównujemy jako liczby, więc po 002.9 jest 002.10. Numerów nie używamy drugi raz.
export function nextProjectNumber(orgId, usedProjectIds) {
  if (typeof orgId !== 'string' || !ORG_ID.test(orgId)) throw new Error(`Niepoprawny numer organizacji: ${orgId}`);
  let max = 0;
  for (const id of usedProjectIds) {
    const m = typeof id === 'string' ? PROJECT_ID.exec(id) : null;
    if (m && m[1] === orgId) max = Math.max(max, Number(m[2]));
  }
  return `${orgId}.${max + 1}`;
}

// N-te zadanie projektu: numer projektu, myślnik, liczba co najmniej dwucyfrowa (002.1-01).
export function taskNumber(projectId, n) {
  if (!isProjectId(projectId)) throw new Error(`Niepoprawny numer projektu: ${projectId}`);
  if (!Number.isInteger(n) || n < 1) throw new Error(`Niepoprawny numer zadania: ${n}`);
  return `${projectId}-${String(n).padStart(2, '0')}`;
}

export function nextTaskNumber(projectId, usedTaskIds) {
  let max = 0;
  for (const id of usedTaskIds) {
    const m = typeof id === 'string' ? TASK_ID.exec(id) : null;
    if (m && m[1] === projectId) max = Math.max(max, Number(m[2]));
  }
  return taskNumber(projectId, max + 1);
}

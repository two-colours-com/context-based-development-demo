#!/usr/bin/env node
// Brain Stolarni Dąb: lokalny serwer prototypu.
//
//   node server.mjs                  → http://127.0.0.1:4400
//   PORT=4401 NO_OPEN=1 node server.mjs
//   DATA_DIR=/tmp/kopia node server.mjs   (inna baza, np. kopia danych w testach API)
//
// Bazą są pliki JSON w data/. Serwer nic nie trzyma w pamięci: każde zapytanie czyta pliki od nowa,
// a zmiany na dysku wypycha do przeglądarki (Server-Sent Events). Tylko standardowy Node (20+).

import { createServer } from 'node:http';
import { readFile, readdir, writeFile, rename, rm, stat, link, mkdir } from 'node:fs/promises';
import { watch } from 'node:fs';
import { join, extname, resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { isTaskId, nextProjectNumber, projectOfTask, taskNumber } from './lib/numeracja.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DATA = process.env.DATA_DIR ? resolve(process.env.DATA_DIR) : join(ROOT, 'data');
const PUBLIC = join(ROOT, 'public');
const PORT = Number(process.env.PORT ?? 4400);
// Jedyne adresy aplikacji. Inny nagłówek Host to np. obca domena podpięta pod 127.0.0.1 (DNS rebinding).
const HOSTS = new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`]);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/* ---- Odczyt bazy ---- */

const readJson = async (file) => JSON.parse(await readFile(file, 'utf-8'));

// Katalog w data/ to kolekcja (tablica rekordów, id = nazwa pliku), plik .json to pojedynczy dokument.
// Zepsuty plik nie wywraca całej aplikacji: rekord dostaje pole `blad`.
async function readDatabase() {
  const db = {};
  for (const entry of await readdir(DATA, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const path = join(DATA, entry.name);
    if (entry.isDirectory()) {
      const files = (await readdir(path)).filter((f) => f.endsWith('.json') && !f.startsWith('.')).sort();
      db[entry.name] = await Promise.all(
        files.map(async (f) => {
          const id = f.slice(0, -5);
          try {
            return { ...(await readJson(join(path, f))), id };
          } catch {
            return { id, blad: `Plik ${f} nie jest poprawnym JSON-em.` };
          }
        }),
      );
    } else if (entry.name.endsWith('.json')) {
      db[entry.name.slice(0, -5)] = await readJson(path).catch(() => ({ blad: `Plik ${entry.name} nie jest poprawnym JSON-em.` }));
    }
  }
  return db;
}

/* ---- Zapis atomowy ---- */

const localNow = () => new Date().toLocaleString('sv-SE').slice(0, 16).replace(' ', 'T'); // np. 2026-10-28T10:15
const queues = new Map();

// Czyta plik, nakłada zmianę i zapisuje przez plik tymczasowy z kropką + rename, więc nikt nie przeczyta
// połowy pliku. Gdy plik zmienił się między odczytem a zapisem (np. agent dopisał wpis), czytamy go
// ponownie i nakładamy zmianę jeszcze raz. Zapisy jednego pliku idą w kolejce. `change` zwraca null = bez zapisu.
function rewrite(file, change) {
  const run = (queues.get(file) ?? Promise.resolve()).then(async () => {
    for (let attempt = 0; ; attempt++) {
      const raw = await readFile(file, 'utf-8');
      const next = change(JSON.parse(raw));
      if (next === null) return null;
      const tmp = join(dirname(file), `.${randomUUID()}.tmp`);
      try {
        await writeFile(tmp, JSON.stringify(next, null, 2) + '\n', 'utf-8');
        if ((await readFile(file, 'utf-8').catch(() => null)) !== raw && attempt < 5) {
          await rm(tmp, { force: true });
          continue;
        }
        await rename(tmp, file);
        return next;
      } catch (error) {
        await rm(tmp, { force: true });
        throw error;
      }
    }
  });
  queues.set(file, run.catch(() => {}));
  return run;
}

/* ---- Zmiana szansy albo zadania z ekranu: biała lista pól, każda zmiana zostawia ślad w aktywności ---- */

const PRIORITIES = ['wysoki', 'sredni', 'niski'];
const validDay = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(Date.parse(`${v}T00:00:00Z`) || 0).toISOString().slice(0, 10) === v;
const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const statusList = (demo, key) => (Array.isArray(demo?.[key]) ? demo[key] : []);

// Co ekran może zmienić w danym rodzaju rekordu. Szansa dopisuje zmianę statusu także do `historia`, zadanie nie ma historii.
const EDITABLE = {
  szanse: {
    validId: (id) => /^SL-\d{3,}$/.test(id),
    missing: 'Nie ma takiej szansy.',
    historia: true,
    checks: (demo, isUser) => ({
      status: (v) => statusList(demo, 'statusy').some((s) => s.id === v),
      priorytet: (v) => v === null || PRIORITIES.includes(v),
      uzytkownik: (v) => v === null || isUser(v),
      data: (v) => v === null || validDay(v),
    }),
  },
  zadania: {
    validId: isTaskId,
    missing: 'Nie ma takiego zadania.',
    historia: false,
    checks: (demo, isUser) => ({
      status: (v) => statusList(demo, 'statusy_zadan').some((s) => s.id === v),
      uzytkownik: (v) => v === null || isUser(v),
      data: (v) => v === null || validDay(v),
    }),
  },
};

async function patchRecord(col, id, body) {
  const kind = EDITABLE[col];
  if (!kind.validId(id)) throw new ApiError(404, kind.missing);
  const [demo, users] = await Promise.all([readJson(join(DATA, 'demo.json')), readJson(join(DATA, 'uzytkownicy.json'))]);
  const isUser = (v) => users.some((u) => u.id === v);
  if (!isUser(body.autor)) throw new ApiError(400, 'Nieznany autor zmiany.');
  const zmiany = body.zmiany ?? {};
  if (!isObject(zmiany)) throw new ApiError(400, 'Niepoprawne zmiany.');
  const checks = kind.checks(demo, isUser);
  for (const [key, value] of Object.entries(zmiany)) {
    if (!Object.hasOwn(checks, key)) throw new ApiError(400, `Pola „${key}” nie zmienia się z ekranu.`);
    if (!checks[key](value)) throw new ApiError(400, `Niepoprawna wartość pola „${key}”.`);
  }
  const komentarz = typeof body.komentarz === 'string' ? body.komentarz.trim().slice(0, 5000) : '';

  return rewrite(join(DATA, col, `${id}.json`), (rec) => {
    if (!isObject(rec)) throw new SyntaxError();
    const now = localNow();
    const lista = [];
    for (const [pole, po] of Object.entries(zmiany)) {
      const przed = rec[pole] ?? null;
      if (przed === po) continue;
      lista.push({ pole, przed, po });
      rec[pole] = po;
      if (pole === 'status' && kind.historia) rec.historia = [...(Array.isArray(rec.historia) ? rec.historia : []), { status: po, data: now }];
    }
    if (!lista.length && !komentarz) return null;
    rec.aktywnosc = Array.isArray(rec.aktywnosc) ? rec.aktywnosc : [];
    if (lista.length) rec.aktywnosc.push({ data: now, autor: body.autor, typ: 'zmiana', zmiany: lista });
    if (komentarz) rec.aktywnosc.push({ data: now, autor: body.autor, typ: 'notatka', tresc: komentarz });
    return rec;
  });
}

/* ---- Projekt z wygranej szansy: numer od klienta, zadania z szablonu ---- */

// Rekordy kolekcji z nazwą pliku; uszkodzony plik ma `rec: null`. Brak katalogu = pusta kolekcja.
async function readCollection(col) {
  const files = await readdir(join(DATA, col)).catch((error) => (error.code === 'ENOENT' ? [] : Promise.reject(error)));
  return Promise.all(
    files
      .filter((f) => f.endsWith('.json') && !f.startsWith('.'))
      .map(async (f) => ({ id: f.slice(0, -5), rec: await readJson(join(DATA, col, f)).catch(() => null) })),
  );
}

// Nowe pliki bez nadpisywania: każdy przez plik tymczasowy z kropką, potem `link` pod docelową nazwę
// (link nie zastąpi istniejącego pliku, tylko zgłosi EEXIST). Projekt idzie ostatni, więc pojawia się
// razem z kompletem zadań. Gdy coś się nie uda, usuwamy pliki utworzone w tym wywołaniu.
async function createFiles(entries) {
  const created = [];
  try {
    for (const [file, rec] of entries) {
      await mkdir(dirname(file), { recursive: true });
      const tmp = join(dirname(file), `.${randomUUID()}.tmp`);
      await writeFile(tmp, JSON.stringify(rec, null, 2) + '\n', 'utf-8');
      try {
        await link(tmp, file);
        created.push(file);
      } finally {
        await rm(tmp, { force: true });
      }
    }
  } catch (error) {
    await Promise.all(created.map((file) => rm(file, { force: true })));
    throw error;
  }
}

// Zakładanie projektów idzie po kolei, żeby dwa szybkie kliknięcia nie wzięły tego samego numeru
// i nie założyły dwóch projektów dla jednej szansy.
let projectQueue = Promise.resolve();
function createProject(body) {
  const run = projectQueue.then(() => createProjectNow(body));
  projectQueue = run.catch(() => {});
  return run;
}

async function createProjectNow(body) {
  const dealId = body.szansa;
  if (typeof dealId !== 'string' || !/^SL-\d{3,}$/.test(dealId)) throw new ApiError(400, 'Podaj numer szansy, np. SL-014.');
  const [demo, deal] = await Promise.all([readJson(join(DATA, 'demo.json')), readJson(join(DATA, 'szanse', `${dealId}.json`))]);
  if (!isObject(deal)) throw new SyntaxError();
  const won = statusList(demo, 'statusy').find((s) => s.rola === 'wygrana');
  if (!won || deal.status !== won.id) throw new ApiError(409, `Projekt zakłada się z szansy w statusie „${won?.nazwa ?? 'wygrana'}”.`);
  const orgId = deal.organizacja;
  if (typeof orgId !== 'string' || !/^\d{3}$/.test(orgId)) throw new ApiError(409, `Szansa ${dealId} nie ma poprawnej organizacji.`);
  const template = demo.szablon_zadan;
  if (!Array.isArray(template) || !template.every((n) => typeof n === 'string' && n.trim())) throw new ApiError(409, 'Szablon zadań w demo.json ma błąd.');
  const projectStatus = statusList(demo, 'statusy_projektow')[0]?.id;
  const taskStatus = statusList(demo, 'statusy_zadan')[0]?.id;
  if (!projectStatus || !taskStatus) throw new ApiError(409, 'Brak statusów projektów albo zadań w demo.json.');

  for (let attempt = 0; attempt < 5; attempt++) {
    const projects = await readCollection('projekty');
    const existing = projects.find((p) => p.rec?.szansa === dealId);
    if (existing) throw new ApiError(409, `Szansa ${dealId} ma już projekt ${existing.id}.`);
    // Uszkodzony projekt tego klienta mógł powstać z tej szansy. Nie zgadujemy, tylko prosimy o poprawkę pliku.
    const broken = projects.find((p) => !p.rec && p.id.startsWith(`${orgId}.`));
    if (broken) throw new ApiError(409, `Plik projektu ${broken.id} ma błąd w danych. Popraw go, zanim założysz nowy projekt.`);
    // Numer liczymy też z zadań: osierocone zadanie 002.3-01 oznacza, że numer 002.3 już był użyty.
    const taskProjects = (await readCollection('zadania')).map((t) => projectOfTask(t.id)).filter(Boolean);
    const id = nextProjectNumber(orgId, [...projects.map((p) => p.id), ...taskProjects]);
    const day = localNow().slice(0, 10);
    const owner = deal.uzytkownik ?? null;
    const projekt = { nazwa: typeof deal.nazwa === 'string' && deal.nazwa.trim() ? deal.nazwa : dealId, organizacja: orgId, szansa: dealId, status: projectStatus, uzytkownik: owner, utworzono: day };
    const zadania = template.map((nazwa, i) => ({
      id: taskNumber(id, i + 1),
      rec: { projekt: id, nazwa: nazwa.trim(), status: taskStatus, uzytkownik: owner, data: null, utworzono: day, aktywnosc: [] },
    }));
    try {
      await createFiles([
        ...zadania.map((z) => [join(DATA, 'zadania', `${z.id}.json`), z.rec]),
        [join(DATA, 'projekty', `${id}.json`), projekt],
      ]);
      return { projekt: id, rekord: projekt, zadania: zadania.map((z) => z.id) };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error; // ktoś w tej chwili zapisał plik o tym numerze: liczymy od nowa
    }
  }
  throw new ApiError(409, 'Nie udało się nadać numeru projektu. Spróbuj jeszcze raz.');
}

/* ---- Na żywo: zmiany w data/ idą do przeglądarek ---- */

const listeners = new Set();
const changed = new Set();
let timer = null;

// Edytor albo agent zapisuje plik w kilku krokach, więc zdarzenia sklejamy w jedno powiadomienie (okno 120 ms).
watch(DATA, { recursive: true }, (_event, name) => {
  if (!name) return;
  const path = name.split(sep).join('/');
  if (path.split('/').pop().startsWith('.') || !path.endsWith('.json')) return;
  changed.add(path);
  clearTimeout(timer);
  timer = setTimeout(() => {
    const payload = `data: ${JSON.stringify({ pliki: [...changed] })}\n\n`;
    console.log(`  ${new Date().toLocaleTimeString('pl-PL')}  zmiana: ${[...changed].join(', ')}`);
    changed.clear();
    for (const res of listeners) res.write(payload);
  }, 120);
});

/* ---- Serwer ---- */

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': TYPES['.json'], 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  let text = '';
  for await (const chunk of req) {
    text += chunk;
    if (text.length > 50_000) throw new ApiError(413, 'Za duży ładunek.');
  }
  try {
    const body = JSON.parse(text);
    if (isObject(body)) return body;
  } catch {}
  throw new ApiError(400, 'Niepoprawny JSON.');
}

async function sendFile(res, file) {
  try {
    if (!(await stat(file)).isFile()) throw new Error();
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Nie znaleziono');
  }
}

const server = createServer(async (req, res) => {
  try {
    if (!HOSTS.has(req.headers.host)) return send(res, 403, { blad: 'Niedozwolony adres.' });
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);

    if (path === '/api/zdarzenia') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
      res.write(': polaczono\n\n');
      listeners.add(res);
      req.on('close', () => listeners.delete(res));
      return;
    }
    if (path === '/api/baza' && req.method === 'GET') return send(res, 200, await readDatabase());

    const patch = req.method === 'PATCH' && path.match(/^\/api\/(szanse|zadania)\/([^/]+)$/);
    const create = req.method === 'POST' && path === '/api/projekty';
    // Zapisywać może tylko ta aplikacja, nie dowolna strona otwarta w tej samej przeglądarce.
    if ((patch || create) && req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) return send(res, 403, { blad: 'Zapis tylko z aplikacji.' });
    if (patch) return send(res, 200, { ok: true, rekord: await patchRecord(patch[1], patch[2], await readBody(req)) });
    if (create) return send(res, 201, { ok: true, ...(await createProject(await readBody(req))) });
    if (path.startsWith('/api/')) return send(res, 404, { blad: 'Nieznany adres API.' });

    // Plik z public/ (tylko znane rozszerzenia), każdy inny adres to ekran aplikacji (routing robi przeglądarka).
    // Numery projektów i zadań mają kropkę (/projekty/002.1, /zadania/002.1-01), więc samo „ma rozszerzenie” nie wystarcza.
    if (!TYPES[extname(path)]) return sendFile(res, join(PUBLIC, 'index.html'));
    const file = resolve(PUBLIC, '.' + path);
    return file.startsWith(PUBLIC + sep) ? sendFile(res, file) : send(res, 404, { blad: 'Nie znaleziono.' });
  } catch (error) {
    if (error instanceof ApiError) return send(res, error.status, { blad: error.message });
    if (error.code === 'ENOENT') return send(res, 404, { blad: 'Nie ma takiego rekordu.' });
    if (error instanceof SyntaxError) return send(res, 409, { blad: 'Plik ma błąd w danych, zmiany nie da się zapisać.' });
    if (error instanceof URIError) return send(res, 400, { blad: 'Niepoprawny adres.' });
    console.error(error);
    send(res, 500, { blad: 'Błąd serwera.' });
  }
});

server.on('error', (error) => {
  const busy = error.code === 'EADDRINUSE';
  console.error(busy ? `\n  Port ${PORT} jest zajęty. Uruchom na innym: PORT=${PORT + 1} node server.mjs\n` : `\n  Serwer nie wystartował: ${error.message}\n`);
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', async () => {
  const address = `http://127.0.0.1:${PORT}`;
  const demo = await readJson(join(DATA, 'demo.json')).catch(() => null);
  console.log(`\n  ${demo?.firma?.nazwa ?? 'Brain'}  →  ${address}`);
  console.log('  Baza: data/ (zmiany w plikach widać na ekranie od razu). Zatrzymanie: Ctrl+C\n');
  if (process.env.NO_OPEN) return;
  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
  execFile(opener, [address], () => {});
});

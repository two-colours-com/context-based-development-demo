// API serwera na własnych danych testowych: odczyt projektów i zadań, zmiana zadania z ekranu,
// zmiany na żywo i zakładanie projektu z wygranej szansy. Serwer startuje na wolnym porcie z DATA_DIR
// w katalogu tymczasowym, więc test nie dotyka data/ i nie zależy od tego, co ktoś kliknął na pokazie.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { progress, todayBuckets } from '../public/reguly.js';

const SERVER = join(dirname(fileURLToPath(import.meta.url)), '..', 'server.mjs');
const STAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/* ---- Dane testowe: wycinek danych pokazu ze stanu startowego planu ---- */

const DEMO = {
  firma: { nazwa: 'Stolarnia Dąb', podpis: 'Test' },
  dzis: '2026-10-28',
  biezacy_uzytkownik: 'dawid',
  statusy: [
    { id: 'zapytanie', nazwa: 'Zapytanie', kolor: '#64748b', sekcja: 'aktywne' },
    { id: 'oferta', nazwa: 'Oferta', kolor: '#2563eb', sekcja: 'aktywne' },
    { id: 'zamowienie', nazwa: 'Zamówienie', kolor: '#059669', sekcja: 'zamkniete', rola: 'wygrana' },
    { id: 'przegrana', nazwa: 'Przegrana', kolor: '#e11d48', sekcja: 'zamkniete', rola: 'przegrana' },
  ],
  statusy_projektow: [
    { id: 'w-toku', nazwa: 'W toku', kolor: '#2563eb', sekcja: 'aktywne' },
    { id: 'zakonczony', nazwa: 'Zakończony', kolor: '#059669', sekcja: 'zamkniete' },
  ],
  statusy_zadan: [
    { id: 'do-zrobienia', nazwa: 'Do zrobienia', kolor: '#64748b', sekcja: 'aktywne' },
    { id: 'w-toku', nazwa: 'W toku', kolor: '#2563eb', sekcja: 'aktywne' },
    { id: 'zrobione', nazwa: 'Zrobione', kolor: '#059669', sekcja: 'zamkniete' },
  ],
  szablon_zadan: ['Pomiar końcowy', 'Produkcja', 'Montaż'],
};
const USERS = [{ id: 'dawid', imie_nazwisko: 'Dawid Lipiński' }, { id: 'marek', imie_nazwisko: 'Marek Jaworski' }];
const deal = (nazwa, organizacja, status, uzytkownik) => ({
  nazwa, organizacja, status, priorytet: null, wartosc: null, uzytkownik, data: '2026-10-20', utworzono: '2026-10-01',
  historia: [{ status, data: '2026-10-01T09:00' }], aktywnosc: [],
});
const FILES = {
  'demo.json': DEMO,
  'uzytkownicy.json': USERS,
  ...Object.fromEntries(['001', '002', '003', '007', '010'].map((id) => [`organizacje/${id}.json`, { nazwa: `Klient ${id}`, typ: 'firma' }])),
  'szanse/SL-011.json': deal('Kuchnia L 420 cm', '003', 'zamowienie', 'marek'),
  'szanse/SL-013.json': deal('Lada i półki', '001', 'zamowienie', 'marek'),
  'szanse/SL-014.json': deal('Recepcja i aneks kuchenny', '002', 'oferta', 'dawid'),
  'szanse/SL-018.json': deal('Szafki do pokoju nauczycielskiego', '007', 'oferta', 'dawid'),
  'szanse/SL-021.json': deal('Zabudowa przedpokoju', '003', 'oferta', 'dawid'),
  'szanse/SL-022.json': deal('Biurko i regał do domowego biura', '010', 'zamowienie', 'marek'),
  'projekty/001.1.json': { nazwa: 'Lada i półki', organizacja: '001', szansa: 'SL-013', status: 'zakonczony', uzytkownik: 'marek', utworzono: '2026-07-02' },
  'projekty/010.1.json': { nazwa: 'Biurko i regał', organizacja: '010', szansa: 'SL-022', status: 'w-toku', uzytkownik: 'marek', utworzono: '2026-10-07' },
  'zadania/010.1-01.json': { projekt: '010.1', nazwa: 'Zamówienie płyt i okuć', status: 'w-toku', uzytkownik: 'dawid', data: '2026-10-26', utworzono: '2026-10-07', aktywnosc: [] },
  'zadania/010.1-02.json': { projekt: '010.1', nazwa: 'Produkcja', status: 'do-zrobienia', uzytkownik: 'marek', data: '2026-10-28', utworzono: '2026-10-07', aktywnosc: [] },
  'zadania/010.1-03.json': { projekt: '010.1', nazwa: 'Montaż', status: 'do-zrobienia', uzytkownik: 'marek', data: null, utworzono: '2026-10-07', aktywnosc: [] },
};

/* ---- Serwer testowy ---- */

let dir;
let base;
let child;

const freePort = () =>
  new Promise((resolve, reject) => {
    const probe = createServer();
    probe.on('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });

const file = (rel) => join(dir, rel);
const write = (rel, data) => {
  mkdirSync(dirname(file(rel)), { recursive: true });
  writeFileSync(file(rel), typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n');
};
const readRec = (rel) => JSON.parse(readFileSync(file(rel), 'utf-8'));
const list = (col) => readdirSync(file(col)).filter((f) => f.endsWith('.json') && !f.startsWith('.')).map((f) => f.slice(0, -5)).sort();

async function call(method, path, body, headers = {}) {
  const res = await fetch(base + path, {
    method,
    headers: body === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, type: res.headers.get('content-type'), json, text };
}
const db = async () => (await call('GET', '/api/baza')).json;
const patchTask = (id, body) => call('PATCH', `/api/zadania/${id}`, { autor: 'dawid', ...body });
const createProject = (szansa, headers) => call('POST', '/api/projekty', { szansa }, headers);
const today = (baza) =>
  todayBuckets({ deals: baza.szanse, tasks: baza.zadania, dzis: baza.demo.dzis, me: 'dawid', statusy: baza.demo.statusy, statusyZadan: baza.demo.statusy_zadan });
const taskIdsIn = (bucket) => bucket.filter((x) => x.typ === 'zadanie').map((x) => x.rec.id);

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'brain-api-'));
  for (const [rel, data] of Object.entries(FILES)) write(rel, data);
  const port = await freePort();
  base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, [SERVER], { env: { ...process.env, DATA_DIR: dir, PORT: String(port), NO_OPEN: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((resolve, reject) => {
    let out = '';
    const timer = setTimeout(() => reject(new Error(`Serwer testowy nie wystartował: ${out}`)), 5000);
    child.stdout.on('data', (chunk) => {
      out += chunk;
      if (out.includes(base)) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.on('exit', (code) => reject(new Error(`Serwer testowy zakończył się (kod ${code}): ${out}`)));
  });
});

after(() => {
  child?.kill();
  if (dir) rmSync(dir, { recursive: true, force: true });
});

/* ---- Etap 1 ---- */

describe('Etap 1: projekty w bazie i na ekranie', () => {
  test('/api/baza oddaje projekty i zadania z nazwą pliku jako id', async () => {
    const baza = await db();
    assert.deepEqual(baza.projekty.map((p) => p.id), ['001.1', '010.1']);
    assert.equal(baza.projekty[1].szansa, 'SL-022');
    assert.equal(baza.projekty[1].organizacja, '010');
    assert.deepEqual(baza.zadania.map((z) => z.id), ['010.1-01', '010.1-02', '010.1-03']);
  });

  test('adresy z kropką w numerze otwierają ekran aplikacji, a nie 404', async () => {
    for (const path of ['/projekty', '/projekty/010.1', '/projekty/002.10', '/zadania/010.1-01']) {
      const r = await call('GET', path);
      assert.equal(r.status, 200, path);
      assert.match(r.type, /text\/html/, path);
    }
    const js = await call('GET', '/reguly.js');
    assert.equal(js.status, 200);
    assert.match(js.type, /javascript/);
  });

  test('uszkodzony plik projektu: ten jeden rekord ma komunikat, reszta listy działa', async () => {
    write('projekty/002.7.json', '{ "nazwa": "urwany');
    try {
      const baza = await db();
      assert.deepEqual(baza.projekty.map((p) => p.id), ['001.1', '002.7', '010.1']);
      const broken = baza.projekty.find((p) => p.id === '002.7');
      assert.match(broken.blad, /002\.7\.json nie jest poprawnym JSON-em/);
      assert.equal(baza.projekty.find((p) => p.id === '010.1').nazwa, 'Biurko i regał');
    } finally {
      rmSync(file('projekty/002.7.json'));
    }
  });
});

/* ---- Etap 2 ---- */

describe('Etap 2: zmiana zadania z ekranu, aktywność i „Na dziś”', () => {
  test('status, osoba i termin zmieniają się, a aktywność dostaje wpis kto, co i kiedy', async () => {
    const r = await patchTask('010.1-03', { zmiany: { uzytkownik: 'dawid', data: '2026-10-28' } });
    assert.equal(r.status, 200, r.text);
    const z = readRec('zadania/010.1-03.json');
    assert.equal(z.uzytkownik, 'dawid');
    assert.equal(z.data, '2026-10-28');
    assert.ok(!('historia' in z), 'zadanie nie ma historii statusów, zmiany są w aktywności');
    const last = z.aktywnosc.at(-1);
    assert.equal(last.typ, 'zmiana');
    assert.equal(last.autor, 'dawid');
    assert.match(last.data, STAMP);
    assert.deepEqual(last.zmiany, [
      { pole: 'uzytkownik', przed: 'marek', po: 'dawid' },
      { pole: 'data', przed: null, po: '2026-10-28' },
    ]);
  });

  test('zadanie z terminem dziś trafia do „Do zrobienia”, komentarz idzie do aktywności, „Zrobione” zdejmuje je z listy', async () => {
    let baza = await db();
    assert.deepEqual(taskIdsIn(today(baza).doZrobienia), ['010.1-01', '010.1-03'], 'zaległe 010.1-01 i dzisiejsze 010.1-03');

    const c = await patchTask('010.1-03', { komentarz: '  Pomiar umówiony na 9:00  ' });
    assert.equal(c.status, 200, c.text);
    const note = readRec('zadania/010.1-03.json').aktywnosc.at(-1);
    assert.deepEqual({ typ: note.typ, autor: note.autor, tresc: note.tresc }, { typ: 'notatka', autor: 'dawid', tresc: 'Pomiar umówiony na 9:00' });

    const s = await patchTask('010.1-03', { zmiany: { status: 'zrobione' } });
    assert.equal(s.status, 200, s.text);
    assert.deepEqual(readRec('zadania/010.1-03.json').aktywnosc.at(-1).zmiany, [{ pole: 'status', przed: 'do-zrobienia', po: 'zrobione' }]);
    baza = await db();
    assert.deepEqual(taskIdsIn(today(baza).doZrobienia), ['010.1-01']);
    assert.deepEqual(progress('010.1', baza.zadania, baza.demo.statusy_zadan), { zrobione: 1, wszystkie: 3 });
  });

  test('zadanie bez terminu nie pojawia się w „Na dziś”', async () => {
    const r = await patchTask('010.1-01', { zmiany: { data: null } });
    assert.equal(r.status, 200, r.text);
    const b = today(await db());
    assert.ok(![...b.doZrobienia, ...b.przyszle, ...b.nieprzypisane].some((x) => x.rec.id === '010.1-01'));
  });

  test('ekran zmienia tylko status, osobę i termin, i tylko na poprawne wartości', async () => {
    const before = readFileSync(file('zadania/010.1-02.json'), 'utf-8');
    const cases = [
      [{ zmiany: { nazwa: 'Inna nazwa' } }, 400],
      [{ zmiany: { projekt: '001.1' } }, 400],
      [{ zmiany: { priorytet: 'wysoki' } }, 400],
      [{ zmiany: { status: 'zamowienie' } }, 400],
      [{ zmiany: { uzytkownik: 'ktos' } }, 400],
      [{ zmiany: { data: '2026-02-30' } }, 400],
      [{ zmiany: { constructor: 'x' } }, 400],
      [{ autor: 'obcy', komentarz: 'x' }, 400],
    ];
    for (const [body, code] of cases) assert.equal((await patchTask('010.1-02', body)).status, code, JSON.stringify(body));
    assert.equal(readFileSync(file('zadania/010.1-02.json'), 'utf-8'), before, 'odrzucona zmiana nie dotyka pliku');
    assert.equal((await patchTask('099.1-01', { komentarz: 'x' })).status, 404);
    assert.equal((await call('PATCH', '/api/zadania/..%2Fdemo', { autor: 'dawid', komentarz: 'x' })).status, 404);
  });

  test('uszkodzony plik zadania: komunikat przy rekordzie, zapis z ekranu odmawia, reszta działa', async () => {
    write('zadania/010.1-09.json', '{ zepsute');
    try {
      const baza = await db();
      assert.match(baza.zadania.find((z) => z.id === '010.1-09').blad, /nie jest poprawnym JSON-em/);
      assert.equal(baza.zadania.find((z) => z.id === '010.1-02').nazwa, 'Produkcja');
      assert.equal((await patchTask('010.1-09', { komentarz: 'x' })).status, 409);
    } finally {
      rmSync(file('zadania/010.1-09.json'));
    }
  });

  test('zmiana pliku zadania przez agenta od razu idzie do przeglądarki (zdarzenie na żywo)', async () => {
    const ctrl = new AbortController();
    const res = await fetch(`${base}/api/zdarzenia`, { signal: ctrl.signal });
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = decoder.decode((await reader.read()).value); // „: polaczono”
    const z = readRec('zadania/010.1-02.json');
    z.aktywnosc.push({ data: '2026-10-28T10:00', autor: 'agent', typ: 'notatka', tresc: 'Płyty dojechały.' });
    write('zadania/010.1-02.json', z);
    const deadline = Date.now() + 4000;
    while (!text.includes('zadania/010.1-02.json') && Date.now() < deadline) {
      const chunk = await Promise.race([reader.read(), new Promise((r) => setTimeout(() => r({ value: null }), deadline - Date.now()))]);
      if (chunk.done) break;
      if (chunk.value) text += decoder.decode(chunk.value);
    }
    ctrl.abort();
    assert.match(text, /"pliki":\[[^\]]*"zadania\/010\.1-02\.json"/);
  });
});

/* ---- Etap 3 ---- */

describe('Etap 3: projekt z wygranej szansy', () => {
  test('szansa w innym statusie niż „Zamówienie” nie zakłada projektu', async () => {
    const r = await createProject('SL-014');
    assert.equal(r.status, 409);
    assert.match(r.json.blad, /Zamówienie/);
    assert.ok(!existsSync(file('projekty/002.1.json')));
  });

  test('zamówienie SL-014 zakłada 002.1 z nazwą i opiekunem szansy oraz trzema zadaniami z szablonu bez terminów', async () => {
    const p = await call('PATCH', '/api/szanse/SL-014', { autor: 'dawid', zmiany: { status: 'zamowienie' } });
    assert.equal(p.status, 200, p.text);
    assert.equal(readRec('szanse/SL-014.json').historia.at(-1).status, 'zamowienie', 'zmiana statusu szansy dopisuje wpis w historii');
    const r = await createProject('SL-014');
    assert.equal(r.status, 201, r.text);
    assert.equal(r.json.projekt, '002.1');
    assert.deepEqual(r.json.zadania, ['002.1-01', '002.1-02', '002.1-03']);

    const projekt = readRec('projekty/002.1.json');
    assert.deepEqual({ ...projekt, utworzono: 'x' }, {
      nazwa: 'Recepcja i aneks kuchenny', organizacja: '002', szansa: 'SL-014', status: 'w-toku', uzytkownik: 'dawid', utworzono: 'x',
    });
    assert.match(projekt.utworzono, DAY);
    const zadania = ['002.1-01', '002.1-02', '002.1-03'].map((id) => readRec(`zadania/${id}.json`));
    assert.deepEqual(zadania.map((z) => z.nazwa), ['Pomiar końcowy', 'Produkcja', 'Montaż']);
    for (const z of zadania) {
      assert.deepEqual({ projekt: z.projekt, status: z.status, uzytkownik: z.uzytkownik, data: z.data, aktywnosc: z.aktywnosc }, {
        projekt: '002.1', status: 'do-zrobienia', uzytkownik: 'dawid', data: null, aktywnosc: [],
      });
    }
    const leftovers = readdirSync(file('zadania')).concat(readdirSync(file('projekty'))).filter((f) => f.startsWith('.'));
    assert.deepEqual(leftovers, [], 'po zapisie nie zostają pliki tymczasowe');
    assert.deepEqual(readRec('szanse/SL-014.json').aktywnosc.length, 1, 'plik szansy: tylko wpis o zmianie statusu, projekt go nie zmienia');
  });

  test('drugie kliknięcie dla tej samej szansy nie robi 002.2', async () => {
    const r = await createProject('SL-014');
    assert.equal(r.status, 409);
    assert.match(r.json.blad, /ma już projekt 002\.1/);
    assert.deepEqual(list('projekty'), ['001.1', '002.1', '010.1']);
    assert.equal(list('zadania').filter((id) => id.startsWith('002.')).length, 3);
  });

  test('szansa z projektem z danych startowych też nie dostaje drugiego (SL-013 → 001.1)', async () => {
    const r = await createProject('SL-013');
    assert.equal(r.status, 409);
    assert.ok(!existsSync(file('projekty/001.2.json')));
  });

  test('dwa jednoczesne kliknięcia zakładają jeden projekt', async () => {
    const results = await Promise.all([createProject('SL-011'), createProject('SL-011')]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
    assert.deepEqual(list('projekty').filter((id) => id.startsWith('003.')), ['003.1']);
  });

  test('numer już użyty przez osierocone zadanie nie wraca: kolejny projekt 003 to 003.3', async () => {
    write('zadania/003.2-01.json', { projekt: '003.2', nazwa: 'Zostawione przez agenta', status: 'do-zrobienia', uzytkownik: null, data: null, utworzono: '2026-10-28', aktywnosc: [] });
    const before = readFileSync(file('zadania/003.2-01.json'), 'utf-8');
    await call('PATCH', '/api/szanse/SL-021', { autor: 'dawid', zmiany: { status: 'zamowienie' } });
    const r = await createProject('SL-021');
    assert.equal(r.status, 201, r.text);
    assert.equal(r.json.projekt, '003.3');
    assert.equal(readFileSync(file('zadania/003.2-01.json'), 'utf-8'), before, 'istniejący plik nie jest nadpisany');
  });

  test('uszkodzony projekt tego klienta blokuje zakładanie, zamiast zgadywać', async () => {
    write('projekty/007.1.json', '{ zepsute');
    await call('PATCH', '/api/szanse/SL-018', { autor: 'dawid', zmiany: { status: 'zamowienie' } });
    const r = await createProject('SL-018');
    assert.equal(r.status, 409);
    assert.match(r.json.blad, /007\.1 ma błąd w danych/);
    assert.deepEqual(list('projekty').filter((id) => id.startsWith('007.')), ['007.1']);
  });

  test('drugi status z rolą „wygrana” też zakłada projekt, a odmowa wymienia oba', async () => {
    const czesciowe = { id: 'zamowienie-czesciowe', nazwa: 'Zamówienie częściowe', kolor: '#0d9488', sekcja: 'zamkniete', rola: 'wygrana' };
    write('demo.json', { ...DEMO, statusy: [...DEMO.statusy, czesciowe] });
    try {
      write('szanse/SL-031.json', deal('Szafa wnękowa', '001', 'zamowienie-czesciowe', 'marek'));
      const r = await createProject('SL-031');
      assert.equal(r.status, 201, r.text);
      assert.equal(r.json.projekt, '001.2');
      assert.deepEqual(r.json.zadania, ['001.2-01', '001.2-02', '001.2-03']);
      write('szanse/SL-032.json', deal('Półki do spiżarni', '001', 'oferta', 'marek'));
      const o = await createProject('SL-032');
      assert.equal(o.status, 409);
      assert.match(o.json.blad, /„Zamówienie” albo „Zamówienie częściowe”/);
    } finally {
      write('demo.json', DEMO);
    }
  });

  test('bez szablonu zadań (brak pola albo null) projekt powstaje bez zadań, a szablon z błędem dalej blokuje', async () => {
    const { szablon_zadan: _, ...bezSzablonu } = DEMO;
    write('szanse/SL-033.json', deal('Regał do salonu', '010', 'zamowienie', 'marek'));
    try {
      write('demo.json', { ...DEMO, szablon_zadan: 'Pomiar końcowy' });
      const zly = await createProject('SL-033');
      assert.equal(zly.status, 409);
      assert.match(zly.json.blad, /Szablon zadań w demo\.json ma błąd/);

      write('demo.json', bezSzablonu);
      const r = await createProject('SL-033');
      assert.equal(r.status, 201, r.text);
      assert.equal(r.json.projekt, '010.2');
      assert.deepEqual(r.json.zadania, []);
      assert.equal(readRec('projekty/010.2.json').szansa, 'SL-033');
      assert.deepEqual(list('zadania').filter((id) => id.startsWith('010.2-')), []);

      write('szanse/SL-034.json', deal('Biurko do pracowni', '010', 'zamowienie', 'marek'));
      write('demo.json', { ...DEMO, szablon_zadan: null });
      const n = await createProject('SL-034');
      assert.equal(n.status, 201, n.text);
      assert.equal(n.json.projekt, '010.3');
      assert.deepEqual(n.json.zadania, []);
      assert.equal(readRec('projekty/010.3.json').szansa, 'SL-034');
      assert.deepEqual(list('zadania').filter((id) => id.startsWith('010.3-')), []);
    } finally {
      write('demo.json', DEMO);
    }
  });

  test('zapis tylko z aplikacji i tylko z poprawnym numerem szansy', async () => {
    assert.equal((await createProject('SL-022', { Origin: 'http://evil.example' })).status, 403);
    assert.equal((await createProject('../demo')).status, 400);
    assert.equal((await createProject(undefined)).status, 400);
    assert.equal((await createProject('SL-404')).status, 404);
  });
});

/* ---- Poprawka z bramki ---- */

describe('Poprawka z bramki: termin tylko z lat 2000-2099', () => {
  // Chrome przy wpisywaniu roku z klawiatury oddaje po drodze 0002-10-28, 0020-10-28... (bramka 2.1).
  test('termin 0020-10-28 zadania i szansy: 400 z komunikatem i plik bez zmian, a 2026-10-28 się zapisuje', async () => {
    const records = {
      'zadania/010.1-08.json': { projekt: '010.1', nazwa: 'Pomiar końcowy', status: 'do-zrobienia', uzytkownik: 'dawid', data: null, utworzono: '2026-10-28', aktywnosc: [] },
      'szanse/SL-040.json': deal('Szafa wnękowa', '001', 'oferta', 'dawid'),
    };
    try {
      for (const [rel, rec] of Object.entries(records)) {
        write(rel, rec);
        const path = `/api/${rel.slice(0, -5)}`;
        const before = readFileSync(file(rel), 'utf-8');
        for (const data of ['0020-10-28', '1999-12-31', '2100-01-01']) {
          const r = await call('PATCH', path, { autor: 'dawid', zmiany: { data } });
          assert.equal(r.status, 400, `${rel}: ${data}`);
          assert.match(r.json.blad, /termin.*2000-2099/, `${rel}: komunikat mówi, jaki termin jest dobry`);
        }
        assert.equal(readFileSync(file(rel), 'utf-8'), before, `${rel}: odrzucony termin nie dotyka pliku`);

        const ok = await call('PATCH', path, { autor: 'dawid', zmiany: { data: '2026-10-28' } });
        assert.equal(ok.status, 200, ok.text);
        const saved = readRec(rel);
        assert.equal(saved.data, '2026-10-28');
        assert.deepEqual(saved.aktywnosc.map((a) => a.zmiany), [[{ pole: 'data', przed: rec.data, po: '2026-10-28' }]], `${rel}: jeden wpis w aktywności`);
      }
    } finally {
      for (const rel of Object.keys(records)) rmSync(file(rel), { force: true });
    }
  });
});

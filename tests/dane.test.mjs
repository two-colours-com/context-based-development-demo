// Spójność bazy w data/. Uruchom po każdej zmianie plików: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isProjectId, isTaskId, orgOfProject, projectOfTask } from '../lib/numeracja.mjs';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const STAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const EMAIL = /^[^\s@]+@([a-z0-9-]+\.)*example\.pl$/;
const COLOR = /^#[0-9a-f]{6}$/i;
const ACTIVITY_TYPES = ['notatka', 'telefon', 'spotkanie', 'mail', 'zmiana'];

const walk = (dir) =>
  readdirSync(dir)
    .filter((n) => !n.startsWith('.'))
    .flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
const read = (rel) => JSON.parse(readFileSync(join(DATA, rel), 'utf-8'));
const collection = (dir) =>
  readdirSync(join(DATA, dir))
    .filter((f) => f.endsWith('.json') && !f.startsWith('.'))
    .map((f) => ({ id: f.slice(0, -5), rec: read(`${dir}/${f}`) }));

// Ładowane w testach, nie przy imporcie: zepsuty plik ma oblać test, a nie wywrócić całego pliku testów.
const load = () => ({
  demo: read('demo.json'),
  users: read('uzytkownicy.json'),
  dashboard: read('dashboard.json'),
  orgs: collection('organizacje'),
  deals: collection('szanse'),
  projects: collection('projekty'),
  tasks: collection('zadania'),
});

test('każdy plik w data/ to poprawny JSON', () => {
  for (const file of walk(DATA)) {
    const name = relative(DATA, file);
    assert.ok(file.endsWith('.json'), `${name}: w data/ leżą tylko pliki .json`);
    assert.doesNotThrow(() => JSON.parse(readFileSync(file, 'utf-8')), `${name} nie jest poprawnym JSON-em`);
  }
});

test('identyfikatory mają dobry format, a nazwa pliku jest jedynym id', () => {
  const { users, orgs, deals } = load();
  for (const { id, rec } of orgs) {
    assert.match(id, /^\d{3}$/, `organizacje/${id}.json: numer organizacji to trzy cyfry, np. 001`);
    assert.ok(!('id' in rec), `organizacje/${id}.json: pole id jest zbędne, id to nazwa pliku`);
  }
  for (const { id, rec } of deals) {
    assert.match(id, /^SL-\d{3}$/, `szanse/${id}.json: numer szansy to SL- i trzy cyfry, np. SL-014`);
    assert.ok(!('id' in rec), `szanse/${id}.json: pole id jest zbędne, id to nazwa pliku`);
  }
  assert.ok(Array.isArray(users) && users.length, 'uzytkownicy.json: lista użytkowników');
  for (const u of users) assert.match(u.id, /^[a-z]+$/, `uzytkownicy.json: id „${u.id}” to małe litery bez polskich znaków`);
  assert.equal(new Set(users.map((u) => u.id)).size, users.length, 'uzytkownicy.json: id się powtarza');
});

test('odnośniki wskazują istniejące rekordy', () => {
  const { demo, users, orgs, deals } = load();
  const userIds = new Set(users.map((u) => u.id));
  const orgIds = new Set(orgs.map((o) => o.id));
  assert.ok(userIds.has(demo.biezacy_uzytkownik), `demo.json: biezacy_uzytkownik „${demo.biezacy_uzytkownik}” nie istnieje`);
  for (const { id, rec } of deals) {
    assert.ok(orgIds.has(rec.organizacja), `${id}: organizacja „${rec.organizacja}” nie istnieje`);
    assert.ok(rec.uzytkownik === null || userIds.has(rec.uzytkownik), `${id}: opiekun „${rec.uzytkownik}” nie istnieje`);
    for (const a of rec.aktywnosc ?? []) assert.ok(a.autor === 'agent' || userIds.has(a.autor), `${id}: autor wpisu „${a.autor}” nie istnieje`);
  }
});

test('szanse: status z demo.json, poprawne pola i daty', () => {
  const { demo, deals } = load();
  const statusIds = new Set(demo.statusy.map((s) => s.id));
  for (const { id, rec } of deals) {
    assert.ok(statusIds.has(rec.status), `${id}: status „${rec.status}” nie istnieje w demo.json`);
    assert.ok([null, 'wysoki', 'sredni', 'niski'].includes(rec.priorytet), `${id}: priorytet to wysoki, sredni, niski albo null`);
    assert.ok(rec.wartosc === null || (Number.isInteger(rec.wartosc) && rec.wartosc >= 0), `${id}: wartość to złote netto, liczba całkowita albo null`);
    assert.ok(rec.data === null || DAY.test(rec.data), `${id}: termin w formacie RRRR-MM-DD`);
    assert.ok(rec.data === null || /^20\d{2}-/.test(rec.data), `${id}: termin z lat 2000-2099 (tylko taki przyjmuje serwer)`);
    assert.match(rec.utworzono, DAY, `${id}: utworzono w formacie RRRR-MM-DD`);
    assert.ok(Array.isArray(rec.historia) && rec.historia.length, `${id}: historia ma co najmniej jeden wpis`);
    for (const h of rec.historia) {
      assert.ok(statusIds.has(h.status), `${id}: status „${h.status}” w historii nie istnieje w demo.json`);
      assert.match(h.data, STAMP, `${id}: data w historii w formacie RRRR-MM-DDTGG:MM`);
    }
    assert.equal(rec.historia.at(-1).status, rec.status, `${id}: ostatni wpis historii musi mieć bieżący status`);
    for (const a of rec.aktywnosc ?? []) assert.match(a.data, STAMP, `${id}: data wpisu aktywności w formacie RRRR-MM-DDTGG:MM`);
  }
});

test('historia szansy rośnie chronologicznie', () => {
  for (const { id, rec } of load().deals) {
    rec.historia.slice(1).forEach((h, i) => {
      assert.ok(h.data >= rec.historia[i].data, `${id}: wpis historii ${h.data} jest wcześniejszy niż poprzedni (${rec.historia[i].data})`);
    });
  }
});

test('organizacje: typ, osoba kontaktowa i fikcyjne e-maile', () => {
  for (const { id, rec } of load().orgs) {
    assert.ok(rec.nazwa, `organizacje/${id}.json: brak nazwy`);
    assert.ok(['firma', 'osoba prywatna'].includes(rec.typ), `organizacje/${id}.json: typ to „firma” albo „osoba prywatna”`);
    assert.ok(rec.osoba_kontaktowa?.imie_nazwisko, `organizacje/${id}.json: brak osoby kontaktowej`);
    const email = rec.osoba_kontaktowa.email;
    assert.ok(email == null || EMAIL.test(email), `organizacje/${id}.json: e-mail tylko w domenie example.pl (dane fikcyjne)`);
  }
});

test('dashboard: znane typy kart i szerokość 2-12', () => {
  const { demo, users, dashboard } = load();
  const statusIds = new Set(demo.statusy.map((s) => s.id));
  const cards = dashboard.karty;
  assert.ok(Array.isArray(cards), 'dashboard.json: brak listy karty');
  assert.equal(new Set(cards.map((c) => c.id)).size, cards.length, 'dashboard.json: id kart się powtarza');
  for (const c of cards) {
    assert.ok(['liczba', 'statusy', 'lista'].includes(c.typ), `karta ${c.id}: typ to liczba, statusy albo lista`);
    assert.ok(Number.isInteger(c.szer) && c.szer >= 2 && c.szer <= 12, `karta ${c.id}: szer to liczba całkowita 2-12`);
    for (const s of c.cfg?.statusy ?? []) assert.ok(statusIds.has(s), `karta ${c.id}: status „${s}” nie istnieje`);
    if (c.cfg?.uzytkownik) assert.ok(users.some((u) => u.id === c.cfg.uzytkownik), `karta ${c.id}: użytkownik „${c.cfg.uzytkownik}” nie istnieje`);
  }
});

/* ---- Projekty klienta i zadania (plan projekty-klienta) ---- */

test('demo.json: statusy projektów i zadań z kolorami oraz szablon zadań', () => {
  const { demo } = load();
  for (const key of ['statusy', 'statusy_projektow', 'statusy_zadan']) {
    const list = demo[key];
    assert.ok(Array.isArray(list) && list.length, `demo.json: brak listy ${key}`);
    assert.equal(new Set(list.map((s) => s.id)).size, list.length, `demo.json: id w ${key} się powtarza`);
    for (const s of list) {
      assert.match(s.id, /^[a-z-]+$/, `demo.json ${key}: id „${s.id}” to małe litery i myślniki`);
      assert.ok(s.nazwa, `demo.json ${key}: status ${s.id} bez nazwy`);
      assert.match(s.kolor, COLOR, `demo.json ${key}: status ${s.id} ma kolor w formacie #rrggbb`);
      assert.ok(['aktywne', 'zamkniete'].includes(s.sekcja), `demo.json ${key}: sekcja statusu ${s.id} to aktywne albo zamkniete`);
    }
    assert.ok(list.some((s) => s.sekcja === 'zamkniete'), `demo.json ${key}: potrzebny status kończący (sekcja zamkniete)`);
  }
  assert.deepEqual(demo.statusy_projektow.map((s) => s.id), ['w-toku', 'zakonczony']);
  assert.deepEqual(demo.statusy_zadan.map((s) => s.id), ['do-zrobienia', 'w-toku', 'zrobione']);
  assert.ok(Array.isArray(demo.szablon_zadan) && demo.szablon_zadan.every((n) => typeof n === 'string' && n.trim()), 'demo.json: szablon_zadan to lista nazw zadań. Projekt bez zadań to pusta lista [], pola nie usuwaj');
});

test('projekty: numer od klienta, odnośniki do organizacji, szansy i opiekuna, status z demo.json', () => {
  const { demo, users, orgs, deals, projects } = load();
  const userIds = new Set(users.map((u) => u.id));
  const orgIds = new Set(orgs.map((o) => o.id));
  const dealById = new Map(deals.map((d) => [d.id, d.rec]));
  const statusIds = new Set(demo.statusy_projektow.map((s) => s.id));
  const seenDeals = new Map();
  for (const { id, rec } of projects) {
    assert.ok(isProjectId(id), `projekty/${id}.json: numer projektu to numer klienta, kropka i liczba, np. 002.1`);
    assert.ok(!('id' in rec), `projekty/${id}.json: pole id jest zbędne, id to nazwa pliku`);
    assert.ok(typeof rec.nazwa === 'string' && rec.nazwa.trim(), `projekty/${id}.json: brak nazwy`);
    assert.equal(rec.organizacja, orgOfProject(id), `projekty/${id}.json: organizacja musi się zgadzać z numerem projektu`);
    assert.ok(orgIds.has(rec.organizacja), `projekty/${id}.json: organizacja „${rec.organizacja}” nie istnieje`);
    assert.ok(dealById.has(rec.szansa), `projekty/${id}.json: szansa „${rec.szansa}” nie istnieje`);
    assert.equal(dealById.get(rec.szansa).organizacja, rec.organizacja, `projekty/${id}.json: szansa ${rec.szansa} jest innego klienta`);
    assert.ok(!seenDeals.has(rec.szansa), `projekty/${id}.json: szansa ${rec.szansa} ma już projekt ${seenDeals.get(rec.szansa)}`);
    seenDeals.set(rec.szansa, id);
    assert.ok(rec.uzytkownik === null || userIds.has(rec.uzytkownik), `projekty/${id}.json: opiekun „${rec.uzytkownik}” nie istnieje`);
    assert.ok(statusIds.has(rec.status), `projekty/${id}.json: status „${rec.status}” nie istnieje w statusy_projektow`);
    assert.match(rec.utworzono, DAY, `projekty/${id}.json: utworzono w formacie RRRR-MM-DD`);
  }
});

test('zadania: numer od projektu, odnośniki do projektu i osoby, status z demo.json, daty', () => {
  const { demo, users, projects, tasks } = load();
  const userIds = new Set(users.map((u) => u.id));
  const projectIds = new Set(projects.map((p) => p.id));
  const statusIds = new Set(demo.statusy_zadan.map((s) => s.id));
  for (const { id, rec } of tasks) {
    assert.ok(isTaskId(id), `zadania/${id}.json: numer zadania to numer projektu, myślnik i dwie cyfry, np. 002.1-01`);
    assert.ok(!('id' in rec), `zadania/${id}.json: pole id jest zbędne, id to nazwa pliku`);
    assert.ok(typeof rec.nazwa === 'string' && rec.nazwa.trim(), `zadania/${id}.json: brak nazwy`);
    assert.equal(rec.projekt, projectOfTask(id), `zadania/${id}.json: projekt musi się zgadzać z numerem zadania`);
    assert.ok(projectIds.has(rec.projekt), `zadania/${id}.json: projekt „${rec.projekt}” nie istnieje`);
    assert.ok(statusIds.has(rec.status), `zadania/${id}.json: status „${rec.status}” nie istnieje w statusy_zadan`);
    assert.ok(rec.uzytkownik === null || userIds.has(rec.uzytkownik), `zadania/${id}.json: osoba „${rec.uzytkownik}” nie istnieje`);
    assert.ok(rec.data === null || DAY.test(rec.data), `zadania/${id}.json: termin w formacie RRRR-MM-DD albo null`);
    assert.ok(rec.data === null || /^20\d{2}-/.test(rec.data), `zadania/${id}.json: termin z lat 2000-2099 (tylko taki przyjmuje serwer)`);
    assert.match(rec.utworzono, DAY, `zadania/${id}.json: utworzono w formacie RRRR-MM-DD`);
    assert.ok(Array.isArray(rec.aktywnosc), `zadania/${id}.json: aktywnosc to lista (może być pusta)`);
    for (const a of rec.aktywnosc) {
      assert.match(a.data, STAMP, `zadania/${id}.json: data wpisu aktywności w formacie RRRR-MM-DDTGG:MM`);
      assert.ok(a.autor === 'agent' || userIds.has(a.autor), `zadania/${id}.json: autor wpisu „${a.autor}” nie istnieje`);
      assert.ok(ACTIVITY_TYPES.includes(a.typ), `zadania/${id}.json: typ wpisu „${a.typ}” spoza listy`);
      if (a.typ === 'zmiana') assert.ok(Array.isArray(a.zmiany) && a.zmiany.length, `zadania/${id}.json: wpis „zmiana” bez listy zmian`);
      else assert.ok(typeof a.tresc === 'string' && a.tresc.trim(), `zadania/${id}.json: wpis „${a.typ}” bez treści`);
    }
  }
});

// Etap 1 i 2: reguły ekranu bez przeglądarki (public/reguly.js): sekcje „Na dziś” i postęp projektu „X z Y”.
// Dane testowe w pliku, żeby wynik nie zależał od tego, co ktoś zmienił w data/ na pokazie.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { daysOverdue, progress, taskProject, todayBuckets } from '../public/reguly.js';

const DZIS = '2026-10-28';
const STATUSY = [
  { id: 'oferta', sekcja: 'aktywne' },
  { id: 'zamowienie', sekcja: 'zamkniete', rola: 'wygrana' },
];
const STATUSY_ZADAN = [
  { id: 'do-zrobienia', sekcja: 'aktywne' },
  { id: 'w-toku', sekcja: 'aktywne' },
  { id: 'zrobione', sekcja: 'zamkniete' },
];
const task = (id, fields) => ({ id, projekt: id.replace(/-\d+$/, ''), nazwa: id, status: 'do-zrobienia', uzytkownik: 'dawid', data: null, ...fields });
const buckets = (tasks, deals = []) => todayBuckets({ deals, tasks, dzis: DZIS, me: 'dawid', statusy: STATUSY, statusyZadan: STATUSY_ZADAN });
const ids = (list) => list.map((x) => x.rec.id);
const everywhere = (b) => [...b.doZrobienia, ...b.przyszle, ...b.nieprzypisane].map((x) => x.rec.id);

describe('Etap 2: zadania w „Na dziś”', () => {
  test('moje zadanie z terminem na dziś i zaległe są w „Do zrobienia” jako zadania, zaległe ma liczbę dni', () => {
    const b = buckets([task('010.1-01', { data: '2026-10-26', status: 'w-toku' }), task('002.1-01', { data: DZIS })]);
    assert.deepEqual(ids(b.doZrobienia), ['010.1-01', '002.1-01'], 'najstarszy termin u góry');
    assert.ok(b.doZrobienia.every((x) => x.typ === 'zadanie'), 'wpis wie, że to zadanie (plakietka „Zadanie”)');
    assert.equal(daysOverdue('2026-10-26', DZIS), 2, 'zaległe: 2 dni po terminie');
    assert.equal(daysOverdue(DZIS, DZIS), 0, 'termin dziś to nie zaległość');
    assert.equal(daysOverdue('2026-10-30', DZIS), 0);
    assert.equal(daysOverdue(null, DZIS), 0);
  });

  test('zadanie zrobione nie trafia do „Na dziś”, nawet zaległe', () => {
    const b = buckets([task('002.1-01', { data: DZIS, status: 'zrobione' }), task('002.1-02', { data: '2026-10-01', status: 'zrobione', uzytkownik: null })]);
    assert.deepEqual(everywhere(b), []);
  });

  test('zadanie bez terminu nie trafia do żadnej sekcji, także bez osoby', () => {
    const b = buckets([task('010.1-03', { data: null }), task('002.1-03', { data: null, uzytkownik: null })]);
    assert.deepEqual(everywhere(b), []);
  });

  test('zadanie bez osoby z terminem jest w „Nieprzypisane”, a nie w moich', () => {
    const b = buckets([task('002.1-02', { data: '2026-11-03', uzytkownik: null })]);
    assert.deepEqual(ids(b.nieprzypisane), ['002.1-02']);
    assert.deepEqual(ids(b.doZrobienia), []);
    assert.deepEqual(ids(b.przyszle), []);
  });

  test('moje zadanie z terminem po dziś jest w „Przyszłe”, zadanie innej osoby nie jest na mojej liście', () => {
    const b = buckets([task('002.1-01', { data: '2026-10-30' }), task('010.1-02', { data: DZIS, uzytkownik: 'marek' })]);
    assert.deepEqual(ids(b.przyszle), ['002.1-01']);
    assert.ok(!everywhere(b).includes('010.1-02'));
  });

  test('zmiana statusu na „Zrobione” zdejmuje zadanie z listy (scenariusz 2)', () => {
    const z = task('002.1-01', { data: DZIS });
    assert.deepEqual(ids(buckets([z]).doZrobienia), ['002.1-01']);
    assert.deepEqual(everywhere(buckets([{ ...z, status: 'zrobione' }])), []);
  });

  test('szanse i zadania stoją razem, posortowane po terminie; szanse bez zmian w zasadach', () => {
    const deals = [
      { id: 'SL-014', status: 'oferta', uzytkownik: 'dawid', data: '2026-10-26' },
      { id: 'SL-099', status: 'oferta', uzytkownik: 'dawid', data: null },
      { id: 'SL-013', status: 'zamowienie', uzytkownik: 'dawid', data: '2026-07-02' },
      { id: 'SL-019', status: 'oferta', uzytkownik: null, data: DZIS },
    ];
    const b = buckets([task('010.1-01', { data: '2026-10-27' })], deals);
    assert.deepEqual(ids(b.doZrobienia), ['SL-099', 'SL-014', '010.1-01'], 'szansa bez terminu zostaje w „Do zrobienia” jak dotąd, zamknięta znika');
    assert.deepEqual(b.doZrobienia.map((x) => x.typ), ['szansa', 'szansa', 'zadanie']);
    assert.deepEqual(ids(b.nieprzypisane), ['SL-019']);
  });

  test('uszkodzony plik zadania nie psuje „Na dziś”', () => {
    const b = buckets([{ id: '002.1-09', blad: 'Plik 002.1-09.json nie jest poprawnym JSON-em.' }, task('002.1-01', { data: DZIS })]);
    assert.deepEqual(ids(b.doZrobienia), ['002.1-01']);
  });
});

describe('Etap 1: postęp projektu „X z Y”', () => {
  const tasks = [
    task('001.1-01', { status: 'zrobione' }),
    task('001.1-02', { status: 'zrobione' }),
    task('001.1-03', { status: 'zrobione' }),
    task('010.1-01', { status: 'w-toku' }),
    task('010.1-02', {}),
    task('010.1-03', {}),
  ];
  test('liczy zrobione zadania z wszystkich zadań projektu', () => {
    assert.deepEqual(progress('001.1', tasks, STATUSY_ZADAN), { zrobione: 3, wszystkie: 3 });
    assert.deepEqual(progress('010.1', tasks, STATUSY_ZADAN), { zrobione: 0, wszystkie: 3 });
    assert.deepEqual(progress('002.1', tasks, STATUSY_ZADAN), { zrobione: 0, wszystkie: 0 });
    const afterScenario2 = [...tasks, task('002.1-01', { status: 'zrobione' }), task('002.1-02', {}), task('002.1-03', {})];
    assert.deepEqual(progress('002.1', afterScenario2, STATUSY_ZADAN), { zrobione: 1, wszystkie: 3 }, '„1 z 3” po scenariuszu 2');
  });

  test('uszkodzone zadanie liczy się do wszystkich i trafia do swojego projektu po numerze pliku', () => {
    const broken = { id: '010.1-04', blad: 'Plik 010.1-04.json nie jest poprawnym JSON-em.' };
    assert.equal(taskProject(broken), '010.1');
    assert.equal(taskProject(task('002.10-01', {})), '002.10');
    assert.deepEqual(progress('010.1', [...tasks, broken], STATUSY_ZADAN), { zrobione: 0, wszystkie: 4 });
  });
});

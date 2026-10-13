// Etap 1 i 3: reguła numeracji projektów i zadań (lib/numeracja.mjs).
// Numery z danych startowych planu wpisane na sztywno: test nie zależy od tego, co ktoś kliknął na pokazie.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isProjectId, isTaskId, nextProjectNumber, nextTaskNumber, orgOfProject, projectOfTask, taskNumber } from '../lib/numeracja.mjs';

const START_PROJECTS = ['001.1', '010.1'];
const START_TASKS = ['001.1-01', '001.1-02', '001.1-03', '010.1-01', '010.1-02', '010.1-03'];
const TEMPLATE = ['Pomiar końcowy', 'Produkcja', 'Montaż'];

describe('Etap 1: numer projektu od numeru klienta', () => {
  test('na danych startowych: kolejny projekt dla 002 to 002.1, dla 001 to 001.2', () => {
    assert.equal(nextProjectNumber('002', START_PROJECTS), '002.1');
    assert.equal(nextProjectNumber('001', START_PROJECTS), '001.2');
    assert.equal(nextProjectNumber('010', START_PROJECTS), '010.2');
    assert.equal(nextProjectNumber('002', [...START_PROJECTS, '002.1']), '002.2', 'po założeniu 002.1 kolejny to 002.2');
  });

  test('liczy się tylko ta sama organizacja, a liczby rosną jak liczby, nie jak tekst', () => {
    assert.equal(nextProjectNumber('002', []), '002.1');
    assert.equal(nextProjectNumber('002', ['001.4', '020.1', '010.7']), '002.1');
    assert.equal(nextProjectNumber('002', ['002.1', '002.9']), '002.10');
    assert.equal(nextProjectNumber('002', ['002.10', '002.2']), '002.11');
    assert.equal(nextProjectNumber('002', ['002.3']), '002.4', 'luka w numeracji nie jest wypełniana: numerów nie używamy drugi raz');
  });

  test('złe numery są pomijane albo odrzucane', () => {
    assert.equal(nextProjectNumber('002', ['002', '002.x', '002.0', '002.01', null, 42]), '002.1');
    assert.throws(() => nextProjectNumber('2', []));
    assert.throws(() => nextProjectNumber('SL-014', []));
  });

  test('format numeru projektu: trzy cyfry, kropka, liczba od 1', () => {
    for (const ok of ['001.1', '002.10', '999.123']) assert.ok(isProjectId(ok), ok);
    for (const bad of ['02.1', '002', '002.0', '002.01', '002.1-01', 'SL-014', '002.1/..', '']) assert.ok(!isProjectId(bad), bad);
    assert.equal(orgOfProject('002.1'), '002');
    assert.equal(orgOfProject('zly'), null);
  });
});

describe('Etap 3: numery zadań w nowym projekcie', () => {
  test('zadania projektu 002.1 to 002.1-01, 002.1-02, 002.1-03 (z szablonu)', () => {
    assert.deepEqual(
      TEMPLATE.map((_, i) => taskNumber('002.1', i + 1)),
      ['002.1-01', '002.1-02', '002.1-03'],
    );
    assert.equal(taskNumber('002.1', 10), '002.1-10');
  });

  test('kolejne zadanie projektu liczy się z jego własnych zadań', () => {
    assert.equal(nextTaskNumber('002.1', []), '002.1-01');
    assert.equal(nextTaskNumber('002.1', ['002.1-01', '002.1-02', '010.1-05', '002.10-07']), '002.1-03');
    assert.equal(nextTaskNumber('010.1', START_TASKS), '010.1-04');
  });

  test('format numeru zadania i odczyt projektu z numeru', () => {
    for (const ok of ['002.1-01', '010.12-99', '002.1-100']) assert.ok(isTaskId(ok), ok);
    for (const bad of ['002.1-1', '002.1', '002.1-ab', '../demo', '002.1-01.json', 'SL-014']) assert.ok(!isTaskId(bad), bad);
    assert.equal(projectOfTask('002.1-03'), '002.1');
    assert.equal(projectOfTask('002.10-01'), '002.10');
    assert.equal(projectOfTask('zly'), null);
    assert.throws(() => taskNumber('002', 1));
    assert.throws(() => taskNumber('002.1', 0));
  });
});

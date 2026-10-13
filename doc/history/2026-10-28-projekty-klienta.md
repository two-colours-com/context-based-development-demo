# Projekty klienta z zadaniami

**Gałąź:** `feat/projekty-klienta` · **Plan:** [plan](../plans/projekty-klienta/plan.md) · **Decyzja:** [0004](../decisions/0004-zadania-w-osobnych-plikach.md) · **Status:** w trakcie

## Cel
Szansa kończyła się zamówieniem i Brain się na tym urywał. Po zmianie wygrana szansa zamienia się w projekt klienta z numerem od numeru klienta (002.1), a projekt ma zadania z osobą, terminem i aktywnością. Zadania na dziś stoją w „Na dziś” obok szans. Właściciel produktu chciał zobaczyć całość od razu, więc trzy etapy powstały w jednym przebiegu.

## Plan wykonania (przed kodem)
1. Dane: `statusy_projektow`, `statusy_zadan` i `szablon_zadan` w `demo.json`, katalogi `data/projekty/` i `data/zadania/` z 001.1 i 010.1 z planu.
2. Reguły bez przeglądarki: numeracja w `lib/numeracja.mjs` (serwer i testy), sekcje „Na dziś” i postęp projektu w `public/reguly.js` (ekran i testy).
3. Serwer: wspólna ścieżka zmiany z ekranu dla szansy i zadania (`PATCH /api/zadania/:id`), `POST /api/projekty` z blokadą drugiego projektu dla tej samej szansy, poprawka routingu adresów z kropką.
4. Ekran: zakładka i karta projektu, widok zadania, sekcje w organizacji i szansie, zadania w „Na dziś”.
5. Testy per etap (numeracja, spójność plików, „Na dziś”, API na kopii danych), potem trzy scenariusze w przeglądarce.

## Decyzje wspólne

### Testy nie zależą od stanu danych pokazu
**Wybór:** testy reguł i API mają własne dane w pliku testu. Test API uruchamia serwer na wolnym porcie z `DATA_DIR` w katalogu tymczasowym. Test `dane.test.mjs` sprawdza tylko spójność, nie stan startowy.
**Odrzucone:** testy na `data/` („kolejny projekt dla 002 to 002.1” liczony z katalogu). Po kliknięciu „Załóż projekt” na scenie albo po oznaczeniu zadania jako zrobione `node --test` zrobiłby się czerwony, a agent uznałby, że dane są zepsute (AGENTS.md, zasada 10).
**Skutek:** serwer czyta zmienną `DATA_DIR` (domyślnie `data/`). Stan startowy z planu sprawdziły scenariusze w przeglądarce.

### Dane startowe
001.1 „Lada i półki” (z SL-013, zakończony, trzy zrobione zadania) i 010.1 „Biurko i regał” (z SL-022, w toku): zaległe zadanie Dawida (26.10), zadanie Marka na 28.10 i montaż bez terminu. Aktywność 001.1 trzyma się dat z SL-013: pomiar i produkcja w lipcu, montaż 20-21 sierpnia. Brief mówił o czerwcu-lipcu, ale projekt powstał dopiero przy zamówieniu 2 lipca, a montaż w SL-013 jest w sierpniu.

## Etap 1: Projekty

### Numer projektu liczony jako największy + 1
**Wybór:** `lib/numeracja.mjs`: numer klienta, kropka, największa użyta liczba tego klienta plus jeden. Liczby porównujemy jako liczby (po 002.9 jest 002.10).
**Odrzucone:** wypełnianie luk (002.2 po usunięciu). Numerów nie używamy drugi raz (ADR 0002). Porównanie tekstowe: 002.10 stanęłoby przed 002.2.

### Adresy z kropką w numerze
**Pułapka:** serwer traktował każdy adres z „rozszerzeniem” jako plik z `public/`, więc `/projekty/002.1` (rozszerzenie `.1`) i `/zadania/002.1-01` dawały 404.
**Wybór:** plikiem jest tylko adres ze znanym rozszerzeniem (`.html`, `.js`, `.css`, `.json`, `.svg`). Reszta to ekran aplikacji.
**Odrzucone:** lista tras ekranu w serwerze (drugi router do pilnowania), zamiana kropki w adresie na inny znak (numer w adresie przestałby być numerem z rozmowy).

### Lista projektów według sekcji statusu
**Wybór:** „W toku” i „Zakończone” wynikają z pola `sekcja` w `statusy_projektow`, tak jak „W grze” i „Zamknięte” przy szansach. Uszkodzony plik projektu stoi w „W toku” z komunikatem, a na karcie organizacji trafia do klienta po numerze pliku (005.1 → 005).
**Odrzucone:** twarde `w-toku`/`zakonczony` w kodzie. Nowy status dodany przez agenta (np. „wstrzymany”) wypadłby z listy.

### Postęp liczony, nie zapisywany
„X z Y” to zrobione zadania (sekcja `zamkniete`) z wszystkich zadań projektu. Uszkodzone zadanie liczy się do Y, żeby nie zniknęło z rachunku. Karta projektu nie zmienia pól projektu. Status i nazwę zmienia agent, zgodnie z planem.

## Etap 2: Zadania i „Na dziś”

### Jedna ścieżka zmiany dla szansy i zadania
**Wybór:** serwer ma jedną funkcję zmiany z ekranu i opis pól dla każdej kolekcji (szansa: status, priorytet, opiekun, termin; zadanie: status, osoba, termin). Zadanie nie ma `historia`, zmiana statusu zostaje jako wpis `zmiana` w aktywności (ADR 0004).
**Odrzucone:** kopia funkcji szansy dla zadań. Dwie kopie białej listy i zapisu atomowego szybko by się rozjechały.

### Reguły „Na dziś” w module bez przeglądarki
**Wybór:** `public/reguly.js` (sekcje „Na dziś”, dni po terminie, postęp). Importuje go `app.js` i testy.
**Odrzucone:** logika w `app.js` (bez przeglądarki nie da się jej sprawdzić) i moduł w `lib/` serwowany osobną trasą (więcej kodu w serwerze).
**Zasady:** zadanie z terminem dziś i wcześniej jest w „Do zrobienia”, z terminem po dziś w „Przyszłe”, bez osoby w „Nieprzypisane”. Zadanie bez terminu i zrobione nie trafia nigdzie, nawet bez osoby. Szansa bez terminu zostaje w „Do zrobienia” jak dotąd: to świadoma różnica z planu, nie błąd.

### Wiersz zadania w „Na dziś”
Plakietka „Zadanie” (klasa `tag`), pod nazwą „Projekt 010.1 · klient”, kolumna priorytetu pusta. Kolumna numeru w „Na dziś” jest szersza (002.1-01 jest dłuższy niż SL-014). Nagłówek kolumny został „Opiekun”, bo dotyczy też szans.

## Etap 3: Projekt z wygranej szansy

### Jedna szansa, jeden projekt
**Wybór:** serwer sprawdza, czy jakiś projekt ma już tę szansę, i wtedy zwraca błąd. Zakładanie projektów idzie po kolei (kolejka w serwerze), więc dwa szybkie kliknięcia nie wezmą tego samego numeru. Wygrana to status z `rola: "wygrana"`, nie wpisane na sztywno `zamowienie`.
**Odrzucone:** pilnowanie tylko na ekranie (ukryty przycisk). Drugie okno albo agent i tak mogłyby założyć 002.2.

### Kilka plików bez transakcji
**Wybór:** najpierw zadania, na końcu projekt. Każdy plik powstaje przez plik tymczasowy z kropką i `link`, który nie nadpisze istniejącego pliku. Przy błędzie serwer usuwa pliki utworzone w tym wywołaniu.
**Odrzucone:** `rename` jak przy zmianie szansy. Nadpisałby plik, który agent zapisał w tej samej chwili pod tym numerem.
**Skutek:** numer projektu liczymy też z numerów zadań, więc zadanie bez projektu (np. 003.2-01) blokuje numer 003.2.

### Uszkodzony projekt klienta blokuje zakładanie
Jeśli plik projektu tego klienta jest uszkodzony, serwer nie wie, czy to nie projekt z tej samej szansy. Prosi o poprawkę pliku, zamiast ryzykować drugi projekt.

### Co dostaje nowy projekt
Nazwę i opiekuna szansy, pierwszy status z `statusy_projektow`, zadania z `szablon_zadan` z pierwszym statusem zadań, bez terminów, z osobą = opiekunem szansy i pustą aktywnością. `utworzono` to dzień z zegara komputera, nie `dzis` (ADR 0003). Plik szansy zostaje bez zmian: odnośnik „Projekt 002.1” ekran liczy z pola `szansa` w projekcie. Po założeniu ekran przechodzi na kartę projektu (scenariusz 1).

## Świadome pominięcia
- Wszystko z „Poza zakresem” planu: usuwanie i zmiana nazw z ekranu, dodawanie pojedynczego zadania z ekranu, zależności, Gantt, czas pracy, załączniki, powiadomienia.
- Pola projektu (status, opiekun) nie zmieniają się z ekranu. Robi to agent.
- Niezrobione zadanie zakończonego projektu dalej pojawia się w „Na dziś”. Liczy się status zadania, nie projektu.
- Kolejka zakładania działa w jednym procesie serwera. Przed równoległym zapisem agenta chroni `link` (brak nadpisania), nie kolejka.
- Na wąskim ekranie wiersze zadań mają ten sam prosty układ co „Na dziś”.

## Jak testować
Automat: `node --test` (44 testy). Etapy są w nazwach grup testów: numeracja (`tests/numeracja.test.mjs`), spójność plików (`tests/dane.test.mjs`), „Na dziś” i postęp (`tests/na-dzis.test.mjs`), API na danych testowych (`tests/api.test.mjs`).

Scenariusze z planu (sprawdzone w przeglądarce 1920×1080):
1. Szanse → SL-014 → status „Zamówienie” → „Załóż projekt” → karta 002.1 „Recepcja i aneks kuchenny” z trzema zadaniami → Organizacje → 002 → 002.1 w „Projekty” → SL-014 → odnośnik „Projekt 002.1”, przycisku już nie ma.
2. Projekty → 002.1 → „Pomiar końcowy”: osoba Dawid, termin 2026-10-28 → Na dziś → zadanie w „Do zrobienia” z plakietką „Zadanie” → komentarz „Pomiar umówiony na 9:00” → status „Zrobione” → zadanie znika z „Na dziś” → 002.1 pokazuje „1 z 3”.
3. Zadanie bez terminu nie jest w „Na dziś”. Szansa w statusie „Oferta” (SL-018) nie ma przycisku „Załóż projekt”.

Do checklisty bramki (sprawdza się okiem):
- Zakładka „Projekty” w menu, lista z klientem, postępem i opiekunem.
- Karta 010.1: klient 010 i szansa SL-022 jako klikalne odnośniki.
- Organizacja 001 ma 001.1 w „Projekty”, organizacja bez projektów (np. 004) pokazuje „Brak projektów.”.
- SL-013 ma odnośnik „Projekt 001.1”.
- Uszkodzony plik projektu (np. `data/projekty/005.1.json` z urwanym JSON-em) pokazuje „Ten rekord ma błąd w danych.” przy 005.1, reszta listy działa. Po próbie usuń plik.
- Agent dopisuje wpis do `data/zadania/010.1-01.json`: wpis pojawia się w widoku zadania w ciągu sekundy, miga, na dole jest komunikat.
- Zaległe zadanie 010.1-01 ma „2 dni po terminie”.

Po próbie: `git checkout -- data/szanse/` i usunięcie plików 002.1 (`data/projekty/002.1.json`, `data/zadania/002.1-*.json`). Uwaga: `git checkout -- data/` na tej gałęzi przed commitem cofnie też nowe pola w `demo.json`.

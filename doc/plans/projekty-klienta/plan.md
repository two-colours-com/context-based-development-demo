# Projekty klienta z zadaniami

**Slug:** `projekty-klienta` · **Data:** 2026-10-28 · **Status:** zrobione

## Problem
Szansa kończy się zamówieniem i na tym Brain się urywa. Widzę organizację 002, ale nie widzę,
co dla niej robimy, kto za co odpowiada ani co trzeba zrobić dziś. Numer klienta nie prowadzi do jego projektów.

## Co zobaczysz po zmianie
- W menu nowa zakładka „Projekty”: numer, nazwa, klient, postęp zadań („1 z 3”), opiekun.
- Projekt ma numer klienta: Firma Demo to 002, więc jej pierwszy projekt to 002.1, kolejny 002.2.
- Karta projektu: klient, szansa, z której powstał, opiekun i lista zadań.
- Zadanie otwiera się jak szansa: status, osoba, termin, a z boku aktywność z datami i pole na komentarz.
- Zadania z terminem na dziś są w „Na dziś” obok szans, z plakietką „Zadanie”.
- Karta organizacji ma sekcję „Projekty”, a szansa link do swojego projektu.
- Na szansie w statusie „Zamówienie” jest przycisk „Załóż projekt”.

## Zakres
- Projekty przypięte do organizacji i szansy, z numeracją od numeru klienta.
- Zadania w projektach: nazwa, status, osoba, termin, aktywność. Status, osobę i termin zmieniasz z ekranu.
- Zadania w „Na dziś” według tych samych zasad co szanse.
- Założenie projektu z wygranej szansy, z zadaniami startowymi z szablonu.

## Poza zakresem
- Usuwanie projektów i zadań z ekranu, zmiana ich nazw (robi to agent w plikach).
- Dodawanie pojedynczego zadania z ekranu (na później).
- Zależności między zadaniami, wykres Gantta, czas pracy, załączniki, powiadomienia.

## Model danych
Nowe katalogi `data/projekty/` i `data/zadania/`. Nazwa pliku to identyfikator.

`data/projekty/002.1.json`:
```json
{
  "nazwa": "Recepcja i aneks kuchenny",
  "organizacja": "002",
  "szansa": "SL-014",
  "status": "w-toku",
  "uzytkownik": "dawid",
  "utworzono": "2026-10-28"
}
```

`data/zadania/002.1-01.json`:
```json
{
  "projekt": "002.1",
  "nazwa": "Pomiar końcowy na Zabłociu",
  "status": "do-zrobienia",
  "uzytkownik": "marek",
  "data": "2026-10-30",
  "utworzono": "2026-10-28",
  "aktywnosc": []
}
```

W `data/demo.json` dochodzą: `statusy_projektow` (`w-toku`, `zakonczony`), `statusy_zadan`
(`do-zrobienia`, `w-toku`, `zrobione`) i `szablon_zadan` (`Pomiar końcowy`, `Produkcja`, `Montaż`).

- **Numer projektu:** numer organizacji, kropka, kolejna liczba dla tej organizacji (002.1, 002.2 … 002.10).
- **Numer zadania:** numer projektu, myślnik, kolejna liczba dwucyfrowa (002.1-01, 002.1-02).
- `uzytkownik` i `data` zadania są opcjonalne. Zadanie bez terminu nie trafia do „Na dziś”, bez osoby jest w „Nieprzypisane”.
- Zadanie w osobnym pliku, bo ma własną aktywność i edycję z ekranu, tak jak szansa (decyzja do zapisania w `doc/decisions/`).
- Dane startowe: projekt 001.1 „Lada i półki” (Kawiarnia Ziarno, zakończony, z SL-013) i 010.1 „Biurko i regał” (z SL-022, w toku). 002.1 jeszcze nie istnieje, powstaje z SL-014.
- Bez zmian: istniejące pliki organizacji i szans.

## Etapy

### Etap 1: Projekty
Działa, jeśli:
- menu ma zakładkę „Projekty”, a lista pokazuje 001.1 i 010.1 z klientem, postępem i opiekunem,
- karta projektu 010.1 pokazuje klienta 010 i szansę SL-022 jako odnośniki,
- karta organizacji 001 ma sekcję „Projekty” z 001.1, a organizacja bez projektów pokazuje „Brak projektów”,
- szansa SL-013 ma odnośnik „Projekt 001.1”,
- uszkodzony plik projektu nie psuje listy: przy tym jednym projekcie widać komunikat,
- test sprawdza regułę numeracji: kolejny projekt dla 002 to 002.1, dla 001 to 001.2.

### Etap 2: Zadania i „Na dziś”
Działa, jeśli:
- karta projektu pokazuje zadania ze statusem, osobą i terminem, a status, osobę i termin da się zmienić,
- widok zadania ma aktywność z datami i pole „Dodaj komentarz”; każda zmiana zostawia wpis kto, co i kiedy,
- „Na dziś” pokazuje zadania z terminem 2026-10-28 i wcześniejszym (zaległe z ostrzeżeniem), zrobione już nie,
- zadanie bez terminu nie pojawia się w „Na dziś”,
- zmiana pliku zadania przez agenta pokazuje się na ekranie od razu.

### Etap 3: Projekt z wygranej szansy
Działa, jeśli:
- szansa w statusie „Zamówienie” bez projektu ma przycisk „Załóż projekt”,
- przycisk zakłada 002.1 z nazwą szansy, opiekunem szansy i trzema zadaniami z szablonu (bez terminów),
- po założeniu przycisk znika, a szansa ma odnośnik „Projekt 002.1”; drugie kliknięcie nie robi 002.2,
- szansa w innym statusie nie ma przycisku.

## Scenariusze testowe
Co klikasz → co widzisz.
1. **Od zamówienia do projektu.** Szanse → SL-014 → status „Zamówienie” → „Załóż projekt” → karta projektu 002.1
   „Recepcja i aneks kuchenny” z trzema zadaniami → Organizacje → 002 → w „Projekty” jest 002.1 → wracasz do SL-014 → odnośnik „Projekt 002.1”.
2. **Zadanie na dziś.** Projekty → 002.1 → „Pomiar końcowy”: osoba Dawid, termin 2026-10-28 → Na dziś → zadanie w „Do zrobienia”
   z plakietką „Zadanie” → otwierasz, komentarz „Pomiar umówiony na 9:00” → status „Zrobione” → zadanie znika z „Na dziś” → 002.1 pokazuje „1 z 3”.
3. **Granice.** Zadanie bez terminu nie jest w „Na dziś”. Szansa w statusie „Oferta” nie ma przycisku „Załóż projekt”.

## Pytania kontrolne przed startem
1. **Bezpieczeństwo danych:** nowe pliki zapisujemy tak samo jak szanse: atomowo, a przy jednoczesnej zmianie serwer czyta plik ponownie. Istniejących plików nie przepisujemy.
2. **Zepsuty plik:** uszkodzony projekt albo zadanie pokazuje komunikat przy sobie, reszta aplikacji działa.
3. **Istniejące dane:** organizacje i szanse zostają bez zmian. Dochodzą dwa katalogi i trzy pola w `demo.json`.
4. **Jak cofnąć:** cała zmiana jest na gałęzi `feat/projekty-klienta`; bez merge nic nie trafia do `main`. Dane z prób cofa `git checkout data/`.
5. **Jak sprawdzić:** `node --test` (numeracja, spójność odnośników, format numerów) i trzy scenariusze wyżej w bramce.

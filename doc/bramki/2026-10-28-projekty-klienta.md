# Bramka: Projekty klienta z zadaniami

Bramka to sprawdzenie po etapie: najpierw testy automatyczne, potem checklista scenariuszy do przeklikania w aplikacji (skill [bramka](../../.agents/skills/bramka/SKILL.md)). Decyzje i poprawki opisuje [kronika zmiany](../history/2026-10-28-projekty-klienta.md).

## Etapy 1-3 (2026-10-28)

Automat: `node --test` → 44 z 44 zielone (numeracja, spójność danych, „Na dziś” dla zadań, API zakładania projektu i zmian zadań).

Jak uruchomić:
1. W terminalu, w folderze projektu: `node server.mjs`
2. Przeglądarka otworzy się sama. Jeśli nie, wejdź na http://127.0.0.1:4400
3. Zatrzymanie: Ctrl+C w terminalu. Po bramce dane wracają do stanu startowego: `git restore data/` i usunięcie `data/projekty/002.1.json` oraz `data/zadania/002.1-*.json`.

### Scenariusz 1: od zamówienia do projektu

| # | Co klikasz | Co powinno się stać | Wynik | Uwaga |
|---|---|---|---|---|
| 1.1 | Szanse → SL-014 „Recepcja i aneks kuchenny” | Status „Oferta”, brak przycisku „Załóż projekt” | działa | |
| 1.2 | Status → „Zamówienie” | Pod polami pojawia się „Projekt: Załóż projekt” i lista zadań startowych | działa | |
| 1.3 | „Załóż projekt” | Otwiera się projekt 002.1 „Recepcja i aneks kuchenny” z trzema zadaniami: Pomiar końcowy, Produkcja, Montaż, bez terminów | działa | |
| 1.4 | Organizacje → 002 Firma Demo | W sekcji „Projekty” jest 002.1 ze statusem „W toku” | działa | |
| 1.5 | Wracasz do SL-014 | Zamiast przycisku jest odnośnik „Projekt 002.1” | działa | |

### Scenariusz 2: zadanie na dziś

| # | Co klikasz | Co powinno się stać | Wynik | Uwaga |
|---|---|---|---|---|
| 2.1 | Projekty → 002.1 → wiersz „Pomiar końcowy”: osoba Dawid, termin 28.10.2026 | Osoba zapisuje się od razu, termin po wyjściu z pola albo Enterze (komunikat „Zapisano”) | nie działa, po poprawce działa | Termin zapisywał się przy każdej cyfrze roku (najpierw 0002, potem 0020), pole gubiło fokus. Poprawka: kronika, sekcja „Poprawka z bramki”. Powtórka niżej. |
| 2.2 | Na dziś | „Pomiar końcowy” jest w „Do zrobienia” z plakietką „Zadanie” i podpisem „Projekt 002.1 · Firma Demo” | działa | |
| 2.3 | Otwierasz zadanie, wpisujesz „Pomiar umówiony na 9:00”, „Dodaj komentarz” | Komentarz pojawia się w aktywności z Twoim imieniem i godziną | działa | |
| 2.4 | Status zadania → „Zrobione”, wracasz do „Na dziś” | Zadania już nie ma na liście | działa | |
| 2.5 | Projekty | 002.1 pokazuje postęp „1 z 3” | działa | |

### Granice

| # | Co klikasz | Co powinno się stać | Wynik | Uwaga |
|---|---|---|---|---|
| 3.1 | Na dziś | Zadania 002.1 bez terminu (Produkcja, Montaż) nie pojawiają się | działa | |
| 3.2 | Szanse → SL-018 (status „Oferta”) | Brak przycisku „Załóż projekt” | działa | |
| 3.3 | Organizacje → 004 | Napis „Brak projektów”, bez błędu | działa | |

Wynik pierwszego przejścia: działa 12, nie działa 1 (2.1), pominięte 0. Testy automatyczne były zielone, błąd wyszedł dopiero przy wpisywaniu daty z klawiatury.

Nie licz jako błędu: data „Utworzono” nowego projektu to dzisiejsza data z zegara komputera, a nie 28.10.2026 (decyzja 0003).

### Sprawdzenie poprawki terminu

Po poprawce punkt 2.1 i miejsca, których dotknęła, sprawdziliśmy w przeglądarce na kopii danych według tych samych kroków, wpisując datę z klawiatury cyfra po cyfrze. Sprawdzenie objęło też termin szansy w wersji przed projektami (gałąź `main`), bo tam był ten sam błąd. Przebieg poprawki i jej przeglądu opisuje [kronika](../history/2026-10-28-projekty-klienta.md).

| # | Kroki | Co powinno się stać | Wynik sprawdzenia |
|---|---|---|---|
| 2.1 | Zadanie „Pomiar końcowy”: osoba Dawid, termin wpisany z klawiatury 28102026, kliknięcie obok | Pole nie skacze w trakcie pisania, jeden wpis o terminie w aktywności | działa |
| 2.1b | Zadanie „Produkcja”: niepełna data 281020, kliknięcie obok | Komunikat „Nie zapisano terminu: wpisz pełną datę z lat 2000-2099.”, pole wraca do pustego | działa |
| 2.2 | Na dziś | „Pomiar końcowy” w „Do zrobienia”, bez ostrzeżenia o zaległości | działa |
| B1 | Wersja przed projektami (`main`): SL-014, termin 30102026 z klawiatury, kliknięcie obok | Jeden wpis o terminie w aktywności szansy | działa |

Wynik sprawdzenia: 4 z 4 zgodnie z oczekiwaniem.

# Bramka: Projekty klienta z zadaniami

## Etapy 1-3 (2026-10-28)

Automat: `node --test` → 44 z 44 zielone (numeracja, spójność danych, „Na dziś” dla zadań, API zakładania projektu i zmian zadań).

Jak uruchomić:
1. W terminalu, w folderze projektu: `node server.mjs`
2. Przeglądarka otworzy się sama. Jeśli nie, wejdź na http://127.0.0.1:4400
3. Zatrzymanie: Ctrl+C w terminalu. Po bramce dane wracają do stanu startowego: `git restore data/` i usunięcie `data/projekty/002.1.json` oraz `data/zadania/002.1-*.json`.

### Scenariusz 1: od zamówienia do projektu

| # | Co klikasz | Co powinno się stać | Wynik | Uwaga |
|---|---|---|---|---|
| 1.1 | Szanse → SL-014 „Recepcja i aneks kuchenny” | Status „Oferta”, brak przycisku „Załóż projekt” | | |
| 1.2 | Status → „Zamówienie” | Pod polami pojawia się „Projekt: Załóż projekt” i lista zadań startowych | | |
| 1.3 | „Załóż projekt” | Otwiera się projekt 002.1 „Recepcja i aneks kuchenny” z trzema zadaniami: Pomiar końcowy, Produkcja, Montaż, bez terminów | | |
| 1.4 | Organizacje → 002 Firma Demo | W sekcji „Projekty” jest 002.1 ze statusem „W toku” | | |
| 1.5 | Wracasz do SL-014 | Zamiast przycisku jest odnośnik „Projekt 002.1” | | |

### Scenariusz 2: zadanie na dziś

| # | Co klikasz | Co powinno się stać | Wynik | Uwaga |
|---|---|---|---|---|
| 2.1 | Projekty → 002.1 → wiersz „Pomiar końcowy”: osoba Dawid, termin 28.10.2026 | Zmiana zapisuje się od razu (komunikat „Zapisano”) | | |
| 2.2 | Na dziś | „Pomiar końcowy” jest w „Do zrobienia” z plakietką „Zadanie” i podpisem „Projekt 002.1 · Firma Demo” | | |
| 2.3 | Otwierasz zadanie, wpisujesz „Pomiar umówiony na 9:00”, „Dodaj komentarz” | Komentarz pojawia się w aktywności z Twoim imieniem i godziną | | |
| 2.4 | Status zadania → „Zrobione”, wracasz do „Na dziś” | Zadania już nie ma na liście | | |
| 2.5 | Projekty | 002.1 pokazuje postęp „1 z 3” | | |

### Granice

| # | Co klikasz | Co powinno się stać | Wynik | Uwaga |
|---|---|---|---|---|
| 3.1 | Na dziś | Zadania 002.1 bez terminu (Produkcja, Montaż) nie pojawiają się | | |
| 3.2 | Szanse → SL-018 (status „Oferta”) | Brak przycisku „Załóż projekt” | | |
| 3.3 | Organizacje → 004 | Napis „Brak projektów”, bez błędu | | |

Wynik: działa / nie działa / pominięte.
Nie licz jako błędu: data „Utworzono” nowego projektu to dzisiejsza data z zegara komputera, a nie 28.10.2026 (decyzja 0003).

# 0004. Zadania projektu w osobnych plikach

Data: 2026-10-28. Status: przyjęta.

## Kontekst

Projekt klienta (002.1) ma kilka zadań. Każde zadanie ma status, osobę, termin i własną oś aktywności, a status, osobę i termin zmienia się z ekranu, tak jak w szansie. W tym samym czasie agent może dopisać do zadania notatkę albo przestawić termin w pliku. Zadania trafiają też do „Na dziś” obok szans.

## Decyzja

Każde zadanie to osobny plik `data/zadania/<numer projektu>-NN.json`, np. `002.1-01.json`. Zadanie wskazuje projekt polem `projekt`, a projekt nie trzyma listy swoich zadań: ekran zbiera je po tym polu. Zmiana zadania z ekranu idzie tą samą ścieżką co zmiana szansy (biała lista pól, wpis `zmiana` w aktywności, zapis atomowy z ponownym odczytem). Numer zadania zawiera numer projektu, więc nawet uszkodzony plik zadania wiadomo, do którego projektu należy.

## Odrzucone

- **Lista zadań w pliku projektu.** Zmiana jednego zadania przepisywałaby cały projekt z aktywnością wszystkich zadań. Ekran i agent częściej wchodziliby sobie w drogę na jednym pliku, a diff w gicie mieszałby zmiany różnych zadań. Uszkodzony JSON wyłączałby cały projekt zamiast jednego zadania.
- **Zadania w pliku szansy.** Szansa kończy się zamówieniem, a zadania żyją dłużej. Szansa nie zawsze musi mieć projekt.
- **Numer zadania bez numeru projektu (Z-001).** Trzeba by otwierać plik, żeby wiedzieć, do czego należy zadanie. `002.1-01` mówi to od razu: klient 002, projekt 002.1.

## Konsekwencje

- Zakładanie projektu zapisuje kilka plików naraz (projekt i zadania z szablonu), a pliki nie mają transakcji. Serwer zapisuje najpierw zadania, a projekt na końcu, każdy plik przez plik tymczasowy i `link`, który nie nadpisuje istniejącego pliku. Gdy coś się nie uda, usuwa pliki utworzone w tym wywołaniu.
- Agent, który dodaje zadanie, sprawdza katalog `data/zadania/` i bierze kolejny numer w projekcie (`lib/numeracja.mjs`, `nextTaskNumber`).
- Zadanie może zostać bez projektu (np. agent usunie projekt mimo zakazu). Test spójności danych to wykryje, a numer takiego projektu nie zostanie użyty drugi raz.
- Katalog `data/zadania/` rośnie szybciej niż `data/projekty/`. Przy kilkudziesięciu projektach to bez znaczenia (ADR 0001).

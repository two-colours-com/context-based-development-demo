# 0001. Pliki JSON jako baza danych

Data: 2026-10-13. Status: przyjęta.

## Kontekst

Prototyp ma pokazać na scenie, że agent AI i aplikacja pracują na tych samych danych. Widz musi zobaczyć, co zmienił agent, i móc to otworzyć w edytorze. Uczestnicy dostaną repo i powinni je uruchomić u siebie w minutę, bez kont i bez internetu.

## Decyzja

Bazą są pliki JSON w `data/`: jeden plik to jeden rekord, nazwa pliku to identyfikator. Serwer niczego nie trzyma w pamięci. Przy każdym zapytaniu czyta pliki od nowa, a zmiany na dysku (`fs.watch`) wypycha do przeglądarki przez Server-Sent Events. Ekran zapisuje tylko zmiany szansy, atomowo: plik tymczasowy, potem zmiana nazwy. Node 20 lub nowszy, zero zależności.

## Odrzucone

- **SQLite.** Agent musiałby pisać SQL, a widz nie zobaczy zmiany w zwykłym pliku. Wbudowany `node:sqlite` jest dopiero w nowszych wersjach Node.
- **Jeden duży plik `baza.json`.** Każda zmiana nadpisuje całość, agent i ekran łatwo sobie wchodzą w drogę, a diff w gicie jest nieczytelny.
- **Markdown z nagłówkami.** Wygodny do czytania, ale ekran musiałby parsować dowolny tekst, a agent łatwo psuje strukturę.
- **Baza w chmurze (np. Supabase).** Wymaga konta i internetu, a pokaz ma działać offline.

## Konsekwencje

- Diff w gicie pokazuje dokładnie, co zmienił agent. `git checkout data/` cofa cały pokaz.
- Zapis z ekranu i zapis agenta mogą się zderzyć. Serwer czyta plik jeszcze raz przed zamianą i, gdy plik się zmienił, nakłada swoją zmianę ponownie (do 5 prób). Agent czyta plik przed edycją (zasada w AGENTS.md).
- Nie ma transakcji między plikami ani indeksów. Przy kilkudziesięciu rekordach to bez znaczenia. Przy tysiącach potrzebna jest prawdziwa baza, czyli wersja produkcyjna.
- Zepsuty JSON nie wywraca aplikacji: rekord pokazuje „błąd w danych”, a `node --test` wskazuje plik.

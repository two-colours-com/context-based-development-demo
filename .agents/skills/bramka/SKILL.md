---
name: bramka
description: 'Bramka testowa po etapie zmiany. Najpierw automat: test na każde kryterium planu i spójność plików JSON (node --test). Potem checklista scenariuszy do kliknięcia dla użytkownika w doc/bramki/. Wynik wraca do code-managera. Triggery: „bramka”, „bramka testowa”, „sprawdź, czy działa”, „przygotuj mi testy do kliknięcia”, „odbiór etapu”, „checklista testów”.'
---

# Bramka: czy to naprawdę działa

Bramka ma dwie części. Automat sprawdza to, co da się sprawdzić bez człowieka. Użytkownik sprawdza resztę: czy aplikacja zachowuje się tak, jak ustaliliście. Zgłoszenie „gotowe” od wykonawcy to dopiero początek sprawdzania.

## Kiedy używać

- Po każdym etapie, gdy wykonawca zgłosi, że skończył.
- Po poprawkach z przeglądu: krótka bramka tylko na miejscach, których dotknęły poprawki.

## Część 1: automat

1. Otwórz `doc/plans/<slug>/plan.md` i wypisz kryteria „działa, jeśli…” bieżącego etapu.
2. Do każdego kryterium znajdź test w `tests/`. Brakuje testu? Odeślij wykonawcy listę brakujących.
3. Sprawdź, czy test spójności danych (tutaj `tests/dane.test.mjs`) obejmuje nowe pliki. Powinien sprawdzać co najmniej:
   - każdy plik w `data/` jest poprawnym JSON-em,
   - odwołania prowadzą do istniejących rekordów (np. `"organizacja": "002"` w projekcie → istnieje `data/organizacje/002.json`, `uzytkownik` w zadaniu → jest w `data/uzytkownicy.json`),
   - daty mają format `RRRR-MM-DD`.
4. Uruchom `node --test tests/`.
5. Czerwony test wraca do wykonawcy z nazwą testu i komunikatem. Do użytkownika idziesz dopiero przy samych zielonych.

Przejrzyj najważniejsze testy. Dobry test sprawdza konkretny wynik, np. że zadanie bez daty **nie** pojawia się w „Na dziś”. Test, który sprawdza tylko, że „nic się nie wysypało”, przejdzie także na błędnym kodzie.

## Część 2: checklista dla użytkownika

Zapisz `doc/bramki/YYYY-MM-DD-<slug>.md`. Jeden plik na zmianę. Kolejne etapy i powtórki dopisujesz jako nowe sekcje.

```markdown
# Bramka: Projekty klienta z zadaniami

## Etap 1: Projekty widoczne w organizacji (2026-10-28)

Automat: `node --test tests/` → 12 z 12 zielone.

Jak uruchomić:
1. W terminalu, w folderze projektu: `node server.mjs`
2. Przeglądarka otworzy się sama. Jeśli nie, wejdź na http://127.0.0.1:4400
3. Zatrzymanie: Ctrl+C w terminalu.

| # | Co klikasz | Co powinno się stać | Wynik | Uwaga |
|---|---|---|---|---|
| 1 | Organizacje → 002 | Widzisz projekt 002.1 „Meble do nowego biura” | | |
| 2 | Organizacja bez projektów | Napis „Brak projektów”, bez błędu | | |
| 3 | Projekt 002.1 | Zadanie „Pomiar u klienta” z datą i osobą | | |

Wynik: działa / nie działa / pominięte.
Nie licz jako błędu: <znane ograniczenia, np. brak prawdziwej poczty>.
```

Powiedz użytkownikowi, gdzie jest plik i jak oddać wynik: „Wypełnij kolumny w pliku albo napisz w czacie, np. *1 działa, 2 nie działa: widzę pustą kartę, 3 działa, uwaga: data słabo widoczna*. Wpiszę to do pliku.”

Zasady scenariuszy:
- 3-8 scenariuszy, razem około 10 minut. Najważniejsze na górze.
- Język użytkownika. Bez konsoli przeglądarki i narzędzi deweloperskich. Jeśli trzeba coś wpisać w terminalu, daj gotową komendę do skopiowania.
- Kolumna „Co powinno się stać” musi odróżniać sukces od porażki. „Działa poprawnie” nic nie mówi.
- Co najmniej jeden scenariusz graniczny: brak danych, brak daty, data w przeszłości.
- Klikanie może zmienić pliki w `data/`. Po bramce sprawdź `git status`. Zmiany, które nie są częścią planu, cofnij `git restore data/`, ale dopiero po potwierdzeniu użytkownika.

## Odczyt wyniku

- Puste pole „Wynik” znaczy „nie wiemy”. Dopytaj. Nie licz go jako „działa”.
- Uwaga jest osobna od wyniku. Scenariusz może działać i mieć uwagę. Każdą uwagę zaklasyfikuj: błąd do poprawy w tym etapie, zmiana zakresu (na później, do backlogu) albo rzecz już opisana w planie (wskaż gdzie).
- Pod tabelą dopisz podsumowanie: `Wynik: działa 4, nie działa 1, pominięte 0. Uwagi: 1.`

## Pętla poprawek

„Nie działa” zamieniasz w konkretny opis dla wykonawcy: co klikasz, co widzisz, czego oczekujesz. Po poprawce: znowu automat, potem tylko scenariusze, które nie działały. Najwyżej 3 pętle. Jeśli po trzeciej nadal nie działa, zatrzymaj się i zaproponuj użytkownikowi mniejszy zakres albo przeniesienie problemu na później.

## Co oddajesz code-managerowi

Wynik automatu, wynik checklisty, uwagi z klasyfikacją i link do pliku bramki.

## Czego nie robisz

- Nie naprawiasz kodu. Poprawki robi wykonawca.
- Nie zaznaczasz „działa” za użytkownika.
- Nie dajesz checklisty, dopóki jakiś test jest czerwony.

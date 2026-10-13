---
name: plan-inicjatyw
description: 'Zamienia ustalenia z /grill w plan zmiany w aplikacji albo nowej inicjatywy, napisany językiem produktu, w doc/plans/<slug>/plan.md: problem, co zobaczysz, zakres, model danych, etapy z kryteriami „działa, jeśli…”, scenariusze testów i pytania kontrolne. Dopisuje plan do doc/backlog.md. Nie pisze kodu. Triggery: „napisz plan”, „zaplanuj zmianę”, „rozpisz to na etapy”, „plan zmiany”, „plan inicjatywy”, „nowa inicjatywa”, „zaplanuj inicjatywę”, „zapisz plan”, „przejdźmy do planu”.'
---

# Plan inicjatywy: ustalenia zamienione w umowę

Plan jest umową między użytkownikiem a wykonawcą. Użytkownik musi z niego wyczytać, co zobaczy w aplikacji. Wykonawca musi z niego wyczytać, co zbudować i po czym pozna, że skończył.

## Kiedy używać

- Po `/grill`, gdy ustalenia są jasne.
- Gdy code-manager prosi o plan dla nowej potrzeby.
- Jeśli nie wiesz, co ma się stać w ważnym przypadku, wróć do `/grill`. Nie zgaduj.

## Krok po kroku

1. Przeczytaj `AGENTS.md`, `CONTEXT.md`, `doc/decisions/` i `doc/backlog.md`. Używaj pojęć ze słownika.
2. Obejrzyj pliki w `data/`, których dotyczy zmiana. Model danych w planie musi pasować do tego, co już jest.
3. Zaproponuj slug: krótka nazwa zmiany, małe litery, bez polskich znaków, słowa łączone myślnikiem, np. `oferty-bez-odpowiedzi`. Ten sam slug trafi do nazwy gałęzi, kroniki, bramki i przeglądu. Jeśli `doc/plans/<slug>/` już istnieje, powiedz o tym i zapytaj, co dalej.
4. Zaproponuj etapy (2-4, bardzo mała zmiana może mieć jeden). Każdy etap daje coś, co da się kliknąć i sprawdzić. Potwierdź podział z użytkownikiem.
5. Zapisz `doc/plans/<slug>/plan.md` według szablonu niżej.
6. Dopisz zmianę do `doc/backlog.md` w sekcji „Do zrobienia”:
   `- [ ] Oferty bez odpowiedzi: [plan](plans/oferty-bez-odpowiedzi/plan.md) (2026-10-28)`
   Jeśli pliku nie ma, utwórz go z sekcjami: W trakcie, Do zrobienia, Na później, Zrobione (ostatnie 10).
7. Pokaż użytkownikowi „Co zobaczysz po zmianie” i „Poza zakresem”. Zapytaj, czy plan opisuje to, o co chodziło.

## Szablon `doc/plans/<slug>/plan.md`

````markdown
# Oferty bez odpowiedzi

**Slug:** `oferty-bez-odpowiedzi` · **Data:** 2026-10-28 · **Status:** do zatwierdzenia

## Problem
2-3 zdania z perspektywy użytkownika. Np. „Wysyłam ofertę i zapominam o niej. Klient milczy
od tygodnia, a ja nie wiem, że trzeba zadzwonić.”

## Co zobaczysz po zmianie
Opis z ekranu, bez nazw plików i funkcji. Np. „Szansa w statusie Oferta bez żadnego wpisu
od 7 dni wraca do „Na dziś” z dopiskiem „bez odpowiedzi od 9 dni”.”

## Zakres
- Liczenie dni od ostatniego wpisu w aktywności szansy w statusie „Oferta”.
- Dopisek w „Na dziś” i na liście szans.

## Poza zakresem
- Powiadomienia mailem i przypomnienia w kalendarzu.
- Automatyczne wysyłanie przypomnienia do klienta.

## Model danych
Nowe pole w `data/demo.json`:
```json
{ "dni_bez_odpowiedzi": 7 }
```
- Liczymy od ostatniego wpisu w `aktywnosc` szansy. Szansa bez wpisów: od wejścia w status „Oferta”.
- Bez zmian: `data/szanse/*.json`, `data/organizacje/*.json`.

## Etapy
### Etap 1: Dopisek w „Na dziś”
Działa, jeśli:
- SL-014 (ostatni wpis 2026-10-23) jest w „Na dziś” z dopiskiem „bez odpowiedzi od 5 dni”, gdy próg to 5,
- szansa w statusie „Negocjacje” nie dostaje dopisku,
- szansa bez żadnych wpisów nie psuje widoku.

## Scenariusze testowe
Co klikasz → co widzisz.
1. Na dziś → SL-014 ma dopisek z liczbą dni.
2. Dopisujesz komentarz w SL-014 → dopisek znika.

## Pytania kontrolne przed startem
1. **Bezpieczeństwo danych:** czy zmiana może nadpisać albo zgubić dane? Jak zapisujemy pliki?
2. **Zepsuty plik:** co zobaczy użytkownik, gdy plik JSON jest uszkodzony?
3. **Istniejące dane:** czy obecne pliki działają bez zmian? Czy trzeba je przerabiać?
4. **Jak cofnąć:** co robimy, gdy zmiana okaże się zła?
5. **Jak sprawdzić:** które testy automatyczne i które scenariusze potwierdzą, że działa?
````

Na każde pytanie kontrolne odpowiedz w planie jednym, dwoma zdaniami. Pytanie bez odpowiedzi oznacza powrót do `/grill`.

## Zasady pisania

- Język produktu. Technika tylko w „Model danych”.
- Każde kryterium „działa, jeśli…” da się rozstrzygnąć: tak albo nie. „Działa szybko” nie jest kryterium.
- Przy każdym etapie co najmniej jedno kryterium graniczne: brak danych, uszkodzony plik, stara data.
- Daty zawsze pełne: 2026-10-28, nigdy „w czwartek”.
- Długość 60-150 linii. Dłuższy plan to znak, że zmianę trzeba podzielić na dwie.

## Czego nie robisz

- Nie piszesz kodu ani testów.
- Nie zmieniasz plików w `data/`.
- Nie commitujesz. Commit robi code-manager.
- Nie dopisujesz funkcji, o których nie było mowy. Pomysł „przy okazji” trafia do „Poza zakresem” albo do backlogu w sekcji „Na później”.

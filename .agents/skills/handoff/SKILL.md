---
name: handoff
description: 'Zapisuje stan pracy do doc/session/session.md przed wyczyszczeniem rozmowy (/clear) i wczytuje go w nowej sesji. Użycie: „handoff zapisz” albo „handoff wczytaj”. Triggery: „handoff”, „zapisz sesję”, „zapisz kontekst przed clear”, „wczytaj sesję”, „przywróć kontekst”, „kontynuuj po clear”, „wracamy do pracy”.'
---

# Handoff: przekazanie pracy między sesjami

Agent jest najbystrzejszy na początku rozmowy. Gdy rozmowa robi się długa, zaczyna gubić szczegóły. Wtedy zapisz stan, wyczyść rozmowę (`/clear`) i zacznij od krótkiej notatki. Plan, kronika i decyzje są już w plikach. Notatka trzyma tylko resztę.

`doc/session/` jest poza gitem (wpis w `.gitignore`). Sprawdź to: `git check-ignore doc/session/session.md`. Jeśli plik nie jest ignorowany, dopisz `doc/session/` do `.gitignore` i powiedz o tym użytkownikowi.

## handoff zapisz

1. Jeśli `doc/session/session.md` już istnieje, zapytaj, czy nadpisać.
2. Sprawdź stan: `git branch --show-current` i `git status --short`.
3. Zapisz `doc/session/session.md`, 20-40 linii. Tylko to, czego nie ma w plikach: ustalenia z rozmowy, otwarte pytania, następny krok. Plan i kronikę linkuj, nie kopiuj.

```markdown
# Sesja: 2026-10-28 14:30

## Rola
code-manager, gałąź `feat/projekty-klienta`

## Zadanie
Projekty klienta z zadaniami, etap 2 „Zadania i Na dziś”. Faza: bramka.

## Co zrobione
- Etap 1 po merge.
- Etap 2: kod gotowy, testy zielone.

## Co zostało
1. Checklista bramki dla użytkownika.
2. Przegląd kodu.

## Otwarte pytania
- Czy zadanie z datą w przeszłości pokazujemy w „Na dziś”? Czeka na decyzję użytkownika.

## Pliki
- doc/plans/projekty-klienta/plan.md
- doc/history/2026-10-28-projekty-klienta.md

## Stan gita
<wynik `git status --short`>

## Następny krok
Uruchom `/bramka` dla etapu 2 i przygotuj checklistę.
```

4. Powiedz: „Zapisane w `doc/session/session.md`. Zrób `/clear`, a potem napisz `handoff wczytaj`.”

## handoff wczytaj

1. Przeczytaj `doc/session/session.md`. Brak pliku? Powiedz to i zapytaj, od czego zacząć.
2. Przeczytaj pliki z sekcji „Pliki”.
3. Porównaj stan: `git branch --show-current`, `git status --short`, `git log --oneline -5`. Inna gałąź albo nieznane zmiany? Powiedz o tym użytkownikowi i zapytaj, co dalej. Pliku wtedy nie przenoś.
4. Gdy stan się zgadza, przenieś plik do `doc/session/archive/session-YYYY-MM-DD-HHMM.md` (folder utwórz, jeśli go nie ma). Nie usuwaj go: archiwum to zabezpieczenie.
5. Powiedz w kilku linijkach: jaką rolę masz w tej sesji, na czym skończyliście i od czego zaczynasz.

## Czego nie robisz

- Nie kopiujesz do notatki planu ani kroniki.
- Nie commitujesz `doc/session/`.
- Nie ruszasz z pracą, gdy stan się nie zgadza, dopóki użytkownik nie zdecyduje.

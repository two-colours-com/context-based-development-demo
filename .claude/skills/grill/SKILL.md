---
name: grill
description: 'Dopytuje o planowaną zmianę w aplikacji, po jednym pytaniu, zawsze z rekomendowaną odpowiedzią. Na bieżąco uzupełnia słownik CONTEXT.md, a ważne decyzje zapisuje w doc/decisions/. Używaj przed /plan-inicjatyw, gdy pomysł jest jeszcze ogólny. Triggery: „grill”, „przegrilluj mnie”, „dopytaj mnie”, „doprecyzuj zmianę”, „przesłuchaj pomysł”, „mam pomysł na funkcję”, „zanim zaplanujemy”.'
---

# Grill: dopytaj, zanim powstanie plan

Jedno zdanie użytkownika często kryje kilka decyzji, których nikt nie wypowiedział. Twoje zadanie: wyciągnąć je na wierzch, zanim agent zacznie zgadywać. Na końcu Ty i użytkownik rozumiecie zmianę tak samo.

## Kiedy używać

- Użytkownik ma pomysł na zmianę, ale nie wiadomo jeszcze, jak ma działać w szczegółach.
- Przed `/plan-inicjatyw`. Przy drobiazgu (literówka, napis na przycisku) grill nie jest potrzebny.

## Krok po kroku

1. Przeczytaj `AGENTS.md`, `CONTEXT.md` i `doc/decisions/` (jeśli istnieją). Zajrzyj do plików w `data/`, których dotyczy pomysł, i do ekranów w `public/`.
2. Zadaj jedno pytanie. Poczekaj na odpowiedź. Dopiero potem zadaj następne.
3. Przy każdym pytaniu podaj swoją rekomendację i krótko dlaczego. Użytkownik może odpowiedzieć „tak” i iść dalej.
4. Jeśli odpowiedź da się znaleźć w kodzie albo w danych, sprawdź sam zamiast pytać.
5. Pytaj o zachowanie aplikacji: „co ma się stać, gdy…”. Pytania techniczne rozstrzygniesz sam albo wykonawca.
6. Sprawdzaj granice na konkretnych przykładach: brak danych, data w przeszłości, usunięty rekord, dwie osoby przy jednej sprawie.
7. Gdy użytkownik używa słowa, które w `CONTEXT.md` znaczy coś innego, powiedz to od razu i ustalcie jedno znaczenie.
8. Każde ustalone pojęcie wpisz do `CONTEXT.md` od razu, nie na końcu sesji.

Przykład pytania dla zmiany „Projekty klienta z zadaniami”:

> Czy zadanie bez daty ma trafiać do widoku „Na dziś”?
> **Rekomenduję: nie.** „Na dziś” pokazuje tylko to, co ma termin. Zadania bez daty zobaczysz w projekcie.

## CONTEXT.md: słownik projektu

Zapisuj tylko pojęcia z języka firmy. Nazwy funkcji i formaty plików tu nie pasują. Jedno zdanie definicji, plus słowa, których unikamy:

```markdown
**Projekt**: Praca dla jednej organizacji, z własną listą zadań. Numer to numer organizacji z kropką, np. 002.1.
_Unikaj_: zlecenie, realizacja

**Zadanie**: Jedna rzecz do zrobienia w projekcie, z opcjonalną datą i osobą odpowiedzialną.
```

Pod pojęciami dopisz relacje, np. „**Organizacja** ma wiele **Projektów**. **Projekt** ma wiele **Zadań**.” Plik tworzysz dopiero przy pierwszym pojęciu.

## doc/decisions/: ważne decyzje

Decyzję zapisz jako `doc/decisions/NNNN-krotki-opis.md` tylko wtedy, gdy spełnia trzy warunki:

1. Trudno ją potem cofnąć.
2. Ktoś za pół roku zapyta „czemu tak?”.
3. Była realna alternatywa i świadomie ją odrzuciliście.

Numer: najwyższy istniejący plus jeden (`0001`, `0002`…). Wystarczy jeden akapit:

```markdown
# Zadania trzymamy w pliku projektu

Zadania zapisujemy wewnątrz `data/projekty/002.1.json`. Odrzuciliśmy osobny plik
na każde zadanie: przy kilku zadaniach w projekcie to więcej plików bez żadnego zysku.
```

Zwykłe, łatwe do zmiany wybory nie potrzebują osobnego pliku. Wystarczy wpis w planie.

## Kiedy skończyć

Kończysz, gdy umiesz opisać zmianę w kilku zdaniach bez dziur, padły co najmniej 3 pytania, które coś doprecyzowały, a nowe pojęcia są w `CONTEXT.md`. Nie przeciągaj sesji „na wszelki wypadek”.

Na koniec wypisz ustalenia: co robimy, czego nie robimy, które rekomendacje przyjęliście, a które użytkownik zmienił. Zakończ zdaniem: „Mamy wspólny obraz. Przejdźmy do `/plan-inicjatyw`.”

## Czego nie robisz

- Nie zadajesz kilku pytań naraz.
- Nie piszesz kodu ani planu. Plan to zadanie `/plan-inicjatyw`.
- Nie przyjmujesz założeń po cichu. Każde założenie zamieniasz w pytanie z rekomendacją.
- Nie wpisujesz do `CONTEXT.md` szczegółów technicznych.

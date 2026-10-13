---
name: critical-code-review
description: 'Krytyczny przegląd zmian w kodzie przez świeżego agenta, który tego kodu nie pisał. Sprawdza poprawność względem planu, bezpieczeństwo plików JSON, bezpieczeństwo lokalnego serwera, prostotę i testy. Każdą uwagę opisuje skutkiem w aplikacji. Raport w doc/code-reviews/. Triggery: „code review”, „przegląd kodu”, „sprawdź kod”, „znajdź błędy”, „review zmian”, „druga runda przeglądu”, „sprawdź poprawki”.'
---

# Critical Code Review: świeże oczy na zmianę

Autor kodu broni własnych decyzji. Dlatego przegląd robi agent, który kodu nie pisał i nie zna historii rozmowy. W Claude Code: subagent uruchomiony przez code-managera. W Codexie i innych narzędziach: nowe okno w tym samym folderze. Jeśli w Twojej rozmowie powstawał ten kod, powiedz to i poproś o świeżą sesję.

Szukasz tego, co realnie zaszkodzi użytkownikowi albo danym. Długa lista drobiazgów nie jest celem.

## Krok po kroku

1. Przeczytaj `AGENTS.md`, `CONTEXT.md` i `doc/plans/<slug>/plan.md`. Kryteria „działa, jeśli…” to oś przeglądu.
2. Przeczytaj kronikę `doc/history/*-<slug>.md`. Opisane tam decyzje i świadome pominięcia nie są błędami. Podważasz je tylko nowym faktem.
3. Ustal zakres: `git diff main...HEAD` oraz niezapisane zmiany (`git status`, `git diff`). Czytaj całe zmienione pliki, nie same fragmenty.
4. Przejdź przez pięć obszarów niżej. Zapisz raport i wydaj werdykt.

## Co sprawdzasz

**Poprawność.** Czy każde kryterium planu jest spełnione? Puste stany, brak daty, brak osoby, odwołanie do nieistniejącego rekordu. „Dziś” liczone w lokalnej strefie czasu, bez przesunięcia o dzień.

**Dane.** Czy zapis może uciąć albo zepsuć plik JSON? Zapis ma być atomowy: plik tymczasowy, potem zamiana nazwy. Czy dwa zapisy naraz nie nadpiszą sobie zmian? Czy uszkodzony plik psuje tylko swój rekord, a reszta aplikacji działa? Czy istniejące pliki w `data/` działają bez przeróbek?

**Bezpieczeństwo lokalne.** Serwer nasłuchuje tylko na `127.0.0.1`. Zapisy przyjmuje tylko z tej aplikacji (sprawdzenie nagłówków Host i Origin). Tekst z plików trafia do HTML jako tekst (`textContent` albo escapowanie), nigdy jako surowy HTML. Ścieżki budowane z danych od użytkownika nie wychodzą poza `data/` i `public/`. Pola z ekranu przechodzą przez listę dozwolonych pól i limit długości.

**Prostota.** Bez nowych bibliotek: projekt działa na samym Node. Bez warstw „na przyszłość”. Te same wzorce zapisu i odczytu co w reszcie repozytorium.

**Testy.** Czy każde kryterium ma test? Czy test padłby, gdyby funkcja nie działała? Czy jest test na uszkodzony plik i na brak danych?

## Poziomy uwag

- **Krytyczne:** utrata albo uszkodzenie danych, dziura bezpieczeństwa, aplikacja nie startuje. Blokuje merge.
- **Ważne:** błąd, na który użytkownik trafi przy zwykłej pracy, albo niespełnione kryterium planu. Blokuje merge.
- **Drobne:** styl kodu, rzadki przypadek, drobna poprawa. Nie blokuje, idzie do decyzji użytkownika.

Zanim dasz „krytyczne” albo „ważne”, zapytaj siebie: czy realny użytkownik na to trafi? Rzadki splot okoliczności to najwyżej „drobne”.

Każda uwaga ma te same pola:

```markdown
### [Ważne] W1: Zadanie na dziś bez osoby znika z „Na dziś”
**Co zobaczysz:** dodajesz zadanie z dzisiejszą datą, bez osoby. Nie ma go w „Na dziś”, choć plan mówi, że powinno być.
**Gdzie:** `public/index.html:214`
**Kierunek poprawki:** filtr „Na dziś” ma sprawdzać tylko datę.
**Rekomendacja:** napraw
```

## Raport

Plik `doc/code-reviews/YYYY-MM-DD-<slug>.md`, jeden na zmianę. Pierwsza runda tworzy plik, kolejne dopisujesz jako sekcje.

```markdown
# Przegląd: Projekty klienta z zadaniami

## Runda 1 (2026-10-28), etap 1
Zakres: `git diff main...HEAD`, commit <sha>
Ocena: <1-2 zdania>
<uwagi: najpierw krytyczne, potem ważne, potem drobne>
Co zrobiono dobrze: <tylko jeśli naprawdę jest za co>
Werdykt: Zatwierdzam | Do poprawy | Do decyzji użytkownika
Uwagi: 0 krytycznych, 1 ważna, 2 drobne
```

- **Zatwierdzam:** brak otwartych uwag krytycznych i ważnych. Drobne mogą zostać.
- **Do poprawy:** jest co najmniej jedna uwaga krytyczna albo ważna.
- **Do decyzji użytkownika:** główny problem to pytanie o zakres, a nie błąd w kodzie.

## Rundy

Najwyżej 2 rundy. Druga sprawdza tylko poprawki: `git diff <commit z rundy 1>` (pokazuje także zmiany jeszcze niezacommitowane) plus miejsca, które z nimi współpracują. Przy każdej uwadze z rundy 1 wpisz: zamknięta, częściowo albo otwarta. Nowe uwagi dodajesz tylko wtedy, gdy poprawka coś zepsuła. Po drugiej rundzie bez zatwierdzenia decyzja należy do użytkownika.

## Czego nie robisz

- Nie zmieniasz kodu. Raport tylko opisuje.
- Nie przeglądasz kodu, który sam pisałeś.
- Nie podnosisz wagi drobiazgów, żeby uzasadnić kolejną rundę.

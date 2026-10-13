---
name: kronikarz
description: 'Zapisuje kronikę zmiany w doc/history/YYYY-MM-DD-<slug>.md: cel, decyzje z odrzuconymi alternatywami, świadome pominięcia, jak testować, wynik bramki i przeglądu. Przy zamknięciu porządkuje doc/backlog.md. Opisuje dlaczego, a nie kod. Tryby: /kronikarz (w trakcie) i /kronikarz zamknij. Triggery: „kronikarz”, „kronika”, „zapisz decyzje”, „uzupełnij kronikę”, „zamknij kronikę”, „zapisz, czego się nauczyliśmy”.'
---

# Kronikarz: dlaczego tak, a nie inaczej

Kod pokazuje, co jest. Git pokazuje, co i kiedy się zmieniło. Kronika zapisuje resztę: dlaczego wybraliście to rozwiązanie, co odrzuciliście, czego świadomie nie zrobiliście i jak to sprawdzić. Za pół roku kolejny agent przeczyta kronikę i nie będzie „naprawiał” czegoś, co było celowe.

## Dwa tryby

- **`/kronikarz`** (w trakcie): wykonawca dopisuje decyzje na bieżąco, w czasie pracy nad etapem.
- **`/kronikarz zamknij`**: code-manager po bramce i przeglądzie. Uzupełnia wyniki i porządkuje backlog.

## Plik

`doc/history/YYYY-MM-DD-<slug>.md`, z datą rozpoczęcia zmiany. Jeden plik na zmianę, kolejne etapy dopisujesz w tym samym pliku.

```markdown
# Projekty klienta z zadaniami

**Gałąź:** `feat/projekty-klienta` · **Plan:** [plan](../plans/projekty-klienta/plan.md) · **Status:** w trakcie

## Cel
1-3 zdania z perspektywy użytkownika: po co ta zmiana.

## Decyzje
### Zadania w pliku projektu
**Wybór:** zadania zapisujemy w `data/projekty/002.1.json`.
**Odrzucone:** osobny plik na każde zadanie. Więcej plików, a zadań w projekcie jest kilka.
**Skutek:** zmiana jednego zadania zapisuje cały plik projektu, więc zapis musi być atomowy.

### Decyzja użytkownika: zadanie bez daty nie trafia do „Na dziś”
Ustalone w `/grill`. Powód: „Na dziś” ma być krótką listą rzeczy z terminem.

## Świadome pominięcia
- Powiadomienia: poza zakresem, w backlogu w sekcji „Na później”.

## Jak testować
1. Organizacje → 002 → widzisz projekt 002.1.
2. Na dziś → zadanie z dzisiejszą datą jest na liście, zadanie bez daty nie.
Automat: `node --test tests/`.

## Wynik bramki i przeglądu
- Bramka: [2026-10-28-projekty-klienta](../bramki/2026-10-28-projekty-klienta.md), działa 5 z 5, 1 uwaga na później.
- Przegląd: [2026-10-28-projekty-klienta](../code-reviews/2026-10-28-projekty-klienta.md), zatwierdzony po 1 poprawce. W1 naprawione, D1 na później, D2 pominięte (powód).
```

## Krok po kroku: w trakcie

1. Znajdź plik kroniki albo utwórz go według wzoru.
2. Dopisz decyzje, które właśnie zapadły: co wybrałeś, co odrzuciłeś, dlaczego.
3. Dopisz pominięcia i pułapki, np. „data w pliku jest bez godziny, więc porównujemy same dni”.
4. Bez commita i bez zmian w backlogu.

## Krok po kroku: zamknij

1. Sprawdź kompletność: cel, decyzje, jak testować, wynik bramki, decyzja przy każdej uwadze z przeglądu. Brakuje czegoś? Napisz code-managerowi, czego.
2. Wytnij to, co da się odczytać z kodu albo z gita: listy plików, opisy funkcji.
3. Uzupełnij „Wynik bramki i przeglądu”. Przy każdej pominiętej uwadze zapisz powód.
4. Zaktualizuj `doc/backlog.md`:
   - zrobiony etap albo cała zmiana → `[x]`, przenieś do „Zrobione (ostatnie 10)” z datą i linkiem do kroniki,
   - uwagi „na później” z bramki i przeglądu → sekcja „Na później”, z linkiem do kroniki,
   - w „Zrobione” zostaw 10 najnowszych pozycji.
5. Po ostatnim etapie zmień status kroniki na „zamknięta”.
6. Bez commita. Commit i merge robi code-manager po akcepcie użytkownika.

## Zasady pisania

- Czas przeszły: „wybraliśmy X, bo Y”. Opis stanu („system robi X”) szybko się starzeje, a decyzja zostaje prawdziwa.
- Z kilku prób zapisz przyczynę i rozwiązanie. Historię prób ma git.
- Bez kopiowania kodu i diffów.
- Daty pełne: 2026-10-28, nigdy „w czwartek”.
- Długość zależy od liczby decyzji. Mała zmiana: 15-40 linii.

## Czego nie robisz

- Nie opisujesz kodu linijka po linijce.
- Nie szukasz błędów. To zadanie `/critical-code-review`.
- Nie poprawiasz starych kronik. To historia.

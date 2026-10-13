# 0002. Numeracja rekordów

Data: 2026-10-13. Status: przyjęta.

## Kontekst

Agent zakłada rekordy sam, a ludzie mówią o nich numerami („zadzwoń w sprawie SL-014”). Numer musi dać się powiedzieć na głos, posortować i nie może się mylić między rodzajami rekordów. Trzy stare oferty z archiwum dostały numery SL-011, SL-012 i SL-013, więc numeracja szans nie zaczyna się od jedynki.

## Decyzja

- **Organizacja:** trzy cyfry z zerami, `001`, `002`. Firmy i osoby prywatne mają wspólną numerację. Ten sam numer posłuży jako numer klienta, a projekty klienta dostaną `002.1`, `002.2`.
- **Szansa:** `SL-` i trzy cyfry, `SL-014`. Kolejny numer to największy istniejący plus jeden.
- **Użytkownik:** krótkie imię małymi literami, bez polskich znaków, `marek`.
- Numer to nazwa pliku. W pliku nie ma pola `id`. Numerów nie zmieniamy i nie używamy drugi raz.

## Odrzucone

- **UUID.** Nie da się go powiedzieć ani zapamiętać.
- **Numer z rokiem (2026-001).** Długi, a przy kilkudziesięciu szansach rocznie rok nic nie wnosi.
- **Osobna numeracja firm i osób prywatnych.** Osoba prywatna może wrócić z firmą, a dwa numery dla jednej relacji wprowadzają zamęt.
- **Numery bez zer (SL-14).** Pliki źle się sortują: SL-100 stanąłby przed SL-14.

## Konsekwencje

- Sortowanie po nazwie pliku to sortowanie po numerze.
- Po 999 rekordach trzeba przejść na cztery cyfry i świadomie zmienić test formatu w `tests/dane.test.mjs`.
- Agent sprawdza katalog przed nadaniem numeru. Dwa równoległe zapisy mogłyby wziąć ten sam numer. W prototypie z jednym agentem to akceptujemy.

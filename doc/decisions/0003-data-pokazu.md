# 0003. Zamrożona data „dziś”

Data: 2026-10-13. Status: przyjęta.

## Kontekst

Ekran „Na dziś” zależy od daty: co jest zaległe, co przyszłe. Dane powstają 13 października, pokaz jest 28 października, a uczestnicy uruchomią repo kiedykolwiek później. Gdyby aplikacja brała datę z zegara, za tydzień SL-014 przestałaby być „2 dni po terminie”, a za miesiąc wszystko byłoby zaległe.

## Decyzja

„Dziś” to pole `dzis` w `data/demo.json` (`2026-10-28`). Od niego ekran liczy zaległości i sekcje „Na dziś”, a dashboard pisze „Stan na…”. Serwer przy zapisie stempluje prawdziwą datę i godzinę z zegara komputera (wpisy aktywności, historia statusu).

## Odrzucone

- **Data z zegara.** Ekran wyglądałby inaczej każdego dnia.
- **Skrypt przesuwający wszystkie daty w danych.** Więcej kodu, a diff w gicie zalewa zmiana setek dat.
- **Stemplowanie zapisów datą `dzis`.** Godzina wpisu byłaby nieprawdziwa, a wpisy z próby i z pokazu wyglądałyby tak samo.

## Konsekwencje

- Repo uruchomione w dowolnym dniu pokazuje ten sam stan co na scenie.
- W dniu pokazu wpisy z ekranu lądują na końcu osi czasu, bo mają datę 28.10.
- Przy próbie przed 28.10 nowy wpis dostaje wcześniejszą datę niż część danych i staje w środku osi czasu. Test „historia rośnie chronologicznie” może wtedy nie przejść. Po próbie: `git checkout data/`.
- Po 28.10 nowe wpisy mają daty późniejsze niż „dziś”. Dla prototypu to w porządku. Zmiana `dzis` przestawia cały ekran.

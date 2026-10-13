# Projekty klienta z zadaniami

**Gałąź:** `feat/projekty-klienta` · **Plan:** [plan](../plans/projekty-klienta/plan.md) · **Decyzja:** [0004](../decisions/0004-zadania-w-osobnych-plikach.md) · **Status:** zamknięta

## Cel
Szansa kończyła się zamówieniem i Brain się na tym urywał. Po zmianie wygrana szansa zamienia się w projekt klienta z numerem od numeru klienta (002.1), a projekt ma zadania z osobą, terminem i aktywnością. Zadania na dziś stoją w „Na dziś” obok szans. Właściciel produktu chciał zobaczyć całość od razu, więc trzy etapy powstały w jednym przebiegu.

## Plan wykonania (przed kodem)
1. Dane: `statusy_projektow`, `statusy_zadan` i `szablon_zadan` w `demo.json`, katalogi `data/projekty/` i `data/zadania/` z 001.1 i 010.1 z planu.
2. Reguły bez przeglądarki: numeracja w `lib/numeracja.mjs` (serwer i testy), sekcje „Na dziś” i postęp projektu w `public/reguly.js` (ekran i testy).
3. Serwer: wspólna ścieżka zmiany z ekranu dla szansy i zadania (`PATCH /api/zadania/:id`), `POST /api/projekty` z blokadą drugiego projektu dla tej samej szansy, poprawka routingu adresów z kropką.
4. Ekran: zakładka i karta projektu, widok zadania, sekcje w organizacji i szansie, zadania w „Na dziś”.
5. Testy per etap (numeracja, spójność plików, „Na dziś”, API na kopii danych), potem trzy scenariusze w przeglądarce.

## Decyzje wspólne

### Testy nie zależą od stanu danych pokazu
**Wybór:** testy reguł i API mają własne dane w pliku testu. Test API uruchamia serwer na wolnym porcie z `DATA_DIR` w katalogu tymczasowym. Test `dane.test.mjs` sprawdza tylko spójność, nie stan startowy.
**Odrzucone:** testy na `data/` („kolejny projekt dla 002 to 002.1” liczony z katalogu). Po kliknięciu „Załóż projekt” na scenie albo po oznaczeniu zadania jako zrobione `node --test` zrobiłby się czerwony, a agent uznałby, że dane są zepsute (AGENTS.md, zasada 10).
**Skutek:** serwer czyta zmienną `DATA_DIR` (domyślnie `data/`). Stan startowy z planu sprawdziły scenariusze w przeglądarce.

### Dane startowe
001.1 „Lada i półki” (z SL-013, zakończony, trzy zrobione zadania) i 010.1 „Biurko i regał” (z SL-022, w toku): zaległe zadanie Dawida (26.10), zadanie Marka na 28.10 i montaż bez terminu. Aktywność 001.1 trzyma się dat z SL-013: pomiar i produkcja w lipcu, montaż 20-21 sierpnia. Brief dla wykonawcy mówił o czerwcu i lipcu, ale projekt powstał dopiero przy zamówieniu 2 lipca, a montaż w SL-013 jest w sierpniu.

## Etap 1: Projekty

### Numer projektu liczony jako największy + 1
**Wybór:** `lib/numeracja.mjs`: numer klienta, kropka, największa użyta liczba tego klienta plus jeden. Liczby porównujemy jako liczby (po 002.9 jest 002.10).
**Odrzucone:** wypełnianie luk (002.2 po usunięciu). Numerów nie używamy drugi raz (ADR 0002). Porównanie tekstowe: 002.10 stanęłoby przed 002.2.

### Adresy z kropką w numerze
**Pułapka:** serwer traktował każdy adres z „rozszerzeniem” jako plik z `public/`, więc `/projekty/002.1` (rozszerzenie `.1`) i `/zadania/002.1-01` dawały 404.
**Wybór:** plikiem jest tylko adres ze znanym rozszerzeniem (`.html`, `.js`, `.css`, `.json`, `.svg`). Reszta to ekran aplikacji.
**Odrzucone:** lista tras ekranu w serwerze (drugi router do pilnowania), zamiana kropki w adresie na inny znak (numer w adresie przestałby być numerem z rozmowy).

### Lista projektów według sekcji statusu
**Wybór:** „W toku” i „Zakończone” wynikają z pola `sekcja` w `statusy_projektow`, tak jak „W grze” i „Zamknięte” przy szansach. Uszkodzony plik projektu stoi w „W toku” z komunikatem, a na karcie organizacji trafia do klienta po numerze pliku (005.1 → 005).
**Odrzucone:** twarde `w-toku`/`zakonczony` w kodzie. Nowy status dodany przez agenta (np. „wstrzymany”) wypadłby z listy.

### Postęp liczony, nie zapisywany
„X z Y” to zrobione zadania (sekcja `zamkniete`) z wszystkich zadań projektu. Uszkodzone zadanie liczy się do Y, żeby nie zniknęło z rachunku. Karta projektu nie zmienia pól projektu. Status i nazwę zmienia agent, zgodnie z planem.

## Etap 2: Zadania i „Na dziś”

### Jedna ścieżka zmiany dla szansy i zadania
**Wybór:** serwer ma jedną funkcję zmiany z ekranu i opis pól dla każdej kolekcji (szansa: status, priorytet, opiekun, termin; zadanie: status, osoba, termin). Zadanie nie ma `historia`, zmiana statusu zostaje jako wpis `zmiana` w aktywności (ADR 0004).
**Odrzucone:** kopia funkcji szansy dla zadań. Dwie kopie białej listy i zapisu atomowego szybko by się rozjechały.

### Reguły „Na dziś” w module bez przeglądarki
**Wybór:** `public/reguly.js` (sekcje „Na dziś”, dni po terminie, postęp). Importuje go `app.js` i testy.
**Odrzucone:** logika w `app.js` (bez przeglądarki nie da się jej sprawdzić) i moduł w `lib/` serwowany osobną trasą (więcej kodu w serwerze).
**Zasady:** zadanie z terminem dziś i wcześniej jest w „Do zrobienia”, z terminem po dziś w „Przyszłe”, bez osoby w „Nieprzypisane”. Zadanie bez terminu i zrobione nie trafia nigdzie, nawet bez osoby. Szansa bez terminu zostaje w „Do zrobienia” jak dotąd: to świadoma różnica z planu, nie błąd.

### Wiersz zadania w „Na dziś”
Plakietka „Zadanie” (klasa `tag`), pod nazwą „Projekt 010.1 · klient”, kolumna priorytetu pusta. Kolumna numeru w „Na dziś” jest szersza (002.1-01 jest dłuższy niż SL-014). Nagłówek kolumny został „Opiekun”, bo dotyczy też szans.

## Etap 3: Projekt z wygranej szansy

### Jedna szansa, jeden projekt
**Wybór:** serwer sprawdza, czy jakiś projekt ma już tę szansę, i wtedy zwraca błąd. Zakładanie projektów idzie po kolei (kolejka w serwerze), więc dwa szybkie kliknięcia nie wezmą tego samego numeru. Wygrana to status z `rola: "wygrana"`, nie wpisane na sztywno `zamowienie`.
**Odrzucone:** pilnowanie tylko na ekranie (ukryty przycisk). Drugie okno albo agent i tak mogłyby założyć 002.2.

### Kilka plików bez transakcji
**Wybór:** najpierw zadania, na końcu projekt. Każdy plik powstaje przez plik tymczasowy z kropką i `link`, który nie nadpisze istniejącego pliku. Przy błędzie serwer usuwa pliki utworzone w tym wywołaniu.
**Odrzucone:** `rename` jak przy zmianie szansy. Nadpisałby plik, który agent zapisał w tej samej chwili pod tym numerem.
**Skutek:** numer projektu liczymy też z numerów zadań, więc zadanie bez projektu (np. 003.2-01) blokuje numer 003.2.

### Uszkodzony projekt klienta blokuje zakładanie
Jeśli plik projektu tego klienta jest uszkodzony, serwer nie wie, czy to nie projekt z tej samej szansy. Prosi o poprawkę pliku, zamiast ryzykować drugi projekt.

### Co dostaje nowy projekt
Nazwę i opiekuna szansy, pierwszy status z `statusy_projektow`, zadania z `szablon_zadan` z pierwszym statusem zadań, bez terminów, z osobą = opiekunem szansy i pustą aktywnością. `utworzono` to dzień z zegara komputera, nie `dzis` (ADR 0003). Plik szansy zostaje bez zmian: odnośnik „Projekt 002.1” ekran liczy z pola `szansa` w projekcie. Po założeniu ekran przechodzi na kartę projektu (scenariusz 1).

## Poprawki po przeglądzie (runda 1)
Przegląd kodu robi agent, który tego kodu nie pisał, w najwyżej dwóch rundach. Uwagi mają numery: W to ważna, D to drobna. Na STOP 3 użytkownik decyduje o każdej uwadze: napraw, na później albo pomiń (przebieg i wszystkie STOP-y opisuje skill [code-manager](../../.agents/skills/code-manager/SKILL.md)).

Decyzje po rundzie 1: D1 i D2 naprawione, D3 pominięte. W D1 dopisaliśmy dwie asercje: zmiana statusu szansy zostawia wpis w `historia`, a pole `constructor` odbija się od białej listy. Test `link` i sprzątania po nieudanym zakładaniu został na później.

### Wygrana to każdy status z rolą „wygrana”
**Wybór:** serwer sprawdza rolę bieżącego statusu szansy, tak samo jak ekran przy przycisku „Załóż projekt”. Odmowa wymienia wszystkie statusy wygranej: „Zamówienie” albo „Zamówienie częściowe”.
**Odrzucone:** pierwszy status z rolą „wygrana” (tak było). Ekran pokazywał przycisk przy drugim takim statusie, a serwer odmawiał. Ogólny komunikat bez nazw statusów: użytkownik nie wiedziałby, jaki status ustawić.
**Skutek:** agent może dodać w `demo.json` kolejny status wygranej bez zmiany kodu.

### Brak szablonu zadań to projekt bez zadań
**Wybór:** brak pola `szablon_zadan` serwer traktuje jak pustą listę i zakłada sam projekt, tak jak obiecuje ekran („Projekt bez zadań startowych.”). `null` traktujemy tak samo, bo w danych `null` znaczy „brak”. Szablon, który jest, ale ma błąd (nie lista albo pusta nazwa), dalej blokuje zakładanie. Ekran ocenia szablon tak jak serwer i w tym przypadku pisze przy przycisku „Szablon zadań w demo.json ma błąd.”.
**Odrzucone:** odmowa przy braku pola (tak było, ekran obiecywał coś innego). Pomijanie złych pozycji szablonu: projekt dostałby inne zadania, niż zapisał agent.
**Skutek:** wcześniej przy szablonie z błędem ekran obiecywał projekt bez zadań albo zadania z pustą nazwą, a serwer odmawiał. Teraz ekran i serwer mówią to samo.
**Dane pokazu:** `data/demo.json` trzyma pole zawsze jako listę (pilnuje tego test spójności), a `AGENTS.md` każe agentowi wpisać `[]` zamiast usuwać pole. Przypadek `null` ma własną asercję w teście zakładania projektu.

## Poprawka z bramki
Bramka to sprawdzenie po etapie: testy automatyczne, a potem checklista scenariuszy do przeklikania w aplikacji ([plik bramki](../bramki/2026-10-28-projekty-klienta.md)). W pierwszym przejściu nie działał punkt 2.1, termin zadania.

**Pułapka (punkt 2.1 bramki):** termin wpisywany z klawiatury zapisywał się przy każdej cyfrze roku. Chrome zgłasza zmianę pola daty po każdej cyfrze, bo „0002-10-28” to już poprawna data. Każdy zapis przerysowywał ekran i pole gubiło fokus. Zadanie 002.1-01 dostało sześć wpisów `zmiana`, a w pliku został termin z rokiem 0020 (`0020-10-28`). Testy automatyczne i przegląd kodu tego nie złapały. Błąd był już w wersji przed projektami (termin szansy na `main`), dlatego poprawka poszła do obu gałęzi. Kod terminu jest w obu taki sam, tutaj obsługuje też zadania.
**Wybór:** termin wpisywany z klawiatury zapisuje się raz, po wyjściu z pola albo po Enterze. Wybór z kalendarza i „Wyczyść” w kalendarzu zapisują się od razu jak dotąd, wyczyszczenie z klawiatury przy wyjściu z pola. Ekran i serwer przyjmują tylko dzień z lat 2000-2099. Niepełna data albo rok spoza zakresu nie idzie do pliku: pole wraca do zapisanego terminu i pokazuje komunikat, a serwer odrzuca taki zapis (błąd 400) z opisem poprawnego formatu.
**Odrzucone:** sam filtr roku na ekranie. Przy polu z terminem pierwsza cyfra dnia daje już poprawną datę (2026-10-02), więc zapis i utrata fokusu zostawały. Zapis po przerwie w pisaniu (opóźnienie): dłuższa pauza w środku daty dalej zapisywałaby półprodukt.
**Zakres lat:** 2000-2099, bo w danych są lata 2025-2026, a terminy dotyczą najbliższych miesięcy. Wszystkie lata z niedokończonego pisania (0002, 0020, 0202) są poza zakresem, a regułę da się powiedzieć jednym zdaniem.
**Skutek:** w Chrome pierwszy Tab po wpisaniu daty staje na ikonie kalendarza w tym samym polu, zapis idzie przy drugim Tabie albo kliknięciu obok. Dane z bramki (w tym termin `0020-10-28` w 002.1-01) wróciły do stanu startowego.

Poprawka dotyczy też `main`, więc dostała osobny przegląd w dwóch rundach. Niżej uwagi z niego i to, co z nimi zrobiliśmy.

**Kliknięcie po wpisaniu terminu (przegląd, W1):** zapis przy wyjściu z pola przerysowywał ekran w trakcie kliknięcia, które to wyjście wywołało. Przycisk, odnośnik albo pole znikały spod kursora, zanim użytkownik puścił przycisk myszy, i kliknięcie przepadało. Teraz termin zapisuje się od razu przy wyjściu z pola, a ekran przerysowuje się dopiero po puszczeniu przycisku, gdy kliknięcie już zadziałało. Tak samo czeka odświeżenie na żywo w trakcie kliknięcia i przy otwartej liście. Po przerysowaniu kursor wraca do pola, w które użytkownik kliknął, więc w termin następnego zadania można pisać od razu.
**Odrzucone:** zapis czekający do końca kliknięcia (kierunek z przeglądu). Chrome na Macu zgłasza puszczenie przycisku zaraz po otwarciu listy, więc zapis po nim i tak zamknąłby listę „Osoba”. Czekanie z przerysowaniem jedną regułą obejmuje zapis, odświeżenie na żywo i listę.
**Zmiana pliku w trakcie pisania terminu (przegląd, D4):** dopóki kursor jest w terminie wpisywanym z klawiatury, ekran się nie przerysowuje. Nic się nie zapisuje, wpisane cyfry i kursor zostają, a komunikat o zmianie pojawia się od razu. Ekran nadrabia po wyjściu z pola. Gdy pole mimo to znika (przejście na inny ekran w trakcie pisania), niedokończona data przepada bez zapisu.
**Skutek:** gdy użytkownik zamknie listę bez wyboru, reszta ekranu (np. aktywność) odświeży się przy następnym kliknięciu albo wyjściu z listy. Termin jest już wtedy w pliku.
**Test spójności (przegląd, D5):** na tej gałęzi pilnuje lat 2000-2099 w terminach szans, tą samą asercją co wersja przed projektami, i osobno w terminach zadań.
**Miesiąc w kolejnym terminie (przegląd, D6):** po zapisie jednego terminu ekran się przerysowywał i oddawał fokus polu następnego terminu. Chrome stawiał wtedy kursor na dniu, także gdy użytkownik kliknął w miesiąc. Zmiana samego miesiąca (np. „11”, żeby przesunąć 28.10 na listopad) zapisywała zły dzień: 2026-10-11 zamiast 2026-11-28. Teraz ekran nie przerysowuje się, dopóki kursor stoi w polu terminu, a nie tylko w trakcie pisania. Kursor zostaje tam, gdzie użytkownik kliknął.
**Koszt:** odświeżenie na żywo czeka też wtedy, gdy kursor stoi w polu terminu bez pisania. Komunikat o zmianie pojawia się od razu.
**Przełączenie na inną aplikację w trakcie pisania (przegląd, poza uwagami):** przejście do innej aplikacji (Cmd+Tab) po pierwszej cyfrze dnia zapisywało niedokończoną datę, np. 2026-10-01 zamiast 2026-10-15, bo przeglądarka zgłasza wtedy wyjście z pola. Recenzent opisał to poza uwagami, bo nie zepsuła tego ta poprawka. Teraz, gdy okno traci fokus w trakcie pisania, termin się nie zapisuje. Zapis idzie przy wyjściu z pola po powrocie do okna, także gdy data była już pełna.
**Sprawdzenie:** D6 i przełączenie okna naprawiliśmy po rundzie 2, bez kolejnej rundy przeglądu, w obu gałęziach. Obie poprawki sprawdziły scenariusze w przeglądarce.

## Świadome pominięcia
- Wszystko z „Poza zakresem” planu: usuwanie i zmiana nazw z ekranu, dodawanie pojedynczego zadania z ekranu, zależności, Gantt, czas pracy, załączniki, powiadomienia.
- Pola projektu (status, opiekun) nie zmieniają się z ekranu. Robi to agent.
- Niezrobione zadanie zakończonego projektu dalej pojawia się w „Na dziś”. Liczy się status zadania, nie projektu.
- Kolejka zakładania działa w jednym procesie serwera. Przed równoległym zapisem agenta chroni `link` (brak nadpisania), nie kolejka.
- Na wąskim ekranie wiersze zadań mają ten sam prosty układ co „Na dziś”.
- Zakładanie projektu na dysku bez twardych dowiązań (pendrive exFAT/FAT32, dysk sieciowy) kończy się „Błąd serwera.” (przegląd, D3). Pominięte: to repo demonstracyjne, uruchamiane z dysku laptopa.

## Jak testować
Automat: `node --test` (47 testów). Etapy są w nazwach grup testów: numeracja (`tests/numeracja.test.mjs`), spójność plików (`tests/dane.test.mjs`), „Na dziś” i postęp (`tests/na-dzis.test.mjs`), API na danych testowych (`tests/api.test.mjs`).

Scenariusze z planu (sprawdzone w przeglądarce):
1. Szanse → SL-014 → status „Zamówienie” → „Załóż projekt” → karta 002.1 „Recepcja i aneks kuchenny” z trzema zadaniami → Organizacje → 002 → 002.1 w „Projekty” → SL-014 → odnośnik „Projekt 002.1”, przycisku już nie ma.
2. Projekty → 002.1 → „Pomiar końcowy”: osoba Dawid, termin 2026-10-28 → Na dziś → zadanie w „Do zrobienia” z plakietką „Zadanie” → komentarz „Pomiar umówiony na 9:00” → status „Zrobione” → zadanie znika z „Na dziś” → 002.1 pokazuje „1 z 3”.
3. Zadanie bez terminu nie jest w „Na dziś”. Szansa w statusie „Oferta” (SL-018) nie ma przycisku „Załóż projekt”.

Do checklisty bramki (sprawdza się okiem):
- Zakładka „Projekty” w menu, lista z klientem, postępem i opiekunem.
- Karta 010.1: klient 010 i szansa SL-022 jako klikalne odnośniki.
- Organizacja 001 ma 001.1 w „Projekty”, organizacja bez projektów (np. 004) pokazuje „Brak projektów.”.
- SL-013 ma odnośnik „Projekt 001.1”.
- Uszkodzony plik projektu (np. `data/projekty/005.1.json` z urwanym JSON-em) pokazuje „Ten rekord ma błąd w danych.” przy 005.1, reszta listy działa. Po próbie usuń plik.
- Agent dopisuje wpis do `data/zadania/010.1-01.json`: wpis pojawia się w widoku zadania w ciągu sekundy, miga, na dole jest komunikat.
- Zaległe zadanie 010.1-01 ma „2 dni po terminie”.

Termin po poprawce z bramki:
- Termin wpisany z klawiatury cyfra po cyfrze (28102026), potem kliknięcie obok: pole nie skacze, w aktywności jest jeden wpis o terminie.
- Niepełna data (281020), kliknięcie obok: komunikat „Nie zapisano terminu: wpisz pełną datę z lat 2000-2099.”, pole wraca do zapisanego terminu.
- Termin pierwszego zadania i od razu kliknięcie w termin drugiego: oba terminy zapisane.
- Termin pierwszego zadania, od razu kliknięcie w miesiąc drugiego i „11”: drugi termin przechodzi na listopad.

Po próbie: `git checkout -- data/` i usunięcie plików 002.1 (`data/projekty/002.1.json`, `data/zadania/002.1-*.json`).

## Wynik bramki i przeglądu
- **Bramka:** [2026-10-28-projekty-klienta](../bramki/2026-10-28-projekty-klienta.md). Pierwsze przejście: działa 12 z 13. Nie działał punkt 2.1 (termin), a tego błędu nie złapały ani testy, ani przegląd kodu. Błąd był też w wersji przed projektami, więc poprawka poszła do obu gałęzi. Poprawkę sprawdziliśmy w przeglądarce na kopii danych według tych samych kroków (2.1, 2.2, niepełna data, termin szansy w wersji przed projektami): 4 z 4 zgodnie z oczekiwaniem.
- **Przegląd projektów:** [2026-10-28-projekty-klienta](../code-reviews/2026-10-28-projekty-klienta.md). Runda 1 zatwierdzona z 3 drobnymi uwagami: D1 i D2 naprawione, D3 pominięte (powód w „Świadomych pominięciach”). Runda 2 zatwierdzona bez nowych uwag.
- **Przegląd poprawki terminu:** dwie rundy, w tym samym raporcie. Runda 1: do poprawy, jedna ważna uwaga (W1: pierwsze kliknięcie po wpisaniu terminu przepadało) i dwie drobne (D4: zapis niedokończonej daty przy odświeżeniu ekranu, D5: test lat w terminach zadań), wszystkie naprawione. Runda 2 zatwierdziła poprawkę. Dwie ostatnie drobne rzeczy naprawiono bez kolejnej rundy i sprawdzono scenariuszami w przeglądarce: zmiana samego miesiąca w kolejnym terminie zapisywała zły dzień (D6), a przełączenie na inną aplikację w trakcie pisania zapisywało niedokończoną datę.
- **Na później:** test zapisu bez nadpisywania i sprzątania po nieudanym zakładaniu projektu (reszta D1), w [backlogu](../backlog.md).
- **Akcept (STOP 4):** właściciel produktu zaakceptował zmianę do commita na tej gałęzi. Gałąź celowo nie trafiła do `main`: `main` zostaje punktem startowym dla uczestników warsztatu (prosty Brain i zatwierdzony plan), a ta gałąź jest rozwiązaniem wzorcowym.


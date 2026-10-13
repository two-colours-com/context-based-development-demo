# Przegląd: Projekty klienta z zadaniami

Przegląd robi agent, który nie pisał tego kodu (skill [critical-code-review](../../.agents/skills/critical-code-review/SKILL.md)). Uwagi mają numery: W to ważna, D to drobna. Numery linii odnoszą się do kodu z chwili danej rundy. Raport ma dwie części: przegląd projektów klienta (rundy 1 i 2) i osobny przegląd poprawki z bramki (też dwie rundy), bo ta poprawka dotyczy również gałęzi `main`. Decyzje o uwagach opisuje [kronika zmiany](../history/2026-10-28-projekty-klienta.md).

## Runda 1 (2026-10-28), etapy 1-3

Zakres: `git diff main...feat/projekty-klienta`, commit `db31bb6` (bez commita `0852a98` z `main` o escapowaniu formaterów).

Ocena: wszystkie kryteria „działa, jeśli…” z trzech etapów są spełnione. Zapis jest bezpieczny: zakładanie projektu idzie w kolejce, nie nadpisuje plików i liczy numer także z osieroconych zadań. Tekst z plików trafia na ekran jako tekst. Uwag blokujących nie ma. Trzy drobne dotyczą luk w testach i rzadkich przypadków, w których ekran i serwer oceniają sprawę inaczej.

### Co sprawdziłem

- `node --test`: 44 z 44 zielone.
- Ekran w przeglądarce, na kopii danych:
  - scenariusze 1-3 z planu: SL-014 → 002.1 z trzema zadaniami, potem odnośnik „Projekt 002.1” zamiast przycisku; „Pomiar końcowy” w „Na dziś”, po „Zrobione” znika, a 002.1 pokazuje „1 z 3”; SL-018 bez przycisku;
  - przycisk na SL-011 („Zamówienie” bez projektu) zakłada 003.1 i przechodzi na kartę projektu;
  - uszkodzony `projekty/005.1.json`: komunikat przy 005.1 na liście i na karcie organizacji 005, reszta działa;
  - uszkodzone zadanie `010.1-09`: komunikat na karcie projektu;
  - organizacja bez projektów: „Brak projektów.”;
  - agent dopisuje wpis do `010.1-02`: wpis pojawia się w widoku zadania, miga i daje komunikat.
- Tekst z plików: wstawiłem znaczniki HTML i skrypty do nazwy, statusu, opiekuna i daty projektu, do nazwy i terminu zadania oraz do aktywności (autor, typ, treść, pola zmian). Na liście projektów, karcie projektu, w widoku zadania, w „Na dziś” i na karcie organizacji wszystko jest zwykłym tekstem. Żaden skrypt się nie wykonał.
- API:
  - zapis z obcej strony (`Origin` obcy i `null`) i obcy `Host`: 403;
  - pola `__proto__`, `constructor`, `toString`: 400;
  - numer z `.json`, numer szansy pod `/api/zadania` i numer zadania pod `/api/szanse`: 404;
  - za duży ładunek: 413;
  - pięć jednoczesnych „Załóż projekt” dla SL-014: jeden projekt 002.1, cztery odmowy.
- Siła testów: na kopii repozytorium celowo psułem kod i patrzyłem, czy `node --test` to wykryje.
  - Wykrył: brak kolejki zakładania i brak blokady przy uszkodzonym projekcie.
  - Nie wykrył: patrz D1.

### [Drobne] D1: Trzy zabezpieczenia zapisu nie mają testu, który by padł

**Co zobaczysz:** dziś nic, kod działa. Kłopot pojawi się przy następnej zmianie kodu, bo `node --test` zostaje zielony, gdy:

- **zmiana statusu szansy przestaje dopisywać `historia`.** Ta ścieżka przeszła wspólną przeróbkę z zadaniami. Gdyby się zepsuła, „W statusie od” na karcie szansy przestałoby się zmieniać. Do tego po pierwszej zmianie statusu na pokazie test spójności danych zrobiłby się czerwony („ostatni wpis historii musi mieć bieżący status”), a agent uznałby, że dane są zepsute.
- **biała lista wraca do `checks[key]` zamiast `Object.hasOwn`.** Wtedy pole `constructor` przechodzi kontrolę i ekran wpisuje do pliku zadania pole spoza listy.
- **`link` zostaje zamieniony na `rename` albo znika sprzątanie po nieudanym zakładaniu.** Test „istniejący plik nie jest nadpisany” przechodzi dzięki numeracji (003.3 omija 003.2), a nie dzięki `link`.

**Gdzie:**
- historia szansy: `server.mjs:116`, test `tests/api.test.mjs:272`;
- biała lista: `server.mjs:146`, przypadki odrzucane w `tests/api.test.mjs:214-222`;
- `link` i sprzątanie: `server.mjs:193` i `server.mjs:200`, test `tests/api.test.mjs:316-324`.

**Kierunek poprawki:**
- w teście etapu 3 po zmianie statusu SL-014 sprawdź `historia.at(-1).status === 'zamowienie'`;
- do przypadków odrzucanych dopisz `{ zmiany: { constructor: 'x' } }`.

Test `link` i sprzątania wymaga podłożenia pliku w trakcie zapisu, więc to większa robota.

**Rekomendacja:** napraw (dwie asercje). Test `link` i sprzątania: na później.

### [Drobne] D2: Ekran pokazuje „Załóż projekt”, a serwer odmawia

**Co zobaczysz:**

- **Drugi status wygranej.** Agent dodaje w `demo.json` np. „Zamówienie częściowe” z `"rola": "wygrana"`. Szansa w tym statusie ma przycisk „Załóż projekt”, a kliknięcie kończy się komunikatem „Projekt zakłada się z szansy w statusie „Zamówienie”.”. Sprawdziłem na kopii danych.
- **Brak `szablon_zadan`.** Gdy z `demo.json` zniknie to pole, ekran pisze „Projekt bez zadań startowych.”, a serwer odmawia: „Szablon zadań w demo.json ma błąd.”.

Kronika mówi, że wygrana to każdy status z `rola: "wygrana"`. Serwer bierze tylko pierwszy taki status.

**Gdzie:** `server.mjs:219-220` (i `server.mjs:223-224`) wobec `public/app.js:245-250`.

**Kierunek poprawki:** serwer sprawdza `statusy.some((s) => s.id === deal.status && s.rola === 'wygrana')`. Brak `szablon_zadan` traktuje jak pustą listę, tak jak ekran.

**Rekomendacja:** napraw (warunek wygranej to jedna linia).

### [Drobne] D3: Na dysku bez twardych dowiązań projektu nie da się założyć

**Co zobaczysz:** repo leży na pendrivie z systemem plików exFAT albo FAT32 albo na dysku sieciowym. Wtedy „Załóż projekt” zawsze kończy się komunikatem „Błąd serwera.”. Zmiany szans i zadań działają normalnie. Na zwykłym dysku laptopa (APFS, NTFS, ext4) problemu nie ma. Nie sprawdzałem tego na takim dysku. Wynika to z tego, jak działa `link`.

**Gdzie:** `server.mjs:193`

**Kierunek poprawki:** gdy `link` zwróci `EPERM`, `ENOTSUP` albo `ENOSYS`, zapisz plik przez `writeFile(file, …, { flag: 'wx' })`. Ten zapis też nie nadpisze istniejącego pliku. Druga możliwość: pokaż zrozumiały komunikat.

**Rekomendacja:** na później.

### Zgodność z planem

- **Etap 1** spełniony:
  - zakładka „Projekty” z klientem, postępem i opiekunem;
  - karta 010.1 z odnośnikami do 010 i SL-022;
  - sekcja „Projekty” na karcie organizacji i „Brak projektów.”;
  - odnośnik „Projekt 001.1” na SL-013;
  - uszkodzony plik z komunikatem przy sobie;
  - test numeracji 002.1 / 001.2.
- **Etap 2** spełniony:
  - status, osoba i termin zadania zmieniają się z karty projektu i z widoku zadania;
  - każda zmiana zostawia wpis kto, co i kiedy;
  - „Na dziś” pokazuje zadania na dziś i zaległe z ostrzeżeniem, bez zrobionych i bez zadań bez terminu;
  - zmianę pliku przez agenta widać od razu.
- **Etap 3** spełniony:
  - przycisk tylko przy wygranej szansie bez projektu;
  - 002.1 z nazwą i opiekunem szansy oraz trzema zadaniami bez terminów;
  - po założeniu odnośnik zamiast przycisku, drugi projekt dla tej samej szansy nie powstaje.
- **Zakres:** nic nie wyszło poza plan.
  - Dodatki są małe i opisane w kronice: przycisk „Przejmij” przy zadaniu, zmienna `DATA_DIR` dla testów, poprawka adresów z kropką, `Object.hasOwn` w białej liście.
  - Usuwania, zmiany nazw ani dodawania pojedynczego zadania z ekranu nie ma, zgodnie z „Poza zakresem”.

### Co zrobiono dobrze

- **Zakładanie projektu:** kolejka w serwerze plus `link`, który nie nadpisze pliku agenta. Numer liczony także z osieroconych zadań. Uszkodzony projekt klienta blokuje zakładanie, zamiast zgadywać. Wyścig dwóch kliknięć ma test, który pada bez kolejki (sprawdziłem).
- **Testy nie zależą od stanu `data/`:** API testuje się na kopii w katalogu tymczasowym. Kliknięcia na pokazie nie zrobią testów czerwonymi.
- **Reguły „Na dziś” i postępu** wydzielone do `public/reguly.js`, więc da się je sprawdzić bez przeglądarki. Ekran i testy używają tej samej funkcji.

Werdykt: Zatwierdzam
Uwagi: 0 krytycznych, 0 ważnych, 3 drobne

## Runda 2 (2026-10-28), poprawki po rundzie 1

Zakres: `git diff db31bb6 -- server.mjs public/app.js tests/api.test.mjs doc/history/2026-10-28-projekty-klienta.md` (poprawki jeszcze bez commita) plus miejsca, które z nimi współpracują. Zmiany w `data/` (SL-014, pliki 002.1) zostały po klikaniu w aplikacji i nie są poprawkami, więc je pominąłem.

Ocena: D1 i D2 są naprawione zgodnie z decyzjami użytkownika. Nowe testy padają, gdy cofnąć poprawkę. Poprawki niczego obok nie zepsuły: komunikaty odmowy, ekran przy szablonie z błędem i `null` w `szablon_zadan` działają tak, jak opisuje kronika.

### Status uwag z rundy 1

- **D1: zamknięta.** Dopisane dwie asercje: wpis w `historia` po zmianie statusu SL-014 (`tests/api.test.mjs:275`) i przypadek `constructor` w białej liście (`tests/api.test.mjs:221`). Obie padają, gdy cofnąć zabezpieczenie (tabela niżej). Test `link` i sprzątania został na później, zgodnie z decyzją.
- **D2: zamknięta.**
  - Serwer sprawdza rolę bieżącego statusu szansy (`server.mjs:220-224`), tak jak ekran. Odmowa wymienia wszystkie statusy wygranej.
  - Brak `szablon_zadan` i `null` to projekt bez zadań (`server.mjs:228`). Szablon z błędem dalej blokuje.
  - Ekran ocenia szablon tak samo (`public/app.js:246-249`). Przy błędzie pisze przy przycisku „Szablon zadań w demo.json ma błąd.” zamiast obiecywać projekt bez zadań.
- **D3: otwarta.** Pominięta decyzją użytkownika, kod bez zmian.

### Co sprawdziłem

- `node --test`: 46 z 46 zielone.
- Test mutacji na kopii repozytorium: cofałem jedną poprawkę naraz i uruchamiałem `node --test`.

| Co cofnąłem | Wynik |
|---|---|
| szansa nie dopisuje `historia` przy zmianie statusu | czerwony: test zakładania 002.1 z SL-014 (nowa asercja), za nim test drugiego kliknięcia |
| biała lista wraca do `checks[key]` | czerwony: „ekran zmienia tylko status, osobę i termin…” (przypadek `constructor`) |
| wygrana to pierwszy status z rolą „wygrana” (stary kod) | czerwony: „drugi status z rolą „wygrana” też zakłada projekt…” |
| dobry warunek, ale komunikat z jednym statusem | czerwony: ten sam test |
| brak `szablon_zadan` daje odmowę (stary kod) | czerwony: „bez szablonu zadań w demo.json projekt powstaje bez zadań…” |
| szablon z błędem traktowany jak pusta lista | czerwony: ten sam test |
| pusta lista tylko przy braku pola, `null` daje odmowę | zielony |

  Ostatni wiersz: `null` działa dobrze (sprawdziłem na ekranie), ale nie ma na to testu. Gdyby ktoś zawęził warunek, przy `"szablon_zadan": null` ekran znów obiecywałby projekt bez zadań, a serwer by odmawiał. Nie zakładam uwagi, bo poprawka niczego nie zepsuła. Domknie to jeden przypadek z `null` w tym samym teście.

- Ekran w przeglądarce, na kopii danych. Podpis przy „Załóż projekt” na SL-011 („Zamówienie”, bez projektu):
  - szablon jako lista: „Zadania startowe: Pomiar końcowy, Produkcja, Montaż.”;
  - napis zamiast listy, pusta nazwa, liczba w liście, obiekt: „Szablon zadań w demo.json ma błąd.”. Kliknięcie daje komunikat o tej samej treści, projekt nie powstaje;
  - `null`, `[]` i brak pola: „Projekt bez zadań startowych.”. Kliknięcie przy `null` zakłada 003.1 bez zadań i przechodzi na kartę projektu: „Postęp 0 z 0”, „Brak zadań.”, na liście projektów „0 z 0”. Na SL-011 jest potem odnośnik „Projekt 003.1” zamiast przycisku.
- Drugi status wygranej („Zamówienie częściowe” z `rola: "wygrana"` dopisany do kopii `demo.json`):
  - SL-017 w tym statusie ma przycisk, kliknięcie zakłada 006.1 z trzema zadaniami;
  - SL-018 („Oferta”) nie ma przycisku, a zapis przez API dostaje 409: „Projekt zakłada się z szansy w statusie „Zamówienie” albo „Zamówienie częściowe”.”.
- Komunikaty odmowy obok poprawki:
  - przy jednym statusie wygranej komunikat jest taki sam jak przed poprawką, stary test `tests/api.test.mjs:268` dalej go sprawdza;
  - bez żadnego statusu z rolą „wygrana” komunikat brzmi „…w statusie „wygrana”.”, jak wcześniej;
  - kolejność sprawdzeń przy zakładaniu bez zmian.
- Tekst z plików: nazwa w szablonie ze znacznikiem `<img onerror>` jest w podpisie przy przycisku zwykłym tekstem. Nazwa statusu trafia do komunikatu odmowy, a ten idzie do dymka przez `textContent`.
- Kronika: opis poprawek zgadza się z kodem, liczba testów (46) też.

### Sprawa zgłoszona przez wykonawcę: `tests/dane.test.mjs:141`

Test spójności wymaga, żeby `szablon_zadan` w `data/demo.json` był listą. Serwer i ekran traktują brak pola jak pustą listę.

**Ocena:** to nie jest niespójność do naprawy, tylko dwie różne role.
- Kod czyta dane wyrozumiale: brak pola i `null` znaczą „bez zadań”. Dzięki temu ekran i serwer mówią to samo także przy niepełnym pliku.
- Test pilnuje, jak plik ma wyglądać: `szablon_zadan` zawsze jest listą. Pusta lista `[]` przechodzi test, więc „nowe projekty bez zadań” da się zapisać tak, że zgadzają się obie strony.
- Ten sam układ repo ma już przy aktywności zadania: serwer przyjmuje brak listy, a test wymaga listy (`tests/dane.test.mjs:182`).

**Co się stanie na pokazie:** użytkownik mówi agentowi „nowe projekty bez zadań startowych”, a agent usuwa pole.
- Aplikacja działa dobrze: przycisk obiecuje projekt bez zadań i serwer go zakłada.
- `node --test` jest czerwony z komunikatem „demo.json: szablon_zadan to lista nazw zadań”, więc agent poprawia dane (AGENTS.md, zasada 10).
- Ryzyko: ani ten komunikat, ani `AGENTS.md` nie mówią, że wystarczy `[]`. Agent może więc przywrócić trzy domyślne zadania wbrew prośbie użytkownika.

**Rekomendacja:** zostaw regułę w teście. Przy okazji, bez zmiany warunku testu, dopisz zdanie „Pusta lista `[]` to nowy projekt bez zadań. Pola nie usuwaj.” w `AGENTS.md` przy schemacie `demo.json` i w komunikacie testu. To nie blokuje merge.

Werdykt: Zatwierdzam
Uwagi: 0 krytycznych, 0 ważnych, 0 drobnych (nowych). D1 i D2 zamknięte, D3 otwarta z decyzji użytkownika.

## Poprawka z bramki: termin, runda 1 (2026-10-28)

Zakres: poprawka pola „Termin” po punkcie 2.1 bramki, jeszcze bez commita, w obu gałęziach.
- `feat/projekty-klienta`: `validDay` i `DAY_ERROR` w `server.mjs`, `saveField` oraz obsługa `change`, `keydown` i `focusout` w `public/app.js:652-685`, grupa testów „Poprawka z bramki” w `tests/api.test.mjs` i sekcja „Poprawka z bramki” w kronice. Poprawek D1 i D2 (sprawdzone w rundzie 2) tu nie oceniam.
- `main` (wersja przed projektami): cały `git diff`, czyli `server.mjs`, `public/app.js` i `tests/dane.test.mjs`.

Ocena: błąd z bramki jest usunięty w obu gałęziach. Termin wpisany z klawiatury zapisuje się raz, pole nie gubi fokusu w trakcie pisania, a niepełna data i rok spoza 2000-2099 nie trafiają do pliku. Serwer odrzuca taki dzień z czytelnym komunikatem. Poprawka przeniosła jednak zapis na chwilę wyjścia z pola. Ten zapis przerysowuje ekran w trakcie kliknięcia, które to wyjście wywołało, więc pierwsze kliknięcie po wpisaniu terminu przepada (W1). Do tego odświeżenie na żywo w trakcie pisania zapisuje niedokończony termin (D4).

### Co sprawdziłem

- `node --test` na kopiach: feat 47 z 47, main 7 z 7.
- **Main wobec feat:**
  - blok `saveField` i trzy obsługi zdarzeń są identyczne. Różni je tylko wywołanie zapisu: `patchDeal` na main, `patchRecord` na feat;
  - `validDay`, `DAY_ERROR` i komunikat przy odrzuceniu są identyczne;
  - linia `Object.hasOwn` na main jest znak w znak taka jak na feat;
  - poza terminem i tą linią na main nic się nie zmieniło.
- **Zakres lat wobec danych:**
  - w `data/` obu gałęzi (stan z commita i stan roboczy) wszystkie daty są z lat 2025-2026;
  - w testach jedyne lata spoza zakresu to celowo odrzucane przypadki (0020, 1999, 2100);
  - `AGENTS.md`, `CONTEXT.md` i decyzje używają tylko 2026;
  - `validDay` sprawdza tylko pole `data` zmieniane z ekranu. Rekord z dziwnym terminem w pliku dalej przyjmuje zmianę statusu albo osoby.
- **Ekran i serwer:**
  - zakres jest ten sam: na ekranie `/^20\d{2}-\d{2}-\d{2}$/`, na serwerze ta sama reguła plus sprawdzenie, czy taki dzień jest w kalendarzu;
  - komunikaty mówią to samo: „Nie zapisano terminu: wpisz pełną datę z lat 2000-2099.” i „Niepoprawny termin: podaj dzień z lat 2000-2099 w formacie RRRR-MM-DD, np. 2026-10-28.”.
- **Siła testów:** na kopii psułem po jednej rzeczy i uruchamiałem `node --test`.

| Co zepsułem | Wynik |
|---|---|
| feat: `validDay` bez zakresu lat (stary kod) | czerwony: test „Poprawka z bramki” |
| feat: zakres 2000-2999 albo 1900-2099 | czerwony: ten sam test |
| feat: zakres tylko dla zadań, szansa po staremu | czerwony: ten sam test |
| feat: ogólny komunikat zamiast `DAY_ERROR` | czerwony: ten sam test |
| feat: bez sprawdzenia dnia w kalendarzu | czerwony: test etapu 2 (2026-02-30) |
| feat: `checks[key]` zamiast `Object.hasOwn` | czerwony: test etapu 2 (`constructor`) |
| feat: ekran zapisuje przy każdej zmianie pola, jak przed poprawką | zielony |
| main: `validDay` bez zakresu, potem jeszcze `checks[key]` | zielony |
| main: szansa z terminem `0020-10-28` w `data/` | czerwony: „termin z lat 2000-2099” |

  Zielone wiersze to nie są uwagi, tylko stan rzeczy. Repo nie ma testów w przeglądarce (to byłaby nowa biblioteka), więc logikę ekranu sprawdziłem ręcznie, niżej. Na main nie ma testów API, więc tego samego kodu serwera pilnują testy feat.

- **Ekran:** Chrome z polskim formatem daty, osobne kopie danych obu gałęzi. Zapisy liczyłem po żądaniach zapisu do serwera, skutek sprawdzałem w plikach kopii.

| Scenariusz | feat | main |
|---|---|---|
| Termin cyfra po cyfrze: w trakcie zero zapisów, fokus zostaje w polu | działa | działa |
| Pierwszy Tab bez zapisu, drugi Tab: jeden zapis i jeden wpis w aktywności | działa | działa |
| Enter, potem kliknięcie obok: jeden zapis | działa | działa |
| Kliknięcie w puste miejsce (bramka 2.1 i B1): jeden zapis | działa | działa |
| Wybór z kalendarza: zapis od razu, wyjście z pola nie dubluje | działa | działa |
| „Wyczyść” w kalendarzu: `null` od razu | działa | działa |
| Wyczyszczenie z klawiatury (Backspace w każdej części daty): jeden zapis `null` przy wyjściu | działa | nie sprawdzałem |
| Niepełna data: bez zapisu, komunikat, pole wraca do zapisanego terminu | działa | działa |
| Rok 1999 i 2100 z klawiatury, strzałka w górę z 2099: bez zapisu, komunikat | działa | działa (1999) |
| Ta sama data co w pliku: bez zapisu | działa | nie sprawdzałem |
| Status, osoba, priorytet, opiekun: od razu, po jednym zapisie | działa | działa |
| „Przejmij” bez wcześniejszego wpisywania terminu | działa | nie sprawdzałem |
| „Na dziś”: termin w wierszu, kliknięcie obok | działa | działa |
| Termin, potem od razu kliknięcie w pole komentarza | działa | nie sprawdzałem |
| Termin, potem od razu kliknięcie w następne pole terminu, „Przejmij”, odnośnik albo menu | nie działa (W1) | nie działa (W1) |
| Agent zmienia plik w trakcie pisania terminu | nie działa (D4) | nie działa (D4) |

- **API na obu gałęziach:** `0020-10-28` dostaje 400 z komunikatem `DAY_ERROR`, `2026-10-28` przechodzi. Na main `constructor` dostaje 400.
- **Kronika:** opis zgadza się z kodem, z trzema zastrzeżeniami:
  - „wyczyszczenie pola zapisuje się od razu” dotyczy przycisku „Wyczyść” w kalendarzu. Wyczyszczenie z klawiatury zapisuje się przy wyjściu z pola. To dobre zachowanie, tylko zdanie jest za szerokie;
  - „niepełna data nie idzie do pliku” nie obejmuje przypadku z D4;
  - „w tym samym brzmieniu” w obu gałęziach: poza testem spójności danych (D5).

### [Ważne] W1: Pierwsze kliknięcie po wpisaniu terminu przepada

**Co zobaczysz:** wpisujesz termin z klawiatury i od razu klikasz coś innego. Termin się zapisuje, ale samo kliknięcie nie działa:

- po „Załóż projekt” wpisujesz termin pierwszego zadania i klikasz w termin drugiego. Kursor w drugim polu od razu znika, cyfry nie trafiają nigdzie, a drugi termin się nie zapisuje. Trzeba kliknąć jeszcze raz. To samo w „Na dziś” przy przejściu między wierszami;
- „Przejmij” nie przejmuje zadania ani szansy;
- odnośnik (np. okruszek „Projekty”) i menu z boku („Na dziś”) nie zmieniają ekranu;
- lista „Osoba” otwiera się i od razu zamyka.

Te same kliknięcia bez wcześniejszego wpisywania terminu działają (sprawdziłem). Pole komentarza działa, bo ekran oddaje mu fokus po przerysowaniu. Na obu gałęziach jest tak samo. Bramka tego nie złapała, bo w 2.1 i B1 klikało się w puste miejsce.

**Dlaczego:**
- zapis idzie przy `focusout`, czyli w chwili wciśnięcia przycisku myszy na następnej rzeczy;
- odpowiedź serwera wraca po kilku milisekundach, a `render()` od razu podmienia widok i menu. Człowiek puszcza przycisk po około 100 ms, więc wciśnięty przycisk, odnośnik albo pole już nie istnieje i przeglądarka nie zgłasza kliknięcia;
- `render()` oddaje fokus tylko elementom z `id`, a pola z `data-patch` go nie mają.

Przed poprawką tego przypadku nie było, bo zapis szedł w trakcie pisania (z gorszym skutkiem).

**Gdzie:**
- feat: `public/app.js:680-685` (zapis przy `focusout`), `public/app.js:572-574` (`render()` po zapisie), `public/app.js:528-534` (fokus wraca tylko po `id`), `public/app.js:126` (pola bez `id`);
- main: te same miejsca w `public/app.js:503`, `patchDeal` (`:403`), `render()` (`:376`) i `patchAttr` (`:112`).

**Kierunek poprawki:**
- zapis z `focusout` wywołany kliknięciem czeka, aż kliknięcie się skończy. Na przykład gdy przycisk myszy jest wciśnięty, zapis idzie po `pointerup` w `setTimeout(…, 0)`, czyli po obsłudze kliknięcia;
- pola z `data-patch` dostają stałe `id` (np. `pole-<kolekcja>-<numer>-<pole>`). Wtedy `render()` oddaje im fokus tak jak polu komentarza, a przejście do następnego terminu działa za pierwszym razem.

Lista otwarta w chwili zapisu może się dalej zamknąć. To drobiazg i może zostać. Do checklisty bramki warto dopisać: „termin pierwszego zadania, od razu klik w termin drugiego, oba zapisane” oraz „termin, od razu Przejmij”.

**Rekomendacja:** napraw

### [Drobne] D4: Zmiana pliku w trakcie pisania terminu zapisuje niedokończoną datę

**Co zobaczysz:**
- zadanie ma termin 28.10.2026, a Ty wpisujesz z klawiatury dzień „15”;
- po pierwszej cyfrze agent zmienia dowolny plik w `data/`: inne zadanie, inną szansę albo to samo zadanie;
- ekran się odświeża i pole traci fokus. Do pliku trafia termin 2026-10-01 z komunikatem „Zapisano.” i wpisem w aktywności. Druga cyfra już nigdzie nie trafia;
- przy pierwszej cyfrze miesiąca wychodzi np. 2026-01-28.

Sprawdziłem na obu gałęziach. Przy pierwszej cyfrze roku zapisu nie ma, bo działa filtr lat: pole wraca do starego terminu z komunikatem.

**Dlaczego:** Chrome zgłasza `focusout`, gdy przerysowanie usuwa pole z fokusem. Pole ma jeszcze znacznik `data-typing`, więc `saveField` zapisuje to, co akurat w nim jest.
**Gdzie:** feat `public/app.js:622-633` (odświeżenie na żywo) i `public/app.js:680-685`, main `public/app.js:447` i `:503`.

**Kierunek poprawki:**
- odświeżenie na żywo czeka z przerysowaniem, dopóki na ekranie jest pole z `data-typing`, i przerysowuje po wyjściu z pola;
- prostsza wersja: `render()` zdejmuje `data-typing` przed podmianą widoku. Wtedy wpisane cyfry przepadają, ale do pliku nic nie idzie.

**Dlaczego drobne:** potrzebny jest zbieg w czasie, czyli zmiana pliku w ciągu 2-3 sekund pisania. Na pokazie, gdzie agent i ekran pracują na tych samych plikach, to możliwe, ale rzadkie.
**Rekomendacja:** napraw razem z W1. To to samo miejsce w kodzie. Po przywróceniu fokusu z W1 echo własnego zapisu z dysku (około 120 ms po zapisie) może trafić w pisanie w następnym polu.

### [Drobne] D5: Test spójności danych pilnuje zakresu lat tylko na main

**Co zobaczysz:** w pliku zadania albo szansy zostaje termin `0020-10-28`, np. po próbie z bramki albo z ręki agenta. Na main `node --test` jest czerwony („termin z lat 2000-2099”). Na feat jest zielony, a ekran liczy zaległość od roku 0020. Kronika mówi, że poprawka jest w obu gałęziach w tym samym brzmieniu.
**Gdzie:** main `tests/dane.test.mjs:75`. Na feat tej asercji brakuje przy `tests/dane.test.mjs:79` (szanse) i `tests/dane.test.mjs:180` (zadania).
**Kierunek poprawki:** ta sama asercja na feat dla szans i zadań. Po scaleniu main do feat asercja dla szans dojdzie sama (sprawdziłem: bez konfliktu), dla zadań nie.
**Rekomendacja:** napraw przy okazji (dwie linie)

### Co zrobiono dobrze

- Znacznik „pisze z klawiatury” to prosty pomysł, który rozdziela pisanie od wyboru z kalendarza bez opóźnień i bez zgadywania, czy data jest skończona. Enter, Tab, kalendarz i wyczyszczenie działają bez podwójnych zapisów.
- Ekran i serwer mają ten sam zakres i ten sam sens komunikatu. Test serwera sprawdza też, że odrzucony termin nie dotyka pliku i że udany zapis zostawia dokładnie jeden wpis.

Werdykt: Do poprawy
Uwagi: 0 krytycznych, 1 ważna, 2 drobne. Na main obowiązują W1 i D4, D5 dotyczy feat.

## Poprawka z bramki: termin, runda 2 (2026-10-28)

Zakres: zmiany po rundzie 1 tej poprawki, jeszcze bez commita, w obu gałęziach. Sprawdzam tylko poprawki W1, D4 i D5 oraz miejsca, które z nimi współpracują.
- `feat/projekty-klienta`: `public/app.js` (`id` w `patchAttr` :126-127, `hold` i `busy()` :511-522, wstrzymanie w `render()` :531-536, `saveField` :673-686, wciśnięcie, puszczenie i `focusout` :702-725), `tests/dane.test.mjs:80` i `:182`.
- `main` (wersja przed projektami): `public/app.js` (:112-113, :359-370, :379-384, :496-509, :525-548), `tests/dane.test.mjs:75`.

Ocena: wykonawca zmienił kierunek z rundy 1 na prostszy. Zapis dalej idzie od razu przy wyjściu z pola, a ekran nie przerysowuje się, dopóki użytkownik czegoś używa. W1, D4 i D5 są zamknięte w scenariuszach z rundy 1, w obu gałęziach. Wstrzymanie nie utyka: kończy je puszczenie przycisku, przeciągnięcie, ruch myszy albo wyjście z pola. Jest jedna nowa drobna uwaga. Przywrócony fokus stawia kursor na dniu, więc zmiana samego miesiąca w następnym terminie zapisuje zły dzień (D6).

### Status uwag z rundy 1

| Uwaga | Status | Na czym to opieram |
|---|---|---|
| W1: pierwsze kliknięcie po wpisaniu terminu przepada | zamknięta | „Przejmij”, okruszek, menu z boku, termin następnego wiersza (karta projektu i „Na dziś”), komentarz i lista „Osoba” działają za pierwszym razem, w obu gałęziach. Przerysowanie przychodzi po puszczeniu przycisku |
| D4: zmiana pliku w trakcie pisania terminu zapisuje niedokończoną datę | zamknięta | agent zmienia ten sam rekord po pierwszej cyfrze dnia: zero zapisów, komunikat od razu, cyfry i kursor zostają. Po dokończeniu i Tab, Tab jest jeden zapis pełnej daty, a notatka agenta jest na ekranie |
| D5: test spójności danych pilnuje zakresu lat tylko na main | zamknięta | asercja dla szans jest znak w znak taka jak na main, dla zadań jest osobna. Termin `0020-10-28` w zadaniu i `1999-10-28` w szansie dają czerwony test, po przywróceniu pliku test jest zielony |

### Co sprawdziłem

- `node --test` na kopiach: feat 47 z 47, main 7 z 7.
- **Main wobec feat:**
  - `hold`, `busy()`, `render()`, `connect()`, `saveField` i obsługa zdarzeń są znak w znak takie same;
  - różnią się tylko `patchAttr` (na feat `data-col` i nazwa kolekcji w `id`) oraz wywołanie zapisu (`patchRecord` na feat, `patchDeal` na main);
  - próbne scalenie main do feat (`git merge-file` od wspólnego commita `0852a98`): `server.mjs` i `tests/dane.test.mjs` scalają się bez konfliktu i bez zmian w feat. `public/app.js` ma dwa konflikty, dokładnie w tych dwóch miejscach. Rozwiązanie: wersja z feat.
- **`id` pól:** na wszystkich ekranach obu gałęzi każde pole z `data-patch` ma `id` i żadne `id` się nie powtarza. Szansa i zadanie w „Na dziś” nie zderzą się, bo `id` zawiera nazwę kolekcji.
- **Ekran:** Chrome z polskim formatem daty, osobne kopie danych obu gałęzi. Kliknięcie odtworzone jak u człowieka: wciśnięcie, 100 ms, puszczenie. Zapisy liczyłem po żądaniach zapisu do serwera, skutek sprawdzałem w plikach kopii.

| Scenariusz | feat | main |
|---|---|---|
| Termin, od razu „Przejmij” | działa: termin i osoba zapisane, 2 zapisy, przycisk znika | działa |
| To samo stuknięciem gładzika (0 ms między wciśnięciem i puszczeniem) | działa | działa |
| Termin, od razu okruszek albo menu z boku | działa: zapis i przejście | działa |
| Termin, od razu pole komentarza, pisanie, wysłanie | działa: 2 zapisy, kursor w komentarzu | działa |
| Termin A, klik w dzień terminu B, od razu pisanie (echo zapisu A trafia w pisanie B) | działa: oba zapisane | działa |
| To samo w „Na dziś” (na feat szansa i zadanie obok siebie) | działa | działa |
| Termin, potem lista „Osoba” (sprawdzona lista rysowana przez stronę, natywnej listy systemu nie dało się otworzyć w przeglądarce testowej) | lista zostaje otwarta po zapisie i echu | działa |
| Termin A, klik w miesiąc terminu B, „11” | nie działa (D6): w pliku 2026-10-11 zamiast 2026-11-28 | nie działa (D6) |
| Termin A, klik w rok terminu B, „2027” | pole pokazuje 20.02.0007, przy wyjściu wraca do starego terminu z komunikatem | to samo |
| Kontrola: klik w miesiąc terminu B bez pisania w A, „11” | działa: 2026-11-28 | działa |
| Status z listy, „Przejmij” i komentarz bez wpisywania terminu | działa: po jednym zapisie, kursor wraca do listy statusu | działa |
| Wyszukiwarka: pisanie, w trakcie agent zmienia plik | działa: tekst, kursor i filtr zostają | działa |
| Menu, potem Wstecz | działa | działa |
| Termin w trakcie pisania, potem Wstecz | działa: bez zapisu | działa |

- **Czy wstrzymanie może utknąć.** W każdej sytuacji agent zmieniał plik w trakcie albo zaraz po interakcji. Obie gałęzie zachowują się tak samo.

| Sytuacja | Co się dzieje |
|---|---|
| Puszczenie przycisku poza oknem | przeglądarka zgłasza puszczenie, zmianę widać po ok. 150 ms |
| Przeciągnięcie odnośnika i upuszczenie poza oknem | Chrome przy starcie przeciągania zgłasza `pointercancel`, wstrzymanie się kończy |
| Prawy przycisk (menu kontekstowe, na gładziku stuknięcie dwoma palcami) | bez wstrzymania |
| Ctrl+klik (menu kontekstowe na Macu) albo inne zgubione puszczenie | widok czeka do pierwszego ruchu myszy nad stroną. Komunikat „Zmieniono: …” pojawia się od razu, po ruchu widok rysuje się w kilka ms |
| Lista zamknięta Escape | lista rysowana na stronie: widok od razu, bo fokus wraca z pozycji listy do listy. Natywnej listy systemu nie dało się otworzyć w przeglądarce testowej. Z kodu wynika to, co mówi kronika: widok nadrabia przy następnym kliknięciu, Tabie albo następnej zmianie pliku |
| Pisanie terminu, agent zmienia plik | widok czeka do wyjścia z pola (tak ma być po D4), komunikat od razu. Gdy pisanie trwa dłużej niż 2,6 s, zmieniony rekord pojawia się bez mignięcia |
| Okno traci fokus w trakcie pisania (Cmd+Tab) | wstrzymanie się kończy, odświeżanie w tle działa. Zapisuje się to, co akurat jest w polu (niżej, „Poza zakresem”) |
| Dotyk | wciśnięcie i puszczenie przychodzą normalnie, „Przejmij” działa. Na dotyku termin wybiera się z kalendarza, nie z klawiatury |

  Wniosek: wstrzymanie nie utyka na stałe. Najdłużej trwa zgubione puszczenie przycisku bez ruchu myszy. W testach wywołałem je tylko sztucznie: wciśnięcie bez puszczenia albo Ctrl+klik. Na pokazie to pomijalne. Mysz nad stroną prawie zawsze się rusza, a komunikat o zmianie i tak się pojawia.

- **Zmiany nie giną:** dane wczytują się przed `render()`, a wstrzymanie zatrzymuje tylko rysowanie. We wszystkich scenariuszach zmiana agenta pojawiła się po zakończeniu interakcji. Przy pisaniu dłuższym niż 2,6 s ginie tylko mignięcie zmienionego rekordu. Nie robię z tego uwagi.
- **Kronika:** opis zgadza się z kodem. Zdanie „kursor w polu terminu stoi na dniu, także gdy użytkownik kliknął w miesiąc” jest prawdziwe, ale pomija skutek z D6.

### [Drobne] D6: Zmiana samego miesiąca w następnym terminie zapisuje zły dzień

**Co zobaczysz:**
- na karcie projektu wpisujesz termin pierwszego zadania, np. 15.11.2026;
- od razu klikasz w miesiąc terminu drugiego zadania (28.10.2026) i wpisujesz „11”, żeby przesunąć je na listopad;
- cyfry trafiają w dzień. Pole pokazuje 11.10.2026, a po wyjściu z pola do pliku idzie 2026-10-11 z komunikatem „Zapisano.” i wpisem w aktywności;
- klik w rok i „2027” daje w polu 20.02.0007. Przy wyjściu pole wraca do starego terminu z komunikatem.

Ten sam klik w miesiąc bez wcześniejszego wpisywania terminu w innym polu działa poprawnie. Tak samo jest w „Na dziś” i na main.

**Dlaczego:** zapis terminu A przerysowuje ekran po puszczeniu przycisku, a echo zapisu z dysku robi to drugi raz. `render()` oddaje fokus nowemu polu B przez `focus()`, a Chrome stawia wtedy kursor na pierwszej części daty, czyli na dniu. Część, w którą kliknął użytkownik, przepada. Pełna data wpisywana od początku działa, bo i tak zaczyna się od dnia.
**Gdzie:** feat `public/app.js:516` (`busy()` patrzy tylko na znacznik pisania) i `public/app.js:548-553` (fokus po przerysowaniu); main `public/app.js:364` i `:396-401`.

**Kierunek poprawki:**
- pole terminu z kursorem wstrzymuje przerysowanie tak jak pisanie. W `busy()` zamiast `document.activeElement?.dataset?.typing` wystarczy `document.activeElement?.matches?.('input[type="date"][data-patch]')`;
- sprawdziłem to w przeglądarce bez zmiany plików (`app.js` podmieniony tylko w przeglądarce testowej). Klik w miesiąc daje 2026-11-28. Pełna data w następnym polu, „Przejmij” po terminie i wybór z kalendarza dalej działają, po jednym zapisie;
- koszt: odświeżenie na żywo czeka też wtedy, gdy kursor stoi w polu terminu bez pisania;
- do checklisty bramki: „termin pierwszego zadania, od razu klik w miesiąc drugiego i «11»: drugi termin w listopadzie”.

**Dlaczego drobne:** potrzebne są trzy rzeczy naraz: termin zmieniony z klawiatury, od razu klik w miesiąc albo rok innego terminu i zmiana tylko tej części. Zły termin widać w polu od razu.
**Rekomendacja:** napraw przed pokazem (jedna linia, ta sama w obu gałęziach).

### Poza zakresem: przełączenie okna w trakcie pisania terminu

Tego nie zepsuła ta poprawka, więc nie liczę tego jako uwagi. Zapisuję skutek, bo dotyczy tego samego pola.

- Zaczynasz wpisywać dzień „15” i po pierwszej cyfrze przechodzisz do terminala (Cmd+Tab). Chrome zgłasza wyjście z pola, więc do pliku idzie 2026-10-01 z komunikatem „Zapisano.”. Po powrocie Chrome zaczyna część od nowa i dokończenie „5112026” daje 05.11.2026.
- Gdy data jest już pełna, zapis przy przełączeniu okna jest pożądany.
- Tak było już po rundzie 1 (zapis przy wyjściu z pola). Przed poprawką z bramki zapis szedł przy każdej cyfrze.
- Jeśli warto: w `focusout`, gdy pole ma znacznik pisania, a `document.hasFocus()` zwraca fałsz, nic nie robić. Sprawdziłem to tak samo jak D6: przy przełączeniu okna nic się nie zapisuje, po powrocie kursor stoi w polu ze znacznikiem pisania, a zapis idzie przy wyjściu z pola.
- Decyzja należy do użytkownika.

### Co zrobiono dobrze

- Jedna reguła („nie przerysowuj, gdy użytkownik czegoś używa”) zamknęła naraz W1, D4 i zamykanie listy. Zapis nie czeka w kolejce, więc nie da się go zgubić.
- Asekuracja ruchem myszy działa. Jedyne utknięcie, jakie udało mi się wywołać, kończy się przy pierwszym ruchu.
- Kod ekranu jest w obu gałęziach znak w znak taki sam, a scalenie ma tylko dwa przewidywalne konflikty.

Werdykt: Zatwierdzam
Uwagi: 0 krytycznych, 0 ważnych, 1 drobna (nowa). W1, D4 i D5 zamknięte. D6 dotyczy obu gałęzi.

## Po przeglądzie poprawki z bramki

D6 i przełączenie okna w trakcie pisania terminu naprawiono po rundzie 2, w obu gałęziach, bez kolejnej rundy przeglądu. Obie poprawki sprawdziły scenariusze w przeglądarce. Opis: [kronika](../history/2026-10-28-projekty-klienta.md), sekcja „Poprawka z bramki”.

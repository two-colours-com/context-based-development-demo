# Context Based Development: podsumowanie wystąpienia

Dawid Kotrys · #ilovemkt Poznań, 28.10.2026 · ścieżka I ❤ PRO: Agenci AI

Ten plik zbiera najważniejsze myśli z wystąpienia i zastępuje obiecaną transkrypcję. Na scenie mówiłem trochę innymi słowami, ale treść jest ta sama. Możesz go przeczytać jak notatkę. Więcej z niego wyciągniesz, jeśli dasz go swojemu agentowi i pozwolisz się poprowadzić.

## Jak tego użyć

1. Skopiuj ten plik do katalogu swojego projektu i otwórz tam agenta (Claude Code, Codex albo inny). Możesz też pobrać całe repozytorium i otworzyć agenta w nim:
   ```bash
   git clone https://github.com/two-colours-com/context-based-development-demo.git
   ```
2. Napisz: **„Przeczytaj PODSUMOWANIE.md i poprowadź mnie.”**
3. Agent zacznie od pytań o Twoją firmę, Twoją rolę i jeden proces. Co ma robić dalej, opisuje sekcja [Instrukcja dla agenta](#instrukcja-dla-agenta).

Przykłady pochodzą z fikcyjnej Stolarni Dąb z Krakowa i jej klienta, Firmy Demo. Wszystkie dane są zmyślone.

## Najważniejsze koncepcje

Kolejność jak na wystąpieniu. Numery przydają się w rozmowie z agentem („wytłumacz mi jeszcze raz punkt 11”).

### 1. Kontekst jest aktywem

Kontekst budujemy przez pracę z AI: za każdym razem, gdy zapisujemy ustalenia, wyniki prób, decyzje i doświadczenia. Każda taka rozmowa może dołożyć kolejną sztabkę do tego, co już mamy. Wartość bierze się z tego, że do tej wiedzy wracamy przy następnej pracy. Dlatego zanim zacznę szukać mocniejszego modelu, sprawdzam, czy obecnemu dałem warunki do dobrej pracy. Czy zna nasz proces? Czy wie, co u nas znaczy „klient” albo „projekt”? Czy ma aktualne ustalenia? Modele się zmieniają, a zapisany kontekst zostaje.

**W praktyce:** gdy w rozmowie coś ustalisz, poproś agenta, żeby zapisał to do pliku. Ustalenie, które zostało tylko w czacie, przepada razem z czatem.

### 2. Kontekst jako biblioteka

Możemy mieć tysiące plików. Co z tego, jeśli agent nie wie, gdzie zajrzeć, który cennik jest aktualny i z czym go połączyć? Wolę porównanie do biblioteki: materiały mają swoje miejsce, oznaczenia i powiązania. Katalogiem na wejściu jest `AGENTS.md` (w Claude Code `CLAUDE.md`). Mówi, co gdzie leży i jakich zasad pilnować. My też łączymy nowe informacje z tym, co już wiemy, i jedno wspomnienie prowadzi do drugiego. Agent może chodzić podobnie: od klienta do projektu, od projektu do spotkania, a stamtąd do wyceny.

**W praktyce:** zamiast wrzucać agentowi folder z `oferta_final_v3` i `cennik_STARY`, daj mu jeden plik na start, który mówi, co gdzie jest i co jest aktualne.
**W repo:** [`AGENTS.md`](AGENTS.md). [`CLAUDE.md`](CLAUDE.md) tylko na niego wskazuje.

### 3. Precyzja zamiast „wszystkiego”

Lubię porównanie do celowania. Do bliskiego celu, na pięć metrów, wystarczy ogólne podejście. Kiedy cel jest daleko i liczy się precyzja, trzeba uwzględnić warunki, ograniczenia i dane. Agent wyposażony w kontekst dobrany do zadania zostawia mniej miejsca na zgadywanie. Wynik nadal sprawdzam, bo dobry kontekst nie czyni modelu nieomylnym.

**W praktyce:** zanim zlecisz zadanie, zapytaj siebie, jakie dane, warunki i ograniczenia agent musi znać, żeby nie zgadywać. Do prostego zadania nie potrzebuje całej firmy.

### 4. Trzy warstwy kontekstu

Pierwsza warstwa to pliki i materiały: oferty, notatki, cenniki, transkrypcje. Druga to skille i procedury, czyli instrukcje zapisane dla agenta, w tym `AGENTS.md` i `CLAUDE.md`, które czyta na starcie. Trzecia to integracje z aplikacjami, w których pracujemy. Warstwy się uzupełniają: agent musi wiedzieć, na czym pracuje, jak ma pracować i skąd dociągnąć brakujące informacje.

**W praktyce:** buduj w tej kolejności. Integracje dokładasz na końcu (punkt 13).

### 5. Najpierw wybieram projekt i folder

Moim środowiskiem jest komputer. Mam tu pliki, mogę je edytować i uruchamiać własne narzędzia, więc kontroluję miejsce, w którym pracuje agent. Zależy mi, żeby zostawały przy mnie wyniki pracy i zapis rozmów (czy agent zapisuje historię lokalnie, zależy od narzędzia i ustawień). Zanim otworzę nowy czat, pytam siebie: w jakim projekcie chcę teraz pracować? Strategia firmy, oferta, a może aplikacja? Dopiero potem uruchamiam agenta w odpowiednim folderze. Tym wyborem określam, z jakiego kontekstu ma korzystać i jaką rolę ma pełnić.

**W praktyce:** jedna rozmowa, jeden folder, jedna rola. Strategii i oferty nie mieszam w jednym czacie.

### 6. Każdy folder to inny kontekst i inna rola agenta

W naszej agencji mamy osobne przestrzenie: strategiczną, sprzedażową i pracy z klientami. Na pokazie przeniosłem ten układ do Stolarni Dąb: Strategia, Sprzedaż, Klienci. Każdy folder ma własny `AGENTS.md`. W Sprzedaży agent liczy wyceny i pisze oferty. W Strategii rozmawia ze mną o kierunku firmy i prowadzi dziennik. W Klientach pilnuje numerów i ustaleń z rozmów. Tak wyglądał `AGENTS.md` Sprzedaży:

```markdown
# Sprzedaż
Pomagasz mi sprzedawać meble na wymiar: odpowiadasz na zapytania, liczysz wyceny i piszesz oferty.

## Co tu jest
- Archiwum ofert: oferty, które już wysłaliśmy
- Materiały: cennik i notatki Marka o tym, jak wyceniamy

## Zasady
- Ceny bierz z cennika. Nie zgaduj stawek.
- Brakuje wymiaru albo materiału? Zapytaj mnie.
- Nic nie wysyłaj klientowi bez mojej zgody.
```

**W praktyce:** to ja przygotowuję agentowi miejsce i sposób pracy. Krótki `AGENTS.md` w folderze daje więcej niż długi prompt wklejany za każdym razem.

### 7. Dziennik po każdej rozmowie

Przy sprawach strategicznych i organizacyjnych prowadzę dziennik. Po rozmowie agent dopisuje wpis w trzech częściach: kontekst, decyzje, otwarte wątki. Kolejny agent, który siądzie do tematu, nie zaczyna od zera, bo czyta, co już ustaliliśmy i co zostało otwarte. Na pokazie Marek zapytał w dzienniku, czy montaż w weekend liczymy drożej. Ten wątek wrócił przy pierwszej wycenie i dopłata za sobotę trafiła do zasad wyceny.

**W praktyce:** dopisz do `AGENTS.md` folderu dwie zasady: „Zanim odpowiesz, przeczytaj ostatnie wpisy w dzienniku” i „Po rozmowie dopisz wpis: kontekst, decyzje, otwarte wątki”.
**W repo:** przy zmianach w aplikacji tę rolę pełni kronika w [`doc/history/`](doc/history/2026-10-13-start.md).

### 8. Wiedza z archiwum: analiza, plan, etapy, raporty

W Stolarni wiedza o wycenach siedziała w kilku starych PDF-ach i w głowie Marka. Nie kazałem agentowi od razu pisać oferty. Najpierw poprosiłem o analizę archiwum i ustalenie ze mną procesu obsługi klienta. Z tego powstał plan: proces, struktura folderu i etapy. Agent realizuje plan etapami, a po każdym etapie dostaję krótki raport: co powstało i gdzie zajrzeć. Klikam, czytam, poprawiam i dopiero wtedy zlecam kolejny etap. Każda reguła w bazie wiedzy ma źródło, np. starą ofertę albo notatki Marka.

**W praktyce:** polecenie z pokazu: „Przeanalizuj archiwalne oferty i materiały. Ustal ze mną proces obsługi klienta i zaproponuj plan generatora ofert.” Potem „Zrealizuj etap 1.” i sprawdzenie, zanim ruszy etap 2.

### 9. Skille i narzędzia

Skill to zapisany sposób pracy, który chcemy powtarzać. Skill karty wyceny mówi, z jakich materiałów skorzystać, czego nie dopowiadać, gdzie zapisać wynik i kiedy dopytać człowieka. Skill może korzystać z narzędzia. Wyobraź sobie pracownika, który dostaje kalkulator i instrukcję: agent dostaje skrypt liczący według naszych zasad i podaje mu tylko dane, zamiast odtwarzać sposób liczenia w każdej rozmowie. Na pokazie zapytanie od Anny z Firmy Demo przeszło całą drogę: mail, szansa SL-014, karta wyceny z brakami na żółto, moje odpowiedzi, przeliczona karta, oferta w HTML i wysyłka dopiero po mojej zgodzie. Człowiek dostarcza wiedzę i ocenia założenia, agent porządkuje i liczy.

**W praktyce:** skill to plik `SKILL.md` w `.agents/skills/<nazwa>/`: kiedy go użyć, kroki i sekcja „Nie rób”. Claude Code czyta kopię w `.claude/skills/`.
**W repo:** siedem skilli do rozwijania aplikacji, opisanych w [`.agents/skills/README.md`](.agents/skills/README.md).

### 10. Odnośniki i graf wiedzy

Kontekst to połączenia między plikami. Na wystąpieniu pokazałem je jako graf: każda kropka to dokument, każda linia to odnośnik. Agent nie czyta wszystkiego naraz. Zaczyna od `AGENTS.md` i idzie po liniach do tego, czego potrzebuje: zasady wyceny, karta szansy SL-014, jej dziennik, a stamtąd klient 002 i jego projekt. Po nitce do kłębka.

**W praktyce:** w każdej notatce linkuj to, z czego wynika, i to, do czego prowadzi. Plik bez odnośników agent znajdzie tylko przez szukanie po omacku.
**W repo:** `AGENTS.md` prowadzi do [`CONTEXT.md`](CONTEXT.md), decyzji i backlogu, a pliki w `data/` łączą się numerami: szansa [`SL-014`](data/szanse/SL-014.json) wskazuje organizację [`002`](data/organizacje/002.json).

### 11. Wspólne identyfikatory

Nazwę firmy każdy zapisze trochę inaczej, dlatego mamy numery. Firma Demo to klient 002, jej pierwszy projekt to 002.1, a szansa sprzedażowa to SL-014. Po numerze ludzie i agenci wiedzą, że mówimy o tej samej firmie i tym samym projekcie. Agent przy realizacji wraca do tego, co obiecaliśmy w ofercie, i nie musi zgadywać, czy dwa podobnie nazwane foldery to ta sama sprawa.

**W praktyce:** numer, który da się powiedzieć na głos, nadawany po kolei i nigdy niezmieniany. Folder „002. Firma Demo”, w nim projekt „002.1. Recepcja i aneks”.
**W repo:** [decyzja 0002](doc/decisions/0002-numeracja.md) z odrzuconymi wariantami (UUID, numer z rokiem, osobna numeracja osób prywatnych).

### 12. Współdzielenie: dysk czy repozytorium

Kiedy pracuję sam, pliki leżą na moim komputerze. W zespole są dwie drogi: dysk współdzielony (OneDrive, Google Drive) albo repozytorium na GitHubie. Dysk się synchronizuje, repozytorium kopiuję do siebie, więc obie drogi kończą się na moim komputerze. Agent szuka w plikach lokalnie i nie potrzebuje do tego integracji, a lokalny odczyt jest u mnie wielokrotnie szybszy niż odczyt przez MCP. Repozytorium wybieram do wydzielonych projektów z określonym zakresem, zwłaszcza gdy coś się buduje: kod, prototyp, strona, grafika w HTML, produkcja wideo. Dysk jest lepszy na wiedzę całej firmy, klientów i mniejsze, powiązane projekty na dokumentach, bo mogę ustawić, kto do czego ma dostęp. W repozytorium każda zaproszona osoba widzi wszystko.

**W praktyce:** dane klientów i sprawy całej firmy trzymaj na dysku z uprawnieniami, projekt z kodem w repozytorium.

### 13. Najpierw kontekst, potem MCP

MCP to sposób podłączania agenta do aplikacji, np. poczty. Mówię o nim celowo dopiero teraz, bo fundamentem jest kontekst oraz skille i procedury. Agent podłączony tylko do poczty ma wyłącznie to, co jest w wątku. Czy to wystarczy, żeby dobrze odpisać Ani? Raczej nie. Agent z kontekstem i pocztą dostaje polecenie „zapoznaj się ze wszystkim, co mamy, i odpisz”, a w kontekście są stan projektu, wcześniejsze ustalenia, dziennik szansy i transkrypcje ze spotkań.

**W praktyce:** nie zaczynaj od podłączania wszystkiego. Najpierw opisz proces w plikach, a integrację dodaj tam, gdzie agentowi brakuje świeżych danych.

### 14. Jedno źródło prawdy i własne narzędzie pod swój proces

Mamy pliki na komputerze, dysk, repozytorium, pocztę, kalendarz i zadania. Jak to połączyć? Moja definicja single source of truth: miejsce, które mówi ludziom i agentom, gdzie czego szukać. Nie trzeba przenosić wszystkiego w jedno miejsce. Umowa zostaje na dysku, ustalenia w poczcie, kod w repozytorium, a źródło prawdy wie, gdzie co leży i łączy to po numerach. U nas przez długi czas był to ClickUp. Z czasem nie wszystko dało się w nim ustawić pod nasz proces, więc zbudowaliśmy własne narzędzie, Brain. Bierze dane z ClickUpa i innych aplikacji, dokłada mierzenie czasu i ewidencję pracy, a numer klienta i projektu powstaje najpierw w nim. Dopasowaliśmy narzędzie do siebie, a nie siebie do narzędzia. Stąd tytuł wystąpienia: Context Based Development to budowanie rozwiązań dopasowanych do naszego kontekstu, procesu i stylu pracy.

**W praktyce:** zacznij od pytania, gdzie dziś leży wiedza o jednym kliencie. Jeśli wychodzi pięć miejsc, zacznij od mapy: co gdzie leży i po jakim numerze to połączyć.

### 15. Lokalny prototyp: HTML, JSON i mały serwer

Aplikacje dzielę na lokalne prototypy i aplikacje w chmurze. Lokalny prototyp łatwo uruchomić, szybko się na nim sprawdza pomysły, a agent pracuje na tych samych plikach, które widzę na ekranie. Ekrany są w HTML, bazą danych są pliki JSON, a mały serwer w Node.js łączy jedno z drugim. Przeglądarka sama nie zapisze pliku na dysku, więc serwer zapisuje zmiany z ekranu, a gdy agent zmieni plik, ekran od razu to pokazuje. JSON to zwykły plik tekstowy z danymi: nazwa, status, wartość, historia, a niektóre pola wskazują na inne pliki. Poza Node.js nic nie instalujesz.

**W praktyce:** w tym repo uruchom `node server.mjs` i napisz agentowi: „Dopisz do SL-014 notatkę, że Anna potwierdziła montaż 14 listopada.” Wpis pojawi się na ekranie w niecałą sekundę.
**W repo:** [`server.mjs`](server.mjs), [`public/`](public/index.html), [`data/`](data/demo.json) i [decyzja 0001](doc/decisions/0001-pliki-json-jako-baza.md), czyli dlaczego bazą są pliki JSON.

### 16. Co może zrobić produktowiec, a co oddać programiście

Za pierwszy prototyp może się wziąć każdy, kto ma kontakt z procesem. Produktowiec buduje lokalne MVP, przechodzi na nim własny proces, określa potrzeby i sprawdza, jak aplikacja działa w pracy z agentem. Programiście oddaję wersję produkcyjną: wdrożenie, logowanie użytkowników, bezpieczeństwo i nadzór. Do tego wszystko, co musi działać w chmurze: webhooki, integracje i automaty, które pracują także przy zamkniętym laptopie. Programista nie zaczyna od zera, bo dostaje działający prototyp, model danych w JSON, spisany proces i decyzje.

**W praktyce:** prototyp ma odpowiedzieć na pytanie „czy to nam pomaga?”. Działa lokalnie i bez logowania, więc nie wystawiaj go do internetu.

### 17. Code Manager: od potrzeby do akceptu

Aplikację rozwijam z Code Managerem, skillem, który sam nie pisze kodu. Prowadzi kolejne kroki: `/grill` (pytania z rekomendacją, zanim powstanie plan), `/plan-inicjatyw` (plan zmiany albo nowej inicjatywy, językiem produktu), wykonawca, który pisze kod, `/bramka`, przegląd kodu przez świeżego agenta (`/critical-code-review`), kronika (`/kronikarz`) i akcept. Zatrzymuje się w czterech miejscach, w których decyduje człowiek: zatwierdzenie planu, wynik bramki, decyzja przy każdej uwadze z przeglądu (napraw, na później, pomiń) i akcept przed merge. Podział ról jest prosty: ja opisuję potrzebę i decyduję, manager pilnuje planu i kolejności, wykonawca pisze kod, a sprawdza go ktoś inny. Każdą uwagę techniczną manager tłumaczy na skutek w aplikacji.

**W praktyce:** jedno zdanie „chcę projekty klienta” kryje kilka decyzji, których nikt nie wypowiedział. Czy numer projektu bierzemy od klienta? Co z zadaniem bez terminu? Grill wyciąga je na wierzch, zanim agent zacznie zgadywać.
**W repo:** [`.agents/skills/code-manager/SKILL.md`](.agents/skills/code-manager/SKILL.md). Przy długiej rozmowie pomaga `/handoff`: zapisuje stan przed wyczyszczeniem czatu.

### 18. Kontekst przyrasta

Po każdej zmianie coś zostaje: nowe pojęcia w słowniku, decyzja z odrzuconymi wariantami, kronika. W tym repo decyzja 0004 mówi, dlaczego zadania są w osobnych plikach, a kronika zapisuje, co odrzuciliśmy przy numerze projektu i dlaczego. Za pół roku kolejny agent odtworzy, czemu zrobiliśmy to tak, a nie inaczej, i nie będzie „naprawiał” czegoś, co było celowe. Dokumenty powstają razem z pracą, nie jako pusta encyklopedia na start.

**W praktyce:** decyzję zapisuj wtedy, gdy była realna alternatywa, trudno ją cofnąć i ktoś za pół roku zapyta „czemu tak?”. Resztę wystarczy wpisać w plan.
**W repo:** [`doc/decisions/`](doc/decisions/0001-pliki-json-jako-baza.md) i [`CONTEXT.md`](CONTEXT.md). Decyzja 0004 i kronika zmiany są na gałęzi `feat/projekty-klienta` (odnośniki na końcu pliku).

### 19. Człowiek odbiera produkt

Zgłoszenie „gotowe” od agenta to dopiero początek sprawdzania. Bramka ma dwie części: testy automatyczne i checklistę scenariuszy, które człowiek przeklikuje w aplikacji i ocenia. W prawdziwej pracy nad tym repo bramka złapała błąd, którego nie zauważył ani agent, ani przegląd kodu: termin wpisywany z klawiatury zapisywał się przy każdej cyfrze roku, a w pliku zostawał rok 0020. Testy były zielone. Błąd siedział też w wersji wyjściowej, więc poprawka trafiła do obu gałęzi. Dlatego produkt odbieram ja.

**W praktyce:** każdy plan kończ scenariuszami „co klikasz → co widzisz”, które odróżniają sukces od porażki. „Działa poprawnie” nic nie mówi.
**W repo:** [bramka](https://github.com/two-colours-com/context-based-development-demo/blob/feat/projekty-klienta/doc/bramki/2026-10-28-projekty-klienta.md) (punkt 2.1) i [kronika](https://github.com/two-colours-com/context-based-development-demo/blob/feat/projekty-klienta/doc/history/2026-10-28-projekty-klienta.md) (sekcja „Poprawka z bramki”) na gałęzi `feat/projekty-klienta`.

### 20. Modele i narzędzia można zmieniać, kontekst zostaje

Duża część tego, co pokazałem, zostaje z nami przy zmianie narzędzia. Pliki, opis procesu, decyzje i dane nie znikają razem z jedną subskrypcją. Skille i integracje czasem trzeba dopasować, ale wiedza zostaje. Claude Code i Codex uruchamiam w Voicie, aplikacji, którą rozwijamy, bo mam tam łatwy wgląd w swoje pliki. To moje środowisko, nie warunek: tych samych agentów uruchomisz w zwykłym terminalu, w IDE albo w aplikacji producenta. Z Claude Code korzystam, kiedy buduję i rozwijam projekt, a po Codex sięgam, kiedy agent ma klikać w aplikacjach, kiedy pracuję z telefonu albo chcę sterować głosem. To mój wybór pod zadanie, nie ranking.

**W praktyce:** trzymaj kontekst w zwykłych plikach w swoim folderze. Przeczyta je każdy agent, którego tam uruchomisz.
**W repo:** jeden zestaw zasad i skilli dla obu narzędzi. Codex czyta `AGENTS.md` i `.agents/skills/`, Claude Code czyta `CLAUDE.md` (wskazuje na `AGENTS.md`) i kopię skilli w `.claude/skills/`.

## Instrukcja dla agenta

Jeśli jesteś agentem, a użytkownik dał Ci ten plik, poprowadź go od wystąpienia do pierwszego efektu w jego firmie. Nie rób wykładu z koncepcji. Prowadź rozmowę, a po każdym kroku zostaw plik.

### Najpierw rozpoznaj sytuację

1. Sprawdź, gdzie jesteś. Jeśli w katalogu są `server.mjs` i `doc/plans/projekty-klienta/plan.md`, pracujesz w repozytorium demo. Jeśli nie, to katalog użytkownika: niczego w nim nie zmieniaj ani nie przenoś bez pytania.
2. Zanim cokolwiek zaproponujesz, zadaj po kolei, jedno pytanie na raz:
   - czym zajmuje się firma i ile osób w niej pracuje,
   - jaką rolę ma użytkownik (właściciel, sprzedaż, prowadzenie projektów, produkt, marketing, coś innego),
   - jaki jeden konkretny proces chce usprawnić jako pierwszy (np. odpowiedź na zapytanie, przygotowanie oferty, start projektu, raport dla klienta),
   - gdzie dziś leżą materiały do tego procesu i z jakiego agenta korzysta.
3. Przy każdym pytaniu powiedz krótko, po co pytasz. Jeśli możesz, dodaj swoją rekomendację, żeby użytkownik mógł odpowiedzieć „tak”.

### Jak prowadzisz

- **Małe kroki.** Jeden krok, efekt w pliku, pytanie o akcept. Dopiero potem następny krok.
- **Ustalenia od razu w plikach.** Zapytaj, gdzie je trzymać. Jeśli użytkownik nie ma zdania, zaproponuj folder `Dziennik/` w katalogu, w którym pracujecie, i wpis z każdej rozmowy: kontekst, decyzje, otwarte wątki (punkt 7).
- **Nie zgaduj.** Brakuje informacji o firmie, procesie albo danych? Zapytaj. Każde założenie zamień w pytanie z rekomendacją.
- **Język użytkownika.** Gdy słowo znaczy u niego coś innego niż w tym pliku, ustalcie jedno znaczenie i zapiszcie je w słowniku (np. `CONTEXT.md`).
- **Bezpiecznie z danymi.** Nie przenoś prawdziwych danych klientów do publicznych repozytoriów. Niczego nie wysyłaj na zewnątrz bez zgody.
- **Bez obietnic.** Nie zapowiadaj efektów, których nie da się sprawdzić. Po każdym ćwiczeniu pokaż, jak sprawdzić wynik.
- Gdy użytkownik pyta o koncepcję, odwołuj się do jej numeru z tego pliku i do przykładu ze Stolarni Dąb, a potem przełóż go na jego firmę.

### Ćwiczenia do zaproponowania

Po rozpoznaniu sytuacji zaproponuj 2-3 ćwiczenia pasujące do procesu użytkownika, z czasem trwania, i zapytaj, od którego zaczynacie. Kolejność w tabeli to domyślna ścieżka. Czasy są orientacyjne.

| # | Ćwiczenie | Czas | Co powstaje | Punkty |
|---|---|---|---|---|
| 1 | Struktura folderów firmy: 2-4 przestrzenie (np. strategia, sprzedaż, klienci) i co do nich trafia | 20 min | szkic struktury, bez przenoszenia plików | 5, 6, 12 |
| 2 | Pierwszy `AGENTS.md` dla folderu wybranego procesu: co tu leży, jak szukać, 3-5 zasad | 15 min | `AGENTS.md`, a dla Claude Code `CLAUDE.md` z jedną linią `@AGENTS.md` | 2, 6 |
| 3 | Dziennik: zasada w `AGENTS.md` i pierwszy wpis z tej rozmowy | 10 min | `Dziennik/RRRR-MM-DD.md` | 7 |
| 4 | Wiedza z archiwum: analiza kilku starych dokumentów, plan z etapami, pierwszy etap | 45-60 min | plan, baza reguł ze źródłami | 8 |
| 5 | Jeden proces jako skill, a gdy trzeba liczyć, z małym narzędziem | 30-45 min | `.agents/skills/<nazwa>/SKILL.md` | 9 |
| 6 | Numeracja klientów i projektów | 20 min | zasada numeracji w `AGENTS.md`, lista klientów z numerami | 11, 14 |
| 7 | W tym repo: wdrożenie planu `projekty-klienta` przez `/code-manager` | 1-2 h z bramką | gałąź `feat/projekty-klienta`, kronika, bramka | 15-19 |
| 8 | W tym repo albo własnym prototypie: własna potrzeba zaczęta od `/grill` | 30 min do planu | słownik, plan zmiany | 17, 18 |

**Ćwiczenie 7.** Potrzebny jest Node.js 20 lub nowszy, nic więcej. Użytkownik uruchamia `/code-manager` i pisze, że wdrażacie plan `projekty-klienta` z [`doc/plans/projekty-klienta/plan.md`](doc/plans/projekty-klienta/plan.md). Manager prowadzi wykonawcę, bramkę, przegląd i kronikę i zatrzymuje się na czterech STOP-ach. Narzędzie bez subagentów poprosi o nowe okno w tym samym folderze. Wynik da się porównać z rozwiązaniem wzorcowym na `origin/feat/projekty-klienta`.

**Ćwiczenie 8.** Na przykład: „/grill Chcę, żeby oferta bez odpowiedzi od tygodnia sama wracała do Na dziś” (pomysł z [`doc/backlog.md`](doc/backlog.md)). Grill pyta po jednym pytaniu z rekomendacją i dopisuje pojęcia do `CONTEXT.md`. Potem `/plan-inicjatyw` i dalej jak w ćwiczeniu 7. Jak przenieść skille do innego projektu, opisuje [`.agents/skills/README.md`](.agents/skills/README.md).

### Jak sprawdzić efekt

Na końcu każdego ćwiczenia zróbcie bramkę: człowiek klika i ocenia, agent nie odbiera pracy sam.

- **Kontekst (ćwiczenia 1-6).** Nowa rozmowa w tym folderze i pytanie, na które odpowiedź jest w plikach, np. „Jak liczymy montaż w sobotę?” albo „Co ostatnio ustaliliśmy z klientem 002?”. Agent bez podpowiedzi ma trafić do właściwego pliku i powiedzieć, skąd wie. Jeśli zgaduje, poprawcie `AGENTS.md` albo odnośniki.
- **Skill (ćwiczenie 5).** Świeży, prawdziwy przypadek. Wynik porównajcie z tym, co zrobiłby doświadczony pracownik.
- **Aplikacja (ćwiczenia 7-8).** Checklista w `doc/bramki/`: użytkownik przeklikuje scenariusze i wpisuje „działa” albo „nie działa” z opisem. Zielone testy nie zastępują bramki (punkt 19).

Wynik i listę poprawek zapisz w dzienniku.

## Co jest w tym repozytorium

Repozytorium: [github.com/two-colours-com/context-based-development-demo](https://github.com/two-colours-com/context-based-development-demo). Uruchomienie opisuje [`README.md`](README.md).

| Gałąź | Co na niej jest |
|---|---|
| `main` | punkt startowy z pokazu: Brain Stolarni Dąb bez projektów i zatwierdzony plan „Projekty klienta z zadaniami” |
| `feat/projekty-klienta` | rozwiązanie wzorcowe: kod, decyzja 0004, kronika, bramka i raport przeglądu kodu |

Na `main`:

| Plik albo folder | Po co |
|---|---|
| [`AGENTS.md`](AGENTS.md), [`CLAUDE.md`](CLAUDE.md) | zasady dla agenta i schematy plików |
| [`CONTEXT.md`](CONTEXT.md) | słownik pojęć |
| [`server.mjs`](server.mjs), [`public/`](public/index.html) | serwer i ekrany |
| [`data/`](data/demo.json) | baza: jeden plik JSON to jeden rekord |
| [`tests/`](tests/dane.test.mjs) | testy spójności danych (`node --test`) |
| [`doc/decisions/`](doc/decisions/0001-pliki-json-jako-baza.md) | decyzje 0001-0003 z odrzuconymi wariantami |
| [`doc/history/`](doc/history/2026-10-13-start.md) | kronika budowy |
| [`doc/plans/projekty-klienta/plan.md`](doc/plans/projekty-klienta/plan.md) | zatwierdzony plan do wdrożenia |
| [`doc/backlog.md`](doc/backlog.md) | pomysły na kolejne zmiany |
| [`.agents/skills/`](.agents/skills/README.md) | skille Code Managera, kopia dla Claude Code w `.claude/skills/` |

Na `feat/projekty-klienta`:

- [kronika zmiany](https://github.com/two-colours-com/context-based-development-demo/blob/feat/projekty-klienta/doc/history/2026-10-28-projekty-klienta.md): decyzje, odrzucone warianty, poprawka z bramki,
- [bramka](https://github.com/two-colours-com/context-based-development-demo/blob/feat/projekty-klienta/doc/bramki/2026-10-28-projekty-klienta.md): checklista z wynikami,
- [przegląd kodu](https://github.com/two-colours-com/context-based-development-demo/blob/feat/projekty-klienta/doc/code-reviews/2026-10-28-projekty-klienta.md): uwagi ze skutkiem w aplikacji i decyzje,
- [decyzja 0004](https://github.com/two-colours-com/context-based-development-demo/blob/feat/projekty-klienta/doc/decisions/0004-zadania-w-osobnych-plikach.md): zadania w osobnych plikach.

Agent przeczyta je bez przełączania gałęzi, np. `git show origin/feat/projekty-klienta:doc/history/2026-10-28-projekty-klienta.md`.

Folderów Stolarni z pierwszej części wystąpienia (Strategia, Sprzedaż, Klienci, skill karty wyceny, kalkulator) w repozytorium nie ma. Opisałem je wyżej, żebyś mógł zbudować podobne u siebie. Część o Brainie odtwarza prawdziwą pracę agentów na tym repozytorium, a jej ślad jest na gałęzi `feat/projekty-klienta`.

---

Wystąpienie i repozytorium: Dawid Kotrys, Two Colours · [two-colours.com/kontakt](https://two-colours.com/kontakt/)

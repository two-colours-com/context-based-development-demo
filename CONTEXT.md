# Słownik domeny

Pojęcia, których używają aplikacja, agent i ludzie w Stolarni Dąb. Gdy w rozmowie pada słowo z tej listy, chodzi o to znaczenie.

**Organizacja** (klient)
Ktoś, kto kupił u nas meble albo o nie pytał: firma (np. Kawiarnia Ziarno) albo osoba prywatna. Pole `typ` mówi, które z nich. Jeden plik w `data/organizacje/`. Firmy i osoby prywatne mają wspólną numerację: 001, 002, 003.

**Osoba kontaktowa**
Człowiek, z którym rozmawiamy w imieniu organizacji: imię i nazwisko, stanowisko, e-mail, telefon. Jedna na organizację, zapisana w jej pliku. U osoby prywatnej to ta sama osoba.

**Szansa sprzedażowa** (szansa)
Jedna sprawa do sprzedania: konkretne meble dla konkretnego klienta, np. SL-014 „Recepcja i aneks kuchenny” dla Firmy Demo. Klient może mieć kilka szans: Kawiarnia Ziarno zamówiła ladę w lipcu, a teraz pyta o regały.

**Status**
Etap szansy. W grze: zapytanie, pomiar, projekt, oferta, negocjacje. Zamknięte: zamówienie (wygrana) albo przegrana. Lista z kolorami leży w `data/demo.json`. Etap można pominąć: SL-014 przeszła od zapytania od razu do oferty, bo klientka przysłała rzut biura.

**Opiekun**
Osoba ze stolarni, która prowadzi szansę (pole `uzytkownik`). Szansa bez opiekuna trafia do „Nieprzypisane” i może ją przejąć każdy.

**Termin** (następny krok)
Dzień, w którym trzeba coś zrobić w sprawie (pole `data`). W tym dniu szansa wraca do „Na dziś”. Termin w przeszłości oznacza sprawę zaległą: „2 dni po terminie”.

**Aktywność**
Oś czasu szansy: telefony, spotkania, maile, notatki i zmiany pól. Wpisy ludzi, agenta (z plakietką „przez agenta”) i systemu (zmiany statusu z historii). Najstarsze u góry.

**Historia**
Lista zmian statusu z datą i godziną. Z niej wiadomo, od kiedy szansa jest w obecnym etapie.

**Wartość**
Kwota oferty w złotych netto, liczba całkowita.

**Dziś**
Dzień pokazu, 28 października 2026, zapisany w `data/demo.json`. Od niego liczą się zaległości.

**Numeracja**
Numery nadajemy po kolei i nigdy ich nie zmieniamy. Organizacja: trzy cyfry (002). Szansa: SL i trzy cyfry (SL-014). Numer organizacji posłuży też jako numer klienta, gdy dojdą projekty: 002.1 to pierwszy projekt Firmy Demo.

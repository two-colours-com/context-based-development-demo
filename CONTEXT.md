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
Osoba ze stolarni, która prowadzi szansę albo projekt (pole `uzytkownik`). Szansa bez opiekuna trafia do „Nieprzypisane” i może ją przejąć każdy.

**Projekt** (projekt klienta)
Realizacja wygranej szansy: to, co robimy dla klienta po zamówieniu, np. 002.1 „Recepcja i aneks kuchenny” dla Firmy Demo. Powstaje przyciskiem „Załóż projekt” na szansie w statusie „Zamówienie”, z nazwą i opiekunem szansy. Jedna szansa ma najwyżej jeden projekt. Status: w toku albo zakończony. Jeden plik w `data/projekty/`.

**Numer projektu**
Numer klienta, kropka i kolejna liczba projektów tego klienta: 002.1, 002.2 … 002.10. Z numeru od razu widać klienta.

**Zadanie**
Jedna rzecz do zrobienia w projekcie, np. 002.1-01 „Pomiar końcowy”. Ma status (do zrobienia, w toku, zrobione), osobę, termin i własną aktywność, tak jak szansa. Numer: numer projektu, myślnik, dwie cyfry. Jeden plik w `data/zadania/`.

**Szablon zadań**
Zadania, które dostaje każdy nowy projekt: Pomiar końcowy, Produkcja, Montaż (pole `szablon_zadan` w `data/demo.json`). Bez terminów, osoba = opiekun szansy.

**Postęp**
„1 z 3” przy projekcie: ile zadań projektu jest zrobionych ze wszystkich jego zadań.

**Osoba** (w zadaniu)
Kto robi zadanie (pole `uzytkownik`). Zadanie bez osoby, ale z terminem, trafia do „Nieprzypisane”.

**Termin** (następny krok)
Dzień, w którym trzeba coś zrobić w sprawie (pole `data`). W tym dniu szansa albo zadanie wraca do „Na dziś”. Termin w przeszłości oznacza sprawę zaległą: „2 dni po terminie”. Zadanie bez terminu nie trafia do „Na dziś”, zrobione też nie.

**Aktywność**
Oś czasu szansy albo zadania: telefony, spotkania, maile, notatki i zmiany pól. Wpisy ludzi, agenta (z plakietką „przez agenta”) i systemu (zmiany statusu szansy z historii). Najstarsze u góry.

**Historia**
Lista zmian statusu z datą i godziną. Z niej wiadomo, od kiedy szansa jest w obecnym etapie.

**Wartość**
Kwota oferty w złotych netto, liczba całkowita.

**Dziś**
Dzień pokazu, 28 października 2026, zapisany w `data/demo.json`. Od niego liczą się zaległości.

**Numeracja**
Numery nadajemy po kolei i nigdy ich nie zmieniamy ani nie używamy drugi raz. Organizacja: trzy cyfry (002). Szansa: SL i trzy cyfry (SL-014). Numer organizacji to numer klienta: 002.1 to pierwszy projekt Firmy Demo, 002.1-01 pierwsze zadanie tego projektu.

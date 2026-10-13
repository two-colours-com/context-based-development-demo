# Brain: Stolarnia Dąb

Prototyp aplikacji sprzedażowej dla fikcyjnej stolarni z Krakowa. Powstał na wystąpienie „Context Based Development” na #ilovemkt 2026 w Poznaniu.

Bazą są zwykłe pliki JSON w katalogu `data/`. Ekran w przeglądarce i agent AI (Claude Code, Codex) pracują na tych samych plikach. Agent zmienia plik, a ekran pokazuje zmianę w niecałą sekundę: rekord miga i pojawia się krótki komunikat.

## Punkt startowy i rozwiązanie wzorcowe

Gałąź `main` to punkt startowy z pokazu: prosty Brain na plikach JSON i zatwierdzony plan kolejnej zmiany „Projekty klienta z zadaniami” w [`doc/plans/projekty-klienta/plan.md`](doc/plans/projekty-klienta/plan.md).

Plan możesz wdrożyć z agentem: otwórz katalog w Claude Code albo Codex, uruchom skill `/code-manager` i napisz, że wdrażacie plan `projekty-klienta`. Manager prowadzi zmianę od planu do merge i zatrzymuje się w czterech miejscach, w których decydujesz Ty. Opis skilli: [`.agents/skills/README.md`](.agents/skills/README.md). Możesz też rozwijać Brain po swojemu.

Gotowe rozwiązanie wzorcowe, do porównania z Twoim, jest na gałęzi `feat/projekty-klienta`: kod, kronika decyzji, wynik bramki (testy i checklista do klikania) i raport przeglądu kodu. Code-manager nazwie Twoją gałąź tak samo, więc wzorzec znajdziesz wtedy pod `origin/feat/projekty-klienta`.

## Co jest w środku

- **Na dziś**: moje sprawy z terminem na dziś i zaległe, przyszłe i nieprzypisane. Status, priorytet, termin i opiekuna zmieniasz w wierszu.
- **Szanse**: lista z wyszukiwarką i widok szansy z osią aktywności i polem na komentarz.
- **Projekty**: projekty klienta (002.1) z zadaniami. Projekt zakładasz z wygranej szansy, zadania z terminem wracają do „Na dziś”.
- **Organizacje**: klienci (firmy i osoby prywatne) z osobą kontaktową i szansami.
- **Dashboard**: karty liczone z szans. Układ kart leży w `data/dashboard.json`.

„Dziś” w aplikacji to zawsze 28 października 2026, dzień pokazu (pole `dzis` w `data/demo.json`).

## Uruchomienie

Potrzebny jest Node.js 20 lub nowszy. Nic nie instalujesz.

```bash
node server.mjs
```

Aplikacja otworzy się pod adresem http://127.0.0.1:4400. Inny port: `PORT=4401 node server.mjs`. Bez otwierania przeglądarki: `NO_OPEN=1 node server.mjs`.

Testy danych (warto po każdej zmianie w `data/`):

```bash
npm test        # to samo co: node --test
```

## Jak pracować z agentem

Otwórz ten katalog w Claude Code albo Codex i mów jak do współpracownika:

- „Dopisz do SL-014 notatkę, że Anna potwierdziła montaż 14 listopada.”
- „Przenieś SL-017 do zamówień, Michał podpisał.”
- „Dodaj na dashboard kartę z wartością szans Marka.”

Agent zaczyna od `AGENTS.md`. Tam są zasady i schematy plików.

## Powrót do stanu wyjściowego

Zmiany z pokazu zostają w plikach. Powrót do danych z ostatniego commita:

```bash
git checkout data/
```

Pliki dodane w trakcie (np. nowa szansa) pokaże `git clean -n data/`, a usunie `git clean -f data/`.

## Struktura

```
server.mjs          serwer (127.0.0.1:4400): odczyt bazy, zapis zmian szansy i zadania, zakładanie projektu, zmiany na żywo
lib/                reguły bez ekranu, np. numeracja projektów i zadań
public/             ekran: index.html, app.js, app.css, reguly.js (Na dziś, postęp projektu)
data/               baza: jeden plik JSON = jeden rekord
  demo.json           firma, dzień pokazu, bieżący użytkownik, statusy szans, projektów i zadań, szablon zadań
  uzytkownicy.json    zespół stolarni
  dashboard.json      karty dashboardu
  organizacje/        klienci: 001.json, 002.json ...
  szanse/             szanse sprzedażowe: SL-011.json ...
  projekty/           projekty klienta: 001.1.json ...
  zadania/            zadania projektów: 001.1-01.json ...
tests/              testy spójności danych, reguł i API (node --test)
doc/
  decisions/          decyzje (ADR)
  history/            kronika budowy
  plans/              plany kolejnych zmian
  backlog.md          pomysły na rozbudowę
AGENTS.md           zasady dla agenta (CLAUDE.md wskazuje na ten plik)
CONTEXT.md          słownik pojęć
```

## Wersja produkcyjna

Ten prototyp działa lokalnie, na plikach i bez logowania. Wersję z kontami użytkowników, bazą w chmurze i integracjami (poczta, kalendarz, księgowość) robi Two Colours.

**Two Colours** · [two-colours.com/kontakt](https://two-colours.com/kontakt/) · hello@two-colours.com · +48 693 339 510

Projekt powstał na #ilovemkt 2026.

---

Wszystkie dane są fikcyjne: firma, osoby, adresy e-mail (domena example.pl), telefony (prefiks +48 000) i kwoty.

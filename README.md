# Brain: Stolarnia Dąb

Prototyp aplikacji sprzedażowej dla fikcyjnej stolarni z Krakowa. Powstał na wystąpienie „Context Based Development” na #ilovemkt 2026 w Poznaniu.

Bazą są zwykłe pliki JSON w katalogu `data/`. Ekran w przeglądarce i agent AI (Claude Code, Codex) pracują na tych samych plikach. Agent zmienia plik, a ekran pokazuje zmianę w niecałą sekundę: rekord miga i pojawia się krótki komunikat.

## Co jest w środku

- **Na dziś**: moje sprawy z terminem na dziś i zaległe, przyszłe i nieprzypisane. Status, priorytet, termin i opiekuna zmieniasz w wierszu.
- **Szanse**: lista z wyszukiwarką i widok szansy z osią aktywności i polem na komentarz.
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
server.mjs          serwer (127.0.0.1:4400): odczyt bazy, zapis zmian szansy, zmiany na żywo
public/             ekran: index.html, app.js, app.css
data/               baza: jeden plik JSON = jeden rekord
  demo.json           firma, dzień pokazu, bieżący użytkownik, statusy szans
  uzytkownicy.json    zespół stolarni
  dashboard.json      karty dashboardu
  organizacje/        klienci: 001.json, 002.json ...
  szanse/             szanse sprzedażowe: SL-011.json ...
tests/              testy spójności danych (node --test)
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

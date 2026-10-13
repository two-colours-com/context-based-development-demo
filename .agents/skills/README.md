# Skille: od pomysłu do zmiany w aplikacji

Siedem skilli prowadzi zmianę w aplikacji Brain od pomysłu do merge. Ty opisujesz potrzebę i podejmujesz decyzje. Agenci piszą kod, sprawdzają go i zapisują, co ustaliliście.

## Skille

| Skill | Co robi | Co powstaje |
|---|---|---|
| `/grill` | dopytuje o zmianę, po jednym pytaniu z rekomendacją | `CONTEXT.md`, `doc/decisions/NNNN-*.md` |
| `/plan-inicjatyw` | pisze plan zmiany w aplikacji albo nowej inicjatywy, językiem produktu | `doc/plans/<slug>/plan.md`, wpis w `doc/backlog.md` |
| `/code-manager` | prowadzi cały cykl, sam nie pisze kodu | gałąź `feat/<slug>`, briefy, commit i merge |
| `/bramka` | testy automatyczne i checklista do klikania | `doc/bramki/YYYY-MM-DD-<slug>.md` |
| `/critical-code-review` | przegląd kodu przez świeżego agenta | `doc/code-reviews/YYYY-MM-DD-<slug>.md` |
| `/kronikarz` | zapis decyzji i porządek w backlogu | `doc/history/YYYY-MM-DD-<slug>.md` |
| `/handoff` | zapis i wczytanie sesji przy `/clear` | `doc/session/session.md` (poza gitem) |

## Jak działają razem

```
pomysł
  → /grill                  pytania, odpowiedzi, słownik
  → /plan-inicjatyw         plan zmiany albo inicjatywy
  → STOP 1                  zatwierdzasz plan
  → wykonawca               kod, testy i kronika na gałęzi feat/<slug>
  → /bramka                 testy automatyczne, potem Twoja checklista
  → STOP 2                  oddajesz wynik checklisty
  → /critical-code-review   świeży agent szuka błędów
  → STOP 3                  przy każdej uwadze: napraw / na później / pomiń
  → /kronikarz zamknij      kronika i backlog
  → STOP 4                  „akcept” → commit i merge
```

Najprościej zacząć od `/code-manager` i opisać potrzebę, np. „Chcę widzieć projekty klienta z zadaniami”. Manager poprowadzi resztę i zatrzyma się w czterech miejscach, w których decyzja należy do Ciebie. `/handoff` przydaje się przy długiej rozmowie: zapisujesz stan, czyścisz rozmowę, wczytujesz stan.

## Gdzie leżą skille

- `.agents/skills/` to źródło. Czytają je Codex i inne narzędzia zgodne ze standardem Agent Skills.
- `.claude/skills/` to kopia dla Claude Code, który czyta tylko ten folder.

Trzymamy kopię zamiast skrótu (symlinku), bo skróty źle działają na Windowsie. **Po każdej zmianie skilla w `.agents/skills/` skopiuj go ponownie do `.claude/skills/`.**

macOS / Linux:

```bash
for s in grill plan-inicjatyw code-manager bramka critical-code-review kronikarz handoff; do cp -R ".agents/skills/$s" .claude/skills/; done
```

Windows (PowerShell):

```powershell
"grill","plan-inicjatyw","code-manager","bramka","critical-code-review","kronikarz","handoff" | ForEach-Object { Copy-Item -Recurse -Force ".agents/skills/$_" ".claude/skills/" }
```

## Instalacja globalna

Skille z tego folderu działają tylko w tym repozytorium. Żeby mieć je we wszystkich projektach, skopiuj katalogi skilli:

- Claude Code: do `~/.claude/skills/`
- Codex i inne narzędzia: do `~/.agents/skills/`

macOS / Linux:

```bash
mkdir -p ~/.claude/skills ~/.agents/skills
for s in grill plan-inicjatyw code-manager bramka critical-code-review kronikarz handoff; do
  cp -R ".agents/skills/$s" ~/.claude/skills/
  cp -R ".agents/skills/$s" ~/.agents/skills/
done
```

Windows: skopiuj te same katalogi do `%USERPROFILE%\.claude\skills\` i `%USERPROFILE%\.agents\skills\`.

Masz już skille o tych samych nazwach, np. `grill` z innego zestawu? Zostaw jedną wersję. Przy dwóch wersjach o jednej nazwie narzędzie wybierze jedną z nich, niekoniecznie tę, której się spodziewasz.

Ścieżki w skillach (`data/`, `node --test`, `node server.mjs`) pasują do tej aplikacji. W innym projekcie opisz swoje komendy i foldery w `AGENTS.md`, a skille się do nich dostosują.

## Dlaczego `plan-inicjatyw`, a nie `plan`

Claude Code ma wbudowaną komendę `/plan` (tryb planowania). Żeby się nie gryzły, skill nazywa się `plan-inicjatyw`. Do 2026-10-13 nazywał się `plan-zmiany`, ale planuje też nowe inicjatywy, nie tylko zmiany w aplikacji.

## Pliki, które powstają w projekcie

```
CONTEXT.md                               słownik firmy (grill)
doc/decisions/NNNN-<opis>.md             ważne decyzje (grill)
doc/plans/<slug>/plan.md                 plan zmiany albo inicjatywy (plan-inicjatyw)
doc/backlog.md                           lista zadań (plan-inicjatyw, kronikarz)
doc/history/YYYY-MM-DD-<slug>.md         kronika zmiany (kronikarz)
doc/bramki/YYYY-MM-DD-<slug>.md          checklista testów (bramka)
doc/code-reviews/YYYY-MM-DD-<slug>.md    raport przeglądu (critical-code-review)
doc/session/session.md                   notatka sesji, poza gitem (handoff)
```

---

**Pochodzenie i licencja.** Skill `grill` i część skilla `plan-inicjatyw` to adaptacje skilli z repozytorium [mattpocock/skills](https://github.com/mattpocock/skills), udostępnionych na licencji MIT (Copyright (c) Matt Pocock, [treść licencji](https://github.com/mattpocock/skills/blob/main/LICENSE)). Pozostałe skille to uproszczona wersja metodologii Code Manager. Wszystkie skille w tym folderze możesz używać, zmieniać i udostępniać na licencji MIT.

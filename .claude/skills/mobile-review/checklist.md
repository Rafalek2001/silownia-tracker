# GymTracker mobile checklist

Start from clean data in dark mode (see SKILL.md step 2), then load the fixture history (step 2.4). UI labels are Polish.

## Load / Dziś
- [ ] Title "GymTracker", no console errors, no light flash before dark applies, no horizontal scroll.
- [ ] Plan tabs A / B / C · extra; the dot marks the next A/B in rotation (after an A session it's B; C never moves it).
- [ ] With the fixture (last session months ago) the "Powrót po przerwie" note shows and set counts are ~2/3 of the plan.
- [ ] Muscle map: front + back line-art, worked muscles filled (amber → yellow for the most sets); "Ten trening" / "Ostatnie 7 dni" toggle works; legend readable.
- [ ] Plan list: pairs marked ⇄, TEST badge on the test slot, "+ Dodaj ćwiczenie do planu", stretch summary row.
- [ ] Sticky "Start" button doesn't hide the last list row when scrolled to the bottom.

## Editing the plan
- [ ] "+ Dodaj ćwiczenie do planu": picker opens; muscle chips filter the list (e.g. Barki tył → Face pull, Odwrotne rozpiętki); search works; picking appends the exercise.
- [ ] "Własne ćwiczenie": name + muscle chips → added and selectable.
- [ ] Tap a plan row: drawer with muscles, sets −/+, "Jak wykonać" link, "Wymień na inne", "Usuń z planu" (confirm dialog). Changes persist in `gt5plan`.

## Session
- [ ] Start: full-screen session, header "Trening X · Ćwiczenie n z m", progress bar, + (add) button.
- [ ] Drums are pre-set to the suggestion (e.g. squat 6 × 55 with the fixture); hint chip shows the reason; "Ostatnio …" line shows the last sets.
- [ ] "Seria zrobiona" ticks the active set, starts the rest timer in the header (3:00 compound, 1:30 isolation/pairs, 1:00 plan C) and moves to the next set.
- [ ] In a pair (⇄) ticks alternate between the two exercises.
- [ ] Tapping a done set chip selects it; the button reads "Popraw serię".
- [ ] "?" opens the technique link in a new tab (verified Jeff Nippard video or channel search).
- [ ] "+" in the header adds an exercise to today only (inserted after the current step; plan unchanged).
- [ ] Closing (×) returns to Dziś with "Wróć do treningu"; reloading the app reopens the session.
- [ ] Last step → Rozciąganie: tap a stretch → countdown fill, rounds x/2; "Zakończ trening" saves only ticked sets, clears the session, shows History.

## Weekly review
- [ ] Set `gt5review` to a date ≥ 7 days ago (or remove it with history containing sessions with `exerciseId` older than 7 days): "Przegląd tygodnia" card shows; toggles work; "Zastosuj zaznaczone" changes the plan (deload / ± set) and hides the card.

## History / Progress
- [ ] History lists all plans with A/B/C badges; old names show library names (e.g. "Deepy" → Dipy).
- [ ] Pencil opens the edit drawer; trash asks to confirm.
- [ ] Progress: select lists exercises across plans; charts render; first/last date labels not clipped.

## Settings (gear)
- [ ] Theme Jasny / Ciemny / Auto applies immediately and survives reload.
- [ ] Export/Import buttons present (don't download in review); "Przywróć domyślny plan" asks to confirm.

## Small phone (320×640)
- [ ] No overflow on Dziś, session (single and pair), history, progress; probe finds no targets < 44 px except intentional chips.

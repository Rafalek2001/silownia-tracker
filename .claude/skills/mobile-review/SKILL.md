---
name: mobile-review
description: Review GymTracker on a phone-sized viewport in the built-in browser before pushing — smoke-test every screen in light and dark mode, probe layout (overflow, touch targets, overlap with bottom nav / timer button), check console errors, and stamp HEAD on PASS. Use before any `git push`, when the push hook blocks with "no passing mobile review", or when asked for a "mobile review", "mobile check" or "test on phone".
---

# Mobile review for GymTracker

GymTracker is a React + Tailwind + shadcn/ui app. Source lives in `app/`; `pnpm release` (run in `app/`) builds it into one self-contained file and copies it to the repo-root `index.html`, which is what gets served and pushed. Data is in localStorage: `gt5h` (history), `gt5` (exercises of the session in progress), `gt5s` (session meta), `gt5plan` (plan A/B/C), `gt5review` (last weekly review), `gt5custom` (custom exercises), `gt-theme`.

Review the built `index.html` at phone size and produce a PASS/FAIL report. The push gate (`.claude/hooks/require-mobile-review.sh`) only lets Claude's `git push` through when `.claude/.mobile-review-ok` contains the current `HEAD` sha.

## 1. Scope
- Run `git status --short`. Uncommitted changes are not part of the push; if the tree is dirty, say so in the report.
- Run `git log --oneline @{u}..HEAD` and `git diff --stat @{u}..HEAD` (fall back to `origin/main..HEAD`). Look harder at what the diff touches, but always run the full smoke flow.
- **Bundle in sync:** if the diff touches `app/`, run `pnpm release` in `app/` (pnpm may need `corepack pnpm`) and check that `git status --short index.html` is clean. If the rebuilt `index.html` differs from the committed one, the commit ships stale code → FAIL.

## 2. Set up
1. `mcp__Claude_Browser__preview_start` with `name: "gymtracker"` (static server for the built file, http://localhost:8417). For debugging with readable stack traces, `gymtracker-dev` runs Vite on :5417 — but review the built file.
2. `navigate` to `http://localhost:8417/index.html`, then `resize_window` with `preset: "mobile"` (375×812) and `colorScheme: "dark"`.
3. Back up and clear user data with `javascript_tool`, then reload:
   ```js
   const K=['gt5','gt5h','gt5s','gt5plan','gt5review','gt5custom','gt-theme'];
   K.forEach(k=>sessionStorage.setItem('bak_'+k, localStorage.getItem(k) ?? '__null__'));
   K.forEach(k=>localStorage.removeItem(k)); location.reload(); 'backed up';
   ```
4. Load a realistic fixture: the user's export lives at `~/Downloads/gymtracker-*.json` if present. Read it with Bash, then `localStorage.setItem('gt5h', <history JSON string>)` via `javascript_tool` and reload. Without it, record two sessions through the UI first.

## 3. Walk the checklist
Follow [checklist.md](checklist.md) screen by screen. On each screen:
- take a `screenshot` (scale 0.5 is enough) and keep notes of what you saw,
- interact through `find` refs and `computer` clicks — real taps, not calling app code,
- run `read_console_messages` with `onlyErrors: true`.

Gotchas learned from running this:
- App modules can be imported in the dev server tab for logic checks: `await import('/src/lib/stats.ts')` (suggestions, ramp-up, weekly sets) and `/src/lib/review.ts` (weekly review on synthetic history).
- **Drum pickers use pointer events**, so `left_click_drag` on a drum works: drag up = higher value, 36 px per step (plus a little fling). Confirm the value in `JSON.parse(localStorage.gt5).A[i].sets`. Arrow keys work when a drum is focused.
- **Screenshots lag behind the page** in the browser pane, and drawers/dialogs/toasts animate. Wait ~800 ms, and when a screenshot disagrees with what you expect, check the DOM (`[role=dialog]`, `[data-sonner-toast]`, `data-state`) before calling it a bug.
- **Refs go stale after layout changes** (adding a card, scrolling, view switch). Run `find` again right before you click.
- Saving a workout switches to History automatically. Confirmations ("Usunąć ten trening?", "Zastąpić aktualny trening?") are in-app dialogs, not `window.confirm`.
- Chrome here returns a Promise from `window.scrollTo`, so a `useEffect(() => window.scrollTo(...))` arrow without braces crashes React ("destroy is not a function"). Any such console error is a blocker.

## 4. Layout probe
Run on each view (Dziś, a session step — single and pair, history, progress with an exercise picked, and with the picker drawer open):
```js
(() => {
  const vw = innerWidth, out = [];
  if (document.documentElement.scrollWidth > vw) out.push(`horizontal overflow: ${document.documentElement.scrollWidth}px > ${vw}px`);
  document.querySelectorAll('button,input,select,textarea,[role=spinbutton],[role=combobox]').forEach(el => {
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    const label = (el.getAttribute('aria-label') || el.textContent || el.placeholder || el.tagName).trim().slice(0, 24);
    if (r.width < 44 || r.height < 44) out.push(`small target ${Math.round(r.width)}×${Math.round(r.height)}: ${label}`);
    if (r.right > vw + 1 || r.left < -1) out.push(`off-screen x: ${label}`);
  });
  const nav = document.querySelector('nav')?.getBoundingClientRect();
  const fab = document.querySelector('[aria-label="Timer odpoczynku"],[aria-label^="Zatrzymaj timer"]')?.getBoundingClientRect();
  return { nav: nav && Math.round(nav.top), fab: fab && Math.round(fab.top), findings: [...new Set(out)] };
})()
```
Then check from screenshots, scrolled to the bottom, that the nav and timer button never cover the save button, the last set row, or drawer buttons.

## 5. Theme and small-phone passes
- Switch the theme (gear top right → Motyw → Jasny) and repeat screenshots of Dziś (muscle map), a session step, history and progress. Text, borders, charts and the selected drum row must be readable in both themes; no hard-coded light-on-light or dark-on-dark.
- Set the menu back to Systemowy and confirm the app follows `colorScheme` emulation again.
- `resize_window` to 320×640, reload, repeat the probe on Dziś, a session pair step, history and the picker.

## 6. Clean up — always, even on FAIL
Stop a running timer and cancel any session you started ("Przerwij bez zapisu"), then:
```js
['gt5','gt5h','gt5s','gt5plan','gt5review','gt5custom','gt-theme'].forEach(k=>{const v=sessionStorage.getItem('bak_'+k); if(v===null) return;
  v==='__null__' ? localStorage.removeItem(k) : localStorage.setItem(k,v); sessionStorage.removeItem('bak_'+k);}); location.reload(); 'restored';
```
Confirm the data is back, then `resize_window` with `preset: "desktop"`.

## 7. Report
Reply with:
- **Result: PASS or FAIL** and the sha you reviewed (`git rev-parse --short HEAD`).
- A findings table: severity (blocker / major / minor), screen, theme, issue, how to reproduce.
- Console errors, if any.
- Point to the screenshots that show problems.

FAIL on any console error, a stale bundle, horizontal overflow, a broken checklist flow, unreadable content in either theme, or controls hidden behind the nav/timer. Minor-only findings can still PASS — list them.

## 8. Stamp or stop
- **PASS** and the working tree is clean: `git rev-parse HEAD > .claude/.mobile-review-ok`, then continue with the push if one was requested.
- **FAIL**: do not write the stamp and do not push. List the findings and ask the user whether to fix them. Don't fix anything without their answer. After fixes are committed, run this skill again — a new commit needs a new review.

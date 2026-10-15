# Manual testing protocol (complete, step-by-step)

> **Before doing this by hand, check `references/automation.md`.** If any environment can drive a
> browser, `scripts/live-scan/run-audit.mjs` automates most of M1–M10 and F1–F4 and reduces the human
> to answering a short question list. Use this manual protocol when no browser is drivable, when you
> need the per-check pass/fail detail behind an automated result, or for the irreducibly-human items
> (screen-reader announcement quality, caption accuracy, seizure-level flashing, cognitive load).

Automated tools cover ~30–40% of WCAG. **This protocol is the other 60–70%.** Run every procedure
(M1–M10) on each sampled page, then the assistive-technology scripts (AT1–AT3) on the key user
journeys. Each procedure lists the exact steps, what PASS/FAIL looks like, and the success criteria
(SC) it verifies — so combining the automated findings with a completed M1–M10 + AT run accounts for
all 55 A/AA criteria.

## Contents
- Preparation: page sampling (WCAG-EM) & environment
- M1 Keyboard-only walkthrough
- M2 Focus visibility, order & obscuring
- M3 Zoom, reflow & text spacing
- M4 Contrast
- M5 Structure: headings, landmarks, title, language
- M6 Images & media quality review
- M7 Forms, errors & process completion
- M8 Motion, timing & flashing
- M9 User preferences: reduced motion, forced colors, orientation
- M10 WCAG 2.2 specials: target size, dragging, consistent help, redundant entry, authentication
- AT1 NVDA (Windows) script · AT2 VoiceOver (macOS/iOS) script · AT3 TalkBack (Android) basics
- Recording sheet
- Coverage map: procedure → success criteria

---

## Preparation

**Sample pages (WCAG-EM style).** Don't audit only the homepage. Select: (1) the homepage, (2) one
instance of every distinct template/layout, (3) every step of the core user journeys end-to-end
(e.g. product → cart → checkout → confirmation; registration; login; contact), (4) the most complex
interactive page (filters, tables, media player), (5) the accessibility statement page, and (6) any
page reached by assistive-technology users disproportionately (help/contact). Record the sample list
in the report's scope section.

**Environment.** A desktop browser (Chrome or Firefox) with DevTools; the Text Spacing bookmarklet;
a contrast tool (TPGi Colour Contrast Analyser or DevTools' contrast checker); OS screen reader(s)
per AT1–AT3; a physical keyboard; optionally a phone for orientation/touch checks. Disable browser
extensions that alter pages. Test at default settings first.

**Discipline.** One procedure at a time, all pages, before moving on — switching procedures per page
causes misses. Log every finding immediately with: page, element/selector, procedure ID, SC, severity.

---

## M1 — Keyboard-only walkthrough  *(put the mouse out of reach)*

1. Load the page. Press **Tab** repeatedly through the entire page to the end, then **Shift+Tab** back.
2. At each stop, try to operate the control: **Enter** (links/buttons), **Space** (buttons/checkboxes),
   **arrow keys** (radios, selects, sliders, tabs, menus), **Esc** (close dialogs/menus), **Home/End**
   where sensible.
3. Open every menu, dialog, accordion, datepicker, carousel control, tooltip trigger, and custom
   widget. Complete the page's main task (submit the form, add to cart) with keyboard only.
4. Specifically probe: cookie banner (first thing on load), modals (does focus move in? can you get
   out? does Esc work? does focus return to the trigger on close?), embedded iframes/players, sticky
   chat widgets, drag-and-drop features, hover-only menus.

**PASS:** every visible interactive element is reachable and operable; nothing traps focus; hover-only
content also appears on keyboard focus; no action requires a pointer.
**FAIL examples:** `div`-buttons that ignore Enter/Space; carousel arrows unreachable; focus stuck in
an embedded widget; menus that only open on hover.
**Covers:** 2.1.1, 2.1.2, 2.1.4, 1.4.13 (focus-triggered content), 3.2.1 (no surprise context change
on focus), parts of 4.1.2.

## M2 — Focus visibility, order & obscuring

1. Repeat a full Tab pass while watching **only** the focus indicator.
2. At every stop ask: *can I see, at a glance, exactly which element has focus?* Check on all
   background variants (hero images, dark sections).
3. Verify the order matches the visual/logical reading order (left-to-right, top-to-bottom for LTR;
   related controls adjacent). Watch for CSS reordering (flex `order`, grid placement).
4. Scroll so sticky headers/footers/cookie bars overlap content, then Tab into that region: is the
   focused element at least partially visible, and does the page scroll it into view?
5. Trigger dynamic UI (open/close modal, delete a list item): does focus land somewhere sensible and
   never get lost to `<body>`?

**PASS:** indicator always visible with clear contrast; order sensible; focused elements never fully
hidden behind sticky UI; focus managed on dynamic changes.
**Covers:** 2.4.3, 2.4.7, 2.4.11 (2.2), parts of 1.3.2.

## M3 — Zoom, reflow & text spacing

1. **200% zoom** (Ctrl/Cmd + "+"): all text scales; no clipping/overlap; everything still operable. → 1.4.4
2. **400% zoom at 1280px window** (equivalent to 320 CSS px): content reflows into one column; no
   horizontal scrolling for text; no content or function lost (menus may collapse to a burger — fine,
   but the burger must work per M1). → 1.4.10
3. Run the **Text Spacing bookmarklet** (line-height 1.5, paragraph 2×, letter 0.12×, word 0.16×):
   no clipped, truncated, or overlapping text. → 1.4.12
4. On a phone or narrow emulator: check nothing depends on two-dimensional scrolling except real
   exceptions (data tables, maps, diagrams).

**Covers:** 1.4.4, 1.4.10, 1.4.12.

## M4 — Contrast

1. With the contrast tool, sample: body text, secondary/muted text, link text (default/hover/visited),
   button labels, text over images/gradients (sample the *worst* spot), placeholder text that carries
   meaning, disabled-looking-but-enabled controls.
   Thresholds: **4.5:1** normal text, **3:1** large text (≥24px, or ≥18.66px bold). → 1.4.3
2. Non-text: input borders, focus indicators, icons that convey meaning, checkbox/radio states, chart
   lines/segments, slider handles — **3:1** against adjacent colours. → 1.4.11
3. Greyscale the page (DevTools rendering emulation): is anything conveyed **only** by colour —
   required fields, error states, link-vs-text, chart series? → 1.4.1

**Covers:** 1.4.1, 1.4.3, 1.4.11.

## M5 — Structure: headings, landmarks, title, language

> **Steps 2 (heading order), 4 (skip link), and 5/6 (title/lang) are mechanical and already automated**
> by `scripts/audit_static_html.py` (offline) and `scripts/live-scan/run-audit.mjs`'s `structurePass`
> (live). If either has run, use those results directly — do these steps by hand only as the by-hand
> fallback when no automation ran at all.

1. Open the browser's **Accessibility tree** (DevTools) or a headings/landmarks extension.
2. Headings: exactly one `<h1>` describing the page; levels nest without skipping (auto-checked: see
   above); headings describe the section that follows (not styling shortcuts — this part is
   judgement, not mechanical). → 1.3.1, 2.4.6
3. Landmarks: `main`, `nav`, `header`, `footer` present and not duplicated without labels. → 1.3.1, 2.4.1
4. First Tab stop reveals a working **skip link** to main content (auto-checked) — or landmark
   navigation suffices. → 2.4.1
5. `<title>` unique and descriptive per page (auto-checked for presence; "descriptive" is judgement —
   e.g. "Kasse – Shopname", not "Shopname" everywhere). → 2.4.2
6. `lang` correct on `<html>` (auto-checked for presence/validity); foreign-language passages have
   their own `lang` (judgement — locate them by hand). → 3.1.1, 3.1.2
7. Check nav is in the same order on every sampled page, and identical functions carry identical
   labels/icons across pages. → 3.2.3, 3.2.4
8. Beyond nav: is there **more than one way** to reach content (search, sitemap, related links)? → 2.4.5
9. Read link texts out of context (extension or a11y tree list): is each link's purpose clear? → 2.4.4
10. Instructions anywhere on the page: do any rely on shape/position/colour/sound alone ("the green
    button on the right")? → 1.3.3

**Covers:** 1.3.1, 1.3.3, 2.4.1, 2.4.2, 2.4.4, 2.4.5, 2.4.6, 3.1.1, 3.1.2, 3.2.3, 3.2.4.

## M6 — Images & media quality review  *(the automated pass only finds missing alt — you judge quality)*

1. For every informative image: does the alt text convey the same information ("Diagramm: Umsatz
   steigt von 2 auf 5 Mio. €", not "chart.png")? Decorative images: `alt=""` or `aria-hidden`.
   Text-in-images: is there real-text equivalent, or should it be real text? → 1.1.1, 1.4.5
2. Every video: captions present, synchronised, accurate (auto-captions must be checked, they often
   fail names/jargon)? → 1.2.2 / live: 1.2.4
3. Video with meaningful visuals: audio description track or an adequate text alternative? → 1.2.3, 1.2.5
4. Audio-only content: transcript? Video-only (no audio): transcript or AD? → 1.2.1
5. Any media that autoplays with sound >3s: is there an immediate pause/stop/volume control? → 1.4.2

**Covers:** 1.1.1 (quality), 1.2.1–1.2.5, 1.4.2, 1.4.5.

## M7 — Forms, errors & process completion

Run the **whole** process (checkout, registration) — conformance applies to complete processes.

1. Every field has a **visible, persistent label** (placeholder is not a label; floating labels must
   stay visible while typing). Required fields indicated in text, not colour/asterisk alone. → 3.3.2, 1.4.1
2. Personal-data fields carry correct `autocomplete` tokens (verify autofill actually works). → 1.3.5
3. Submit with **empty** fields, then with **invalid** data: errors are described in text, identify
   the field, and suggest a fix where possible ("Datum im Format TT.MM.JJJJ"); focus/attention is led
   to the error; errors are programmatically associated (`aria-describedby`) — verify in AT pass. → 3.3.1, 3.3.3
4. Changing a select/radio/checkbox must not auto-submit or navigate without prior warning. → 3.2.2
5. Legal/financial/data-deletion submissions: is there review-before-submit, undo, or explicit
   confirmation? → 3.3.4
6. Multi-step flows: is previously entered data re-requested? It must be auto-filled or selectable
   ("Lieferadresse als Rechnungsadresse übernehmen"). → 3.3.7 (2.2)
7. Session/time limits (ticket reservations, banking): can the user extend/turn off, with warning? → 2.2.1

**Covers:** 1.3.5, 2.2.1, 3.2.2, 3.3.1–3.3.4, 3.3.7.

## M8 — Motion, timing & flashing

1. Carousels, tickers, auto-updating feeds, background videos: pause/stop/hide control present and
   keyboard-operable? → 2.2.2
2. Anything flashing/strobing: never more than 3 flashes per second. → 2.3.1
3. Content appearing on hover/focus (tooltips, mega-menus, previews): dismissible with **Esc**,
   pointer can move **onto** the popup without it closing, stays until dismissed. → 1.4.13

**Covers:** 2.2.2, 2.3.1, 1.4.13.

## M9 — User preferences: reduced motion, forced colors, orientation

1. Enable **prefers-reduced-motion** (OS setting or DevTools emulation): large/parallax/auto
   animations are reduced or removed. (Supports 2.2.2/2.3.1; best practice beyond.)
2. **Forced colors / Windows High Contrast** (DevTools: emulate `forced-colors: active`): all
   controls, focus indicators, and boundaries remain visible; no information disappears. (Supports
   1.4.1/1.4.11 robustness.)
3. Rotate device / emulate portrait & landscape: both orientations work; nothing locks orientation
   without an essential reason. → 1.3.4
4. Device-motion features (shake to undo): UI alternative exists and motion can be disabled. → 2.5.4

**Covers:** 1.3.4, 2.5.4 (+ robustness for M4/M8 topics).

## M10 — WCAG 2.2 specials

1. **Target size:** measure small controls (DevTools ruler): pointer targets ≥ **24×24 CSS px**, or
   have ≥24px spacing to neighbours, or an equivalent larger control exists. Check icon buttons,
   "×" close buttons, pagination, checkbox hit areas, links in dense lists. → 2.5.8
2. **Dragging:** every drag interaction (sliders, reorder, kanban, map pan) has a single-pointer,
   non-dragging alternative (buttons, +/- steppers, arrow-key support counts if pointer alternative
   exists too). → 2.5.7 (pointer gestures needing multipoint/path → 2.5.1; actions fire on release,
   not press → 2.5.2 — test by pressing, dragging off, releasing: nothing should trigger)
3. **Label in name:** for controls with visible text labels, the accessible name **contains** the
   visible text (check a11y tree; critical for voice-control users saying "Klick 'Jetzt kaufen'").
   → 2.5.3
4. **Consistent help:** if help exists (contact link, chat, FAQ, phone), it appears in the same
   relative place on every page that offers it. → 3.2.6
5. **Authentication:** log in. Is paste blocked in the password field? Is a CAPTCHA/puzzle/memory
   task the only path? Password managers must work, or an alternative (email magic link, passkey,
   object-recognition CAPTCHA at minimum) must exist. Check 2FA too: can codes be pasted? → 3.3.8

**Covers:** 2.5.1, 2.5.2, 2.5.3, 2.5.7, 2.5.8, 3.2.6, 3.3.8.

---

## Flow protocol (F1–F4) — auditing a complete user journey

M1–M10 test pages in isolation; F1–F4 test whether someone can get **through** a multi-step task
(buy a ticket, register, book an appointment). WCAG conformance requirement #3 makes this decisive:
a process conforms only if **every step** conforms, so one broken step fails the whole journey — and
these are the failures that block a real service and carry the most legal risk under BFSG/EAA.

**Define the flow first (with the user).** Write down the start URL and each step as *action →
expected result*, and list the **states**, not just pages — because a single URL can hold several
distinct states that each need testing:
- the initial/empty state,
- the **error state** (submit empty; submit invalid data),
- **dynamic states** (opened modal, expanded seat map, loaded payment iframe, "added to cart" toast),
- **edge states** (sold out, session/timer expiry, declined payment, "already registered").

Example — *ticket purchase*: home → event list → event detail → select ticket/seat → cart → checkout
(empty-submit error state, then filled) → payment → confirmation. Feed this to
`scripts/live-scan/run-flow.mjs` for the automated per-state scan, then run F1–F4 manually.

### F1 — Per-step keyboard traversal
For **every step and every state**, run M1 (keyboard-only) and M2 (focus) *before* advancing. Reach
and operate the control that moves you to the next step using the keyboard alone. **PASS:** the whole
journey is completable by keyboard, start to finish, with no trap and no pointer-only step.
**FAIL example:** the seat map only responds to mouse clicks; the "Weiter" button is a `div` that
ignores Enter. → 2.1.1, 2.1.2, 2.4.3, 2.4.7

### F2 — Focus management across state changes
Watch focus at each transition: opening a modal moves focus **into** it; closing returns focus to the
trigger; navigating to the next step lands focus somewhere sensible (heading/first field), not back at
`<body>` or the top of the page. Newly revealed content (errors, next section) receives or is adjacent
to focus. **FAIL example:** after "Zur Kasse" the page changes but focus stays on the vanished button,
so keyboard/SR users are dumped at the top with no cue. → 2.4.3, 3.2.1, 3.2.2, 4.1.2

### F3 — Error & interruption states
At each data-entry step: submit empty, then submit invalid, then (if applicable) trigger an edge state
(expired session, sold-out). Errors must be identified in text, tied to the field, suggest a fix, and
be **announced** (verify in the AT pass, F4); recovery must not lose already-entered data (3.3.7); and
legal/financial confirmation/undo must exist for the final commit. **FAIL example:** payment declines
and the only feedback is a red border with no text and no announcement. → 3.3.1, 3.3.3, 3.3.4, 3.3.7,
2.2.1, 4.1.3

### F4 — End-to-end completion with a screen reader (the acid test)
Using AT1/AT2/AT3, complete the **entire** journey to the success state (ticket bought / account
created) with the monitor off or eyes closed. Note every point where you had to peek, guess, or got
stuck. **PASS:** the task is completable non-visually with every control announced (name/role/state),
every status change spoken, and the confirmation clearly conveyed. **A journey that cannot be
completed non-visually is a Critical finding for the whole process, regardless of per-page scores.**
→ verifies 1.3.1, 1.3.2, 4.1.2, 4.1.3 across the process + all of F1–F3 programmatically.

**Report per step.** Record findings against the step *and* state where they occur, and give an
overall **process verdict** (completable: yes/no, by keyboard, by screen reader). See the flow section
of `references/report-template.md`.

---

## AT1 — NVDA screen reader script (Windows, free — the baseline)

Setup: install NVDA, use Firefox or Chrome. Start/stop: **Ctrl+Alt+N** / **Insert+Q**. Speech viewer
(see what's spoken as text): NVDA menu → Tools → Speech Viewer. "NVDA key" = Insert (or CapsLock).

1. **Page orientation:** load page. Listen to title announcement. **NVDA+F7** → elements list: review
   links, headings, form fields, buttons, landmarks — do the lists read sensibly on their own?
2. **Read-through:** from top, **↓** line by line (or **NVDA+↓** say-all). Is the reading order
   logical? Is anything visible never announced — or announced that isn't visible?
3. **Quick-nav sweep:** **H** heading-to-heading (structure sensible?), **K** links (names clear out
   of context?), **F** form fields (each announces **label + role + state**, e.g. "E-Mail, Eingabefeld,
   erforderlich"?), **B** buttons, **T** tables (headers announced per cell? **Ctrl+Alt+arrows** to
   navigate cells), **D** landmarks, **G** graphics (alt text useful?).
4. **Forms mode:** Tab into the form, fill it, submit invalid: is the error **announced** without
   hunting? Is the field's error description read when focusing the field (aria-describedby)?
5. **Dynamic updates:** add to cart, filter results, open dialogs: are status changes announced
   (live regions — "3 Ergebnisse", "Artikel im Warenkorb")? Does a dialog announce its title and trap
   reading appropriately? → 4.1.3, 4.1.2
6. **Custom widgets:** every non-native control (tabs, accordions, comboboxes, toggles) announces a
   correct **name, role, and state** ("Registerkarte, ausgewählt, 1 von 3"; "Schalter, aus"), and
   state changes are spoken when operated. → 4.1.2
7. **Key task end-to-end:** complete the core journey (checkout/registration) with the screen with
   the monitor turned off or eyes closed. If you can't finish, that is a critical finding.

## AT2 — VoiceOver script (macOS / iOS)

macOS: **Cmd+F5** toggles VO; VO keys = **Ctrl+Option**. **VO+A** read page; **VO+→** next item;
**VO+U** rotor (headings/links/form controls lists); **VO+Space** activate; **Ctrl+Option+Cmd+H**
next heading. Run the same seven checks as AT1.
iOS (Safari): triple-click side button to toggle; swipe right/left = next/previous element;
double-tap = activate; **rotor** (two-finger twist) → headings/links/form controls. Verify touch
order, labels on icon buttons, and that custom gestures have accessible alternatives.

## AT3 — TalkBack basics (Android, Chrome)

Toggle: volume-keys shortcut (both volume keys 3s) or Settings → Accessibility. Swipe right/left =
next/previous; double-tap = activate; reading controls (swipe up/down) → headings/links/controls.
Run checks 1–7 from AT1 in abbreviated form; prioritise the key user journey and form errors.

**What "PASS" sounds like, in all three:** every control announced with useful name + correct role +
current state; every image either silent (decorative) or informative; every status change spoken;
reading order matches meaning; the key task completable without sight.

---

## Recording sheet — page mode (per page)

```
Page: ___________________  URL/file: ___________________  Date: ______  Tester: ______
Procedures completed: M1 ☐ M2 ☐ M3 ☐ M4 ☐ M5 ☐ M6 ☐ M7 ☐ M8 ☐ M9 ☐ M10 ☐  AT: ______
| Proc | SC | Severity | Element/location | Observation | Suggested fix |
|------|----|----------|------------------|-------------|---------------|
```

## Recording sheet — flow mode (per journey)

```
Flow: ___________________  Start URL: ___________________  Date: ______  Tester: ______
F1 ☐  F2 ☐  F3 ☐  F4 ☐    Completable by keyboard: Y/N    Completable by screen reader: Y/N
| Step # | State (initial/error/dynamic/edge) | Proc | SC | Severity | Observation | Suggested fix |
|--------|------------------------------------|------|----|----------|-------------|---------------|
Process verdict: __________________________________________________________________
```

Transfer findings into the report; mark procedures not run as **Not tested** in the coverage tally —
never as passes.

## Coverage map — procedure → success criteria

| Procedure | Success criteria verified |
|---|---|
| M1 Keyboard | 2.1.1, 2.1.2, 2.1.4, 3.2.1, part 1.4.13, part 4.1.2 |
| M2 Focus | 2.4.3, 2.4.7, 2.4.11, part 1.3.2 |
| M3 Zoom/reflow | 1.4.4, 1.4.10, 1.4.12 |
| M4 Contrast | 1.4.1, 1.4.3, 1.4.11 |
| M5 Structure | 1.3.1, 1.3.3, 2.4.1, 2.4.2, 2.4.4, 2.4.5, 2.4.6, 3.1.1, 3.1.2, 3.2.3, 3.2.4 |
| M6 Media | 1.1.1 (quality), 1.2.1–1.2.5, 1.4.2, 1.4.5 |
| M7 Forms | 1.3.5, 2.2.1, 3.2.2, 3.3.1, 3.3.2, 3.3.3, 3.3.4, 3.3.7 |
| M8 Motion | 1.4.13, 2.2.2, 2.3.1 |
| M9 Preferences | 1.3.4, 2.5.4 |
| M10 2.2 specials | 2.5.1, 2.5.2, 2.5.3, 2.5.7, 2.5.8, 3.2.6, 3.3.8 |
| AT1–AT3 Screen readers | 1.3.1, 1.3.2, 4.1.2, 4.1.3 (+ verifies M5–M7 programmatic associations) |
| F1–F4 Flow (multi-step) | Re-verifies 2.1.1, 2.1.2, 2.4.3, 2.4.7, 3.2.1, 3.2.2, 3.3.1, 3.3.3, 3.3.4, 3.3.7, 2.2.1, 4.1.2, 4.1.3 **across the whole process** (conformance req. #3) |

Automated + M1–M10 + AT together account for **all 55** A/AA criteria on a page. F1–F4 don't add new
criteria — they re-test the interaction/form/focus criteria **at process level**, which is where
conformance is actually won or lost. If a criterion's subject doesn't exist (no video → 1.2.x), record
it as **Not present** — that counts as satisfied for conformance, but say so explicitly.

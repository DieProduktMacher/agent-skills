# WCAG 2.2 Level A + AA checklist (with test method per criterion)

This list is **complete and exact: all 55 success criteria of WCAG 2.2 at Levels A (31) and AA (24)**.
If your tally during an audit doesn't reach 55 assessed-or-explicitly-skipped criteria, something was
missed. Work through every criterion and record **Pass / Fail / Not present / Not tested** plus, for failures,
the element/location, the user impact, and the fix. `(2.2)` marks criteria new in WCAG 2.2. `4.1.1
Parsing` is intentionally absent (removed/obsolete in 2.2). Level shown as **[A]** / **[AA]**.

**If Step 0's target level is AAA:** assess A+AA from this checklist first — it's the mandatory
floor underneath any AAA claim — then work through **all 31 additional criteria** in
`references/wcag-checklist-aaa.md`. That file is itemized and verified complete (31/31 against the W3C
WCAG 2.2 Quick Reference); most of its criteria are genuinely human/editorial judgement (reading level,
translation quality, content strategy) rather than automatable, so expect an AAA audit to lean much
more heavily on manual assessment than an A/AA one does.

## Contents
- Principle 1 — Perceivable (1.1–1.4)
- Principle 2 — Operable (2.1–2.5)
- Principle 3 — Understandable (3.1–3.3)
- Principle 4 — Robust (4.1)
- Fast triage order (what to check first)

---

## Principle 1 — Perceivable

**1.1.1 Non-text Content [A]** — Every image/icon/control has an appropriate text alternative;
decorative images have empty `alt=""` (or CSS). *Test:* inspect `alt`, `aria-label`, SVG `<title>`;
turn images off. *Common fail:* `alt="image123.jpg"`, missing alt on informative images, alt on
decorative images that adds noise.

**1.2.1 Audio-only / Video-only (Prerecorded) [A]** — Transcript for audio-only; transcript or audio
description for video-only. **1.2.2 Captions (Prerecorded) [A]** — synchronised captions on video with
audio. **1.2.3 Audio Description or Media Alternative (Prerecorded) [A]** — AD or full text alternative.
**1.2.4 Captions (Live) [AA]** — live captions on live audio. **1.2.5 Audio Description (Prerecorded)
[AA]** — AD track for prerecorded video. *Test:* play media; check caption/transcript/AD availability
and quality.

**1.3.1 Info and Relationships [A]** — Structure conveyed visually is also in the markup: real
headings (`<h1>`–`<h6>`), lists, `<table>` with headers, `<fieldset>/<legend>`, `<label>`/`for`,
landmarks. *Test:* accessibility tree; heading map; are labels programmatically tied to fields?
*Common fail:* bold text used as a fake heading; layout tables; placeholder as the only label.

**1.3.2 Meaningful Sequence [A]** — DOM/reading order matches the intended reading order (watch CSS
`order`, `position`, flex/grid reordering). *Test:* linearise / tab order / screen-reader order.

**1.3.3 Sensory Characteristics [A]** — Instructions don't rely on shape/size/position/sound alone
("click the round button on the right"). *Test:* read instructions without visual context.

**1.3.4 Orientation [AA]** — Works in both portrait and landscape (no forced orientation lock).

**1.3.5 Identify Input Purpose [AA]** — Inputs collecting user info use correct `autocomplete` tokens
(name, email, tel…). *Test:* inspect `autocomplete` on personal-data fields.

**1.4.1 Use of Color [A]** — Colour is not the *only* way to convey info (links, errors, required
fields, chart series). *Test:* greyscale the page; are states still distinguishable?

**1.4.2 Audio Control [A]** — Audio that auto-plays > 3s has a pause/stop/volume control.

**1.4.3 Contrast (Minimum) [AA]** — Text ≥ **4.5:1** (≥ **3:1** for large text ≥ 24px or 18.66px bold).
*Test:* Colour Contrast Analyser / DevTools on real text-over-background, incl. text on images and
hover/focus states.

**1.4.4 Resize Text [AA]** — Text scales to 200% (browser zoom) with no loss of content/function.

**1.4.5 Images of Text [AA]** — Use real text, not images of text (except logos). 

**1.4.10 Reflow [AA]** — No loss of content/function and no 2-D scrolling for text at **320 CSS px**
width (or 400% zoom on 1280px). *Test:* narrow the viewport / zoom to 400%.

**1.4.11 Non-text Contrast [AA]** — UI component boundaries/states and meaningful graphics ≥ **3:1**
against adjacent colours. *Test:* buttons, form borders, focus indicators, icons, chart elements.

**1.4.12 Text Spacing [AA]** — No clipping/overlap when line-height 1.5×, paragraph spacing 2×, letter
0.12×, word 0.16× font size are applied. *Test:* apply the text-spacing bookmarklet.

**1.4.13 Content on Hover or Focus [AA]** — Hover/focus popovers are dismissable (Esc), hoverable
(mouse can move onto them), and persistent (don't vanish prematurely). *Test:* tooltips, custom menus.

## Principle 2 — Operable

**2.1.1 Keyboard [A]** — All functionality available via keyboard. *Test:* mouse-free run of every
feature. *Common fail:* custom widgets, drag-drop with no keyboard alternative, hover-only menus.

**2.1.2 No Keyboard Trap [A]** — Focus can always move away with the keyboard. *Test:* tab through
modals, embeds, date pickers — can you always get out?

**2.1.4 Character Key Shortcuts [A]** — Single-character shortcuts can be turned off/remapped or are
active only on focus.

**2.2.1 Timing Adjustable [A]** — Time limits can be turned off/extended (except real-time/essential).
**2.2.2 Pause, Stop, Hide [A]** — Moving/blinking/auto-updating content (carousels, tickers) can be
paused/stopped/hidden.

**2.3.1 Three Flashes or Below Threshold [A]** — Nothing flashes more than 3 times per second.

**2.4.1 Bypass Blocks [A]** — A skip link (or landmarks/headings) lets users bypass repeated nav.
*Test:* first Tab reveals a working "skip to content" link.

**2.4.2 Page Titled [A]** — Each page has a unique, descriptive `<title>`.

**2.4.3 Focus Order [A]** — Tab order preserves meaning and operability. *Test:* tab through; does
order follow the visual/logical flow (esp. after opening modals/menus)?

**2.4.4 Link Purpose (In Context) [A]** — Link purpose clear from text or its context (avoid bare
"click here"/"read more" when ambiguous).

**2.4.5 Multiple Ways [AA]** — More than one way to find pages (nav + search/sitemap), unless a page is
a step in a process.

**2.4.6 Headings and Labels [AA]** — Headings and labels are descriptive.

**2.4.7 Focus Visible [AA]** — Keyboard focus indicator is always visible. *Test:* tab everywhere;
never lose the focus ring. *Common fail:* `outline:none` with no replacement.

**2.4.11 Focus Not Obscured (Minimum) [AA] (2.2)** — Focused element is not entirely hidden by
sticky headers/footers/overlays. *Test:* tab to items near a sticky bar; is the focused item at least
partly visible?

**2.5.1 Pointer Gestures [A]** — Multipoint/path-based gestures have a single-pointer alternative.
**2.5.2 Pointer Cancellation [A]** — Actions fire on up-event / are abortable, not on down-event.
**2.5.3 Label in Name [A]** — A control's accessible name contains its visible label text (voice
control). **2.5.4 Motion Actuation [A]** — Device-motion features (shake/tilt) have a UI alternative
and can be disabled.

**2.5.7 Dragging Movements [AA] (2.2)** — Any drag operation has a non-drag (single-pointer)
alternative (e.g. reorder via buttons, slider via arrows). *Test:* sliders, sortable lists, drag-drop.

**2.5.8 Target Size (Minimum) [AA] (2.2)** — Pointer targets ≥ **24×24 CSS px**, or have ≥ 24px
spacing, or an equivalent alternative exists. *Test:* small icon buttons, close "×", inline links.

## Principle 3 — Understandable

**3.1.1 Language of Page [A]** — `<html lang>` set correctly. **3.1.2 Language of Parts [AA]** —
`lang` on foreign-language passages.

**3.2.1 On Focus [A]** — Focusing an element doesn't trigger an unexpected context change. **3.2.2 On
Input [A]** — Changing a setting doesn't auto-submit/navigate without warning. **3.2.3 Consistent
Navigation [AA]** — Repeated nav is in a consistent order across pages. **3.2.4 Consistent
Identification [AA]** — Same-function components are labelled consistently.

**3.2.6 Consistent Help [A] (2.2)** — Help mechanisms (contact, chat, self-help) appear in a
consistent relative location across pages that have them.

**3.3.1 Error Identification [A]** — Input errors are identified in text and the field described.
**3.3.2 Labels or Instructions [A]** — Fields have visible labels/instructions (placeholder ≠ label).
**3.3.3 Error Suggestion [AA]** — When known, suggest a correction. **3.3.4 Error Prevention (Legal,
Financial, Data) [AA]** — For legal/financial/data submissions: reversible, checked, or confirmed.

**3.3.7 Redundant Entry [A] (2.2)** — Don't force re-entering info already provided in the same process
(auto-populate or offer to reuse). *Test:* multi-step checkout/forms.

**3.3.8 Accessible Authentication (Minimum) [AA] (2.2)** — No cognitive-function test (remembering/
transcribing/solving a puzzle) required to log in, unless an alternative or a mechanism exists
(e.g. password managers not blocked, copy-paste allowed, passkeys, email link). *Test:* login/2FA
flow; is paste blocked? is there a non-puzzle path?

## Principle 4 — Robust

**4.1.2 Name, Role, Value [A]** — All UI components (esp. custom/ARIA widgets) expose a correct
accessible **name, role, state, and value**, and updates are communicated. *Test:* accessibility tree
+ screen reader on every custom control. *Common fail:* `<div>` "buttons" with no role/keyboard, wrong
ARIA, missing state (`aria-expanded`, `aria-checked`).

**4.1.3 Status Messages [AA]** — Status updates (added to cart, form errors, search results count) are
announced without moving focus, via `role="status"`/`aria-live`. *Test:* screen reader hears the update.

---

## Fast triage order (highest-impact first)

1. **Keyboard operability & traps** (2.1.1, 2.1.2) — a trap or unreachable control blocks whole flows.
2. **Focus visible & not obscured** (2.4.7, 2.4.11) — invisible focus makes keyboard use impossible.
3. **Name/Role/Value on custom widgets** (4.1.2) — silent or mislabelled controls block SR users.
4. **Form labels, errors, status** (3.3.1–3.3.3, 3.3.7, 4.1.3) — where conversions/tasks fail.
5. **Contrast** (1.4.3, 1.4.11) — high-volume, easy to fix, easy to prove.
6. **Structure**: headings, landmarks, lang, page title, skip link (1.3.1, 2.4.1, 2.4.2, 3.1.1).
7. **Media** captions/transcripts (1.2.x) — often entirely missing.
8. **2.2 additions** (2.5.7, 2.5.8, 3.3.8, 2.4.11, 3.2.6, 3.3.7) — commonly overlooked on older sites.

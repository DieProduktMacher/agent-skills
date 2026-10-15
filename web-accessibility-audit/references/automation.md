# Automation strategy: maximise agent-driven testing, minimise human effort to answering questions

The old split was "automated vs manual". That framing is wrong. The real variable is **whether the
agent can drive a real browser and use vision.** A static scanner touches ~30–40% of success criteria.
An agent that drives Chromium (Playwright), inspects the accessibility tree, and *looks* at
screenshots can meaningfully test the large majority of A/AA criteria — reducing the human to
**answering targeted questions**, not performing procedures.

**Honest ceiling (be precise about this):**
- **~65–75% of A/AA criteria** → a browser-driving harness can reach a **high-confidence automated
  verdict** (`scripts/live-scan/run-audit.mjs`).
- **~10–20% more** → the harness can't decide alone, but a **multimodal agent** (screenshots + the
  page's own text/DOM + reasoning) can reach a **provisional verdict** that a human only needs to
  confirm, not investigate.
- **~10–15% is irreducibly human** (or needs real assistive tech): screen-reader announcement
  *quality*, caption *accuracy*, audio-description adequacy, sign-language/Leichte-Sprache correctness,
  seizure-level flashing certainty, cognitive load, and the legal sign-off. Automation informs these;
  it does not settle them.

Automated/agent judgement is **not** a certified conformance statement (e.g. BITV-Test). It is a
rigorous, mostly-automated pre-assessment plus a short human-confirmation list. Keep that caveat in
the verdict.

## Three tiers

- **AUTO** — the harness decides programmatically with high confidence. No human needed.
- **AGENT+VISION** — the harness captures evidence (screenshot, DOM extract, a11y-tree node) and an
  agent with vision resolves it. Emitted provisionally; a human confirms only if the agent is unsure.
- **CONFIRM/HUMAN** — bubbled up as a one-tap **question** with the agent's recommended answer and the
  evidence attached. This is the only thing a human does.

## Tier map — every procedure → how it's automated

| Procedure / criterion | Tier | How |
|---|---|---|
| 1.1.1 alt **presence** | AUTO | DOM: img without alt, unnamed svg/role=img |
| 1.1.1 alt **quality** (does it convey the image?) | AGENT+VISION | agent compares screenshot of image to its alt text |
| 1.2.2/1.2.4 captions **present** | AUTO | `<track kind=captions>` / player API |
| 1.2.x caption **accuracy**, audio description adequacy | HUMAN (semi: Whisper transcript vs track) | listen/verify |
| 1.3.1 structure (headings, landmarks, lang, title, tables) | AUTO | DOM + a11y tree |
| 1.3.3 sensory-only instructions | AGENT+VISION | agent reads on-page text for "click the round green button" patterns |
| 1.3.4 orientation lock | AUTO | emulate portrait/landscape, diff |
| 1.3.5 input purpose | AUTO | `autocomplete` tokens on personal-data fields |
| 1.4.1 use of colour (only cue?) | AGENT+VISION | agent greyscales screenshot, judges if state still distinguishable |
| 1.4.3 text contrast (solid bg) | AUTO | axe's built-in color-contrast rule (in `axePass`) |
| 1.4.3 contrast over **images/gradients** | AUTO, escalates when unclear | `contrastPass`: detects text over CSS `background-image` AND over stacked `<img>/<picture>/<video>` elements (elementsFromPoint sampling — catches React/Next.js hero-image patterns, not just CSS backgrounds); pixel-samples via `lib.mjs`; only asks when the background is too busy or the ratio is within 0.3 of the threshold. **Known limit:** if neither pattern matches (e.g. an SVG-based background, a canvas-rendered hero), candidates=0 silently — treat zero candidates as "not tested for this pattern", not "clean". |
| 1.4.4 resize / 1.4.10 reflow | AUTO | 320px / 400% viewport, detect horizontal scroll |
| 1.4.5 images of text | AGENT+VISION | agent inspects images for rendered text |
| 1.4.12 text spacing | AUTO | inject WCAG spacing CSS, detect clipping |
| 1.4.13 content on hover/focus | AUTO for `aria-describedby`-linked popups; **escalated** otherwise | `hoverFocusPass`: fully scripts dismiss/persist only when it can poll the popup via `aria-describedby`. Triggers using `aria-haspopup`/`title`/`data-tooltip` without that link are real candidates it found but can't script-verify — these are surfaced as `humanConfirmations` (capped at 5, rest noted as a `warn`), not silently dropped. |
| 2.1.1 keyboard reachability | AUTO | Tab-walk vs interactive-element census |
| 2.1.2 keyboard trap | AUTO | Tab-walk stall/cycle detection |
| 1.4.2 native `<audio>/<video autoplay>` without controls | AUTO | `audit_static_html.py`: HTML `autoplay` attribute check |
| 2.2.2 JS/CSS-driven carousel auto-advance without pause control | AUTO, escalates when inconclusive | `carouselPausePass`: observes candidate carousels for 6s to confirm genuine auto-advance before judging; escalates only structures that didn't visibly change in the window |
| 2.3.1 flashing >3/s | HUMAN (semi: frame-luminance analysis) | perceptual certainty |
| 2.4.1 skip link / bypass | AUTO | first-tab-stop + landmark check |
| 2.4.2 page title | AUTO | `document.title` |
| 2.4.3 focus order | AUTO | tab sequence vs geometric order |
| 2.4.4/2.4.6 link/heading text **present** | AUTO | DOM |
| 2.4.4/2.4.6 link/heading **descriptiveness** | AGENT+VISION | LLM judges "read more"/ambiguous text |
| 2.4.7 focus visible | AUTO | screenshot diff focused vs unfocused (`pixelDiffFraction`) |
| 2.4.11 focus not obscured | AUTO | `elementFromPoint` at focused centre |
| 2.5.1/2.5.2 pointer gestures/cancellation | AUTO(partial) | detect path/multipoint handlers, down-event firing |
| 2.5.3 label in name | AUTO | a11y-tree name ⊇ visible text (`nameContainsVisible`) |
| 2.5.4 motion actuation | AUTO(partial) | detect deviceorientation/motion listeners + UI alt |
| 2.5.7 dragging alternative | AGENT+VISION | detect drag handlers; agent confirms non-drag path exists |
| 2.5.8 target size | AUTO | bounding-box + nearest-neighbour spacing (`evaluateTargetSize`) |
| 3.1.1/3.1.2 language | AUTO | `lang` attributes |
| 3.2.1/3.2.2 on focus/input context change | AUTO(partial) | focus/change → detect navigation/submission |
| 3.2.3/3.2.4 consistent nav/identification | AUTO | cross-page DOM comparison |
| 3.2.6 consistent help | AUTO | help element position across pages |
| BFSG statement / feedback link **existence** | AUTO (existence only) | `legalLinksPass`: text/href pattern match for a statement or contact/feedback link — content adequacy is still G23/G24 |
| 3.3.1/3.3.3 error **identification/text** | AUTO | submit invalid, detect error text + `aria-describedby` |
| 3.3.1/3.3.3 error **helpfulness** | AGENT+VISION | LLM judges if the message tells the user how to fix it |
| 3.3.2 labels present | AUTO | control has programmatic label |
| 3.3.4 error prevention (legal/financial) | AGENT+VISION | agent checks for review/confirm/undo step in flow |
| 3.3.7 redundant entry | AUTO | flow mode: re-requested data across steps |
| 3.3.8 accessible auth (paste blocked) | AUTO | dispatch paste to password field |
| 4.1.2 name/role/value | AUTO | accessibility-tree walk for unnamed interactive nodes |
| 4.1.3 status messages | AUTO(partial) | detect `aria-live`/`role=status` on dynamic updates |
| **AT — screen-reader announcement quality & reading order** | HUMAN or real-AT automation | see below |

Everything marked AUTO or AUTO(partial) is implemented (or scaffolded) in `run-audit.mjs`.

## The agent workflow (what "human only answers questions" looks like)

1. **Run the harness** (`node run-audit.mjs <url>` or `--flow flow.json`). It drives the browser, runs
   every AUTO check, and writes `audit-report/*.json` + screenshots. Output has three buckets:
   `results` (pass/fail/warn) and `humanConfirmations` (the questions).
2. **Agent resolves AGENT+VISION items itself.** For each confirmation that has a screenshot/evidence,
   the agent *looks* and decides — e.g. opens the reduced-motion screenshot and sees the carousel still
   spinning → marks 2.2.2 fail; reads the alt text against the image → marks 1.1.1 quality pass. Only
   if the agent is genuinely unsure does the item survive to step 3.
3. **Ask the human the residue — in the same question format as SKILL.md's Step 0 scoping questions,
   never as procedures.** Work through
   `guided-review.md` (stations G1–G25): each surviving item is a single tappable question with options
   **and the agent's recommended answer** plus the evidence, e.g.:
   > *"The 'Jetzt kaufen' button's focus ring was hard to detect on the dark hero (screenshot). Is the
   > focus indicator clearly visible to you? [Yes] [No] [Show me again] — my read: **borderline, lean
   > No**."*
   Batch these; present with the interactive options tool, exactly as Step 0's questions were presented.
   The human taps; they never open NVDA or count heading levels.
4. **Compile the report** (`report-template.md`) from AUTO results + agent resolutions + human answers —
   the finished audit is this merge, not the automated pass alone and not the questions alone.
   Mark anything still unconfirmed as **Not tested**, never Pass.

## Getting the screen-reader layer automated too

The accessibility **tree** (names/roles/states) is fully inspectable via `page.accessibility.snapshot()`
— that's the objective majority of what a screen reader conveys, and the harness audits it (4.1.2).
What the tree does **not** capture is announcement *timing/order/verbosity* and real AT quirks. Options,
in increasing fidelity:

- **`page.accessibility.snapshot()`** (built in) — objective name/role/state audit. AUTO. *(Included.)*
- **`virtual-screen-reader`** (npm, `@guidepup/virtual-screen-reader`) — simulates SR output from the
  a11y tree in a normal browser/CI; assert on what *would* be announced. No real SR needed. Good CI fit.
- **`@guidepup/playwright`** — drives **real NVDA (Windows) and VoiceOver (macOS)** programmatically and
  captures the actual spoken output. Highest fidelity; needs a Windows/macOS runner. This closes most
  of the remaining AT gap in an automated pipeline.

Recommended: harness a11y-tree audit for every run; add `virtual-screen-reader` assertions on key
components in CI; run `@guidepup` on the critical journey when a Windows/macOS runner is available.
Even then, keep one human spot-check of the flagship flow — real users surface things no tool does.

## What stays human (and why — don't pretend otherwise)

Caption/transcript accuracy against the actual audio; audio-description adequacy; sign-language and
Leichte-Sprache correctness; whether flashing is genuinely seizure-inducing; cognitive load for the
intended audience; the validity of a disproportionate-burden claim; and the final **legal conformance
sign-off / certified BITV-Test**. The harness gets you a defensible, mostly-automated pre-assessment
and a short question list — not a certificate.

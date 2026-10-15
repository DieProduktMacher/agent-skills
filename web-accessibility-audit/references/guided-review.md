# Guided review: the human-answerable residue (stations G1–G25)

Everything a browser harness can't decide, turned into a **guided, one-question-at-a-time workflow**.
Each station has: **What/why** (plain intro), **How** (exactly how to look), and a **Question** with
**options** and how each answer scores. The agent presents one station at a time (use the interactive
options tool), records the answer, and moves on — the human never runs a procedure, only answers.

## How to run this — de-duplication contract (read this first)
**Before asking ANY station's question, check whether `run-audit.mjs`'s `results` array already
contains a Pass/Fail/warn for that success criterion.** If it does, use that result directly — do
**not** re-ask a question the harness already answered. Heading order (1.3.1), solid-background text
contrast (1.4.3, via axe), hover/focus dismiss/persist (1.4.13), target size (2.5.8), label-in-name
(2.5.3), keyboard reachability/traps (2.1.1/2.1.2), focus visibility/obscuring (2.4.7/2.4.11), and
structural basics (title/lang/skip-link: 2.4.2/3.1.1/2.4.1) are **all already computed automatically**
— the stations below cover only what the harness genuinely cannot decide.

1. Start from `run-audit.mjs`'s `results` (auto verdicts — use directly, never re-ask) and
   `humanConfirmations` (items the harness already narrowed to a specific screenshot/estimate —
   resolve or confirm those, don't restart from a blank station).
2. **Skip stations whose subject doesn't exist** (no video → skip media stations; mark *Not present*).
3. For any remaining station tagged **(vision)**, resolve it yourself from the screenshot/DOM the
   harness captured — only escalate to the human if you're genuinely uncertain, not by default.
4. Ask the human only what's left, using the **same tappable-question format as SKILL.md Step 0**:
   the question, its options, and your recommended answer stated up front — never a paragraph asking
   the human to describe or investigate something themselves.
5. Record each result as **Pass / Fail / Not present / Not tested** and carry it into the report — the
   final audit is the combination of the automated results and these tapped answers, not either alone.
6. Tag confidence: `auto` (from harness), `agent` (you resolved from evidence), `human` (user answered).

Legend: **[A]/[AA]** level · **(vision)** = agent can usually pre-answer from a screenshot · **(human)**
= needs human perception/judgement/real AT · **(legal)** = needs a person, not a tool.

## Grounding contract (equally not optional)
Resolving a **(vision)** station means you looked at a screenshot, extracted DOM/text, or otherwise
obtained real evidence *from the specific site under audit* and judged that. It does not mean reasoning
from what sites like this typically look like. "This is probably fine" is not a resolution — mark that
station **Not tested**, not Pass, if you genuinely have no evidence to look at (e.g. `run-audit.mjs`
wasn't run, or a screenshot failed to capture). Zero questions reaching the human on a real site with
images or forms is unusual, not a sign of quality — see SKILL.md Step 3's sanity-check requirement
before treating that as a finished audit.

---

## Section A — Images & text alternatives

**G1 · Alt-text quality — 1.1.1 [A] (vision)**
*What:* the harness confirms alt *exists*; this confirms it conveys the same information as the image.
*How:* look at each informative image beside its alt text. Decorative images should have empty `alt`.
*Q:* "Does the alt text convey the same information/purpose as the image?"
Options: `Yes, equivalent` → Pass · `Partly / generic (e.g. filename)` → Fail · `Decorative, alt empty` → Pass · `Decorative but has alt text` → Fail (should be empty).

**G2 · Images of text — 1.4.5 [AA] (vision)**
*What:* real text must be used instead of pictures of text (logos excepted).
*How:* scan for headings/buttons/banners that are actually images containing text.
*Q:* "Is any meaningful text presented as an image (not a logo)?"
Options: `No` → Pass · `Yes` → Fail · `Only logos` → Pass.

## Section B — Colour & visual distinction

> **Contrast is mostly automated now.** Solid-background text contrast (1.4.3) is caught by axe's
> built-in color-contrast rule inside axePass — already in `results`, don't re-ask. Text over
> images/gradients is computed by `contrastPass` via real pixel sampling; it only reaches you as a
> `humanConfirmations` item when the background is too busy to trust a single number or the ratio is
> right at the legal threshold — the estimate and a screenshot are attached, so you're confirming a
> specific number, not measuring from scratch.

**G3 · Use of colour — 1.4.1 [A] (vision)**
*What:* colour must not be the *only* way to convey meaning (links, errors, required fields, chart series).
*How:* view the greyscale screenshot the harness saved (or emulate greyscale). Look for info that vanishes.
*Q:* "In greyscale, is any information still distinguishable without colour?"
Options: `Yes, other cues present` → Pass · `No — colour is the only cue somewhere` → Fail.

**G4 · Non-text/icon contrast on components — 1.4.11 [AA] (vision)**
*What:* icon glyphs and chart/graph elements need ≥3:1 — not covered by axe's text-contrast rule or
by contrastPass (which only samples text nodes).
*How:* look at icon buttons and chart elements against their surroundings.
*Q:* "Are meaningful icons/chart elements distinguishable from their background (≥3:1)?"
Options: `Yes` → Pass · `No, some too faint` → Fail · `None present` → Not present.

## Section C — Media (skip entirely if the site has no audio/video)

**G5 · Audio-/video-only alternative — 1.2.1 [A] (human)**
*What:* audio-only needs a transcript; video-only (no sound) needs a transcript or audio description.
*How:* find the alternative; skim it against the media.
*Q:* "Is an accurate text/audio alternative provided for audio-only / video-only content?"
Options: `Yes` → Pass · `Missing` → Fail · `Present but inaccurate/incomplete` → Fail.

**G6 · Caption accuracy — 1.2.2 [A] / live 1.2.4 [AA] (human)**
*What:* whether a captions `<track>` exists at all is caught by axe's built-in `video-caption`/
`audio-caption` rules (in `axePass` — a missing track is already a `results` fail; don't re-ask
existence). What's left is genuinely human: captions can be *present* and still wrong — auto-captions
routinely mangle names/technical terms and miss speaker changes and meaningful non-speech sound.
*How:* play 2–3 minutes with sound off; read the captions; spot-check against the audio.
*Q:* "(If a track exists) are the captions accurate, incl. speaker/sound cues?"
Options: `Accurate` → Pass · `Inaccurate` → Fail · `No track (see axe result)` → Not this station's job.

**G7 · Audio description — 1.2.3 [A] / 1.2.5 [AA] (human)**
*What:* video with meaningful visuals needs audio description (or a full media alternative).
*How:* watch with the screen off — is key visual information spoken or otherwise conveyed?
*Q:* "Is important visual information available without seeing the screen?"
Options: `Yes (AD or narration covers it)` → Pass · `No` → Fail · `No essential visual info` → Pass.

**G8 · (Public sector) Leichte Sprache & DGS — BITV 2.0 (human/legal)**
*What:* German public-sector sites must offer key information in **Leichte Sprache** (easy-read) and
**Deutsche Gebärdensprache** (sign-language video).
*How:* locate the Leichte-Sprache page and the DGS video; check they cover the mandated core content.
*Q:* "Are compliant Leichte-Sprache and DGS versions of core content provided?"
Options: `Both present & adequate` → Pass · `One missing/inadequate` → Fail · `Not a public body` → Not present.

## Section D — Meaning & language of content

**G9 · Sensory instructions — 1.3.3 [A] (vision)**
*What:* instructions must not rely on shape/size/position/colour/sound alone ("the round green button on the right").
*How:* read on-page instructions and error/help text.
*Q:* "Do any instructions rely only on sensory characteristics?"
Options: `No` → Pass · `Yes` → Fail.

**G10 · Link & heading descriptiveness — 2.4.4 / 2.4.6 [A/AA] (vision)**
*What:* link text and headings must make sense out of context (avoid bare "click here"/"read more"; vague headings).
*How:* read the harness's extracted list of link texts and headings on their own.
*Q:* "Are link texts and headings descriptive out of context?"
Options: `Yes` → Pass · `Some ambiguous` → Fail.

**G11 · Language of parts — 3.1.2 [AA] (vision)**
*What:* foreign-language passages need their own `lang` so screen readers pronounce them correctly.
*How:* find notable foreign-language quotes/sections; check for `lang` on them.
*Q:* "Are foreign-language passages marked with the correct `lang`?"
Options: `Yes / none present` → Pass · `No` → Fail.

## Section E — Interaction alternatives (confirm what the harness couldn't operate)

**G12 · Pointer gestures — 2.5.1 [A] (human)**
*What:* multipoint/path gestures (pinch-zoom, swipe-path) need a single-pointer alternative.
*How:* try any map/slider/carousel that uses gestures with simple taps/clicks + buttons.
*Q:* "Does every complex gesture have a simple single-pointer alternative?"
Options: `Yes` → Pass · `No` → Fail · `No such gestures` → Not present.

**G13 · Dragging alternative — 2.5.7 [AA] (vision/human)**
*What:* any drag operation (reorder, sliders, seat maps, kanban) needs a non-drag alternative.
*How:* the harness flags drag handlers; confirm buttons/steppers/arrow-keys can do the same task.
*Q:* "Can each drag action be done without dragging?"
Options: `Yes` → Pass · `No` → Fail · `No dragging on site` → Not present.

**G14 · Residual keyboard operability — 2.1.1 [A] (human)**
*What:* confirm anything the harness couldn't operate (custom widgets, canvas, embeds) works by keyboard.
*How:* mouse away; Tab to and operate each control the harness listed as uncertain.
*Q:* "Is every remaining interactive control operable by keyboard?"
Options: `Yes` → Pass · `No` → Fail.

> Content on hover/focus is now fully automated: hoverFocusPass scripts the hover-then-Escape-then-re-hover sequence directly and writes a 1.4.13 result. Nothing to ask here.

## Section F — Forms & error judgement

**G15 · Error-message helpfulness — 3.3.1 / 3.3.3 [A/AA] (vision)**
*What:* the harness confirms errors are shown & associated; this confirms they *tell the user how to fix it*.
*How:* read the error text from a failed submit ("Enter a date as DD.MM.YYYY", not just "Invalid").
*Q:* "Do error messages explain how to correct the problem?"
Options: `Yes, specific` → Pass · `Generic/unhelpful` → Fail.

**G16 · Error prevention (legal/financial/data) — 3.3.4 [AA] (human)**
*What:* submissions with legal/financial/data consequences must be reversible, checked, or confirmed.
*How:* on the final commit (purchase, delete account), look for review/undo/confirmation.
*Q:* "Is the final commit reversible, checked, or confirmed before it takes effect?"
Options: `Yes` → Pass · `No` → Fail · `No such submissions` → Not present.

## Section G — Motion & safety

**G17 · Reduced-motion response — 2.3.3/2.2.2 [A] / best practice (vision)**
*What:* with `prefers-reduced-motion`, large/auto animation should stop or reduce. **Separately**,
whether an auto-advancing carousel/ticker has a pause/stop control at all (2.2.2's actual core
requirement) is now checked automatically by `carouselPausePass` — it observes the page for 6 seconds
to confirm genuine auto-advance before judging, and only escalates here when that observation was
inconclusive (didn't visibly change in the window — could be a slower interval). Use that harness
result directly for pause-control presence; this station is about the reduced-motion *response*
specifically.
*How:* view the harness's reduced-motion screenshot vs default.
*Q:* "With reduced-motion on, are big/auto animations reduced or stopped?"
Options: `Yes` → Pass · `No, still animating` → Fail · `No animation` → Not present.

**G18 · Flashing / seizure risk — 2.3.1 [A] (human)**
*What:* nothing may flash more than 3×/second (seizure risk). Tools estimate; a human confirms perceptually.
*How:* watch any flashing/strobing/rapid video for one second — count flashes.
*Q:* "Does anything flash more than 3 times per second?"
Options: `No` → Pass · `Yes` → Fail (Critical) · `Nothing flashes` → Not present.

## Section H — Cognitive & comprehension (supports 3.x; partly beyond AA)

**G19 · Cognitive load & consistency — supports 3.2.x/3.3.x (human)**
*What:* consistent patterns, plain language, clear steps, no unnecessary complexity. Beyond strict AA but
part of real accessibility and public-sector expectations.
*How:* walk a core task as a first-time user; note confusing labels, jargon, surprising behaviour.
*Q:* "Is the core task understandable and predictable for a non-expert / cognitively-diverse user?"
Options: `Clear` → Pass · `Some friction` → Note · `Confusing` → Fail (usability).

## Section I — Screen-reader experience (beyond the automated a11y-tree audit)

**G20 · SR announcement quality on a key page — 4.1.2 [A] (human/real-AT)**
*What:* the a11y-tree audit checks names/roles exist; a real screen reader confirms they're *announced
usefully* in a sensible order.
*How:* with NVDA+Firefox or VoiceOver+Safari, read the page top to bottom (see AT1/AT2 in
`manual-testing.md`). Or run `@guidepup` to capture the spoken output automatically.
*Q:* "On the key page, is every control announced with a useful name/role/state, in a logical order?"
Options: `Yes` → Pass · `Some unclear/misordered` → Fail · `Not tested` → Not tested.

**G21 · SR completion of the critical journey — F4 [A] (human/real-AT) — the acid test**
*What:* can a screen-reader user complete the whole task (buy the ticket) non-visually?
*How:* monitor off / eyes closed, complete the journey end to end with the screen reader.
*Q:* "Was the critical journey completable non-visually, start to success?"
Options: `Yes` → Pass · `No — got stuck` → Fail (Critical, whole-process) · `Not tested` → Not tested.

**G22 · Dynamic updates announced — 4.1.3 [AA] (human/real-AT)**
*What:* "added to cart", result counts, validation errors must be spoken without moving focus (live regions).
*How:* trigger the update with the screen reader running; listen.
*Q:* "Are important dynamic status changes announced by the screen reader?"
Options: `Yes` → Pass · `No, silent` → Fail · `No dynamic updates` → Not present.

## Section J — Legal & process (required for compliance, not just WCAG)

**G23 · Accessibility statement — BFSG §14/Anlage 3 · BITV (legal)**
*What:* a published statement is legally required: conformance status, known barriers + reasons, date,
feedback channel (and, for public bodies, enforcement/conciliation links).
*How:* find the statement; check each required element is present and current.
*Q:* "Is a complete, current accessibility statement published?"
Options: `Yes, complete` → Pass · `Present but incomplete/outdated` → Fail · `Absent` → Fail (independent compliance gap).
*If Fail/Absent:* generate one from `references/accessibility-statement.md` (BITV § A for public bodies, BFSG § B for private services), filling known barriers from the report.

**G24 · Accessible feedback mechanism — BFSG · BITV (legal)**
*What:* users must be able to report barriers and get a response through an accessible channel.
*How:* find the feedback route; confirm it's itself accessible (not a broken/inaccessible form).
*Q:* "Is there a working, accessible way to report accessibility problems?"
Options: `Yes` → Pass · `Present but inaccessible` → Fail · `None` → Fail.

**G25 · Disproportionate-burden claim — BFSG Anlage 4 (legal)**
*What:* if the provider claims relief from any requirement, it must be documented and justified against
the statutory criteria — it is not a blanket exemption.
*How:* if such a claim exists, check the written justification and assessment.
*Q:* "If a disproportionate-burden claim is made, is it documented and justified?"
Options: `Yes / no claim made` → Pass · `Claimed but not justified` → Fail.

> **Scope & applicability (BFSG §1/§3) is derived, not asked as a station.** Whether the service is
> in scope (covered B2C service; not micro-enterprise-exempt) is fully determined by the sector/
> org-size/market answers already collected in SKILL.md Step 0 — asking it again here would be
> redundant. Reconcile programmatically: public-sector or B2C service, not micro-exempt → **in scope**,
> full obligations. B2C AND micro-enterprise (<10 staff, ≤€2M) → **service exemption** (note reduced
> obligations; products they place on the market are still in scope). Pure B2B/internal → **out of
> legal scope**, frame findings as best-practice only. State the determination in the report's legal-
> requirements section directly.

---

## Output
Fold every station result into the report's *Missed criteria* / *Process findings* tables and the
coverage tally. Stations answered "Not tested" stay **Not tested** — never Pass. The legal stations
(G23–G25) feed the report's *Accessibility statement status* and *Overall verdict* sections directly.

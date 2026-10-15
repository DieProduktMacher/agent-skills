# WCAG 2.2 Level AAA checklist — the 31 criteria beyond A+AA

**Use this file only when Step 0's target level is AAA.** It is additive: AAA conformance requires
**all 55 A+AA criteria** in `references/wcag-checklist.md` **plus these 31**, all passing — nothing
here replaces that checklist. This list is verified against the W3C's WCAG 2.2 Quick Reference
(31 A + 24 AA + 31 AAA = 86 active criteria); if your tally doesn't reach 31 assessed-or-explicitly-
skipped here, something was missed.

**Read this before auditing to AAA:** the W3C itself does not recommend requiring AAA conformance for
entire sites — several criteria are impossible to satisfy for some content by design (e.g. sign-language
video for *all* audio, or a strict reading-level cap on inherently technical/legal text), and few real
sites achieve full AAA. No law referenced in `references/legal.md` requires AAA. Treat a full-site AAA
target as unusual and confirm the user actually wants that scope, not just "as accessible as possible"
(which AA + good judgement already covers for nearly all practical purposes).

**Automation reality check:** most AAA criteria are inherently human/editorial judgement — content
strategy, translation quality, reading level — not something a scanner or pixel-sampler can decide.
Where a criterion is genuinely automatable, it's marked **(auto)**; most are marked **(human)**.

---

## Principle 1 — Perceivable

**1.2.6 Sign Language (Prerecorded) (human)** — Sign-language interpretation is provided for all
prerecorded audio content in synchronized media. *Test:* does a SL interpreter track/window exist for
every video with audio?

**1.2.7 Extended Audio Description (Prerecorded) (human)** — Where pauses in dialogue are too short
for standard audio description to convey the visual content, extended AD (pausing the video) is
provided. *Test:* for video with dense simultaneous dialogue and essential visuals, is there an
extended-AD version?

**1.2.8 Media Alternative (Prerecorded) (human)** — A full text alternative (transcript-equivalent) is
provided for all prerecorded synchronized media and video-only media, not just an AD track. *Test:*
does a complete text version exist for each video, describing both audio and visual content?

**1.2.9 Audio-only (Live) (human)** — Live audio-only content (e.g. a live radio-style stream) has a
text alternative presenting equivalent information. *Test:* is live audio-only content transcribed in
real time or otherwise textually represented?

**1.3.6 Identify Purpose (auto-assisted / human)** — The purpose of UI components, icons, and regions
can be programmatically determined (beyond A/AA's narrower Identify Input Purpose). *Test:* do
icons/regions carry machine-readable purpose (ARIA landmarks/roles, microdata), not just visual cues?

**1.4.6 Contrast (Enhanced) (auto)** — Text contrast ≥ **7:1** (≥ 4.5:1 for large text) — stricter than
AA's 4.5:1/3:1. *Test:* re-run the same contrast measurement used for 1.4.3 (harness `contrastPass` /
axe) against the 7:1/4.5:1 thresholds instead.

**1.4.7 Low or No Background Audio (human)** — For prerecorded speech-only audio (not music/CAPTCHA),
background sound is absent, can be turned off, or is ≥20dB quieter than the speech. *Test:* listen —
is background audio negligible or controllable?

**1.4.8 Visual Presentation (human)** — For blocks of text, a mechanism exists (site or browser-level)
to let the user choose fg/bg colours, cap line width at ~80 characters, avoid full justification, set
generous line/paragraph spacing, and resize to 200% without horizontal scroll. *Test:* does such a
mechanism exist, or does the design already satisfy each sub-requirement by default?

**1.4.9 Images of Text (No Exception) (auto-assisted)** — Images of text are used *only* for pure
decoration or logos — no exceptions for "customizable" images of text (AA's 1.4.5 allows that
exception; AAA does not). *Test:* any remaining images-of-text at all, beyond logos?

## Principle 2 — Operable

**2.1.3 Keyboard (No Exception) (human)** — All functionality is keyboard-operable with **no**
exception for path-dependent input (AA's 2.1.1 allows an exception for things like freehand drawing).
*Test:* does anything require path-dependent pointer input with literally no keyboard equivalent?

**2.2.3 No Timing (human)** — No part of the content has an essential time limit, except non-interactive
synchronized media and genuine real-time events. *Test:* audit every timed interaction — can the time
limit be removed entirely, not just extended?

**2.2.4 Interruptions (human)** — Interruptions (notifications, alerts) can be postponed or suppressed
by the user, except genuine emergencies. *Test:* can non-emergency interruptions be silenced?

**2.2.5 Re-authenticating (human)** — If a session expires, the user can re-authenticate and continue
without losing their in-progress data. *Test:* let a session time out mid-form — is data preserved
across re-login?

**2.2.6 Timeouts (human)** — Users are warned about any inactivity timeout that could cause data loss,
unless data is preserved for 20+ hours regardless. *Test:* is a timeout warning shown with enough
lead time, or is data simply retained long enough that it's moot?

**2.3.2 Three Flashes (human)** — Nothing flashes more than 3×/second — **no exception** for staying
under the general/red flash thresholds (AA's 2.3.1 allows that exception). *Test:* stricter version of
the M8/G-flashing check — any flashing at all above 3/sec, threshold exception or not, fails AAA.

**2.3.3 Animation from Interactions (auto-assisted)** — Motion animation triggered by interaction
(not just page-load) can be disabled, unless essential. *Test:* with `prefers-reduced-motion` set, do
interaction-triggered animations (hover effects, transitions) also stop, not just autoplaying ones?

**2.4.8 Location (human)** — Information about the user's location within a set of pages is available
(breadcrumbs, site map highlighting, progress indicator). *Test:* can a user tell where they are in
the site's structure?

**2.4.9 Link Purpose (Link Only) (auto-assisted)** — Stricter than AA's 2.4.4: link purpose must be
clear from the link text **alone**, with no reliance on surrounding context. *Test:* read every link
text in isolation, no surrounding sentence — still clear?

**2.4.10 Section Headings (human)** — Section headings are used to organize content (beyond just
having *some* headings — AAA expects headings to structure the content thoroughly). *Test:* does every
substantial content section have an introducing heading?

**2.4.12 Focus Not Obscured (Enhanced) (auto)** — Stricter than AA's 2.4.11: **no part** of the
focused element may be hidden by author-created content (AA only requires "at least a portion"
visible). *Test:* same obscuring check as the harness's `focus:obscured`, but failing on *any*
overlap, not just full obscuring.

**2.4.13 Focus Appearance (auto-assisted)** — The focus indicator has a minimum area (≥2 CSS px solid
perimeter around the component, or an area ≥ the component's area at a 4px-thick outline) and ≥3:1
contrast against adjacent colours. *Test:* measure the actual focus-ring thickness/contrast, not just
"is something visible" (which is what AA's 2.4.7 requires).

**2.5.5 Target Size (Enhanced) (auto)** — Pointer targets ≥ **44×44 CSS px** (stricter than AA 2.5.8's
24×24), with the same exceptions (inline text, essential presentation, spacing, user-agent-controlled).
*Test:* re-run the harness's `targetSizePass` logic against a 44px threshold instead of 24px.

**2.5.6 Concurrent Input Mechanisms (human)** — Content doesn't restrict use to a single input
modality (e.g. doesn't disable keyboard just because a touchscreen is present). *Test:* switch input
methods mid-task — does the site keep working?

## Principle 3 — Understandable

**3.1.3 Unusual Words (human)** — A mechanism identifies definitions for words used in an unusual or
restricted way (idioms, jargon). *Test:* are unusual terms glossed (glossary link, inline definition)?

**3.1.4 Abbreviations (human)** — A mechanism identifies the expanded form of abbreviations. *Test:*
first-use expansion, `<abbr title>`, or a glossary for abbreviations?

**3.1.5 Reading Level (human)** — When text requires reading ability beyond lower-secondary education
and can't be simplified, supplementary content (summary, Leichte-Sprache-style version) is provided.
*Test:* for dense legal/technical passages, does a simplified alternative exist? (Directly relevant to
BITV's Leichte Sprache requirement — see `references/legal.md` and station G8.)

**3.1.6 Pronunciation (human)** — A mechanism identifies pronunciation for words where meaning is
ambiguous without it (e.g. heteronyms). *Test:* rare in practice; relevant mainly for poetry/names/
technical terms with ambiguous pronunciation.

**3.2.5 Change on Request (auto-assisted)** — Stricter than AA's 3.2.1/3.2.2: context changes
(navigation, new windows, focus shifts) happen **only** on explicit user request, with a way to turn
off any automatic ones. *Test:* audit every automatic context change on the page/flow — can each be
disabled or does it require a deliberate user action?

**3.3.5 Help (human)** — Context-sensitive help is available (not just a general help page — help
relevant to the specific field/step the user is on). *Test:* on a complex form field, is there
inline/contextual help, not just a generic FAQ link?

**3.3.6 Error Prevention (All) (auto-assisted)** — Stricter than AA's 3.3.4 (legal/financial/data
only): **every** form submission is reversible, checked, or confirmed — not just high-stakes ones.
*Test:* extend the M7/F3 error-prevention check to every submission on the site, not just checkout/
account actions.

**3.3.9 Accessible Authentication (Enhanced) (auto-assisted)** — Stricter than AA's 3.3.8: **no**
cognitive-function test at all, not even with an alternative available (AA permits a puzzle if an
alternative like a password manager exists; AAA requires no puzzle regardless, with a narrow exception
for object recognition/personal-content identification). *Test:* re-run the harness's `auth:paste`
check plus manual review — is there any puzzle/memory step, even an optional one?

---

## Coverage note
16 of these 31 have exact normative wording verified against the W3C WCAG 2.2 Quick Reference during
this file's creation; the remainder are described accurately from well-established public documentation
of stable, long-unchanged criteria. For a legal/contractual AAA claim, verify final wording against
[the W3C Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?levels=aaa) directly.

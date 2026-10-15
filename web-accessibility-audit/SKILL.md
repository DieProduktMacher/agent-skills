---
name: web-accessibility-audit
description: >-
  Sophisticated, jurisdiction-aware web accessibility (a11y) auditing for websites and web apps.
  Determines which laws apply (Germany's BFSG/BITV 2.0, the EU European Accessibility Act and Web
  Accessibility Directive via EN 301 549, plus US/UK/Canada regimes), maps them to the correct WCAG
  version and level, runs and interprets automated + manual + assistive-technology checks, and produces
  a precise conformance report (requirements, fulfilled criteria, missed criteria, prioritised
  remediation TODOs, accessibility statement). USE THIS whenever the user mentions accessibility, a11y,
  WCAG, "barrierefrei", BFSG, BITV, EAA, EN 301 549, Section 508, ADA, accessibility statement /
  Erklärung zur Barrierefreiheit, screen readers, color contrast, keyboard navigation, focus order,
  alt text, ARIA, an accessibility audit/scan/review, or asks whether a site is legally compliant —
  even without the word "audit". Prefer this over ad-hoc advice: a11y law is deadline- and
  jurisdiction-specific and easy to get subtly wrong.
---

# Web Accessibility Audit

Accessibility work fails in two predictable ways: people either quote the wrong legal standard for
the wrong jurisdiction, or they run one automated scanner and call it "compliant" — when automated
tools catch only ~30–40% of WCAG issues. This skill exists to avoid both. It ties the legal
requirement to the exact technical standard, then to a testing method that combines automated,
manual, and assistive-technology checks, and ends in an honest, prioritised report.

**Golden rule:** never assert that a site "is WCAG/BFSG/EAA compliant" on the basis of any automated
run alone. Automation proves the *presence* of failures and can reach high-confidence verdicts on most
criteria, but the legal conformance claim also needs the human-confirmation residue and the
accessibility statement. State clearly what was and was not tested, and at what confidence.

**Second golden rule — no orphan "manual checks required" lists, ever.** If you find yourself about to
write a bullet list of items labelled "requires manual verification," "medium confidence," or similar,
where each item wasn't *already* either (a) resolved by an automated pass with a Pass/Fail/Warn result,
or (b) turned into an actual question asked via the interactive options tool and answered — stop. That
list is not a valid output of this skill; it's a sign the workflow was skipped, not followed. There is
no third bucket between "automated" and "asked." Before writing `report.md`/`report.html`, every item
you plan to mention must have cleared one of those two paths — see the completeness gate in Step 3a.

**Third golden rule — `report.html` is always an edit of `templates/example-report.html`, never a new
file you write.** This is checked mechanically, not just followed: the template has a `TEMPLATE-ID`
comment at its top, and the file you present must still contain it verbatim. If you're about to
generate an HTML report and haven't just viewed and edited that specific file, you're about to fail
this check — see the exact procedure in Step 5.

## What decides how much can be automated: can the agent drive a browser?

This is the key fork — not "automated vs manual". Read `references/automation.md` for the full
strategy; in short:

- **Agent CAN drive a real browser** (Claude Code, a computer-use agent, or the user running the
  harness in CI/locally) → run `scripts/live-scan/run-audit.mjs <url>` (or `--flow flow.json`). It
  tests the large majority of A/AA criteria — keyboard operability, focus visibility/order/obscuring,
  reflow, text spacing, target size, label-in-name, the accessibility tree (name/role/state), text
  contrast (solid backgrounds via axe, images/gradients via real pixel sampling), hover/focus popup
  dismiss/persist, user preferences, paste-blocked auth — and emits a `humanConfirmations` list only
  for the genuine residue (busy backgrounds, near-threshold ratios, and true judgement calls). The agent then resolves the
  vision items itself from the captured screenshots, and the human only answers the small residue as
  tappable questions. This is the primary path — prefer it whenever a browser is reachable.
- **Only static input** (uploaded HTML, or a URL nothing can reach) → `scripts/audit_static_html.py`
  for offline structural checks; then hand the browser harness to the user to run and paste back. On
  static input alone, produce a **partial** automated result, and turn every remaining checkable item
  into an actual question asked via the interactive options tool — the exact same G-station mechanism
  as the browser path, sourced from `references/guided-review.md` and, for what a browser would
  normally check, `references/manual-testing.md`'s M1–M10/F1–F4 procedures reframed as questions (see
  the no-browser note in Step 3). **Never** a bullet list of "manual checks needed" or "uncertain" —
  that is the exact failure this skill exists to prevent, not an acceptable degraded output.
- **Linked PDFs or other documents** (invoices, tickets, brochures, e-books) → these are in scope under
  EN 301 549 Ch.10 and must be audited separately: run `scripts/audit_pdf.py <file>` and follow
  `references/pdf-accessibility.md` (PDF/UA + WCAG2ICT, stations P1–P8). A page can pass while its
  linked PDF fails.
- **Uploaded JSX/Vue/component source** → render to HTML first (`next build`, ReactDOMServer,
  Storybook static) and point the harness at it, or lint with `eslint-plugin-jsx-a11y`.

Everything automated feeds the report; the irreducibly-human residue (screen-reader announcement
quality, caption accuracy, seizure-level flashing, cognitive load, legal sign-off) is listed as such.

---

## Two audit modes — pages and flows

Every audit uses one or (ideally) both of these modes. They answer different questions:

**Mode A — Page audit (breadth).** Input: one or more URLs (or uploaded HTML). Each page is scanned
and manually tested in its initial state. Answers: *"are our templates and pages built accessibly?"*
Sample pages per WCAG-EM (see `references/manual-testing.md`), never just the homepage.

**Mode B — Flow audit (depth).** Input: a user journey — e.g. *buying a ticket: homepage → event →
seat selection → cart → checkout (incl. the error state) → payment → confirmation*. Every **state**
along the way is tested: opened modals, validation errors, dynamically loaded widgets, third-party
payment steps. Answers: *"can a user with a disability actually complete this task?"* This is what
WCAG conformance requirement #3 ("complete processes") demands: **one broken step breaks conformance
for the entire process**, no matter how good the other pages are — and it's where the legally riskiest
failures hide (a blocked checkout is a blocked service under BFSG/EAA).

When the user gives a flow, capture it as an explicit step list *with* the user: start URL, the action
per step, the expected result, and which error/edge states to include (empty-submit, invalid input,
sold-out, session timeout). Then: automated per-state scanning via `scripts/live-scan/run-flow.mjs`
(flow definition format in `flow.example.json`), and the manual **flow protocol** (F1–F4) in
`references/manual-testing.md`, culminating in completing the journey with a screen reader.

**Recommendation to give users:** Mode A across the sampled templates **plus** Mode B on the 1–3
business-critical journeys. If forced to choose one, choose Mode B for the most critical journey —
it finds the failures that actually block users and trigger liability.

## Workflow

### Step 0 — Scope the audit (ask, with options + a recommendation)

You cannot pick the right standard without knowing the target level, the jurisdiction, the
organisation, and the test mode. If any of the following is unclear from context, **ask the user** —
and when you ask, present concrete options and state your recommended default, so the user can just
confirm. Use the interactive question/options tool if one is available in this surface; otherwise ask
in prose with a short bulleted set of options. Ask only what you genuinely can't infer; batch related
questions. **Ask question 0 first, on its own, before anything else** — it's the one piece of scope
every other question and every downstream check depends on.

**This is the question format for the entire audit, not just Step 0.** Every human-facing question this
skill ever asks — these five scoping questions, the flow-capture questions later, and every guided-review
station in Step 3/4 — uses this exact same shape: a concrete question, a short set of mutually exclusive
tappable options, and your recommended answer stated up front. Someone who only sees Step 0 should be
able to predict exactly what every later question in the audit will look like.

**0. Target standard — WCAG version and conformance level (ask this first, independent of jurisdiction).**
   This is a deliberate, standalone choice — someone may want a stricter or lighter check than the law
   requires, or no legally-driven audit at all. Don't fold it into or infer it from the jurisdiction
   question below; ask it explicitly and let the answer stand on its own.
   Options:
   - *WCAG 2.2 Level AA (recommended)* — current best practice; a superset of the EU/DE legal minimum;
     future-proofs against EN 301 549 v4.1.1 (expected in the OJEU ~Oct 2026).
   - *WCAG 2.1 Level AA* — today's actual EU/DE legal minimum (EN 301 549 v3.2.1); pick this for a
     narrowly legal-compliance-only check.
   - *WCAG 2.2 Level AAA* — the strictest published level, all 31 criteria itemized in
     `references/wcag-checklist-aaa.md`; rarely fully achievable site-wide (some AAA criteria conflict
     with normal design), best used selectively or for specific high-stakes content, not as a blanket
     target, and expect it to lean heavily on manual/editorial judgement rather than automation.
   - *WCAG 2.0 Level AA* — older baseline, mainly relevant for legacy US Section 508 contexts.
   - *Level A only* — minimum baseline, a faster/lighter first pass, not sufficient alone for BFSG/EAA/
     BITV compliance.
   - *Not sure — use the jurisdiction's legal minimum* — defer entirely to whatever Step 1 determines
     once jurisdiction/sector are known (defaults to WCAG 2.1 AA for Germany/EU today).
   Whatever is chosen, record it as the explicit **target string** carried through the rest of the
   audit (Steps 2–5 and the report's §3) — e.g. *"Target: WCAG 2.2 AA (user-selected)"* or *"Target:
   WCAG 2.1 AA (jurisdiction default)"*. **Cross-check against the legal floor once it's known (Step
   1):** if the chosen level is *below* what the applicable law actually requires (e.g. the user picked
   Level A only but BFSG/BITV requires AA), say so plainly — the audit still runs at the requested
   level, but the report must flag that the legal minimum is not met by that scope and name the gap.

1. **Jurisdiction / market.** Where are the site's users / where is the service offered?
   Options: *Germany* · *Other EU country* · *UK* · *US* · *Canada* · *Global/multiple*.
   Recommendation: if the org is German or sells into Germany, treat **BFSG (DE)** as the floor and
   **EN 301 549 / EAA** as the EU-wide frame; add other regimes if they also serve those markets.
2. **What kind of site/service is it, and is a public body involved?**
   Options: *Public-sector / government-funded* · *Private B2C (e-commerce, banking, e-books,
   travel, telecoms, streaming…)* · *Private B2B only* · *Internal tool*.
   This decides **BITV 2.0 / Web Accessibility Directive** (public sector) vs **BFSG / EAA**
   (private consumer services) vs *likely out of legal scope but still best practice* (pure B2B/
   internal). See `references/legal.md`.
3. **Organisation size (for the BFSG micro-enterprise exemption).**
   Options: *<10 staff AND ≤€2M turnover/balance sheet* · *Larger* · *Not sure*.
   Micro-enterprises are exempt for **services** (not for products they place on the market). If
   "not sure", assume in-scope and say so.
4. **How testing will run.**
   Options: *An agent here can drive a browser (Claude Code / computer-use) → run the harness
   directly* · *I'll run the harness in my CI/locally and paste the JSON* · *I can only upload
   HTML/code (static analysis + you hand me scripts)*.
   Recommendation: if any environment can drive a browser, use `run-audit.mjs` — it collapses most of
   the manual protocol into automated checks + a short question list (see `references/automation.md`).
5. **Audit mode — pages, flows, or both** (see "Two audit modes" above).
   Options: *Page audit (I'll give URLs)* · *Flow audit (I'll describe a user journey)* · *Both
   (recommended)*.
   Recommendation: **both** — sample pages for breadth **and** at least one business-critical journey
   for depth. If the user picks/adds a **flow**, capture it explicitly before testing: the *start URL*,
   each *step* (the action taken and the expected result), and which *error/edge states* to include
   (empty-submit, invalid input, sold-out/out-of-stock, session timeout, declined payment). Turn that
   into a flow definition for `scripts/live-scan/run-flow.mjs` (schema in `flow.example.json`). If the
   user names a task but not the steps ("audit our ticket purchase"), propose a concrete step list and
   ask them to confirm/correct it rather than guessing silently.

Do not proceed to a verdict until target level, jurisdiction, sector, and audit mode are known.
Reasonable assumptions are fine as long as you state them explicitly in the report.

### Step 1 — Fix the applicable legal requirements

Read `references/legal.md` and determine the governing regime(s), deadlines, exemptions, the required
**accessibility statement** ("Erklärung zur Barrierefreiheit"), the enforcement body, and penalties.
Summarise this back to the user in a few sentences before testing — the legal frame determines what
"pass" even means.

### Step 2 — Fix the technical target

Read `references/standards.md`. Take the level chosen in **Step 0** as the audit target — don't
re-derive or override it here. Add any EN 301 549 clauses beyond WCAG that apply (e.g. clauses 5–13
for non-web ICT, or the "extra" web requirements), and reconcile against the legal floor from Step 1:
if Step 0's choice is at or above the legal minimum, the target string is simply the chosen level; if
it's below, keep the requested (lighter) scope for the audit itself but state the legal minimum
alongside it as a separate, unmet bar. Record the exact target string, e.g. *"Target: WCAG 2.2 Level AA
(user-selected) + EN 301 549 v3.2.1 web requirements; legal minimum: WCAG 2.1 AA — met."* or *"Target:
WCAG 2.0 Level A (user-selected, lighter than the legal minimum) + EN 301 549 v3.2.1 web requirements;
legal minimum: WCAG 2.1 AA — this audit's scope does not establish that."*

### Step 3 — Test (automation-first; human answers only the residue)

Read `references/automation.md` (strategy + tier map) and `references/tools.md` (catalogue). Run the
four phases in order; the goal is to decide as much as possible before asking the human anything.

**Phase 1 — Automated harness (do the most here).** If a browser is drivable, run
`scripts/live-scan/run-audit.mjs <url>` (page) or `--flow flow.json` (journey — scans every state,
including error/dynamic states). It returns `results` (pass/fail/warn across ~60–70% of A/AA criteria)
plus a `humanConfirmations` queue and screenshots. If only static input, run
`scripts/audit_static_html.py` and note the far smaller coverage. Record tool + versions.

**Phase 2 — Agent resolves the vision items itself.** For each `humanConfirmations` entry that carries
a screenshot or DOM extract, *look* and decide rather than forwarding it: judge alt-text quality
against the image, use-of-colour by greyscaling, contrast over images by sampling, link/heading
descriptiveness, error-message helpfulness, reduced-motion/forced-colors survival. Resolve everything
you confidently can; only genuinely-uncertain items survive.

**Phase 3 — Ask the human the residue, in exactly the Step 0 question format (never procedures).**
Work through `references/guided-review.md` — a station-by-station guided workflow (G1–G25) covering
everything not auto-decided: alt quality, use of colour, media captions/AD, sensory instructions,
link/heading clarity, gesture/drag/keyboard alternatives, error helpfulness, motion/flashing, cognitive
load, screen-reader experience, and the legal/process items (accessibility statement, feedback
mechanism, disproportionate-burden, scope). Each station gives you the intro + how-to + a question with
options and how each answer scores — **turn every one of those into a tappable question using the
interactive options tool, the same way you asked Step 0's scoping questions**, options + your
recommended answer stated up front. Skip stations whose subject doesn't exist. Batch related questions
where the surface allows it; the human taps rather than performing a procedure or writing prose answers.

**The result is a merge, not a handoff.** The finished audit is the combination of two things: (a) the
automated results from Phases 1–2 — everything the harness decided and everything you resolved yourself
from evidence — and (b) the human's tapped answers from Phase 3. Neither stands alone: automated results
without the guided-review pass are the partial ~65–75% ceiling described in `automation.md`; guided
answers without the automated pass would mean re-deriving by hand what the harness already computed.
Track every criterion's status with which of the two produced it (`auto` / `agent` / `human`, the
confidence tag defined at the end of this step) so the report can show its work, not just a final
verdict.

**Grounding requirement — this is not optional.** Phases 2 and 3 require *evidence you actually
obtained from the site being audited* (a screenshot you viewed, DOM/text you extracted, a page you
read) before marking any station Pass. Resolving a station from general knowledge of what websites
usually look like ("sites like this usually have decent alt text") is not resolution — it's a guess
wearing a Pass label, and it is exactly how a real gap goes unreported. If you have not obtained real
evidence for a station, its status is **Not tested**, never Pass, regardless of how plausible Pass
seems.

**Sanity check before finalizing.** If the combined automated + agent-resolved + guided-review pass
produced **zero questions for the human** on a real, multi-page site with images or forms, do not treat
that as a clean result — treat it as a signal that something under-fired: either detection missed real
patterns (a known risk area: text over `<img>`/component-based hero images rather than CSS
`background-image`; hover/tooltip triggers without `aria-describedby`; content the harness's DOM
queries don't match at all), or stations were resolved without real evidence per the grounding
requirement above. Before presenting the report, re-open several screenshots/pages yourself and
spot-check 3–5 G-stations by hand. If the result still holds after that check, say explicitly in the
report that you performed this sanity check and what you spot-checked — an audit that raised no
questions needs to show its work, not just assert a clean result.

**Phase 4 — Optional higher-fidelity AT.** For the accessibility-tree layer the harness already audits
name/role/state (4.1.2). To go further in CI, add `@guidepup/virtual-screen-reader` assertions, or
drive **real NVDA/VoiceOver** with `@guidepup/playwright` on a Windows/macOS runner (see
`references/automation.md`). Keep one human spot-check of the flagship journey for a formal claim.

**No-browser fallback — this is not a lesser path, and it does not skip the question mechanism.**
When no browser is drivable (the common case in a plain chat surface with no Code/computer-use access)
and the user can't run the harness themselves, `references/manual-testing.md`'s procedures (page
**M1–M10**, flow **F1–F4**, screen-reader **AT1–AT3**) are the *content* of what still needs checking —
but they are written as instructions for a human at a keyboard, and you cannot literally perform them
yourself. **Do not attempt to silently "judge" them from general knowledge of the site, and do not
summarize them as a table row like "~50 uncertain."** Instead, for each M1–M10/F1–F4 item: if you can
verify it from content you actually fetched (page HTML via `web_fetch`, a screenshot, extracted text),
resolve it yourself, grounded in that evidence, exactly as Phase 2 does — tag it `agent`. Everything
else becomes an individual question through the interactive options tool, in the identical Step 0
format (question, options, your recommended answer), sourced from the M1–M10/F1–F4 procedure it
replaces. This produces the same shape of output as the browser path — automated/agent results plus a
run of tapped questions — just with a different, smaller automated share and a larger asked share.
Whichever path was used, the completeness gate below still applies without exception.

Track each success criterion as **Pass / Fail / Not present / Not tested**, and tag automated vs
agent-resolved vs human-confirmed confidence. "Not tested" is honest — never silently upgrade to "Pass".

### Step 3a — Completeness gate (mandatory checkpoint; do not skip)

Before moving to Step 4, run this check explicitly. For **every** item you are about to carry into the
checklist evaluation and report — every WCAG criterion, every flow step, every PDF finding — confirm it
falls into exactly one of these three states:

1. **Automated** — a harness function produced a Pass/Fail/Warn/N-A result (cite which function).
2. **Asked** — a guided-review station or `humanConfirmations` item was actually presented via the
   interactive options tool and the human answered (cite the station ID or confirmation).
3. **Not tested** — genuinely not reachable this run (no browser, static input only, subject doesn't
   exist) — this is an honest, explicit status, not a silent gap.

**If any item doesn't fall cleanly into one of those three — stop and fix it before continuing:**
run the missing automated check, ask the missing question via the interactive options tool, or mark it
"Not tested" explicitly. Never let an item become prose in the report ("recommend manually checking
X") without first attempting to resolve it through one of the three paths above. A line like "manual
verification recommended for contrast on overlays" is not acceptable output if `contrastPass` exists
and was never run, or if the item was never actually asked as a question — that is the workflow being
skipped, not a legitimate finding. If you catch yourself drafting such a line, treat it as a signal to
go back and either run the check or ask the question, not as something to soften into the report.

### Step 4 — Evaluate against the checklist

Work through `references/wcag-checklist.md` (Level A + AA, with the WCAG 2.2 additions marked). For
every criterion, record the status and, for failures, the specific element/location, the user impact,
and the fix. Cross-reference automated findings so nothing is double-counted or dropped. **If Step 0's
target is AAA**, also work through all 31 criteria in `references/wcag-checklist-aaa.md` — expect this
to be far more manual than the A+AA pass, since most AAA criteria are editorial judgement, not
mechanically testable.

### Step 5 — Produce the report

Emit the report using the exact template in `references/report-template.md`. It must contain, in this
order: **Scope & assumptions → Applicable legal requirements → Target standard → What was tested and
how → Fulfilled criteria → Missed criteria (severity-ranked) → Prioritised remediation TODOs →
Accessibility statement status → Overall verdict (with explicit caveats).** Save it as a Markdown file
and present it.

**Every report output MUST also include the styled HTML version — this is mandatory, not optional.**
A Markdown-only deliverable is an incomplete run of this skill. This is not a stylistic preference to
honour; it's a specific sequence of tool calls, done in this exact order:

1. **View** `templates/example-report.html` in full. Do not proceed from memory of what it looks like,
   even if you've produced this report before in this conversation — view it now.
2. **Edit that file in place** (`str_replace`, one substitution per data field) — masthead scope line,
   verdict text, the conformance strip's segment widths/counts (computed from the pass/fail/warn/
   not-tested tally), the findings table rows (each SC cell keeps its `auto`/`agent`/`human`
   determination tag), the TODO list, the statement status. Every edit is a targeted replacement of one
   placeholder value; the surrounding structure, CSS, and design tokens are never touched.
3. **Never call a file-creation tool to author report.html from nothing.** If you find yourself about
   to write out a full `<html>...</html>` document yourself — even one that looks similar in style to
   the template, even one you're confident is well-designed — that is this exact failure mode. Stop,
   go back to step 1, and edit the real file instead. A hand-written lookalike is not an acceptable
   substitute, no matter how close it looks; it hasn't inherited the palette's verified WCAG-AA contrast
   or the template's zero-findings structure, because those guarantees belong to the specific file, not
   to "a report styled like it."
4. **Before presenting, verify mechanically — don't just believe you followed steps 1–3:** open the
   resulting `report.html` and confirm the `TEMPLATE-ID: web-accessibility-audit-report-v1` comment
   from the top of the template is present verbatim. If it is not there, the file was authored from
   scratch rather than edited from the template, regardless of what you intended — discard it and
   redo from step 1. Then run `scripts/audit_static_html.py` on it (should return zero findings, same
   as the template — a non-zero result means a structural regression was introduced while editing).
5. Save as `report.html`, present both files together, every time. If the user wants a further formal
   deliverable (Word/PDF), offer to convert from either version — but the Markdown + HTML pair is the
   baseline for every audit, not an upsell.

---

## Behavioural rules

- **Precision over reassurance.** If you tested 12 of 55 A+AA criteria, the verdict is "partially
  assessed", not "compliant". Say exactly what "compliant" would still require. **Never** say "100%",
  "fully accessible", or an unqualified "compliant" — only a standard-, scope-, date-, and
  method-qualified claim (see report §9). Conformance is a floor, not a guarantee of usability.
- **Separate legal from technical.** "Meets WCAG 2.2 AA" ≠ "legally compliant" — legal compliance
  also needs the accessibility statement, a feedback mechanism, and (for some regimes) documentation.
- **Prioritise remediation by user impact and legal exposure**, not by ease of fixing. A blocked
  checkout keyboard trap outranks a decorative-image alt-text nit.
- **Localisation.** If the user writes in German, deliver the report in German (the legal terms —
  *Barrierefreiheitserklärung*, *Konformitätsbewertung* — are German anyway). Match the user's
  language throughout.
- **No false authority.** This skill supports a rigorous self-assessment; it is not a substitute for a
  certified BITV-Test or legal advice. Say so once, plainly, in the verdict.
- **The HTML report is mandatory, always an edited copy of the template, checked mechanically.** Every
  audit output includes `report.html` — view + edit `templates/example-report.html` in place, confirm
  its `TEMPLATE-ID` comment survives into the output, never author a new HTML file for this. Never
  Markdown alone, never a hand-written lookalike, even if only "a report" was asked for.
- **No item skips straight to prose.** Every checked item is Automated, Asked, or explicitly Not
  tested (Step 3a) before it reaches the report — never a bullet under an ad-hoc "manual checks
  needed" heading that was never run through the harness or the interactive options tool.

## Reference map

- `references/legal.md` — DE (BFSG, BFSGV, BITV 2.0), EU (EAA 2019/882, WAD 2016/2102, EN 301 549),
  and other countries (US ADA/508, UK, Canada, Australia). Deadlines, exemptions, statements, penalties.
- `references/standards.md` — WCAG structure (POUR, A/AA/AAA), 2.1 vs 2.2, the standard→law mapping.
- `references/tools.md` — automated / manual / assistive-tech / CI tooling, coverage & gaps, German
  BITV-Test & WCAG-EM.
- `references/automation.md` — **automation strategy**: the per-criterion tier map (AUTO /
  AGENT+VISION / human-question), the four-phase agent workflow, real-screen-reader automation options
  (Guidepup / virtual-screen-reader), and the honest coverage ceiling. Read this first when a browser
  is drivable.
- `references/guided-review.md` — **guided question-driven workflow (stations G1–G25)** for everything
  not auto-testable: each station has a plain intro, how-to, and a tappable question with options and
  scoring. This is how Phase 3 turns the residue into questions the human just answers.
- `references/manual-testing.md` — the **complete manual test protocol** (page M1–M10, flow F1–F4,
  screen-reader AT1–AT3) — the by-hand fallback and the source of per-check pass/fail detail.
- `references/wcag-checklist.md` — per-criterion Level A + AA test methods (with 2.2 additions).
- `references/wcag-checklist-aaa.md` — the 31 AAA-only criteria (verified complete against the W3C
  Quick Reference), additive to A+AA. Use when Step 0's target level is AAA.
- `references/report-template.md` — the mandatory output format (incl. the per-journey process section).
- `references/accessibility-statement.md` — bilingual **Erklärung zur Barrierefreiheit** generators
  for both regimes (BITV public-sector EU-model § A; BFSG private-service § B), plus how to fill
  conformance status and known barriers from the audit. Use for report §8 / station G23.
- `references/pdf-accessibility.md` — **PDF & document accessibility** (EN 301 549 Ch.10): PDF/UA +
  WCAG2ICT standards, tools (veraPDF/PAC/Acrobat), automation tiers, and guided stations P1–P8.
- `scripts/audit_static_html.py` — offline structural auditor for uploaded HTML.
- `scripts/audit_pdf.py` — offline PDF/UA structural auditor (tagged? lang? title? scanned? forms?).
- `templates/example-report.html` — the **styled HTML report template** (also a filled, verified
  example): DIN/Swiss-precision design, WCAG-AA-verified colour tokens, a data-driven conformance
  strip, semantic tables, and icon+text status badges (never colour alone) — the report itself
  practices the criteria it audits. **Mandatory for every report** — edit this file in place (view,
  then `str_replace`), never author a new one; carries a `TEMPLATE-ID` comment used as a mechanical
  presence check. See Step 5's exact procedure.
- `scripts/live-scan/` — browser harness: **`run-audit.mjs`** (comprehensive agent-driven audit,
  page or `--flow`, emits `humanConfirmations`) + `lib.mjs` (tested a11y maths), plus `run-axe.mjs`,
  `run-flow.mjs`, `pa11y-ci`, Lighthouse, and jsx-a11y lint.

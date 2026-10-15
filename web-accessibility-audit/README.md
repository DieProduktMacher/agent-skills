# web-accessibility-audit

A jurisdiction-aware accessibility (a11y) audit skill for websites and web apps. It determines which
law applies (Germany's BFSG/BITV 2.0, the EU EAA/WAD via EN 301 549, plus US/UK/Canada), maps it to the
correct WCAG version/level, runs an automation-first test workflow, drives the human only for the parts
that can't be automated, and produces a scoped, honest conformance report and accessibility statement.

`SKILL.md` is the entry point and workflow; this README is the human-facing overview and — importantly
— the record of what this skill **cannot** do.

## How it works (automation-first)
1. **Scope** the audit (jurisdiction, sector, org size, target level, page vs flow, execution env).
2. **Fix the legal frame** (`references/legal.md`) and **technical target** (`references/standards.md`).
3. **Test**: run the browser harness (`scripts/live-scan/run-audit.mjs`) for everything auto-decidable;
   the agent resolves vision items from screenshots; the human answers the residue as guided questions
   (`references/guided-review.md`, stations G1–G25). Fallback by hand: `references/manual-testing.md`.
4. **Report** using `references/report-template.md`; generate the statement from
   `references/accessibility-statement.md`.

See `references/automation.md` for the per-criterion automation tier map and coverage ceiling.

## File map
- `SKILL.md` — workflow + behavioural rules
- `references/legal.md` · `standards.md` — law and WCAG/EN 301 549 mapping
- `references/automation.md` — what's automatable, and how far
- `references/guided-review.md` — guided Q&A for non-automatable checks (G1–G25)
- `references/manual-testing.md` — full by-hand protocol (M1–M10, F1–F4, AT1–AT3)
- `references/wcag-checklist.md` — per-criterion A+AA test methods
- `references/wcag-checklist-aaa.md` — the 31 AAA-only criteria, additive to A+AA
- `references/report-template.md` · `accessibility-statement.md` — outputs
- `scripts/audit_static_html.py` — offline structural auditor (no browser)
- `scripts/audit_pdf.py` — offline PDF/UA structural auditor
- `scripts/live-scan/` — Playwright harness (`run-audit.mjs`, `lib.mjs`, axe/flow/pa11y/Lighthouse)
- `templates/example-report.html` — styled HTML report template (WCAG-AA-verified design). **Mandatory**
  for every audit: copied and refilled — never redesigned — as the `report.html` companion to every
  `report.md`

## Known gaps & limitations

**This skill produces a rigorous, mostly-automated pre-assessment — not a guarantee of accessibility
or legal compliance.** "100% compliant" is not a coherent claim: conformance is assessed over a scope
and sample, at a point in time, and WCAG conformance is a floor that does not guarantee real-world
usability. Ranked open gaps:

| # | Gap | Severity | Status |
|---|-----|----------|--------|
| 1 | **Usability testing with disabled users** — the only way to prove real usability; conformance ≠ usable | High | Not covered |
| 2 | **PDF/document accessibility** (EN 301 549 Ch.10, PDF/UA, WCAG2ICT) | ~~High~~ | **Addressed** — `scripts/audit_pdf.py` + `references/pdf-accessibility.md`; full PDF/UA via veraPDF |
| 3 | **Cross-origin iframes** (payment, maps, cookie CMPs, embeds) — often the worst barriers; legal responsibility still attaches | High | Named as a limitation only; not testable by the harness |
| 4 | **Harness detection heuristics under-fire on real sites** — a real-site test run produced zero human questions, which is a red flag, not a clean result. Root cause found and fixed: `contrastPass` only detected CSS `background-image`, missing the common React/Next.js pattern of a stacked `<img>`/component behind text; `hoverFocusPass` silently discarded tooltip triggers without `aria-describedby`; and Phase 2/3 lacked an explicit requirement to ground station resolutions in real evidence rather than plausible-sounding inference. All three fixed — detection broadened, non-scriptable triggers now surfaced instead of dropped, and a grounding + sanity-check requirement added. **Re-test recommended** to confirm the fix; other under-detection patterns (SVG/canvas-rendered heroes, non-standard tooltip markup) likely remain. | Medium | Partially addressed this session; needs a second live re-test |
| 5 | **Native mobile apps** (EN 301 549 Ch.11) — EAA covers apps that deliver a covered service | Medium | Web-only by design |
| 6 | **AT matrix breadth** — one screen-reader path + accessibility-tree audit; not NVDA/JAWS/VoiceOver/TalkBack × browsers, nor voice control / switch / magnification | Medium | Partial (Guidepup noted for CI) |
| 7 | **Ongoing monitoring & feedback-handling process** as a deliverable | Medium | CI hooks exist; process/cadence not generated |
| 8 | **Skill triggering not eval'd** — activation reliability unmeasured (no CLI on this surface) | Low–Med | Unknown |
| 9 | **Timing/stateful checks** (session timeout 2.2.1, data-dependent states) | Low | Easy to miss even in guided review |
| 10 | **Product conformity path** (CE marking, technical documentation, EU declaration of conformity) | Low | Skill targets websites/services, not physical products |
| 11 | **Zero-questions results need a standing sanity check.** Any automated+guided pass that raises no human questions should be treated as suspicious by default, not celebratory — the natural failure mode of an agent-driven audit is quietly resolving everything via plausible inference instead of real evidence. This is now written into SKILL.md as a hard rule, but it depends on the running agent actually following it. | Medium | Rule added; not independently verifiable from this session |

**Also inherent (not fixable by more tooling):**
- Legal facts evolve (EN 301 549 v4.1.1 OJEU citation ~Oct 2026; national transpositions; case law;
  Abmahnung practice). Always verify against a primary source; this skill is not legal advice.
- Automated + agent-vision + guided-human coverage is high but not total (~10–15% is irreducibly human:
  caption accuracy, audio-description/sign-language/Leichte-Sprache adequacy, seizure-level flashing,
  cognitive load, real screen-reader announcement quality, legal sign-off).
- A defensible strong claim in Germany still needs a **certified BITV-Test** and, for genuine
  accessibility, **usability testing with disabled users**.

### Recommended next steps to narrow the gaps
1. ~~PDF/document accessibility mini-protocol~~ — **done** (`audit_pdf.py` + `pdf-accessibility.md`).
2. Add a **usability-testing-with-disabled-users** lightweight protocol for the critical journey.
3. Generalise a **third-party/embedded-content** station (obtain vendor VPAT, test what's reachable,
   document residual risk).
4. **Live-run the harness** against a staging URL to validate the analyzers and tune selectors.
5. Add a **monitoring cadence + feedback-handling** section and expand the **AT matrix** guidance.

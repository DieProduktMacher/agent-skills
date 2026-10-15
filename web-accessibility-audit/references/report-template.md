# Report template (mandatory output format)

Produce the audit report in **this exact section order**. Keep it honest and specific: cite element
selectors/locations for failures, and never mark untested criteria as passed. Deliver in the user's
language (German if they wrote in German). Save as a `.md` file and present it; offer Word/PDF on request.

**Mandatory: the styled HTML companion, always an edit of the template, never a new file.** Follow
SKILL.md Step 5's exact procedure: view `templates/example-report.html`, edit it in place with
`str_replace` for each data field, and confirm the `TEMPLATE-ID` comment is still present before
presenting `report.html`. A Markdown-only report is an incomplete run; a hand-written HTML lookalike
that never touched the actual template file is not a substitute, however well it's styled.

---

```markdown
# Accessibility Audit — <site / component name>
_Date: <YYYY-MM-DD> · Auditor: Claude (assisted self-assessment) · Method: <automated + manual + AT>_

## 1. Scope & assumptions
- **Audited:** <URLs / pages / components / uploaded files>
- **Not audited (out of scope):** <e.g. native app, checkout — with reason>. **Linked PDFs/documents**
  are in scope (EN 301 549 Ch.10) — audit via `scripts/audit_pdf.py` + `references/pdf-accessibility.md`
  and list results here per file; don't silently exclude them.
- **Assumptions made:** <jurisdiction, org size, sector — state each explicitly>

## 2. Applicable legal requirements
- **Regime(s):** <BFSG / BITV 2.0 / EAA / WAD / ADA / …>
- **In scope because:** <sector + market + org size; note micro-enterprise exemption if relevant>
- **Deadline / status:** <e.g. in force since 28 June 2025>
- **Also required beyond the site itself:** accessibility statement, feedback mechanism, <docs>
- **Enforcement & exposure:** <authority; penalty ceiling, e.g. up to €100,000 under BFSG>

## 3. Target standard
- **Audited against:** <WCAG version + level, as chosen in Step 0 — e.g. "WCAG 2.2 Level AA"> + EN 301
  549 v3.2.1 web requirements
- **Selected by:** <user-selected / jurisdiction default>
- **Legal minimum for this jurisdiction:** <e.g. WCAG 2.1 Level AA>
- **Legal minimum met by this audit's scope?** <Yes — chosen level is at/above the legal minimum / No
  — the requested target is lighter than the legal minimum; name the gap explicitly, e.g. "this audit
  was scoped to Level A only at the user's request; BFSG/BITV require AA, which this scope does not
  establish">
- **Note:** 2.2-only findings are tagged `(2.2)` — best practice now, mandatory once EN 301 549 v4.1.1
  (expected in the OJEU ~Oct 2026) applies.

## 4. What was tested and how
- **Audit mode:** <Page audit / Flow audit / Both>
- **Pages sampled (Mode A):** <list, per WCAG-EM> · **Journeys audited (Mode B):** <list>

| Layer | Tool / method | Version | Coverage |
|---|---|---|---|
| Automated harness (primary) | `run-audit.mjs` (Playwright + axe-core + contrast/hover/legal-link/carousel checks) | <ver> | <pages/states> |
| Automated (flow) | `run-flow.mjs` (per-state) | <ver> | <journey + #states> |
| Agent-resolved | vision items resolved from harness screenshots/DOM, per Phase 2 | — | <count> |
| Guided review | G-stations answered via interactive options tool, per Phase 3 | — | <count> |
| Manual (fallback only, if no browser was drivable) | M1–M10 / F1–F4 | — | <pages/journey> |
| Assistive tech | <NVDA+Firefox / VoiceOver+Safari / … / Not performed> | <ver> | <key task, completed?> |
> `run-audit.mjs` reaches a high-confidence automated verdict on ~65–75% of A/AA criteria (see
> `references/automation.md`); the agent-resolved and guided-review layers cover the rest. Every item
> in §5/§6 below is tagged by which layer determined it — see the completeness gate in SKILL.md Step 3a.

## 5. Fulfilled criteria (pass)
List the Level A/AA success criteria assessed and passing, grouped by POUR, each tagged **[auto]**,
**[agent]**, or **[human]** for how it was determined (per the Step 3a completeness gate — every item
here cleared one of those paths, never prose-only). Note coverage, e.g.
"41 of 55 A/AA criteria assessed (WCAG 2.2: 31 A + 24 AA); 32 pass, 9 fail, 14 not testable on the supplied material." The pass/fail/not-tested numbers must sum to 55.

## 6. Missed criteria (failures) — severity-ranked
For each failure:
| # | SC | Level | Severity | Determined by | Location | Impact on users | Fix |
|---|---|---|---|---|---|---|---|
| 1 | 2.1.2 No Keyboard Trap | A | Critical | auto (`keyboardPass`) | Cookie modal | SR/keyboard users trapped, site unusable | Add focus-trap release + Esc handler |
| … | | | | | | |
Severity scale: **Critical** (blocks a core task) → **Serious** → **Moderate** → **Minor**.
Tag current-legal-gap (fails 2.1 AA) vs near-future (`(2.2)`-only).

## 6b. Process (flow) findings — per journey  *(include when a flow was audited)*
Conformance requires that **every step** of a process passes; report each journey step + state and
whether the process is completable. A blocking step fails the whole process even if all pages pass.
| Journey | Step | State | Barrier found | SC | Severity |
|---|---|---|---|---|---|
| Ticket purchase | 4 Checkout | error (empty submit) | Errors not announced; focus stays on hidden button | 3.3.1, 4.1.3, 2.4.3 | Critical |
| … | | | | | |
**Process verdict per journey:** completable by keyboard? <Y/N> · by screen reader (F4)? <Y/N> ·
first blocking step: <#/none>. A "No" on either is a Critical finding for the service as a whole.

## 7. Prioritised remediation TODOs
Ordered by user impact × legal exposure, not by ease. For each: what to do, where, effort estimate,
and which SC it closes. Group into **P0 (fix before claiming compliance)**, **P1**, **P2**.
- [ ] **P0** — <task> → closes <SC list>
- [ ] **P1** — <task> → closes <SC list>
- [ ] **P2** — <task>

## 8. Accessibility statement status
- Present? <yes/no> · Valid/complete? <assessment against the required elements>
- Missing elements: <conformance status, known barriers, date, feedback mechanism, enforcement link>
- Action: <draft/update needed — generate from `references/accessibility-statement.md` (BFSG § B or
  BITV § A template), filling known barriers from §6; offer as .md/Word>

## 9. Overall verdict
**Never state "100% compliant", "fully accessible", or an unqualified "compliant".** No audit —
however thorough — supports that: conformance is assessed over a *scope* and *sample*, at a *point in
time*, and WCAG conformance is a floor that does not guarantee real-world usability. The strongest
defensible claim has four qualifiers — **standard + scope + date + method**:

> *"**WCAG 2.2 AA — partially conformant** over the audited scope (pages/journeys listed in §1) as of
> <date>, verified by automated harness + guided human review + <AT method>. X critical and Y serious
> Level-AA failures currently block a WCAG 2.1 AA claim; the accessibility statement is <status>.
> Closing the P0 items and publishing a statement would bring the audited scope to WCAG 2.1 AA; P1
> items reach WCAG 2.2 AA. Out of scope / not assessed: <linked PDFs, native app, cross-origin payment
> iframe, …>. This is an assisted self-assessment, not a certified BITV-Test, usability testing with
> disabled users, or legal advice."*

Always name: (1) what would still be required for the legal minimum, (2) what was **not** assessed,
and (3) that conformance ≠ guaranteed usability (recommend usability testing with disabled users for a
genuine accessibility claim).
```

---

## Filling it in well
- **Coverage honesty:** always give the assessed/total ratio and list "not tested" criteria by name.
- **One fail = one row**, with a real selector/location — reviewers must be able to find it.
- **Tie every TODO to the SC(s) it closes** so progress is measurable.
- **Verdict must name the shortest path to the legal minimum**, separately from the 2.2 stretch.

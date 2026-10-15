# Agent Skills

A collection of skills for AI coding agents. Skills are packaged instructions and scripts that extend agent capabilities.

Skills follow the [Agent Skills](https://agentskills.io/) format.

## Available Skills

### prepare-merge-request

Performs a senior-level code review on staged/changed code before opening a PR. Identifies weak spots, technical debt, and anything likely to get questioned in review.

**Use when:**

- "Prepare my PR"
- "Review before I push"
- "Run pre-PR checks"
- "What should I fix before opening a pull request?"
- "Review my changes like a senior engineer"

**Checks covered:**

- What's going to get questioned in review
- The weakest part of the implementation
- What should be refactored before pushing
- Where technical debt is introduced
- Cursor rules, README definitions, and overall best practices

### web-accessibility-audit

Sophisticated, jurisdiction-aware web accessibility (a11y) auditing for websites and web apps.
Determines which laws apply (Germany's BFSG/BITV 2.0, the EU European Accessibility Act and Web
Accessibility Directive via EN 301 549, plus US/UK/Canada regimes), maps them to the correct WCAG
version and level, runs and interprets automated + manual + assistive-technology checks, and produces
a precise conformance report with a prioritised remediation TODO list and accessibility statement.

**Use when:**

- "Audit this site for accessibility"
- "Is this WCAG/BFSG/EAA compliant?"
- "Check color contrast / keyboard navigation / screen reader support"
- "Write our accessibility statement"

**Checks covered:**

- Jurisdiction and applicable law (BFSG/BITV 2.0, EAA/WAD via EN 301 549, Section 508, ADA, etc.)
- Correct WCAG version/level mapping for that jurisdiction
- Automated, manual, and assistive-technology test coverage
- Prioritised remediation TODOs and an accessibility statement

## Installation

```bash
npx skills add dieproduktmacher/agent-skills
```

## Usage

Skills are automatically available once installed. The agent will use them when relevant tasks are detected.

**Examples:**

```
Review my code changes
```

## Skill Structure

Each skill contains:

- `SKILL.md` - Instructions for the agent
- `scripts/` - Helper scripts for automation (optional)
- `references/` - Supporting documentation (optional)

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

## License

MIT

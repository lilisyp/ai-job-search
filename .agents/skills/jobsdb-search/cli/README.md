# jobsdb-cli

CLI for searching jobs on **JobsDB Hong Kong** (`hk.jobsdb.com`).

**Data source**: SEEK Asia `jobsearch/v5/search` JSON API + HTML job detail pages.
**Authentication**: None required.
**Dependencies**: None (plain `bun` + `fetch`). `bun install` is optional (dev types only).

> **Personal use only.** JobsDB `robots.txt` disallows `/api/jobsearch/`. Keep volume
> low; do not use commercially or for bulk collection.

## Installation

```bash
cd .agents/skills/jobsdb-search/cli
bun install   # optional — TypeScript / @types/bun only
```

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search JobsDB HK listings |
| `detail` | Fetch full detail for one listing |

Errors → **stderr** as `{ "error", "code" }`, exit code `1`.

## Quick examples

```bash
bun run src/cli.ts search -q "Investment Manager" --jobage 14 --format table
bun run src/cli.ts search -q "corporate development" -l "Central" --format table
bun run src/cli.ts search -q "Due Diligence" --limit 5 --format table
bun run src/cli.ts detail 93495418 --format plain
```

See `../SKILL.md` and `../url-reference.md`.

---
name: jobsdb-search
version: 1.0.0
description: >
  Use this skill whenever the user mentions JobsDB, jobsdb.com, hk.jobsdb.com,
  or searching for jobs in Hong Kong on JobsDB — even if they don't say JobsDB
  explicitly when the context is Hong Kong job boards. Trigger phrases: JobsDB,
  jobsdb, hk.jobsdb, Hong Kong jobs, 香港搵工, 香港招聘, 搵工 JobsDB,
  Investment Manager Hong Kong, Due Diligence jobs Hong Kong, corporate development
  Hong Kong, fundraising jobs Hong Kong, Transaction services Hong Kong.
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/jobsdb-search/cli/src/cli.ts *)
---

# JobsDB Hong Kong Search Skill

Search live job listings on **JobsDB Hong Kong** (`hk.jobsdb.com`) — Hong Kong's
largest general job board. English and Chinese keywords both work. No authentication,
zero runtime dependencies — runs with just `bun`.

> Market: Hong Kong / GBA (Hong Kong postings). For mainland GBA boards use Liepin.

## ⚠️ Personal use only

JobsDB's `robots.txt` disallows `/api/jobsearch/` for automated agents. This skill
uses that public JSON search endpoint (and HTML detail pages) for **personal job
search only**. Keep volume low, do not use commercially or for bulk collection, and
run it on your own responsibility.

## When to use this skill

- Search Hong Kong openings by title/skill (Investment Manager, Due Diligence, etc.)
- Filter by district (`--location`) and posting age (`--jobage`)
- Fetch the full description of a JobsDB listing

## Commands

### Search job listings

```bash
bun run .agents/skills/jobsdb-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--query` / `-q` — keywords (English or Chinese). Recommended.
- `--location` / `-l` — district/area (JobsDB `where` param), e.g. `Central`, `Wan Chai`, `Hong Kong Island`.
- `--jobage <days>` — posted within N days (`daterange`); common values `1`, `7`, `14`, `30`.
- `--page <n>` — 1-indexed page (default 1; ~20 results/page).
- `--limit` / `-n` — client-side cap on results emitted.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/jobsdb-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

`id` is the numeric JobsDB job id from search results (e.g. `93495418`). You may also
pass a full `https://hk.jobsdb.com/job/...` URL.

## Usage examples

```bash
# Investment Manager roles, last 14 days
bun run .agents/skills/jobsdb-search/cli/src/cli.ts search -q "Investment Manager" --jobage 14 --format table

# Corporate development in Central
bun run .agents/skills/jobsdb-search/cli/src/cli.ts search -q "corporate development" -l "Central" --format table

# Due Diligence / Transaction services
bun run .agents/skills/jobsdb-search/cli/src/cli.ts search -q "Due Diligence" --limit 10 --format table
bun run .agents/skills/jobsdb-search/cli/src/cli.ts search -q "Transaction services" --jobage 30 --format table

# Chinese keywords
bun run .agents/skills/jobsdb-search/cli/src/cli.ts search -q "投资经理" --format table

# Full detail
bun run .agents/skills/jobsdb-search/cli/src/cli.ts detail 93495418 --format plain
```

## Output formats

| Format | Description |
|--------|-------------|
| `json` | `{ "meta": { "count", "page", "totalCount" }, "results": [...] }` |
| `table` | Fixed-width columns for terminal scanning |
| `plain` | Multi-line blocks (title / company / location / url) |

Each result includes at least: `id`, `title`, `company`, `location`, `date`, `url`.

## Notes

- See `url-reference.md` for endpoints and parsing anchors.
- Site is Hong Kong–only; mainland GBA roles need Liepin / OfferToday.
- Errors go to **stderr** as `{ "error", "code" }` with exit code `1`.

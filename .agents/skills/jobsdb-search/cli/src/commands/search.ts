import {
  SEARCH_URL,
  SITE_KEY,
  SOURCE_SYSTEM,
  textFetch,
  parseSearchJson,
  writeError,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string
  jobage: number
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

const PAGE_SIZE = 20

function buildUrl(opts: SearchOpts): string {
  const params = new URLSearchParams()
  params.set("siteKey", SITE_KEY)
  params.set("sourcesystem", SOURCE_SYSTEM)
  if (opts.query) params.set("keywords", opts.query)
  if (opts.location) params.set("where", opts.location)
  params.set("page", String(opts.page))
  params.set("pageSize", String(PAGE_SIZE))
  if (opts.jobage > 0 && opts.jobage < 9999) {
    params.set("daterange", String(opts.jobage))
    params.set("sortmode", "ListedDate")
  }
  return `${SEARCH_URL}?${params.toString()}`
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const title = (c.title || "").slice(0, 42).padEnd(42)
    const company = (c.company || "—").slice(0, 26).padEnd(26)
    const loc = (c.location || "—").slice(0, 24).padEnd(24)
    const date = (c.date || "—").slice(0, 10)
    return `${c.id.padEnd(10)} ${title} ${company} ${loc} ${date}`
  })
  const header =
    "ID".padEnd(10) +
    " " +
    "TITLE".padEnd(42) +
    " " +
    "COMPANY".padEnd(26) +
    " " +
    "LOCATION".padEnd(24) +
    " DATE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const raw = await textFetch(buildUrl(opts), "application/json")
    if (!raw) {
      writeError("Search returned empty response", "SEARCH_EMPTY")
      return 1
    }
    const { cards: all, totalCount } = parseSearchJson(raw)
    let cards = all
    if (opts.limit !== undefined && opts.limit >= 0) cards = cards.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        cards
          .map(
            (c) =>
              `${c.title}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.date || "—"}\n  id: ${c.id}\n  ${c.url}`,
          )
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(
        JSON.stringify(
          {
            meta: { count: cards.length, page: opts.page, totalCount },
            results: cards.map(({ teaser: _t, ...rest }) => rest),
          },
          null,
          2,
        ) + "\n",
      )
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}

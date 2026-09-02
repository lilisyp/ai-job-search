import {
  GRAPHQL_URL,
  JOB_DETAILS_QUERY,
  parseJobDetailsGraphql,
  writeError,
} from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

/** Accept a raw job ID or a JobsDB job URL. */
function normalizeId(input: string): string | null {
  const url = input.match(/\/job\/(\d+)/i)
  if (url) return url[1]
  const bare = input.match(/^\d{5,}$/)
  if (bare) return input
  return null
}

async function fetchJobDetailsJson(id: string): Promise<string> {
  const maxRetries = 6
  let delay = 500
  const UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "User-Agent": UA,
        Accept: "application/json",
        "Content-Type": "application/json",
        "Accept-Language": "en-HK,en;q=0.9,zh-HK;q=0.8,zh;q=0.7",
      },
      body: JSON.stringify({
        query: JOB_DETAILS_QUERY,
        variables: { id },
      }),
      signal: AbortSignal.timeout(20000),
    })
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      }
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, delay + jitter))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (response.status === 404) return ""
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return response.text()
  }
  throw new Error("Request failed after max retries")
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const id = normalizeId(opts.id)
  if (!id) {
    writeError(`Could not parse a job ID from "${opts.id}"`, "BAD_ID")
    return 1
  }
  try {
    const raw = await fetchJobDetailsJson(id)
    if (!raw) {
      writeError("Job not found", "NOT_FOUND")
      return 1
    }
    const job = parseJobDetailsGraphql(raw, id)
    if (!job) {
      writeError("Job not found", "NOT_FOUND")
      return 1
    }

    if (opts.format === "plain") {
      const lines = [
        job.title,
        `${job.company || "—"} · ${job.location || "—"}`,
        "",
        job.employmentType ? `Employment: ${job.employmentType}` : "",
        "",
        job.description || "(no description)",
        "",
        `URL: ${job.url}`,
        job.applyUrl ? `Apply: ${job.applyUrl}` : "",
      ].filter((l) => l !== "")
      process.stdout.write(lines.join("\n") + "\n")
    } else {
      const { teaser: _t, ...rest } = job
      process.stdout.write(JSON.stringify(rest, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}

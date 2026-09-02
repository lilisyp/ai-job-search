// Data source: JobsDB Hong Kong (SEEK Asia). Personal use only — robots.txt
// disallows /api/jobsearch/; keep volume low.

export const SEARCH_URL = "https://hk.jobsdb.com/api/jobsearch/v5/search"
export const GRAPHQL_URL = "https://hk.jobsdb.com/graphql"
export const DETAIL_URL = "https://hk.jobsdb.com/job"
export const SITE_KEY = "HK-Main"
export const SOURCE_SYSTEM = "houston"

export const JOB_DETAILS_QUERY = `query ($id: ID!) {
  jobDetails(id: $id) {
    job {
      id
      title
      content
      location { label }
      advertiser { name }
      workTypes { label }
    }
  }
}`

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

/** Fetch text with exponential backoff on 429/5xx. Returns "" on a 404. */
export async function textFetch(
  url: string,
  accept = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: accept,
        "Accept-Language": "en-HK,en;q=0.9,zh-HK;q=0.8,zh;q=0.7",
      },
      redirect: "follow",
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

export interface JobCard {
  id: string
  title: string
  company: string | null
  companyUrl: string | null
  location: string | null
  date: string | null
  url: string
  teaser: string | null
}

export interface JobDetail extends JobCard {
  description: string | null
  employmentType: string | null
  applyUrl: string | null
}

interface SeekSearchHit {
  id?: string | number
  title?: string
  companyName?: string
  listingDate?: string
  teaser?: string
  locations?: Array<{ label?: string }>
}

interface SeekSearchResponse {
  data?: SeekSearchHit[]
  totalCount?: number
}

function numericEntity(cp: number): string {
  return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ""
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => numericEntity(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => numericEntity(parseInt(hex, 16)))
    .replace(/&nbsp;/g, " ")
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

export function clean(html: string): string {
  return decodeHtmlEntities(stripTags(html))
}

/** Parse SEEK search JSON into JobCards. */
export function parseSearchJson(raw: string): { cards: JobCard[]; totalCount: number | null } {
  let parsed: SeekSearchResponse
  try {
    parsed = JSON.parse(raw) as SeekSearchResponse
  } catch {
    throw new Error("Search response was not valid JSON")
  }
  const cards: JobCard[] = []
  for (const hit of parsed.data ?? []) {
    const id = hit.id != null ? String(hit.id) : ""
    if (!id || !hit.title) continue
    const location = hit.locations?.[0]?.label ?? null
    cards.push({
      id,
      title: hit.title,
      company: hit.companyName ?? null,
      companyUrl: null,
      location,
      date: hit.listingDate ?? null,
      url: `${DETAIL_URL}/${id}`,
      teaser: hit.teaser ?? null,
    })
  }
  return { cards, totalCount: typeof parsed.totalCount === "number" ? parsed.totalCount : null }
}

/**
 * Extract inner HTML for a data-automation attribute, handling nested tags by
 * tracking depth from the opening tag of the matched element.
 */
export function extractAutomationContent(html: string, automation: string): string | null {
  const openRe = new RegExp(
    `<([a-zA-Z0-9]+)([^>]*data-automation="${automation}"[^>]*)>`,
    "i",
  )
  const open = openRe.exec(html)
  if (!open) return null
  const tag = open[1].toLowerCase()
  let i = open.index + open[0].length
  // Void-ish: if self-closing or we only need text until next same-level close
  let depth = 1
  const openTag = new RegExp(`<${tag}\\b`, "gi")
  const closeTag = new RegExp(`</${tag}>`, "gi")

  while (depth > 0 && i < html.length) {
    openTag.lastIndex = i
    closeTag.lastIndex = i
    const nextOpen = openTag.exec(html)
    const nextClose = closeTag.exec(html)
    if (!nextClose) return null
    const openIdx = nextOpen ? nextOpen.index : -1
    if (openIdx !== -1 && openIdx < nextClose.index) {
      depth++
      i = openIdx + 1
    } else {
      depth--
      if (depth === 0) {
        return html.slice(open.index + open[0].length, nextClose.index)
      }
      i = nextClose.index + nextClose[0].length
    }
  }
  return null
}

interface GqlJobDetailsResponse {
  data?: {
    jobDetails?: {
      job?: {
        id?: string
        title?: string
        content?: string | null
        location?: { label?: string } | null
        advertiser?: { name?: string } | null
        workTypes?: { label?: string } | Array<{ label?: string }> | null
      } | null
    } | null
  }
  errors?: Array<{ message?: string }>
}

/** Turn job description HTML into readable plain text. */
export function htmlToPlain(descHtml: string): string {
  const withBreaks = descHtml
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
  return decodeHtmlEntities(stripTags(withBreaks)).replace(/\n{3,}/g, "\n\n").trim()
}

function workTypeLabel(
  workTypes: { label?: string } | Array<{ label?: string }> | null | undefined,
): string | null {
  if (!workTypes) return null
  if (Array.isArray(workTypes)) {
    const labels = workTypes.map((w) => w.label).filter((x): x is string => !!x)
    return labels.length ? labels.join(", ") : null
  }
  return workTypes.label ?? null
}

/** Parse GraphQL jobDetails JSON into JobDetail. Returns null if job missing. */
export function parseJobDetailsGraphql(raw: string, id: string): JobDetail | null {
  let parsed: GqlJobDetailsResponse
  try {
    parsed = JSON.parse(raw) as GqlJobDetailsResponse
  } catch {
    throw new Error("Detail response was not valid JSON")
  }
  if (parsed.errors?.length) {
    throw new Error(parsed.errors.map((e) => e.message || "GraphQL error").join("; "))
  }
  const job = parsed.data?.jobDetails?.job
  if (!job) return null

  const content = job.content ?? null

  return {
    id: job.id ? String(job.id) : id,
    title: job.title || "(untitled)",
    company: job.advertiser?.name ?? null,
    companyUrl: null,
    location: job.location?.label ?? null,
    date: null,
    url: `${DETAIL_URL}/${id}`,
    teaser: null,
    description: content ? htmlToPlain(content) || null : null,
    employmentType: workTypeLabel(job.workTypes),
    applyUrl: `${DETAIL_URL}/${id}`,
  }
}

/** Parse a JobsDB job detail HTML page (fallback when GraphQL is unavailable). */
export function parseJobDetail(html: string, id: string): JobDetail {
  const titleRaw = extractAutomationContent(html, "job-detail-title")
  const companyRaw = extractAutomationContent(html, "advertiser-name")
  const locationRaw = extractAutomationContent(html, "job-detail-location")
  const workTypeRaw = extractAutomationContent(html, "job-detail-work-type")
  const descRaw = extractAutomationContent(html, "jobAdDetails")

  const description = descRaw ? htmlToPlain(descRaw) || null : null

  const applyMatch = html.match(
    /data-automation="job-detail-apply"[\s\S]{0,400}?href="([^"]+)"/i,
  )
  const applyUrl = applyMatch ? decodeHtmlEntities(applyMatch[1]) : null

  return {
    id,
    title: titleRaw ? clean(titleRaw) : "(untitled)",
    company: companyRaw ? clean(companyRaw) || null : null,
    companyUrl: null,
    location: locationRaw ? clean(locationRaw) || null : null,
    date: null,
    url: `${DETAIL_URL}/${id}`,
    teaser: null,
    description,
    employmentType: workTypeRaw ? clean(workTypeRaw) || null : null,
    applyUrl,
  }
}

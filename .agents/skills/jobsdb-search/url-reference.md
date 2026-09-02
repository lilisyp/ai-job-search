# JobsDB Hong Kong URL Reference

Public SEEK Asia endpoints used by this skill for **Hong Kong** (`hk.jobsdb.com`).

> **Personal use only.** `robots.txt` disallows `/api/jobsearch/` for the default user-agent.
> Keep volume low; do not use commercially or for bulk collection. Run on your own responsibility.

## Search

```
GET https://hk.jobsdb.com/api/jobsearch/v5/search
```

Query params:

| Param | Meaning | Example |
|-------|---------|---------|
| `siteKey` | Market site key (required) | `HK-Main` |
| `sourcesystem` | Client identifier (required) | `houston` |
| `keywords` | Free-text query | `Investment Manager` · `Due Diligence` · `投资经理` |
| `where` | Location filter | `Central` · `Wan Chai` · `Hong Kong Island` |
| `page` | 1-indexed page | `1`, `2`, … |
| `pageSize` | Results per page (API max ~50) | `20` |
| `daterange` | Posted within N days | `1`, `7`, `14`, `30` |
| `sortmode` | Sort | `KeywordRelevance` (default) · `ListedDate` |
| `locale` | UI/locale hints | `en` · `zh-HK` |

Returns JSON:

```json
{
  "data": [
    {
      "id": "93495418",
      "title": "Investment Manager/SM, Insurance Group",
      "companyName": "Omni Group Asia Limited",
      "listingDate": "2026-07-22T09:43:02Z",
      "locations": [{ "label": "Hong Kong Island", "countryCode": "HK" }],
      "teaser": "..."
    }
  ],
  "totalCount": 2391
}
```

Job URL pattern: `https://hk.jobsdb.com/job/<id>`

## Detail

```
POST https://hk.jobsdb.com/graphql
```

Body:

```json
{
  "query": "query ($id: ID!) { jobDetails(id: $id) { job { id title content location { label } advertiser { name } workTypes { label } } } }",
  "variables": { "id": "93495418" }
}
```

Returns JSON with HTML `content` (job description). Job URL for humans: `https://hk.jobsdb.com/job/<id>`.

> HTML job pages (`/job/<id>`) are behind Cloudflare challenge for non-browser TLS fingerprints.
> Prefer GraphQL over scraping HTML. HTML parsing anchors (`data-automation="jobAdDetails"` etc.)
> remain documented for fallback / curl-based debugging:

| Field | Anchor |
|-------|--------|
| Title | `data-automation="job-detail-title"` |
| Company | `data-automation="advertiser-name"` |
| Location | `data-automation="job-detail-location"` |
| Work type | `data-automation="job-detail-work-type"` |
| Description | `data-automation="jobAdDetails"` |

## robots.txt notes

```
User-agent: *
Disallow: /api/jobsearch/
Allow: *?keywords
```

Search/detail HTML pages are reachable; the JSON search API path is disallowed for crawlers — hence the personal-use warning.

## Quirks

- Site is Hong Kong–only (`country: HK`). GBA mainland roles are not on this board.
- Keyword search accepts English and Chinese.
- `daterange` maps cleanly to `--jobage`.
- Some titles mix English and Traditional/Simplified Chinese.

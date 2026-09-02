# Search Queries for Job Scraper

<!-- Prefer middle-management titles; avoid Head / Director / C-suite leadership searches by default. -->

## Location Filter (hard constraint)

- **Ideal:** Hong Kong
- **Acceptable:** Greater Bay Area (Shenzhen, Guangzhou, Macau, Dongguan, Foshan, Zhuhai, Zhongshan, Jiangmen, Huizhou, Zhaoqing)
- **Fail:** Any role requiring relocation outside GBA

## Work-life filter (soft constraint)

- **Prefer:** Manager / Senior Manager / AVP; IC or small-team deal work; limited overnight travel
- **Deprioritize / skip:** Head of / Director / C-suite; roles that imply heavy travel or routinely extreme hours
- **Context:** Two young children at home — flexibility for travel and long hours is limited

## Reference Role Titles (priority for /scrape)

**Investor track (middle management — default):**
- Investment Manager / Senior Investment Manager
- Corporate Venture / Venture Investment Manager
- Corporate Development Manager / M&A Manager
- Strategic Investment Manager / Portfolio Manager (venture / strategic capital)

**Investor track (deprioritize unless IC-heavy + bounded travel):**
- Investment Director / VP Investment / Head of Investment
- Corporate Development / M&A Director

**Operator track (middle management):**
- Strategy Manager / Senior Manager, Strategy
- Business Development Manager (deep-tech)
- Investor Relations / Fundraising Manager (not VP/Head)

## Priority Sectors
- Deep tech, advanced materials, decarbonization, membranes & filtration
- Corporate VC / strategic capital with GBA mandate

## Installed portal CLIs

`/scrape` auto-discovers portal skills under `.agents/skills/`. Primary markets: LinkedIn (HK) + JobsDB (HK). Denmark portals are geo-out-of-scope.

## WebSearch fallback (optional)

```
site:linkedin.com/jobs "Investment Manager" "Hong Kong"
site:linkedin.com/jobs "Senior Investment Manager" "Hong Kong"
site:linkedin.com/jobs "corporate development" Manager "Hong Kong"
site:linkedin.com/jobs "venture" "Investment Manager" "Hong Kong"
```

## Date Filter

Only include jobs posted within the last 14 days, or with an application deadline that has not yet passed.

import { describe, test, expect } from "bun:test"
import { runCLI, parseJSON } from "./helpers"

function parsedStderr(stderr: string): { error?: string; code?: string } {
  try {
    return JSON.parse(stderr)
  } catch {
    return {}
  }
}

describe("JobsDB CLI flag validation", () => {
  test("non-numeric --jobage exits 1 with BAD_ARG", async () => {
    const result = await runCLI(["search", "-q", "Investment Manager", "--jobage", "foo"])
    expect(result.exitCode).not.toBe(0)
    const err = parsedStderr(result.stderr)
    expect(err.code).toBe("BAD_ARG")
    expect(err.error).toMatch(/jobage/)
  })

  test("missing detail id exits 1 with NO_ID", async () => {
    const result = await runCLI(["detail"])
    expect(result.exitCode).not.toBe(0)
    const err = parsedStderr(result.stderr)
    expect(err.code).toBe("NO_ID")
  })

  test("unknown command exits 1 with BAD_CMD", async () => {
    const result = await runCLI(["wat"])
    expect(result.exitCode).not.toBe(0)
    const err = parsedStderr(result.stderr)
    expect(err.code).toBe("BAD_CMD")
  })
})

describe("JobsDB live smoke", () => {
  test("search Investment Manager returns >=1 result with id/title/url", async () => {
    const result = await runCLI([
      "search",
      "-q",
      "Investment Manager",
      "--limit",
      "5",
      "--format",
      "json",
    ])
    expect(result.exitCode).toBe(0)
    const body = parseJSON<{
      meta: { count: number }
      results: Array<{ id: string; title: string; url: string }>
    }>(result)
    expect(body.meta.count).toBeGreaterThanOrEqual(1)
    expect(body.results.length).toBeGreaterThanOrEqual(1)
    const first = body.results[0]
    expect(first.id).toBeTruthy()
    expect(first.title).toBeTruthy()
    expect(first.url).toMatch(/hk\.jobsdb\.com\/job\//)
  }, 30000)

  test("detail returns readable description for a search hit", async () => {
    const search = await runCLI([
      "search",
      "-q",
      "Investment Manager",
      "--limit",
      "1",
      "--format",
      "json",
    ])
    expect(search.exitCode).toBe(0)
    const body = parseJSON<{ results: Array<{ id: string }> }>(search)
    const id = body.results[0]?.id
    expect(id).toBeTruthy()

    const detail = await runCLI(["detail", id!, "--format", "json"])
    expect(detail.exitCode).toBe(0)
    const job = parseJSON<{
      id: string
      title: string
      description: string | null
      url: string
    }>(detail)
    expect(job.id).toBe(id)
    expect(job.title).toBeTruthy()
    expect(job.description && job.description.length).toBeGreaterThan(40)
    expect(job.url).toContain(id!)
  }, 30000)
})

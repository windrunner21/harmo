import { defineConfig, devices } from "@playwright/test";

// Every test runs in the three browser engines Harmo supports. Locally, the
// mise tasks run them in Playwright's Docker image: `mise run test:browser`
// Chromium, `mise run test:browser:all` all three. On CI, each job runs a
// third of a browser's tests and writes a blob report, which the report job
// merges into one, with each failure shown on the pull request and its trace
// kept. Ten failures end a job, so a broken run doesn't wait out every
// test's timeouts.
export default defineConfig({
  testDir: ".",
  // Each test opens its own page, so a file's tests can spread across
  // workers too, rather than queueing on one.
  fullyParallel: true,
  // Locally, a quarter of the cores, so the computer stays usable during a
  // run; --workers overrides it. CI's runners do nothing else, so they keep
  // Playwright's default of half.
  workers: process.env.CI ? undefined : "25%",
  forbidOnly: Boolean(process.env.CI),
  maxFailures: process.env.CI ? 10 : undefined,
  // On CI, blob for the report job to merge, as Playwright's sharding guide
  // has it, and dot, Playwright's default on CI, for the job's own log.
  reporter: process.env.CI ? [["blob"], ["dot"]] : "list",
  // On CI, a job's tests stop after 15 minutes, before the job's own 20, so
  // its report is still written, as Playwright's CI guide recommends.
  globalTimeout: process.env.CI ? 15 * 60 * 1000 : undefined,
  // Locally, a failed test runs once more, and that run records a trace, so
  // the passing ones don't record at all: recording every test, to keep only
  // the failures', took about 40% of a run's CPU. CI records every test and
  // keeps a failure's, so a flaky failure has its trace too.
  retries: process.env.CI ? 0 : 1,
  use: { trace: process.env.CI ? "retain-on-failure" : "on-first-retry" },
  projects: [
    { name: "chromium", use: devices["Desktop Chrome"] },
    { name: "firefox", use: devices["Desktop Firefox"] },
    { name: "webkit", use: devices["Desktop Safari"] },
  ],
});

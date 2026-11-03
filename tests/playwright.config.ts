import { defineConfig, devices } from "@playwright/test";

// Every test runs in the three browser engines Harmo supports. Locally,
// `mise run test:browser` runs Chromium only: Playwright's own, or the one
// CHROMIUM_PATH names. On CI, failures show on the pull request, the report
// keeps their traces, and ten failures end the run, so a broken run doesn't
// wait out every test's timeouts.
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
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { trace: "retain-on-failure" },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { executablePath: process.env.CHROMIUM_PATH },
      },
    },
    { name: "firefox", use: devices["Desktop Firefox"] },
    { name: "webkit", use: devices["Desktop Safari"] },
  ],
});

import { defineConfig, devices } from "@playwright/test";

// Every test runs in the three browser engines Harmo supports. Locally,
// `mise run test:browser` runs Chromium only: Playwright's own, or the one
// CHROMIUM_PATH names. On CI, failures show on the pull request, and the
// report keeps their traces.
export default defineConfig({
  testDir: ".",
  forbidOnly: Boolean(process.env.CI),
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

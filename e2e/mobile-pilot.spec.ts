import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
}

async function expectNoWcagViolations(page: Page) {
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
}

async function startSession(page: Page) {
  await page.goto("/start?utm_source=linkedin&utm_medium=outreach&utm_campaign=pilot-e2e");
  await page.getByRole("button", { name: /Tell me about your work/ }).click();
  await expect(page).toHaveURL(/\/background\?source=conversation/);
}

test("mobile participant reaches results with keyboard-accessible primary actions", async ({ page }) => {
  await startSession(page);
  await expectNoHorizontalOverflow(page);
  await page.getByRole("button", { name: "Continue without background" }).click();
  await expect(page).toHaveURL(/\/interview/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("textbox", { name: "Your answer" }).fill("I want an operations role where I can improve handoffs.");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("status")).toContainText("Saved");
  await page.getByRole("button", { name: "Show my summary" }).click();
  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("experience points to");
  await expectNoHorizontalOverflow(page);
});

test("benefits disclose pending relationships and never call an open a redemption", async ({ page, context }) => {
  await startSession(page);
  await page.goto("/benefits");
  await expect(page.getByText("Independent community resource")).toBeVisible();
  await expect(page.getByText("Potential partner · terms pending")).toBeVisible();
  await expect(page.getByRole("button", { name: "No claimable offer" })).toBeDisabled();
  await context.route("https://muse-codes.pages.dev/**", (route) => route.abort());
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Open external resource" }).click();
  const popup = await popupPromise;
  await popup.close();
  await expect(page.getByRole("status").first()).toContainText("not counted as redemption");
  await expect(page.getByText(/opened · not provider verified/)).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("skip link works and 200 percent reflow equivalent keeps the main action usable", async ({ page }) => {
  await page.goto("/start");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  await page.setViewportSize({ width: 180, height: 800 });
  const primary = page.getByRole("button", { name: /Tell me about your work/ });
  await expect(primary).toBeVisible();
  await expect(primary).toBeEnabled();
  await expectNoHorizontalOverflow(page);
  await primary.click();
  await expect(page).toHaveURL(/\/background\?source=conversation/);
});

test("the full participant flow has no automated WCAG violations and survives reduced viewports", async ({ page }) => {
  await page.goto("/start");
  for (const size of [{ width: 360, height: 420 }, { width: 800, height: 360 }]) {
    await page.setViewportSize(size);
    await expect(page.getByRole("button", { name: /Tell me about your work/ })).toBeEnabled();
    await expectNoHorizontalOverflow(page);
  }
  await expectNoWcagViolations(page);

  await page.getByRole("button", { name: /Tell me about your work/ }).click();
  await expect(page).toHaveURL(/\/background\?source=conversation/);
  await expectNoWcagViolations(page);

  await page.getByRole("button", { name: "Continue without background" }).click();
  await expect(page).toHaveURL(/\/interview/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoWcagViolations(page);

  await page.getByRole("button", { name: "Show my summary" }).click();
  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoWcagViolations(page);

  await page.goto("/resume");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoWcagViolations(page);

  await page.goto("/benefits");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoWcagViolations(page);
});

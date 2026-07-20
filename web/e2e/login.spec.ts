import { expect, test, type Page } from "@playwright/test";

async function openLoginForm(page: Page) {
  await page.goto("/login");

  const introButton = page.getByLabel("Lanjut ke halaman login");

  try {
    await introButton.click({ timeout: 1_000 });
  } catch {
    // The intro also auto-closes, so a missing button is fine here.
  }

  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
}

test("login page renders the public entry point", async ({ page }) => {
  await openLoginForm(page);

  await expect(page).toHaveTitle(/FaceAttend|web/i);
  await expect(page.getByText("Face Attend System")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Masuk$/ })).toBeVisible();
});

test("manual login validates required fields without calling the API", async ({
  page,
}) => {
  await openLoginForm(page);

  await page.getByRole("button", { name: /^Masuk$/ }).click();

  await expect(page.getByRole("heading", { name: "Data belum lengkap" }))
    .toBeVisible();
  await expect(page.getByText("Email dan password wajib diisi.")).toBeVisible();
});

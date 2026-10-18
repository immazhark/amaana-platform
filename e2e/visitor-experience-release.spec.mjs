import { expect, test } from "@playwright/test";

test("homepage offers verified Eid evidence and a direct volunteering journey", async ({ page }) => {
  await page.goto("/");
  const evidence = page.getByRole("group", { name: "Eid Gift Kit family reach from 2020 through 2026" });
  await expect(evidence.locator("details")).toHaveCount(7);
  await evidence.locator("summary").last().click();
  await expect(evidence.locator("details").last()).toContainText("+60 compared with 2025.");
  const volunteer = page.getByRole("link", { name: "Volunteer time or skills" });
  await expect(volunteer).toHaveAttribute("href", "/get-involved/volunteer");
  await volunteer.click();
  await expect(page.getByRole("checkbox")).toHaveCount(6);
});

test("volunteers can review two skills and an availability without registering or sending email", async ({ page }) => {
  await page.goto("/get-involved/volunteer");
  await page.getByRole("checkbox", { name: "Distribution and packing" }).check();
  await page.getByRole("checkbox", { name: "Technology and website support" }).check();
  await page.getByLabel("Your availability").selectOption("Weekends");
  await page.getByRole("button", { name: "Review my volunteer enquiry" }).click();
  const email = await page.getByRole("link", { name: "Open prepared email" }).getAttribute("href");
  const message = new URL(email).searchParams.get("body") ?? "";
  expect(message).toContain("Technology and website support");
  expect(message).toContain("Distribution and packing");
  expect(message).toContain("Weekends");
  await expect(page.locator("form[action^='/api/']")).toHaveCount(0);
});

test("contact concerns and Taleem sponsorship both offer safe, user-controlled enquiry reviews", async ({ page }) => {
  await page.goto("/contact");
  const feedback = page.getByRole("link", { name: /Share private feedback/ });
  await expect(feedback).toHaveAttribute("href", "/contact/feedback");
  const volunteering = page.getByRole("link", { name: /Explore volunteering/ });
  await expect(volunteering).toHaveAttribute("href", "/get-involved/volunteer");
  await feedback.click();
  await page.getByRole("radio", { name: "Concern or complaint" }).check();
  await page.getByLabel("Feedback topic").selectOption("website");
  await page.getByRole("button", { name: "Review feedback" }).click();
  const feedbackHref = await page.getByRole("link", { name: "Open prepared feedback email" }).getAttribute("href");
  const feedbackBody = new URL(feedbackHref).searchParams.get("body") ?? "";
  expect(feedbackBody).toContain("Website or accessibility");
  expect(feedbackBody).toContain("not consent to publish");

  await page.goto("/get-involved/sponsor-education");
  await page.getByLabel("Education pathway").selectOption("hifdh");
  await page.getByLabel("Support preference").selectOption("once");
  await page.getByRole("button", { name: "Review enquiry" }).click();
  const sponsorHref = await page.getByRole("link", { name: "Open email with these preferences" }).getAttribute("href");
  const sponsorship = new URL(sponsorHref).searchParams.get("body") ?? "";
  expect(sponsorship).toContain("Hifdh education");
  expect(sponsorship).toContain("does not reserve a student placement");
  expect(sponsorship).toContain("does not reserve a student placement or authorize a payment");
});

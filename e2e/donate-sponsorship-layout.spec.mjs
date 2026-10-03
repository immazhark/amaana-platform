import { expect, test } from '@playwright/test';

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`donation headings and sponsorship supporting copy at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/donate');
    await expect(page.getByRole('heading', { name: 'Domestic donations only', exact: true })).toBeVisible();
    const donation = await page.locator('.canonical-block').evaluateAll(blocks => blocks.slice(0, 2).map(block => {
      const title = block.querySelector('h2');
      const copy = block.lastElementChild;
      return { left: title.getBoundingClientRect().left, top: title.getBoundingClientRect().top, bottom: title.getBoundingClientRect().bottom, copyLeft: copy.getBoundingClientRect().left, copyTop: copy.getBoundingClientRect().top, font: getComputedStyle(title).fontSize, shellLeft: block.getBoundingClientRect().left };
    }));
    expect(donation).toHaveLength(2);
    expect(donation[0].font).toBe(donation[1].font);
    for (const block of donation) {
      expect(Math.abs(block.left - block.shellLeft)).toBeLessThan(2);
      if (width > 700) expect(block.copyLeft).toBeGreaterThan(block.left + 100);
      else expect(block.copyTop).toBeGreaterThanOrEqual(block.bottom);
    }
    await page.goto('/get-involved/sponsor-education');
    const school = await page.locator('.taleem-school-grid').evaluate(grid => {
      const lead = grid.querySelector('.taleem-school-lead');
      const copy = lead.nextElementSibling;
      const left = grid.firstElementChild.getBoundingClientRect();
      const right = grid.lastElementChild.getBoundingClientRect();
      return { font: parseFloat(getComputedStyle(lead).fontSize), family: getComputedStyle(lead).fontFamily, bodyFamily: getComputedStyle(copy).fontFamily, leftTop: left.top, leftBottom: left.bottom, rightTop: right.top, leadTop: lead.getBoundingClientRect().top, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
    });
    expect(school.font).toBeLessThanOrEqual(19);
    expect(school.family).toBe(school.bodyFamily);
    expect(school.overflow).toBe(false);
    expect(Math.abs(school.leadTop - school.rightTop)).toBeLessThan(2);
    if (width > 760) expect(Math.abs(school.leftTop - school.rightTop)).toBeLessThan(2);
    else expect(school.rightTop).toBeGreaterThan(school.leftBottom);
  });
}

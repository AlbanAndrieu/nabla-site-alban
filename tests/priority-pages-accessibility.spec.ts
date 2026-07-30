import { expect, test } from "@playwright/test";

const englishPaths = [
  "/",
  "/expertise.html",
  "/contact.html",
  "/security.html",
  "/ai.html",
  "/ciso.html",
  "/truenas.html",
  "/link.html",
  "/email.html",
  "/nabla.html",
  "/cv",
  "/jm",
] as const;

for (const locale of ["en", "fr"] as const) {
  test(`indexed ${locale} pages expose accessible document foundations`, async ({
    page,
  }) => {
    for (const englishPath of englishPaths) {
      const pathname =
        locale === "fr"
          ? englishPath === "/"
            ? "/fr"
            : `/fr${englishPath}`
          : englishPath;
      const response = await page.goto(pathname);
      expect(response?.ok(), `${pathname} should load`).toBeTruthy();
      await expect(
        page.locator("html"),
        `${pathname} should set lang`,
      ).toHaveAttribute("lang", locale);
      await expect(
        page.locator("main#main-content"),
        `${pathname} should expose one named main landmark`,
      ).toHaveCount(1);
      await expect(
        page.locator("body h1"),
        `${pathname} should expose one primary heading`,
      ).toHaveCount(1);

      const issues = await page.evaluate(() => {
        const duplicateIds = Array.from(document.querySelectorAll("[id]"))
          .map(({ id }) => id)
          .filter((id, index, ids) => id && ids.indexOf(id) !== index);
        const imagesWithoutAlt = Array.from(
          document.querySelectorAll("main#main-content img:not([alt])"),
        ).map((image) => image.outerHTML.slice(0, 160));
        return { duplicateIds: [...new Set(duplicateIds)], imagesWithoutAlt };
      });
      expect(issues, `${pathname} should have clean accessible markup`).toEqual(
        {
          duplicateIds: [],
          imagesWithoutAlt: [],
        },
      );

      const skipLink = page.locator('a[href="#main-content"]').first();
      await expect(
        skipLink,
        `${pathname} should expose a skip link`,
      ).toBeAttached();
      await skipLink.focus();
      const focusIsVisible = await skipLink.evaluate((element) => {
        const style = getComputedStyle(element);
        return (
          document.activeElement === element &&
          (style.outlineStyle !== "none" ||
            style.boxShadow !== "none" ||
            style.textDecorationLine !== "none")
        );
      });
      expect(focusIsVisible, `${pathname} should show keyboard focus`).toBe(
        true,
      );
    }
  });
}

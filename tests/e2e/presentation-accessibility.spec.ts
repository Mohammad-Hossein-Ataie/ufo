import { expect, test } from "@playwright/test";

test("mobile drawer contains keyboard focus and restores its opener", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const opener = page.getByRole("button", { name: "باز کردن منو", exact: true });
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(page.locator("html")).toHaveJSProperty("scrollWidth", 360);
  await page.screenshot({ path: "temp/presentation/retail-360.png" });
});

for (const route of ["/", "/b2b"]) {
  test(`${route} media frames reserve stable space and theme focus is scoped`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(route);
    const frames = page.locator(".media-frame");
    expect(await frames.count()).toBeGreaterThan(0);
    const dimensions = await frames.evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          ratio: getComputedStyle(node).aspectRatio,
        };
      }),
    );
    for (const frame of dimensions) {
      expect(frame.width).toBeGreaterThan(0);
      const [w, h] = frame.ratio.split("/").map(Number);
      expect(frame.width / frame.height).toBeCloseTo(w / h, 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const focus = await page
      .locator("main")
      .evaluate((el) => getComputedStyle(el).getPropertyValue("--ui-focus").trim());
    expect(focus).toBe(route === "/" ? "#63e6ff" : "#176d48");
    await page.screenshot({
      path: `temp/presentation/${route === "/" ? "retail" : "b2b"}-360.png`,
    });
  });
}

test("content remains visible without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("footer .motion-reveal")).toHaveCSS("opacity", "1");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await context.close();
});

test("footer keeps contact values right-aligned and confirms copying responsively", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");

  const footer = page.locator("footer");
  const seal = footer.getByRole("link", {
    name: "اعتبارسنجی نماد اعتماد الکترونیکی یوفوپاف",
    exact: true,
  });
  await seal.scrollIntoViewIfNeeded();
  await expect(seal).toBeVisible();
  await expect(seal).toHaveAttribute(
    "href",
    "https://trustseal.enamad.ir/?id=7628595&Code=9H4ALixgxYdhUO3XrI7dMMNT5ULunNIC",
  );
  await expect(seal).toHaveAttribute("target", "_blank");
  await expect(seal.locator("img")).toHaveAttribute(
    "src",
    "https://trustseal.enamad.ir/logo.aspx?id=7628595&Code=9H4ALixgxYdhUO3XrI7dMMNT5ULunNIC",
  );
  const email = footer.getByRole("button", {
    name: "کپی ایمیل: admin@ufopuff.com",
    exact: true,
  });
  const phone = footer.getByRole("button", {
    name: "کپی شماره تماس: 09362157181",
    exact: true,
  });
  await expect(email).toBeVisible();
  await expect(phone).toBeVisible();
  const expectRightAligned = async () => {
    const geometry = await email.evaluate((button) => {
      const icon = button.querySelector("svg")!.getBoundingClientRect();
      const value = button.querySelector("span")!.getBoundingClientRect();
      return { iconLeft: icon.left, valueRight: value.right };
    });
    expect(geometry.iconLeft).toBeGreaterThanOrEqual(geometry.valueRight);
  };
  await expectRightAligned();
  await email.click();
  await expect(email.getByRole("status")).toHaveText("کپی شد!");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("admin@ufopuff.com");
  await phone.click();
  await expect(phone.getByRole("status")).toHaveText("کپی شد!");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("09362157181");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await footer.screenshot({ path: "temp/presentation/footer-trust-360.png" });

  await page.setViewportSize({ width: 1440, height: 900 });
  await expectRightAligned();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await footer.screenshot({ path: "temp/presentation/footer-trust-1440.png" });
});

test("generic frames preserve geometry for square, portrait and landscape media", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const frame = page.locator(".media-frame").first();
  await frame.scrollIntoViewIfNeeded();
  const initial = await frame.boundingBox();
  // Exercise the frame with deterministic, transparent sources, independent of catalog data.
  for (const [width, height] of [
    [200, 200],
    [100, 400],
    [400, 100],
  ]) {
    await frame.evaluate(
      async (node, dimensions) => {
        const image = node.querySelector("img")!;
        image.removeAttribute("srcset");
        image.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions[0]}" height="${dimensions[1]}"><rect x="5" y="5" width="${dimensions[0] - 10}" height="${dimensions[1] - 10}" fill="teal"/></svg>`)}`;
        await image.decode();
      },
      [width, height],
    );
    const box = await frame.boundingBox();
    expect(box!.width).toBeCloseTo(initial!.width, 1);
    expect(box!.height).toBeCloseTo(initial!.height, 1);
    await expect(frame.locator("img")).toHaveCSS("object-fit", "contain");
  }
});

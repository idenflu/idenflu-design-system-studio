const { test, expect } = require("@playwright/test");

test("Button Group has its own document in the Components navigation", async ({ page }) => {
  await page.goto("/systems/idenflu-mono/index.html#/components/buttons");
  await expect(page.getByRole("group", { name: "파일 작업", exact: true })).toHaveCount(0);
  const navigation = page.getByRole("navigation", { name: "문서 탐색" });
  const link = navigation.getByRole("link", { name: "Button Group", exact: true });
  await link.click();
  await expect(page).toHaveURL(/#\/components\/button-group$/);
  await expect(link).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { level: 1, name: "Button Group", exact: true })).toBeVisible();
  await expect(page.locator(".react-studio-code code")).toContainText(
    '<ButtonGroup aria-label="파일 작업" size="md">'
  );
});

test("ButtonGroup size controls its buttons and takes precedence over a child size", {
  tag: ["@theme", "@mobile"],
}, async ({ page }) => {
  await page.goto("/systems/idenflu-mono/index.html#/components/button-group");
  const metrics = [];
  for (const [size, iconWidth] of [["sm", "14px"], ["md", "16px"], ["lg", "18px"]]) {
    const group = page.getByRole("group", { name: `${size} 파일 작업`, exact: true });
    const copy = group.getByRole("button", { name: "복사" });
    const download = group.getByRole("button", { name: "내보내기" });
    await expect(group).toHaveAttribute("data-size", size);
    await expect(copy.locator(".ui-icon")).toHaveCSS("width", iconWidth);
    await expect(download.locator(".ui-icon")).toHaveCSS("width", iconWidth);

    const dimensions = await copy.evaluate((button) => {
      const style = getComputedStyle(button);
      return { height: parseFloat(style.minHeight), padding: parseFloat(style.paddingInlineStart), gap: parseFloat(style.gap) };
    });
    metrics.push(dimensions);

    // Button renders its own size as data-size. Simulate a conflicting child size.
    await download.evaluate((button, size) => { button.dataset.size = size; }, size === "lg" ? "sm" : "lg");
    await expect(download).toHaveCSS("min-height", `${dimensions.height}px`);
    await expect(download).toHaveCSS("padding-inline-start", `${dimensions.padding}px`);
    await expect(download).toHaveCSS("gap", `${dimensions.gap}px`);
    await expect(download.locator(".ui-icon")).toHaveCSS("width", iconWidth);
  }
  for (const key of ["height", "padding", "gap"]) {
    expect(metrics[0][key]).toBeLessThan(metrics[1][key]);
    expect(metrics[1][key]).toBeLessThan(metrics[2][key]);
  }

  const unsized = page.getByRole("group", { name: "파일 작업", exact: true });
  const copy = unsized.getByRole("button", { name: "복사" });
  await expect(copy.locator(".ui-icon")).toHaveCSS("width", "16px");
  await copy.evaluate((button) => { button.dataset.size = "sm"; });
  await expect(copy.locator(".ui-icon")).toHaveCSS("width", "14px");
});

test("ButtonGroup shares outline and interaction styles across colors", {
  tag: ["@theme", "@mobile"],
}, async ({ page, isMobile }) => {
  await page.goto("/systems/idenflu-mono/index.html#/components/button-group");
  const group = page.getByRole("group", { name: "파일 작업", exact: true });
  const copy = group.getByRole("button", { name: "복사" });
  const download = group.getByRole("button", { name: "내보내기" });
  const remove = group.getByRole("button", { name: "삭제" });
  const restore = group.getByRole("button", { name: "복원" });
  const colors = await group.evaluate((el) => {
    const probe = document.createElement("span");
    el.append(probe);
    const colors = Object.fromEntries(
      ["primary", "text", "danger-text", "disabled-text", "border", "surface-raised",
        "surface-hover", "surface-pressed", "focus-on-light"].map((token) => {
        probe.style.color = `var(--${token})`;
        return [token, getComputedStyle(probe).color];
      })
    );
    probe.remove();
    return colors;
  });

  await expect(group).toHaveCSS("border-top-color", colors.border);
  await expect(copy).toHaveCSS("color", colors.primary);
  await expect(download).toHaveCSS("color", colors.text);
  await expect(remove).toHaveCSS("color", colors["danger-text"]);
  for (const [button, color] of [
    [copy, colors.primary],
    [download, colors.text],
    [remove, colors["danger-text"]],
    [restore, colors["disabled-text"]],
  ]) {
    await expect(button.locator(".ui-icon")).toHaveCSS("background-color", color);
  }
  for (const button of [copy, download, remove]) {
    await expect(button).toHaveCSS("background-color", colors["surface-raised"]);
    await expect(button).toHaveCSS("border-inline-end-color", colors.border);
    await expect(button).toHaveCSS("box-shadow", "none");
  }
  await expect(restore).toBeDisabled();
  await expect(restore).toHaveCSS("color", colors["disabled-text"]);
  await expect(restore).toHaveCSS("border-inline-end-width", "0px");
  await expect(restore).toHaveCSS("box-shadow", "none");
  expect(await group.evaluate((el) => el.scrollWidth)).toBeLessThanOrEqual(
    await group.evaluate((el) => el.clientWidth)
  );

  await download.focus();
  await page.keyboard.press("Tab");
  await expect(remove).toBeFocused();
  await expect(remove).toHaveCSS("box-shadow", `${colors["focus-on-light"]} 0px 0px 0px 2px inset`);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "삭제를 선택했습니다." })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(restore).not.toBeFocused();

  if (!isMobile) {
    await remove.hover();
    await expect(remove).toHaveCSS("background-color", colors["surface-hover"]);
    await page.mouse.down();
    await expect(remove).toHaveCSS("background-color", colors["surface-pressed"]);
    await page.mouse.up();
  }
});

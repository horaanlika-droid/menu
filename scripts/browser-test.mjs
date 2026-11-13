import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { launchBrowser, appUrl, root } from "./browser.mjs";
import path from "node:path";

const artifact = (name) => path.join(root, "artifacts", name);
await fs.mkdir(artifact(""), { recursive: true });
const browser = await launchBrowser();
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(appUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator(".card-tile").count(), 12);
  assert.equal(await page.locator(".print-sheet").count(), 4);
  assert.equal(await page.locator(".print-card").count(), 72);
  const cocktailTypography = await page
    .locator(".card-grid .card-title")
    .first()
    .evaluate((el) => ({
      family: getComputedStyle(el).fontFamily,
      weight: getComputedStyle(el).fontWeight,
    }));
  assert.match(cocktailTypography.family, /Helvetica/i);
  assert.equal(cocktailTypography.weight, "700");
  assert.ok(
    await page.evaluate(() =>
      document.fonts.check('20px "Noto Sans Symbols 2"', "♥♦♠♣"),
    ),
  );

  await page.getByRole("button", { name: /^Разложить всю колоду/ }).click();
  const originalOrder = await page
    .locator(".card-grid .card-tile")
    .evaluateAll((tiles) => tiles.map((tile) => tile.dataset.cardId));
  const printOrder = await page
    .locator(".print-card")
    .evaluateAll((cards) => cards.map((card) => card.dataset.cardId));
  await page
    .getByRole("button", { name: "Перемешать колоду", exact: true })
    .click();
  const shuffledOrder = await page
    .locator(".card-grid .card-tile")
    .evaluateAll((tiles) => tiles.map((tile) => tile.dataset.cardId));
  assert.equal(shuffledOrder.length, 36);
  assert.equal(new Set(shuffledOrder).size, 36);
  assert.notDeepEqual(shuffledOrder, originalOrder);
  assert.deepEqual(
    await page
      .locator(".print-card")
      .evaluateAll((cards) => cards.map((card) => card.dataset.cardId)),
    printOrder,
    "shuffling the screen order must not change the print layout",
  );
  await page.locator(".card-open").first().click();
  assert.equal(
    await page.locator(".detail-navigation>span").textContent(),
    "1 / 36",
  );
  await page
    .getByRole("button", { name: "Следующая карта", exact: true })
    .click();
  assert.equal(
    await page.locator(".detail-navigation>span").textContent(),
    "2 / 36",
  );
  await page.keyboard.press("Escape");
  await page.reload({ waitUntil: "networkidle" });

  for (const [label, count] of [
    ["Крашеры", 3],
    ["С пузырьками", 6],
    ["Фруктовые", 6],
    ["Барная классика", 6],
    ["Без алкоголя", 3],
    ["Интерактив", 12],
  ]) {
    await page.getByRole("button", { name: new RegExp(`^${label}`) }).click();
    assert.equal(await page.locator(".card-tile").count(), count, label);
    assert.equal(
      await page.locator(".print-card").count(),
      72,
      "filters must never truncate the print deck",
    );
  }
  const interactiveTypography = await page
    .locator(".card-grid .card-title")
    .first()
    .evaluate((el) => ({
      family: getComputedStyle(el).fontFamily,
      weight: getComputedStyle(el).fontWeight,
    }));
  assert.match(interactiveTypography.family, /Great Vibes/i);
  assert.equal(interactiveTypography.weight, "400");
  await page
    .getByRole("button", { name: "Случайная карта", exact: true })
    .click();
  assert.ok(
    (await page.locator(".detail-content>.eyebrow").textContent()).includes(
      "Интерактив",
    ),
  );
  assert.equal(
    await page
      .locator(".detail-content .modal-title")
      .evaluate((el) => el.classList.contains("cocktail-title")),
    false,
  );
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);

  await page.getByRole("button", { name: /^Вся колода/ }).click();
  await page
    .getByRole("button", { name: "Показать рубашки карт", exact: true })
    .click();
  assert.equal(await page.locator(".card-grid .card-back").count(), 12);
  await page
    .getByRole("button", { name: "Показать лица карт", exact: true })
    .click();
  await page.getByRole("button", { name: /^Разложить всю колоду/ }).click();
  assert.equal(await page.locator(".card-tile").count(), 36);
  await page.locator(".card-open").first().click();
  assert.equal(
    await page
      .locator(".detail-content .modal-title")
      .evaluate((el) => el.classList.contains("cocktail-title")),
    true,
  );
  await page
    .getByRole("button", { name: "Следующая карта", exact: true })
    .click();
  assert.equal(
    await page.locator(".detail-navigation>span").textContent(),
    "2 / 36",
  );
  await page
    .getByRole("button", { name: "Предыдущая карта", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Посмотреть рубашку", exact: true })
    .click();
  assert.equal(await page.locator(".detail-card .card-back").count(), 1);
  await page
    .getByRole("button", { name: "Показать лицо", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Изменить текст карты", exact: true })
    .click();
  await page.getByLabel(/^Название/).fill("Наш Маракуйя Краш");
  await page
    .getByLabel(/^Описание вкуса/)
    .fill("Маракуйя, ваниль и нежная кислинка. Тот самый вкус нашего вечера.");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  assert.equal(
    await page
      .getByRole("heading", {
        level: 2,
        name: "Наш Маракуйя Краш",
        exact: true,
      })
      .count(),
    1,
  );
  await page.keyboard.press("Escape");
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    await page.locator(".card-grid .card-title").first().textContent(),
    "Наш Маракуйя Краш",
  );
  assert.equal(
    await page.locator(".print-grid .card-title").first().textContent(),
    "Наш Маракуйя Краш",
  );
  await page.locator(".card-open").first().click();
  await page
    .getByRole("button", { name: "Изменить текст карты", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Вернуть исходный текст", exact: true })
    .click();
  await page.getByRole("button", { name: "Отмена", exact: true }).click();
  await page.keyboard.press("Escape");
  assert.equal(
    await page.locator(".card-grid .card-title").first().textContent(),
    "Маракуйя Краш",
  );

  // Exercise a changed Cyrillic face as well as a changed common back.
  await page.locator(".card-open").first().click();
  await page
    .getByRole("button", { name: "Изменить текст карты", exact: true })
    .click();
  await page.getByLabel(/^Название/).fill("Маракуйя для двоих");
  await page
    .getByLabel(/^Описание вкуса/)
    .fill("Сочная маракуйя, мягкая ваниль и приятная кислинка. Всё сложилось.");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await page.keyboard.press("Escape");

  await page
    .getByRole("button", { name: "Печать колоды", exact: true })
    .click();
  await page
    .getByLabel("Подпись на рубашке", { exact: true })
    .fill("Анна & Михаил");
  await page.getByLabel(/^Дата/).fill("13.06.2027");
  await page.getByRole("radio", { name: /Светлая/ }).check();
  await page.getByLabel("Метки реза на листах", { exact: true }).uncheck();
  assert.equal(await page.locator(".crop-marks").count(), 0);
  assert.equal(
    await page.locator(".print-sheet .back-event").first().textContent(),
    "Анна & Михаил",
  );
  await page.getByRole("button", { name: "Рубашки", exact: true }).click();
  await page.screenshot({ path: artifact("print-settings.png") });
  // PDF generation is entirely client-side, including local Cyrillic fonts.
  const customDownloadPromise = page.waitForEvent("download", {
    timeout: 180000,
  });
  await page.getByRole("button", { name: "Скачать PDF", exact: true }).click();
  const customDownload = await customDownloadPromise;
  assert.equal(await customDownload.failure(), null);
  await customDownload.saveAs(artifact("custom-deck.pdf"));
  const customPdf = await PDFDocument.load(
    await fs.readFile(artifact("custom-deck.pdf")),
  );
  assert.equal(customPdf.getPageCount(), 4);
  for (const p of customPdf.getPages())
    assert.ok(Math.abs(p.getWidth() - (420 * 72) / 25.4) < 1);
  await page.evaluate(() => {
    window.print = () => {
      window.__printed = true;
    };
  });
  await page.getByRole("button", { name: "Печатать", exact: true }).click();
  assert.ok(await page.evaluate(() => window.__printed));
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () => document.querySelector(".header-print") === document.activeElement,
  );
  assert.ok(
    await page
      .locator(".header-print")
      .evaluate((el) => el === document.activeElement),
    "focus returns to the opener",
  );
  console.log(
    "PASS filters, random card, face/back, navigation, editable texts, persistence, settings, custom PDF and print action",
  );

  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  const defaultDownloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Скачать для печати", exact: true })
    .click();
  const defaultDownload = await defaultDownloadPromise;
  await defaultDownload.saveAs(artifact("default-deck.pdf"));
  assert.equal(
    (
      await PDFDocument.load(await fs.readFile(artifact("default-deck.pdf")))
    ).getPageCount(),
    4,
  );

  for (const width of [320, 360, 390, 700, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `horizontal overflow at ${width}px`,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: artifact("mobile-final.png"), fullPage: true });
  await page
    .getByRole("button", { name: "Печать колоды", exact: true })
    .click();
  await page.screenshot({ path: artifact("mobile-settings.png") });
  const dialog = page.getByRole("dialog");
  const dialogBox = await dialog.boundingBox();
  assert.ok(dialogBox.x >= 0 && dialogBox.width <= 390);
  // Tab is trapped in the modal, not in the inert page behind it.
  for (let i = 0; i < 20; i++) await page.keyboard.press("Tab");
  assert.ok(await dialog.evaluate((el) => el.contains(document.activeElement)));
  await page.keyboard.press("Escape");
  console.log(
    "PASS responsive layouts (320–1440px), modal keyboard focus and default PDF download",
  );

  await page.setViewportSize({ width: 1600, height: 1150 });
  await page.emulateMedia({ media: "print" });
  const printMetrics = await page.evaluate(() => ({
    sheets: [...document.querySelectorAll(".print-sheet")].map((el) => ({
      width: el.getBoundingClientRect().width,
      height: el.getBoundingClientRect().height,
      side: el.dataset.side,
      cards: el.querySelectorAll(".print-card").length,
    })),
    card: (() => {
      const r = document.querySelector(".print-card").getBoundingClientRect();
      return { width: r.width, height: r.height };
    })(),
    overflow: [...document.querySelectorAll(".print-card .card-content")]
      .filter((el) => el.scrollHeight > el.clientHeight + 1)
      .map((el) => el.querySelector(".card-title").textContent),
    brokenWords: [...document.querySelectorAll(".print-card .cocktail-title")]
      .filter((el) => {
        const node = el.firstChild;
        return [...node.textContent.matchAll(/\S+/g)].some((match) => {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          return range.getClientRects().length > 1;
        });
      })
      .map((el) => el.textContent),
  }));
  assert.deepEqual(
    printMetrics.sheets.map((s) => s.side),
    ["front", "back", "front", "back"],
  );
  for (const sheet of printMetrics.sheets) {
    assert.equal(sheet.cards, 18);
    assert.ok(Math.abs(sheet.width - (420 * 96) / 25.4) < 0.2);
    assert.ok(Math.abs(sheet.height - (297 * 96) / 25.4) < 0.2);
  }
  assert.ok(Math.abs(printMetrics.card.width - (63 * 96) / 25.4) < 0.2);
  assert.ok(Math.abs(printMetrics.card.height - (88 * 96) / 25.4) < 0.2);
  assert.deepEqual(printMetrics.overflow, []);
  await page
    .locator('.print-sheet[data-side="front"]')
    .first()
    .screenshot({ path: artifact("print-front-final.png") });
  await page
    .locator('.print-sheet[data-side="back"]')
    .first()
    .screenshot({ path: artifact("print-back-final.png") });
  console.log(
    "PASS four correctly ordered A3 sides, 72 card faces/backs, physical dimensions, no default text overflow",
  );

  const blocked = await browser.newPage();
  blocked.on("pageerror", (error) => errors.push(error.message));
  await blocked.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    });
  });
  await blocked.goto(appUrl, { waitUntil: "networkidle" });
  assert.equal(await blocked.locator(".card-tile").count(), 12);
  assert.equal(await blocked.locator(".storage-warning").count(), 1);
  assert.deepEqual(errors, []);
  console.log("PASS blocked localStorage fallback; no browser errors");
} finally {
  await browser.close();
}

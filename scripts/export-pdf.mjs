import { launchBrowser, appUrl, root } from "./browser.mjs";
import { DECK, SUITS } from "../src/data.js";
import { PDFDocument } from "pdf-lib";
import fs from "node:fs/promises";
import path from "node:path";

const browser = await launchBrowser();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.goto(appUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: "print" });
  for (const style of ["burgundy", "light"]) {
    if (style === "light")
      await page.addStyleTag({
        content:
          ".print-card>.back-burgundy{background:#fff!important;color:#752235!important}",
      });
    const buffer = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      displayHeaderFooter: false,
      margin: { top: 0, left: 0, right: 0, bottom: 0 },
    });
    const doc = await PDFDocument.load(buffer);
    if (doc.getPageCount() !== 4)
      throw new Error(`Expected 4 A3 pages, got ${doc.getPageCount()}`);
    for (const p of doc.getPages()) {
      const { width, height } = p.getSize();
      if (
        Math.abs(width - (420 * 72) / 25.4) > 1 ||
        Math.abs(height - (297 * 72) / 25.4) > 1
      )
        throw new Error(`Wrong page size: ${width} × ${height}`);
      // Chromium's named A3 rounds to inches; normalise the PDF media box
      // without scaling the correctly millimetre-sized card contents.
      p.setSize((420 * 72) / 25.4, (297 * 72) / 25.4);
    }
    doc.setTitle("Счастье на руках — 36 свадебных карт");
    doc.setSubject(
      "24 напитка и 12 интерактивов. A3, 63 × 88 мм, 2 двусторонних листа.",
    );
    doc.setCreator("Счастье на руках");
    doc.setLanguage("ru-RU");
    const file = path.join(
      root,
      "public",
      style === "burgundy" ? "koloda-a3.pdf" : "koloda-a3-light.pdf",
    );
    const data = await doc.save();
    await fs.writeFile(file, data);
    console.log(
      `${path.relative(root, file)}: 4 pages, A3 landscape, ${(data.length / 1024).toFixed(0)} KB`,
    );
  }
  const menu = [
    "# Счастье на руках",
    "",
    "36 карт: 24 напитка (21 алкогольный и 3 безалкогольных), 12 вопросов и сюрпризов.",
    "",
    "Дизайн по IMG_7256.jpeg и IMG_7257.png: белая карта, тонкая чёрная рамка и масти; названия коктейлей набраны Helvetica Bold. Общая бордовая рубашка.",
    "",
    "## Напитки",
    "",
  ];
  for (const card of DECK.filter((c) => c.category !== "interactive"))
    menu.push(
      `### ${card.rank}${SUITS[card.suit].symbol} — ${card.title}`,
      `*${card.reference}*`,
      "",
      card.description,
      "",
    );
  menu.push(
    "## Вопросы и сюрпризы",
    "",
    "Участие только по желанию. Алкоголь и аллергии всегда уточняются заранее.",
    "",
  );
  for (const card of DECK.filter((c) => c.category === "interactive"))
    menu.push(
      `### ${card.rank}${SUITS[card.suit].symbol} — ${card.title}`,
      "",
      card.description,
      "",
    );
  menu.push(
    "## Печать",
    "",
    "Два листа А3 (420 × 297 мм), двусторонняя печать по короткой стороне, масштаб 100%, без подгонки и колонтитулов. Порядок PDF: лица 1, рубашки 1, лица 2, рубашки 2. На каждой стороне — 18 карт 63 × 88 мм; зазоры 3 мм; внешние поля 13,5 мм. Сначала проверьте совмещение на одном листе. Для ручной подачи сначала проведите тест направления листа в вашем принтере.",
    "",
    "Бордовая рубашка: koloda-a3.pdf. Экономная светлая: koloda-a3-light.pdf. Бумага 160–200 г/м², только если это допускает принтер. При печати из браузера включите фоновую графику.",
    "",
    "Крепость водки 30% относится к исходной базе, не к готовому коктейлю. Хлебная настойка может содержать глютен. Другие аллергены зависят от фактических заготовок. Рецептуры и пропорции в гостевую колоду не включены.",
    "",
  );
  await fs.writeFile(
    path.join(root, "public/menu-36-kart.md"),
    menu.join("\n"),
  );
} finally {
  await browser.close();
}

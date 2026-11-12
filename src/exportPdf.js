import { DEFAULT_SETTINGS, PRINT, DECK } from "./data";

export const PDF_NAME = "Счастье-на-руках-36-карт-А3.pdf";

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function exportPdf({ edits, settings, onProgress }) {
  await document.fonts.ready;
  let presetBytes;
  try {
    const response = await fetch(
      settings.backStyle === "light"
        ? "/koloda-a3-light.pdf"
        : "/koloda-a3.pdf",
    );
    if (response.ok && response.headers.get("content-type")?.includes("pdf"))
      presetBytes = await response.arrayBuffer();
  } catch {
    /* Static-host/offline fallback: render locally below. */
  }

  const customBack =
    settings.eventName !== DEFAULT_SETTINGS.eventName ||
    settings.date !== DEFAULT_SETTINGS.date;
  if (
    presetBytes &&
    !Object.keys(edits).length &&
    !customBack &&
    settings.cropMarks
  ) {
    saveBlob(new Blob([presetBytes], { type: "application/pdf" }), PDF_NAME);
    return;
  }

  const { PDFDocument, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const template = presetBytes ? await PDFDocument.load(presetBytes) : null;
  pdf.setTitle("Счастье на руках — 36 свадебных карт");
  pdf.setSubject("24 напитка и 12 интерактивов. Два двусторонних листа А3.");
  pdf.setCreator("Счастье на руках");
  pdf.setLanguage("ru-RU");

  const mm = (value) => (value * 72) / 25.4;
  const {
    pageWidth,
    pageHeight,
    cardWidth,
    cardHeight,
    columns,
    rows,
    gap,
    marginX,
    marginY,
  } = PRINT;
  const nodes = [
    ...document.querySelectorAll(
      '.print-sheet[data-side="front"] .playing-card',
    ),
  ];
  const back = document.querySelector(
    '.print-sheet[data-side="back"] .playing-card',
  );
  if (nodes.length !== 36 || !back)
    throw new Error(
      "Не удалось собрать все 36 карт. Обновите страницу и попробуйте ещё раз.",
    );

  let renderCard;
  let backImage;
  if (!template || customBack || Object.keys(edits).length) {
    const { toPng, getFontEmbedCSS } = await import("html-to-image");
    // Do not use html-to-image's preferredFontFormat: its stateful format regex
    // can discard every second @font-face (the Cyrillic subsets in our fonts).
    // Preserve every face, then remove only the redundant WOFF alternative.
    const fontEmbedCSS = (await getFontEmbedCSS(nodes[0])).replace(
      /,\s*url\([^)]*\)\s*format\(["']woff["']\)/g,
      "",
    );
    renderCard = async (node) =>
      pdf.embedPng(
        await toPng(node, {
          pixelRatio: 300 / 96,
          fontEmbedCSS,
          backgroundColor: "#fff",
          skipAutoScale: true,
        }),
      );
    if (!template || customBack) backImage = await renderCard(back);
  }

  function marks(page) {
    if (!settings.cropMarks) return;
    const line = (x1, y1, x2, y2) =>
      page.drawLine({
        start: { x: mm(x1), y: mm(pageHeight - y1) },
        end: { x: mm(x2), y: mm(pageHeight - y2) },
        thickness: mm(0.15),
        color: rgb(0.33, 0.33, 0.33),
      });
    for (let col = 0; col < columns; col++)
      for (const x of [
        marginX + col * (cardWidth + gap),
        marginX + col * (cardWidth + gap) + cardWidth,
      ]) {
        line(x, marginY - 4, x, marginY - 1);
        line(x, pageHeight - marginY + 1, x, pageHeight - marginY + 4);
      }
    for (let row = 0; row < rows; row++)
      for (const y of [
        marginY + row * (cardHeight + gap),
        marginY + row * (cardHeight + gap) + cardHeight,
      ]) {
        line(marginX - 4, y, marginX - 1, y);
        line(pageWidth - marginX + 1, y, pageWidth - marginX + 4, y);
      }
  }
  function clearMargins(page) {
    if (settings.cropMarks) return;
    for (const [x, y, width, height] of [
      [0, 0, marginX, pageHeight],
      [pageWidth - marginX, 0, marginX, pageHeight],
      [0, 0, pageWidth, marginY],
      [0, pageHeight - marginY, pageWidth, marginY],
    ]) {
      page.drawRectangle({
        x: mm(x),
        y: mm(y),
        width: mm(width),
        height: mm(height),
        color: rgb(1, 1, 1),
      });
    }
  }
  function place(page, image, position) {
    const x = marginX + (position % columns) * (cardWidth + gap);
    const top = marginY + Math.floor(position / columns) * (cardHeight + gap);
    page.drawImage(image, {
      x: mm(x),
      y: mm(pageHeight - top - cardHeight),
      width: mm(cardWidth),
      height: mm(cardHeight),
    });
  }
  for (let sheet = 0; sheet < 2; sheet++) {
    // Keep unedited cards as vector text. Only changed cards are rasterised at
    // 300 dpi, making a name/date change fast rather than repainting 36 cards.
    const frontPage = template
      ? pdf.addPage((await pdf.copyPages(template, [sheet * 2]))[0])
      : pdf.addPage([mm(pageWidth), mm(pageHeight)]);
    if (template) clearMargins(frontPage);
    else marks(frontPage);
    for (let i = 0; i < 18; i++) {
      const index = sheet * 18 + i;
      if (!template || edits[DECK[index].id])
        place(frontPage, await renderCard(nodes[index]), i);
      onProgress?.(index + 1);
    }
    if (template && !customBack) {
      const backPage = pdf.addPage(
        (await pdf.copyPages(template, [sheet * 2 + 1]))[0],
      );
      clearMargins(backPage);
    } else {
      const backPage = pdf.addPage([mm(pageWidth), mm(pageHeight)]);
      marks(backPage);
      for (let i = 0; i < 18; i++) place(backPage, backImage, i);
    }
  }
  saveBlob(new Blob([await pdf.save()], { type: "application/pdf" }), PDF_NAME);
}

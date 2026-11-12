import test from "node:test";
import assert from "node:assert/strict";
import {
  DECK,
  RANKS,
  SUITS,
  PRINT,
  CATEGORIES,
  DEFAULT_SETTINGS,
  loadSavedDeck,
} from "../src/data.js";

const storage = (value) => ({ getItem: () => value });

test("a full 36-card deck: 6 to ace in each suit, no duplicates", () => {
  assert.equal(DECK.length, 36);
  assert.equal(new Set(DECK.map((c) => c.id)).size, 36);
  for (const suit of Object.keys(SUITS))
    assert.deepEqual(
      DECK.filter((c) => c.suit === suit).map((c) => c.rank),
      RANKS,
    );
});
test("24 drinks (including 3 zero-proof) and 12 guest interactions", () => {
  assert.equal(DECK.filter((c) => c.category !== "interactive").length, 24);
  assert.equal(DECK.filter((c) => c.alcoholic).length, 21);
  assert.equal(DECK.filter((c) => c.category === "zero").length, 3);
  assert.equal(DECK.filter((c) => c.category === "interactive").length, 12);
  for (const card of DECK) {
    assert.ok(CATEGORIES.some((c) => c.id === card.category));
    assert.ok(card.title.length <= 48);
    assert.ok(card.description.length <= 170);
    assert.ok(card.description.trim());
    assert.equal(
      card.alcoholic,
      !["zero", "interactive"].includes(card.category),
    );
  }
});
test("18 standard cards fit symmetrically on each landscape A3 side", () => {
  const {
    pageWidth,
    pageHeight,
    cardWidth,
    cardHeight,
    gap,
    columns,
    rows,
    marginX,
    marginY,
  } = PRINT;
  assert.equal(columns * rows, 18);
  assert.equal(
    columns * cardWidth + (columns - 1) * gap + 2 * marginX,
    pageWidth,
  );
  assert.equal(rows * cardHeight + (rows - 1) * gap + 2 * marginY, pageHeight);
  assert.equal(DECK.length / (columns * rows), 2);
  assert.ok(marginX >= 10 && marginY >= 10);
});
test("saved custom texts are validated rather than spreading unknown fields", () => {
  const saved = loadSavedDeck(
    storage(
      JSON.stringify({
        settings: DEFAULT_SETTINGS,
        edits: {
          "hearts-A": {
            title: "Наш Краш",
            description: "Маракуйя и ваниль.",
            alcoholic: false,
          },
          "hearts-K": { title: "", description: "Invalid title." },
          "clubs-K": { title: "A".repeat(49), description: "Too long." },
          "not-a-card": { title: "Fake", description: "Unknown id." },
        },
      }),
    ),
  );
  assert.deepEqual(saved.edits, {
    "hearts-A": { title: "Наш Краш", description: "Маракуйя и ваниль." },
  });
});
test("broken or blocked browser storage does not crash the app", () => {
  for (const bad of ["{", "null", "true", "123", "[]"])
    assert.deepEqual(loadSavedDeck(storage(bad)), {
      edits: {},
      settings: DEFAULT_SETTINGS,
    });
  assert.deepEqual(
    loadSavedDeck({
      getItem() {
        throw new Error("blocked");
      },
    }),
    { edits: {}, settings: DEFAULT_SETTINGS },
  );
  assert.deepEqual(
    loadSavedDeck(
      storage(
        JSON.stringify({
          settings: { ...DEFAULT_SETTINGS, eventName: "<".repeat(46) },
        }),
      ),
    ).settings,
    DEFAULT_SETTINGS,
  );
});

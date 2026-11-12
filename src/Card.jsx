import React from "react";
import { SUITS, PRINT } from "./data";

export function Card({ card, back = false, settings, className = "" }) {
  const suit = SUITS[card.suit];
  if (back)
    return (
      <div
        className={`playing-card card-back ${settings?.backStyle === "burgundy" ? "back-burgundy" : "back-light"} ${className}`}
      >
        <div className="back-frame" />
        <div className="card-index index-top">
          <span>A</span>
          <span className="index-suit">♥</span>
        </div>
        <div className="back-content">
          <div className="back-ornament">♥</div>
          <span className="back-small">В ЭТОТ ВЕЧЕР</span>
          <p className="back-title">
            Всё
            <br />
            <em>сложилось.</em>
          </p>
          <div className="back-divider">
            <span />✧<span />
          </div>
          <span className="back-event">
            {settings?.eventName || "Свадебный вечер"}
          </span>
          {settings?.date && <span className="back-date">{settings.date}</span>}
          <div className="back-bottom-suits">♥ ♣ ♦ ♠</div>
        </div>
        <div className="card-index index-bottom">
          <span>A</span>
          <span className="index-suit">♥</span>
        </div>
      </div>
    );
  return (
    <div
      className={`playing-card card-front suit-${suit.color} category-${card.category} ${className}`}
    >
      <div className="card-frame" />
      <div className="card-index index-top">
        <span>{card.rank}</span>
        <span className="index-suit">{suit.symbol}</span>
      </div>
      {card.category === "zero" && <span className="zero-proof">0%</span>}
      <div className="card-pip pip-top">{suit.symbol}</div>
      <div className="card-content">
        <span className="card-reference">{card.reference}</span>
        <h3
          className={`card-title ${card.title.length > 26 ? "long-title" : ""}`}
        >
          {card.title}
        </h3>
        <span className="card-rule" />
        <p className="card-description">{card.description}</p>
      </div>
      <div className="card-pip pip-bottom">{suit.symbol}</div>
      <div className="card-index index-bottom">
        <span>{card.rank}</span>
        <span className="index-suit">{suit.symbol}</span>
      </div>
    </div>
  );
}

export function CropMarks() {
  const {
    columns,
    rows,
    cardWidth,
    cardHeight,
    gap,
    marginX,
    marginY,
    pageWidth,
    pageHeight,
  } = PRINT;
  const xs = Array.from({ length: columns }, (_, i) => [
    marginX + i * (cardWidth + gap),
    marginX + i * (cardWidth + gap) + cardWidth,
  ]).flat();
  const ys = Array.from({ length: rows }, (_, i) => [
    marginY + i * (cardHeight + gap),
    marginY + i * (cardHeight + gap) + cardHeight,
  ]).flat();
  return (
    <svg
      className="crop-marks"
      viewBox={`0 0 ${pageWidth} ${pageHeight}`}
      aria-hidden="true"
    >
      <g stroke="#555" strokeWidth="0.15" fill="none">
        {xs.map((x) => (
          <path
            key={`x${x}`}
            d={`M${x} ${marginY - 4}v3M${x} ${pageHeight - marginY + 1}v3`}
          />
        ))}
        {ys.map((y) => (
          <path
            key={`y${y}`}
            d={`M${marginX - 4} ${y}h3M${pageWidth - marginX + 1} ${y}h3`}
          />
        ))}
      </g>
    </svg>
  );
}

export function PrintDeck({ cards, settings }) {
  return (
    <div className="print-root" aria-hidden="true" id="print-deck">
      {[0, 1].flatMap((sheet) =>
        [false, true].map((back) => (
          <section
            className="print-sheet"
            key={`${sheet}-${back}`}
            data-sheet={sheet + 1}
            data-side={back ? "back" : "front"}
          >
            {settings.cropMarks && <CropMarks />}
            <div className="print-grid">
              {cards.slice(sheet * 18, sheet * 18 + 18).map((card) => (
                <div
                  key={card.id}
                  className="print-card"
                  data-card-id={card.id}
                >
                  <Card card={card} back={back} settings={settings} />
                </div>
              ))}
            </div>
            <div className="print-footer">
              <span>СЧАСТЬЕ НА РУКАХ</span>
              <span>
                Лист {sheet + 1} / 2 · {back ? "Рубашки" : "Лица"} · А3 · 100% ·
                63 × 88 мм
              </span>
            </div>
          </section>
        )),
      )}
    </div>
  );
}

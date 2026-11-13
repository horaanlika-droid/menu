import React, { useEffect, useId, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Download,
  FlipHorizontal2,
  Heart,
  Info,
  LoaderCircle,
  Pencil,
  Printer,
  RotateCcw,
  Scissors,
  Shuffle,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Card, PrintDeck } from "./Card";
import {
  CATEGORIES,
  DECK,
  DEFAULT_SETTINGS,
  STORAGE_KEY,
  SUITS,
  loadSavedDeck,
} from "./data";
import { exportPdf } from "./exportPdf";

const rankNames = {
  A: "Туз",
  K: "Король",
  Q: "Дама",
  J: "Валет",
  10: "Десятка",
  9: "Девятка",
  8: "Восьмёрка",
  7: "Семёрка",
  6: "Шестёрка",
};
const suitGenitives = {
  hearts: "червей",
  diamonds: "бубен",
  spades: "пик",
  clubs: "треф",
};
const cardName = (card) =>
  `${rankNames[card.rank]} ${suitGenitives[card.suit]}`;

function Logo() {
  return (
    <a href="#top" className="brand" aria-label="Счастье на руках — наверх">
      <span className="brand-mark" aria-hidden="true">
        <span>♠</span>
        <span>♥</span>
      </span>
      <span>
        <span className="brand-name">Счастье на руках</span>
        <span className="brand-caption">СВАДЕБНАЯ КОКТЕЙЛЬНАЯ КОЛОДА</span>
      </span>
    </a>
  );
}

function Modal({ children, titleId, onClose, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab") return;
      const items = [
        ...ref.current.querySelectorAll(
          'button:not(:disabled), a[href], input:not(:disabled), textarea, select, summary, [tabindex="0"]',
        ),
      ].filter((el) => el.getClientRects().length);
      if (!items.length) {
        event.preventDefault();
        return;
      }
      const first = items[0],
        last = items.at(-1);
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === ref.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === ref.current)
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex="-1"
        ref={ref}
      >
        <button
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="Закрыть окно"
        >
          <X size={20} />
        </button>
        {children}
      </section>
    </div>
  );
}

function CardDetail({
  card,
  cardPosition,
  settings,
  onClose,
  onSave,
  onReset,
  onNext,
}) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [back, setBack] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [noteOpen, setNoteOpen] = useState(false);
  const category = CATEGORIES.find((c) => c.id === card.category);
  const valid = title.trim().length > 0 && description.trim().length > 0;
  return (
    <Modal titleId={id} onClose={onClose} className="card-modal">
      <div className="detail-visual">
        <span className="eyebrow">
          {card.rank} {SUITS[card.suit].symbol}{" "}
          <span className="eyebrow-dash" /> {cardName(card)}
        </span>
        <div className="detail-card">
          <Card
            card={editing ? { ...card, title, description } : card}
            settings={settings}
            back={back}
          />
        </div>
        <button
          className="text-button flip-button"
          onClick={() => setBack(!back)}
        >
          <FlipHorizontal2 size={15} />
          {back ? "Показать лицо" : "Посмотреть рубашку"}
        </button>
      </div>
      <div className="detail-content">
        <span className="eyebrow">
          {category.label}
          {card.category === "zero" ? " · 0%" : card.alcoholic ? " · 18+" : ""}
        </span>
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (valid) {
                onSave(card.id, {
                  title: title.trim(),
                  description: description.trim(),
                });
                setEditing(false);
              }
            }}
          >
            <h2 id={id} className="modal-title">
              Ваша карта.
              <br />
              <em>Ваши слова.</em>
            </h2>
            <label className="field-label" htmlFor={`${id}-title`}>
              Название <span>{title.length}/48</span>
            </label>
            <input
              id={`${id}-title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={48}
              required
            />
            <label className="field-label" htmlFor={`${id}-description`}>
              {card.category === "interactive"
                ? "Вопрос или задание"
                : "Описание вкуса"}{" "}
              <span>{description.length}/170</span>
            </label>
            <textarea
              id={`${id}-description`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={170}
              rows={5}
              required
            />
            <p className="field-hint">
              Лучше 1–2 коротких предложения: размер карты всего 63 × 88 мм.
            </p>
            <div className="edit-actions">
              <button
                className="button primary"
                type="submit"
                disabled={!valid}
              >
                <Check size={16} />
                Сохранить
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setTitle(card.title);
                  setDescription(card.description);
                  setEditing(false);
                }}
              >
                Отмена
              </button>
            </div>
            <button
              type="button"
              className="text-button reset-button"
              onClick={() => {
                const original = DECK.find((c) => c.id === card.id);
                setTitle(original.title);
                setDescription(original.description);
                onReset(card.id);
              }}
            >
              <RotateCcw size={13} />
              Вернуть исходный текст
            </button>
          </form>
        ) : (
          <>
            <h2
              id={id}
              className={`modal-title ${card.category !== "interactive" ? "cocktail-title" : ""}`}
            >
              {card.title}
            </h2>
            <p className="detail-reference">{card.reference}</p>
            <p className="detail-description">{card.description}</p>
            <div className="mood-label">{card.mood}</div>
            {card.ingredients && (
              <div className="ingredients">
                <span className="eyebrow">ВКУСОВАЯ ОСНОВА</span>
                <p>{card.ingredients}</p>
              </div>
            )}
            <button
              className="note-toggle text-button"
              aria-expanded={noteOpen}
              onClick={() => setNoteOpen(!noteOpen)}
            >
              <Info size={14} />
              На заметку бармену
              <ChevronDown size={14} className={noteOpen ? "rotated" : ""} />
            </button>
            {noteOpen && <p className="bartender-note">{card.note}</p>}
            <button
              className="button secondary edit-card-button"
              onClick={() => {
                setEditing(true);
                setBack(false);
              }}
            >
              <Pencil size={15} />
              Изменить текст карты
            </button>
            <p className="field-hint">
              Тексты можно менять. Изменения сохраняются в этом браузере и
              попадают в ваш PDF.
            </p>
          </>
        )}
        {!editing && (
          <div className="detail-navigation">
            <button
              className="icon-button"
              aria-label="Предыдущая карта"
              onClick={() => onNext(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <span>
              {cardPosition + 1} / {DECK.length}
            </span>
            <button
              className="icon-button"
              aria-label="Следующая карта"
              onClick={() => onNext(1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function SheetDiagram({ back = false, dark = false }) {
  return (
    <div
      className={`sheet-diagram ${back ? "diagram-back" : ""} ${dark ? "diagram-dark" : ""}`}
      aria-hidden="true"
    >
      {Array.from({ length: 18 }, (_, i) => (
        <span key={i}>
          {back ? "✧" : ["♥", "♦", "♠", "♣"][Math.floor(i / 5) % 4]}
        </span>
      ))}
      <i className="diagram-cut top-cut" />
      <i className="diagram-cut bottom-cut" />
    </div>
  );
}

function PrintModal({
  settings,
  setSettings,
  onClose,
  download,
  busy,
  progress,
}) {
  const id = useId();
  const [previewBack, setPreviewBack] = useState(false);
  return (
    <Modal titleId={id} onClose={onClose} className="print-modal">
      <div className="print-modal-intro">
        <span className="eyebrow">ОТ ЭКРАНА — К ВАШЕМУ СТОЛУ</span>
        <h2 id={id} className="modal-title">
          Счастье можно
          <br />
          <em>распечатать.</em>
        </h2>
        <p>36 карт · 63 × 88 мм · 2 двусторонних листа А3</p>
      </div>
      <div className="print-options-grid">
        <div className="print-preview-panel">
          <div className="segmented-control">
            <button
              className={!previewBack ? "selected" : ""}
              onClick={() => setPreviewBack(false)}
            >
              Лица
            </button>
            <button
              className={previewBack ? "selected" : ""}
              onClick={() => setPreviewBack(true)}
            >
              Рубашки
            </button>
          </div>
          <SheetDiagram
            back={previewBack}
            dark={settings.backStyle === "burgundy"}
          />
          <p className="preview-caption">
            Схема раскладки · 18 карт на каждом листе
          </p>
          <div className="print-facts">
            <span>
              <Check size={14} />
              Метки для ручной резки
            </span>
            <span>
              <Check size={14} />
              Без полей навылет
            </span>
            <span>
              <Check size={14} />
              Все 36 карт в одном PDF
            </span>
          </div>
        </div>
        <div className="print-settings">
          <label className="field-label" htmlFor={`${id}-event`}>
            Подпись на рубашке
          </label>
          <input
            id={`${id}-event`}
            maxLength={45}
            value={settings.eventName}
            onChange={(e) =>
              setSettings({ ...settings, eventName: e.target.value })
            }
            placeholder="Например, Анна & Михаил"
          />
          <label className="field-label" htmlFor={`${id}-date`}>
            Дата <span>необязательно</span>
          </label>
          <input
            id={`${id}-date`}
            maxLength={30}
            value={settings.date}
            onChange={(e) => setSettings({ ...settings, date: e.target.value })}
            placeholder="ДД.ММ.ГГГГ"
          />
          <fieldset className="back-options">
            <legend className="field-label">Рубашка колоды</legend>
            <div className="back-option-row">
              <label
                className={`back-option ${settings.backStyle === "light" ? "chosen" : ""}`}
              >
                <input
                  type="radio"
                  name="backStyle"
                  value="light"
                  checked={settings.backStyle === "light"}
                  onChange={() =>
                    setSettings({ ...settings, backStyle: "light" })
                  }
                />
                <span className="back-swatch light-swatch">✧</span>
                <span>
                  Светлая<small>Меньше краски</small>
                </span>
                {settings.backStyle === "light" && <Check size={14} />}
              </label>
              <label
                className={`back-option ${settings.backStyle === "burgundy" ? "chosen" : ""}`}
              >
                <input
                  type="radio"
                  name="backStyle"
                  value="burgundy"
                  checked={settings.backStyle === "burgundy"}
                  onChange={() =>
                    setSettings({ ...settings, backStyle: "burgundy" })
                  }
                />
                <span className="back-swatch dark-swatch">✧</span>
                <span>
                  Бордовая<small>Больше контраста</small>
                </span>
                {settings.backStyle === "burgundy" && <Check size={14} />}
              </label>
            </div>
          </fieldset>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.cropMarks}
              onChange={(e) =>
                setSettings({ ...settings, cropMarks: e.target.checked })
              }
            />
            Метки реза на листах
          </label>
          <div className="print-warning">
            <Info size={16} />
            <p>
              А3, альбомная ориентация, масштаб <b>100%</b>. Двусторонняя печать
              с переворотом <b>по короткой стороне</b>. Сначала проверьте один
              лист. При печати из браузера включите фоновую графику.
            </p>
          </div>
        </div>
      </div>
      <div className="print-modal-bottom">
        <p>
          Порядок страниц: лица 1 → рубашки 1 → лица 2 → рубашки 2.
          <br />
          Фильтр на сайте не меняет состав PDF.
        </p>
        <div className="print-buttons">
          <button className="button secondary" onClick={() => window.print()}>
            <Printer size={16} />
            Печатать
          </button>
          <button className="button primary" disabled={busy} onClick={download}>
            {busy ? (
              <LoaderCircle size={16} className="spin" />
            ) : (
              <Download size={16} />
            )}
            {busy
              ? progress
                ? `${progress} / 36 карт`
                : "Готовим PDF…"
              : "Скачать PDF"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function App() {
  const [saved] = useState(() => {
    try {
      return loadSavedDeck(window.localStorage);
    } catch {
      return { edits: {}, settings: DEFAULT_SETTINGS };
    }
  });
  const [edits, setEdits] = useState(saved.edits);
  const [settings, setSettings] = useState(saved.settings);
  const [filter, setFilter] = useState("all");
  const [showBack, setShowBack] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [shuffleOrder, setShuffleOrder] = useState(null);
  const [shuffleVersion, setShuffleVersion] = useState(0);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [storageError, setStorageError] = useState(false);
  const timer = useRef(null);
  const downloadLock = useRef(false);
  const modalOpener = useRef(null);
  const cards = DECK.map((card) => ({ ...card, ...edits[card.id] }));
  const cardsById = new Map(cards.map((card) => [card.id, card]));
  const orderedCards = shuffleOrder
    ? shuffleOrder.map((id) => cardsById.get(id)).filter(Boolean)
    : cards;
  const filtered = orderedCards.filter(
    (card) => filter === "all" || card.category === filter,
  );
  const selectedCard =
    modal?.type === "card" ? cards.find((card) => card.id === modal.id) : null;
  const selectedCardIndex = selectedCard
    ? orderedCards.findIndex((card) => card.id === selectedCard.id)
    : -1;

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ edits, settings }),
      );
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [edits, settings]);
  useEffect(() => () => clearTimeout(timer.current), []);

  function notify(text) {
    clearTimeout(timer.current);
    setToast(text);
    timer.current = setTimeout(() => setToast(""), 5000);
  }
  function openModal(value) {
    modalOpener.current = document.activeElement;
    setModal(value);
  }
  function selectFilter(id) {
    setFilter(id);
    setVisibleCount(12);
  }
  function shuffleDeck() {
    const shuffled = [...orderedCards];
    for (let index = shuffled.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [
        shuffled[swapIndex],
        shuffled[index],
      ];
    }
    if (
      shuffled.length > 1 &&
      shuffled.every((card, index) => card.id === orderedCards[index].id)
    ) {
      [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    }
    setShuffleOrder(shuffled.map((card) => card.id));
    setShuffleVersion((version) => version + 1);
    notify("Колода перемешана. Новый порядок — новые совпадения.");
  }
  function randomCard() {
    const card = filtered[Math.floor(Math.random() * filtered.length)];
    openModal({ type: "card", id: card.id });
  }
  async function download() {
    if (downloadLock.current) return;
    downloadLock.current = true;
    setBusy(true);
    setProgress(0);
    try {
      await exportPdf({ edits, settings, onProgress: setProgress });
      notify("PDF готов. Внутри — все 36 карт и рубашки.");
    } catch (error) {
      console.error(error);
      notify(
        "Не удалось скачать PDF. Откройте «Печатать» и выберите «Сохранить как PDF».",
      );
    } finally {
      setBusy(false);
      downloadLock.current = false;
    }
  }
  const closeModal = React.useCallback(() => {
    setModal(null);
    requestAnimationFrame(() => modalOpener.current?.focus());
  }, []);
  function resetCard(id) {
    setEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  return (
    <>
      <div className="app-shell" inert={modal ? true : undefined}>
        <a className="skip-link" href="#deck">
          Перейти к колоде
        </a>
        <header className="site-header" id="top">
          <div className="header-inner">
            <Logo />
            <nav aria-label="Основная навигация">
              <a className="nav-active" href="#deck">
                Колода <span>36</span>
              </a>
              <a href="#about">Идея</a>
              <a href="#print">Как печатать</a>
            </nav>
            <button
              className="header-print"
              aria-label="Печать колоды"
              onClick={() => openModal({ type: "print" })}
            >
              <Printer size={16} />
              <span>Печать колоды</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </header>
        <main>
          <section className="hero page-width">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="eyebrow-line" />
                КОГДА ВСЕ КАРТЫ СЛОЖИЛИСЬ
              </div>
              <h1>
                Любовь.
                <br />
                <em>Со льдом.</em>
                <span className="hero-heart" aria-hidden="true">
                  ♥
                </span>
              </h1>
              <p className="hero-description">
                Коктейли, маленькие сюрпризы
                <br />и разговоры, которые хочется запомнить.
              </p>
              <div className="hero-actions">
                <a className="button primary" href="#deck">
                  Выбрать свою карту
                  <ArrowDown size={16} />
                </a>
                <button
                  className="hero-download"
                  onClick={download}
                  disabled={busy}
                >
                  {busy ? (
                    <LoaderCircle size={17} className="spin" />
                  ) : (
                    <ArrowDownToLine size={17} />
                  )}
                  <span>{busy ? "Готовим PDF…" : "Скачать для печати"}</span>
                </button>
              </div>
              <div className="hero-footnote">
                <span className="tiny-suits" aria-hidden="true">
                  ♥ ♣ ♦ ♠
                </span>
                <span>36 карт. Один особенный вечер.</span>
              </div>
            </div>
            <div
              className="hero-scene"
              aria-label="Пример карт: маракуйя краш, джин-палома и рубашка колоды"
            >
              <div className="scene-orbit orbit-one" />
              <div className="scene-orbit orbit-two" />
              <span className="scene-spark spark-one">✧</span>
              <span className="scene-spark spark-two">✧</span>
              <span className="scene-dot" />
              <div className="hero-card hero-card-back">
                <Card
                  card={cards[0]}
                  back
                  settings={{ ...settings, backStyle: "burgundy" }}
                />
              </div>
              <div className="hero-card hero-card-paloma">
                <Card card={cards[9]} />
              </div>
              <div className="hero-card hero-card-crush">
                <Card card={cards[0]} />
              </div>
              <div className="scene-note">
                <span>
                  для счастливых
                  <br />
                  совпадений
                </span>
                <svg viewBox="0 0 70 40" fill="none" aria-hidden="true">
                  <path
                    d="M2 6Q35 44 62 10M51 13l12-5-1 13"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                </svg>
              </div>
              <div className="scene-stamp">
                <span>СОЗДАНО</span>
                <Heart size={20} strokeWidth={1.2} />
                <span>ДЛЯ ЛЮБВИ</span>
              </div>
            </div>
          </section>

          <section className="concept-strip page-width" id="about">
            <div className="concept-item">
              <span className="concept-symbol">♥</span>
              <div>
                <h2>Знакомая классика, новый роман</h2>
                <p>Крашеры, сауэры, пузырьки и немного магии.</p>
              </div>
            </div>
            <div className="concept-item">
              <span className="concept-symbol black-symbol">♣</span>
              <div>
                <h2>Не только выпить — поговорить</h2>
                <p>12 карт с вопросами и приятными сюрпризами.</p>
              </div>
            </div>
            <div className="concept-item">
              <Scissors size={25} strokeWidth={1.1} />
              <div>
                <h2>Собрано с любовью, вырезано вручную</h2>
                <p>Два листа А3 превращаются в целую колоду.</p>
              </div>
            </div>
          </section>

          <section className="deck-section page-width" id="deck">
            <div className="section-heading">
              <div>
                <span className="eyebrow">ВАШЕ КОКТЕЙЛЬНОЕ МЕНЮ</span>
                <h2>
                  У каждого вечера
                  <br />
                  <em>есть своя масть.</em>
                </h2>
              </div>
              <div className="deck-heading-right">
                <p>
                  24 напитка и 12 поводов стать ближе.
                  <br />
                  Выбирайте по вкусу. Или по велению сердца.
                </p>
                <div className="deck-actions">
                  <button
                    className="button primary shuffle-button"
                    onClick={shuffleDeck}
                    aria-label="Перемешать колоду"
                  >
                    <Shuffle size={16} />
                    Перемешать
                  </button>
                  <button
                    className="button secondary random-button"
                    onClick={randomCard}
                  >
                    <ArrowUpRight size={16} />
                    Случайная карта
                  </button>
                </div>
              </div>
            </div>
            <div className="deck-controls">
              <div
                className="filter-list"
                role="group"
                aria-label="Категории карт"
              >
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    className={`filter-button ${filter === category.id ? "active" : ""}`}
                    onClick={() => selectFilter(category.id)}
                    aria-pressed={filter === category.id}
                  >
                    {category.id === "all" && <span aria-hidden="true">✧</span>}
                    {category.label}
                    {filter === category.id && (
                      <span className="filter-count">{filtered.length}</span>
                    )}
                  </button>
                ))}
              </div>
              <button
                className={`view-toggle icon-button ${showBack ? "selected" : ""}`}
                onClick={() => setShowBack(!showBack)}
                aria-label={
                  showBack ? "Показать лица карт" : "Показать рубашки карт"
                }
                aria-pressed={showBack}
                title={showBack ? "Лица карт" : "Рубашки карт"}
              >
                <FlipHorizontal2 size={19} />
              </button>
            </div>
            <div className="collection-meta">
              <span>
                {filtered.length}{" "}
                {filtered.length === 1
                  ? "КАРТА"
                  : filtered.length >= 2 && filtered.length <= 4
                    ? "КАРТЫ"
                    : "КАРТ"}
              </span>
              <span>
                <CircleHelp size={12} />
                Нажмите на карту — узнайте больше или измените текст
              </span>
            </div>
            <div className="card-grid" aria-live="polite">
              {filtered.slice(0, visibleCount).map((card, i) => (
                <article
                  className="card-tile"
                  key={`${shuffleVersion}-${card.id}`}
                  data-card-id={card.id}
                  style={{ "--tile-delay": `${Math.min(i, 7) * 25}ms` }}
                >
                  <button
                    className="card-open"
                    onClick={() => openModal({ type: "card", id: card.id })}
                    aria-label={`${cardName(card)}: ${card.title}. Открыть карту`}
                  >
                    <Card card={card} back={showBack} settings={settings} />
                    <span className="card-hover-label">
                      Открыть карту
                      <ArrowUpRight size={14} />
                    </span>
                  </button>
                  <div className="tile-caption">
                    <span>{cardName(card)}</span>
                    <span>
                      {card.category === "interactive"
                        ? "ВОПРОС / СЮРПРИЗ"
                        : card.category === "zero"
                          ? "БЕЗ АЛКОГОЛЯ"
                          : "КОКТЕЙЛЬ"}
                      <ArrowUpRight size={12} />
                    </span>
                  </div>
                </article>
              ))}
            </div>
            {visibleCount < filtered.length && (
              <div className="load-more-wrap">
                <button
                  className="button secondary load-more"
                  onClick={() => setVisibleCount(filtered.length)}
                >
                  Разложить всю колоду
                  <span>+{filtered.length - visibleCount}</span>
                  <ChevronDown size={16} />
                </button>
                <p>В PDF всегда входят все 36 карт</p>
              </div>
            )}
            {filter === "interactive" && (
              <p className="interactive-note">
                <Heart size={15} />
                Все задания — по желанию. Никаких обязательных тостов, скрытого
                алкоголя или неловких вопросов.
              </p>
            )}
          </section>

          <section className="special-note page-width">
            <span className="special-note-suit" aria-hidden="true">
              ♠
            </span>
            <div>
              <span className="eyebrow">ЧЕТЫРЕ ОСНОВЫ. МНОГО ХАРАКТЕРА.</span>
              <p>Хлебный виски, негрони, мягкая водка и джин с лемонграссом.</p>
              <span className="special-note-small">
                Общие фрукты и сиропы связывают меню — без коллекции редких
                бутылок.
              </span>
            </div>
            <span className="special-note-end" aria-hidden="true">
              ✧
            </span>
          </section>

          <section className="print-section page-width" id="print">
            <div className="print-illustration">
              <div className="paper-stack paper-stack-back" />
              <div className="paper-stack">
                <div className="paper-topline">
                  <span>СЧАСТЬЕ НА РУКАХ</span>
                  <span>А3</span>
                </div>
                <SheetDiagram />
                <div className="paper-bottomline">ЛИЦА · 18 КАРТ · 100%</div>
              </div>
              <div className="print-size-label">
                63 × 88 мм<span>настоящий карточный размер</span>
              </div>
              <Scissors
                className="print-scissors"
                size={40}
                strokeWidth={0.9}
              />
              <span className="print-dotted-line" />
            </div>
            <div className="print-copy">
              <span className="eyebrow">НЕМНОГО БУМАГИ. МНОГО ДУШИ.</span>
              <h2>
                Хороший вечер.
                <br />
                <em>Ручная работа.</em>
              </h2>
              <p className="print-lead">
                Ваша колода уже готова к двусторонней печати.
                <br />
                Останется только аккуратно разрезать.
              </p>
              <ol className="print-steps">
                <li>
                  <span>01</span>
                  <div>
                    <h3>Скачайте PDF из 4 страниц</h3>
                    <p>
                      Лица и рубашки для двух листов А3, по 18 карт на лист.
                    </p>
                  </div>
                </li>
                <li>
                  <span>02</span>
                  <div>
                    <h3>Печатайте с двух сторон, масштаб 100%</h3>
                    <p>
                      Альбомный А3, переворот по короткой стороне. Без
                      «подогнать» и без колонтитулов браузера.
                    </p>
                  </div>
                </li>
                <li>
                  <span>03</span>
                  <div>
                    <h3>Разрежьте по меткам — и раздавайте счастье</h3>
                    <p>
                      Для начала проверьте совмещение на одном листе. Бумагу
                      160–200 г/м² используйте, если её поддерживает принтер.
                    </p>
                  </div>
                </li>
              </ol>
              <button
                className="button primary"
                onClick={() => openModal({ type: "print" })}
              >
                <SlidersHorizontal size={16} />
                Настроить и скачать PDF
                <ArrowUpRight size={15} />
              </button>
              <span className="print-budget-note">
                Для экономии краски можно выбрать светлую рубашку.
              </span>
            </div>
          </section>
          <section className="closing-note page-width">
            <span aria-hidden="true">♥</span>
            <p>
              Пусть единственной случайностью
              <br />
              будет карта, которую вы вытянете.
            </p>
            <span aria-hidden="true">♥</span>
          </section>
        </main>
        <footer className="site-footer page-width">
          <Logo />
          <p>СОБИРАЙТЕ КАРТЫ. СОХРАНЯЙТЕ ВОСПОМИНАНИЯ.</p>
          <span>
            С любовью, до последней карты{" "}
            <span className="footer-heart">♥</span>
          </span>
        </footer>
        <div className="responsibility-note page-width">
          Алкогольные напитки — 18+. Крепость готового коктейля зависит от
          рецептуры. Сообщите бармену об аллергиях: настойка на хлебе может
          содержать глютен.
        </div>
      </div>
      {selectedCard && (
        <CardDetail
          key={selectedCard.id}
          card={selectedCard}
          cardPosition={selectedCardIndex}
          settings={settings}
          onClose={closeModal}
          onSave={(id, edit) => {
            setEdits((prev) => ({ ...prev, [id]: edit }));
            notify("Текст карты сохранён и будет в вашем PDF.");
          }}
          onReset={resetCard}
          onNext={(direction) => {
            const index = orderedCards.findIndex(
              (card) => card.id === selectedCard.id,
            );
            setModal({
              type: "card",
              id: orderedCards[
                (index + direction + orderedCards.length) % orderedCards.length
              ].id,
            });
          }}
        />
      )}
      {modal?.type === "print" && (
        <PrintModal
          settings={settings}
          setSettings={setSettings}
          onClose={closeModal}
          download={download}
          busy={busy}
          progress={progress}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          <span>{toast}</span>
          <button aria-label="Скрыть уведомление" onClick={() => setToast("")}>
            <X size={15} />
          </button>
        </div>
      )}
      {storageError && (
        <div className="storage-warning" role="status">
          Браузер не разрешает сохранение. Скачайте PDF перед закрытием
          страницы.
        </div>
      )}
      <PrintDeck cards={cards} settings={settings} />
    </>
  );
}

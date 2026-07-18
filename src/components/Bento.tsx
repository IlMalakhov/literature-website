import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AVG_SCORE, WORKS, workSrc } from "../data";

gsap.registerPlugin(ScrollTrigger);

/* =========================================================================
   «Картотека»: бенто-мозаика внутри манифеста («Литература — не лотерея»).
   Утверждённая комбинация из бенто-лаборатории: мозаика 6×3 · карточки ·
   ящик (подпись выезжает при наведении) · переворот каталожной карточки
   по клику · цифры. Числа набегают при появлении, полка кодификатора
   листается движением мыши, Бегемот шагает только под курсором.
   ========================================================================= */

type Cell = {
  id: string;
  kind: "num" | "fact" | "img" | "works" | "map" | "sprite" | "cta";
  /* размещение в сетке 6×3 + full-width на мобильной двухколонке */
  c: string; r: string; m?: boolean;
  label?: string;
  count?: number; prefix?: string; suffix?: string; value?: string;
  body?: string;
  cap?: string;    /* курсивная подпись — выезжает при наведении */
  verso?: string;  /* оборот каталожной карточки — переворот по клику */
  img?: string;
};

const CELLS: ReadonlyArray<Cell> = [
  {
    id: "avg", kind: "num", c: "1 / 3", r: "1 / 3", m: true,
    label: "средний балл · ЕГЭ 2025", count: AVG_SCORE,
    cap: "по итогам последнего выпуска",
    verso: "84 — средний балл моих учеников на ЕГЭ-2025. С таким баллом проходят на бюджет большинства гуманитарных направлений.",
  },
  {
    id: "photo", kind: "img", c: "3 / 4", r: "1 / 2",
    img: "the-garnet-bracelet", label: "Дарья Фёдорова",
    cap: "филолог · СПбГУ",
    verso: "Магистр филологии СПбГУ, девять лет частной практики.",
  },
  {
    id: "works", kind: "works", c: "4 / 6", r: "1 / 2", m: true,
    label: "кодификатор · 18 книг",
    cap: "ведите мышью — полка листается",
  },
  {
    id: "check", kind: "num", c: "6 / 7", r: "1 / 3",
    label: "проверка сочинения", value: "48 ч",
    cap: "разметка по критериям ФИПИ",
    verso: "Каждая работа возвращается размеченной — за 48 часов.",
  },
  {
    id: "cta", kind: "cta", c: "3 / 5", r: "2 / 3", m: true,
    label: "первое занятие бесплатно",
  },
  {
    id: "map", kind: "map", c: "5 / 6", r: "2 / 3",
    label: "география", body: "Петербург → онлайн",
    verso: "Онлайн со всей страной, из любого пояса.",
  },
  {
    id: "sprite", kind: "sprite", c: "1 / 2", r: "3 / 4",
    cap: "идёт, пока курсор здесь",
  },
  {
    id: "format", kind: "fact", c: "2 / 4", r: "3 / 4", m: true,
    label: "формат занятий",
    body: "онлайн · 60–90 минут · один на один",
    cap: "конспекты и доска остаются у вас",
    verso: "Интерактивная доска, общие конспекты, записи разборов — всё сохраняется у ученика.",
  },
  {
    id: "students", kind: "num", c: "4 / 5", r: "3 / 4", m: true,
    label: "учеников за 9 лет", count: 150, suffix: "+",
    cap: "от нуля до бюджета",
    verso: "С нуля, олимпиады, пересдачи.",
  },
  {
    id: "budget", kind: "num", c: "5 / 7", r: "3 / 4", m: true,
    label: "поступили на бюджет", count: 92, suffix: "%",
    cap: "филфак, журфак, ВШЭ, СПбГУ",
    verso: "92% учеников поступают на бюджетные места гуманитарных факультетов.",
  },
];

/* Полка кодификатора: движение мыши листает натюрморты /works/ */
function WorksShelf({ label, cap }: { label?: string; cap?: string }) {
  const [i, setI] = useState(4);
  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const idx = Math.floor(((e.clientX - r.left) / r.width) * WORKS.length);
    setI(Math.min(WORKS.length - 1, Math.max(0, idx)));
  };
  const w = WORKS[i];
  return (
    <a className="bl-works" href="#program" onMouseMove={onMove}>
      {WORKS.map((wk, k) => (
        <img
          key={wk.slug}
          src={workSrc(wk.slug, 480)}
          alt=""
          loading="lazy"
          decoding="async"
          style={{ opacity: k === i ? 1 : 0 }}
        />
      ))}
      <span className="bl-lb">{label}</span>
      <div className="bl-works__meta">
        <b>«{w.title}»</b>
        <span>{w.author} · {w.year}</span>
        <span className="bl-cap">{cap}</span>
      </div>
    </a>
  );
}

/* Карта: пунктир виден всегда, розовый маршрут дорисовывается при наведении */
function RouteMap() {
  return (
    <svg className="bl-map" viewBox="0 0 220 96" aria-hidden="true">
      <path className="bl-map__dots" d="M28 26 C 84 2, 126 82, 188 58" pathLength="1" />
      <path className="bl-map__draw" d="M28 26 C 84 2, 126 82, 188 58" pathLength="1" />
      <circle cx="28" cy="26" r="4" />
      <circle className="bl-map__ring" cx="188" cy="58" r="9" />
    </svg>
  );
}

function Recto({ cell }: { cell: Cell }) {
  switch (cell.kind) {
    case "num":
      return (
        <>
          <span className="bl-lb">{cell.label}</span>
          <span className="bl-sp" />
          <span className="bl-num">
            {cell.prefix}
            {cell.count != null
              ? <span data-count={cell.count}>{cell.count}</span>
              : cell.value}
            {cell.suffix}
          </span>
          <span className="bl-cap">{cell.cap}</span>
        </>
      );
    case "fact":
      return (
        <>
          <span className="bl-lb">{cell.label}</span>
          <span className="bl-sp" />
          <p className="bl-body">{cell.body}</p>
          <span className="bl-cap">{cell.cap}</span>
        </>
      );
    case "img":
      return (
        <>
          <img src={workSrc(cell.img!, 768)} alt="" loading="lazy" decoding="async" />
          <div className="bl-media__meta">
            <span className="bl-lb">{cell.label}</span>
            <span className="bl-cap">{cell.cap}</span>
          </div>
        </>
      );
    case "works":
      return <WorksShelf label={cell.label} cap={cell.cap} />;
    case "map":
      return (
        <>
          <span className="bl-lb">{cell.label}</span>
          <RouteMap />
          <span className="bl-sp" />
          <p className="bl-body">{cell.body}</p>
        </>
      );
    case "sprite":
      return (
        <>
          <span className="bl-cap">{cell.cap}</span>
          <div className="bl-spr"><div className="sprite sprite--behemoth" /></div>
        </>
      );
    case "cta":
      /* не внешняя ссылка: скроллим вниз к Telegram-композеру */
      return (
        <a className="bl-cta" href="#composer">
          <span className="bl-lb">{cell.label}</span>
          <span className="bl-cta__word">Записаться&nbsp;→</span>
        </a>
      );
  }
}

export function Bento() {
  const [flipped, setFlipped] = useState<ReadonlySet<string>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);

  /* числа набегают, когда сетка въезжает в кадр — как в остальных секциях */
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const mm = gsap.matchMedia(grid);
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      grid.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        const target = parseFloat(el.dataset.count || "0");
        const state = { v: 0 };
        gsap.to(state, {
          v: target,
          duration: 1.6,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
          onUpdate() { el.textContent = String(Math.round(state.v)); },
        });
      });
    });
    return () => mm.revert();
  }, []);

  const toggle = (id: string) =>
    setFlipped((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <div className="bl-grid reveal" ref={gridRef}>
      {CELLS.map((cell, idx) => {
        const spans = [cell.c, cell.r].map((s) => {
          const [a, b] = s.split("/").map((n) => parseInt(n, 10));
          return b - a;
        });
        const cls = [
          "bl-cell",
          `bl-cell--${cell.kind}`,
          spans[0] >= 2 && spans[1] >= 2 ? "bl-cell--big" : "",
          spans[1] >= 2 && spans[0] < 2 ? "bl-cell--tall" : "",
          (cell.kind === "img" || cell.kind === "works") ? "bl-cell--media" : "",
          flipped.has(cell.id) ? "is-flipped" : "",
        ].filter(Boolean).join(" ");

        const style = {
          "--cs": cell.c,
          "--rs": cell.r,
          ...(cell.m ? { "--cs-m": "span 2" } : null),
        } as CSSProperties;

        if (!cell.verso) {
          return (
            <div key={cell.id} className={cls} style={style}>
              <Recto cell={cell} />
            </div>
          );
        }
        return (
          <div key={cell.id} className={cls} style={style} onClick={() => toggle(cell.id)}>
            <div className="bl-in">
              <div className="bl-face bl-face--r"><Recto cell={cell} /></div>
              <div className="bl-face bl-face--v">
                <span className="bl-vnum">№ {String(idx + 1).padStart(2, "0")}</span>
                <p>{cell.verso}</p>
                <span className="bl-vstamp">картотека кабинета</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

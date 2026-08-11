import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { workSrc, workSrcSet } from "../data";
import { IconArrowForward } from "./Icons";

gsap.registerPlugin(ScrollTrigger);

const PANELS = [
  {
    index: "01",
    tag: "Часть 1 · задания 1–7, 10–14",
    title: "Анализ текста",
    text:
      "Эпос, лирика и драма: тема и проблематика, средства выразительности, " +
      "сопоставление произведений. Учимся давать точные короткие ответы и не " +
      "терять баллы на формулировках.",
    list: [
      "Анализ лирики и стихотворных размеров",
      "Средства художественной выразительности",
      "Сопоставление с другими произведениями",
    ],
    img: "the-queen-of-spades",
  },
  {
    index: "02",
    tag: "Часть 2 · сочинение 5.1–5.5",
    title: "Сочинение",
    text:
      "Главный блок экзамена. Ставим структуру, аргументацию и опору на " +
      "текст. Каждое сочинение проверяю как эксперт — с разбором, где именно " +
      "теряется балл.",
    list: [
      "Тезис, аргументы и логика сочинения",
      "Разбор по 5 критериям ФИПИ",
      "Личный банк аргументов и цитат",
    ],
    img: "dead-souls",
  },
  {
    index: "03",
    tag: "Каждый месяц · в реальных условиях",
    title: "Пробники",
    text:
      "Раз в месяц — полный ЕГЭ: те же бланки, тот же таймер, та же проверка " +
      "по критериям. Разбор без пощады к ошибкам — чтобы в июне была " +
      "предсказуемая цифра.",
    list: [
      "6 пробников за курс",
      "100% проверка по критериям ФИПИ",
      "Разбор каждой ошибки один на один",
    ],
    img: "crime-and-punishment",
  },
] as const;

export function Program() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = root.current;
    if (!section) return;
    const mm = gsap.matchMedia(section);

    mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
      const view = section.querySelector<HTMLElement>(".hp__view")!;
      const track = section.querySelector<HTMLElement>(".hp__track")!;
      const bar = section.querySelector<HTMLElement>(".hp__bar i")!;
      const dist = () => track.scrollWidth - view.clientWidth;
      // Share anchor clearance with App.tsx.
      const pad = () =>
        parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 90;

      gsap.to(track, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          // Pin the viewport, not the taller section, to keep the progress bar visible.
          id: "program-h",
          trigger: view,
          start: () => "top top+=" + pad(),
          end: () => "+=" + dist(),
          pin: view,
          // Lenis supplies easing; numeric scrub causes jitter at the pin boundary.
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => { bar.style.transform = `scaleX(${self.progress})`; },
        },
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section className="hp" id="program" ref={root}>
      <div className="wrap hp__head">
        <div>
          <h2>Курс — <em>по структуре</em> экзамена</h2>
        </div>
        <div className="hp__hint" aria-hidden="true">
          листайте <IconArrowForward className="hp__hint-arrow" />
        </div>
      </div>

      <div className="hp__view">
        <div className="hp__track">
          {PANELS.map((p) => (
            <article className="hp__panel" key={p.title}>
              <span className="hp__ghost" aria-hidden="true">{p.index}</span>
              <img
                src={workSrc(p.img)}
                srcSet={workSrcSet(p.img)}
                sizes="(max-width: 899px) min(320px, 72vw), (max-width: 1356px) 34vw, 454px"
                alt=""
                loading="lazy"
                decoding="async"
                width="1254"
                height="1254"
              />
              <div className="hp__body">
                <span className="tag">{p.tag}</span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
                <ul>
                  {p.list.map((li) => <li key={li}>{li}</li>)}
                </ul>
              </div>
            </article>
          ))}
        </div>
        <div className="hp__bar" aria-hidden="true"><i /></div>
      </div>
    </section>
  );
}

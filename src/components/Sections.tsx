import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MARQUEE, MARQUEE_TAGS, STATS, QUOTES, TG_URL, workSrc } from "../data";
import { TgComposer } from "./TgComposer";

gsap.registerPlugin(ScrollTrigger);

/* Two ribbons drifting in opposite directions: titles one way, exam tags the other. */
export function Marquee() {
  const titles = [...MARQUEE, ...MARQUEE];
  const tags = [...MARQUEE_TAGS, ...MARQUEE_TAGS, ...MARQUEE_TAGS];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__row">
        <div className="marquee__track">
          {titles.map((t, i) => <span key={i}>{t}</span>)}
        </div>
      </div>
      <div className="marquee__row marquee__row--alt">
        <div className="marquee__track">
          {tags.map((t, i) => <span key={i}>{t}</span>)}
        </div>
      </div>
    </div>
  );
}

/* Manifesto + stats: numbers count up when they scroll into view. */
export function Stats() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = root.current;
    if (!section) return;
    const mm = gsap.matchMedia(section);

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      section.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        const target = parseFloat(el.dataset.count || "0");
        const state = { v: 0 };
        gsap.to(state, {
          v: target,
          duration: 2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
          onUpdate() { el.textContent = String(Math.round(state.v)); },
        });
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section className="manifest" id="results" ref={root}>
      <img
        className="manifest__bg"
        src={workSrc("war-and-peace")}
        alt=""
        data-depth="0.22"
        loading="lazy"
        decoding="async"
        width="1254"
        height="1254"
      />
      <div className="wrap">
        <h2 className="manifest__title">
          <span className="manifest__small reveal">Литература — не лотерея.</span>
          <span className="manifest__big reveal">Это <em>система</em>.</span>
        </h2>
        <div className="stats__grid">
          {STATS.map((s) => (
            <div className="stat reveal" key={s.label}>
              <div className="stat__num">
                {s.prefix}<span data-count={s.value}>{s.value}</span>{s.suffix}
              </div>
              <div className="stat__label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Quotes() {
  return (
    <section className="quotes section-pad" id="quotes">
      <img
        className="quotes__bg"
        src={workSrc("eugene-onegin")}
        alt=""
        data-depth="0.16"
        loading="lazy"
        decoding="async"
        width="1254"
        height="1254"
      />
      <div className="wrap">
        <div className="sec-head reveal">
          <h2>Сдали — <em>и поступили</em></h2>
        </div>
        <div className="qs">
          {QUOTES.map((q) => (
            <blockquote className="q reveal reveal--tilt" key={q.who}>
              <span className="q__ghost" aria-hidden="true">{q.score}</span>
              <p>{q.text}</p>
              <footer>
                <b>{q.who}</b>
                <small>{q.role}</small>
                <span className="q__chip">{q.score} · ЕГЭ</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

/* laurel branch for the award plaque; mirrored for the right side */
function Laurel({ mirrored }: { mirrored?: boolean }) {
  return (
    <svg
      className={`award__laurel${mirrored ? " award__laurel--r" : ""}`}
      viewBox="0 0 26 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M20 50 C12 40 9 30 11 20 C12 13 15 7 20 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13.5 38 C7 37 3.5 33 2.5 27 C8.5 28 12.5 32 13.5 38Z" fill="currentColor" />
      <path d="M11.8 28 C6 26.5 3 22 2.8 16.5 C8.5 18.5 11.8 22.5 11.8 28Z" fill="currentColor" />
      <path d="M12 19 C8 16 6.5 11.5 7.5 6.5 C12 9.5 13.5 14 12 19Z" fill="currentColor" />
      <path d="M15 11 C13 7.5 13 3.5 15.5 .5 C18.5 4 18 8 15 11Z" fill="currentColor" />
      <path d="M14.5 41 C16.5 36.5 20.5 34 25 34.5 C23 39.5 19 42 14.5 41Z" fill="currentColor" opacity=".85" />
      <path d="M13 31 C15.5 26.5 19.5 24.5 24 25.5 C21.5 30.5 17.5 32.5 13 31Z" fill="currentColor" opacity=".85" />
      <path d="M13.5 22 C16 18 20 16.5 24 17.5 C21.5 22 17.5 23.5 13.5 22Z" fill="currentColor" opacity=".85" />
    </svg>
  );
}

export function About() {
  return (
    <section className="about section-pad" id="about">
      <div className="wrap">
        <h2 className="about__title reveal">
          Филолог <em>и эксперт</em> ЕГЭ
        </h2>
        <div className="about__grid">
          <div className="about__art" aria-hidden="true">
            <img
              src={workSrc("the-seagull")}
              alt=""
              data-depth="0.12"
              loading="lazy"
              decoding="async"
              width="1254"
              height="1254"
            />
          </div>
          <div className="about__body reveal">
            <p>
              Я <strong>Дарья Федорова</strong> — преподаю литературу девять лет
              и готовлю школьников к ЕГЭ. Окончила филологический факультет,
              работала в проверке экзаменационных работ, поэтому знаю критерии
              изнутри — не по пересказам, а по практике.
            </p>
            <p>
              Моя позиция проста: литература — это не только про «чувствовать»,
              но и про то, чтобы <strong>уметь доказать</strong>. На занятиях мы
              соединяем настоящее чтение с инженерной точностью экзамена.
              Отсюда и результат, который видно в баллах.
            </p>
            <ul className="creds">
              <li>Филологическое образование, специализация — русская литература XIX–XX вв.</li>
              <li>Опыт работы экспертом по проверке сочинений ЕГЭ</li>
              <li>9 лет частной подготовки к ЕГЭ и олимпиадам по литературе</li>
              <li>Авторские материалы: банк аргументов и разборы по критериям ФИПИ</li>
            </ul>
            <div className="award">
              <div className="award__medal" aria-hidden="true">
                <Laurel />
                <span className="award__num">№1</span>
                <Laurel mirrored />
              </div>
              <p className="award__text">
                <b>Топ-1 по литературе</b>
                Уже долгое время — в&nbsp;числе первых репетиторов на&nbsp;главном
                сайте-агрегаторе
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Cta() {
  return (
    <section className="cta section-pad" id="booking">
      <img
        className="cta__lamp"
        src={workSrc("white-nights")}
        alt=""
        data-depth="0.2"
        loading="lazy"
        decoding="async"
        width="1254"
        height="1254"
      />
      <div className="wrap cta__inner">
        <ol className="process reveal" aria-label="Как мы работаем">
          <li>
            <b>Диагностика</b>
            <span>бесплатное первое занятие: уровень и план до экзамена</span>
          </li>
          <li>
            <b>Система</b>
            <span>занятия по структуре ЕГЭ, проверка сочинений между уроками</span>
          </li>
          <li>
            <b>Пробники</b>
            <span>ежемесячный экзамен и доработка слабых мест — до мая</span>
          </li>
        </ol>

        <div className="cta__box reveal">
          <h2>Начнём <em>со света</em></h2>
          <p>
            Бесплатная диагностика: за 60 минут определим реальный уровень,
            покажу план подготовки и честно скажу, какой балл достижим к
            экзамену. Без обязательств.
          </p>
          <TgComposer />
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__inner">
        <span className="footer__name">Дарья Федорова</span>
        <a href={TG_URL} target="_blank" rel="noopener">
          Telegram · @dashavrodeda
        </a>
        <span className="footer__quiet">
          © 2026 · Литература · ЕГЭ · онлайн и Санкт-Петербург
        </span>
      </div>
    </footer>
  );
}

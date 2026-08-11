import { useEffect, useRef } from "react";
import gsap from "gsap";
import {
  MARQUEE, MARQUEE_TAGS, TG_PLAIN_URL, workSrc, workSrcSet,
} from "../data";
import { TgComposer } from "./TgComposer";
import { QuotesScale } from "./QuotesScale";
import { Bento } from "./Bento";
import {
  Icon5CircleFill,
  IconGraduationcapFill,
  IconLaurelLeading,
  IconLaurelTrailing,
  IconStarFill,
} from "./Icons";

export function Marquee() {
  const root = useRef<HTMLDivElement>(null);
  const titles = [...MARQUEE, ...MARQUEE];
  const tags = [...MARQUEE_TAGS, ...MARQUEE_TAGS, ...MARQUEE_TAGS];

  // Changing animation-duration jumps the track; ease playbackRate instead.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const speed = { v: 1 };
    let tween: gsap.core.Tween | null = null;
    const go = (v: number) => {
      tween?.kill();
      tween = gsap.to(speed, {
        v,
        duration: 0.9,
        ease: "power2.out",
        onUpdate: () => {
          for (const a of el.getAnimations({ subtree: true })) a.playbackRate = speed.v;
        },
      });
    };
    const slow = () => go(0.12);
    const full = () => go(1);
    el.addEventListener("pointerenter", slow);
    el.addEventListener("pointerleave", full);
    return () => {
      tween?.kill();
      el.removeEventListener("pointerenter", slow);
      el.removeEventListener("pointerleave", full);
    };
  }, []);

  return (
    <div className="marquee" aria-hidden="true" ref={root}>
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

export function Manifesto() {
  return (
    <section className="manifest" id="results">
      <img
        className="manifest__bg"
        src={workSrc("war-and-peace")}
        srcSet={workSrcSet("war-and-peace")}
        sizes="(max-width: 1306px) 72vw, 940px"
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
        <Bento />
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
        srcSet={workSrcSet("eugene-onegin")}
        sizes="(max-width: 1242px) 58vw, 720px"
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
        <div className="reveal">
          <QuotesScale />
        </div>
      </div>
    </section>
  );
}

function AwardsBlock() {
  return (
    <div className="awards reveal">
      <div className="award">
        <div className="award__medal" aria-hidden="true">
          <IconLaurelLeading className="award__laurel" />
          <span className="award__num">№1</span>
          <IconLaurelTrailing className="award__laurel" />
        </div>
        <b className="award__title">Топ-1 по литературе</b>
        <p className="award__text">
          Уже долгое время — в&nbsp;числе первых репетиторов
          на&nbsp;главном сайте-агрегаторе
        </p>
      </div>
      <div className="award">
        <div className="award__medal award__medal--stack" aria-hidden="true">
          <Icon5CircleFill className="award__rating" />
          <span className="award__stars">
            {Array.from({ length: 5 }, (_, i) => (
              <IconStarFill className="award__star" key={i} />
            ))}
          </span>
        </div>
        <b className="award__title">Средняя оценка — 5&nbsp;из&nbsp;5</b>
        <p className="award__text">
          По отзывам <strong>более 120&nbsp;учеников</strong> за&nbsp;всё
          время — на&nbsp;всех платформах
        </p>
      </div>
      <div className="award">
        <div className="award__medal" aria-hidden="true">
          <IconGraduationcapFill className="award__cap" />
        </div>
        <b className="award__title">Магистр филологии СПбГУ</b>
        <p className="award__text">
          Классическое академическое образование — филологический
          факультет, государственный диплом
        </p>
      </div>
    </div>
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
              srcSet={workSrcSet("the-seagull")}
              sizes="(max-width: 860px) min(340px, calc(100vw - 2.5rem)), (max-width: 1280px) 35vw, 430px"
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
          </div>
        </div>
        <AwardsBlock />
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
        srcSet={workSrcSet("white-nights")}
        sizes="(max-width: 820px) 64vw, (max-width: 1588px) 34vw, 540px"
        alt=""
        data-depth="0.2"
        loading="lazy"
        decoding="async"
        width="1254"
        height="1254"
      />
      <div className="wrap cta__inner">
        <div className="cta__box reveal" id="composer">
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
        <a href={TG_PLAIN_URL} target="_blank" rel="noopener">
          Telegram · @dashavrodeda
        </a>
        <span className="footer__quiet">© 2026 · Литература · ЕГЭ</span>
      </div>
    </footer>
  );
}

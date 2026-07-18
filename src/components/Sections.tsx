import {
  MARQUEE, MARQUEE_TAGS, TG_PLAIN_URL, workSrc, workSrcSet,
} from "../data";
import { TgComposer } from "./TgComposer";
import { QuotesScale } from "./QuotesScale";
import { Bento } from "./Bento";

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

/* Manifesto + «картотека»: the bento mosaic replaces the old stat strip. */
export function Stats() {
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

/* laurel branch for the award plaques; mirrored for the right side */
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

/* five of these under the «5,0» on the rating plaque */
function Star() {
  return (
    <svg
      className="award__star"
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6 .6 L7.6 4.2 11.5 4.6 8.6 7.2 9.4 11 6 9 2.6 11 3.4 7.2 .5 4.6 4.4 4.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* mortarboard for the degree plaque */
function Mortarboard() {
  return (
    <svg
      className="award__cap"
      viewBox="0 0 52 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M26 3 L50 13.5 26 24 2 13.5Z" fill="currentColor" />
      <path
        d="M13 18.3 V27 C13 31.2 18.8 34.5 26 34.5 C33.2 34.5 39 31.2 39 27 V18.3 L26 24Z"
        fill="currentColor"
        opacity=".85"
      />
      <path d="M46 15.2 V25.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="46" cy="28.5" r="2.1" fill="currentColor" />
    </svg>
  );
}

/* the three award plaques — a full-width band under the about grid */
function AwardsBlock() {
  return (
    <div className="awards reveal">
      <div className="award">
        <div className="award__medal" aria-hidden="true">
          <Laurel />
          <span className="award__num">№1</span>
          <Laurel mirrored />
        </div>
        <p className="award__text">
          <b>Топ-1 по литературе</b>
          Уже долгое время — в&nbsp;числе первых репетиторов
          на&nbsp;главном сайте-агрегаторе
        </p>
      </div>
      <div className="award">
        <div className="award__medal award__medal--stack" aria-hidden="true">
          <span className="award__num">5,0</span>
          <span className="award__stars">
            <Star /><Star /><Star /><Star /><Star />
          </span>
        </div>
        <p className="award__text">
          <b>Средняя оценка — 5&nbsp;из&nbsp;5</b>
          По отзывам <strong>более 120&nbsp;учеников</strong> за&nbsp;всё
          время — на&nbsp;всех платформах
        </p>
      </div>
      <div className="award">
        <div className="award__medal" aria-hidden="true">
          <Mortarboard />
        </div>
        <p className="award__text">
          <b>Магистр филологии СПбГУ</b>
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

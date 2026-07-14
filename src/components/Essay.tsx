import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ESSAY_NOTES } from "../data";

gsap.registerPlugin(ScrollTrigger);

/* A marked span in the paper: rose highlight sweeps in when the matching
   margin note scrolls into view; the superscript flag ties them together. */
function M({ n, children }: { n: number; children: ReactNode }) {
  return (
    <mark className="essay__mark" data-mark={n}>
      {children}
      <i className="essay__flag" aria-hidden="true">{n}</i>
    </mark>
  );
}

/* «Разбор сочинения»: a student essay on paper, annotated live as the
   reader scrolls — each margin note activates its highlight in the text,
   like watching the expert's pen move. */
export function Essay() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = root.current;
    if (!section) return;

    // Pin each flag to the top-right corner of its mark's first line. An
    // abs-positioned child of a wrapped inline resolves its containing block
    // against the FIRST line fragment, so offsetting by that fragment's width
    // lands the flag at the end of line 1 whether or not the mark wraps.
    const layoutFlags = () => {
      section.querySelectorAll<HTMLElement>(".essay__mark").forEach((mark) => {
        const flag = mark.querySelector<HTMLElement>(".essay__flag");
        const first = mark.getClientRects()[0];
        if (!flag || !first) return;
        flag.style.left = `${first.width}px`;
        flag.style.top = "0px";
      });
    };
    layoutFlags();
    addEventListener("resize", layoutFlags);
    document.fonts?.ready.then(layoutFlags);

    const mm = gsap.matchMedia(section);

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // pen choreography: note enters view → note + its mark light up
      section.querySelectorAll<HTMLElement>("[data-note]").forEach((note) => {
        const mark = section.querySelector(
          `[data-mark="${note.dataset.note}"]`,
        );
        ScrollTrigger.create({
          trigger: note,
          start: "top 78%",
          once: true,
          onEnter: () => {
            note.classList.add("on");
            mark?.classList.add("on");
          },
        });
      });
      // the verdict stamp slams in last
      const stamp = section.querySelector<HTMLElement>(".essay__stamp");
      if (stamp) {
        gsap.from(stamp, {
          scale: 2.2,
          opacity: 0,
          rotation: 8,
          duration: 0.45,
          ease: "power4.in",
          scrollTrigger: { trigger: stamp, start: "top 88%", once: true },
        });
      }
    });

    // reduced motion: everything simply on
    mm.add("(prefers-reduced-motion: reduce)", () => {
      section
        .querySelectorAll("[data-note], [data-mark]")
        .forEach((el) => el.classList.add("on"));
    });

    return () => {
      removeEventListener("resize", layoutFlags);
      mm.revert();
    };
  }, []);

  return (
    <section className="essay section-pad" id="essay" ref={root} data-cursor="redpen">
      <div className="wrap">
        <div className="sec-head reveal">
          <h2>Проверяю <em>как эксперт</em></h2>
          <p className="lede essay__lede">
            Каждое сочинение возвращается с такой разметкой: не «хорошо, но
            слабовато», а точный адрес потерянного балла.
          </p>
        </div>

        <div className="essay__grid">
          <figure className="essay__paper reveal">
            <figcaption className="essay__head">
              <span>Сочинение · задание 5</span>
              <span>«Преступление и наказание»</span>
            </figcaption>
            <p>
              Родион Раскольников совершает преступление, потому что{" "}
              <M n={1}>он бедный студент и ему нужны деньги</M>. После убийства
              Достоевский <M n={2}>много пишет о его страданиях</M> и мучениях
              совести.
            </p>
            <p>
              Совесть оказывается сильнее любой теории: герой не выдерживает
              внутренней борьбы <M n={3}>и в конце концов признаётся</M>. Так
              автор показывает, что преступление не может быть оправдано.
            </p>
            <div className="essay__stamp" aria-hidden="true">
              <span>проверено</span>
              <b>по критериям ФИПИ</b>
            </div>
          </figure>

          <div className="essay__notes" role="list">
            {ESSAY_NOTES.map((note) => (
              <div className="essay__note" data-note={note.n} key={note.n} role="listitem">
                <span className="essay__note-flag" aria-hidden="true">{note.n}</span>
                <span className="essay__crit">{note.crit}</span>
                <b>{note.title}</b>
                <p>{note.text}</p>
              </div>
            ))}
            <p className="essay__moral reveal">
              Три пометки — три балла, которые не потеряются в июне.{" "}
              <em>Проверка входит в каждое занятие.</em>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

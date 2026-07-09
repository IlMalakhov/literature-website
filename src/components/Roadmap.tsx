import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ROAD_STEPS } from "../data";

gsap.registerPlugin(ScrollTrigger);

/* «Маршрут года»: a rose thread draws itself down the middle of the page as
   the reader scrolls; milestones light up as the thread reaches them.
   Zigzag on desktop, single left rail on mobile (CSS). */
export function Roadmap() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = root.current;
    if (!section) return;
    const mm = gsap.matchMedia(section);

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const thread = section.querySelector<HTMLElement>(".road__thread i");
      if (thread) {
        gsap.fromTo(thread, { scaleY: 0 }, {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section.querySelector(".road__body"),
            start: "top 72%",
            end: "bottom 62%",
            // scrub:true (not a number) — Lenis already smooths the scroll, so a
            // numeric scrub would add a second easing layer that fights it.
            scrub: true,
          },
        });
      }
      section.querySelectorAll<HTMLElement>(".road__step").forEach((step) => {
        ScrollTrigger.create({
          trigger: step,
          start: "top 68%",
          once: true,
          onEnter: () => step.classList.add("on"),
        });
      });
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      const thread = section.querySelector<HTMLElement>(".road__thread i");
      if (thread) thread.style.transform = "none";
      section
        .querySelectorAll(".road__step")
        .forEach((el) => el.classList.add("on"));
    });

    return () => mm.revert();
  }, []);

  return (
    <section className="road section-pad" id="road" ref={root}>
      <div className="wrap">
        <div className="sec-head reveal">
          <h2>Год — <em>по месяцам</em></h2>
          <p className="lede road__lede">
            Никаких «как пойдёт»: у года есть маршрут, и в каждом месяце видно,
            где мы находимся и что уже позади.
          </p>
        </div>

        <div className="road__body">
          <div className="road__thread" aria-hidden="true"><i /></div>
          <ol className="road__steps">
            {ROAD_STEPS.map((s, i) => (
              <li className="road__step" key={s.title}>
                <span className="road__dot" aria-hidden="true" />
                <span className="road__when">{s.when}</span>
                <h3>
                  {s.title}
                  {i === ROAD_STEPS.length - 1 && (
                    <span className="road__score" aria-hidden="true">84</span>
                  )}
                </h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

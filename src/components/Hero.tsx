import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { SpinBadge } from "./SpinBadge";
import { ParadeStage } from "./ParadeStage";
import { IconArrowDown, IconArrowForward } from "./Icons";

export function Hero() {
  const root = useRef<HTMLElement>(null);

  /* Mouse parallax: layers marked [data-mouse] drift by depth × cursor offset.
     gsap.quickTo keeps it cheap; skipped for touch and reduced motion. */
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (!matchMedia("(pointer: fine)").matches) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layers = Array.from(el.querySelectorAll<HTMLElement>("[data-mouse]")).map((n) => ({
      depth: parseFloat(n.dataset.mouse || "10"),
      x: gsap.quickTo(n, "x", { duration: 0.8, ease: "power3.out" }),
      y: gsap.quickTo(n, "y", { duration: 0.8, ease: "power3.out" }),
    }));
    const onMove = (e: MouseEvent) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      layers.forEach((l) => { l.x(nx * l.depth); l.y(ny * l.depth); });
    };
    addEventListener("mousemove", onMove, { passive: true });
    return () => removeEventListener("mousemove", onMove);
  }, []);

  return (
    <header className="hero" id="top" ref={root}>
      <div className="wrap">
        <div className="hero__stage">
          {/* the badge is positioned against this wrapper, not the stage: it
              shrink-wraps the title, so the badge keeps the same relationship
              to «сдаётся.» however the stage flexes */}
          <div className="hero__titlewrap">
            <h1 className="hero__title">
              <span className="mask hero__l1"><span className="mask__in">Литература</span></span>
              <span className="mask hero__l2"><span className="mask__in"><em>сдаётся.</em></span></span>
            </h1>

            <SpinBadge extraClass="badge--hero" />
          </div>
        </div>

        <div className="hero__foot">
          <div>
            <p className="lede hero__lede">
              Давай расскажу как...{" "}
              <span className="hero__scroll">
                Листай вниз
                <IconArrowDown className="hero__scroll-arrow" aria-hidden="true" />
              </span>
            </p>
            <div className="hero__cta">
              <a className="ticket" href="#composer">
                <span className="ticket__main">
                  <b>Записаться</b>
                  <i>диагностика · 60 минут · бесплатно</i>
                </span>
                <span className="ticket__stub" aria-hidden="true">
                  <IconArrowForward />
                </span>
              </a>
              <a className="link-plain" href="#program">Программа</a>
            </div>
          </div>
          <div className="hero__aside">
            <span className="hero__ratio">9/10</span>
            <span className="hero__fact">
              учеников поступают на бюджет гуманитарных факультетов
            </span>
          </div>
        </div>
      </div>

      {/* full-bleed street, closing the hero: its cobbles are the bottom edge
          of the first viewport */}
      <ParadeStage />
    </header>
  );
}

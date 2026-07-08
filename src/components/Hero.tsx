import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { TG_URL, workSrc } from "../data";
import { SpinBadge } from "./SpinBadge";
import { ParadeStage } from "./ParadeStage";

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
          <div className="hero__cat" aria-hidden="true">
            <img
              src={workSrc("master-and-margarita")}
              alt=""
              data-mouse="18"
              width="1254"
              height="1254"
              fetchPriority="high"
            />
          </div>

          <h1 className="hero__title">
            <span className="mask hero__l1"><span className="mask__in">Литература</span></span>
            <span className="mask hero__l2"><span className="mask__in"><em>сдаётся.</em></span></span>
          </h1>

          <div className="hero__bloom" aria-hidden="true">
            <img
              src={workSrc("the-cherry-orchard")}
              alt=""
              data-mouse="34"
              width="1254"
              height="1254"
            />
          </div>

          <SpinBadge extraClass="badge--hero" />
        </div>

        <div className="hero__foot">
          <div>
            <p className="lede hero__lede">
              Тем, кто умеет её доказывать. Разбираем классику от «Горя от ума»
              до «Мастера и Маргариты», пишем сочинения по критериям ФИПИ и
              выходим на экзамен без сюрпризов.
            </p>
            <div className="hero__cta">
              <a className="btn btn--lg" href={TG_URL} target="_blank" rel="noopener">
                Записаться на диагностику <span className="arrow">→</span>
              </a>
              <a className="link-under" href="#program">Программа</a>
            </div>
          </div>
          <div className="hero__aside">
            <span className="hero__ratio">9/10</span>
            <span className="hero__fact">
              учеников поступают на бюджет гуманитарных факультетов
            </span>
            <span className="hero__coords">59.93° N · 30.33° E — Петербург → онлайн</span>
          </div>
        </div>
      </div>

      {/* full-bleed street: figures enter and exit past the screen edges */}
      <ParadeStage />
    </header>
  );
}

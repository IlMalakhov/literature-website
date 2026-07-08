import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SEGMENTS, type FigureKey } from "../data";

gsap.registerPlugin(ScrollTrigger);

/* Lit windows scattered over the (dimmed) skyline band; the sprites stay at
   full opacity so they read as lamps behind the roofline. */
const WINDOWS: ReadonlyArray<{ n: 1 | 2 | 3 | 4 | 5 | 6; left: string; bottom: number }> = [
  { n: 4, left: "6%", bottom: 46 },
  { n: 2, left: "17%", bottom: 64 },
  { n: 6, left: "31%", bottom: 52 },
  { n: 1, left: "46%", bottom: 40 },
  { n: 3, left: "63%", bottom: 66 },
  { n: 5, left: "78%", bottom: 44 },
  { n: 3, left: "91%", bottom: 58 },
];

function Figure({ k, msg }: { k: FigureKey; msg: string }) {
  return (
    <div className={`fig fig--${k}`}>
      <div className="bubble">
        <div className="bubble__in">
          <span className="bubble__text">{msg}</span>
        </div>
      </div>
      <div className={`sprite sprite--${k}`} />
    </div>
  );
}

/**
 * Pixel shadow-theatre street. Figures are sprite strips (public/parade/*.png,
 * equal cells, feet on the bottom row) cycled with steps(). Walk cycles run
 * unconditionally — a figure is only ever moving or offscreen, and gating
 * them on GSAP callbacks proved fragile: onStart stops re-firing on timeline
 * repeats, which froze every figure from the second loop on. Each figure
 * crosses the stage on the slow-mo ease, speaks its bubble mid-stage, and
 * strides off. Dim strollers and a seagull cross continuously; the timeline
 * only plays while the stage is on screen.
 */
export function ParadeStage() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const stage = root.current;
    if (!stage) return;

    const figs = {} as Record<FigureKey, HTMLElement>;
    SEGMENTS.forEach(([k]) => {
      figs[k] = stage.querySelector<HTMLElement>(`.fig--${k}`)!;
    });
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reduced) {
        // static tableau
        const spots: Partial<Record<FigureKey, string>> = {
          carriage: "20%", katerina: "52%", onegin: "80%",
        };
        (Object.keys(figs) as FigureKey[]).forEach((k) => {
          const fig = figs[k];
          const spot = spots[k];
          if (!spot) { fig.style.display = "none"; return; }
          fig.style.left = spot;
          fig.style.transform = "translateX(-50%)";
        });
        const bub = figs.carriage.querySelector<HTMLElement>(".bubble__in")!;
        bub.style.transform = "scale(1)";
        bub.style.opacity = "1";
        return;
      }

      const off = () => stage.offsetWidth / 2 + 320; // safely offscreen
      gsap.set(Object.values(figs), { xPercent: -50, x: () => -off() });

      /* Custom slow-mo ease: brisk at the screen edges, an unhurried stroll
         through the middle — the figure never freezes, it just lingers.
         x(t) = t + k·sin(2πt)/2π keeps x(0)=0, x(1)=1 and is monotonic
         for k < 1; mid-stage speed ≈ (1−k) of average. */
      const slowMo = (k: number) => (t: number) =>
        t + (k * Math.sin(2 * Math.PI * t)) / (2 * Math.PI);

      const tl = gsap.timeline({ repeat: -1, repeatRefresh: true, paused: true });
      SEGMENTS.forEach(([key, , tIn, tOut]) => {
        const fig = figs[key];
        const bub = fig.querySelector<HTMLElement>(".bubble__in")!;
        const dur = (tIn + tOut) * 2.5 + 0.8;
        tl.fromTo(
          fig,
          { x: () => -off() },
          {
            x: () => off(),
            duration: dur,
            ease: slowMo(0.72),
          },
          "+=0.3",
        )
          // the bubble rides the slow middle stretch of the walk
          .to(bub, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.7)" }, `<${(dur * 0.26).toFixed(2)}`)
          .to(bub, { scale: 0, opacity: 0, duration: 0.3, ease: "back.in(1.4)" }, `<${(dur * 0.42).toFixed(2)}`);
      });

      // dim strollers drifting across the back street, never stopping
      stage.querySelectorAll<HTMLElement>(".bgfig").forEach((el, i) => {
        gsap.fromTo(
          el,
          { xPercent: -50, x: () => -off() },
          {
            x: () => off(),
            duration: 30 + i * 14,
            ease: "none",
            repeat: -1,
            delay: i * 11,
            repeatRefresh: true,
          },
        );
      });

      // the seagull crosses high above the roofline now and then
      gsap.fromTo(
        stage.querySelector(".gull"),
        { xPercent: -50, x: () => -off() },
        {
          x: () => off(),
          duration: 30,
          ease: "none",
          repeat: -1,
          delay: 6,
          repeatDelay: 15,
          repeatRefresh: true,
        },
      );

      // run the parade only while the street is on screen
      ScrollTrigger.create({
        trigger: stage,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div className="stage" aria-hidden="true" ref={root} data-cursor="pixel">
      <div className="stars" />
      <div className="moon"><img src="/parade/moon.png" alt="" /></div>
      <div className="skyline skyline--far" />
      <div className="skyline" />
      {WINDOWS.map((w, i) => (
        <img
          key={i}
          className="litwin"
          src={`/parade/win${w.n}.png`}
          style={{ left: w.left, bottom: w.bottom }}
          alt=""
        />
      ))}

      <div className="bgfig bgfig--1"><div className="sprite sprite--katerina" /></div>
      <div className="bgfig bgfig--2"><div className="sprite sprite--onegin" /></div>

      <div className="gull"><div className="sprite sprite--gull" /></div>
      <div className="fog fog--back" />

      {SEGMENTS.map(([k, msg]) => <Figure key={k} k={k} msg={msg} />)}

      <div className="cobbles" />
      <div className="lamp">
        <span className="lamp__glow" />
        <img src="/parade/lamp.png" alt="" />
      </div>
      <div className="fog fog--front" />
    </div>
  );
}

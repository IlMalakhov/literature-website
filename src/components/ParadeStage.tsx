import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SEGMENTS, type FigureKey } from "../data";
import { runParadeIntro } from "./paradeIntro";

gsap.registerPlugin(ScrollTrigger);

const WINDOWS: ReadonlyArray<{ n: 1 | 2 | 3 | 4 | 5 | 6; left: string; bottom: number }> = [
  { n: 4, left: "6.2%", bottom: 63 },
  { n: 2, left: "18.1%", bottom: 55 },
  { n: 6, left: "30.5%", bottom: 58 },
  { n: 1, left: "44.6%", bottom: 48 },
  { n: 3, left: "62.5%", bottom: 50 },
  { n: 5, left: "71.8%", bottom: 65 },
  { n: 3, left: "91%", bottom: 42 },
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

/** Runs the parade after its entrance and only while the stage is visible. */
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
    let disposeIntro: (() => void) | null = null;
    let disposeVisibility: (() => void) | null = null;

    const ctx = gsap.context(() => {
      if (reduced) {
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

      const off = () => stage.offsetWidth / 2 + 320;
      gsap.set(Object.values(figs), { xPercent: -50, x: () => -off() });

      // Monotonic for k < 1; midpoint speed is approximately 1 - k.
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
          .to(bub, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.7)" }, `<${(dur * 0.26).toFixed(2)}`)
          .to(bub, { scale: 0, opacity: 0, duration: 0.3, ease: "back.in(1.4)" }, `<${(dur * 0.42).toFixed(2)}`);
      });

      // Hold ambient motion until the entrance completes.
      const ambient: gsap.core.Tween[] = [];

      stage.querySelectorAll<HTMLElement>(".bgfig").forEach((el, i) => {
        ambient.push(gsap.fromTo(
          el,
          { xPercent: -50, x: () => -off() },
          {
            x: () => off(),
            duration: 30 + i * 14,
            ease: "none",
            repeat: -1,
            delay: i * 11,
            repeatRefresh: true,
            paused: true,
          },
        ));
      });

      ambient.push(gsap.fromTo(
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
          paused: true,
        },
      ));

      let inView = false;
      let entered = false;
      const sync = () => {
        const documentVisible = !document.hidden;
        const active = inView && entered && documentVisible;

        // Do not pause CSS cycles until the entrance has completed.
        stage.classList.toggle(
          "stage--paused",
          !documentVisible || (entered && !inView),
        );

        active ? tl.play() : tl.pause();
        ambient.forEach((t) => (active ? t.play() : t.pause()));
      };
      const startLoop = () => {
        entered = true;
        sync();
      };
      const onVisibilityChange = () => sync();
      document.addEventListener("visibilitychange", onVisibilityChange);
      disposeVisibility = () => {
        document.removeEventListener("visibilitychange", onVisibilityChange);
        stage.classList.remove("stage--paused");
      };

      const streetTrigger = ScrollTrigger.create({
        trigger: stage,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => { inView = self.isActive; sync(); },
        onRefresh: (self) => { inView = self.isActive; sync(); },
      });
      inView = streetTrigger.isActive;
      sync();

      disposeIntro = runParadeIntro(stage, startLoop);
    }, root);

    return () => {
      disposeIntro?.();
      disposeVisibility?.();
      ctx.revert();
    };
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
      <div className="fog fog--back"><div className="fog__in" /></div>

      {SEGMENTS.map(([k, msg]) => <Figure key={k} k={k} msg={msg} />)}

      <div className="cobbles" />
      <div className="lamp">
        <span className="lamp__glow" />
        <img src="/parade/lamp.png" alt="" />
      </div>
      <div className="fog fog--front"><div className="fog__in" /></div>
    </div>
  );
}

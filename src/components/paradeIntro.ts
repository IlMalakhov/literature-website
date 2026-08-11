import gsap from "gsap";

/* Use from/fromTo so CSS remains the resting state. Keep entrance transforms
   off elements animated by CSS; keyframes override inline animation styles. */

const DELAY = 0.35;
const FIRST = 0.2;
const STEP = 0.07;
const LAMP_BEAT = 0.5;

const keep = <T>(xs: (T | null | undefined)[]): T[] => xs.filter(Boolean) as T[];

/** Runs the entrance and returns an inline-style cleanup function. */
export function runParadeIntro(stage: HTMLElement, startLoop: () => void): () => void {
  const one = (sel: string) => stage.querySelector<HTMLElement>(sel);
  const many = (sel: string) => Array.from(stage.querySelectorAll<HTMLElement>(sel));

  const cobbles = one(".cobbles");
  const stars = one(".stars");
  const lamp = one(".lamp");
  // Exclude stars: their field is rendered from a 2px box-shadow source.
  const hinge = keep([
    one(".moon"),
    one(".skyline--far"),
    one(".skyline:not(.skyline--far)"),
    ...many(".litwin"),
    one(".gull"),
    ...many(".bgfig"),
    one(".fog--back"),
    one(".fog--front"),
  ]);

  // Capture CSS opacity before GSAP writes inline values.
  const rest = new Map<HTMLElement, number>();
  keep([...hinge, lamp]).forEach((el) =>
    rest.set(el, parseFloat(getComputedStyle(el).opacity) || 1),
  );

  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    startLoop();
  };

  let ctx: gsap.Context | undefined;
  let tl: gsap.core.Timeline | undefined;
  const syncVisibility = () => {
    if (!tl || released) return;
    document.hidden ? tl.pause() : tl.resume();
  };
  const stopWatchingVisibility = () =>
    document.removeEventListener("visibilitychange", syncVisibility);
  document.addEventListener("visibilitychange", syncVisibility);

  ctx = gsap.context(() => {
    gsap.set(stage, { perspective: 1000, perspectiveOrigin: "50% 100%" });

    const timeline = gsap.timeline({
      delay: DELAY,
      onComplete: () => {
        stopWatchingVisibility();
        release();
        ctx?.revert();
      },
    });
    tl = timeline;
    syncVisibility();

    if (cobbles) {
      timeline.fromTo(
        cobbles,
        { scaleY: 0, transformOrigin: "50% 100%" },
        { scaleY: 1, duration: 0.55, ease: "power2.out" },
        0,
      );
    }
    if (stars) timeline.from(stars, { opacity: 0, duration: 1.1, ease: "none" }, 0.4);

    const stand = (el: HTMLElement, at: number, duration = 0.9) =>
      timeline.fromTo(
        el,
        { rotationX: -87, opacity: 0, transformOrigin: "50% 100%" },
        {
          rotationX: 0,
          opacity: rest.get(el) ?? 1,
          duration,
          ease: "back.out(1.1)",
        },
        at,
      );

    hinge.forEach((el, i) => stand(el, FIRST + i * STEP));
    if (lamp) stand(lamp, FIRST + hinge.length * STEP + LAMP_BEAT, 1);
  }, stage);

  return () => {
    stopWatchingVisibility();
    ctx?.revert();
  };
}

import gsap from "gsap";

/* ---------------------------------------------------------------------------
   The street's entrance: a pop-up book.

   The parade is a stack of flat plates — stars, moon, two rooflines, lit
   windows, strollers, two fog bands, the lamp — so it can be dealt like a deck
   instead of just switched on. The cobbles unroll first, then every other plate
   hinges up off the pavement back-to-front, under the hero title's own rise.

   Rules this lives by:
   - `from`/`fromTo` only. Their end state is whatever the stylesheet says, so
     the entrance can never drift away from the resting look, and `ctx.revert()`
     at the end wipes every inline style it wrote.
   - Anything applied *before* the timeline's delay must be a bare `gsap.set`,
     not `tl.set` — from/fromTo start states render immediately, plain sets do
     not, and a `tl.set` at position 0 would let the street flash for the whole
     delay before hiding itself.
   - Resting opacity is sampled up front, before any tween ran. Never read it
     back off the DOM mid-build: by then the from-tweens have written 0 over it.
   - Nothing here may animate a property that a CSS keyframe already owns on the
     same element. Keyframes outrank inline styles, so the tween would either be
     invisible or — worse — need the animation suspended, and restoring it snaps
     the element to the animation's first keyframe. That is why the fog bands are
     two elements (see .fog / .fog__in in 10-parade.css): this hinges the outer
     box while the drift keeps running, untouched, on the inner one.
--------------------------------------------------------------------------- */

/** head start, so the street builds under the hero title instead of with it */
const DELAY = 0.35;
const FIRST = 0.2; // when the first plate after the cobbles starts to rise
const STEP = 0.07; // gap between plates in the cascade
/** Beat between the last fog band and the lamp. The lamp is the foreground and
    the payoff, so it stands up alone once the street behind it has settled —
    at one STEP it just rose *with* the fog and the two read as one move. */
const LAMP_BEAT = 0.5;

const keep = <T>(xs: (T | null | undefined)[]): T[] => xs.filter(Boolean) as T[];

/**
 * Play the entrance over the street. Returns a disposer that unwinds every
 * inline style it wrote.
 */
export function runParadeIntro(stage: HTMLElement, startLoop: () => void): () => void {
  const one = (sel: string) => stage.querySelector<HTMLElement>(sel);
  const many = (sel: string) => Array.from(stage.querySelectorAll<HTMLElement>(sel));

  const cobbles = one(".cobbles");
  const stars = one(".stars");
  const lamp = one(".lamp");
  /* back → front. Three plates sit out of this cascade: the cobbles are the
     hinge everything else stands on, the stars are a 2px box throwing their
     whole field in box-shadows (hinging that box would swing the sky around a
     point), and the lamp gets its own beat at the end. */
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

  // resting opacities, read while the stylesheet is still the only author
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
    // the lamp last and alone, a beat after the fog it used to rise alongside
    if (lamp) stand(lamp, FIRST + hinge.length * STEP + LAMP_BEAT, 1);
  }, stage);

  return () => {
    stopWatchingVisibility();
    ctx?.revert();
  };
}

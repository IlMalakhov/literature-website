import { useEffect, useRef } from "react";
import gsap from "gsap";
import { BADGE_TEXT } from "../data";

/* Circumference of the r=38 text circle below. The ring text is pinned to
   exactly this length (lengthAdjust="spacing"), so one copy of BADGE_TEXT
   always closes the circle with even tracking — no overlap at the seam. */
const RING = (2 * Math.PI * 38).toFixed(2);

/** The badge with continuously-rotating curved text. */
export function SpinBadge({ extraClass = "" }: { extraClass?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const pathId = `badgeCircle-${extraClass || "side"}`;

  /* Hover eases the spin almost to a stop, the same way the marquee ribbons
     do — playbackRate, not animation-duration, so the disc slows from where it
     is instead of jumping. Scoped to the disc rather than the subtree (which is
     what the marquee does) because the badge also carries the badge-in fade:
     hovering during its 1s delay would otherwise stretch the entrance to ~8s. */
  useEffect(() => {
    const disc = root.current?.querySelector<HTMLElement>(".badge__disc");
    if (!disc) return;
    const speed = { v: 1 };
    let tween: gsap.core.Tween | null = null;
    const go = (v: number) => {
      tween?.kill();
      tween = gsap.to(speed, {
        v,
        duration: 0.9,
        ease: "power2.out",
        onUpdate: () => {
          for (const a of disc.getAnimations()) a.playbackRate = speed.v;
        },
      });
    };
    const slow = () => go(0.12);
    const full = () => go(1);
    const el = root.current!;
    el.addEventListener("pointerenter", slow);
    el.addEventListener("pointerleave", full);
    return () => {
      tween?.kill();
      el.removeEventListener("pointerenter", slow);
      el.removeEventListener("pointerleave", full);
    };
  }, []);

  return (
    <div className={`badge ${extraClass}`} aria-hidden="true" ref={root}>
      <div className="badge__disc">
        <svg viewBox="0 0 100 100">
          <defs>
            <path id={pathId} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
          </defs>
          <text textLength={RING} lengthAdjust="spacing">
            <textPath href={`#${pathId}`} textLength={RING} lengthAdjust="spacing">
              {BADGE_TEXT}
            </textPath>
          </text>
        </svg>
      </div>
      <div className="badge__core">
        <div>
          <div className="big">84</div>
          <div className="small">средний балл</div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { BADGE_TEXT } from "../data";

const RING = (2 * Math.PI * 38).toFixed(2);

export function SpinBadge({ extraClass = "" }: { extraClass?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const pathId = `badgeCircle-${extraClass || "side"}`;

  // Scope playbackRate to the disc so hover does not slow the entrance fade.
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

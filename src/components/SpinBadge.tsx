import { BADGE_TEXT } from "../data";

/* Circumference of the r=38 text circle below. The ring text is pinned to
   exactly this length (lengthAdjust="spacing"), so one copy of BADGE_TEXT
   always closes the circle with even tracking — no overlap at the seam. */
const RING = (2 * Math.PI * 38).toFixed(2);

/** The badge with continuously-rotating curved text. */
export function SpinBadge({ extraClass = "" }: { extraClass?: string }) {
  const pathId = `badgeCircle-${extraClass || "side"}`;
  return (
    <div className={`badge ${extraClass}`} aria-hidden="true">
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

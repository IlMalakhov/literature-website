import { BADGE_TEXT } from "../data";

/** The floating badge with continuously-rotating curved text. */
export function SpinBadge({ extraClass = "" }: { extraClass?: string }) {
  const pathId = `badgeCircle-${extraClass || "side"}`;
  return (
    <div className={`badge ${extraClass}`} aria-hidden="true">
      <div className="badge__disc">
        <svg viewBox="0 0 100 100">
          <defs>
            <path id={pathId} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
          </defs>
          <text>
            <textPath href={`#${pathId}`}>{BADGE_TEXT + BADGE_TEXT}</textPath>
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

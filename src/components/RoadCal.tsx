import type { RoadCal as RoadCalData } from "../data";

const WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
const MONTHS = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];

function season(m: number) {
  if (m === 12 || m <= 2) return "winter";
  if (m <= 5) return "spring";
  if (m <= 8) return "summer";
  return "autumn";
}

export function RoadCal({ cal, index }: { cal: RoadCalData; index: number }) {
  // UTC prevents build-machine timezone differences during hydration.
  const first = new Date(Date.UTC(cal.y, cal.m - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7; // Monday-first offset
  const days = new Date(Date.UTC(cal.y, cal.m, 0)).getUTCDate();
  const cells = Array.from(
    { length: Math.ceil((lead + days) / 7) * 7 },
    (_, i) => (i < lead || i >= lead + days ? null : i - lead + 1),
  );

  const keys = new Set(cal.keys ?? []);
  const soft = new Set(cal.soft ?? []);

  return (
    <figure className={`roadcal roadcal--${season(cal.m)}`} data-cal={index}>
      <div className="roadcal__head">
        <span className="roadcal__mon">{MONTHS[cal.m - 1]}</span>
        <span className="roadcal__yr">{cal.y}</span>
      </div>
      <div className="roadcal__grid" aria-hidden="true">
        {WEEKDAYS.map((w) => (
          <span className="roadcal__wd" key={w}>{w}</span>
        ))}
        {cells.map((d, i) => (
          <span
            key={i}
            className={[
              "roadcal__d",
              d === null && "is-out",
              i % 7 >= 5 && "is-we",
              d !== null && soft.has(d) && "is-soft",
              d !== null && keys.has(d) && "is-key",
            ].filter(Boolean).join(" ")}
          >
            {d}
          </span>
        ))}
      </div>
      <figcaption className="roadcal__note">{cal.note}</figcaption>
    </figure>
  );
}

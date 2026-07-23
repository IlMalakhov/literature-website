import type { RoadCal as RoadCalData } from "../data";

const WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
const MONTHS = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];

/* Meteorological seasons as Russian school reckons them: зима = дек–фев,
   весна = мар–май, лето = июн–авг, осень = сен–ноя. Drives the paper tint. */
function season(m: number) {
  if (m === 12 || m <= 2) return "winter";
  if (m <= 5) return "spring";
  if (m <= 8) return "summer";
  return "autumn";
}

/* A decorative month leaf for a roadmap step. Static by construction — no
   selection, no navigation, no state — so it prerenders to plain HTML and
   ships no runtime. */
export function RoadCal({ cal, index }: { cal: RoadCalData; index: number }) {
  /* UTC everywhere: vite-react-ssg builds these on the build machine, and a
     local-time Date would lay the grid out in *its* zone. West of UTC the 1st
     lands a day earlier than in the browser — a silent hydration mismatch. */
  const first = new Date(Date.UTC(cal.y, cal.m - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7; // blanks before the 1st, Mon-first
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
      {/* The grid is ornament; the caption below carries the actual date. */}
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

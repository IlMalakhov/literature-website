import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { AVG_SCORE, QUOTES, QUOTES_FILLER } from "../data";
import { IconArrowForward } from "./Icons";

type Quote = { text: string; who: string; role: string; score: string };

const BY_SCORE = new Map<number, Quote[]>();
[...QUOTES, ...QUOTES_FILLER].forEach((q) => {
  const s = Number(q.score);
  BY_SCORE.set(s, [...(BY_SCORE.get(s) ?? []), q]);
});
const SCORES = [...BY_SCORE.keys()].sort((a, b) => a - b);
const MIN = SCORES[0];
const MAX = SCORES[SCORES.length - 1];

const pct = (v: number) => ((v - MIN) / (MAX - MIN)) * 100;
const wghtOf = (v: number) => Math.round(200 + (pct(v) / 100) * 700);
const nearest = (v: number) =>
  SCORES.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
const plural = (n: number) => (n === 1 ? "отзыв" : n < 5 ? "отзыва" : "отзывов");
const tickH = (n: number) => Math.min(16 + (n - 1) * 12, 40);

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const DRIFT_MS = 6000;

export function QuotesScale() {
  const [score, setScore] = useState(MAX);
  const root = useRef<HTMLDivElement>(null);
  const ruler = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLDivElement>(null);
  const meta = useRef<HTMLParagraphElement>(null);
  const cards = useRef<HTMLDivElement>(null);
  const needle = useRef<HTMLSpanElement>(null);
  const dragging = useRef(false);

  const scoreRef = useRef(score);
  scoreRef.current = score;

  const intro = useRef<gsap.core.Tween | null>(null);
  const introDone = useRef(false);
  const inView = useRef(false);
  const driftDir = useRef<1 | -1>(-1);

  const quotes = BY_SCORE.get(score)!;

  useLayoutEffect(() => {
    if (reduced() || intro.current?.isActive()) return;
    const anims = [
      gsap.fromTo(
        num.current,
        { yPercent: 26, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.55, ease: "power3.out" },
      ),
      gsap.fromTo(
        cards.current!.children,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.09, ease: "power3.out" },
      ),
    ];
    return () => anims.forEach((a) => a.kill());
  }, [score]);

  const runIntro = () => {
    introDone.current = true;
    if (reduced()) return;
    const obj = { v: MIN };
    needle.current!.classList.add("qsc__needle--sweep");
    num.current!.classList.add("qsc__num--sweep");
    gsap.set([cards.current, meta.current], { opacity: 0 });
    intro.current = gsap.to(obj, {
      v: MAX,
      duration: 2.4,
      ease: "power2.inOut",
      onUpdate() {
        num.current!.textContent = String(Math.round(obj.v));
        num.current!.style.fontWeight = String(wghtOf(obj.v));
        needle.current!.style.left = `${pct(obj.v)}%`;
      },
      onComplete() {
        needle.current!.classList.remove("qsc__needle--sweep");
        num.current!.classList.remove("qsc__num--sweep");
        gsap.to([cards.current, meta.current], { opacity: 1, duration: 0.6 });
      },
    });
  };

  const killIntro = () => {
    if (!intro.current?.isActive()) return;
    intro.current.kill();
    needle.current!.classList.remove("qsc__needle--sweep");
    num.current!.classList.remove("qsc__num--sweep");
    num.current!.textContent = String(scoreRef.current);
    num.current!.style.fontWeight = String(wghtOf(scoreRef.current));
    needle.current!.style.left = `${pct(scoreRef.current)}%`;
    gsap.set([cards.current, meta.current], { opacity: 1 });
  };

  useLayoutEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          inView.current = e.isIntersecting;
          if (e.isIntersecting && !introDone.current) runIntro();
        });
      },
      { threshold: 0.35 },
    );
    io.observe(root.current!);
    return () => {
      io.disconnect();
      intro.current?.kill();
    };
  }, []);

  useEffect(() => {
    if (reduced()) return;
    const id = setInterval(() => {
      if (!introDone.current || intro.current?.isActive()) return;
      if (!inView.current || dragging.current || document.hidden) return;
      if (root.current?.matches(":hover")) return;
      const i = SCORES.indexOf(scoreRef.current);
      let j = i + driftDir.current;
      if (j < 0 || j >= SCORES.length) {
        driftDir.current = driftDir.current === 1 ? -1 : 1;
        j = i + driftDir.current;
      }
      setScore(SCORES[j]);
    }, DRIFT_MS);
    return () => clearInterval(id);
  }, [score]);

  const fromClientX = (x: number) => {
    const r = ruler.current!.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (x - r.left) / r.width));
    return nearest(MIN + f * (MAX - MIN));
  };

  const step = (dir: 1 | -1) => {
    const next = SCORES[SCORES.indexOf(score) + dir];
    if (next != null) setScore(next);
  };

  return (
    <div className="qsc" ref={root}>
      <div className="qsc__grid">
        <div className="qsc__side">
          <div className="qsc__num" ref={num} style={{ fontWeight: wghtOf(score) }}>
            {score}
          </div>
          <p className="qsc__meta" ref={meta}>
            балл на ЕГЭ · {quotes.length} {plural(quotes.length)}
          </p>
        </div>
        <div className="qsc__cards" ref={cards}>
          {quotes.map((q) => (
            <blockquote className="qsc__card" key={q.who}>
              <p>{q.text}</p>
              <footer>
                <b>{q.who}</b>
                <small>{q.role}</small>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>

      <div
        className="qsc__ruler"
        ref={ruler}
        role="slider"
        tabIndex={0}
        aria-label="Балл на ЕГЭ"
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={score}
        onPointerDown={(e) => {
          killIntro();
          dragging.current = true;
          setScore(fromClientX(e.clientX));
          try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* No active pointer. */ }
        }}
        onPointerMove={(e) => {
          if (dragging.current) setScore(fromClientX(e.clientX));
        }}
        onPointerUp={() => { dragging.current = false; }}
        onKeyDown={(e) => {
          killIntro();
          if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); step(1); }
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); step(-1); }
        }}
      >
        {SCORES.map((s) => (
          <span
            className={`qsc__tick${s === score ? " qsc__tick--cur" : ""}`}
            style={{ left: `${pct(s)}%` }}
            key={s}
          >
            <i style={{ height: tickH(BY_SCORE.get(s)!.length) }} />
            <em>{s}</em>
          </span>
        ))}
        <span className="qsc__avg" style={{ left: `${pct(AVG_SCORE)}%` }} aria-hidden="true">
          <i />
          <em>средний балл · {AVG_SCORE}</em>
        </span>
        <span className="qsc__needle" ref={needle} style={{ left: `${pct(score)}%` }} aria-hidden="true" />
      </div>
      <p className="qsc__hint">
        потяните шкалу — или листайте стрелками{" "}
        <IconArrowForward className="qsc__hint-arrow qsc__hint-arrow--back" aria-hidden="true" />
        <IconArrowForward className="qsc__hint-arrow" aria-hidden="true" />
      </p>
    </div>
  );
}

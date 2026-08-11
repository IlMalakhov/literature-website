import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { CURSORS } from "../cursors.gen";

type SpriteName = keyof typeof CURSORS;
type Zone = "quill" | "redpen" | "pixel";

const INTERACTIVE =
  "a, button, [role='button'], [role='option'], [role='slider'], summary, label, [data-mark]";
const TEXTFIELD = "input, textarea, select";
const ROSE = "238, 93, 120"; // --accent
const DEEP = "165, 43, 70"; // --btn

// Cursor mode comes from the nearest data-cursor region.
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const layer = useRef<HTMLDivElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const finePointer = matchMedia("(pointer: fine)");
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setEnabled(finePointer.matches && !reducedMotion.matches);

    sync();
    finePointer.addEventListener("change", sync);
    reducedMotion.addEventListener("change", sync);
    return () => {
      finePointer.removeEventListener("change", sync);
      reducedMotion.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !layer.current || !holder.current || !canvas.current) return;
    const hold = holder.current;
    const cnv = canvas.current;
    const ctx = cnv.getContext("2d")!;
    const imgs = Object.fromEntries(
      Array.from(hold.querySelectorAll("img")).map((el) => [el.dataset.name, el]),
    ) as Record<SpriteName, HTMLImageElement>;

    document.documentElement.classList.add("cc-on");
    if (import.meta.env.DEV) (window as unknown as { __gsap: typeof gsap }).__gsap = gsap;

    const resize = () => {
      // Cap DPR to limit the cost of clearing a full-viewport canvas each frame.
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      cnv.width = Math.round(innerWidth * dpr);
      cnv.height = Math.round(innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = ctx.lineJoin = "round";
    };
    resize();

    let zone: Zone = "quill";
    let sprite: SpriteName = "quill";
    let overText = false; // Yield to the native caret in form fields.
    let shown = false;
    const raw = { x: -100, y: -100 };
    const prev = { x: -100, y: -100 };
    let pointerDirty = false;
    let pointerFrame = 0;
    let ticking = false;
    let resizeFrame = 0;
    let pressed = false;
    let underline: Element | null = null;
    const ul = { p: 0, a: 0 }; // draw progress / alpha
    let ulTween: gsap.core.Tween | null = null;
    const checks: { x: number; y: number; born: number; tilt: number }[] = [];
    // Repaint particles; destination-out leaves residual alpha.
    const TRAIL_LIFE = 420;
    const BLOT_LIFE = 650;
    const trail: { x: number; y: number; w: number; born: number }[] = [];
    const blots: { x: number; y: number; r: number; born: number }[] = [];

    const xTo = gsap.quickTo(hold, "x", { duration: 0.1, ease: "power3.out" });
    const yTo = gsap.quickTo(hold, "y", { duration: 0.1, ease: "power3.out" });
    const rotTo = gsap.quickTo(imgs.quill, "rotation", {
      duration: 0.35, ease: "power2.out",
    });

    const applyPointer = () => {
      if (!pointerDirty) return;
      pointerDirty = false;
      if (zone === "pixel") {
        // Pixel mode is grid-snapped and has no easing.
        const off = pressed ? 2 : 0;
        gsap.set(hold, {
          x: Math.round((raw.x + off) / 2) * 2,
          y: Math.round((raw.y + off) / 2) * 2,
        });
      } else {
        xTo(raw.x);
        yTo(raw.y);
      }
    };

    const queuePointer = () => {
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        applyPointer();
        // Only the quill trail needs per-frame positions.
        if (zone === "quill") requestTick();
      });
    };

    const requestTick = () => {
      if (ticking || document.hidden) return;
      ticking = true;
      gsap.ticker.add(tick);
    };

    const stopTick = () => {
      if (!ticking) return;
      ticking = false;
      gsap.ticker.remove(tick);
    };

    const show = (name: SpriteName) => {
      if (name === sprite) return;
      sprite = name;
      for (const [key, el] of Object.entries(imgs)) {
        if (key === name) {
          gsap.fromTo(el,
            { scale: 0.82, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, duration: 0.22, ease: "back.out(2)",
              overwrite: "auto" });
        } else {
          gsap.to(el, { autoAlpha: 0, duration: 0.16, overwrite: "auto" });
        }
      }
    };

    const spriteFor = (hovering: boolean): SpriteName => {
      if (zone === "redpen") return "redpen";
      if (zone === "pixel") return hovering ? "pixel-hand" : "pixel-quill";
      return hovering ? "quill-hover" : "quill";
    };

    const onMove = (e: PointerEvent) => {
      const coalesced = e.getCoalescedEvents?.();
      const point = coalesced?.length ? coalesced[coalesced.length - 1] : e;
      raw.x = point.clientX;
      raw.y = point.clientY;
      if (!shown) {
        shown = true;
        gsap.set(hold, { x: raw.x, y: raw.y });
        prev.x = raw.x;
        prev.y = raw.y;
        gsap.to(hold, { autoAlpha: overText ? 0 : 1, duration: 0.2 });
      }
      pointerDirty = true;
      if (zone === "pixel") {
        applyPointer();
      } else queuePointer();
    };

    const onOver = (e: PointerEvent) => {
      const t = e.target as Element;
      if (!t?.closest) return;
      zone = ((t.closest("[data-cursor]") as HTMLElement | null)
        ?.dataset.cursor as Zone) ?? "quill";
      const hovered = t.closest(INTERACTIVE);
      overText = !!t.closest(TEXTFIELD);
      gsap.to(hold, {
        autoAlpha: overText || !shown ? 0 : 1, duration: 0.15,
      });
      show(spriteFor(!!hovered));

      const next = zone === "redpen" && hovered ? hovered : null;
      if (next !== underline) {
        ulTween?.kill();
        if (next) {
          underline = next;
          ul.p = 0;
          ul.a = 1;
          ulTween = gsap.to(ul, { p: 1, duration: 0.45, ease: "power2.out" });
        } else {
          // Keep the target until the stroke finishes fading.
          ulTween = gsap.to(ul, {
            a: 0, duration: 0.3, ease: "power1.out",
            onComplete: () => { underline = null; },
          });
        }
      }
      requestTick();
    };

    const onDown = (e: PointerEvent) => {
      pressed = true;
      if (zone === "redpen") {
        checks.push({
          x: e.clientX, y: e.clientY, born: performance.now(),
          tilt: (Math.random() - 0.5) * 0.5,
        });
      } else if (zone === "quill") {
        inkBlot(e.clientX, e.clientY);
        gsap.to(imgs.quill, { scale: 0.9, duration: 0.1 });
        gsap.to(imgs["quill-hover"], { scale: 0.9, duration: 0.1 });
      } else {
        onMove(e);
      }
      if (zone !== "pixel") requestTick();
    };
    const onUp = (e: PointerEvent) => {
      pressed = false;
      gsap.to([imgs.quill, imgs["quill-hover"]], { scale: 1, duration: 0.25 });
      if (zone === "pixel") onMove(e);
      if (zone !== "pixel") requestTick();
    };
    const onLeaveWindow = (e: PointerEvent) => {
      if (!e.relatedTarget) {
        shown = false;
        gsap.to(hold, { autoAlpha: 0, duration: 0.2 });
        requestTick();
      }
    };

    const inkBlot = (x: number, y: number) => {
      const born = performance.now();
      blots.push({ x, y, r: 3.5, born });
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = 6 + Math.random() * 8;
        blots.push({
          x: x + Math.cos(a) * d, y: y + Math.sin(a) * d,
          r: 0.8 + Math.random() * 1.4, born,
        });
      }
    };

    const drawInk = (now: number) => {
      while (trail.length && now - trail[0].born > TRAIL_LIFE) trail.shift();
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1], b = trail[i];
        if (Math.hypot(b.x - a.x, b.y - a.y) > 120) continue;
        const k = 1 - (now - b.born) / TRAIL_LIFE;
        ctx.strokeStyle = `rgba(${ROSE}, ${0.42 * k})`;
        ctx.lineWidth = Math.max(b.w * (0.35 + 0.65 * k), 0.5);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (let i = blots.length - 1; i >= 0; i--) {
        const bl = blots[i];
        const age = now - bl.born;
        if (age > BLOT_LIFE) { blots.splice(i, 1); continue; }
        ctx.fillStyle = `rgba(${ROSE}, ${0.5 * (1 - age / BLOT_LIFE)})`;
        ctx.beginPath();
        ctx.arc(bl.x, bl.y, bl.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawUnderline = () => {
      if (!underline || !underline.isConnected || ul.a <= 0.01) return;
      // Spread draw progress across line fragments so wrapped text is one stroke.
      const rects = [...underline.getClientRects()].filter((r) => r.width > 1);
      if (!rects.length) return;
      const total = rects.reduce((s, r) => s + r.width, 0);
      let remaining = ul.p * total;
      let phase = 0; // Keep the wave continuous across line fragments.
      ctx.strokeStyle = `rgba(${DEEP}, ${0.95 * ul.a})`;
      ctx.lineWidth = 2;
      for (const r of rects) {
        if (remaining <= 0) break;
        const w = Math.min(r.width, remaining);
        const start = phase;
        remaining -= r.width;
        phase += r.width;
        if (r.bottom < -40 || r.top > innerHeight + 40) continue;
        const y = r.bottom + 3;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const yy = y + Math.sin((start + x) / 4.5) * 1.8;
          x === 0 ? ctx.moveTo(r.left + x, yy) : ctx.lineTo(r.left + x, yy);
        }
        ctx.stroke();
      }
    };

    const drawChecks = (now: number) => {
      for (let i = checks.length - 1; i >= 0; i--) {
        const c = checks[i];
        const age = now - c.born;
        if (age > 1100) { checks.splice(i, 1); continue; }
        const draw = Math.min(age / 260, 1);
        const alpha = age < 650 ? 1 : 1 - (age - 650) / 450;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.tilt);
        ctx.strokeStyle = `rgba(${DEEP}, ${alpha})`;
        ctx.lineWidth = 3;
        // Reveal the checkmark as one continuous path.
        const pts = [[-9, -1], [-2, 6], [11, -12]];
        const seg1 = Math.hypot(7, 7), seg2 = Math.hypot(13, 18);
        const total = (seg1 + seg2) * draw;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        if (total <= seg1) {
          const t = total / seg1;
          ctx.lineTo(pts[0][0] + (pts[1][0] - pts[0][0]) * t,
            pts[0][1] + (pts[1][1] - pts[0][1]) * t);
        } else {
          ctx.lineTo(pts[1][0], pts[1][1]);
          const t = (total - seg1) / seg2;
          ctx.lineTo(pts[1][0] + (pts[2][0] - pts[1][0]) * t,
            pts[1][1] + (pts[2][1] - pts[1][1]) * t);
        }
        ctx.stroke();
        ctx.restore();
      }
    };

    let vel = 0;
    const tick = () => {
      if (document.hidden) {
        stopTick();
        return;
      }

      const now = performance.now();
      ctx.clearRect(0, 0, innerWidth, innerHeight);

      const x = Number(gsap.getProperty(hold, "x"));
      const y = Number(gsap.getProperty(hold, "y"));
      const dx = x - prev.x;
      const dist = Math.hypot(dx, y - prev.y);
      vel += (dist - vel) * 0.3;

      if (shown && zone === "quill" && !overText && dist > 0.1) {
        trail.push({ x, y, w: Math.min(1 + vel * 0.22, 6), born: now });
        if (vel > 26) {
          for (let i = 0; i < 2; i++) {
            const a = Math.random() * Math.PI * 2;
            blots.push({
              x: x + Math.cos(a) * 10 * Math.random(),
              y: y + Math.sin(a) * 10 * Math.random(),
              r: 0.7 + Math.random(), born: now,
            });
          }
        }
        rotTo(Math.max(-15, Math.min(15, dx * 1.4)));
      } else if (zone === "quill") {
        rotTo(0);
      }
      drawInk(now);
      drawUnderline();
      drawChecks(now);
      prev.x = x;
      prev.y = y;

      const holderMoving =
        shown && zone === "quill" && Math.hypot(raw.x - x, raw.y - y) > 0.1;
      const effectsActive =
        trail.length > 0 ||
        blots.length > 0 ||
        checks.length > 0 ||
        !!ulTween?.isActive();
      if (!holderMoving && !effectsActive) stopTick();
    };

    const onResize = () => {
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        resize();
        requestTick();
      });
    };
    const onViewportChange = () => requestTick();
    const onVisibilityChange = () => {
      if (document.hidden) {
        stopTick();
        cancelAnimationFrame(pointerFrame);
        pointerFrame = 0;
      } else {
        if (pointerDirty) queuePointer();
        requestTick();
      }
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerout", onLeaveWindow, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    addEventListener("resize", onResize, { passive: true });
    addEventListener("scroll", onViewportChange, { passive: true });

    return () => {
      document.documentElement.classList.remove("cc-on");
      stopTick();
      cancelAnimationFrame(pointerFrame);
      cancelAnimationFrame(resizeFrame);
      removeEventListener("resize", onResize);
      removeEventListener("scroll", onViewportChange);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerout", onLeaveWindow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      ulTween?.kill();
      gsap.killTweensOf([hold, ...Object.values(imgs), ul]);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="cursor" ref={layer} aria-hidden="true">
      <canvas className="cursor__ink" ref={canvas} />
      <div className="cursor__holder" ref={holder}>
        {(Object.entries(CURSORS) as [SpriteName, (typeof CURSORS)[SpriteName]][])
          .map(([name, c]) => (
            <img
              key={name}
              data-name={name}
              src={c.src}
              className={c.pixel ? "px" : undefined}
              style={{
                width: c.w,
                height: c.h,
                left: -c.hx,
                top: -c.hy,
                transformOrigin: `${c.hx}px ${c.hy}px`,
                opacity: name === "quill" ? 1 : 0,
                visibility: name === "quill" ? "visible" : "hidden",
              }}
              alt=""
              draggable={false}
            />
          ))}
      </div>
    </div>
  );
}

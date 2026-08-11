import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { Nav } from "./components/Nav";
import { Cursor } from "./components/Cursor";
import { Hero } from "./components/Hero";
import { Program } from "./components/Program";
import { Essay } from "./components/Essay";
import { Roadmap } from "./components/Roadmap";
import { Faq } from "./components/Faq";
import {
  Marquee, Manifesto, Quotes, About, Cta, Footer,
} from "./components/Sections";

gsap.registerPlugin(ScrollTrigger);

export function App() {
  const bar = useRef<HTMLDivElement>(null);

  // Drive Lenis from GSAP so ScrollTrigger sees the same scroll position.
  useLayoutEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.115 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // #program starts at its horizontal pin, not at the section boundary.
    const pad =
      parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 90;
    // Resolve before scrolling; Lenis can misplace an element target while layout settles.
    const destination = (id: string): number | null => {
      const st = ScrollTrigger.getById("program-h");
      if (id === "program" && st) return st.start;
      const el = document.getElementById(id);
      if (!el) return null;
      return el.getBoundingClientRect().top + window.scrollY - pad;
    };
    const goTo = (id: string, immediate = false) => {
      const target = destination(id);
      if (target == null) return;
      lenis.scrollTo(Math.max(0, target), { immediate });
    };

    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a[href^="#"]');
      const href = link?.getAttribute("href");
      if (!href || href === "#") return;
      const id = href.slice(1);
      if (!document.getElementById(id)) return;
      e.preventDefault();
      history.pushState(null, "", href);
      goTo(id);
    };
    document.addEventListener("click", onClick);

    // ScrollTrigger.start is valid only after fonts and layout settle.
    const settle = () => {
      ScrollTrigger.refresh();
      const id = location.hash.slice(1);
      if (id) goTo(id, true);
    };
    if (document.fonts?.ready) document.fonts.ready.then(settle);
    else window.addEventListener("load", settle);

    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      document.querySelectorAll<HTMLElement>("[data-depth]").forEach((el) => {
        const d = parseFloat(el.dataset.depth || "0.15");
        gsap.fromTo(el, { yPercent: d * 55 }, {
          yPercent: -d * 55,
          ease: "none",
          scrollTrigger: {
            trigger: el.parentElement,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });
    });
    // Images can change trigger positions after loading.
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    return () => { window.removeEventListener("load", onLoad); mm.revert(); };
  }, []);

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        el.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      });
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <Cursor />
      <div className="progressbar" aria-hidden="true"><div ref={bar} /></div>
      <div className="rail" aria-hidden="true">Литература · ЕГЭ · 2026/27</div>
      <Nav />
      <Hero />
      <Manifesto />
      <Marquee />
      <Program />
      <Essay />
      <Quotes />
      <About />
      <Roadmap />
      <Faq />
      <Cta />
      <Footer />
    </>
  );
}

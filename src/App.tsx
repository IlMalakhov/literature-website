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
  Marquee, Stats, Quotes, About, Cta, Footer,
} from "./components/Sections";

gsap.registerPlugin(ScrollTrigger);

export function App() {
  const bar = useRef<HTMLDivElement>(null);

  /* Lenis smooth scroll, driven by the GSAP ticker so ScrollTrigger and the
     scroll position never disagree. Skipped for reduced motion. */
  useLayoutEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.115, anchors: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  // reveal-on-scroll: fade sections in as they enter the viewport
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

  /* depth parallax: any [data-depth] image drifts vertically while its parent
     section crosses the viewport — cheap fake 3D for the background art */
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
    // image heights settle after load — recompute trigger positions
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    return () => { window.removeEventListener("load", onLoad); mm.revert(); };
  }, []);

  // top progress bar
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
      <Marquee />
      <Stats />
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

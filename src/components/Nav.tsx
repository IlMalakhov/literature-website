import { useEffect, useState } from "react";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`nav${scrolled ? " scrolled" : ""}`}>
      <div className="wrap nav__inner">
        <a className="brand" href="#top">
          Дарья Федорова
          <small>Литература · ЕГЭ</small>
        </a>
        <a className="nav__cta" href="#composer">
          Написать в Telegram
        </a>
      </div>
    </nav>
  );
}

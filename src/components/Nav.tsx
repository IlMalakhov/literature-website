import { useEffect, useState } from "react";
import { TG_URL } from "../data";

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
          Дарья Соколова
          <small>Литература · ЕГЭ</small>
        </a>
        <a className="nav__cta" href={TG_URL} target="_blank" rel="noopener">
          Написать в Telegram <span className="arrow">→</span>
        </a>
      </div>
    </nav>
  );
}

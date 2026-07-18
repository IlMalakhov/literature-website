import { useState } from "react";
import { FAQ_STUDENT, FAQ_PARENT, TG_QUESTION_URL } from "../data";

/* «Вопросы»: the objections parents or students raise before booking, answered.
   Accordion opens via grid-template-rows 0fr→1fr — no height measuring,
   buttery on any content length. One question open at a time. */
export function Faq() {
  const [audience, setAudience] = useState<"student" | "parent">("student");
  const [open, setOpen] = useState<number>(-1);

  const currentFaq = audience === "student" ? FAQ_STUDENT : FAQ_PARENT;

  const handleAudienceChange = (aud: "student" | "parent") => {
    setAudience(aud);
    setOpen(-1);
  };

  return (
    <section className="faq section-pad" id="faq">
      <div className="wrap">
        <div className="sec-head reveal">
          <h2>Спросите — <em>отвечу</em></h2>
        </div>

        <div className="faq__toggle-row">
          <div className="faq__toggle-wrapper">
            <div className="faq__toggle">
              <button
                type="button"
                className={`faq__toggle-btn ${audience === "student" ? "active" : ""}`}
                onClick={() => handleAudienceChange("student")}
              >
                Я ученик
              </button>
              <button
                type="button"
                className={`faq__toggle-btn ${audience === "parent" ? "active" : ""}`}
                onClick={() => handleAudienceChange("parent")}
              >
                Я родитель
              </button>
              <div className={`faq__toggle-slide ${audience}`} aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="faq__list">
          {currentFaq.map((item, i) => {
            const isOpen = open === i;
            return (
              <div className={`faq__item${isOpen ? " open" : ""}`} key={item.q}>
                <button
                  type="button"
                  className="faq__q"
                  aria-expanded={isOpen}
                  aria-controls={`faq-a-${i}`}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  <span className="faq__num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="faq__text">{item.q}</span>
                  <span className="faq__icon" aria-hidden="true" />
                </button>
                <div className="faq__a" id={`faq-a-${i}`} role="region">
                  <div className="faq__a-in">
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="faq__more reveal">
          Остался свой вопрос?{" "}
          <a className="link-under" href={TG_QUESTION_URL} target="_blank" rel="noopener">
            Задайте его в Telegram
          </a>{" "}
          — отвечаю лично.
        </p>
      </div>
    </section>
  );
}


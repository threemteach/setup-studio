import { useState, useEffect } from "react"
import Reveal from "../ui/Reveal"
import { fetchHomepageContent } from "../../lib/homepage"
import { useTranslation } from "../../context/LanguageContext"

const t = (en, ar, lang) => lang === "ar" ? ar : en

export default function OurProcess() {
  const [content, setContent] = useState(null)
  const { lang } = useTranslation()

  useEffect(() => {
    fetchHomepageContent().then((data) => {
      setContent(data.process || null)
    }).catch(console.error)
  }, [])

  const localized = content ? (content[`content_${lang}`] || content.content_en) : null
  const steps = localized?.steps || []
  const font = lang === "ar" ? "'Cairo', sans-serif" : "'Lexend', sans-serif"

  return (
    <section className="w-full bg-white dark:bg-[#0A1216] py-[clamp(1rem,3vw,3rem)]">
      <div className="max-w-[900px] mx-auto px-[clamp(1.25rem,4vw,2rem)]">
        <Reveal>
          <div className="text-center mb-[clamp(2.5rem,6vw,4rem)]">
            <h2 className="text-navy dark:text-white font-bold uppercase tracking-[0.08em] text-[clamp(1.4rem,3.2vw,2.1rem)] m-0" style={{ fontFamily: font }}>
              {t("Our Process", "عمليتنا", lang)}
            </h2>
            <p className="text-navy dark:text-white/80 text-[clamp(0.75rem,1.4vw,0.9rem)] tracking-[0.15em] uppercase mt-2 m-0" style={{ fontFamily: font }}>
              {t("From Idea to Action", "من الفكرة إلى التنفيذ", lang)}
            </p>
          </div>
        </Reveal>

        <div className="relative">
          <div className="absolute w-[4px] bg-navy dark:bg-white/20 top-0 bottom-0 ltr:-translate-x-1/2 rtl:translate-x-1/2"
            style={{
              [lang === "ar" ? "right" : "left"]: "calc(clamp(5rem,15vw,9rem) + clamp(0.75rem,2vw,1.5rem) + clamp(0.35rem,0.8vw,0.55rem))",
            }}
          />

          {steps.map((step, i) => (
            <Reveal key={i} delay={0.1 + i * 0.1}>
              <div className="flex items-stretch gap-[clamp(0.75rem,2vw,1.5rem)]">
                <span className="shrink-0 w-[clamp(5rem,15vw,9rem)] text-navy dark:text-white/20 font-extrabold leading-none text-[clamp(4rem,11vw,7.5rem)] pt-[clamp(0.4rem,1.2vw,0.8rem)]" style={{ fontFamily: font }}>
                  {step.number}
                </span>
                <div className="shrink-0 flex flex-col items-center pt-[clamp(0.8rem,2vw,1.4rem)]">
                  <span className="relative z-10 w-[clamp(0.7rem,1.6vw,1.1rem)] h-[clamp(0.7rem,1.6vw,1.1rem)] rounded-full bg-navy dark:bg-white" />
                </div>
                <div className="flex-1 pb-[clamp(1.5rem,4vw,2.5rem)] pt-[clamp(0.6rem,1.6vw,1.1rem)]">
                  <h3 className="text-navy dark:text-white font-bold text-[clamp(1rem,2vw,1.3rem)] m-0 mb-1.5 leading-tight" style={{ fontFamily: font }}>
                    {step.title}
                  </h3>
                  <p className="text-navy/60 dark:text-white/50 text-[clamp(0.8rem,1.2vw,0.95rem)] leading-relaxed m-0 max-w-[38rem]" style={{ fontFamily: font }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

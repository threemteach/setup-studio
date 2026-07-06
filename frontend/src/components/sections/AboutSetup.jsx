import { useState, useEffect } from "react"
import Reveal from "../ui/Reveal"
import { fetchHomepageContent } from "../../lib/homepage"
import { useTranslation } from "../../context/LanguageContext"

const t = (en, ar, lang) => lang === "ar" ? ar : en

export default function AboutSetup() {
  const [content, setContent] = useState(null)
  const { lang } = useTranslation()

  useEffect(() => {
    fetchHomepageContent().then((data) => {
      setContent(data.about || null)
    }).catch(console.error)
  }, [])

  const localized = content ? (content[`content_${lang}`] || content.content_en) : null
  const heading = localized?.heading || ""
  const body = localized?.body || ""

  return (
    <section className="w-full bg-white py-[clamp(2rem,5vw,5rem)] overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)]">
        <div className="flex flex-col items-center text-center mb-[clamp(1.5rem,4vw,3.5rem)]">
          <Reveal>
            <div className="flex items-center justify-center w-full mb-4 px-0">
              <div className="flex items-center min-w-0 shrink">
                <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                  <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                </svg>
                <span className="block w-[clamp(1.5rem,12vw,16rem)] h-[2px] bg-red" />
              </div>
              <h2 className="text-navy text-[clamp(1.3rem,4.5vw,3.5rem)] font-bold leading-tight m-0 px-[clamp(0.4rem,2vw,1.5rem)] whitespace-nowrap">
                {t("About Setup", "عن سيت أب", lang)}
              </h2>
              <div className="flex items-center min-w-0 shrink">
                <span className="block w-[clamp(1.5rem,12vw,16rem)] h-[2px] bg-red" />
                <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                  <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                </svg>
              </div>
            </div>
          </Reveal>
          {heading && (
            <Reveal delay={0.1}>
              <p className="text-navy font-semibold text-[clamp(1rem,2vw,1.35rem)] mt-4 max-w-[40rem] mx-auto leading-snug tracking-wide">
                {heading}
              </p>
            </Reveal>
          )}
        </div>

        <Reveal delay={0.2}>
          <div className="max-w-[clamp(35rem,60vw,55rem)] mx-auto">
            <p className={`text-[#0A1216]/70 text-[clamp(0.85rem,1.2vw,1.05rem)] leading-[1.8] m-0 ${lang === 'ar' ? 'text-right' : 'text-center'}`}>
              {body}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

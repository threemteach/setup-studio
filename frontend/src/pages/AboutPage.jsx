import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import SEO from "../components/SEO"
import Reveal from "../components/ui/Reveal"
import SectionHeader from "../components/ui/SectionHeader"
import { optimizeImageUrl } from "../lib/images"
import { useTranslation } from "../context/LanguageContext"
import { fetchAboutContent, defaultServices, defaultValues } from "../lib/about"

const t = (en, ar, lang) => lang === "ar" ? ar : en

export default function AboutPage() {
  const { lang } = useTranslation()
  const [cms, setCms] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAboutContent()
      .then((data) => setCms(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function p(field) {
    return cms?.[`${field}_${lang}`] ?? cms?.[`${field}_en`] ?? ""
  }

  const services = cms?.services || defaultServices
  const values = cms?.values || defaultValues
  const storyParagraphs = cms ? (cms[`story_paragraphs_${lang}`] || cms.story_paragraphs_en || []) : []
  const heroPhoto = cms?.hero_photo_url || "https://res.cloudinary.com/yscxguwn/image/upload/v1783214895/setup-studio/locations/reels/acphlvi0gzn7ag29zstf.jpg"
  const storyPhoto = cms?.story_photo_url || "https://res.cloudinary.com/yscxguwn/image/upload/v1783214751/setup-studio/locations/podcast/a6h0qzu4egndsexwtnal.jpg"

  if (loading) {
    return (
      <>
        <SEO titleEn="About" titleAr="عننا" descEn="Learn about Setup Studio — a full-service production studio in Alexandria, Egypt." descAr="تعرف على سيت أب ستوديو — استوديو إنتاج متكامل الخدمات في الإسكندرية." path="/about" />
        <div className="flex items-center justify-center min-h-screen bg-[#0A1216]">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      </>
    )
  }

  return (
    <>
      <SEO titleEn="About" titleAr="عننا" descEn="Learn about Setup Studio — a full-service production studio in Alexandria, Egypt." descAr="تعرف على سيت أب ستوديو — استوديو إنتاج متكامل الخدمات في الإسكندرية." path="/about" />
      <div className="page-enter">
      <section className="w-full bg-[#0A1216] py-[clamp(3rem,8vw,5.5rem)] overflow-hidden relative">
        <div className="absolute -top-[clamp(8rem,15vw,12rem)] -right-[clamp(4rem,8vw,6rem)] w-[clamp(16rem,40vw,30rem)] h-[clamp(16rem,40vw,30rem)] rounded-full bg-[#11AFFF] opacity-[0.25] blur-[clamp(4rem,8vw,6rem)] pointer-events-none" />
        <div className="absolute -bottom-[clamp(6rem,12vw,10rem)] -left-[clamp(2rem,4vw,4rem)] w-[clamp(12rem,30vw,22rem)] h-[clamp(12rem,30vw,22rem)] rounded-full bg-[#11AFFF] opacity-[0.18] blur-[clamp(4rem,8vw,6rem)] pointer-events-none" />
        <div className="absolute top-[clamp(2rem,5vw,4rem)] right-[clamp(10%,20%,30%)] w-[clamp(8rem,20vw,16rem)] h-[clamp(8rem,20vw,16rem)] rounded-full bg-[#11AFFF] opacity-[0.12] blur-[clamp(2rem,4vw,3rem)] pointer-events-none" />
        <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)] relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(2rem,4vw,4rem)] items-center">
            <Reveal>
              <div className={`flex flex-col items-center text-center ${lang === 'ar' ? 'lg:items-start lg:text-right' : 'lg:items-start lg:text-left'}`}>
                <div className="flex items-center w-full mb-4 lg:justify-start justify-center">
                  <div className="flex items-center min-w-0 shrink">
                    <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                      <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                    </svg>
                    <span className="block w-[clamp(1.5rem,12vw,16rem)] h-[2px] bg-red" />
                  </div>
                  <h1 className={`text-white font-bold text-[clamp(1.3rem,4.5vw,3.5rem)] leading-tight m-0 px-[clamp(0.4rem,2vw,1.5rem)] whitespace-nowrap ${lang === 'ar' ? 'text-right' : ''}`}>
                    {p("hero_heading") || t("About Setup", "عن سيت أب", lang)}
                  </h1>
                  <div className="flex items-center min-w-0 shrink">
                    <span className="block w-[clamp(1.5rem,12vw,16rem)] h-[2px] bg-red" />
                    <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                      <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                    </svg>
                  </div>
                </div>
                <p className={`text-white/70 font-semibold text-[clamp(1rem,2vw,1.35rem)] mb-3 leading-snug tracking-wide w-full ${lang === 'ar' ? 'text-right' : ''}`}>
                  {p("hero_subtitle") || t("Full-Service Production Studio", "استوديو إنتاج متكامل الخدمات", lang)}
                </p>
                <p className={`text-white/60 text-[clamp(0.85rem,1.2vw,1.05rem)] max-w-[540px] leading-relaxed m-0 w-full ${lang === 'ar' ? 'text-right' : ''}`}>
                  {p("hero_description") || t("Setup is a premium production studio offering exclusive spaces for photography, filmmaking, podcasting, and creative productions.", "سيت أب هو استوديو إنتاج متميز يقدم مساحات حصرية للتصوير الفوتوغرافي وصناعة الأفلام والبودكاست والإنتاج الإبداعي.", lang)}
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.2} className="hidden lg:block">
              <div className="relative">
                <div className="rounded-[clamp(1.5rem,3vw,3rem)] overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.3)]">
                  <img
                    src={optimizeImageUrl(heroPhoto, 800)}
                    alt="Setup Studio production"
                    className="w-full h-[clamp(16rem,28vw,22rem)] object-cover"
                  />
                </div>
                <div className="absolute -bottom-3 -right-3 w-24 h-24 rounded-2xl bg-red/20 -z-10" />
                <div className="absolute -top-3 -left-3 w-16 h-16 rounded-2xl bg-white/10 -z-10" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="w-full bg-[#f8f9fb] dark:bg-[#15202b] py-[clamp(2rem,5vw,5rem)] overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <SectionHeader
            label={t("Our Story", "قصتنا", lang)}
            title={t("Our Story", "قصتنا", lang)}
            subtitle={t("From a single room to 15+ premium locations.", "من غرفة واحدة إلى أكثر من 15 موقعاً متميزاً.", lang)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(2rem,4vw,4rem)] items-center">
            <Reveal>
              <div className="rounded-[clamp(1.25rem,2.5vw,2.5rem)] overflow-hidden shadow-[0_8px_32px_rgba(48,93,116,0.1)]">
                <img
                  src={optimizeImageUrl(storyPhoto, 800)}
                  alt="Setup Studio interior"
                  className="w-full aspect-[4/3] object-cover"
                  loading="lazy"
                />
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              {storyParagraphs.map((para, i) => (
                <p key={i} className={`text-navy/70 dark:text-white/70 text-[clamp(0.85rem,1.2vw,1.05rem)] leading-[1.8] mb-5 m-0 ${lang === 'ar' ? 'text-right' : ''}`}>
                  {para}
                </p>
              ))}
              {p("story_quote") && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-[#0f1a24] border border-border dark:border-[#1e2d3d]">
                  <i className={`fa-solid ${lang === 'ar' ? 'fa-quote-right' : 'fa-quote-left'} text-red text-xl shrink-0`} />
                  <p className={`text-navy/60 dark:text-white/60 text-[clamp(0.8rem,1.1vw,0.9rem)] italic m-0 ${lang === 'ar' ? 'text-right' : ''}`}>
                    {p("story_quote")}
                  </p>
                </div>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      <section className="w-full bg-white dark:bg-[#0A1216] py-[clamp(2rem,5vw,5rem)] overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <SectionHeader
            label={t("What We Offer", "ماذا نقدم", lang)}
            title={t("Full-Service Production", "إنتاج متكامل الخدمات", lang)}
            subtitle={t("From location rental to final delivery — we handle every stage of your production.", "من تأجير المواقع إلى التسليم النهائي - ندير كل مرحلة من مراحل إنتاجك.", lang)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[clamp(1rem,2vw,1.5rem)]">
            {services.map((item, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className="flex items-start gap-4 p-[clamp(1.25rem,2vw,1.75rem)] rounded-2xl border border-border dark:border-[#1e2d3d] bg-white dark:bg-[#0f1a24] hover:shadow-[0_8px_32px_rgba(48,93,116,0.1)] hover:border-navy/20 dark:hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5">
                  <div className="w-[clamp(2.5rem,3.5vw,3.5rem)] h-[clamp(2.5rem,3.5vw,3.5rem)] rounded-xl bg-navy/5 dark:bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-navy transition-colors duration-300">
                    <i className={`${item.icon} text-navy dark:text-white/80 text-[clamp(1rem,1.5vw,1.35rem)]`} />
                  </div>
                  <div>
                    <h3 className="text-navy dark:text-white font-bold text-[clamp(0.95rem,1.5vw,1.15rem)] m-0 mb-1.5">
                      {t(item.title_en, item.title_ar, lang)}
                    </h3>
                    <p className={`text-navy/60 dark:text-white/50 text-[clamp(0.8rem,1.1vw,0.9rem)] leading-relaxed m-0 ${lang === 'ar' ? 'text-right' : ''}`}>
                      {t(item.desc_en, item.desc_ar, lang)}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-[#f8f9fb] dark:bg-[#15202b] py-[clamp(2rem,5vw,5rem)] overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <SectionHeader
            label={t("Why Choose Us", "لماذا تختارنا", lang)}
            title={t("What Sets Us Apart", "ما يميزنا", lang)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[clamp(1rem,2.5vw,1.5rem)]">
            {values.map((v, i) => (
              <Reveal key={v.title_en || i} delay={i * 0.08}>
                <div className="flex flex-col items-center text-center gap-4 p-[clamp(1.25rem,2.5vw,2rem)] rounded-2xl border border-border dark:border-[#1e2d3d] bg-white dark:bg-[#0f1a24] hover:shadow-[0_8px_32px_rgba(48,93,116,0.1)] hover:border-navy/20 dark:hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5">
                  <div className="w-12 h-12 rounded-xl bg-navy/5 dark:bg-white/10 flex items-center justify-center">
                    <i className={`${v.icon} text-navy dark:text-white/80 text-lg`} />
                  </div>
                  <h3 className="text-navy dark:text-white font-semibold text-[clamp(0.9rem,1.5vw,1rem)] m-0">
                    {t(v.title_en, v.title_ar, lang)}
                  </h3>
                  <p className={`text-navy/60 dark:text-white/50 text-[clamp(0.8rem,1.3vw,0.875rem)] leading-relaxed m-0 ${lang === 'ar' ? 'text-right' : ''}`}>
                    {t(v.desc_en, v.desc_ar, lang)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full py-[clamp(2rem,5vw,4rem)] px-[clamp(1rem,4vw,3rem)] bg-white dark:bg-[#0A1216]">
        <div className="max-w-[1280px] mx-auto">
          <Reveal>
            <div className="relative overflow-hidden rounded-[clamp(1.25rem,2.5vw,2.5rem)] bg-[#0A1216] min-h-[clamp(10rem,16vw,16rem)] flex items-center">
              <div className="absolute -top-[clamp(8rem,15vw,12rem)] ltr:-right-[clamp(4rem,8vw,6rem)] rtl:-left-[clamp(4rem,8vw,6rem)] w-[clamp(16rem,40vw,30rem)] h-[clamp(16rem,40vw,30rem)] rounded-full bg-[#11AFFF] opacity-[0.35] blur-[clamp(3rem,6vw,4rem)] pointer-events-none" />
              <div className="absolute -bottom-[clamp(6rem,12vw,10rem)] ltr:-left-[clamp(2rem,4vw,4rem)] rtl:-right-[clamp(2rem,4vw,4rem)] w-[clamp(12rem,30vw,22rem)] h-[clamp(12rem,30vw,22rem)] rounded-full bg-[#11AFFF] opacity-[0.30] blur-[clamp(3rem,6vw,4rem)] pointer-events-none" />
              <div className="absolute top-[clamp(1rem,3vw,2rem)] ltr:left-[clamp(20%,35%,40%)] rtl:right-[clamp(20%,35%,40%)] w-[clamp(6rem,15vw,12rem)] h-[clamp(6rem,15vw,12rem)] rounded-full bg-[#11AFFF] opacity-[0.20] blur-[clamp(2rem,4vw,3rem)] pointer-events-none" />
              <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-[clamp(1.25rem,3vw,2.5rem)] px-[clamp(1.5rem,4vw,3.5rem)] py-[clamp(1.5rem,3vw,2.5rem)]">
                <div className={`text-center ${lang === 'ar' ? 'md:text-right' : 'md:text-left'}`}>
                  <h2 className="text-white font-bold text-[clamp(1.3rem,3vw,2.2rem)] m-0 leading-tight text-center">
                    {t("Your Next Scene", "مشهدك القادم", lang)}<br />
                    {t("Starts", "يبدأ", lang)} <span className="text-[#11AFFF]">{t("Here.", "هنا", lang)}</span>
                  </h2>
                  <p className={`text-white/50 text-[clamp(0.8rem,1.3vw,1rem)] mt-2 m-0 max-w-[36rem] leading-relaxed ${lang === 'ar' ? 'text-right' : ''}`}>
                    {t("Contact our team to book the perfect location for your production.", "تواصل مع فريقنا لحجز الموقع المثالي لإنتاجك.", lang)}
                  </p>
                </div>
                <div className="flex items-center gap-[clamp(0.6rem,1.5vw,1rem)] shrink-0">
                  <a href="/#contact" className="inline-flex items-center gap-2 bg-white text-[#0A1216] font-semibold text-[clamp(0.85rem,1.2vw,1rem)] px-[clamp(1.25rem,2.5vw,2rem)] py-[clamp(0.6rem,1.2vw,1rem)] rounded-full hover:bg-white/90 transition-all duration-300 shadow-lg">
                    {t("Get Quote", "احصل على عرض", lang)}
                  </a>
                  <Link to="/locations" className="inline-flex items-center gap-2 border-2 border-white text-white font-semibold text-[clamp(0.85rem,1.2vw,1rem)] px-[clamp(1.25rem,2.5vw,2rem)] py-[clamp(0.6rem,1.2vw,1rem)] rounded-full hover:bg-white/10 transition-all duration-300">
                    {t("View Studios", "شاهد الاستوديوهات", lang)}
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
    </>
  )
}

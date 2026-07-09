import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import SEO from "../components/SEO"
import Reveal from "../components/ui/Reveal"
import Button from "../components/ui/Button"
import { fetchCoverPhoto, fetchAllPhotos } from "../lib/photos"
import { optimizeImageUrl } from "../lib/images"
import { useTranslation } from "../context/LanguageContext"

const t = (en, ar, lang) => lang === "ar" ? ar : en

const slugs = ["podcast", "reels", "office", "samples"]
const titles = {
  podcast: { en: "Podcast", ar: "بودكاست" },
  reels: { en: "Reels", ar: "ريلز" },
  office: { en: "Office", ar: "مكتب" },
  samples: { en: "Samples", ar: "عينات" },
}

export default function LocationsPage() {
  const { lang } = useTranslation()
  const [covers, setCovers] = useState({})
  const [counts, setCounts] = useState({})

  useEffect(() => {
    Promise.all([
      fetchAllPhotos().catch(() => []),
      ...slugs.map((slug) =>
        fetchCoverPhoto(slug)
          .then((photo) => ({ slug, url: photo?.cloudinary_url || "" }))
          .catch(() => ({ slug, url: "" }))
      ),
    ]).then(([all, ...results]) => {
      const map = {}
      results.forEach(({ slug, url }) => { map[slug] = url })
      slugs.forEach((slug) => {
        if (!map[slug]) {
          const first = all.find((p) => p.category === slug)
          if (first) map[slug] = first.cloudinary_url
        }
      })
      setCovers(map)
      const c = {}
      slugs.forEach((slug) => { c[slug] = all.filter((p) => p.category === slug).length })
      setCounts(c)
    }).catch(console.error)
  }, [])

  return (
    <>
      <SEO titleEn="Locations" titleAr="المواقع" descEn="Explore our studio spaces in Alexandria for photography, videography, and creative productions." descAr="استكشف مساحات الاستوديو الخاصة بنا في الإسكندرية للتصوير الفوتوغرافي وصناعة الفيديو والإنتاج الإبداعي." path="/locations" />
      <div className="page-enter">
      <section className="w-full bg-white dark:bg-[#0A1216] py-[clamp(2rem,5vw,5rem)] overflow-hidden">
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
                <h1 className="text-navy dark:text-white text-[clamp(1.3rem,4.5vw,3.5rem)] font-bold leading-tight m-0 px-[clamp(0.4rem,2vw,1.5rem)] whitespace-nowrap">
                  {t("Our Spaces", "مساحاتنا", lang)}
                </h1>
                <div className="flex items-center min-w-0 shrink">
                  <span className="block w-[clamp(1.5rem,12vw,16rem)] h-[2px] bg-red" />
                  <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                    <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                  </svg>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-navy dark:text-white/80 font-medium text-[clamp(0.7rem,1.1vw,0.95rem)] mt-2 max-w-[36rem] mx-auto leading-relaxed tracking-wide">
                {t("Choose locations, explore the details, start creating", "اختر المواقع، اكتشف التفاصيل، ابدأ الإبداع", lang)}
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(0.75rem,2vw,1.875rem)]">
            {slugs.map((slug, i) => {
              const cover = covers[slug]
              return (
                <Reveal key={slug} delay={0.1 + i * 0.08}>
                  <Link
                    to={`/locations/${slug}`}
                    className="group relative rounded-[clamp(1.5rem,4vw,4.75rem)] overflow-hidden bg-gray-100 dark:bg-[#15202b] shadow-[0_4px_24px_rgba(48,93,116,0.08)] transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(48,93,116,0.16)] block no-underline"
                  >
                    {cover ? (
                      <img
                        src={optimizeImageUrl(cover, 800)}
                        alt={t(titles[slug].en, titles[slug].ar, lang)}
                        className="w-full aspect-square object-cover block"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-gray-100 dark:bg-[#15202b] flex items-center justify-center">
                        <i className="fa-solid fa-image text-gray-300 dark:text-white/20 text-4xl" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-400/60 via-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <div className="absolute bottom-0 ltr:left-[clamp(0.5rem,6vw,5.25rem)] rtl:right-[clamp(0.5rem,6vw,5.25rem)] ltr:right-[clamp(0.5rem,6vw,5.25rem)] rtl:left-[clamp(0.5rem,6vw,5.25rem)] bg-white dark:bg-[#0f1a24] ltr:rounded-t-[clamp(0.85rem,2.5vw,3rem)] rtl:rounded-t-[clamp(0.85rem,2.5vw,3rem)] px-[clamp(0.75rem,2vw,2rem)] py-[clamp(0.5rem,1.2vw,1rem)] flex items-center justify-between gap-3 shadow-[0_-1px_8px_rgba(48,93,116,0.06)]">
                      <div className="flex flex-col">
                        <h3 className="text-navy dark:text-white font-bold text-[clamp(1.1rem,2.2vw,1.85rem)] m-0 tracking-tight">
                          {t(titles[slug].en, titles[slug].ar, lang)}
                        </h3>
                        {counts[slug] !== undefined && (
                          <span className="text-navy/50 dark:text-white/40 font-medium text-[clamp(0.55rem,0.85vw,0.75rem)] mt-0.5">
                            {counts[slug]} {t("photos", "صورة", lang)}
                          </span>
                        )}
                      </div>
                      <span className="block w-[3px] self-stretch bg-navy dark:bg-white/30 rounded-sm shrink-0" />
                      <Button
                        variant="navy"
                        size="sm"
                        className="text-[clamp(0.55rem,0.9vw,0.8rem)] px-[clamp(0.6rem,1.2vw,1.5rem)] py-[clamp(0.3rem,0.6vw,0.625rem)] pointer-events-none"
                      >
                        {t("See All Locations", "عرض الكل", lang)}
                      </Button>
                    </div>
                  </Link>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>
    </div>
    </>
  )
}
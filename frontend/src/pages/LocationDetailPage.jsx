import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import SEO from "../components/SEO"
import Reveal from "../components/ui/Reveal"
import Button from "../components/ui/Button"
import { fetchPhotos } from "../lib/photos"
import { optimizeImageUrl } from "../lib/images"
import NotFoundPage from "./NotFoundPage"
import { useTranslation } from "../context/LanguageContext"

const t = (en, ar, lang) => lang === "ar" ? ar : en

const categoryTitles = {
  podcast: { en: "Podcast", ar: "بودكاست" },
  reels: { en: "Reels", ar: "ريلز" },
  office: { en: "Office", ar: "مكتب" },
  samples: { en: "Samples", ar: "نماذج" },
}

export default function LocationDetailPage() {
  const { lang } = useTranslation()
  const { category } = useParams()
  const navigate = useNavigate()
  const [lightbox, setLightbox] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  if (!category || !Object.keys(categoryTitles).includes(category)) {
    return <NotFoundPage />
  }

  useEffect(() => {
    setLoading(true)
    fetchPhotos(category)
      .then(setPhotos)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [category])

  const cat = categoryTitles[category]
  const title = t(cat.en, cat.ar, lang)

  if (lightbox) {
    return (
      <>
        <SEO titleEn={title} titleAr={title} descEn={`Explore ${title} at Setup Studio — professional photography and videography spaces.`} descAr={`استكشف ${title} في سيت أب ستوديو — مساحات تصوير احترافية.`} path={`/locations/${category}`} />
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          <button onClick={() => setLightbox(null)}
            className="absolute top-4 ltr:right-4 rtl:left-4 z-10 text-white/70 hover:text-white text-2xl bg-transparent border-0 cursor-pointer p-2"
          >
            <i className="fa-solid fa-xmark" />
          </button>
          <img src={lightbox} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg cursor-default"
            onClick={(e) => e.stopPropagation()} />
        </div>
      </>
    )
  }

  return (
    <>
      <SEO titleEn={title} titleAr={title} descEn={`Explore ${title} at Setup Studio — professional photography and videography spaces.`} descAr={`استكشف ${title} في سيت أب ستوديو — مساحات تصوير احترافية.`} path={`/locations/${category}`} />
      <div className="page-enter">
        <section className="w-full bg-[#0A1216] py-[clamp(2rem,5vw,4rem)] overflow-hidden relative">
          <div className="absolute -top-[clamp(8rem,15vw,12rem)] -right-[clamp(4rem,8vw,6rem)] w-[clamp(16rem,40vw,30rem)] h-[clamp(16rem,40vw,30rem)] rounded-full bg-[#11AFFF] opacity-[0.25] blur-[clamp(4rem,8vw,6rem)] pointer-events-none" />
          <div className="absolute -bottom-[clamp(6rem,12vw,10rem)] -left-[clamp(2rem,4vw,4rem)] w-[clamp(12rem,30vw,22rem)] h-[clamp(12rem,30vw,22rem)] rounded-full bg-[#11AFFF] opacity-[0.18] blur-[clamp(4rem,8vw,6rem)] pointer-events-none" />
          <div className="absolute top-[clamp(2rem,5vw,4rem)] right-[clamp(10%,20%,30%)] w-[clamp(8rem,20vw,16rem)] h-[clamp(8rem,20vw,16rem)] rounded-full bg-[#11AFFF] opacity-[0.12] blur-[clamp(2rem,4vw,3rem)] pointer-events-none" />
          <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)] relative z-10">
            <Reveal>
              <div className="flex items-center w-full mb-4 justify-center">
                <div className="flex items-center min-w-0 shrink">
                  <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                    <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                  </svg>
                  <span className="block w-[clamp(1.5rem,12vw,16rem)] h-[2px] bg-red" />
                </div>
                <h1 className="text-white text-[clamp(1.3rem,4.5vw,3.5rem)] font-bold leading-tight m-0 px-[clamp(0.4rem,2vw,1.5rem)] whitespace-nowrap">{title}</h1>
                <div className="flex items-center min-w-0 shrink">
                  <span className="block w-[clamp(1.5rem,12vw,16rem)] h-[2px] bg-red" />
                  <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                    <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                  </svg>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex justify-center">
                <Button variant="navy" size="md" onClick={() => navigate("/locations")} className="text-[clamp(0.8rem,1.1vw,0.95rem)]">
                  <i className="fa-solid fa-arrow-left" />
                  {t("All Spaces", "كل المساحات", lang)}
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="w-full bg-white dark:bg-[#0A1216] py-[clamp(2rem,5vw,5rem)] overflow-hidden">
          <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)]">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-navy/20 dark:border-white/20 border-t-navy dark:border-t-white rounded-full animate-spin" />
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted dark:text-white/50 text-sm">{t("No photos yet in this category.", "لا توجد صور بعد في هذه الفئة.", lang)}</p>
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-[clamp(0.75rem,2vw,1.5rem)] w-full [column-fill:_balance]">
                {photos.map((photo, i) => (
                  <div key={photo.id} className="break-inside-avoid inline-block w-full mb-[clamp(0.75rem,2vw,1.5rem)]">
                    <Reveal delay={i * 0.06}>
                      <button onClick={() => setLightbox(optimizeImageUrl(photo.cloudinary_url))}
                        className="group relative w-full rounded-[clamp(1rem,2vw,2rem)] overflow-hidden shadow-[0_4px_24px_rgba(48,93,116,0.08)] hover:shadow-[0_8px_32px_rgba(48,93,116,0.16)] transition-shadow duration-300 border-0 cursor-pointer p-0 bg-transparent"
                      >
                        <img src={optimizeImageUrl(photo.cloudinary_url, 800)} alt={photo.alt || ""} className="w-full h-auto block" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-400/80 via-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end ltr:items-start rtl:items-end p-[clamp(0.75rem,2vw,1.5rem)] pointer-events-none">
                          {(photo.title || photo.description) && (
                            <>
                              <div className="flex items-center gap-2 mb-1.5">
                                <svg className="w-[clamp(0.35rem,0.6vw,0.5rem)] h-[clamp(0.35rem,0.6vw,0.5rem)] text-white/70 shrink-0" viewBox="0 0 13 13" fill="currentColor">
                                  <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                                </svg>
                                <span className="text-white text-[clamp(0.75rem,1.2vw,0.85rem)] font-bold">{photo.title}</span>
                              </div>
                              <p className="text-white/80 text-[clamp(0.65rem,1vw,0.75rem)] leading-relaxed m-0">{photo.description}</p>
                            </>
                          )}
                        </div>
                      </button>
                    </Reveal>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
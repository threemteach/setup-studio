import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Reveal from "../components/ui/Reveal"
import Button from "../components/ui/Button"
import { fetchPhotos, fetchAllPhotos, fetchCoverPhoto } from "../lib/photos"
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

export default function LocationsPage() {
  const { lang } = useTranslation()
  const { category } = useParams()
  const navigate = useNavigate()
  const [lightbox, setLightbox] = useState(null)
  const [photos, setPhotos] = useState([])
  const [allPhotos, setAllPhotos] = useState([])
  const [coverPhotos, setCoverPhotos] = useState({})
  const [loading, setLoading] = useState(true)

  const validCategories = Object.keys(categoryTitles)
  if (category && !validCategories.includes(category)) {
    return <NotFoundPage />
  }

  useEffect(() => {
    if (category) {
      setLoading(true)
      fetchPhotos(category)
        .then(setPhotos)
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      setLoading(true)
      Promise.all([
        fetchAllPhotos().catch(() => []),
        ...Object.keys(categoryTitles).map((slug) =>
          fetchCoverPhoto(slug)
            .then((photo) => ({ slug, url: photo?.cloudinary_url || "" }))
            .catch(() => ({ slug, url: "" }))
        ),
      ]).then(([all, ...covers]) => {
        setAllPhotos(all)
        const map = {}
        covers.forEach(({ slug, url }) => { map[slug] = url })
        setCoverPhotos(map)
      }).catch(console.error)
      .finally(() => setLoading(false))
    }
  }, [category])

  const getCategoryCover = (slug) => {
    return optimizeImageUrl(coverPhotos[slug] || allPhotos.find((p) => p.category === slug)?.cloudinary_url || "", 800)
  }

  const getCategoryCount = (slug) => {
    return allPhotos.filter((p) => p.category === slug).length
  }

  if (lightbox) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-pointer"
        onClick={() => setLightbox(null)}
      >
        <button
          onClick={() => setLightbox(null)}
          className="absolute top-4 ltr:right-4 rtl:left-4 z-10 text-white/70 hover:text-white text-2xl bg-transparent border-0 cursor-pointer p-2"
        >
          <i className="fa-solid fa-xmark" />
        </button>
        <img
          src={lightbox}
          alt=""
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg cursor-default"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )
  }

  /* ─── Category detail ─── */
  if (category) {
    const cat = categoryTitles[category]
    const title = cat ? t(cat.en, cat.ar, lang) : category
    return (
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
                <h1 className="text-white text-[clamp(1.3rem,4.5vw,3.5rem)] font-bold leading-tight m-0 px-[clamp(0.4rem,2vw,1.5rem)] whitespace-nowrap">
                  {title}
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
              <div className="flex justify-center">
                <Button
                  variant="navy"
                  size="md"
                  onClick={() => navigate("/locations")}
                  className="text-[clamp(0.8rem,1.1vw,0.95rem)]"
                >
                  <i className="fa-solid fa-arrow-left" />
                  {t("All Spaces", "كل المساحات", lang)}
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="w-full bg-white py-[clamp(2rem,5vw,5rem)] overflow-hidden">
          <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)]">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted text-sm">{t("No photos yet in this category.", "لا توجد صور بعد في هذه الفئة.", lang)}</p>
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-[clamp(0.75rem,2vw,1.5rem)] w-full [column-fill:_balance]">
                {photos.map((photo, i) => (
                  <div
                    key={photo.id}
                    className="break-inside-avoid inline-block w-full mb-[clamp(0.75rem,2vw,1.5rem)]"
                  >
                    <Reveal delay={i * 0.06}>
                      <button
                        onClick={() => setLightbox(photo.cloudinary_url)}
                        className="group relative w-full rounded-[clamp(1rem,2vw,2rem)] overflow-hidden shadow-[0_4px_24px_rgba(48,93,116,0.08)] hover:shadow-[0_8px_32px_rgba(48,93,116,0.16)] transition-shadow duration-300 border-0 cursor-pointer p-0 bg-transparent"
                      >
                        <img
                          src={optimizeImageUrl(photo.cloudinary_url, 600)}
                          alt={photo.alt || ""}
                          className="w-full h-auto block"
                          loading="lazy"
                        />

                        {/* Hover details overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-400/80 via-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end ltr:items-start rtl:items-end p-[clamp(0.75rem,2vw,1.5rem)] pointer-events-none">
                          {(photo.title || photo.description) && (
                            <>
                              <div className="flex items-center gap-2 mb-1.5">
                                <svg className="w-[clamp(0.35rem,0.6vw,0.5rem)] h-[clamp(0.35rem,0.6vw,0.5rem)] text-white/70 shrink-0" viewBox="0 0 13 13" fill="currentColor">
                                  <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                                </svg>
                                <span className="block w-[clamp(1rem,6vw,3rem)] h-[1.5px] bg-white/50" />
                              </div>
                              {photo.title && (
                                <p className="text-white font-bold text-[clamp(0.9rem,1.4vw,1.15rem)] leading-tight m-0">
                                  {photo.title}
                                </p>
                              )}
                              {photo.description && (
                                <p className="text-white/70 text-[clamp(0.75rem,1vw,0.85rem)] mt-1 leading-relaxed line-clamp-2 m-0">
                                  {photo.description}
                                </p>
                              )}
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
    )
  }

  /* ─── Categories grid ─── */
  return (
    <div className="page-enter">
      {allPhotos.length > 0 && (
        <style>{`
          @keyframes growWidth {
            from { width: 0; }
          }
          .category-cover-anim { animation: growWidth 0.6s ease-out forwards; }
        `}</style>
      )}
      <section className="w-full bg-[#0A1216] py-[clamp(3rem,8vw,5.5rem)] overflow-hidden relative">
        <div className="absolute -top-[clamp(8rem,15vw,12rem)] -right-[clamp(4rem,8vw,6rem)] w-[clamp(16rem,40vw,30rem)] h-[clamp(16rem,40vw,30rem)] rounded-full bg-[#11AFFF] opacity-[0.25] blur-[clamp(4rem,8vw,6rem)] pointer-events-none" />
        <div className="absolute -bottom-[clamp(6rem,12vw,10rem)] -left-[clamp(2rem,4vw,4rem)] w-[clamp(12rem,30vw,22rem)] h-[clamp(12rem,30vw,22rem)] rounded-full bg-[#11AFFF] opacity-[0.18] blur-[clamp(4rem,8vw,6rem)] pointer-events-none" />
        <div className="absolute top-[clamp(2rem,5vw,4rem)] right-[clamp(10%,20%,30%)] w-[clamp(8rem,20vw,16rem)] h-[clamp(8rem,20vw,16rem)] rounded-full bg-[#11AFFF] opacity-[0.12] blur-[clamp(2rem,4vw,3rem)] pointer-events-none" />
        <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)] relative z-10">
          <div className="flex flex-col items-center text-center">
            <Reveal>
              <div className="flex items-center justify-center w-full mb-4">
                <div className="flex items-center min-w-0 shrink">
                  <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                    <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                  </svg>
                  <span className="block w-[clamp(1.5rem,12vw,16rem)] h-[2px] bg-red" />
                </div>
                <h1 className="text-white text-[clamp(1.3rem,4.5vw,3.5rem)] font-bold leading-tight m-0 px-[clamp(0.4rem,2vw,1.5rem)] whitespace-nowrap">
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
              <p className={`text-white/60 text-[clamp(0.85rem,1.2vw,1.05rem)] max-w-[600px] leading-relaxed m-0 ${lang === 'ar' ? 'text-right' : ''}`}>
                {t("Browse our curated collection of premium locations. Each space is professionally designed and maintained for your creative production.", "تصفح مجموعتنا المختارة من المواقع المتميزة. كل مساحة مصممة وصيانة بشكل احترافي لإنتاجك الإبداعي.", lang)}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-[clamp(2rem,5vw,5rem)] overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
            </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(0.75rem,2vw,1.875rem)]">
                {Object.entries(categoryTitles).map(([slug, cat], i) => {
                  const title = t(cat.en, cat.ar, lang)
                  const cover = getCategoryCover(slug)
                  const count = getCategoryCount(slug)
                return (
                  <Reveal key={slug} delay={0.1 + i * 0.08}>
                    <button
                      onClick={() => navigate(`/locations/${slug}`)}
                      className="group relative rounded-[clamp(1.5rem,4vw,4.75rem)] overflow-hidden bg-gray-100 shadow-[0_4px_24px_rgba(48,93,116,0.08)] transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(48,93,116,0.16)] w-full ltr:text-left rtl:text-right cursor-pointer border-0 p-0"
                    >
                      {cover ? (
                        <img
                          src={cover}
                          alt={title}
                          className="w-full aspect-square object-cover block"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                          <i className="fa-solid fa-image text-gray-300 text-4xl" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-400/60 via-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      <div className="absolute bottom-0 ltr:left-[clamp(0.5rem,6vw,5.25rem)] rtl:right-[clamp(0.5rem,6vw,5.25rem)] ltr:right-[clamp(0.5rem,6vw,5.25rem)] rtl:left-[clamp(0.5rem,6vw,5.25rem)] bg-white ltr:rounded-t-[clamp(0.85rem,2.5vw,3rem)] rtl:rounded-t-[clamp(0.85rem,2.5vw,3rem)] px-[clamp(0.75rem,2vw,2rem)] py-[clamp(0.5rem,1.2vw,1rem)] flex items-center justify-between gap-3 shadow-[0_-1px_8px_rgba(48,93,116,0.06)]">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-navy font-bold text-[clamp(1.1rem,2.2vw,1.85rem)] m-0 tracking-tight">
                            {title}
                          </h3>
                          <p className="text-muted text-[clamp(0.6rem,0.8vw,0.75rem)] m-0 mt-0.5">
                            {count} {lang === "ar" ? "صورة" : count === 1 ? "photo" : "photos"}
                          </p>
                        </div>
                        <span className="block w-[3px] self-stretch bg-navy rounded-sm shrink-0" />
                        <Button
                          variant="navy"
                          size="sm"
                          className="text-[clamp(0.55rem,0.9vw,0.8rem)] px-[clamp(0.6rem,1.2vw,1.5rem)] py-[clamp(0.3rem,0.6vw,0.625rem)]"
                        >
                          {t("See All Locations", "عرض الكل", lang)}
                        </Button>
                      </div>
                    </button>
                  </Reveal>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

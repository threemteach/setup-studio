import { useState, useEffect, useRef } from "react"
import Reveal from "../components/ui/Reveal"
import Masonry from "react-masonry-css"
import { useTranslation } from "../context/LanguageContext"
import { fetchPortfolioContent, fetchPortfolioVideos } from "../lib/portfolio"

const t = (en, ar, lang) => lang === "ar" ? ar : en

export default function PortfolioPage() {
  const { lang } = useTranslation()
  const [cmsData, setCmsData] = useState(null)
  const [videosByCategory, setVideosByCategory] = useState({})
  const [activeVideo, setActiveVideo] = useState(null)
  const [activeCategory, setActiveCategory] = useState("")
  const videoRef = useRef(null)

  useEffect(() => {
    const el = videoRef.current
    if (!activeVideo || !el) return
    const onExit = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) setActiveVideo(null)
    }
    el.addEventListener("fullscreenchange", onExit)
    el.addEventListener("webkitfullscreenchange", onExit)
    el.requestFullscreen?.()?.catch(() => {})
    return () => {
      el.removeEventListener("fullscreenchange", onExit)
      el.removeEventListener("webkitfullscreenchange", onExit)
    }
  }, [activeVideo])

  useEffect(() => {
    fetchPortfolioContent().then(async (data) => {
      setCmsData(data)
      const cats = data?.categories || []
      if (cats.length > 0) {
        setActiveCategory(cats[0].slug)
        const all = {}
        for (const cat of cats) {
          const vids = await fetchPortfolioVideos(cat.slug).catch(() => [])
          all[cat.slug] = vids
        }
        setVideosByCategory(all)
      }
    }).catch(() => {})
  }, [])

  const cms = (field) => cmsData?.[`${field}_${lang}`] || cmsData?.[`${field}_en`] || ""
  const categories = cmsData?.categories || []

  return (
    <div className="page-enter">
      {/* ═══════════ HERO ═══════════ */}
      <section className="w-full bg-[#0A1216] py-[clamp(3rem,8vw,5.5rem)] overflow-hidden relative">
        <div className="absolute -top-[clamp(8rem,15vw,12rem)] ltr:-right-[clamp(4rem,8vw,6rem)] rtl:-left-[clamp(4rem,8vw,6rem)] w-[clamp(16rem,40vw,30rem)] h-[clamp(16rem,40vw,30rem)] rounded-full bg-[#11AFFF] opacity-[0.25] blur-[clamp(4rem,8vw,6rem)] pointer-events-none" />
        <div className="absolute -bottom-[clamp(6rem,12vw,10rem)] ltr:-left-[clamp(2rem,4vw,4rem)] rtl:-right-[clamp(2rem,4vw,4rem)] w-[clamp(12rem,30vw,22rem)] h-[clamp(12rem,30vw,22rem)] rounded-full bg-[#11AFFF] opacity-[0.18] blur-[clamp(4rem,8vw,6rem)] pointer-events-none" />
        <div className="absolute top-[clamp(2rem,5vw,4rem)] ltr:right-[clamp(10%,20%,30%)] rtl:left-[clamp(10%,20%,30%)] w-[clamp(8rem,20vw,16rem)] h-[clamp(8rem,20vw,16rem)] rounded-full bg-[#11AFFF] opacity-[0.12] blur-[clamp(2rem,4vw,3rem)] pointer-events-none" />
        <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)] relative z-10">
          <Reveal>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center w-full mb-4 justify-center">
                <div className="flex items-center min-w-0 shrink">
                  <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                    <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                  </svg>
                  <span className="block w-[clamp(1.5rem,12vw,16rem)] h-[2px] bg-red" />
                </div>
                <h1 className="text-white font-bold text-[clamp(2rem,5vw,3.25rem)] leading-[1.15] m-0 px-[clamp(0.4rem,2vw,1.5rem)] whitespace-nowrap w-full text-center">
                  {cms("hero_heading") || t("Our Work", "أعمالنا", lang)}
                </h1>
                <div className="flex items-center min-w-0 shrink">
                  <span className="block w-[clamp(1.5rem,12vw,16rem)] h-[2px] bg-red" />
                  <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                    <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                  </svg>
                </div>
              </div>
              <p className="text-white/70 font-semibold text-[clamp(1rem,1.8vw,1.2rem)] max-w-[620px] leading-snug m-0 w-full text-center">
                {cms("hero_subtitle") || t("Explore our video production portfolio across different categories", "تصفح أعمالنا في إنتاج الفيديو عبر مختلف الفئات", lang)}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ CATEGORY TABS ═══════════ */}
      {categories.length > 0 && (
        <section className="w-full bg-white py-8 sticky top-0 z-20 border-b border-border/50">
          <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)]">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((cat) => (
                <button key={cat.slug} onClick={() => setActiveCategory(cat.slug)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all duration-200 ${
                    activeCategory === cat.slug
                      ? "bg-navy text-white shadow-lg shadow-navy/20"
                      : "bg-gray-100 text-navy/60 hover:bg-gray-200 hover:text-navy"
                  }`}>
                  {t(cat.heading_en, cat.heading_ar, lang)}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ VIDEOS GRID ═══════════ */}
      <section className="w-full bg-white pb-[clamp(2rem,5vw,5rem)]">
        <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          {categories.map((cat) => {
            if (activeCategory && activeCategory !== cat.slug) return null
            const vids = videosByCategory[cat.slug] || []
            return (
              <div key={cat.slug}>
                <Reveal>
                  <div className={`flex flex-col mb-8 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                    <h2 className="text-navy font-bold text-[clamp(1.5rem,3vw,2rem)] m-0">
                      {t(cat.heading_en, cat.heading_ar, lang)}
                    </h2>
                    {cat.desc_en && (
                      <p className={`text-muted text-sm mt-2 max-w-[600px] ${lang === 'ar' ? 'text-right' : ''}`}>
                        {t(cat.desc_en, cat.desc_ar, lang)}
                      </p>
                    )}
                  </div>
                </Reveal>

                {vids.length === 0 ? (
                  <p className="text-muted/50 text-sm text-center py-12">{t("No videos yet", "لا توجد فيديوهات بعد", lang)}</p>
                ) : (
                  <Masonry breakpointCols={{ default: 3, 768: 2, 480: 1 }}
                    className="flex -ml-5 w-auto"
                    columnClassName="pl-5 bg-clip-padding">
                    {vids.map((video) => (
                      <Reveal key={video.id}>
                        <div className="group cursor-pointer mb-5" onClick={() => setActiveVideo(video)}>
                          <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-border/50">
                            <div className="relative bg-gray-900">
                              <video src={video.video_url} className="w-full h-auto block" muted playsInline preload="none" poster={video.thumbnail_url || undefined} />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-100 transition-opacity group-hover:bg-black/10">
                                <div className="w-16 h-16 rounded-full bg-red/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-200">
                                  <i className="fa-solid fa-play text-white text-xl ml-1" />
                                </div>
                              </div>
                            </div>
                            <div className={`p-4 ${lang === 'ar' ? 'text-right' : ''}`}>
                              <h3 className="text-navy font-bold text-sm m-0 line-clamp-1">
                                {t(video.title_en, video.title_ar, lang) || t("Untitled", "بدون عنوان", lang)}
                              </h3>
                              {video.description_en && (
                                <p className="text-muted text-xs mt-1.5 m-0 line-clamp-2 leading-relaxed">
                                  {t(video.description_en, video.description_ar, lang)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Reveal>
                    ))}
                  </Masonry>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ═══════════ VIDEO PLAYER MODAL ═══════════ */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black" onClick={() => setActiveVideo(null)}>
          <div className="relative flex-1 min-h-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <video ref={videoRef} src={activeVideo.video_url} controls autoPlay preload="none" className="w-full h-full object-contain" poster={activeVideo.thumbnail_url || undefined} />
            <button onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white border-0 cursor-pointer hover:bg-black/70 transition-colors flex items-center justify-center text-lg z-10">
              <i className="fa-solid fa-xmark" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-6 pt-12 pb-4 pointer-events-none">
              <h3 className="text-white font-bold text-lg m-0">
                {t(activeVideo.title_en, activeVideo.title_ar, lang) || t("Untitled", "بدون عنوان", lang)}
              </h3>
              {(activeVideo.description_en || activeVideo.description_ar) && (
                <p className="text-white/60 text-sm mt-1 m-0">
                  {t(activeVideo.description_en, activeVideo.description_ar, lang)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

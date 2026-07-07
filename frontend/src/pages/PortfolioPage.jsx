import { useState, useEffect } from "react"
import Reveal from "../components/ui/Reveal"
import Masonry from "react-masonry-css"
import { useTranslation } from "../context/LanguageContext"
import { fetchPortfolioContent, fetchPortfolioVideos } from "../lib/portfolio"

const t = (en, ar, lang) => lang === "ar" ? ar : en

export default function PortfolioPage() {
  const { lang } = useTranslation()
  const [cmsData, setCmsData] = useState(null)
  const [videosByCategory, setVideosByCategory] = useState({})
  const [activeCategory, setActiveCategory] = useState("")

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

  function playNative(video) {
    const old = document.getElementById("__native-player")
    if (old) old.remove()

    const el = document.createElement("video")
    el.id = "__native-player"
    el.src = video.video_url
    el.controls = true
    el.playsInline = true
    el.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;object-fit:contain;background:#000;z-index:9999"
    document.body.appendChild(el)

    function onExit() {
      if (document.fullscreenElement || document.webkitFullscreenElement || el.webkitDisplayingFullscreen) return
      el.pause()
      el.remove()
      document.removeEventListener("fullscreenchange", onExit)
      document.removeEventListener("webkitfullscreenchange", onExit)
    }
    document.addEventListener("fullscreenchange", onExit)
    document.addEventListener("webkitfullscreenchange", onExit)

    if (el.webkitEnterFullscreen) {
      el.webkitEnterFullscreen()
    } else {
      const fs = el.requestFullscreen || el.webkitRequestFullscreen
      if (fs) { fs.call(el) }
      el.play().catch(() => {})
    }
  }

  const cms = (field) => cmsData?.[`${field}_${lang}`] || cmsData?.[`${field}_en`] || ""
  const categories = cmsData?.categories || []

  return (
    <div className="page-enter">
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

      {categories.length > 0 && (
        <section className="w-full bg-white dark:bg-[#0f1a24] py-8 sticky top-0 z-20 border-b border-border/50 dark:border-[#1e2d3d]/50">
          <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)]">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((cat) => (
                <button key={cat.slug} onClick={() => setActiveCategory(cat.slug)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all duration-200 ${
                    activeCategory === cat.slug
                      ? "bg-navy text-white shadow-lg shadow-navy/20"
                      : "bg-gray-100 dark:bg-[#1e2d3d] text-navy/60 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-[#2a3d4d] hover:text-navy dark:hover:text-white"
                  }`}>
                  {t(cat.heading_en, cat.heading_ar, lang)}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="w-full bg-white dark:bg-[#0A1216] pb-[clamp(2rem,5vw,5rem)]">
        <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          {categories.map((cat) => {
            if (activeCategory && activeCategory !== cat.slug) return null
            const vids = videosByCategory[cat.slug] || []
            return (
              <div key={cat.slug}>
                <Reveal>
                  <div className={`flex flex-col mb-8 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                    <h2 className="text-navy dark:text-white font-bold text-[clamp(1.5rem,3vw,2rem)] m-0">
                      {t(cat.heading_en, cat.heading_ar, lang)}
                    </h2>
                    {cat.desc_en && (
                      <p className={`text-muted dark:text-white/50 text-sm mt-2 max-w-[600px] ${lang === 'ar' ? 'text-right' : ''}`}>
                        {t(cat.desc_en, cat.desc_ar, lang)}
                      </p>
                    )}
                  </div>
                </Reveal>

                {vids.length === 0 ? (
                  <p className="text-muted/50 dark:text-white/30 text-sm text-center py-12">{t("No videos yet", "لا توجد فيديوهات بعد", lang)}</p>
                ) : (
                  <Masonry breakpointCols={{ default: 3, 768: 2, 480: 1 }}
                    className="flex -ml-5 w-auto"
                    columnClassName="pl-5 bg-clip-padding">
                    {vids.map((video) => (
                      <Reveal key={video.id}>
                        <div className="group mb-5">
                          <div className="bg-white dark:bg-[#0f1a24] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-border/50 dark:border-[#1e2d3d]/50">
                            <div className="relative bg-gray-900 cursor-pointer" onClick={() => playNative(video)}>
                              {video.thumbnail_url ? (
                                <img src={video.thumbnail_url} alt="" className="w-full h-auto block" loading="lazy" />
                              ) : (
                                <video src={video.video_url} className="w-full h-auto block" muted playsInline preload="metadata" />
                              )}
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-100 transition-opacity group-hover:bg-black/10 pointer-events-none">
                                <div className="w-16 h-16 rounded-full bg-red/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-200">
                                  <i className="fa-solid fa-play text-white text-xl ml-1" />
                                </div>
                              </div>
                            </div>
                            <div className={`p-4 ${lang === 'ar' ? 'text-right' : ''}`}>
                              <h3 className="text-navy dark:text-white font-bold text-sm m-0 line-clamp-1">
                                {t(video.title_en, video.title_ar, lang) || t("Untitled", "بدون عنوان", lang)}
                              </h3>
                              {video.description_en && (
                                <p className="text-muted dark:text-white/50 text-xs mt-1.5 m-0 line-clamp-2 leading-relaxed">
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

    </div>
  )
}

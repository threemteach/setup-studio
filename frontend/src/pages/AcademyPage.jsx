import { useState, useEffect, useRef, useCallback } from "react"
import Reveal from "../components/ui/Reveal"
import Masonry from "react-masonry-css"
import { useTranslation } from "../context/LanguageContext"
import { fetchPortfolioContent, fetchPortfolioVideos } from "../lib/portfolio"

const t = (en, ar, lang) => lang === "ar" ? ar : en

/* ─── Video Card — canvas thumbnail (dataURL, no upload), lazy via IntersectionObserver ── */
function VideoCard({ video, lang, onPlay }) {
  const cardRef = useRef(null)
  const [thumb, setThumb] = useState(video.thumbnail_url || null)
  const title = t(video.title_en, video.title_ar, lang) || t("Untitled", "بدون عنوان", lang)

  useEffect(() => {
    if (video.thumbnail_url) return
    const el = cardRef.current
    if (!el) return
    let done = false
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || done) return
      done = true
      observer.disconnect()
      const vid = document.createElement("video")
      vid.crossOrigin = "anonymous"
      vid.preload = "metadata"
      vid.muted = true
      vid.playsInline = true
      vid.onloadeddata = () => { vid.currentTime = 0.001 }
      vid.onseeked = () => {
        requestAnimationFrame(() => {
          try {
            const canvas = document.createElement("canvas")
            canvas.width = vid.videoWidth || 320
            canvas.height = vid.videoHeight || 180
            canvas.getContext("2d").drawImage(vid, 0, 0, canvas.width, canvas.height)
            setThumb(canvas.toDataURL("image/jpeg", 0.75))
          } catch { /* ignore */ }
          vid.remove()
        })
      }
      vid.onerror = () => { vid.remove() }
      vid.src = video.video_url
    }, { rootMargin: "200px" })
    observer.observe(el)
    return () => { observer.disconnect() }
  }, [video.thumbnail_url, video.video_url])

  return (
    <div ref={cardRef} className="group mb-5">
      <div className="bg-white dark:bg-[#0f1a24] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border/50 dark:border-[#1e2d3d]/50">
        <div
          className="relative cursor-pointer select-none"
          onClick={() => onPlay(video)}
        >
          {thumb ? (
            <img src={thumb} alt={title} className="w-full h-auto block" draggable={false} />
          ) : (
            <div className="w-full aspect-video bg-gradient-to-br from-[#0c1e2e] to-[#162840]" />
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-red/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-200">
              <i className="fa-solid fa-play text-white text-lg ml-1" />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className={`p-4 ${lang === "ar" ? "text-right" : ""}`}>
          <h3 className="text-navy dark:text-white font-bold text-sm m-0 line-clamp-1">
            {title}
          </h3>
          {video.description_en && (
            <p className="text-muted dark:text-white/50 text-xs mt-1.5 m-0 line-clamp-2 leading-relaxed">
              {t(video.description_en, video.description_ar, lang)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Fullscreen video player modal ───────────────────────────────────────── */
function VideoModal({ video, onClose }) {
  const videoRef = useRef(null)
  const overlayRef = useRef(null)

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  // Auto-play + request fullscreen when modal opens
  useEffect(() => {
    if (!video) return
    const el = videoRef.current
    if (!el) return

    function tryPlay() {
      el.play().catch(() => {})
    }

    // Request fullscreen: prefer native fullscreen, then webkitEnterFullscreen (iOS)
    function tryFullscreen() {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {})
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen()
      } else if (el.webkitEnterFullscreen) {
        // iOS Safari — must call after canplay
        el.addEventListener("canplay", () => el.webkitEnterFullscreen(), { once: true })
      }
    }

    function onCanPlay() {
      tryPlay()
      tryFullscreen()
    }

    el.addEventListener("canplay", onCanPlay, { once: true })
    el.load()

    return () => {
      el.removeEventListener("canplay", onCanPlay)
    }
  }, [video])

  // Close when fullscreen exits (desktop/Android)
  useEffect(() => {
    function onFSChange() {
      const active =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      if (!active) {
        // Fullscreen exited — pause and close
        videoRef.current?.pause()
        onClose()
      }
    }
    document.addEventListener("fullscreenchange", onFSChange)
    document.addEventListener("webkitfullscreenchange", onFSChange)
    document.addEventListener("mozfullscreenchange", onFSChange)
    document.addEventListener("MSFullscreenChange", onFSChange)
    return () => {
      document.removeEventListener("fullscreenchange", onFSChange)
      document.removeEventListener("webkitfullscreenchange", onFSChange)
      document.removeEventListener("mozfullscreenchange", onFSChange)
      document.removeEventListener("MSFullscreenChange", onFSChange)
    }
  }, [onClose])

  // iOS webkitfullscreenchange on video element
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    function onWebkitEnd() {
      if (!el.webkitDisplayingFullscreen) {
        el.pause()
        onClose()
      }
    }
    el.addEventListener("webkitfullscreenchange", onWebkitEnd)
    return () => el.removeEventListener("webkitfullscreenchange", onWebkitEnd)
  }, [onClose])

  // Keyboard: Escape to close
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        videoRef.current?.pause()
        onClose()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  if (!video) return null

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) {
      videoRef.current?.pause()
      onClose()
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.97)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Close button */}
      <button
        onClick={() => { videoRef.current?.pause(); onClose() }}
        aria-label="Close video"
        style={{
          position: "absolute",
          top: "clamp(12px,3vw,20px)",
          right: "clamp(12px,3vw,20px)",
          zIndex: 10000,
          background: "rgba(255,255,255,0.12)",
          border: "none",
          borderRadius: "50%",
          width: 44,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
          fontSize: 18,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          transition: "background 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
      >
        <i className="fa-solid fa-xmark" />
      </button>

      {/* Video element */}
      <video
        ref={videoRef}
        src={video.video_url}
        controls
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          outline: "none",
          background: "#000",
        }}
      />
    </div>
  )
}

/* ─── Main page ────────────────────────────────────────────────────────────── */
export default function PortfolioPage() {
  const { lang } = useTranslation()
  const [cmsData, setCmsData] = useState(null)
  const [videosByCategory, setVideosByCategory] = useState({})
  const [activeCategory, setActiveCategory] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeVideo, setActiveVideo] = useState(null)

  useEffect(() => {
    fetchPortfolioContent()
      .then(async (data) => {
        setCmsData(data)
        const cats = data?.categories || []
        if (cats.length > 0) {
          setActiveCategory(cats[0].slug)
          // Fetch all categories in parallel for max speed
          const results = await Promise.all(
            cats.map((cat) =>
              fetchPortfolioVideos(cat.slug).catch(() => [])
            )
          )
          const all = {}
          cats.forEach((cat, i) => { all[cat.slug] = results[i] })
          setVideosByCategory(all)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handlePlay = useCallback((video) => {
    setActiveVideo(video)
  }, [])

  const handleClose = useCallback(() => {
    setActiveVideo(null)
  }, [])

  const cms = (field) => cmsData?.[`${field}_${lang}`] || cmsData?.[`${field}_en`] || ""
  const categories = cmsData?.categories || []

  return (
    <div className="page-enter">
      {/* ── Hero ── */}
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

      {/* ── Category tabs ── */}
      {categories.length > 0 && (
        <section className="w-full bg-white dark:bg-[#0f1a24] py-8 sticky top-0 z-20 border-b border-border/50 dark:border-[#1e2d3d]/50">
          <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)]">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all duration-200 ${
                    activeCategory === cat.slug
                      ? "bg-navy text-white shadow-lg shadow-navy/20"
                      : "bg-gray-100 dark:bg-[#1e2d3d] text-navy/60 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-[#2a3d4d] hover:text-navy dark:hover:text-white"
                  }`}
                >
                  {t(cat.heading_en, cat.heading_ar, lang)}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Videos grid ── */}
      <section className="w-full bg-white dark:bg-[#0A1216] pb-[clamp(2rem,5vw,5rem)]">
        <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          {loading ? (
            /* Skeleton loading state */
            <div className="flex gap-5 pt-10">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex-1 rounded-2xl bg-gray-100 dark:bg-[#1a2a38] animate-pulse" style={{ height: 220 }} />
              ))}
            </div>
          ) : (
            categories.map((cat) => {
              if (activeCategory && activeCategory !== cat.slug) return null
              const vids = videosByCategory[cat.slug] || []
              return (
                <div key={cat.slug}>
                  <Reveal>
                    <div className={`flex flex-col mb-8 pt-8 ${lang === "ar" ? "text-right" : "text-left"}`}>
                      <h2 className="text-navy dark:text-white font-bold text-[clamp(1.5rem,3vw,2rem)] m-0">
                        {t(cat.heading_en, cat.heading_ar, lang)}
                      </h2>
                      {cat.desc_en && (
                        <p className={`text-muted dark:text-white/50 text-sm mt-2 max-w-[600px] ${lang === "ar" ? "text-right" : ""}`}>
                          {t(cat.desc_en, cat.desc_ar, lang)}
                        </p>
                      )}
                    </div>
                  </Reveal>

                  {vids.length === 0 ? (
                    <p className="text-muted/50 dark:text-white/30 text-sm text-center py-12">
                      {t("No videos yet", "لا توجد فيديوهات بعد", lang)}
                    </p>
                  ) : (
                    <Masonry
                      breakpointCols={{ default: 3, 768: 2, 480: 1 }}
                      className="flex -ml-5 w-auto"
                      columnClassName="pl-5 bg-clip-padding"
                    >
                      {vids.map((video) => (
                        <Reveal key={video.id}>
                          <VideoCard
                            video={video}
                            lang={lang}
                            onPlay={handlePlay}
                          />
                        </Reveal>
                      ))}
                    </Masonry>
                  )}
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* ── Fullscreen video player modal ── */}
      {activeVideo && (
        <VideoModal video={activeVideo} onClose={handleClose} />
      )}
    </div>
  )
}

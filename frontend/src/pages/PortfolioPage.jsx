import { useState, useEffect, useRef, useCallback } from "react"
import Reveal from "../components/ui/Reveal"
import Masonry from "react-masonry-css"
import { useTranslation } from "../context/LanguageContext"
import { fetchPortfolioContent, fetchPortfolioVideos } from "../lib/portfolio"

const t = (en, ar, lang) => lang === "ar" ? ar : en

/* ─── VideoCard — native <video> with generated poster (Safari shows blank <video> otherwise) ─── */
function VideoCard({ video, lang, onPlay }) {
  const [poster, setPoster] = useState(null)
  const title = t(video.title_en, video.title_ar, lang) || t("Untitled", "بدون عنوان", lang)

  useEffect(() => {
    if (video.thumbnail_url) { setPoster(video.thumbnail_url); return }
    const vid = document.createElement("video")
    vid.crossOrigin = "anonymous"
    vid.preload = "metadata"
    vid.muted = true
    vid.playsInline = true
    vid.onloadeddata = () => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = vid.videoWidth || 320
        canvas.height = vid.videoHeight || 180
        canvas.getContext("2d").drawImage(vid, 0, 0, canvas.width, canvas.height)
        setPoster(canvas.toDataURL("image/jpeg", 0.75))
      } catch { /* ignore */ }
      vid.remove()
    }
    vid.onerror = () => { vid.remove() }
    vid.src = video.video_url
    return () => { vid.remove() }
  }, [video.video_url, video.thumbnail_url])

  const PlayOverlay = (
    <div
      style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0)",
        transition: "background 0.2s",
        pointerEvents: "none",
      }}
      className="group-hover:bg-black/20"
    >
      <div
        style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "rgba(231,59,73,0.92)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 24px rgba(231,59,73,0.45)",
          transition: "transform 0.2s",
        }}
        className="group-hover:scale-110"
      >
        <i className="fa-solid fa-play text-white" style={{ fontSize: 16, marginLeft: 3 }} />
      </div>
    </div>
  )

  return (
    <div className="group mb-5">
      <div
        className="bg-white dark:bg-[#0f1a24] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-border/50 dark:border-[#1e2d3d]/50"
        style={{ transform: "translateZ(0)" }}
      >
        <div
          className="relative cursor-pointer select-none overflow-hidden"
          onClick={() => onPlay(video)}
        >
          <video
            src={video.video_url}
            preload="metadata"
            muted
            playsInline
            poster={poster || undefined}
            className="w-full h-auto block"
          />
          {PlayOverlay}
        </div>

        {/* ── Card info ───────────────────────────────────────────── */}
        <div style={{ padding: "14px 16px" }} className={lang === "ar" ? "text-right" : ""}>
          <h3
            style={{ margin: 0, fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}
            className="text-navy dark:text-white line-clamp-1"
          >
            {title}
          </h3>
          {video.description_en && (
            <p
              style={{ margin: "5px 0 0", fontSize: 11, lineHeight: 1.6 }}
              className="text-muted dark:text-white/50 line-clamp-2"
            >
              {t(video.description_en, video.description_ar, lang)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   VideoModal — fullscreen overlay with native browser controls.
   Works on: Chrome, Firefox, Edge, Brave, Safari macOS, Safari iOS, Android.
───────────────────────────────────────────────────────────────────────────── */
function VideoModal({ video, onClose }) {
  const videoRef = useRef(null)
  const overlayRef = useRef(null)

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  // Auto-play and request fullscreen
  useEffect(() => {
    if (!video) return
    const el = videoRef.current
    if (!el) return

    const playVideo = () => el.play().catch(() => {})

    const requestFS = () => {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {})
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen()
      } else if (el.webkitEnterFullscreen) {
        el.webkitEnterFullscreen()
      }
    }

    const onCanPlay = () => {
      playVideo()
      requestFS()
    }

    el.addEventListener("canplay", onCanPlay, { once: true })
    el.load()

    return () => el.removeEventListener("canplay", onCanPlay)
  }, [video])

  // Close when fullscreen exits (standard + webkit + moz + ms)
  useEffect(() => {
    const handleFSChange = () => {
      const active =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      if (!active) {
        videoRef.current?.pause()
        onClose()
      }
    }
    document.addEventListener("fullscreenchange", handleFSChange)
    document.addEventListener("webkitfullscreenchange", handleFSChange)
    document.addEventListener("mozfullscreenchange", handleFSChange)
    document.addEventListener("MSFullscreenChange", handleFSChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFSChange)
      document.removeEventListener("webkitfullscreenchange", handleFSChange)
      document.removeEventListener("mozfullscreenchange", handleFSChange)
      document.removeEventListener("MSFullscreenChange", handleFSChange)
    }
  }, [onClose])

  // iOS Safari: fullscreen change fires on the video element itself
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const onIOSFS = () => {
      if (!el.webkitDisplayingFullscreen) {
        el.pause()
        onClose()
      }
    }
    el.addEventListener("webkitbeginfullscreen", () => {})
    el.addEventListener("webkitendfullscreen", onIOSFS)
    return () => {
      el.removeEventListener("webkitendfullscreen", onIOSFS)
    }
  }, [onClose])

  // Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { videoRef.current?.pause(); onClose() }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  const close = useCallback(() => {
    videoRef.current?.pause()
    onClose()
  }, [onClose])

  if (!video) return null

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) close() }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#000",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {/* Close button — always visible above video */}
      <button
        onClick={close}
        aria-label="Close"
        style={{
          position: "absolute",
          top: "max(12px, env(safe-area-inset-top, 12px))",
          right: "max(12px, env(safe-area-inset-right, 12px))",
          zIndex: 10001,
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "50%",
          width: 44, height: 44,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#fff", fontSize: 18,
          transition: "background 0.2s, transform 0.15s",
        }}
        onPointerEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.28)"; e.currentTarget.style.transform = "scale(1.1)" }}
        onPointerLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "scale(1)" }}
      >
        <i className="fa-solid fa-xmark" />
      </button>

      {/* The video — fills the whole black overlay */}
      <video
        ref={videoRef}
        src={video.video_url}
        controls
        preload="none"
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        x5-video-player-type="h5"
        x5-video-player-fullscreen="true"
        style={{
          width: "100%", height: "100%",
          maxWidth: "100%", maxHeight: "100%",
          objectFit: "contain",
          background: "#000",
          outline: "none",
          display: "block",
        }}
      />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   PortfolioPage
───────────────────────────────────────────────────────────────────────────── */
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
          // All categories in parallel
          const results = await Promise.all(
            cats.map((cat) => fetchPortfolioVideos(cat.slug).catch(() => []))
          )
          const all = {}
          cats.forEach((cat, i) => { all[cat.slug] = results[i] })
          setVideosByCategory(all)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handlePlay = useCallback((video) => setActiveVideo(video), [])
  const handleClose = useCallback(() => setActiveVideo(null), [])

  const cms = (field) => cmsData?.[`${field}_${lang}`] || cmsData?.[`${field}_en`] || ""
  const categories = cmsData?.categories || []

  return (
    <div className="page-enter">

      {/* ── Hero ─────────────────────────────────────────────────── */}
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

      {/* ── Category tabs ─────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="w-full bg-white dark:bg-[#0f1a24] py-6 sticky top-0 z-20 border-b border-border/50 dark:border-[#1e2d3d]/50">
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

      {/* ── Videos grid ───────────────────────────────────────────── */}
      <section className="w-full bg-white dark:bg-[#0A1216] pb-[clamp(2rem,5vw,5rem)]">
        <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)]">

          {loading ? (
            /* Skeleton */
            <div className="flex gap-5 pt-10">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="flex-1 rounded-2xl bg-gray-100 dark:bg-[#1a2a38] animate-pulse"
                  style={{ paddingTop: "56.25%" }}
                />
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
                      breakpointCols={{ default: 3, 1024: 2, 640: 1 }}
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

      {/* ── Fullscreen player ─────────────────────────────────────── */}
      {activeVideo && (
        <VideoModal video={activeVideo} onClose={handleClose} />
      )}
    </div>
  )
}

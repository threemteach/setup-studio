import { useState, useEffect, useRef } from "react"
import SEO from "../components/SEO"
import Reveal from "../components/ui/Reveal"
import Masonry from "react-masonry-css"
import { useTranslation } from "../context/LanguageContext"
import { fetchPortfolioContent, fetchPortfolioVideos } from "../lib/portfolio"
import { optimizeImageUrl } from "../lib/images"

const t = (en, ar, lang) => lang === "ar" ? ar : en

/* ─── VideoCard — native <video> preview + inline playback on click ──────────── */
function VideoCard({ video, lang, playingVideoId, onPlay }) {
  const previewVidRef = useRef(null)
  const containerRef = useRef(null)
  const [cardRatio, setCardRatio] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [inView, setInView] = useState(false)
  const hasThumbnail = Boolean(video.thumbnail_url)

  /* size the card from the poster image dimensions, not the video —
     poster is a Cloudinary JPEG that loads instantly and already cached */
  useEffect(() => {
    if (!video.thumbnail_url) return
    const img = new Image()
    img.onload = () => setCardRatio((img.naturalHeight / img.naturalWidth) * 100)
    img.src = video.thumbnail_url
  }, [video.thumbnail_url])

  /* lazy-load video metadata only if no thumbnail is available */
  useEffect(() => {
    if (playing || !inView) return
    const el = previewVidRef.current
    if (!el) return
    if (hasThumbnail) return

    function onMeta() {
      if (el.videoWidth && el.videoHeight) setCardRatio((el.videoHeight / el.videoWidth) * 100)
      el.currentTime = 0.001
    }
    el.addEventListener("loadedmetadata", onMeta, { once: true })
    el.load()
    return () => el.removeEventListener("loadedmetadata", onMeta)
  }, [video.video_url, playing, inView, hasThumbnail])

  /* pause when another video starts playing */
  useEffect(() => {
    if (!playing || playingVideoId === video.id) return
    const el = previewVidRef.current
    if (!el) return
    el.pause()
    setPlaying(false)
    setBuffering(false)
  }, [playingVideoId, video.id])

  /* pause when video naturally reaches end */
  useEffect(() => {
    if (!playing) return
    const el = previewVidRef.current
    if (!el) return
    function onEnded() { setPlaying(false) }
    el.addEventListener("ended", onEnded, { once: true })
    return () => el.removeEventListener("ended", onEnded)
  }, [playing])

  const title = t(video.title_en, video.title_ar, lang)

  function handlePlay() {
    const el = previewVidRef.current
    if (!el || playing || buffering) return
    onPlay(video.id)
    setBuffering(true)

    // Set source directly on DOM so video starts loading immediately
    if (video.video_url) el.src = video.video_url

    const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent)

    if (isIOS) {
      /* iOS: buffer first, then play — avoids frozen first-frame in native player */
      const onCanPlay = () => {
        el.play().then(() => {
          setPlaying(true)
          setBuffering(false)
        }).catch(() => setBuffering(false))
      }
      el.addEventListener("canplay", onCanPlay, { once: true })
      el.load()
    } else {
      /* Desktop/Android: try play immediately, fall back to canplay */
      el.play().then(() => {
        setPlaying(true)
        setBuffering(false)
      }).catch(() => {
        const onCanPlay = () => {
          el.play().then(() => {
            setPlaying(true)
            setBuffering(false)
          }).catch(() => setBuffering(false))
        }
        el.addEventListener("canplay", onCanPlay, { once: true })
        el.load()
      })
    }
  }

  return (
    <div className="group mb-5" ref={containerRef}>
      <div
        className="bg-white dark:bg-[#0f1a24] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-border/50 dark:border-[#1e2d3d]/50"
        style={{ transform: "translateZ(0)" }}
      >
        <div
          className="relative cursor-pointer select-none overflow-hidden"
          onClick={handlePlay}
        >
          <div
            style={{
              position: "relative",
              paddingTop: cardRatio ? `${cardRatio}%` : "56.25%",
              background: "linear-gradient(135deg,#0c1e2e 0%,#162840 100%)",
            }}
          >
            <video
              ref={previewVidRef}
              src={playing || buffering ? video.video_url : undefined}
              preload={playing || buffering ? "auto" : hasThumbnail ? "none" : inView ? "metadata" : "none"}
              controls
              playsInline
              poster={video.thumbnail_url ? optimizeImageUrl(video.thumbnail_url, 800) : undefined}
              tabIndex={-1}
              style={{
                  position: "absolute", inset: 0,
                  width: "100%", height: "100%",
                  objectFit: playing ? "contain" : "cover",
                  display: "block",
                  pointerEvents: playing ? "auto" : "none",
                }}
            />
          </div>
          {!playing && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none transition-colors duration-200 group-hover:bg-black/20"
            >
              {buffering ? (
                <div className="w-7 h-7 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
              ) : (
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
              )}
            </div>
          )}
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
   PortfolioPage
───────────────────────────────────────────────────────────────────────────── */
export default function PortfolioPage() {
  const { lang } = useTranslation()
  const [cmsData, setCmsData] = useState(null)
  const [videosByCategory, setVideosByCategory] = useState({})
  const [activeCategory, setActiveCategory] = useState("")
  const [playingVideoId, setPlayingVideoId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPortfolioContent()
      .then(async (data) => {
        setCmsData(data)
        const cats = data?.categories || []
        if (cats.length > 0) {
          setActiveCategory(cats[0].slug)
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

  const cms = (field) => cmsData?.[`${field}_${lang}`] || cmsData?.[`${field}_en`] || ""
  const categories = cmsData?.categories || []

  return (
    <>
      <SEO titleEn="Portfolio" titleAr="أعمالنا" descEn="Browse our video production portfolio at Setup Studio in Alexandria. See our work across categories." descAr="تصفح أعمالنا في إنتاج الفيديو في سيت أب ستوديو بالإسكندرية. شاهد أعمالنا عبر مختلف الفئات." path="/portfolio" />
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
                            playingVideoId={playingVideoId}
                            onPlay={setPlayingVideoId}
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

    </div>
    </>
  )
}
import { useState, useEffect, useRef } from "react"
import AdminLayout from "../../components/admin/AdminLayout"
import { fetchPortfolioContent, updatePortfolioContent, fetchPortfolioVideos, upsertVideo, deleteVideo, uploadVideo, fetchStorageUsage } from "../../lib/portfolio"
import { autoTranslateSection } from "../../lib/homepage"
import { sanitizeError } from "../../lib/errors"
import Toast from "../../components/ui/Toast"
import ConfirmModal from "../../components/admin/ConfirmModal"

const Diamond = () => (
  <svg className="w-[0.8rem] h-[0.8rem] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
    <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
  </svg>
)

function HeadingInput({ value, onChange, dark, placeholder }) {
  const cls = dark
    ? "flex-1 min-w-[12rem] bg-transparent border-0 text-white font-bold text-[clamp(1.2rem,3vw,1.8rem)] text-center outline-none px-2 leading-tight placeholder:text-white/30"
    : "flex-1 min-w-[12rem] bg-white/50 dark:bg-[#15202b] border border-navy/15 dark:border-[#1e2d3d] rounded-xl text-navy dark:text-white font-bold text-[clamp(1.2rem,3vw,1.8rem)] text-left outline-none px-3 py-1 leading-tight placeholder:text-navy/30 dark:placeholder:text-white/30 focus:border-navy/40 focus:bg-white/80 dark:focus:bg-[#1e2d3d] transition-colors"
  return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={cls} placeholder={placeholder || ""} />
}

function LabelInput({ value, onChange, dark, placeholder }) {
  const cls = dark
    ? "bg-transparent border-0 text-[clamp(0.7rem,1vw,0.8rem)] font-semibold uppercase tracking-wider text-red/70 text-center outline-none placeholder:text-red/30"
    : "bg-white/50 dark:bg-[#15202b] border border-navy/15 dark:border-[#1e2d3d] rounded-lg text-[clamp(0.7rem,1vw,0.8rem)] font-semibold uppercase tracking-wider text-red/70 text-left outline-none px-2 py-0.5 placeholder:text-red/30 focus:border-navy/30 focus:bg-white/80 dark:focus:bg-[#1e2d3d] transition-colors"
  return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={cls} placeholder={placeholder || ""} />
}

const TextField = ({ value, onChange, label, placeholder, type = "text", rows, dark = false, onBlur }) => {
  const Tag = type === "textarea" ? "textarea" : "input"
  const base = dark
    ? "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-white/30 transition-colors placeholder:text-white/30 resize-none"
    : "w-full bg-gray-50 dark:bg-[#15202b] border border-border dark:border-[#1e2d3d] rounded-xl px-4 py-2.5 text-navy dark:text-white/80 text-sm outline-none focus:border-navy/40 transition-colors placeholder:text-muted dark:placeholder:text-white/30 resize-none"
  return (
    <div>
      {label && <label className={`text-xs font-medium mb-1.5 block ${dark ? "text-white/40" : "text-navy/50"}`}>{label}</label>}
      <Tag value={value} onChange={(e) => onChange(e.target.value)} className={base} rows={rows} placeholder={placeholder || ""} onBlur={onBlur} />
    </div>
  )
}

const DarkSection = ({ id, title, icon, collapsed, onToggle, children }) => (
  <div className="relative bg-[#0A1216] rounded-3xl overflow-hidden mb-6 shadow-sm border border-white/5">
    <div className="absolute -top-[12rem] -right-[6rem] w-[30rem] h-[30rem] rounded-full bg-[#11AFFF] opacity-[0.25] blur-[6rem] pointer-events-none" />
    <div className="absolute -bottom-[10rem] -left-[4rem] w-[22rem] h-[22rem] rounded-full bg-[#11AFFF] opacity-[0.18] blur-[6rem] pointer-events-none" />
    <div className="absolute top-[4rem] right-[30%] w-[16rem] h-[16rem] rounded-full bg-[#11AFFF] opacity-[0.12] blur-[3rem] pointer-events-none" />
    <div className="relative z-10">
      <button onClick={() => onToggle(id)} className="w-full flex items-center justify-between p-6 sm:p-8 border-0 bg-transparent cursor-pointer hover:bg-white/5 transition-colors">
        <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider m-0 flex items-center gap-2">
          <i className={`${icon} mr-1.5`} />{title}
        </h3>
        <i className={`fa-solid fa-chevron-down text-white/30 text-sm transition-transform duration-200 ${collapsed[id] ? "" : "rotate-180"}`} />
      </button>
      {!collapsed[id] && <div className="px-6 sm:px-8 pb-6 sm:pb-8">{children}</div>}
    </div>
  </div>
)

const LightSection = ({ id, title, icon, collapsed, onToggle, bg = "bg-white", children }) => (
  <div className={`${bg} dark:bg-[#15202b] rounded-3xl border border-border/50 dark:border-[#1e2d3d]/50 shadow-sm mb-6 overflow-hidden`}>
    <button onClick={() => onToggle(id)} className="w-full flex items-center justify-between p-6 sm:p-8 border-0 bg-transparent cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
      <h3 className="text-navy/50 dark:text-white/50 text-xs font-semibold uppercase tracking-wider m-0 flex items-center gap-2">
        <i className={`${icon} mr-1.5`} />{title}
      </h3>
      <i className={`fa-solid fa-chevron-down text-navy/30 dark:text-white/30 text-sm transition-transform duration-200 ${collapsed[id] ? "" : "rotate-180"}`} />
    </button>
    {!collapsed[id] && <div className="px-6 sm:px-8 pb-6 sm:pb-8">{children}</div>}
  </div>
)

const DEFAULT_CATEGORIES = [
  { slug: "event-coverage", heading_en: "Event Coverage", heading_ar: "تغطية الأحداث", desc_en: "Professional event filming and coverage", desc_ar: "تصوير وتغطية احترافية للأحداث" },
  { slug: "fashion-content", heading_en: "Fashion Content", heading_ar: "محتوى الأزياء", desc_en: "Fashion shoots and creative content", desc_ar: "جلسات تصوير أزياء ومحتوى إبداعي" },
  { slug: "food-beverage", heading_en: "Food & Beverage", heading_ar: "الطعام والشراب", desc_en: "Food and beverage commercial content", desc_ar: "محتوى تجاري للطعام والشراب" },
  { slug: "medical-content", heading_en: "Medical Content", heading_ar: "المحتوى الطبي", desc_en: "Medical and healthcare video production", desc_ar: "إنتاج فيديو طبي وصحي" },
  { slug: "reels-social", heading_en: "Reels & Social Content", heading_ar: "ريلز ومحتوى التواصل", desc_en: "Short-form content for social media", desc_ar: "محتوى قصير لمنصات التواصل الاجتماعي" },
  { slug: "ads-campaigns", heading_en: "Social Media Ads", heading_ar: "إعلانات السوشيال ميديا", desc_en: "Paid ad campaigns and promotional content", desc_ar: "حملات إعلانية ومحتوى ترويجي" },
]

const DEFAULT_EMPTY_FORM = {
  id: 1,
  hero_heading_en: "Our Work",
  hero_heading_ar: "أعمالنا",
  hero_subtitle_en: "Explore our video production portfolio across different categories",
  hero_subtitle_ar: "تصفح أعمالنا في إنتاج الفيديو عبر مختلف الفئات",
  categories: DEFAULT_CATEGORIES,
}

export default function PortfolioPageEdit() {
  const [lang, setLang] = useState("en")
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const currentVideoRef = useRef(null)
  const [collapsed, setCollapsed] = useState({})
  const [activeCategory, setActiveCategory] = useState("")
  const [videos, setVideos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [translating, setTranslating] = useState(false)
  const [storage, setStorage] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const fileInputRef = useRef(null)

  function showToast(message, type = "success") {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  function toggleCollapse(key) {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))
  }

  useEffect(() => {
    Promise.all([
      fetchPortfolioContent(),
    ]).then(([data]) => {
      if (data) {
        const merged = { ...DEFAULT_EMPTY_FORM }
        for (const key of Object.keys(DEFAULT_EMPTY_FORM)) {
          if (data[key] !== null && data[key] !== undefined && data[key] !== "") merged[key] = data[key]
        }
        setForm(merged)
        const cats = merged.categories || []
        if (cats.length > 0) setActiveCategory(cats[0].slug)
      } else {
        setForm({ ...DEFAULT_EMPTY_FORM })
        if (DEFAULT_CATEGORIES.length > 0) setActiveCategory(DEFAULT_CATEGORIES[0].slug)
      }
    }).catch(console.error)
    .finally(() => setLoading(false))
    fetchStorageUsage().then(setStorage).catch(() => {})
  }, [])

  useEffect(() => {
    if (activeCategory) {
      fetchPortfolioVideos(activeCategory).then(setVideos).catch(() => setVideos([]))
    }
  }, [activeCategory])

  function setVal(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function val(field) {
    return form?.[`${field}_${lang}`] ?? form?.[`${field}_en`] ?? ""
  }

  function handleChange(field, value) {
    setVal(`${field}_${lang}`, value)
  }

  function makeSlug(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `cat-${Date.now()}`
  }

  function setCatItem(index, key, value) {
    const cats = [...(form?.categories || [])]
    cats[index] = { ...cats[index], [key]: value }
    setVal("categories", cats)
  }

  function handleHeadingBlur(index) {
    const cats = [...(form?.categories || [])]
    const current = cats[index]
    const newSlug = makeSlug(current.heading_en || `cat-${Date.now()}`)
    cats[index] = { ...current, slug: newSlug }
    setVal("categories", cats)
    if (activeCategory === current.slug) setActiveCategory(newSlug)
  }

  function addCategory() {
    const cats = [...(form?.categories || [])]
    const slug = `new-category`
    cats.push({ slug, heading_en: "", heading_ar: "", desc_en: "", desc_ar: "" })
    setVal("categories", cats)
    setActiveCategory(slug)
  }

  function removeCategory(index) {
    const heading = form?.categories?.[index]?.heading_en || ""
    setConfirmAction({ type: "category", index, heading })
  }
  function confirmRemoveCategory() {
    if (!confirmAction) return
    const i = confirmAction.index
    const cats = [...(form?.categories || [])]
    const removed = cats[i]
    cats.splice(i, 1)
    setVal("categories", cats)
    if (activeCategory === removed?.slug && cats.length > 0) setActiveCategory(cats[0].slug)
    else if (cats.length === 0) setActiveCategory("")
    setConfirmAction(null)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updatePortfolioContent({
        hero_heading_en: form.hero_heading_en,
        hero_heading_ar: form.hero_heading_ar,
        hero_subtitle_en: form.hero_subtitle_en,
        hero_subtitle_ar: form.hero_subtitle_ar,
        categories: form.categories,
      })
      await Promise.all(videos.filter(v => v.id).map(v => upsertVideo(v).catch(() => {})))
      showToast("Saved successfully!")
    } catch (err) {
      showToast("Error saving: " + sanitizeError(err.message), "error")
    }
    setSaving(false)
  }

  async function handleUpload(files) {
    if (!files?.length || !activeCategory) return
    setUploading(true)
    setUploadProgress(0)
    try {
      const fileList = Array.from(files)
      const fractions = fileList.map(() => 0)
      const results = await Promise.all(
        fileList.map((file, i) =>
          uploadVideo(file, activeCategory, (loaded, total) => {
            fractions[i] = total > 0 ? loaded / total : 0
            setUploadProgress(Math.min((fractions.reduce((a, b) => a + b, 0) / fileList.length) * 100, 99.9))
          })
        )
      )
      await Promise.all(results.map((result, i) =>
        upsertVideo({
          category: activeCategory,
          video_url: result.video_url,
          video_key: result.video_key,
          thumbnail_url: result.thumbnail_url || "",
          sort_order: videos.length + i,
        })
      ))
      setUploadProgress(100)
      const updated = await fetchPortfolioVideos(activeCategory)
      setVideos(updated)
      showToast(`Uploaded ${files.length} video(s)`)
    } catch (err) {
      showToast("Upload failed: " + sanitizeError(err.message), "error")
    }
    setUploading(false)
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleDeleteVideo(video) {
    setConfirmAction({ type: "video", item: video })
  }
  async function confirmDeleteVideo() {
    const video = confirmAction?.item
    if (!video) return
    try {
      await deleteVideo(video.id, video.video_key)
      setVideos(prev => prev.filter(v => v.id !== video.id))
      showToast("Video deleted")
    } catch (err) {
      showToast("Delete failed: " + sanitizeError(err.message), "error")
    }
    setConfirmAction(null)
  }

  async function handleVideoFieldChange(videoId, field, value) {
    setVideos(prev => prev.map(v => v.id === videoId ? { ...v, [field]: value } : v))
  }

  async function handleAutoTranslate() {
    setTranslating(true)
    try {
      const en = {}, ar = {}
      en.hero_heading = form.hero_heading_en
      en.hero_subtitle = form.hero_subtitle_en
      ar.hero_heading = form.hero_heading_ar
      ar.hero_subtitle = form.hero_subtitle_ar
      ;(form?.categories || []).forEach((c, i) => {
        en[`cat_heading_${i}`] = c.heading_en
        en[`cat_desc_${i}`] = c.desc_en
        ar[`cat_heading_${i}`] = c.heading_ar
        ar[`cat_desc_${i}`] = c.desc_ar
      })
      // Use local videos state (includes unsaved edits)
      const videoLookup = {}
      videos.forEach((v, i) => {
        en[`video_title_${i}`] = v.title_en || ""
        en[`video_desc_${i}`] = v.description_en || ""
        ar[`video_title_${i}`] = v.title_ar || ""
        ar[`video_desc_${i}`] = v.description_ar || ""
        videoLookup[i] = v
      })
      const result = await autoTranslateSection(en, ar, lang)
      const updates = {}
      const cats = [...(form?.categories || [])]
      for (const key of Object.keys(result.content_en)) {
        if (key.startsWith("cat_heading_")) {
          const idx = parseInt(key.replace("cat_heading_", ""), 10)
          cats[idx] = { ...cats[idx], heading_en: result.content_en[key], heading_ar: result.content_ar[key] }
        } else if (key.startsWith("cat_desc_")) {
          const idx = parseInt(key.replace("cat_desc_", ""), 10)
          cats[idx] = { ...cats[idx], desc_en: result.content_en[key], desc_ar: result.content_ar[key] }
        } else {
          updates[`${key}_en`] = result.content_en[key]
          updates[`${key}_ar`] = result.content_ar[key]
        }
      }
      updates.categories = cats
      setForm((prev) => ({ ...prev, ...updates }))
      // Translate and save video metadata
      const videoPromises = []
      for (const key of Object.keys(result.content_en)) {
        if (key.startsWith("video_title_")) {
          const idx = parseInt(key.replace("video_title_", ""), 10)
          const video = videoLookup[idx]
          if (video) {
            video.title_en = result.content_en[key]
            video.title_ar = result.content_ar[key]
          }
        } else if (key.startsWith("video_desc_")) {
          const idx = parseInt(key.replace("video_desc_", ""), 10)
          const video = videoLookup[idx]
          if (video) {
            video.description_en = result.content_en[key]
            video.description_ar = result.content_ar[key]
          }
        }
      }
      for (const v of Object.values(videoLookup)) {
        if (v.title_en || v.title_ar) {
          videoPromises.push(upsertVideo(v))
        }
      }
      if (videoPromises.length) {
        await Promise.all(videoPromises)
        if (activeCategory) {
          const updated = await fetchPortfolioVideos(activeCategory)
          setVideos(updated)
        }
      }
      showToast("Translation complete")
    } catch (err) {
      showToast("Translation failed: " + sanitizeError(err.message), "error")
    }
    setTranslating(false)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-navy/20 dark:border-white/20 border-t-navy dark:border-t-white rounded-full animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  const categories = form?.categories || []

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-navy dark:text-white font-bold text-2xl m-0">Portfolio Page Editor</h1>
          <p className="text-muted dark:text-white/50 text-sm m-0 mt-1">Manage portfolio categories and videos — bilingual EN / AR</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="px-4 py-2 rounded-xl border border-border dark:border-[#1e2d3d] bg-white dark:bg-[#15202b] text-navy dark:text-white font-semibold text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1e2d3d] transition-colors"
          >{lang === "en" ? "Edit العربية" : "Edit English"}</button>
          <button onClick={handleAutoTranslate} disabled={translating}
            className="px-4 py-2 rounded-xl border border-border dark:border-[#1e2d3d] bg-white dark:bg-[#15202b] text-navy dark:text-white font-semibold text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1e2d3d] transition-colors disabled:opacity-50"
          >{translating ? "Translating..." : "Auto-translate"}</button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2 rounded-xl bg-navy text-white font-semibold text-sm cursor-pointer hover:bg-navy/90 transition-colors disabled:opacity-50"
          >{saving ? "Saving..." : "Save All"}</button>
        </div>
      </div>

      {/* ═══════════ STORAGE USAGE ═══════════ */}
      {storage && (() => {
        const pct = (storage.usedBytes / storage.limitBytes) * 100
        const barColor = pct < 70 ? "bg-green-500" : pct < 90 ? "bg-yellow-500" : "bg-red-500"
        const textColor = pct < 70 ? "text-green-600" : pct < 90 ? "text-yellow-600" : "text-red-600"
        return (
          <div className="bg-white dark:bg-[#15202b] rounded-3xl border border-border/50 dark:border-[#1e2d3d]/50 shadow-sm p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-navy dark:text-white font-semibold text-sm"><i className="fa-solid fa-database mr-2 text-navy/40 dark:text-white/40" />Database</span>
              <span className={`text-xs font-bold ${textColor}`}>{storage.usedMB.toFixed(2)} MB / {storage.limitGB} GB</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-[#1e2d3d] rounded-full h-3 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted/50 dark:text-white/30 mt-1">
              <span>0 GB</span>
              <span>{pct < 100 ? `${pct.toFixed(1)}% used` : "FULL"}</span>
              <span>{storage.limitGB} GB</span>
            </div>
          </div>
        )
      })()}

      {/* ════════════════════ HERO ════════════════════ */}
      <DarkSection id="hero" title="Hero Section" icon="fa-solid fa-display" collapsed={collapsed} onToggle={toggleCollapse}>
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center w-full mb-4">
            <Diamond />
            <span className="block flex-1 h-[2px] bg-red" />
            <HeadingInput value={val("hero_heading")} onChange={(v) => handleChange("hero_heading", v)} dark placeholder="Our Work" />
            <span className="block flex-1 h-[2px] bg-red" />
            <Diamond />
          </div>
          <div className="max-w-[600px] mx-auto w-full">
            <TextField value={val("hero_subtitle")} onChange={(v) => handleChange("hero_subtitle", v)} label="" placeholder="Explore our video production portfolio..." dark />
          </div>
        </div>
      </DarkSection>

      {/* ════════════════════ CATEGORIES ════════════════════ */}
      <LightSection id="categories" title="Categories" icon="fa-solid fa-tags" collapsed={collapsed} onToggle={toggleCollapse}>
        <div className="space-y-4">
          {categories.map((cat, i) => (
            <div key={i} className="p-4 rounded-2xl border border-border dark:border-[#1e2d3d] bg-white dark:bg-[#0f1a24] relative group">
              <button onClick={() => removeCategory(i)}
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red/80 text-white text-xs border-0 cursor-pointer hover:bg-red transition-colors flex items-center justify-center z-10">
              <i className="fa-solid fa-xmark" />
            </button>
            <TextField value={lang === "en" ? cat.heading_en : cat.heading_ar}
                onChange={(v) => setCatItem(i, lang === "en" ? "heading_en" : "heading_ar", v)}
                onBlur={() => handleHeadingBlur(i)}
                label={`Heading (${lang === "en" ? "EN" : "AR"})`}
                placeholder={lang === "en" ? "Category heading..." : "عنوان الفئة..."} />
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs font-medium text-navy/50 dark:text-white/50">Slug:</span>
                <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#1e2d3d] text-navy/60 dark:text-white/50 text-xs font-mono">{cat.slug || makeSlug(cat.heading_en) || "—"}</span>
              </div>
              <div className="mt-2">
                <TextField value={lang === "en" ? cat.desc_en : cat.desc_ar}
                  onChange={(v) => setCatItem(i, lang === "en" ? "desc_en" : "desc_ar", v)}
                  label={`Description (${lang === "en" ? "EN" : "AR"})`}
                  placeholder={lang === "en" ? "Category description..." : "وصف الفئة..."} />
              </div>
            </div>
          ))}
          <button onClick={addCategory}
            className="px-4 py-2 rounded-xl border border-dashed border-border dark:border-[#1e2d3d] bg-gray-50 dark:bg-[#0f1a24] text-navy dark:text-white text-sm font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1e2d3d] transition-colors w-full">
            <i className="fa-solid fa-plus mr-2" />Add Category
          </button>
        </div>
      </LightSection>

      {/* ════════════════════ VIDEOS ════════════════════ */}
      <DarkSection id="videos" title="Videos" icon="fa-solid fa-video" collapsed={collapsed} onToggle={toggleCollapse}>
        {categories.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-8">Add categories first</p>
        ) : (
          <>
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map((cat) => (
                <button key={cat.slug} onClick={() => setActiveCategory(cat.slug)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border-0 cursor-pointer transition-colors ${
                    activeCategory === cat.slug
                      ? "bg-red text-white shadow-lg shadow-red/20"
                      : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                  }`}>
                  {lang === "en" ? (cat.heading_en || cat.slug) : (cat.heading_ar || cat.slug)}
                </button>
              ))}
            </div>

            {/* Upload */}
            <div className="mb-6 p-6 rounded-2xl border-2 border-dashed border-white/10 text-center">
              <input ref={fileInputRef} type="file" accept="video/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="px-6 py-3 rounded-xl bg-red text-white text-sm font-semibold cursor-pointer hover:bg-red/90 transition-colors border-0 disabled:opacity-50">
                <i className="fa-solid fa-cloud-arrow-up mr-2" />{uploading ? `Uploading ${Math.round(uploadProgress)}%` : "Upload Videos"}
              </button>
              {uploading && (
                <div className="mt-4 max-w-xs mx-auto bg-white/10 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-red rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
              <p className="text-white/30 text-xs mt-2">Supports MP4, MOV, WebM — uploaded directly to database</p>
            </div>

            {/* Video List */}
            <div className="space-y-4">
              {videos.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-4">No videos in this category yet</p>
              ) : (
                videos.map((video) => (
                  <div key={video.id} className="p-4 rounded-2xl border border-white/10 bg-white/5 relative group">
                    <button onClick={() => handleDeleteVideo(video)}
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red/80 text-white text-xs border-0 cursor-pointer hover:bg-red transition-colors flex items-center justify-center z-10">
                      <i className="fa-solid fa-trash-can" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
                      {/* Video Preview */}
                      <div className="rounded-xl overflow-hidden">
                        <video src={video.video_url} className="w-full h-auto max-h-[300px] object-contain rounded-xl" controls poster={video.thumbnail_url || undefined}
                          onPlay={(e) => {
                            if (currentVideoRef.current && currentVideoRef.current !== e.target) {
                              currentVideoRef.current.pause()
                            }
                            currentVideoRef.current = e.target
                          }} />
                      </div>
                      {/* Meta */}
                      <div className="space-y-2">
                        <input type="text"
                          value={lang === "en" ? video.title_en : video.title_ar}
                          onChange={(e) => handleVideoFieldChange(video.id, lang === "en" ? "title_en" : "title_ar", e.target.value)}
                          className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-white/30 transition-colors placeholder:text-white/30"
                          placeholder={lang === "en" ? "Title (EN)" : "العنوان (AR)"} />
                        <textarea
                          value={lang === "en" ? video.description_en : video.description_ar}
                          onChange={(e) => handleVideoFieldChange(video.id, lang === "en" ? "description_en" : "description_ar", e.target.value)}
                          className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-white/30 transition-colors placeholder:text-white/30 resize-none"
                          rows={2} placeholder={lang === "en" ? "Description (EN)" : "الوصف (AR)"} />
                        <input type="number" value={video.sort_order}
                          onChange={(e) => handleVideoFieldChange(video.id, "sort_order", parseInt(e.target.value) || 0)}
                          className="w-20 bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-white/30 transition-colors"
                          placeholder="Order" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </DarkSection>

      {confirmAction?.type === "video" && (
        <ConfirmModal
          message={`Delete video "${confirmAction.item.title_en || confirmAction.item.title_ar || ""}"?`}
          onConfirm={confirmDeleteVideo}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === "category" && (
        <ConfirmModal
          message={`Delete category "${confirmAction.heading}"?`}
          onConfirm={confirmRemoveCategory}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </AdminLayout>
  )
}

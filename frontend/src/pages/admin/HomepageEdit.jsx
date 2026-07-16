import { useState, useEffect, useRef, useCallback } from "react"
import AdminLayout from "../../components/admin/AdminLayout"
import Toast from "../../components/ui/Toast"
import ConfirmModal from "../../components/admin/ConfirmModal"
import { sanitizeError } from "../../lib/errors"
import { fetchAllPhotos } from "../../lib/photos"
import { fetchHomepageContent, updateHomepageSection, uploadHomepageImage, deleteHomepageImage, translateObject } from "../../lib/homepage"
import { optimizeImageUrl } from "../../lib/images"

const sections = ["hero", "about", "process", "quotes"]
const sectionLabels = { hero: "Hero Section", about: "About Section", process: "Process Section", quotes: "Quotes Section" }
const sectionIcons = { hero: "fa-solid fa-display", about: "fa-solid fa-circle-info", process: "fa-solid fa-arrow-trend-up", quotes: "fa-solid fa-file-invoice" }

const defaultContent = {
  hero: { description: "", photos: [] },
  about: { heading: "", body: "" },
  process: { steps: [{ number: "01", title: "", desc: "" }, { number: "02", title: "", desc: "" }, { number: "03", title: "", desc: "" }, { number: "04", title: "", desc: "" }] },
  quotes: { plans: [] },
}

export default function HomepageEdit() {
  const [activeSection, setActiveSection] = useState("hero")
  const [lang, setLang] = useState("en")
  const [content, setContent] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [translatingField, setTranslatingField] = useState(null)
  const [allPhotos, setAllPhotos] = useState([])

  function ref(key) {
    const other = lang === "en" ? "ar" : "en"
    return content[activeSection]?.[`content_${other}`]?.[key]
  }

  function getOtherLocalized(key) {
    const other = lang === "en" ? "ar" : "en"
    const row = content[key]
    if (!row) return defaultContent[key]
    return row[`content_${other}`] || row.content_en || defaultContent[key]
  }

  function setOtherLocalized(key, value) {
    const other = lang === "en" ? "ar" : "en"
    setContent((prev) => {
      const row = { ...prev[key] }
      row[`content_${other}`] = value
      return { ...prev, [key]: row }
    })
  }

  async function translateField(key, src) {
    if (!src?.trim) return
    setTranslatingField(key)
    try {
      const r = await translateObject(src, lang, lang === "en" ? "ar" : "en")
      const other = lang === "en" ? "ar" : "en"
      const otherVal = getOtherLocalized(activeSection)
      if (key === "hero") otherVal.description = r
      else otherVal[key] = r
      setOtherLocalized(activeSection, otherVal)
    } catch (e) {
      showToast("Translate failed: " + sanitizeError(e.message), "error")
    }
    setTranslatingField(null)
  }
  const [photoPicker, setPhotoPicker] = useState(null)
  const [toast, setToast] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const fileInputRef = useRef(null)

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type })
  }, [])

  const closeToast = useCallback(() => setToast(null), [])

  useEffect(() => {
    Promise.all([
      fetchHomepageContent(),
      fetchAllPhotos().catch(() => []),
    ]).then(([homepageData, photos]) => {
      setAllPhotos(photos)
      const map = {}
      sections.forEach((key) => {
        const row = homepageData[key]
        map[key] = row ? row : { section_key: key, content_en: defaultContent[key], content_ar: defaultContent[key] }
      })
      setContent(map)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  function getLocalized(key) {
    const row = content[key]
    if (!row) return defaultContent[key]
    return row[`content_${lang}`] || row.content_en || defaultContent[key]
  }

  function setLocalized(key, value) {
    setContent((prev) => {
      const row = { ...prev[key] }
      row[`content_${lang}`] = value
      return { ...prev, [key]: row }
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      for (const key of sections) {
        const row = content[key]
        await updateHomepageSection(key, row.content_en || defaultContent[key], row.content_ar || defaultContent[key])
      }
      showToast("Saved successfully!")
    } catch (err) {
      showToast("Error saving: " + sanitizeError(err.message), "error")
    }
    setSaving(false)
  }

  function setPhotos(key, photos) {
    /* Sync photos across both languages */
    setContent((prev) => {
      const row = { ...prev[key] }
      row.content_en = { ...row.content_en, photos }
      row.content_ar = { ...row.content_ar, photos }
      return { ...prev, [key]: row }
    })
  }

  async function handlePickPhoto(photo) {
    if (!photoPicker) return
    const sectionName = photoPicker.section
    try {
      const existing = getLocalized(sectionName)
      const oldPhoto = existing?.photos?.[photoPicker.index]
      if (oldPhoto?.id && !oldPhoto.id.startsWith("setup-studio/locations/")) {
        try { await deleteHomepageImage(oldPhoto.id) } catch {}
      }
      const localized = getLocalized(sectionName)
      const photos = [...(localized.photos || [])]
      photos[photoPicker.index] = { id: photo.cloudinary_public_id, url: photo.cloudinary_url }
      setPhotos(sectionName, photos)
    } catch (err) {
      showToast("Failed to pick photo: " + sanitizeError(err.message), "error")
    }
    setPhotoPicker(null)
  }

  async function handleUploadNew(e) {
    const file = e.target.files?.[0]
    if (!file || !photoPicker) return
    const sectionName = photoPicker.section
    try {
      const existing = getLocalized(sectionName)
      const oldPhoto = existing?.photos?.[photoPicker.index]
      if (oldPhoto?.id && !oldPhoto.id.startsWith("setup-studio/locations/")) {
        try { await deleteHomepageImage(oldPhoto.id) } catch {}
      }
      const result = await uploadHomepageImage(file, sectionName)
      const localized = getLocalized(sectionName)
      const photos = [...(localized.photos || [])]
      photos[photoPicker.index] = { id: result.public_id, url: result.secure_url }
      setPhotos(sectionName, photos)
    } catch (err) {
      showToast("Upload failed: " + sanitizeError(err.message), "error")
    }
    setPhotoPicker(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function removePhoto(sectionName, index) {
    setConfirmAction({ type: "photo", sectionName, index })
  }
  async function confirmRemovePhoto() {
    if (!confirmAction) return
    const existing = getLocalized(confirmAction.sectionName)
    const oldPhoto = existing?.photos?.[confirmAction.index]
    if (oldPhoto?.id && !oldPhoto.id.startsWith("setup-studio/locations/")) {
      try { await deleteHomepageImage(oldPhoto.id) } catch {}
    }
    const localized = getLocalized(confirmAction.sectionName)
    const photos = [...(localized.photos || [])]
    photos[confirmAction.index] = null
    setPhotos(confirmAction.sectionName, photos)
    setConfirmAction(null)
  }
  function confirmRemoveFeature() {
    if (!confirmAction) return
    const { planIndex: i, featureIndex: j } = confirmAction
    const plans = [...getLocalized("quotes").plans]
    plans[i].features = plans[i].features.filter((_, k) => k !== j)
    setLocalized("quotes", { ...getLocalized("quotes"), plans })
    const otherPlans = [...getOtherLocalized("quotes").plans]
    if (otherPlans[i]) {
      otherPlans[i].features = (otherPlans[i].features || []).filter((_, k) => k !== j)
      const other = getOtherLocalized("quotes")
      other.plans = otherPlans
      setOtherLocalized("quotes", other)
    }
    setConfirmAction(null)
  }

  if (loading) {
    return (
      <AdminLayout lang={lang}>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-navy/20 dark:border-white/20 border-t-navy dark:border-t-white rounded-full animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout lang={lang}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-navy dark:text-white font-bold text-2xl m-0">Home Page Editor</h1>
          <p className="text-muted dark:text-white/50 text-sm m-0 mt-1">Edit homepage content — all changes are bilingual (EN / AR)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="px-4 py-2 rounded-xl border border-border dark:border-[#1e2d3d] bg-white dark:bg-[#15202b] text-navy dark:text-white font-semibold text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1e2d3d] transition-colors"
          >
            {lang === "en" ? "Edit العربية" : "Edit English"}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-xl bg-navy text-white font-semibold text-sm cursor-pointer hover:bg-navy/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save All"}
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {sections.map((key) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border-0 ${
              activeSection === key
                ? "bg-navy text-white shadow-lg shadow-navy/20"
                : "bg-white dark:bg-[#15202b] text-navy dark:text-white border border-border dark:border-[#1e2d3d] hover:bg-gray-50 dark:hover:bg-[#1e2d3d]"
            }`}
          >
            <i className={sectionIcons[key]} />
            {sectionLabels[key]}
          </button>
        ))}
      </div>

      {/* ─── HERO EDITOR (preview-like layout) ─── */}
      {activeSection === "hero" && (
        <div className="bg-white dark:bg-[#15202b] rounded-3xl border border-border/85 dark:border-[#1e2d3d]/85 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-[#f8fafc] dark:from-[#15202b] to-white dark:to-[#0f1a24] p-6 sm:p-8">
            <div className="flex flex-col items-center gap-6 max-w-3xl mx-auto">
              {/* Wordmark preview */}
              <svg className="w-[clamp(14rem,40vw,28rem)] h-auto" viewBox="55 -5 170 75" fill="none">
                <defs>
                  <pattern id="bg-prev" patternUnits="userSpaceOnUse" width="170" height="75" patternTransform="translate(30,-50) scale(1.5)">
                    <rect width="170" height="75" fill="#e2e8f0"/>
                  </pattern>
                </defs>
                <path d="M190.433 41.9092V31.8106C194.432 32.5569 198.483 29.1635 198.721 23.5894C199.048 15.753 192.455 10.8553 187.732 15.823C187.053 16.5343 185.34 19.6712 185.34 20.6624V58.7364H177.379V21.502C177.379 6.64557 191.978 -1.1908 200.778 8.25482C211.829 20.126 204.467 43.7051 190.433 41.9092Z" fill="#cbd5e1"/>
                <path d="M114.322 4.0451V14.9834H104.128V25.2919C104.128 26.4347 106.281 25.5018 106.82 25.4785C109.38 25.3852 111.772 26.0382 114.314 25.5018V36.0203H104.119V47.5883L104.596 48.218H114.623V58.7364H95.8309V4.0451H114.305H114.322Z" fill="#cbd5e1"/>
                <path d="M88.2137 15.4032L81.073 17.5488C79.1489 10.074 70.8431 14.6918 73.4381 21.6769C74.7709 25.2569 79.7402 25.84 82.3794 27.5425C89.7407 32.3003 91.8237 43.8217 86.8897 52.5793C80.2522 64.3338 66.6064 58.9113 65 44.9062L72.2995 42.3407C72.8026 52.4277 83.315 50.4103 82.1587 40.8947C81.5938 36.2768 73.6147 34.0729 70.7372 31.5773C60.7633 22.913 66.7123 2.52914 78.4604 4.10341C83.315 4.74478 86.8367 9.46759 88.2137 15.4032Z" fill="#cbd5e1"/>
                <path d="M147.766 4.0451V14.5636H137.889V58.7364H129.61V14.5636H121.013V4.0451H147.766Z" fill="#cbd5e1"/>
                <path d="M165.689 31.8106H173.333V46.7486C173.333 49.9438 169.67 55.2847 167.578 56.824C160.093 62.3397 149.766 55.7045 149.766 44.2298V15.1933L150.243 14.5636H157.251L157.727 15.1933V45.4892C157.727 47.1568 160.72 49.2092 162.026 49.0926C163.332 48.9759 165.689 46.6553 165.689 45.0694V31.8222V31.8106Z" fill="#cbd5e1"/>
                <path d="M155.717 -3.5362e-06L150.276 7.22437L155.719 14.3806L161.16 7.15625L155.717 -3.5362e-06Z" fill="#cbd5e1"/>
                <path d="M214 48.6378H206.356V58.7364H214V48.6378Z" fill="#cbd5e1"/>
              </svg>

              {/* Photo cards preview */}
              <div className="flex gap-3 flex-wrap justify-center">
                {[0, 1, 2, 3].map((i) => {
                  const photo = (getLocalized("hero").photos || [])[i]
                  return (
                    <div key={i} className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#0f1a24] border-2 border-white dark:border-[#1e2d3d] shadow-md group cursor-pointer" onClick={() => setPhotoPicker({ section: "hero", index: i })}>
                      {photo ? (
                        <img src={optimizeImageUrl(photo.url, 800)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted text-lg">
                          <i className="fa-solid fa-plus" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1">
                        <span className="opacity-0 group-hover:opacity-100 text-white text-[10px] font-semibold bg-black/50 px-2 py-1 rounded-md">
                          {photo ? "Change" : "Add"}
                        </span>
                        {photo && (
                          <span onClick={(e) => { e.stopPropagation(); removePhoto("hero", i) }} className="opacity-0 group-hover:opacity-100 text-white text-[10px] font-semibold bg-red/80 px-2 py-1 rounded-md">
                            Remove
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Description editor - inline in hero style */}
              <div className="w-full max-w-xl">
                <div className="flex items-start gap-1">
                  <textarea
                    value={getLocalized("hero").description || ""}
                    onChange={(e) => setLocalized("hero", { ...getLocalized("hero"), description: e.target.value })}
                    className="flex-1 text-center bg-white/80 dark:bg-white/10 border border-border dark:border-[#1e2d3d] rounded-2xl px-5 py-4 text-navy dark:text-white text-sm outline-none focus:border-navy/40 resize-none shadow-sm"
                    rows={3}
                    placeholder={lang === "en" ? "Hero description text..." : "نص وصف الهيرو..."}
                  />
                  <button onClick={() => translateField("hero", getLocalized("hero").description || "")}
                    className="shrink-0 w-7 h-7 rounded-md bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40 mt-1"
                    title="Translate">
                    <i className={`fa-solid fa-language text-[9px] ${translatingField === "hero" ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <p className="text-[10px] text-muted dark:text-white/40 text-center mt-1">
                  {ref("description") || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ABOUT EDITOR (preview-like layout) ─── */}
      {activeSection === "about" && (
        <div className="bg-white dark:bg-[#15202b] rounded-3xl border border-border/85 dark:border-[#1e2d3d]/85 shadow-sm p-8 sm:p-10">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            {/* Decorative header */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <svg className="w-3 h-3 text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
              </svg>
              <span className="block w-16 h-[2px] bg-red" />
              <span className="text-navy dark:text-white font-bold text-sm tracking-widest uppercase">About Setup</span>
              <span className="block w-16 h-[2px] bg-red" />
              <svg className="w-3 h-3 text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
              </svg>
            </div>

            <div className="flex items-center gap-1">
              <input
                type="text"
                value={getLocalized("about").heading || ""}
                onChange={(e) => setLocalized("about", { ...getLocalized("about"), heading: e.target.value })}
                className="flex-1 text-center border-0 border-b-2 border-border dark:border-[#1e2d3d] bg-transparent text-navy dark:text-white font-bold text-xl outline-none focus:border-navy/40 px-2 py-1"
                placeholder={lang === "en" ? "Heading text..." : "نص العنوان..."}
              />
              <button onClick={() => translateField("heading", getLocalized("about").heading || "")}
                className="shrink-0 w-7 h-7 rounded-md bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40"
                title="Translate">
                <i className={`fa-solid fa-language text-[9px] ${translatingField === "heading" ? "animate-spin" : ""}`} />
              </button>
            </div>
            <p className="text-[10px] text-muted dark:text-white/40 text-center -mt-4">{ref("heading") || "—"}</p>

            <div className="flex items-start gap-1">
              <textarea
                value={getLocalized("about").body || ""}
                onChange={(e) => setLocalized("about", { ...getLocalized("about"), body: e.target.value })}
                className="flex-1 text-center bg-gray-50 dark:bg-[#0f1a24] border border-border dark:border-[#1e2d3d] rounded-2xl px-5 py-4 text-navy/70 dark:text-white/50 text-sm outline-none focus:border-navy/40 resize-none leading-relaxed"
                rows={5}
                placeholder={lang === "en" ? "Body text..." : "نص المحتوى..."}
              />
              <button onClick={() => translateField("body", getLocalized("about").body || "")}
                className="shrink-0 w-7 h-7 rounded-md bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40 mt-0.5"
                title="Translate">
                <i className={`fa-solid fa-language text-[9px] ${translatingField === "body" ? "animate-spin" : ""}`} />
              </button>
            </div>
            <p className="text-[10px] text-muted dark:text-white/40 text-center -mt-2">{ref("body") || "—"}</p>
          </div>
        </div>
      )}

      {/* ─── PROCESS EDITOR (timeline preview) ─── */}
      {activeSection === "process" && (
        <div className="bg-white dark:bg-[#15202b] rounded-3xl border border-border/85 dark:border-[#1e2d3d]/85 shadow-sm p-6 sm:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-navy dark:text-white font-bold uppercase tracking-[0.08em] text-lg m-0">Our Process</h3>
              <p className="text-navy/60 dark:text-white/40 text-xs tracking-[0.15em] uppercase mt-1 m-0">From Idea to Action</p>
            </div>
            <div className="relative">
              <div className="absolute ltr:left-[clamp(3.5rem,8vw,5rem)] rtl:right-[clamp(3.5rem,8vw,5rem)] top-0 bottom-0 w-[3px] bg-navy/20 dark:bg-white/20" />
              {getLocalized("process").steps?.map((step, i) => (
                <div key={i} className="relative flex gap-4 pb-8 last:pb-0">
                  <div className="shrink-0 w-[clamp(3.5rem,8vw,5rem)] ltr:text-right rtl:text-left ltr:pr-4 rtl:pl-4 pt-1">
                    <span className="text-navy dark:text-white font-extrabold text-2xl opacity-30">{step.number}</span>
                  </div>
                  <div className="shrink-0 pt-2 relative z-10">
                    <span className="block w-3.5 h-3.5 rounded-full bg-navy dark:bg-white ring-4 ring-white dark:ring-[#15202b]" />
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-[#0f1a24] rounded-2xl p-4 border border-border/60 dark:border-[#1e2d3d]/60">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={step.title || ""}
                        onChange={(e) => {
                          const steps = [...getLocalized("process").steps]
                          steps[i] = { ...steps[i], title: e.target.value }
                          setLocalized("process", { ...getLocalized("process"), steps })
                        }}
                        className="flex-1 bg-transparent border-0 border-b border-border dark:border-[#1e2d3d] pb-1 text-navy dark:text-white font-bold text-base outline-none focus:border-navy/40 mb-2"
                        placeholder={lang === "en" ? `Step ${step.number} title...` : `عنوان الخطوة ${step.number}...`}
                      />
                      <button onClick={async () => {
                        if (!step.title?.trim) return
                        const k = `proc_t_${i}`; setTranslatingField(k)
                        try {
                          const r = await translateObject(step.title, lang, lang === "en" ? "ar" : "en")
                          const otherSteps = [...getOtherLocalized("process").steps]
                          otherSteps[i] = { ...otherSteps[i], title: r }
                          const other = getOtherLocalized("process")
                          other.steps = otherSteps
                          setOtherLocalized("process", other)
                        } catch(e) { showToast("Translate failed: " + sanitizeError(e.message), "error") }
                        setTranslatingField(null)
                      }}
                        className="shrink-0 w-6 h-6 rounded-md bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40 mb-2"
                        title="Translate">
                        <i className={`fa-solid fa-language text-[9px] ${translatingField === `proc_t_${i}` ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                    <p className="text-[9px] text-muted dark:text-white/40 -mt-3 mb-2 ml-1">
                      {lang === "en" ? (getOtherLocalized("process").steps?.[i]?.title || "—") : (getOtherLocalized("process").steps?.[i]?.title || "—")}
                    </p>
                    <div className="flex items-start gap-1">
                      <textarea
                        value={step.desc || ""}
                        onChange={(e) => {
                          const steps = [...getLocalized("process").steps]
                          steps[i] = { ...steps[i], desc: e.target.value }
                          setLocalized("process", { ...getLocalized("process"), steps })
                        }}
                        className="flex-1 bg-transparent border-0 text-navy/60 dark:text-white/40 text-sm outline-none resize-none leading-relaxed"
                        rows={2}
                        placeholder={lang === "en" ? `Step ${step.number} description...` : `وصف الخطوة ${step.number}...`}
                      />
                      <button onClick={async () => {
                        if (!step.desc?.trim) return
                        const k = `proc_d_${i}`; setTranslatingField(k)
                        try {
                          const r = await translateObject(step.desc, lang, lang === "en" ? "ar" : "en")
                          const otherSteps = [...getOtherLocalized("process").steps]
                          otherSteps[i] = { ...otherSteps[i], desc: r }
                          const other = getOtherLocalized("process")
                          other.steps = otherSteps
                          setOtherLocalized("process", other)
                        } catch(e) { showToast("Translate failed: " + sanitizeError(e.message), "error") }
                        setTranslatingField(null)
                      }}
                        className="shrink-0 w-6 h-6 rounded-md bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40"
                        title="Translate">
                        <i className={`fa-solid fa-language text-[9px] ${translatingField === `proc_d_${i}` ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                    <p className="text-[9px] text-muted dark:text-white/40 mt-0.5 ml-1">
                      {lang === "en" ? (getOtherLocalized("process").steps?.[i]?.desc || "—") : (getOtherLocalized("process").steps?.[i]?.desc || "—")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── QUOTES EDITOR (dark theme preview) ─── */}
      {activeSection === "quotes" && (
        <div className="bg-[#0A1216] rounded-3xl border border-border/85 shadow-sm p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#11AFFF] opacity-[0.08] blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-[#11AFFF] opacity-[0.08] blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-1">
                <svg className="w-3 h-3 text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                  <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                </svg>
                <span className="block w-12 h-[2px] bg-red" />
                <span className="text-white font-bold text-sm tracking-widest uppercase">Our Quotes</span>
                <span className="block w-12 h-[2px] bg-red" />
                <svg className="w-3 h-3 text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                  <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                </svg>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {(getLocalized("quotes").plans || []).map((plan, i) => (
                <div key={i} className="bg-white dark:bg-[#0f1a24] rounded-2xl p-4 sm:p-5 flex flex-col shadow-lg relative">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <input
                        type="text"
                        value={plan.name || ""}
                        onChange={(e) => {
                          const plans = [...getLocalized("quotes").plans]
                          plans[i] = { ...plans[i], name: e.target.value }
                          setLocalized("quotes", { ...getLocalized("quotes"), plans })
                        }}
                        className="flex-1 min-w-0 bg-transparent border-0 text-navy dark:text-white font-extrabold text-sm sm:text-base outline-none"
                        placeholder={lang === "en" ? "Plan name..." : "اسم الباقة..."}
                      />
                      <button onClick={async () => {
                        if (!plan.name?.trim) return
                        const k = `q_name_${i}`; setTranslatingField(k)
                        try {
                          const r = await translateObject(plan.name, lang, lang === "en" ? "ar" : "en")
                          const otherPlans = [...getOtherLocalized("quotes").plans]
                          otherPlans[i] = { ...otherPlans[i], name: r }
                          const other = getOtherLocalized("quotes")
                          other.plans = otherPlans
                          setOtherLocalized("quotes", other)
                        } catch(e) { showToast("Translate failed: " + sanitizeError(e.message), "error") }
                        setTranslatingField(null)
                      }}
                        className="shrink-0 w-5 h-5 rounded bg-navy/5 hover:bg-navy/10 border-0 cursor-pointer flex items-center justify-center text-navy/40"
                        title="Translate">
                        <i className="fa-solid fa-language text-[8px]" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const plans = [...getLocalized("quotes").plans]
                        plans[i] = { ...plans[i], popular: !plan.popular }
                        setLocalized("quotes", { ...getLocalized("quotes"), plans })
                        const otherPlans = [...getOtherLocalized("quotes").plans]
                        otherPlans[i] = { ...otherPlans[i], popular: !plan.popular }
                        const other = getOtherLocalized("quotes")
                        other.plans = otherPlans
                        setOtherLocalized("quotes", other)
                      }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 shrink-0 mt-0.5 ${
                        plan.popular ? "bg-red" : "bg-gray-300 dark:bg-[#1e2d3d]"
                      }`}
                      aria-label={plan.popular ? "Mark as not popular" : "Mark as popular"}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                        plan.popular ? "translate-x-[19px]" : "translate-x-[3px]"
                      }`} />
                    </button>
                  </div>
                  <p className="text-[9px] text-navy/40 dark:text-white/40 -mt-2 mb-2 ml-1">
                    {lang === "en" ? (getOtherLocalized("quotes").plans?.[i]?.name || "—") : (getOtherLocalized("quotes").plans?.[i]?.name || "—")}
                  </p>
                  <div className="flex items-start gap-1">
                    <textarea
                      value={plan.desc || ""}
                      onChange={(e) => {
                        const plans = [...getLocalized("quotes").plans]
                        plans[i] = { ...plans[i], desc: e.target.value }
                        setLocalized("quotes", { ...getLocalized("quotes"), plans })
                      }}
                      className="flex-1 bg-gray-50 dark:bg-[#15202b] border border-border/50 dark:border-[#1e2d3d]/50 rounded-xl px-3 py-2 text-navy/60 dark:text-white/50 text-xs outline-none focus:border-navy/40 resize-none mb-3"
                      rows={5}
                      placeholder={lang === "en" ? "Plan description..." : "وصف الباقة..."}
                    />
                    <button onClick={async () => {
                      if (!plan.desc?.trim) return
                      const k = `q_desc_${i}`; setTranslatingField(k)
                      try {
                        const r = await translateObject(plan.desc, lang, lang === "en" ? "ar" : "en")
                        const otherPlans = [...getOtherLocalized("quotes").plans]
                        otherPlans[i] = { ...otherPlans[i], desc: r }
                        const other = getOtherLocalized("quotes")
                        other.plans = otherPlans
                        setOtherLocalized("quotes", other)
                      } catch(e) { showToast("Translate failed: " + sanitizeError(e.message), "error") }
                      setTranslatingField(null)
                    }}
                      className="shrink-0 w-6 h-6 rounded-md bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40 mt-0.5"
                      title="Translate">
                      <i className={`fa-solid fa-language text-[9px] ${translatingField === `q_desc_${i}` ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                  <p className="text-[9px] text-navy/40 dark:text-white/40 -mt-3 mb-2 ml-1">
                    {lang === "en" ? (getOtherLocalized("quotes").plans?.[i]?.desc || "—") : (getOtherLocalized("quotes").plans?.[i]?.desc || "—")}
                  </p>
                  <div className="flex-1">
                    <p className="text-[10px] text-navy dark:text-white font-semibold mb-1.5">Features</p>
                    {(plan.features || []).map((f, j) => (
                      <div key={j} className="flex items-center gap-1.5 mb-1">
                        <svg className="w-3 h-3 text-red shrink-0" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M4.5 8.5L2 6l-.7.7L4.5 10l6-6-.7-.7z" />
                        </svg>
                        <input
                          type="text"
                          value={f}
                          onChange={(e) => {
                            const plans = [...getLocalized("quotes").plans]
                            const features = [...plans[i].features]
                            features[j] = e.target.value
                            plans[i] = { ...plans[i], features }
                            setLocalized("quotes", { ...getLocalized("quotes"), plans })
                          }}
                          className="flex-1 bg-transparent border-0 border-b border-dotted border-gray-200 dark:border-[#1e2d3d] text-navy/70 dark:text-white/50 text-xs outline-none focus:border-navy/40 pb-0.5"
                        />
                        <button onClick={async () => {
                          if (!f?.trim) return
                          const k = `q_feat_${i}_${j}`; setTranslatingField(k)
                          try {
                            const r = await translateObject(f, lang, lang === "en" ? "ar" : "en")
                            const otherPlans = [...getOtherLocalized("quotes").plans]
                            const otherFeatures = [...(otherPlans[i]?.features || [])]
                            otherFeatures[j] = r
                            otherPlans[i] = { ...otherPlans[i], features: otherFeatures }
                            const other = getOtherLocalized("quotes")
                            other.plans = otherPlans
                            setOtherLocalized("quotes", other)
                          } catch(e) { showToast("Translate failed: " + sanitizeError(e.message), "error") }
                          setTranslatingField(null)
                        }}
                          className="shrink-0 w-4 h-4 rounded bg-navy/5 hover:bg-navy/10 border-0 cursor-pointer flex items-center justify-center text-navy/30"
                          title="Translate">
                          <i className="fa-solid fa-language text-[7px]" />
                        </button>
                        <button
                          onClick={() => setConfirmAction({ type: "feature", planIndex: i, featureIndex: j })}
                          className="text-red/50 hover:text-red text-xs bg-transparent border-0 cursor-pointer p-0 leading-none"
                        >
                          <i className="fa-solid fa-xmark" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const plans = [...getLocalized("quotes").plans]
                        plans[i].features = [...(plans[i].features || []), ""]
                        setLocalized("quotes", { ...getLocalized("quotes"), plans })
                      }}
                      className="text-[10px] text-navy/40 hover:text-navy bg-transparent border-0 cursor-pointer mt-1 flex items-center gap-1"
                    >
                      <i className="fa-solid fa-plus text-[8px]" /> Add feature
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── PHOTO PICKER MODAL ─── */}
      {photoPicker && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPhotoPicker(null)}>
          <div className="bg-white dark:bg-[#15202b] rounded-3xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border dark:border-[#1e2d3d]">
              <div>
                <h3 className="text-navy dark:text-white font-bold text-base m-0">Choose Photo</h3>
                <p className="text-muted dark:text-white/50 text-xs m-0 mt-0.5">Select from existing location photos or upload a new one</p>
              </div>
              <button onClick={() => setPhotoPicker(null)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#1e2d3d] border-0 text-navy dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-[#2a3d4d] transition-colors flex items-center justify-center">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold cursor-pointer hover:bg-navy/90 transition-colors border-0"
                >
                  <i className="fa-solid fa-upload mr-2" />Upload New Photo
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadNew} />
              </div>
              {allPhotos.length === 0 ? (
                <p className="text-muted dark:text-white/50 text-sm text-center py-8">No photos found in the database.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {allPhotos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => handlePickPhoto(photo)}
                      className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-[#0f1a24] border-2 border-transparent hover:border-navy transition-all cursor-pointer p-0 group relative"
                    >
                       <img src={optimizeImageUrl(photo.cloudinary_url, 800)} alt="" className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] font-medium px-2 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                        {photo.category}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmAction?.type === "photo" && (
        <ConfirmModal
          message="Remove this photo?"
          onConfirm={confirmRemovePhoto}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === "feature" && (
        <ConfirmModal
          message="Remove this feature?"
          onConfirm={confirmRemoveFeature}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      <Toast toast={toast} onClose={closeToast} />
    </AdminLayout>
  )
}

import { useState, useEffect, useRef, useCallback } from "react"
import AdminLayout from "../../components/admin/AdminLayout"
import Toast from "../../components/ui/Toast"
import ConfirmModal from "../../components/admin/ConfirmModal"
import { sanitizeError } from "../../lib/errors"
import { fetchAllPhotos } from "../../lib/photos"
import { fetchAboutContent, updateAboutContent, uploadAboutImage, defaultServices, defaultValues } from "../../lib/about"
import { optimizeImageUrl } from "../../lib/images"
import { translateObject } from "../../lib/homepage"
import ImageCropperModal from "../../components/admin/ImageCropper"

const FIELDS = {
  hero: ["hero_heading", "hero_subtitle", "hero_description"],
  story: [],
}

export default function AboutPageEdit() {
  const [lang, setLang] = useState("en")
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [translatingField, setTranslatingField] = useState(null)
  const [allPhotos, setAllPhotos] = useState([])
  const [cropModal, setCropModal] = useState(null)

  const CROP_ASPECTS = {
    hero: 16 / 9,
    story: 4 / 3,
  }

  function ref(field) {
    const other = lang === "en" ? "ar" : "en"
    return form?.[`${field}_${other}`] ?? ""
  }

  async function translateField(field, src) {
    if (!src?.trim) return
    setTranslatingField(field)
    try {
      const r = await translateObject(src, lang, lang === "en" ? "ar" : "en")
      setVal(`${field}_${lang === "en" ? "ar" : "en"}`, r)
    } catch (e) {
      showToast("Translate failed: " + sanitizeError(e.message), "error")
    }
    setTranslatingField(null)
  }
  const [photoPicker, setPhotoPicker] = useState(null)
  const [toast, setToast] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const fileInputRef = useRef(null)

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), [])
  const closeToast = useCallback(() => setToast(null), [])
  function confirmClearPhoto() {
    setVal(confirmAction + "_photo_url", null)
    setVal(confirmAction + "_photo_id", null)
    setConfirmAction(null)
  }

  useEffect(() => {
    Promise.all([
      fetchAboutContent(),
      fetchAllPhotos().catch(() => []),
    ]).then(([data, photos]) => {
      setAllPhotos(photos)
      if (data) {
        setForm(data)
      } else {
        setForm({
          id: 1,
          hero_heading_en: "", hero_heading_ar: "",
          hero_subtitle_en: "", hero_subtitle_ar: "",
          hero_description_en: "", hero_description_ar: "",
          hero_photo_url: null, hero_photo_id: null,
          story_photo_url: null, story_photo_id: null,
          story_paragraphs_en: [], story_paragraphs_ar: [],
          story_quote_en: "", story_quote_ar: "",
          services: defaultServices,
          values: defaultValues,
        })
      }
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  function setVal(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function val(field) {
    return form?.[`${field}_${lang}`] ?? form?.[`${field}_en`] ?? ""
  }

  function handleChange(field, value) {
    setVal(`${field}_${lang}`, value)
  }

  const photosMissing = form && (!form.hero_photo_url || !form.story_photo_url)

  async function handleSave() {
    setSaving(true)
    try {
      await updateAboutContent({
        hero_heading_en: form.hero_heading_en,
        hero_heading_ar: form.hero_heading_ar,
        hero_subtitle_en: form.hero_subtitle_en,
        hero_subtitle_ar: form.hero_subtitle_ar,
        hero_description_en: form.hero_description_en,
        hero_description_ar: form.hero_description_ar,
        hero_photo_url: form.hero_photo_url,
        hero_photo_id: form.hero_photo_id,
        story_photo_url: form.story_photo_url,
        story_photo_id: form.story_photo_id,
        story_paragraphs_en: form.story_paragraphs_en,
        story_paragraphs_ar: form.story_paragraphs_ar,
        story_quote_en: form.story_quote_en,
        story_quote_ar: form.story_quote_ar,
        services: form.services,
        values: form.values,
      })
      showToast("Saved successfully!")
    } catch (err) {
      showToast("Error saving: " + sanitizeError(err.message), "error")
    }
    setSaving(false)
  }

  async function handlePickPhoto(photo) {
    if (!photoPicker) return
    setCropModal({ src: photo.cloudinary_url, prefix: photoPicker })
    setPhotoPicker(null)
  }

  async function handleUploadNew(e) {
    const file = e.target.files?.[0]
    if (!file || !photoPicker) return
    const objectUrl = URL.createObjectURL(file)
    setCropModal({ src: objectUrl, prefix: photoPicker, isBlob: true })
    setPhotoPicker(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleCropConfirm(blob) {
    if (!cropModal) return
    const prefix = cropModal.prefix
    try {
      const result = await uploadAboutImage(new File([blob], "cropped.jpg", { type: "image/jpeg" }), prefix)
      setVal(`${prefix}_photo_url`, result.secure_url)
      setVal(`${prefix}_photo_id`, result.public_id)
    } catch (err) {
      showToast("Upload failed: " + sanitizeError(err.message), "error")
    }
    if (cropModal.isBlob) URL.revokeObjectURL(cropModal.src)
    setCropModal(null)
  }

  function setArrayField(field, index, value) {
    const arr = [...(form?.[field] || [])]
    arr[index] = value
    setVal(field, arr)
  }

  function setServiceField(index, key, value) {
    const arr = [...(form?.services || defaultServices)]
    arr[index] = { ...arr[index], [key]: value }
    setVal("services", arr)
  }

  function setValueField(index, key, value) {
    const arr = [...(form?.values || defaultValues)]
    arr[index] = { ...arr[index], [key]: value }
    setVal("values", arr)
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-navy dark:text-white font-bold text-xl sm:text-2xl m-0">About Page Editor</h1>
          <p className="text-muted dark:text-white/50 text-xs sm:text-sm m-0 mt-1">Edit About page — changes are bilingual (EN / AR)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="px-4 py-2 rounded-xl border border-border dark:border-[#1e2d3d] bg-white dark:bg-[#15202b] text-navy dark:text-white font-semibold text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1e2d3d] transition-colors"
          >
            {lang === "en" ? "Edit العربية" : "Edit English"}
          </button>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {photosMissing && (
              <span className="text-red text-xs font-medium">Upload both photos before saving</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || photosMissing}
              className="px-6 py-2 rounded-xl bg-navy text-white font-semibold text-sm cursor-pointer hover:bg-navy/90 transition-colors disabled:opacity-50"
              title={photosMissing ? "Upload both Hero and Story photos first" : ""}
            >
              {saving ? "Saving..." : "Save All"}
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          HERO  (mirrors public page layout)
         ════════════════════════════════════════ */}
      <div className="relative bg-[#0A1216] rounded-3xl overflow-hidden mb-6 shadow-sm border border-white/5">
        <div className="absolute -top-[12rem] -right-[6rem] w-[30rem] h-[30rem] rounded-full bg-[#11AFFF] opacity-[0.25] blur-[6rem] pointer-events-none" />
        <div className="absolute -bottom-[10rem] -left-[4rem] w-[22rem] h-[22rem] rounded-full bg-[#11AFFF] opacity-[0.18] blur-[6rem] pointer-events-none" />
        <div className="absolute top-[4rem] right-[30%] w-[16rem] h-[16rem] rounded-full bg-[#11AFFF] opacity-[0.12] blur-[3rem] pointer-events-none" />

        <div className="relative z-10 p-4 sm:p-8">
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-6 m-0">
            <i className="fa-solid fa-display mr-2" />Hero Section
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: text fields */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <svg className="hidden sm:block w-[0.8rem] h-[0.8rem] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                  <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                </svg>
                <span className="hidden sm:block flex-1 h-[2px] bg-red" />
                <input
                  type="text"
                  value={val("hero_heading")}
                  onChange={(e) => handleChange("hero_heading", e.target.value)}
                  className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-lg font-bold text-center outline-none focus:border-red/50 transition-colors placeholder:text-white/30"
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  placeholder={lang === "en" ? "About Setup" : "عن سيت أب"}
                />
                <button onClick={() => translateField("hero_heading", val("hero_heading"))}
                  className="shrink-0 w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-white/40"
                  title="Translate">
                  <i className={`fa-solid fa-language text-[9px] ${translatingField === "hero_heading" ? "animate-spin" : ""}`} />
                </button>
                <span className="hidden sm:block flex-1 h-[2px] bg-red" />
                <svg className="hidden sm:block w-[0.8rem] h-[0.8rem] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                  <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                </svg>
              </div>
              <p className="text-[10px] text-white/40 text-center -mt-2 mb-2" dir={lang === "en" ? "rtl" : "ltr"}>{ref("hero_heading") || "—"}</p>

                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={val("hero_subtitle")}
                    onChange={(e) => handleChange("hero_subtitle", e.target.value)}
                    className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white/80 font-semibold text-base outline-none focus:border-white/30 transition-colors placeholder:text-white/30 text-start"
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    placeholder={lang === "en" ? "Full-Service Production Studio" : "استوديو إنتاج متكامل الخدمات"}
                  />
                  <button onClick={() => translateField("hero_subtitle", val("hero_subtitle"))}
                    className="shrink-0 w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-white/40"
                    title="Translate">
                    <i className={`fa-solid fa-language text-[9px] ${translatingField === "hero_subtitle" ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <p className="text-[10px] text-white/40 -mt-2 text-start" dir={lang === "en" ? "rtl" : "ltr"}>{ref("hero_subtitle") || "—"}</p>
                <div className="flex items-start gap-1">
                  <textarea
                    value={val("hero_description")}
                    onChange={(e) => handleChange("hero_description", e.target.value)}
                    className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white/60 text-sm outline-none focus:border-white/30 transition-colors resize-none placeholder:text-white/20 text-start"
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    rows={4}
                    placeholder={lang === "en" ? "Description..." : "الوصف..."}
                  />
                  <button onClick={() => translateField("hero_description", val("hero_description"))}
                    className="shrink-0 w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-white/40 mt-0.5"
                    title="Translate">
                    <i className={`fa-solid fa-language text-[9px] ${translatingField === "hero_description" ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <p className="text-[10px] text-white/40 -mt-2 text-start" dir={lang === "en" ? "rtl" : "ltr"}>{ref("hero_description") || "—"}</p>
            </div>

            {/* Right: photo */}
            <div>
              <label className="text-white/40 text-xs font-medium mb-2 block tracking-wide">Hero Photo</label>
              <div
                className="relative aspect-video rounded-2xl overflow-hidden bg-white/5 border-2 border-dashed border-white/20 group cursor-pointer hover:border-white/40 transition-colors"
                onClick={() => setPhotoPicker("hero")}
              >
                {form?.hero_photo_url ? (
                  <img src={optimizeImageUrl(form.hero_photo_url, 800)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/30 gap-1">
                    <i className="fa-solid fa-plus text-2xl" />
                    <span className="text-xs">Click to upload</span>
                  </div>
                )}
                {form?.hero_photo_url && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmAction("hero") }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red/80 text-white text-xs border-0 cursor-pointer hover:bg-red transition-colors flex items-center justify-center"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          OUR STORY
         ════════════════════════════════════════ */}
      <div className="relative bg-[#f8f9fb] dark:bg-[#15202b] rounded-3xl overflow-hidden mb-6 shadow-sm border border-border/50 dark:border-[#1e2d3d]/50">
        <div className="p-4 sm:p-8">
          <h3 className="text-navy/50 dark:text-white/50 text-xs font-semibold uppercase tracking-wider mb-6 m-0">
            <i className="fa-solid fa-book-open mr-2" />Our Story
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: photo */}
            <div>
              <label className="text-navy/50 text-xs font-medium mb-2 block tracking-wide">Story Photo</label>
              <div
                className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-white dark:bg-[#0f1a24] border-2 border-dashed border-border dark:border-[#1e2d3d] group cursor-pointer hover:border-navy/30 transition-colors shadow-sm"
                onClick={() => setPhotoPicker("story")}
              >
                {form?.story_photo_url ? (
                  <img src={optimizeImageUrl(form.story_photo_url, 800)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted gap-1">
                    <i className="fa-solid fa-plus text-2xl" />
                    <span className="text-xs">Click to upload</span>
                  </div>
                )}
                {form?.story_photo_url && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmAction("story") }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red/80 text-white text-xs border-0 cursor-pointer hover:bg-red transition-colors flex items-center justify-center"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: text */}
            <div className="space-y-5">
              {[0, 1].map((i) => (
                <div key={i}>
                  <label className="text-navy/50 dark:text-white/50 text-xs font-medium mb-1.5 block">Paragraph {i + 1}</label>
                  <div className="flex items-start gap-1">
                    <textarea
                      value={(form?.[`story_paragraphs_${lang}`] || [])[i] || ""}
                      onChange={(e) => {
                        const arr = [...(form?.[`story_paragraphs_${lang}`] || ["", ""])]
                        arr[i] = e.target.value
                        setVal(`story_paragraphs_${lang}`, arr)
                      }}
                      className="flex-1 min-w-0 bg-white dark:bg-[#0f1a24] border border-border dark:border-[#1e2d3d] rounded-2xl px-5 py-3 text-navy/70 dark:text-white/50 text-sm outline-none focus:border-navy/40 transition-colors resize-none text-start"
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      rows={3}
                      placeholder={lang === "en" ? `Paragraph ${i + 1}...` : `الفقرة ${i + 1}...`}
                    />
                    <button onClick={async () => {
                      const src = (form?.[`story_paragraphs_${lang}`] || [])[i] || ""
                      if (!src?.trim) return
                      const k = `story_p_${i}`; setTranslatingField(k)
                      try {
                        const r = await translateObject(src, lang, lang === "en" ? "ar" : "en")
                        const other = lang === "en" ? "ar" : "en"
                        const arr = [...(form?.[`story_paragraphs_${other}`] || ["", ""])]
                        arr[i] = r
                        setVal(`story_paragraphs_${other}`, arr)
                      } catch(e) { showToast("Translate failed: " + sanitizeError(e.message), "error") }
                      setTranslatingField(null)
                    }}
                      className="shrink-0 w-6 h-6 rounded-md bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40 mt-0.5"
                      title="Translate">
                      <i className={`fa-solid fa-language text-[9px] ${translatingField === `story_p_${i}` ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                  <p className="text-[9px] text-muted dark:text-white/40 mt-0.5 text-start" dir={lang === "en" ? "rtl" : "ltr"}>
                    {lang === "en" ? ((form?.story_paragraphs_ar || [])[i] || "—") : ((form?.story_paragraphs_en || [])[i] || "—")}
                  </p>
                </div>
              ))}

              <div>
                <label className="text-navy/50 dark:text-white/50 text-xs font-medium mb-1.5 block">Quote</label>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-[#0f1a24] border border-border dark:border-[#1e2d3d]">
                  <i className="fa-solid fa-quote-left text-red text-lg mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-start gap-1">
                      <textarea
                        value={val("story_quote")}
                        onChange={(e) => handleChange("story_quote", e.target.value)}
                        className="flex-1 min-w-0 bg-transparent border-0 text-navy/60 dark:text-white/50 text-sm italic outline-none resize-none p-0 text-start"
                        dir={lang === "ar" ? "rtl" : "ltr"}
                        rows={2}
                        placeholder={lang === "en" ? "Quote text..." : "نص الاقتباس..."}
                      />
                      <button onClick={() => translateField("story_quote", val("story_quote"))}
                        className="shrink-0 w-5 h-5 rounded bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40"
                        title="Translate">
                        <i className={`fa-solid fa-language text-[8px] ${translatingField === "story_quote" ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                    <p className="text-[9px] text-muted dark:text-white/40 mt-0.5 text-start" dir={lang === "en" ? "rtl" : "ltr"}>{ref("story_quote") || "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          SERVICES
         ════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#15202b] rounded-3xl border border-border/50 dark:border-[#1e2d3d]/50 shadow-sm p-4 sm:p-8 mb-6">
        <h3 className="text-navy/50 dark:text-white/50 text-xs font-semibold uppercase tracking-wider mb-6 m-0">
          <i className="fa-solid fa-briefcase mr-2" />Services
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(form?.services || defaultServices).map((service, i) => (
            <div key={i} className="flex items-start gap-4 p-5 rounded-2xl border border-border dark:border-[#1e2d3d] bg-white dark:bg-[#0f1a24] hover:shadow-sm transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-navy/5 dark:bg-white/10 flex items-center justify-center shrink-0">
                <i className={`${service.icon} text-navy dark:text-white text-base`} />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 text-navy/40 dark:text-white/40 text-xs font-medium">
                  <span>Service {i + 1}</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={service[`title_${lang}`] || ""}
                    onChange={(e) => setServiceField(i, `title_${lang}`, e.target.value)}
                    className="flex-1 min-w-0 bg-gray-50 dark:bg-[#15202b] border border-border dark:border-[#1e2d3d] rounded-xl px-4 py-2 text-navy dark:text-white font-bold text-sm outline-none focus:border-navy/40 transition-colors text-start"
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    placeholder={lang === "en" ? "Title..." : "العنوان..."}
                  />
                  <button onClick={async () => {
                    const src = service[`title_${lang}`] || ""
                    if (!src?.trim) return
                    const k = `svc_t_${i}`; setTranslatingField(k)
                    try { const r = await translateObject(src, lang, lang === "en" ? "ar" : "en"); setServiceField(i, `title_${lang === "en" ? "ar" : "en"}`, r) }
                    catch(e) { showToast("Translate failed: " + sanitizeError(e.message), "error") }
                    setTranslatingField(null)
                  }}
                    className="shrink-0 w-6 h-6 rounded-md bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40"
                    title="Translate">
                    <i className={`fa-solid fa-language text-[9px] ${translatingField === `svc_t_${i}` ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <p className="text-[9px] text-muted dark:text-white/40 -mt-1 mb-2 ml-1 text-start" dir={lang === "en" ? "rtl" : "ltr"}>
                  {lang === "en" ? (service[`title_ar`] || "—") : (service[`title_en`] || "—")}
                </p>
                <div className="flex items-start gap-1">
                  <textarea
                    value={service[`desc_${lang}`] || ""}
                    onChange={(e) => setServiceField(i, `desc_${lang}`, e.target.value)}
                    className="flex-1 min-w-0 bg-gray-50 dark:bg-[#15202b] border border-border dark:border-[#1e2d3d] rounded-xl px-4 py-2 text-navy/60 dark:text-white/50 text-sm outline-none focus:border-navy/40 transition-colors resize-none text-start"
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    rows={2}
                    placeholder={lang === "en" ? "Description..." : "الوصف..."}
                  />
                  <button onClick={async () => {
                    const src = service[`desc_${lang}`] || ""
                    if (!src?.trim) return
                    const k = `svc_d_${i}`; setTranslatingField(k)
                    try { const r = await translateObject(src, lang, lang === "en" ? "ar" : "en"); setServiceField(i, `desc_${lang === "en" ? "ar" : "en"}`, r) }
                    catch(e) { showToast("Translate failed: " + sanitizeError(e.message), "error") }
                    setTranslatingField(null)
                  }}
                    className="shrink-0 w-6 h-6 rounded-md bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40 mt-0.5"
                    title="Translate">
                    <i className={`fa-solid fa-language text-[9px] ${translatingField === `svc_d_${i}` ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <p className="text-[9px] text-muted dark:text-white/40 mt-0.5 ml-1 text-start" dir={lang === "en" ? "rtl" : "ltr"}>
                  {lang === "en" ? (service[`desc_ar`] || "—") : (service[`desc_en`] || "—")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════
          VALUES
         ════════════════════════════════════════ */}
      <div className="bg-[#f8f9fb] dark:bg-[#15202b] rounded-3xl border border-border/50 dark:border-[#1e2d3d]/50 shadow-sm p-4 sm:p-8 mb-6">
        <h3 className="text-navy/50 dark:text-white/50 text-xs font-semibold uppercase tracking-wider mb-6 m-0">
          <i className="fa-solid fa-star mr-2" />Values
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(form?.values || defaultValues).map((v, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-3 p-5 rounded-2xl border border-border dark:border-[#1e2d3d] bg-white dark:bg-[#0f1a24] hover:shadow-sm transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-navy/5 dark:bg-white/10 flex items-center justify-center">
                <i className={`${v.icon} text-navy dark:text-white text-base`} />
              </div>
              <div className="w-full space-y-2">
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={v[`title_${lang}`] || ""}
                    onChange={(e) => setValueField(i, `title_${lang}`, e.target.value)}
                    className="flex-1 min-w-0 bg-gray-50 dark:bg-[#15202b] border border-border dark:border-[#1e2d3d] rounded-xl px-3 py-2 text-navy dark:text-white font-semibold text-sm text-center outline-none focus:border-navy/40 transition-colors"
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    placeholder={lang === "en" ? "Title..." : "العنوان..."}
                  />
                  <button onClick={async () => {
                    const src = v[`title_${lang}`] || ""
                    if (!src?.trim) return
                    const k = `val_t_${i}`; setTranslatingField(k)
                    try { const r = await translateObject(src, lang, lang === "en" ? "ar" : "en"); setValueField(i, `title_${lang === "en" ? "ar" : "en"}`, r) }
                    catch(e) { showToast("Translate failed: " + sanitizeError(e.message), "error") }
                    setTranslatingField(null)
                  }}
                    className="shrink-0 w-5 h-5 rounded bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40"
                    title="Translate">
                    <i className={`fa-solid fa-language text-[8px] ${translatingField === `val_t_${i}` ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <p className="text-[9px] text-muted dark:text-white/40 -mt-1 mb-2 text-center" dir={lang === "en" ? "rtl" : "ltr"}>
                  {lang === "en" ? (v[`title_ar`] || "—") : (v[`title_en`] || "—")}
                </p>
                <div className="flex items-start gap-1">
                  <textarea
                    value={v[`desc_${lang}`] || ""}
                    onChange={(e) => setValueField(i, `desc_${lang}`, e.target.value)}
                    className="flex-1 min-w-0 bg-gray-50 dark:bg-[#15202b] border border-border dark:border-[#1e2d3d] rounded-xl px-3 py-2 text-navy/60 dark:text-white/50 text-xs text-center outline-none focus:border-navy/40 transition-colors resize-none"
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    rows={4}
                    placeholder={lang === "en" ? "Description..." : "الوصف..."}
                  />
                  <button onClick={async () => {
                    const src = v[`desc_${lang}`] || ""
                    if (!src?.trim) return
                    const k = `val_d_${i}`; setTranslatingField(k)
                    try { const r = await translateObject(src, lang, lang === "en" ? "ar" : "en"); setValueField(i, `desc_${lang === "en" ? "ar" : "en"}`, r) }
                    catch(e) { showToast("Translate failed: " + sanitizeError(e.message), "error") }
                    setTranslatingField(null)
                  }}
                    className="shrink-0 w-5 h-5 rounded bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40 mt-0.5"
                    title="Translate">
                    <i className={`fa-solid fa-language text-[8px] ${translatingField === `val_d_${i}` ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <p className="text-[9px] text-muted dark:text-white/40 mt-0.5 text-center" dir={lang === "en" ? "rtl" : "ltr"}>
                  {lang === "en" ? (v[`desc_ar`] || "—") : (v[`desc_en`] || "—")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════
          PHOTO PICKER MODAL
         ════════════════════════════════════════ */}
      {photoPicker && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPhotoPicker(null)}>
          <div className="bg-white dark:bg-[#15202b] rounded-3xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border dark:border-[#1e2d3d] shrink-0">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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

      {cropModal && (
        <ImageCropperModal
          src={cropModal.src}
          aspect={CROP_ASPECTS[cropModal.prefix] || 4 / 3}
          onConfirm={handleCropConfirm}
          onCancel={() => { if (cropModal.isBlob) URL.revokeObjectURL(cropModal.src); setCropModal(null) }}
        />
      )}
      {confirmAction && (
        <ConfirmModal
          message={`Remove this ${confirmAction === "hero" ? "hero" : "story"} photo?`}
          onConfirm={confirmClearPhoto}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      <Toast toast={toast} onClose={closeToast} />
    </AdminLayout>
  )
}

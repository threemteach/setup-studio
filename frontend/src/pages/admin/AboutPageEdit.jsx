import { useState, useEffect, useRef, useCallback } from "react"
import AdminLayout from "../../components/admin/AdminLayout"
import Toast from "../../components/ui/Toast"
import { fetchAllPhotos } from "../../lib/photos"
import { fetchAboutContent, updateAboutContent, uploadAboutImage, copyImageToAbout, defaultServices, defaultValues } from "../../lib/about"
import { optimizeImageUrl } from "../../lib/images"
import { autoTranslateSection } from "../../lib/homepage"

const FIELDS = {
  hero: ["hero_heading", "hero_subtitle", "hero_description"],
  story: [],
}

export default function AboutPageEdit() {
  const [lang, setLang] = useState("en")
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [allPhotos, setAllPhotos] = useState([])
  const [photoPicker, setPhotoPicker] = useState(null)
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), [])
  const closeToast = useCallback(() => setToast(null), [])

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
      showToast("Error saving: " + err.message, "error")
    }
    setSaving(false)
  }

  async function handleAutoTranslate() {
    setTranslating(true)
    try {
      const en = {
        hero_heading: form.hero_heading_en,
        hero_subtitle: form.hero_subtitle_en,
        hero_description: form.hero_description_en,
        story_paragraphs: form.story_paragraphs_en,
        story_quote: form.story_quote_en,
      }
      const ar = {
        hero_heading: form.hero_heading_ar,
        hero_subtitle: form.hero_subtitle_ar,
        hero_description: form.hero_description_ar,
        story_paragraphs: form.story_paragraphs_ar,
        story_quote: form.story_quote_ar,
      }
      const result = await autoTranslateSection(en, ar, lang)
      setForm((prev) => ({
        ...prev,
        hero_heading_en: result.content_en.hero_heading,
        hero_subtitle_en: result.content_en.hero_subtitle,
        hero_description_en: result.content_en.hero_description,
        story_paragraphs_en: result.content_en.story_paragraphs,
        story_quote_en: result.content_en.story_quote,
        hero_heading_ar: result.content_ar.hero_heading,
        hero_subtitle_ar: result.content_ar.hero_subtitle,
        hero_description_ar: result.content_ar.hero_description,
        story_paragraphs_ar: result.content_ar.story_paragraphs,
        story_quote_ar: result.content_ar.story_quote,
      }))
    } catch (err) {
      showToast("Translation failed: " + err.message, "error")
    }
    setTranslating(false)
  }

  async function handlePickPhoto(photo) {
    if (!photoPicker) return
    const prefix = photoPicker
    const field = prefix === "hero" ? "hero" : "story"
    try {
      const result = await copyImageToAbout(photo.cloudinary_url, field)
      setVal(`${prefix}_photo_url`, result.secure_url)
      setVal(`${prefix}_photo_id`, result.public_id)
    } catch (err) {
      showToast("Failed to copy photo: " + err.message, "error")
    }
    setPhotoPicker(null)
  }

  async function handleUploadNew(e) {
    const file = e.target.files?.[0]
    if (!file || !photoPicker) return
    const prefix = photoPicker
    const field = prefix === "hero" ? "hero" : "story"
    try {
      const result = await uploadAboutImage(file, field)
      setVal(`${prefix}_photo_url`, result.secure_url)
      setVal(`${prefix}_photo_id`, result.public_id)
    } catch (err) {
      showToast("Upload failed: " + err.message, "error")
    }
    setPhotoPicker(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
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
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-navy font-bold text-2xl m-0">About Page Editor</h1>
          <p className="text-muted text-sm m-0 mt-1">Edit About page — changes are bilingual (EN / AR)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="px-4 py-2 rounded-xl border border-border bg-white text-navy font-semibold text-sm cursor-pointer hover:bg-gray-50 transition-colors"
          >
            {lang === "en" ? "Edit العربية" : "Edit English"}
          </button>
          <button
            onClick={handleAutoTranslate}
            disabled={translating}
            className="px-4 py-2 rounded-xl border border-border bg-white text-navy font-semibold text-sm cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {translating ? "Translating..." : "Auto-translate"}
          </button>
          <div className="flex items-center gap-3">
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

        <div className="relative z-10 p-6 sm:p-8">
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-6 m-0">
            <i className="fa-solid fa-display mr-2" />Hero Section
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: text fields */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-[0.8rem] h-[0.8rem] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                  <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                </svg>
                <span className="block flex-1 h-[2px] bg-red" />
                <input
                  type="text"
                  value={val("hero_heading")}
                  onChange={(e) => handleChange("hero_heading", e.target.value)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-lg font-bold text-center outline-none focus:border-red/50 transition-colors placeholder:text-white/30"
                  placeholder={lang === "en" ? "About Setup" : "عن سيت أب"}
                />
                <span className="block flex-1 h-[2px] bg-red" />
                <svg className="w-[0.8rem] h-[0.8rem] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                  <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                </svg>
              </div>

              <input
                type="text"
                value={val("hero_subtitle")}
                onChange={(e) => handleChange("hero_subtitle", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white/80 font-semibold text-base outline-none focus:border-white/30 transition-colors placeholder:text-white/30"
                placeholder={lang === "en" ? "Full-Service Production Studio" : "استوديو إنتاج متكامل الخدمات"}
              />

              <textarea
                value={val("hero_description")}
                onChange={(e) => handleChange("hero_description", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white/60 text-sm outline-none focus:border-white/30 transition-colors resize-none placeholder:text-white/20"
                rows={4}
                placeholder={lang === "en" ? "Description..." : "الوصف..."}
              />
            </div>

            {/* Right: photo */}
            <div>
              <label className="text-white/40 text-xs font-medium mb-2 block tracking-wide">Hero Photo</label>
              <div
                className="relative aspect-video rounded-2xl overflow-hidden bg-white/5 border-2 border-dashed border-white/20 group cursor-pointer hover:border-white/40 transition-colors"
                onClick={() => setPhotoPicker("hero")}
              >
                {form?.hero_photo_url ? (
                  <img src={optimizeImageUrl(form.hero_photo_url, 600)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/30 gap-1">
                    <i className="fa-solid fa-plus text-2xl" />
                    <span className="text-xs">Click to upload</span>
                  </div>
                )}
                {form?.hero_photo_url && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setVal("hero_photo_url", null); setVal("hero_photo_id", null) }}
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
      <div className="relative bg-[#f8f9fb] rounded-3xl overflow-hidden mb-6 shadow-sm border border-border/50">
        <div className="p-6 sm:p-8">
          <h3 className="text-navy/50 text-xs font-semibold uppercase tracking-wider mb-6 m-0">
            <i className="fa-solid fa-book-open mr-2" />Our Story
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: photo */}
            <div>
              <label className="text-navy/50 text-xs font-medium mb-2 block tracking-wide">Story Photo</label>
              <div
                className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-white border-2 border-dashed border-border group cursor-pointer hover:border-navy/30 transition-colors shadow-sm"
                onClick={() => setPhotoPicker("story")}
              >
                {form?.story_photo_url ? (
                  <img src={optimizeImageUrl(form.story_photo_url, 600)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted gap-1">
                    <i className="fa-solid fa-plus text-2xl" />
                    <span className="text-xs">Click to upload</span>
                  </div>
                )}
                {form?.story_photo_url && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setVal("story_photo_url", null); setVal("story_photo_id", null) }}
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
                  <label className="text-navy/50 text-xs font-medium mb-1.5 block">Paragraph {i + 1}</label>
                  <textarea
                    value={(form?.[`story_paragraphs_${lang}`] || [])[i] || ""}
                    onChange={(e) => {
                      const arr = [...(form?.[`story_paragraphs_${lang}`] || ["", ""])]
                      arr[i] = e.target.value
                      setVal(`story_paragraphs_${lang}`, arr)
                    }}
                    className="w-full bg-white border border-border rounded-2xl px-5 py-3 text-navy/70 text-sm outline-none focus:border-navy/40 transition-colors resize-none"
                    rows={3}
                    placeholder={lang === "en" ? `Paragraph ${i + 1}...` : `الفقرة ${i + 1}...`}
                  />
                </div>
              ))}

              <div>
                <label className="text-navy/50 text-xs font-medium mb-1.5 block">Quote</label>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-border">
                  <i className="fa-solid fa-quote-left text-red text-lg mt-0.5 shrink-0" />
                  <textarea
                    value={val("story_quote")}
                    onChange={(e) => handleChange("story_quote", e.target.value)}
                    className="flex-1 bg-transparent border-0 text-navy/60 text-sm italic outline-none resize-none p-0"
                    rows={2}
                    placeholder={lang === "en" ? "Quote text..." : "نص الاقتباس..."}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          SERVICES
         ════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-6 sm:p-8 mb-6">
        <h3 className="text-navy/50 text-xs font-semibold uppercase tracking-wider mb-6 m-0">
          <i className="fa-solid fa-briefcase mr-2" />Services
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(form?.services || defaultServices).map((service, i) => (
            <div key={i} className="flex items-start gap-4 p-5 rounded-2xl border border-border bg-white hover:shadow-sm transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-navy/5 flex items-center justify-center shrink-0">
                <i className={`${service.icon} text-navy text-base`} />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 text-navy/40 text-xs font-medium">
                  <span>Service {i + 1}</span>
                </div>
                <input
                  type="text"
                  value={service[`title_${lang}`] || ""}
                  onChange={(e) => setServiceField(i, `title_${lang}`, e.target.value)}
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-2 text-navy font-bold text-sm outline-none focus:border-navy/40 transition-colors"
                  placeholder={lang === "en" ? "Title..." : "العنوان..."}
                />
                <textarea
                  value={service[`desc_${lang}`] || ""}
                  onChange={(e) => setServiceField(i, `desc_${lang}`, e.target.value)}
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-2 text-navy/60 text-sm outline-none focus:border-navy/40 transition-colors resize-none"
                  rows={2}
                  placeholder={lang === "en" ? "Description..." : "الوصف..."}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════
          VALUES
         ════════════════════════════════════════ */}
      <div className="bg-[#f8f9fb] rounded-3xl border border-border/50 shadow-sm p-6 sm:p-8 mb-6">
        <h3 className="text-navy/50 text-xs font-semibold uppercase tracking-wider mb-6 m-0">
          <i className="fa-solid fa-star mr-2" />Values
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(form?.values || defaultValues).map((v, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-3 p-5 rounded-2xl border border-border bg-white hover:shadow-sm transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-navy/5 flex items-center justify-center">
                <i className={`${v.icon} text-navy text-base`} />
              </div>
              <div className="w-full space-y-2">
                <input
                  type="text"
                  value={v[`title_${lang}`] || ""}
                  onChange={(e) => setValueField(i, `title_${lang}`, e.target.value)}
                  className="w-full bg-gray-50 border border-border rounded-xl px-3 py-2 text-navy font-semibold text-sm text-center outline-none focus:border-navy/40 transition-colors"
                  placeholder={lang === "en" ? "Title..." : "العنوان..."}
                />
                <textarea
                  value={v[`desc_${lang}`] || ""}
                  onChange={(e) => setValueField(i, `desc_${lang}`, e.target.value)}
                  className="w-full bg-gray-50 border border-border rounded-xl px-3 py-2 text-navy/60 text-xs text-center outline-none focus:border-navy/40 transition-colors resize-none"
                  rows={4}
                  placeholder={lang === "en" ? "Description..." : "الوصف..."}
                />
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
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
              <div>
                <h3 className="text-navy font-bold text-base m-0">Choose Photo</h3>
                <p className="text-muted text-xs m-0 mt-0.5">Select from existing location photos or upload a new one</p>
              </div>
              <button onClick={() => setPhotoPicker(null)} className="w-8 h-8 rounded-full bg-gray-100 border-0 text-navy cursor-pointer hover:bg-gray-200 transition-colors flex items-center justify-center">
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
                <p className="text-muted text-sm text-center py-8">No photos found in the database.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {allPhotos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => handlePickPhoto(photo)}
                      className="aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-transparent hover:border-navy transition-all cursor-pointer p-0 group relative"
                    >
                      <img src={optimizeImageUrl(photo.cloudinary_url, 200)} alt="" className="w-full h-full object-cover" loading="lazy" />
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

      <Toast toast={toast} onClose={closeToast} />
    </AdminLayout>
  )
}

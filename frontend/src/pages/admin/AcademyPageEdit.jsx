import { useState, useEffect, useRef, useCallback } from "react"
import AdminLayout from "../../components/admin/AdminLayout"
import Toast from "../../components/ui/Toast"
import ConfirmModal from "../../components/admin/ConfirmModal"
import { sanitizeError } from "../../lib/errors"
import { fetchAllPhotos } from "../../lib/photos"
import { fetchAcademyContent, updateAcademyContent, uploadAcademyImage } from "../../lib/academy"
import { optimizeImageUrl } from "../../lib/images"
import { translateObject } from "../../lib/homepage"
import ImageCropperModal from "../../components/admin/ImageCropper"

// ─── Shared SVG diamond ───
const Diamond = () => (
  <svg className="hidden sm:block w-[0.8rem] h-[0.8rem] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
    <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
  </svg>
)

// ─── Inline input for headings placed between diamonds ───
function HeadingInput({ value, onChange, dark, placeholder, onTranslate, translating, dir }) {
  const cls = dark
    ? "flex-1 min-w-0 sm:min-w-[12rem] bg-transparent border-0 text-white font-bold text-[clamp(1.2rem,3vw,1.8rem)] text-center outline-none px-2 leading-tight placeholder:text-white/30"
    : "flex-1 min-w-0 sm:min-w-[12rem] bg-white/50 dark:bg-[#15202b] border border-navy/15 dark:border-[#1e2d3d] rounded-xl text-navy dark:text-white font-bold text-[clamp(1.2rem,3vw,1.8rem)] text-start outline-none px-3 py-1 leading-tight placeholder:text-navy/30 dark:placeholder:text-white/30 focus:border-navy/40 focus:bg-white/80 dark:focus:bg-[#1e2d3d] transition-colors"
  return (
    <div className="flex items-center gap-1 flex-1">
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={cls} placeholder={placeholder || ""} dir={dir} />
      {onTranslate && (
        <button onClick={onTranslate} disabled={translating}
          className="shrink-0 w-6 h-6 rounded-md bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40 disabled:opacity-40"
          title="Translate">
          <i className={`fa-solid fa-language text-[9px] ${translating ? "animate-spin" : ""}`} />
        </button>
      )}
    </div>
  )
}

// ─── Inline input for section labels (small badge text) ───
function LabelInput({ value, onChange, dark, placeholder, onTranslate, translating, dir }) {
  const cls = dark
    ? "bg-transparent border-0 text-[clamp(0.7rem,1vw,0.8rem)] font-semibold uppercase tracking-wider text-red/70 text-center outline-none placeholder:text-red/30"
    : "bg-white/50 dark:bg-[#15202b] border border-navy/15 dark:border-[#1e2d3d] rounded-lg text-[clamp(0.7rem,1vw,0.8rem)] font-semibold uppercase tracking-wider text-red/70 text-start outline-none px-2 py-0.5 placeholder:text-red/30 focus:border-navy/30 focus:bg-white/80 dark:focus:bg-[#1e2d3d] transition-colors"
  return (
    <div className="flex items-center gap-1">
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={cls} placeholder={placeholder || ""} dir={dir} />
      {onTranslate && (
        <button onClick={onTranslate} disabled={translating}
          className="shrink-0 w-5 h-5 rounded-md bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40 disabled:opacity-40"
          title="Translate">
          <i className={`fa-solid fa-language text-[8px] ${translating ? "animate-spin" : ""}`} />
        </button>
      )}
    </div>
  )
}

// ─── Photo upload zone ───
const PhotoField = ({ url, urlId, prefix, label, aspect = "aspect-[4/3]", dark = false, onPick, onClear }) => {
  const borderCls = dark
    ? "border-2 border-dashed border-white/20 hover:border-white/40 bg-white/5"
    : "border-2 border-dashed border-border hover:border-navy/30 bg-gray-50"
  return (
    <div>
      <label className={`text-xs font-medium mb-2 block tracking-wide ${dark ? "text-white/40" : "text-navy/50"}`}>{label}</label>
      <div
        className={`relative ${aspect} rounded-2xl overflow-hidden ${borderCls} group cursor-pointer transition-colors`}
        onClick={() => onPick(prefix)}
      >
        {url ? (
          <img src={optimizeImageUrl(url, 600)} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex flex-col items-center justify-center gap-1 ${dark ? "text-white/30" : "text-muted"}`}>
            <i className="fa-solid fa-plus text-2xl" />
          </div>
        )}
        {url && (
          <button
            onClick={(e) => { e.stopPropagation(); onClear(prefix) }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red/80 text-white text-xs border-0 cursor-pointer hover:bg-red transition-colors flex items-center justify-center"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Standard text input (not for inline headings) ───
const TextField = ({ value, onChange, label, placeholder, type = "text", rows, dark = false, onTranslate, translating, reference, dir }) => {
  const Tag = type === "textarea" ? "textarea" : "input"
  const base = dark
    ? "flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-white/30 transition-colors placeholder:text-white/30 resize-none text-start"
    : "flex-1 min-w-0 bg-gray-50 dark:bg-[#15202b] border border-border dark:border-[#1e2d3d] rounded-xl px-4 py-2.5 text-navy dark:text-white/80 text-sm outline-none focus:border-navy/40 transition-colors placeholder:text-muted dark:placeholder:text-white/30 resize-none text-start"
  return (
    <div>
      {label && <label className={`text-xs font-medium mb-1.5 block ${dark ? "text-white/40" : "text-navy/50"}`}>{label}</label>}
      <div className="flex items-start gap-2">
        <Tag value={value} onChange={(e) => onChange(e.target.value)} className={base} rows={rows} placeholder={placeholder || ""} dir={dir} />
        {onTranslate && (
          <button onClick={onTranslate} disabled={translating}
            className="shrink-0 w-8 h-8 rounded-lg bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/50 dark:text-white/50 disabled:opacity-40 mt-0.5"
            title="Translate">
            <i className={`fa-solid fa-language text-xs ${translating ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>
      {reference !== undefined && (
        <p className="text-[10px] text-muted dark:text-white/40 mt-1 leading-tight text-start" dir={dir === "rtl" ? "ltr" : "rtl"}>
          {reference || "—"}
        </p>
      )}
    </div>
  )
}

// ─── Dark section wrapper ───
const DarkSection = ({ id, title, icon, collapsed, onToggle, children }) => (
  <div className="relative bg-[#0A1216] rounded-3xl overflow-hidden mb-6 shadow-sm border border-white/5">
    <div className="absolute -top-[12rem] -right-[6rem] w-[30rem] h-[30rem] rounded-full bg-[#11AFFF] opacity-[0.25] blur-[6rem] pointer-events-none" />
    <div className="absolute -bottom-[10rem] -left-[4rem] w-[22rem] h-[22rem] rounded-full bg-[#11AFFF] opacity-[0.18] blur-[6rem] pointer-events-none" />
    <div className="absolute top-[4rem] right-[30%] w-[16rem] h-[16rem] rounded-full bg-[#11AFFF] opacity-[0.12] blur-[3rem] pointer-events-none" />
    <div className="relative z-10">
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between p-4 sm:p-8 border-0 bg-transparent cursor-pointer hover:bg-white/5 transition-colors"
      >
        <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider m-0 flex items-center gap-2">
          <i className={`${icon} mr-1.5`} />{title}
        </h3>
        <i className={`fa-solid fa-chevron-down text-white/30 text-sm transition-transform duration-200 ${collapsed[id] ? "" : "rotate-180"}`} />
      </button>
      {!collapsed[id] && <div className="px-4 pb-4 sm:px-8 sm:pb-8">{children}</div>}
    </div>
  </div>
)

// ─── Light section wrapper ───
const LightSection = ({ id, title, icon, collapsed, onToggle, bg = "bg-white", children }) => {
  const darkBg = bg === "bg-[#f8f9fb]" ? "dark:bg-[#15202b]" : "dark:bg-[#15202b]"
  return (
    <div className={`${bg} ${darkBg} rounded-3xl border border-border/50 dark:border-[#1e2d3d]/50 shadow-sm mb-6 overflow-hidden`}>
    <button
      onClick={() => onToggle(id)}
      className="w-full flex items-center justify-between p-4 sm:p-8 border-0 bg-transparent cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
    >
      <h3 className="text-navy/50 dark:text-white/50 text-xs font-semibold uppercase tracking-wider m-0 flex items-center gap-2">
        <i className={`${icon} mr-1.5`} />{title}
      </h3>
      <i className={`fa-solid fa-chevron-down text-navy/30 dark:text-white/30 text-sm transition-transform duration-200 ${collapsed[id] ? "" : "rotate-180"}`} />
    </button>
    {!collapsed[id] && <div className="px-4 pb-4 sm:px-8 sm:pb-8">{children}</div>}
  </div>
  )
}

const defaultDifferences = [
  { en: "Practical training inside a real production studio", ar: "تدريب عملي داخل استوديو إنتاج حقيقي" },
  { en: "Hands-on learning, not just theoretical sessions", ar: "تعلم تطبيقي، وليس مجرد جلسات نظرية" },
  { en: "Access to studio locations, lighting setups, and production tools", ar: "الوصول إلى مواقع الاستوديو وإعدادات الإضاءة وأدوات الإنتاج" },
  { en: "Courses designed around real content creation needs", ar: "دورات مصممة حول احتياجات صناعة المحتوى الحقيقية" },
  { en: "Guidance from instructors with market experience", ar: "إرشاد من مدربين ذوي خبرة في السوق" },
  { en: "A learning environment connected to an active creative studio", ar: "بيئة تعليمية متصلة باستوديو إبداعي نشط" },
]

const defaultAudiences = [
  { titleEn: "Beginners", titleAr: "المبتدئون", descEn: "Start learning video and content creation from scratch", descAr: "ابدأ تعلم الفيديو وصناعة المحتوى من الصفر" },
  { titleEn: "Content Creators", titleAr: "صانعو المحتوى", descEn: "Improve the quality of your visuals and production value", descAr: "حسّن جودة المرئيات وقيمة الإنتاج لديك" },
  { titleEn: "Business Owners", titleAr: "أصحاب الأعمال", descEn: "Create better content for your brand and marketing", descAr: "أنشئ محتوى أفضل لعلامتك التجارية وتسويقك" },
  { titleEn: "Social Media Specialists", titleAr: "متخصصو التواصل الاجتماعي", descEn: "Understand professional video production", descAr: "افهم إنتاج الفيديو الاحترافي" },
]

const defaultFocusItems = [
  { en: "Camera & equipment basics", ar: "أساسيات الكاميرا والمعدات" },
  { en: "Understanding light & audio", ar: "فهم الإضاءة والصوت" },
  { en: "Framing and composition", ar: "التأطير والتكوين" },
  { en: "Practical shooting techniques", ar: "تقنيات التصوير العملية" },
]

const defaultExpectations = [
  { icon: "fa-solid fa-calendar-check", textEn: "Attend structured learning sessions", textAr: "حضور جلسات تعليمية منظمة" },
  { icon: "fa-solid fa-building", textEn: "Practice with real studio equipment & setups", textAr: "التدرب بمعدات وإعدادات استوديو حقيقية" },
  { icon: "fa-solid fa-comment-dots", textEn: "Receive feedback on your work", textAr: "تلقي ملاحظات على عملك" },
  { icon: "fa-solid fa-camera", textEn: "Build confidence behind the camera", textAr: "بناء ثقة خلف الكاميرا" },
]

const defaultProductionStages = [
  { icon: "fa-solid fa-pen-clip", titleEn: "Pre-Production", titleAr: "ما قبل الإنتاج", descEn: "Planning, scripting, storyboarding, and crew coordination", descAr: "التخطيط والكتابة والتصوير القصصي وتنسيق الفريق" },
  { icon: "fa-solid fa-video", titleEn: "Production", titleAr: "الإنتاج", descEn: "Shooting, lighting, audio capture, and directing", descAr: "التصوير والإضاءة والتسجيل الصوتي والإخراج" },
  { icon: "fa-solid fa-scissors", titleEn: "Post-Production", titleAr: "ما بعد الإنتاج", descEn: "Editing, color grading, sound design, and motion graphics", descAr: "المونتاج وتصحيح الألوان وتصميم الصوت والرسوم المتحركة" },
  { icon: "fa-solid fa-bullhorn", titleEn: "Marketing & Delivery", titleAr: "التسويق والتسليم", descEn: "Content packaging, distribution strategy, and audience growth", descAr: "تغليف المحتوى واستراتيجية التوزيع وتنمية الجمهور" },
]

const defaultUpcomingCourses = [
  { titleEn: "Podcast Production", titleAr: "إنتاج البودكاست", icon: "fa-solid fa-microphone", descEn: "Master professional podcast recording and production.", descAr: "أتقن التسجيل والإنتاج الاحترافي للبودكاست." },
  { titleEn: "Video Content Creation", titleAr: "صناعة المحتوى المرئي", icon: "fa-solid fa-video", descEn: "Learn end-to-end video production from concept to final cut.", descAr: "تعلم إنتاج الفيديو من البداية إلى النهاية." },
  { titleEn: "Studio Lighting & Design", titleAr: "إضاءة وتصميم الاستوديو", icon: "fa-solid fa-lightbulb", descEn: "Understand professional lighting setups for any production.", descAr: "افهم إعدادات الإضاءة الاحترافية لأي إنتاج." },
  { titleEn: "Short-Form Content", titleAr: "المحتوى القصير", icon: "fa-solid fa-mobile-screen", descEn: "Create engaging reels and short videos that drive results.", descAr: "أنشئ ريلز وفيديوهات قصيرة جذابة تحقق نتائج." },
]

const defaultFaqs = [
  { qEn: "Do I need previous video production experience?", qAr: "هل أحتاج إلى خبرة سابقة في إنتاج الفيديو؟", aEn: "No. The Video Content Foundation Course is designed for beginners.", aAr: "لا. دورة أساسيات إنتاج المحتوى المرئي مصممة للمبتدئين." },
  { qEn: "Do I need to have my own camera?", qAr: "هل أحتاج إلى امتلاك كاميرا خاصة بي؟", aEn: "Having a camera is helpful, but the course is suitable for beginners too.", aAr: "امتلاك كاميرا مفيد لكن الدورة مناسبة للمبتدئين أيضاً." },
  { qEn: "Is the course practical or theoretical?", qAr: "هل الدورة عملية أم نظرية؟", aEn: "The course is practical — with hands-on application inside Setup Studio.", aAr: "الدورة عملية — مع التطبيق العملي داخل سيت أب ستوديو." },
  { qEn: "What makes Setup Academy different?", qAr: "ما الذي يميز أكاديمية سيت أب؟", aEn: "Setup Academy is built inside a real production studio. You learn by doing.", aAr: "أكاديمية سيت أب مبنية داخل استوديو إنتاج حقيقي. تتعلم بالممارسة." },
]

const DEFAULT_EMPTY_FORM = {
  id: 1,
  hero_subtitle_en: "", hero_subtitle_ar: "",
  hero_body_en: "", hero_body_ar: "",
  hero_photo_url: null, hero_photo_id: null,
  why_label_en: "", why_label_ar: "",
  why_heading_en: "", why_heading_ar: "",
  why_intro_en: "", why_intro_ar: "",
  why_photo_url: null, why_photo_id: null,
  why_body_en: "", why_body_ar: "",
  audience_heading_en: "Who Is Setup Academy For?", audience_heading_ar: "لمن هذه الأكاديمية؟",
  differences: defaultDifferences,
  audiences: defaultAudiences,
  first_course_label_en: "", first_course_label_ar: "",
  first_course_heading_en: "", first_course_heading_ar: "",
  first_course_desc_en: "", first_course_desc_ar: "",
  first_course_photo_url: null, first_course_photo_id: null,
  focus_items: defaultFocusItems,
  expectations_heading_en: "What Students Can Expect", expectations_heading_ar: "ماذا يمكن أن يتوقع الطلاب",
  expectations: defaultExpectations,
  production_label_en: "", production_label_ar: "",
  production_heading_en: "", production_heading_ar: "",
  production_intro_en: "", production_intro_ar: "",
  production_photo_url: null, production_photo_id: null,
  production_body_en: "", production_body_ar: "",
  production_stages: defaultProductionStages,
  beyond_label_en: "", beyond_label_ar: "",
  beyond_heading_en: "More Than Just a Course", beyond_heading_ar: "أكثر من مجرد دورة",
  beyond_photo_url: null, beyond_photo_id: null,
  beyond_body_en: "", beyond_body_ar: "",
  upcoming_label_en: "", upcoming_label_ar: "",
  upcoming_heading_en: "Upcoming Courses", upcoming_heading_ar: "الدورات القادمة",
  upcoming_intro_en: "", upcoming_intro_ar: "",
  upcoming_courses: defaultUpcomingCourses,
  faq_heading_en: "Frequently Asked Questions", faq_heading_ar: "الأسئلة الشائعة",
  faqs: defaultFaqs,
  cta_title_en: "Start Your Creative Journey", cta_title_ar: "ابدأ رحلتك الإبداعية",
  cta_body_en: "", cta_body_ar: "",
  cta_button_en: "", cta_button_ar: "",
}

export default function AcademyPageEdit() {
  const [lang, setLang] = useState("en")
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [translatingField, setTranslatingField] = useState(null)
  const [allPhotos, setAllPhotos] = useState([])
  const [photoPicker, setPhotoPicker] = useState(null)
  const [toast, setToast] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const fileInputRef = useRef(null)
  const [collapsed, setCollapsed] = useState({})
  const [cropModal, setCropModal] = useState(null)

  const CROP_ASPECTS = {
    hero: 16 / 9,
    why: 4 / 3,
    first_course: 16 / 9,
    production: 4 / 3,
    beyond: 4 / 3,
  }

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), [])
  const closeToast = useCallback(() => setToast(null), [])

  function toggleCollapse(key) {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function ref(field) {
    return form?.[`${field}_${lang === "en" ? "ar" : "en"}`]
  }

  async function translateField(fieldName, sourceText) {
    if (!sourceText?.trim()) { showToast("Nothing to translate", "error"); return }
    setTranslatingField(fieldName)
    try {
      const target = lang === "en" ? "ar" : "en"
      const result = await translateObject(sourceText, lang, target)
      setVal(`${fieldName}_${target}`, result)
    } catch (err) {
      showToast("Translate failed: " + sanitizeError(err.message), "error")
    }
    setTranslatingField(null)
  }

  useEffect(() => {
    Promise.all([
      fetchAcademyContent(),
      fetchAllPhotos().catch(() => []),
    ]).then(([data, photos]) => {
      setAllPhotos(photos)
      if (data) {
        const merged = { ...DEFAULT_EMPTY_FORM }
        for (const key of Object.keys(DEFAULT_EMPTY_FORM)) {
          if (data[key] !== null && data[key] !== undefined && data[key] !== "") merged[key] = data[key]
        }
        setForm(merged)
      } else {
        setForm({ ...DEFAULT_EMPTY_FORM })
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

  function setArrayItem(field, index, key, value) {
    const arr = [...(form?.[field] || [])]
    arr[index] = { ...arr[index], [key]: value }
    setVal(field, arr)
  }

  function addArrayItem(field, template) {
    setVal(field, [...(form?.[field] || []), { ...template }])
  }

  function removeArrayItem(field, index) {
    setConfirmAction({ type: "array", field, index })
  }
  function confirmRemoveArrayItem() {
    if (!confirmAction) return
    const arr = [...(form?.[confirmAction.field] || [])]
    arr.splice(confirmAction.index, 1)
    setVal(confirmAction.field, arr)
    setConfirmAction(null)
  }
  function confirmClearPhoto() {
    const p = confirmAction.prefix
    setVal(p + "_photo_url", null)
    setVal(p + "_photo_id", null)
    setConfirmAction(null)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateAcademyContent({
        hero_subtitle_en: form.hero_subtitle_en, hero_subtitle_ar: form.hero_subtitle_ar,
        hero_body_en: form.hero_body_en, hero_body_ar: form.hero_body_ar,
        hero_photo_url: form.hero_photo_url, hero_photo_id: form.hero_photo_id,
        why_label_en: form.why_label_en, why_label_ar: form.why_label_ar,
        why_heading_en: form.why_heading_en, why_heading_ar: form.why_heading_ar,
        why_intro_en: form.why_intro_en, why_intro_ar: form.why_intro_ar,
        why_photo_url: form.why_photo_url, why_photo_id: form.why_photo_id,
        why_body_en: form.why_body_en, why_body_ar: form.why_body_ar,
        audience_heading_en: form.audience_heading_en, audience_heading_ar: form.audience_heading_ar,
        differences: form.differences, audiences: form.audiences,
        first_course_label_en: form.first_course_label_en, first_course_label_ar: form.first_course_label_ar,
        first_course_heading_en: form.first_course_heading_en, first_course_heading_ar: form.first_course_heading_ar,
        first_course_desc_en: form.first_course_desc_en, first_course_desc_ar: form.first_course_desc_ar,
        first_course_photo_url: form.first_course_photo_url, first_course_photo_id: form.first_course_photo_id,
        focus_items: form.focus_items,
        expectations_heading_en: form.expectations_heading_en, expectations_heading_ar: form.expectations_heading_ar,
        expectations: form.expectations,
        production_label_en: form.production_label_en, production_label_ar: form.production_label_ar,
        production_heading_en: form.production_heading_en, production_heading_ar: form.production_heading_ar,
        production_intro_en: form.production_intro_en, production_intro_ar: form.production_intro_ar,
        production_photo_url: form.production_photo_url, production_photo_id: form.production_photo_id,
        production_body_en: form.production_body_en, production_body_ar: form.production_body_ar,
        production_stages: form.production_stages,
        beyond_label_en: form.beyond_label_en, beyond_label_ar: form.beyond_label_ar,
        beyond_heading_en: form.beyond_heading_en, beyond_heading_ar: form.beyond_heading_ar,
        beyond_photo_url: form.beyond_photo_url, beyond_photo_id: form.beyond_photo_id,
        beyond_body_en: form.beyond_body_en, beyond_body_ar: form.beyond_body_ar,
        upcoming_label_en: form.upcoming_label_en, upcoming_label_ar: form.upcoming_label_ar,
        upcoming_heading_en: form.upcoming_heading_en, upcoming_heading_ar: form.upcoming_heading_ar,
        upcoming_intro_en: form.upcoming_intro_en, upcoming_intro_ar: form.upcoming_intro_ar,
        upcoming_courses: form.upcoming_courses,
        faq_heading_en: form.faq_heading_en, faq_heading_ar: form.faq_heading_ar,
        faqs: form.faqs,
        cta_title_en: form.cta_title_en, cta_title_ar: form.cta_title_ar,
        cta_body_en: form.cta_body_en, cta_body_ar: form.cta_body_ar,
        cta_button_en: form.cta_button_en, cta_button_ar: form.cta_button_ar,
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
      const result = await uploadAcademyImage(new File([blob], "cropped.jpg", { type: "image/jpeg" }), prefix)
      setVal(`${prefix}_photo_url`, result.secure_url)
      setVal(`${prefix}_photo_id`, result.public_id)
    } catch (err) {
      showToast("Upload failed: " + sanitizeError(err.message), "error")
    }
    if (cropModal.isBlob) URL.revokeObjectURL(cropModal.src)
    setCropModal(null)
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
          <h1 className="text-navy dark:text-white font-bold text-xl sm:text-2xl m-0">Academy Page Editor</h1>
          <p className="text-muted dark:text-white/50 text-xs sm:text-sm m-0 mt-1">Edit Academy page — changes are bilingual (EN / AR)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="px-4 py-2 rounded-xl border border-border dark:border-[#1e2d3d] bg-white dark:bg-[#15202b] text-navy dark:text-white font-semibold text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1e2d3d] transition-colors"
          >
            {lang === "en" ? "Edit العربية" : "Edit English"}
          </button>

          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2 rounded-xl bg-navy text-white font-semibold text-sm cursor-pointer hover:bg-navy/90 transition-colors disabled:opacity-50"
          >{saving ? "Saving..." : "Save All"}</button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          HERO
         ══════════════════════════════════════════ */}
      <DarkSection id="hero" title="Hero Section" icon="fa-solid fa-display" collapsed={collapsed} onToggle={toggleCollapse}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-5">
            <div className="flex items-center w-full">
              <Diamond />
              <span className="hidden sm:block flex-1 h-[2px] bg-red" />
              <span className="text-white font-bold text-[clamp(2rem,5vw,3.25rem)] px-4 leading-tight shrink-0">Setup Academy</span>
              <span className="hidden sm:block flex-1 h-[2px] bg-red" />
              <Diamond />
            </div>
            <TextField value={val("hero_subtitle")} onChange={(v) => handleChange("hero_subtitle", v)} label="Subtitle" placeholder="Learn Content Creation Inside a Real Production Studio" dark
              onTranslate={() => translateField("hero_subtitle", val("hero_subtitle"))}
              translating={translatingField === "hero_subtitle"}
              reference={ref("hero_subtitle")}
              dir={lang === "ar" ? "rtl" : "ltr"} />
            <TextField value={val("hero_body")} onChange={(v) => handleChange("hero_body", v)} label="Body Text" type="textarea" rows={4} placeholder="Setup Academy is the educational arm of Setup Studio..." dark
              onTranslate={() => translateField("hero_body", val("hero_body"))}
              translating={translatingField === "hero_body"}
              reference={ref("hero_body")}
              dir={lang === "ar" ? "rtl" : "ltr"} />
          </div>
          <PhotoField url={form?.hero_photo_url} urlId={form?.hero_photo_id} prefix="hero" label="Hero Photo" dark aspect="aspect-video" onPick={setPhotoPicker} onClear={(p) => setConfirmAction({ type: "photo", prefix: p })} />
        </div>
      </DarkSection>

      {/* ══════════════════════════════════════════
          WHY SETUP ACADEMY
         ══════════════════════════════════════════ */}
      <LightSection id="why" title="Why Setup Academy" icon="fa-solid fa-question-circle" collapsed={collapsed} onToggle={toggleCollapse}>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="hidden sm:block w-5 h-[2px] bg-red rounded-full" />
            <LabelInput value={val("why_label")} onChange={(v) => handleChange("why_label", v)} placeholder="Why Setup Academy?"
              onTranslate={() => translateField("why_label", val("why_label"))}
              translating={translatingField === "why_label"}
              dir={lang === "ar" ? "rtl" : "ltr"} />
            <span className="hidden sm:block w-5 h-[2px] bg-red rounded-full" />
          </div>
          <div className="flex items-center w-full mb-1">
            <Diamond />
            <span className="hidden sm:block flex-1 h-[2px] bg-red" />
            <HeadingInput value={val("why_heading")} onChange={(v) => handleChange("why_heading", v)} placeholder="What Makes Us Different?"
              onTranslate={() => translateField("why_heading", val("why_heading"))}
              translating={translatingField === "why_heading"}
              dir={lang === "ar" ? "rtl" : "ltr"} />
            <span className="hidden sm:block flex-1 h-[2px] bg-red" />
            <Diamond />
          </div>
          <p className="text-[10px] text-muted dark:text-white/40 text-center mb-3 text-start" dir={lang === "en" ? "rtl" : "ltr"}>
            {ref("why_heading") || "—"}
          </p>
          <div className="max-w-[600px] mx-auto w-full">
            <TextField value={val("why_intro")} onChange={(v) => handleChange("why_intro", v)} label="" placeholder="Learning happens where real production happens."
              onTranslate={() => translateField("why_intro", val("why_intro"))}
              translating={translatingField === "why_intro"}
              reference={ref("why_intro")}
              dir={lang === "ar" ? "rtl" : "ltr"} />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-8">
          <PhotoField url={form?.why_photo_url} urlId={form?.why_photo_id} prefix="why" label="Photo" onPick={setPhotoPicker} onClear={(p) => setConfirmAction({ type: "photo", prefix: p })} />
          <TextField value={val("why_body")} onChange={(v) => handleChange("why_body", v)} label="Body Paragraph" type="textarea" rows={4} placeholder="Instead of traditional theory-heavy courses..."
            onTranslate={() => translateField("why_body", val("why_body"))}
            translating={translatingField === "why_body"}
            reference={ref("why_body")}
            dir={lang === "ar" ? "rtl" : "ltr"} />
        </div>
        <div>
            <span className="text-navy/50 dark:text-white/50 text-xs font-medium mb-2 block">Differences</span>
          {(form?.differences || defaultDifferences).map((item, i) => (
            <div key={i} className="mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-[0.7rem] h-[0.7rem] text-red shrink-0" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M4.5 8.5L2 6l-.7.7L4.5 10l6-6-.7-.7z" />
                </svg>
                <div className="flex-1 flex items-center gap-1">
                  <input type="text"
                    value={lang === "en" ? item.en : item.ar}
                    onChange={(e) => setArrayItem("differences", i, lang === "en" ? "en" : "ar", e.target.value)}
                    className="flex-1 min-w-0 bg-gray-50 dark:bg-[#15202b] border border-border dark:border-[#1e2d3d] rounded-lg px-3 py-1.5 text-navy/70 dark:text-white/50 text-sm outline-none focus:border-navy/40 transition-colors text-start"
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    placeholder={lang === "en" ? "Difference text..." : "نص الفرق..."} />
                  <button onClick={async () => {
                    const src = lang === "en" ? item.en : item.ar
                    if (!src?.trim) return
                    const key = `diff_${i}`; setTranslatingField(key)
                    try { const r = await translateObject(src, lang, lang === "en" ? "ar" : "en"); setArrayItem("differences", i, lang === "en" ? "ar" : "en", r) }
                    catch(e) { showToast("Translate failed: " + sanitizeError(e.message), "error") }
                    setTranslatingField(null)
                  }}
                    disabled={translatingField === `diff_${i}`}
                    className="shrink-0 w-6 h-6 rounded-md bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40 disabled:opacity-40"
                    title="Translate">
                    <i className={`fa-solid fa-language text-[9px] ${translatingField === `diff_${i}` ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <button onClick={() => removeArrayItem("differences", i)}
                  className="w-6 h-6 rounded-full bg-red/10 text-red text-xs border-0 cursor-pointer hover:bg-red/20 transition-colors flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
              <p className="text-[10px] text-muted dark:text-white/40 mt-0.5 ml-5 text-start" dir={lang === "en" ? "rtl" : "ltr"}>
                {lang === "en" ? (item.ar || "—") : (item.en || "—")}
              </p>
            </div>
          ))}
          <button onClick={() => addArrayItem("differences", { en: "", ar: "" })}
            className="mt-2 px-3 py-1.5 rounded-lg bg-navy/5 text-navy text-xs font-semibold border-0 cursor-pointer hover:bg-navy/10 transition-colors">
            <i className="fa-solid fa-plus mr-1" />Add difference
          </button>
        </div>
      </LightSection>

      {/* ══════════════════════════════════════════
          AUDIENCES
         ══════════════════════════════════════════ */}
      <LightSection id="audiences" title="Who Is It For" icon="fa-solid fa-users" bg="bg-[#f8f9fb]" collapsed={collapsed} onToggle={toggleCollapse}>
        <div className="flex items-center w-full mb-6 justify-center">
          <Diamond />
          <span className="hidden sm:block flex-1 h-[2px] bg-red" />
          <HeadingInput value={val("audience_heading")} onChange={(v) => handleChange("audience_heading", v)} placeholder="Who Is Setup Academy For?"
            onTranslate={() => translateField("audience_heading", val("audience_heading"))}
            translating={translatingField === "audience_heading"}
            dir={lang === "ar" ? "rtl" : "ltr"} />
          <span className="hidden sm:block flex-1 h-[2px] bg-red" />
          <Diamond />
        </div>
        <p className="text-[10px] text-muted dark:text-white/40 text-center -mt-4 mb-4" dir={lang === "en" ? "rtl" : "ltr"}>
          {ref("audience_heading") || "—"}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(form?.audiences || defaultAudiences).map((item, i) => (
            <div key={i} className="p-5 rounded-2xl border border-border dark:border-[#1e2d3d] bg-white dark:bg-[#0f1a24] relative group flex flex-col items-center text-center">
              <button onClick={() => removeArrayItem("audiences", i)}
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red/80 text-white text-xs border-0 cursor-pointer hover:bg-red transition-colors flex items-center justify-center z-10">
                <i className="fa-solid fa-xmark" />
              </button>
              <span className="w-10 h-10 rounded-full bg-navy text-white font-bold flex items-center justify-center mb-3">{i + 1}</span>
              <div className="flex items-center gap-1 mb-2 w-full">
                <input type="text"
                  value={lang === "en" ? item.titleEn : item.titleAr}
                  onChange={(e) => setArrayItem("audiences", i, lang === "en" ? "titleEn" : "titleAr", e.target.value)}
                  className="flex-1 min-w-0 bg-gray-50 dark:bg-[#15202b] border border-border dark:border-[#1e2d3d] rounded-xl px-3 py-2 text-navy dark:text-white font-bold text-sm outline-none focus:border-navy/40 transition-colors text-start"
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  placeholder={lang === "en" ? "Title..." : "العنوان..."} />
                <button onClick={async () => {
                  const src = lang === "en" ? item.titleEn : item.titleAr
                  if (!src?.trim) return
                  const k = `aud_title_${i}`; setTranslatingField(k)
                  try { const r = await translateObject(src, lang, lang === "en" ? "ar" : "en"); setArrayItem("audiences", i, lang === "en" ? "titleAr" : "titleEn", r) }
                  catch(e) { showToast("Translate failed: " + sanitizeError(e.message), "error") }
                  setTranslatingField(null)
                }}
                  className="shrink-0 w-6 h-6 rounded-md bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40">
                  <i className="fa-solid fa-language text-[9px]" />
                </button>
              </div>
              <p className="text-[9px] text-muted dark:text-white/40 -mt-1 mb-2 w-full text-start" dir={lang === "en" ? "rtl" : "ltr"}>
                {lang === "en" ? (item.titleAr || "—") : (item.titleEn || "—")}
              </p>
              <div className="flex items-start gap-1 w-full">
                <textarea
                  value={lang === "en" ? item.descEn : item.descAr}
                  onChange={(e) => setArrayItem("audiences", i, lang === "en" ? "descEn" : "descAr", e.target.value)}
                  className="flex-1 min-w-0 bg-gray-50 dark:bg-[#15202b] border border-border dark:border-[#1e2d3d] rounded-xl px-3 py-2 text-navy/60 dark:text-white/50 text-sm outline-none focus:border-navy/40 transition-colors resize-none text-start"
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  rows={2} placeholder={lang === "en" ? "Description..." : "الوصف..."} />
                <button onClick={async () => {
                  const src = lang === "en" ? item.descEn : item.descAr
                  if (!src?.trim) return
                  const k = `aud_desc_${i}`; setTranslatingField(k)
                  try { const r = await translateObject(src, lang, lang === "en" ? "ar" : "en"); setArrayItem("audiences", i, lang === "en" ? "descAr" : "descEn", r) }
                  catch(e) { showToast("Translate failed: " + sanitizeError(e.message), "error") }
                  setTranslatingField(null)
                }}
                  className="shrink-0 w-6 h-6 rounded-md bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40 mt-0.5">
                  <i className="fa-solid fa-language text-[9px]" />
                </button>
              </div>
              <p className="text-[9px] text-muted dark:text-white/40 mt-1 w-full text-start" dir={lang === "en" ? "rtl" : "ltr"}>
                {lang === "en" ? (item.descAr || "—") : (item.descEn || "—")}
              </p>
            </div>
          ))}
        </div>
        <button onClick={() => addArrayItem("audiences", { titleEn: "", titleAr: "", descEn: "", descAr: "" })}
          className="mt-3 px-3 py-1.5 rounded-lg bg-navy/5 text-navy text-xs font-semibold border-0 cursor-pointer hover:bg-navy/10 transition-colors">
          <i className="fa-solid fa-plus mr-1" />Add audience
        </button>
      </LightSection>

      {/* ══════════════════════════════════════════
          FIRST COURSE
         ══════════════════════════════════════════ */}
      <DarkSection id="firstCourse" title="First Course" icon="fa-solid fa-graduation-cap" collapsed={collapsed} onToggle={toggleCollapse}>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="hidden sm:block w-5 h-[2px] bg-red rounded-full" />
            <LabelInput value={val("first_course_label")} onChange={(v) => handleChange("first_course_label", v)} dark placeholder="Our First Course"
              onTranslate={() => translateField("first_course_label", val("first_course_label"))}
              translating={translatingField === "first_course_label"}
              dir={lang === "ar" ? "rtl" : "ltr"} />
            <span className="hidden sm:block w-5 h-[2px] bg-red rounded-full" />
          </div>
        </div>
        <div className="max-w-[800px] mx-auto">
            <div className="rounded-3xl border border-white/10 bg-white dark:bg-[#0f1a24] overflow-hidden">
              <PhotoField url={form?.first_course_photo_url} urlId={form?.first_course_photo_id} prefix="first_course" label="Course Card Photo" aspect="aspect-video" onPick={setPhotoPicker} onClear={(p) => setConfirmAction({ type: "photo", prefix: p })} />
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-navy/10 dark:bg-white/10 flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-video text-navy dark:text-white" />
                  </div>
                  <input type="text" value={val("first_course_heading")} onChange={(e) => handleChange("first_course_heading", e.target.value)}
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    className="flex-1 min-w-0 bg-gray-50 dark:bg-[#15202b] border border-border dark:border-[#1e2d3d] rounded-xl px-3 py-2 text-navy dark:text-white font-bold text-sm outline-none focus:border-navy/40 transition-colors text-start" placeholder={lang === "en" ? "Video Content Foundation Course" : "دورة أساسيات إنتاج المحتوى المرئي"} />
                  <button onClick={() => translateField("first_course_heading", val("first_course_heading"))}
                    className="shrink-0 w-7 h-7 rounded-md bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40"
                    title="Translate">
                    <i className={`fa-solid fa-language text-[9px] ${translatingField === "first_course_heading" ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <p className="text-[10px] text-muted dark:text-white/40 -mt-3 mb-2 text-start" dir={lang === "en" ? "rtl" : "ltr"}>{ref("first_course_heading") || "—"}</p>
                <div className="flex items-start gap-1">
                  <textarea value={val("first_course_desc")} onChange={(e) => handleChange("first_course_desc", e.target.value)}
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    className="flex-1 min-w-0 bg-gray-50 dark:bg-[#15202b] border border-border dark:border-[#1e2d3d] rounded-xl px-3 py-2 text-navy/60 dark:text-white/50 text-sm outline-none focus:border-navy/40 transition-colors resize-none text-start" rows={2} placeholder={lang === "en" ? "Designed for beginners who want to understand video production..." : "مصممة للمبتدئين الذين يرغبون في فهم إنتاج الفيديو..."} />
                  <button onClick={() => translateField("first_course_desc", val("first_course_desc"))}
                    className="shrink-0 w-7 h-7 rounded-md bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40 mt-0.5"
                    title="Translate">
                    <i className={`fa-solid fa-language text-[9px] ${translatingField === "first_course_desc" ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <p className="text-[10px] text-muted dark:text-white/40 -mt-2 text-start" dir={lang === "en" ? "rtl" : "ltr"}>{ref("first_course_desc") || "—"}</p>
                <div className="bg-[#f8f9fb] dark:bg-[#15202b] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-navy dark:text-white font-semibold text-sm flex items-center gap-2">
                      <i className="fa-solid fa-list-check text-red text-xs" />Course Focus
                    </span>
                  <button onClick={() => addArrayItem("focus_items", { en: "", ar: "" })}
                    className="px-2 py-1 rounded-lg bg-navy/5 text-navy text-xs font-semibold border-0 cursor-pointer hover:bg-navy/10 transition-colors">
                    <i className="fa-solid fa-plus mr-1" />Add
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(form?.focus_items || defaultFocusItems).map((item, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red shrink-0" />
                        <input type="text"
                          value={lang === "en" ? item.en : item.ar}
                          onChange={(e) => setArrayItem("focus_items", i, lang === "en" ? "en" : "ar", e.target.value)}
                          className="flex-1 min-w-0 bg-white dark:bg-[#0f1a24] border border-border dark:border-[#1e2d3d] rounded-lg px-2 py-1 text-navy/60 dark:text-white/50 text-xs outline-none focus:border-navy/40 transition-colors text-start"
                          dir={lang === "ar" ? "rtl" : "ltr"}
                          placeholder={lang === "en" ? "Focus item..." : "عنصر التركيز..."} />
                        <button onClick={async () => {
                          const src = lang === "en" ? item.en : item.ar
                          if (!src?.trim) return
                          const k = `focus_${i}`; setTranslatingField(k)
                          try { const r = await translateObject(src, lang, lang === "en" ? "ar" : "en"); setArrayItem("focus_items", i, lang === "en" ? "ar" : "en", r) }
                          catch(e) { showToast("Translate failed: " + sanitizeError(e.message), "error") }
                          setTranslatingField(null)
                        }}
                          className="shrink-0 w-5 h-5 rounded bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40">
                          <i className="fa-solid fa-language text-[8px]" />
                        </button>
                        <button onClick={() => removeArrayItem("focus_items", i)}
                          className="w-5 h-5 rounded-full bg-red/10 text-red text-xs border-0 cursor-pointer hover:bg-red/20 transition-colors flex items-center justify-center shrink-0">
                          <i className="fa-solid fa-xmark" />
                        </button>
                      </div>
                      <p className="text-[9px] text-muted dark:text-white/40 mt-0.5 ml-3 text-start" dir={lang === "en" ? "rtl" : "ltr"}>
                        {lang === "en" ? (item.ar || "—") : (item.en || "—")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
        </div>
      </DarkSection>

      {/* ══════════════════════════════════════════
          EXPECTATIONS
         ══════════════════════════════════════════ */}
      <DarkSection id="expectations" title="What Students Can Expect" icon="fa-solid fa-star" collapsed={collapsed} onToggle={toggleCollapse}>
        <div className="flex items-center w-full mb-6 justify-center">
          <Diamond />
          <span className="hidden sm:block flex-1 h-[2px] bg-red" />
          <HeadingInput value={val("expectations_heading")} onChange={(v) => handleChange("expectations_heading", v)} dark placeholder="What Students Can Expect"
            onTranslate={() => translateField("expectations_heading", val("expectations_heading"))}
            translating={translatingField === "expectations_heading"}
            dir={lang === "ar" ? "rtl" : "ltr"} />
          <span className="hidden sm:block flex-1 h-[2px] bg-red" />
          <Diamond />
        </div>
        <p className="text-[10px] text-muted dark:text-white/40 text-center -mt-4 mb-4 text-start" dir={lang === "en" ? "rtl" : "ltr"}>
          {ref("expectations_heading") || "—"}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(form?.expectations || defaultExpectations).map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-3 p-5 rounded-2xl border border-white/10 bg-white/5">
              <div className="w-14 h-14 rounded-full bg-red/20 flex items-center justify-center">
                <i className={`${item.icon || "fa-solid fa-star"} text-red text-lg`} />
              </div>
              <div className="flex items-center gap-1 w-full">
                <input type="text"
                  value={lang === "en" ? item.textEn : item.textAr}
                  onChange={(e) => setArrayItem("expectations", i, lang === "en" ? "textEn" : "textAr", e.target.value)}
                  className="flex-1 min-w-0 bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-white/70 text-xs outline-none focus:border-white/30 transition-colors text-center"
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  placeholder={lang === "en" ? "Text..." : "النص..."} />
                <button onClick={async () => {
                  const src = lang === "en" ? item.textEn : item.textAr
                  if (!src?.trim) return
                  const k = `expect_${i}`; setTranslatingField(k)
                  try { const r = await translateObject(src, lang, lang === "en" ? "ar" : "en"); setArrayItem("expectations", i, lang === "en" ? "textAr" : "textEn", r) }
                  catch(e) { showToast("Translate failed: " + sanitizeError(e.message), "error") }
                  setTranslatingField(null)
                }}
                  className="shrink-0 w-5 h-5 rounded bg-white/10 hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-white/40">
                  <i className="fa-solid fa-language text-[8px]" />
                </button>
              </div>
              <p className="text-[9px] text-white/40 -mt-2 text-center" dir={lang === "en" ? "rtl" : "ltr"}>
                {lang === "en" ? (item.textAr || "—") : (item.textEn || "—")}
              </p>
            </div>
          ))}
        </div>
      </DarkSection>

      {/* ══════════════════════════════════════════
          PRODUCTION
         ══════════════════════════════════════════ */}
      <LightSection id="production" title="Full Production Experience" icon="fa-solid fa-film" collapsed={collapsed} onToggle={toggleCollapse}>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="hidden sm:block w-5 h-[2px] bg-red rounded-full" />
            <LabelInput value={val("production_label")} onChange={(v) => handleChange("production_label", v)} placeholder="Full Production"
              onTranslate={() => translateField("production_label", val("production_label"))}
              translating={translatingField === "production_label"}
              dir={lang === "ar" ? "rtl" : "ltr"} />
            <span className="hidden sm:block w-5 h-[2px] bg-red rounded-full" />
          </div>
          <div className="flex items-center w-full mb-3">
            <Diamond />
            <span className="hidden sm:block flex-1 h-[2px] bg-red" />
            <HeadingInput value={val("production_heading")} onChange={(v) => handleChange("production_heading", v)} placeholder="Beyond Just Shooting"
              onTranslate={() => translateField("production_heading", val("production_heading"))}
              translating={translatingField === "production_heading"}
              dir={lang === "ar" ? "rtl" : "ltr"} />
            <span className="hidden sm:block flex-1 h-[2px] bg-red" />
            <Diamond />
          </div>
          <p className="text-[10px] text-muted dark:text-white/40 -mt-2 mb-3 text-start" dir={lang === "en" ? "rtl" : "ltr"}>{ref("production_heading") || "—"}</p>
          <div className="max-w-[600px] mx-auto w-full">
            <TextField value={val("production_intro")} onChange={(v) => handleChange("production_intro", v)} label="" placeholder="We teach the complete production journey..."
              onTranslate={() => translateField("production_intro", val("production_intro"))}
              translating={translatingField === "production_intro"} reference={ref("production_intro")}
              dir={lang === "ar" ? "rtl" : "ltr"} />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-8">
          <PhotoField url={form?.production_photo_url} urlId={form?.production_photo_id} prefix="production" label="Photo" onPick={setPhotoPicker} onClear={(p) => setConfirmAction({ type: "photo", prefix: p })} />
          <TextField value={val("production_body")} onChange={(v) => handleChange("production_body", v)} label="Body Paragraph" type="textarea" rows={4} placeholder="Setup Academy teaches the complete production workflow..."
            onTranslate={() => translateField("production_body", val("production_body"))}
            translating={translatingField === "production_body"} reference={ref("production_body")}
            dir={lang === "ar" ? "rtl" : "ltr"} />
        </div>
            <span className="text-navy/50 dark:text-white/50 text-xs font-medium mb-3 block">Production Stages</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(form?.production_stages || defaultProductionStages).map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-4 pt-8 sm:pt-4 rounded-xl border border-border dark:border-[#1e2d3d] bg-white dark:bg-[#0f1a24] relative">
              <div className="w-9 h-9 rounded-lg bg-navy/10 dark:bg-white/10 flex items-center justify-center shrink-0">
                <i className={`${item.icon || "fa-solid fa-video"} text-navy dark:text-white text-sm`} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-1">
                  <input type="text"
                    value={lang === "en" ? item.titleEn : item.titleAr}
                    onChange={(e) => setArrayItem("production_stages", i, lang === "en" ? "titleEn" : "titleAr", e.target.value)}
                    className="flex-1 min-w-0 bg-gray-50 dark:bg-[#15202b] border border-border dark:border-[#1e2d3d] rounded-lg px-3 py-1.5 text-navy dark:text-white font-semibold text-sm outline-none focus:border-navy/40 transition-colors mb-2 text-start"
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    placeholder={lang === "en" ? "Title..." : "العنوان..."} />
                  <button onClick={async () => {
                    const src = lang === "en" ? item.titleEn : item.titleAr
                    if (!src?.trim) return
                    const k = `prod_title_${i}`; setTranslatingField(k)
                    try { const r = await translateObject(src, lang, lang === "en" ? "ar" : "en"); setArrayItem("production_stages", i, lang === "en" ? "titleAr" : "titleEn", r) }
                    catch(e) { showToast("Translate failed: " + sanitizeError(e.message), "error") }
                    setTranslatingField(null)
                  }}
                    className="shrink-0 w-5 h-5 rounded bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40 mb-2">
                    <i className="fa-solid fa-language text-[8px]" />
                  </button>
                </div>
                <p className="text-[9px] text-muted dark:text-white/40 -mt-2 mb-1 ml-1 text-start" dir={lang === "en" ? "rtl" : "ltr"}>
                  {lang === "en" ? (item.titleAr || "—") : (item.titleEn || "—")}
                </p>
                <div className="flex items-start gap-1">
                  <textarea
                    value={lang === "en" ? item.descEn : item.descAr}
                    onChange={(e) => setArrayItem("production_stages", i, lang === "en" ? "descEn" : "descAr", e.target.value)}
                    className="flex-1 min-w-0 bg-gray-50 dark:bg-[#15202b] border border-border dark:border-[#1e2d3d] rounded-lg px-3 py-1.5 text-navy/50 dark:text-white/50 text-xs outline-none focus:border-navy/40 transition-colors resize-none text-start"
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    rows={2} placeholder={lang === "en" ? "Description..." : "الوصف..."} />
                  <button onClick={async () => {
                    const src = lang === "en" ? item.descEn : item.descAr
                    if (!src?.trim) return
                    const k = `prod_desc_${i}`; setTranslatingField(k)
                    try { const r = await translateObject(src, lang, lang === "en" ? "ar" : "en"); setArrayItem("production_stages", i, lang === "en" ? "descAr" : "descEn", r) }
                    catch(e) { showToast("Translate failed: " + sanitizeError(e.message), "error") }
                    setTranslatingField(null)
                  }}
                    className="shrink-0 w-5 h-5 rounded bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40 mt-0.5">
                    <i className="fa-solid fa-language text-[8px]" />
                  </button>
                </div>
                <p className="text-[9px] text-muted dark:text-white/40 -mt-1 ml-1 text-start" dir={lang === "en" ? "rtl" : "ltr"}>
                  {lang === "en" ? (item.descAr || "—") : (item.descEn || "—")}
                </p>
              </div>
              <button onClick={() => removeArrayItem("production_stages", i)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red/10 text-red text-xs border-0 cursor-pointer hover:bg-red/20 transition-colors flex items-center justify-center">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => addArrayItem("production_stages", { icon: "fa-solid fa-", titleEn: "", titleAr: "", descEn: "", descAr: "" })}
          className="mt-3 px-3 py-1.5 rounded-lg bg-navy/5 text-navy text-xs font-semibold border-0 cursor-pointer hover:bg-navy/10 transition-colors">
          <i className="fa-solid fa-plus mr-1" />Add stage
        </button>
      </LightSection>

      {/* ══════════════════════════════════════════
          BEYOND THE COURSE
         ══════════════════════════════════════════ */}
      <DarkSection id="beyond" title="Beyond the Course" icon="fa-solid fa-rocket" collapsed={collapsed} onToggle={toggleCollapse}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <PhotoField url={form?.beyond_photo_url} urlId={form?.beyond_photo_id} prefix="beyond" label="Photo" dark onPick={setPhotoPicker} onClear={(p) => setConfirmAction({ type: "photo", prefix: p })} />
          <div className="space-y-4">
            <LabelInput value={val("beyond_label")} onChange={(v) => handleChange("beyond_label", v)} dark placeholder="Beyond the Course"
              onTranslate={() => translateField("beyond_label", val("beyond_label"))}
              translating={translatingField === "beyond_label"}
              dir={lang === "ar" ? "rtl" : "ltr"} />
            <div className="flex items-center w-full">
              <Diamond />
              <span className="hidden sm:block flex-1 h-[2px] bg-red" />
              <HeadingInput value={val("beyond_heading")} onChange={(v) => handleChange("beyond_heading", v)} dark placeholder="More Than Just a Course"
                onTranslate={() => translateField("beyond_heading", val("beyond_heading"))}
                translating={translatingField === "beyond_heading"}
                dir={lang === "ar" ? "rtl" : "ltr"} />
              <span className="hidden sm:block flex-1 h-[2px] bg-red" />
              <Diamond />
            </div>
            <p className="text-[10px] text-muted dark:text-white/40 -mt-2 text-start" dir={lang === "en" ? "rtl" : "ltr"}>{ref("beyond_heading") || "—"}</p>
            <TextField value={val("beyond_body")} onChange={(v) => handleChange("beyond_body", v)} label="" type="textarea" rows={5} placeholder="Setup Academy is about helping learners..." dark
              onTranslate={() => translateField("beyond_body", val("beyond_body"))}
              translating={translatingField === "beyond_body"} reference={ref("beyond_body")}
              dir={lang === "ar" ? "rtl" : "ltr"} />
          </div>
        </div>
      </DarkSection>

      {/* ══════════════════════════════════════════
          UPCOMING COURSES
         ══════════════════════════════════════════ */}
      <LightSection id="upcoming" title="Upcoming Courses" icon="fa-solid fa-calendar-plus" collapsed={collapsed} onToggle={toggleCollapse}>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="hidden sm:block w-5 h-[2px] bg-red rounded-full" />
            <LabelInput value={val("upcoming_label")} onChange={(v) => handleChange("upcoming_label", v)} placeholder="Coming Soon"
              onTranslate={() => translateField("upcoming_label", val("upcoming_label"))}
              translating={translatingField === "upcoming_label"}
              dir={lang === "ar" ? "rtl" : "ltr"} />
            <span className="hidden sm:block w-5 h-[2px] bg-red rounded-full" />
          </div>
          <div className="flex items-center w-full mb-3">
            <Diamond />
            <span className="hidden sm:block flex-1 h-[2px] bg-red" />
            <HeadingInput value={val("upcoming_heading")} onChange={(v) => handleChange("upcoming_heading", v)} placeholder="Upcoming Courses"
              onTranslate={() => translateField("upcoming_heading", val("upcoming_heading"))}
              translating={translatingField === "upcoming_heading"}
              dir={lang === "ar" ? "rtl" : "ltr"} />
            <span className="hidden sm:block flex-1 h-[2px] bg-red" />
            <Diamond />
          </div>
          <p className="text-[10px] text-muted dark:text-white/40 -mt-2 mb-3 text-start" dir={lang === "en" ? "rtl" : "ltr"}>{ref("upcoming_heading") || "—"}</p>
          <div className="max-w-[600px] mx-auto w-full">
            <TextField value={val("upcoming_intro")} onChange={(v) => handleChange("upcoming_intro", v)} label="" placeholder="We're building a full catalog..."
              onTranslate={() => translateField("upcoming_intro", val("upcoming_intro"))}
              translating={translatingField === "upcoming_intro"} reference={ref("upcoming_intro")}
              dir={lang === "ar" ? "rtl" : "ltr"} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(form?.upcoming_courses || defaultUpcomingCourses).map((item, i) => (
            <div key={i} className="p-5 rounded-2xl border border-border dark:border-[#1e2d3d] bg-white dark:bg-[#0f1a24]">
              <div className="w-10 h-10 rounded-full bg-navy/10 dark:bg-white/10 flex items-center justify-center mb-3">
                <i className={`${item.icon || "fa-solid fa-"} text-navy dark:text-white text-sm`} />
              </div>
              <div className="flex items-center gap-1">
                <input type="text"
                  value={lang === "en" ? item.titleEn : item.titleAr}
                  onChange={(e) => setArrayItem("upcoming_courses", i, lang === "en" ? "titleEn" : "titleAr", e.target.value)}
                  className="flex-1 min-w-0 bg-gray-50 dark:bg-[#15202b] border border-border dark:border-[#1e2d3d] rounded-xl px-3 py-2 text-navy dark:text-white font-bold text-sm outline-none focus:border-navy/40 transition-colors mb-1 text-start"
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  placeholder={lang === "en" ? "Title..." : "العنوان..."} />
                <button onClick={async () => {
                  const src = lang === "en" ? item.titleEn : item.titleAr
                  if (!src?.trim) return
                  const k = `up_title_${i}`; setTranslatingField(k)
                  try { const r = await translateObject(src, lang, lang === "en" ? "ar" : "en"); setArrayItem("upcoming_courses", i, lang === "en" ? "titleAr" : "titleEn", r) }
                  catch(e) { showToast("Translate failed: " + sanitizeError(e.message), "error") }
                  setTranslatingField(null)
                }}
                  className="shrink-0 w-5 h-5 rounded bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40 mb-1">
                  <i className="fa-solid fa-language text-[8px]" />
                </button>
              </div>
              <p className="text-[9px] text-muted dark:text-white/40 -mt-1 mb-2 ml-1 text-start" dir={lang === "en" ? "rtl" : "ltr"}>
                {lang === "en" ? (item.titleAr || "—") : (item.titleEn || "—")}
              </p>
              <div className="flex items-start gap-1">
                <textarea
                  value={lang === "en" ? item.descEn : item.descAr}
                  onChange={(e) => setArrayItem("upcoming_courses", i, lang === "en" ? "descEn" : "descAr", e.target.value)}
                  className="flex-1 min-w-0 bg-gray-50 dark:bg-[#15202b] border border-border dark:border-[#1e2d3d] rounded-xl px-3 py-2 text-navy/50 dark:text-white/50 text-sm outline-none focus:border-navy/40 transition-colors resize-none text-start"
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  rows={2} placeholder={lang === "en" ? "Description..." : "الوصف..."} />
                <button onClick={async () => {
                  const src = lang === "en" ? item.descEn : item.descAr
                  if (!src?.trim) return
                  const k = `up_desc_${i}`; setTranslatingField(k)
                  try { const r = await translateObject(src, lang, lang === "en" ? "ar" : "en"); setArrayItem("upcoming_courses", i, lang === "en" ? "descAr" : "descEn", r) }
                  catch(e) { showToast("Translate failed: " + sanitizeError(e.message), "error") }
                  setTranslatingField(null)
                }}
                  className="shrink-0 w-5 h-5 rounded bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40 mt-0.5">
                  <i className="fa-solid fa-language text-[8px]" />
                </button>
              </div>
              <p className="text-[9px] text-muted dark:text-white/40 mt-0.5 ml-1 text-start" dir={lang === "en" ? "rtl" : "ltr"}>
                {lang === "en" ? (item.descAr || "—") : (item.descEn || "—")}
              </p>
            </div>
          ))}
        </div>
      </LightSection>

      {/* ══════════════════════════════════════════
          FAQ
         ══════════════════════════════════════════ */}
      <LightSection id="faq" title="FAQ" icon="fa-solid fa-circle-question" bg="bg-[#f8f9fb]" collapsed={collapsed} onToggle={toggleCollapse}>
        <div className="flex items-center w-full mb-6 justify-center">
          <Diamond />
          <span className="hidden sm:block flex-1 h-[2px] bg-red" />
          <HeadingInput value={val("faq_heading")} onChange={(v) => handleChange("faq_heading", v)} placeholder="Frequently Asked Questions"
            onTranslate={() => translateField("faq_heading", val("faq_heading"))}
            translating={translatingField === "faq_heading"}
            dir={lang === "ar" ? "rtl" : "ltr"} />
          <span className="hidden sm:block flex-1 h-[2px] bg-red" />
          <Diamond />
        </div>
        <p className="text-[10px] text-muted dark:text-white/40 text-center -mt-4 mb-4 text-start" dir={lang === "en" ? "rtl" : "ltr"}>
          {ref("faq_heading") || "—"}
        </p>
        <div className="max-w-[800px] mx-auto space-y-3">
          {(form?.faqs || defaultFaqs).map((item, i) => (
            <div key={i} className="rounded-2xl border border-border dark:border-[#1e2d3d] bg-white dark:bg-[#0f1a24] p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 flex-1">
                  <input type="text"
                    value={lang === "en" ? item.qEn : item.qAr}
                    onChange={(e) => setArrayItem("faqs", i, lang === "en" ? "qEn" : "qAr", e.target.value)}
                    className="flex-1 min-w-0 bg-gray-50 dark:bg-[#15202b] border border-border dark:border-[#1e2d3d] rounded-xl px-4 py-2 text-navy dark:text-white font-semibold text-sm outline-none focus:border-navy/40 transition-colors text-start"
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    placeholder={lang === "en" ? "Question..." : "السؤال..."} />
                  <button onClick={async () => {
                    const src = lang === "en" ? item.qEn : item.qAr
                    if (!src?.trim) return
                    const k = `faq_q_${i}`; setTranslatingField(k)
                    try { const r = await translateObject(src, lang, lang === "en" ? "ar" : "en"); setArrayItem("faqs", i, lang === "en" ? "qAr" : "qEn", r) }
                    catch(e) { showToast("Translate failed: " + sanitizeError(e.message), "error") }
                    setTranslatingField(null)
                  }}
                    className="shrink-0 w-6 h-6 rounded-md bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40">
                    <i className="fa-solid fa-language text-[9px]" />
                  </button>
                </div>
              </div>
              <p className="text-[9px] text-muted dark:text-white/40 mb-2 ml-1 text-start" dir={lang === "en" ? "rtl" : "ltr"}>
                {lang === "en" ? (item.qAr || "—") : (item.qEn || "—")}
              </p>
              <div className="flex items-start gap-1">
                <textarea
                  value={lang === "en" ? item.aEn : item.aAr}
                  onChange={(e) => setArrayItem("faqs", i, lang === "en" ? "aEn" : "aAr", e.target.value)}
                  className="flex-1 min-w-0 bg-gray-50 dark:bg-[#15202b] border border-border dark:border-[#1e2d3d] rounded-xl px-4 py-2 text-navy/60 dark:text-white/50 text-sm outline-none focus:border-navy/40 transition-colors resize-none text-start"
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  rows={2} placeholder={lang === "en" ? "Answer..." : "الإجابة..."} />
                <button onClick={async () => {
                  const src = lang === "en" ? item.aEn : item.aAr
                  if (!src?.trim) return
                  const k = `faq_a_${i}`; setTranslatingField(k)
                  try { const r = await translateObject(src, lang, lang === "en" ? "ar" : "en"); setArrayItem("faqs", i, lang === "en" ? "aAr" : "aEn", r) }
                  catch(e) { showToast("Translate failed: " + sanitizeError(e.message), "error") }
                  setTranslatingField(null)
                }}
                  className="shrink-0 w-6 h-6 rounded-md bg-navy/5 dark:bg-white/10 hover:bg-navy/10 dark:hover:bg-white/20 border-0 cursor-pointer flex items-center justify-center text-navy/40 dark:text-white/40 mt-0.5">
                  <i className="fa-solid fa-language text-[9px]" />
                </button>
              </div>
              <p className="text-[9px] text-muted dark:text-white/40 mt-0.5 ml-1 text-start" dir={lang === "en" ? "rtl" : "ltr"}>
                {lang === "en" ? (item.aAr || "—") : (item.aEn || "—")}
              </p>
            </div>
          ))}
        </div>
      </LightSection>

      {/* ══════════════════════════════════════════
          CTA
         ══════════════════════════════════════════ */}
      <DarkSection id="cta" title="Final CTA" icon="fa-solid fa-rectangle-ad" collapsed={collapsed} onToggle={toggleCollapse}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-3 flex-1">
            <div className="flex items-center w-full">
              <Diamond />
              <span className="hidden sm:block flex-1 h-[2px] bg-red" />
              <HeadingInput value={val("cta_title")} onChange={(v) => handleChange("cta_title", v)} dark placeholder="Start Your Creative Journey"
                onTranslate={() => translateField("cta_title", val("cta_title"))}
                translating={translatingField === "cta_title"}
                dir={lang === "ar" ? "rtl" : "ltr"} />
              <span className="hidden sm:block flex-1 h-[2px] bg-red" />
              <Diamond />
            </div>
            <p className="text-[10px] text-muted dark:text-white/40 text-center -mt-2 text-start" dir={lang === "en" ? "rtl" : "ltr"}>{ref("cta_title") || "—"}</p>
            <TextField value={val("cta_body")} onChange={(v) => handleChange("cta_body", v)} label="" dark placeholder="Join our first Video Content Foundation Course..."
              onTranslate={() => translateField("cta_body", val("cta_body"))}
              translating={translatingField === "cta_body"} reference={ref("cta_body")}
              dir={lang === "ar" ? "rtl" : "ltr"} />
          </div>
          <TextField value={val("cta_button")} onChange={(v) => handleChange("cta_button", v)} label="Button Text" dark placeholder="Join the Waiting List"
            onTranslate={() => translateField("cta_button", val("cta_button"))}
            translating={translatingField === "cta_button"} reference={ref("cta_button")}
            dir={lang === "ar" ? "rtl" : "ltr"} />
        </div>
      </DarkSection>

      {/* ═══ PHOTO PICKER MODAL ═══ */}
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
                <button onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold cursor-pointer hover:bg-navy/90 transition-colors border-0">
                  <i className="fa-solid fa-upload mr-2" />Upload New Photo
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadNew} />
              </div>
              {allPhotos.length === 0 ? (
                <p className="text-muted dark:text-white/50 text-sm text-center py-8">No photos found in the database.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {allPhotos.map((photo) => (
                    <button key={photo.id} onClick={() => handlePickPhoto(photo)}
                      className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-[#0f1a24] border-2 border-transparent hover:border-navy transition-all cursor-pointer p-0 group relative">
                      <img src={optimizeImageUrl(photo.cloudinary_url, 200)} alt="" className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] font-medium px-2 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">{photo.category}</div>
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
      {confirmAction?.type === "array" && (
        <ConfirmModal
          message={`Remove this item?`}
          onConfirm={confirmRemoveArrayItem}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === "photo" && (
        <ConfirmModal
          message={`Remove this photo?`}
          onConfirm={confirmClearPhoto}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      <Toast toast={toast} onClose={closeToast} />
    </AdminLayout>
  )
}

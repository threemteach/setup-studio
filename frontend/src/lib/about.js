import { getSupabase } from "./supabase"

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export async function fetchAboutContent() {
  const supabase = getSupabase()
  const { data, error } = await supabase.from("about_content").select("*").eq("id", 1).maybeSingle()
  if (error) throw error
  return data
}

export async function updateAboutContent(values) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("about_content")
    .upsert({ id: 1, ...values, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function uploadAboutImage(file, fieldName) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", preset)
  formData.append("folder", `setup-studio/about-page/${fieldName}`)
  formData.append("asset_folder", `setup-studio/about-page/${fieldName}`)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error?.message || "Upload failed")
  }
  return res.json()
}

export async function copyImageToAbout(sourceUrl, fieldName) {
  const formData = new FormData()
  formData.append("file", sourceUrl)
  formData.append("upload_preset", preset)
  formData.append("folder", `setup-studio/about-page/${fieldName}`)
  formData.append("asset_folder", `setup-studio/about-page/${fieldName}`)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error?.message || "Copy failed")
  }
  return res.json()
}

export const defaultServices = [
  { icon: "fa-solid fa-location-dot", title_en: "Location Rental", title_ar: "تأجير المواقع", desc_en: "Premium studio spaces for podcasts, reels, commercials, and film productions.", desc_ar: "مساحات استوديو متميزة للبودكاست والريلز والإعلانات والإنتاج السينمائي." },
  { icon: "fa-solid fa-video", title_en: "Video Production", title_ar: "الإنتاج الفيديو", desc_en: "Full-service production crews for shoots of any scale, from concept to final cut.", desc_ar: "فرق إنتاج متكاملة لتصوير أي مقياس، من الفكرة إلى المونتاج النهائي." },
  { icon: "fa-solid fa-scissors", title_en: "Post-Production", title_ar: "ما بعد الإنتاج", desc_en: "Professional editing, color grading, sound design, and motion graphics.", desc_ar: "مونتاج احترافي، تصحيح ألوان، تصميم صوتي، ورسوم متحركة." },
  { icon: "fa-solid fa-bullhorn", title_en: "Production Management", title_ar: "إدارة الإنتاج", desc_en: "End-to-end coordination so you can focus entirely on your creative vision.", desc_ar: "تنسيق متكامل لتتمكن من التركيز بالكامل على رؤيتك الإبداعية." },
]

export const defaultValues = [
  { icon: "fa-solid fa-camera", title_en: "Quality First", title_ar: "الجودة أولاً", desc_en: "Every detail in our studios is carefully curated to ensure the highest production quality.", desc_ar: "كل تفصيل في استوديوهاتنا يتم اختياره بعناية لضمان أعلى جودة إنتاج." },
  { icon: "fa-solid fa-lightbulb", title_en: "Creative Freedom", title_ar: "حرية الإبداع", desc_en: "Our diverse locations empower creators to bring any vision to life without limits.", desc_ar: "مواقعنا المتنوعة تمكن المبدعين من تحقيق أي رؤية دون حدود." },
  { icon: "fa-solid fa-users", title_en: "Community Driven", title_ar: "مجتمع إبداعي", desc_en: "We foster a collaborative environment where creators inspire and support each other.", desc_ar: "نعزز بيئة تعاونية حيث يلهم المبدعون ويدعمون بعضهم البعض." },
  { icon: "fa-solid fa-rocket", title_en: "Always Evolving", title_ar: "دائم التطور", desc_en: "We continuously upgrade our spaces and equipment to stay at the cutting edge.", desc_ar: "نطور مساحاتنا ومعداتنا باستمرار لنبقى في طليعة الإبداع." },
]

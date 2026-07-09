import { getSupabase } from "./supabase"

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

/* ─── Supabase CRUD ─── */

export async function fetchHomepageContent() {
  const supabase = getSupabase()
  const { data, error } = await supabase.from("homepage_content").select("*")
  if (error) throw error

  const map = {}
  data.forEach((row) => {
    map[row.section_key] = row
  })
  return map
}

export async function updateHomepageSection(sectionKey, contentEn, contentAr) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("homepage_content")
    .upsert(
      { section_key: sectionKey, content_en: contentEn, content_ar: contentAr, updated_at: new Date().toISOString() },
      { onConflict: "section_key" }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

/* ─── Cloudinary helpers ─── */

export async function uploadHomepageImage(file, sectionName) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", preset)
  formData.append("folder", `setup-studio/home-page/${sectionName}`)
  formData.append("asset_folder", `setup-studio/home-page/${sectionName}`)
  formData.append("transformation", "f_auto,q_auto")

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

/* Copy an existing Cloudinary image to home-page folder */
export async function copyImageToHomepage(sourceUrl, sectionName) {
  const formData = new FormData()
  formData.append("file", sourceUrl)
  formData.append("upload_preset", preset)
  formData.append("folder", `setup-studio/home-page/${sectionName}`)
  formData.append("asset_folder", `setup-studio/home-page/${sectionName}`)
  formData.append("transformation", "f_auto,q_auto")

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

export async function deleteHomepageImage(publicId) {
  const { data: { session } } = await getSupabase().auth.getSession()
  const token = session?.access_token
  const res = await fetch("/api/delete-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ public_id: publicId }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
  }
}

/* ─── Translation ─── */

async function translateViaGoogle(text, source, target) {
  const res = await fetch(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`
  )
  if (!res.ok) throw new Error(`Google Translate HTTP ${res.status}`)
  const data = await res.json()
  if (data?.[0]) return data[0].map((s) => s?.[0] || "").join("").trim()
  throw new Error("Unexpected Google Translate response")
}

async function translateViaMyMemory(text, source, target) {
  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`
  )
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`)
  const data = await res.json()
  if (data.responseData?.translatedText) return data.responseData.translatedText
  throw new Error("Unexpected MyMemory response")
}

async function translateText(text, source, target) {
  if (!text || !text.trim()) return text
  const translators = [
    { fn: translateViaGoogle, label: "Google" },
    { fn: translateViaMyMemory, label: "MyMemory" },
  ]
  for (const { fn, label } of translators) {
    try {
      return await fn(text, source, target)
    } catch (err) {
      console.warn(`${label} translate failed:`, err)
    }
  }
  return text
}

export async function translateObject(obj, source, target) {
  if (typeof obj === "string") return translateText(obj, source, target)
  if (Array.isArray(obj)) return Promise.all(obj.map((item) => translateObject(item, source, target)))
  if (obj && typeof obj === "object") {
    const entries = Object.entries(obj)
    const results = await Promise.all(
      entries.map(async ([key, value]) => {
        if (key === "number" || key === "popular" || key === "photos" || key === "id" || key === "url") {
          return [key, value]
        }
        return [key, await translateObject(value, source, target)]
      })
    )
    return Object.fromEntries(results)
  }
  return obj
}

export async function autoTranslateSection(contentEn, contentAr, fromLang) {
  const source = fromLang
  const target = fromLang === "en" ? "ar" : "en"
  const sourceContent = fromLang === "en" ? contentEn : contentAr
  const translated = await translateObject(sourceContent, source, target)
  /* Keep photos synced across both languages */
  if (fromLang === "en") {
    return { content_en: contentEn, content_ar: { ...translated, photos: contentEn.photos } }
  } else {
    return { content_en: { ...translated, photos: contentAr.photos }, content_ar: contentAr }
  }
}

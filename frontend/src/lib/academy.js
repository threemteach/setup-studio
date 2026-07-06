import { getSupabase } from "./supabase"

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export async function fetchAcademyContent() {
  const supabase = getSupabase()
  const { data, error } = await supabase.from("academy_content").select("*").eq("id", 1).maybeSingle()
  if (error) throw error
  return data
}

export async function updateAcademyContent(values) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("academy_content")
    .upsert({ id: 1, ...values, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function uploadAcademyImage(file, fieldName) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", preset)
  formData.append("folder", `setup-studio/academy-page/${fieldName}`)
  formData.append("asset_folder", `setup-studio/academy-page/${fieldName}`)

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

export async function copyImageToAcademy(sourceUrl, fieldName) {
  const formData = new FormData()
  formData.append("file", sourceUrl)
  formData.append("upload_preset", preset)
  formData.append("folder", `setup-studio/academy-page/${fieldName}`)
  formData.append("asset_folder", `setup-studio/academy-page/${fieldName}`)

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

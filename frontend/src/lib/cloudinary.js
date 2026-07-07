const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export async function uploadToCloudinary(file, category) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", preset)
  formData.append("folder", `setup-studio/locations/${category}`)
  formData.append("asset_folder", `setup-studio/locations/${category}`)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error?.message || "Upload failed")
  }

  return res.json()
}

export async function deleteCloudinaryImage(thumbnailUrl) {
  const match = thumbnailUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i)
  if (!match) return

  const { getSupabase } = await import("./supabase")
  const token = (await getSupabase().auth.getSession()).data.session?.access_token
  const apiUrl = import.meta.env.PROD ? "/api/delete-image" : "http://localhost:3001/api/delete-image"

  await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ public_id: match[1] }),
  })
}

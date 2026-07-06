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

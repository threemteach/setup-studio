import { getSupabase } from "./supabase"

export async function fetchPhotos(category) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("category", category)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function fetchAllPhotos() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) throw error
  return data
}

export async function createPhoto({ category, cloudinaryUrl, cloudinaryPublicId, title, description, alt }) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("photos")
    .insert({
      category,
      cloudinary_url: cloudinaryUrl,
      cloudinary_public_id: cloudinaryPublicId,
      title: title || null,
      description: description || null,
      alt: alt || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePhoto(id, updates) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("photos")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePhoto(id, cloudinaryPublicId) {
  let cloudinaryError = null
  if (cloudinaryPublicId) {
    try {
      const { data: { session } } = await getSupabase().auth.getSession()
      const token = session?.access_token
      const res = await fetch("/api/delete-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ public_id: cloudinaryPublicId }),
      })
      if (!res.ok) {
        const text = await res.text()
        const hint = res.status === 404 ? " (Vercel framework must be 'Other', not 'Vite')" : ""
        cloudinaryError = `HTTP ${res.status}: ${text.slice(0, 200)}${hint}`
      }
    } catch (err) {
      cloudinaryError = err.message
    }
  }

  const supabase = getSupabase()
  const { error } = await supabase
    .from("photos")
    .delete()
    .eq("id", id)

  if (error) throw error

  if (cloudinaryError) {
    throw new Error(`Photo removed from database but failed to delete from Cloudinary: ${cloudinaryError}`)
  }
}

export async function setCoverPhoto(category, photoId) {
  const supabase = getSupabase()
  const { error: unsetError } = await supabase
    .from("photos")
    .update({ is_cover: false })
    .eq("category", category)
    .eq("is_cover", true)
  if (unsetError) throw unsetError

  const { data, error } = await supabase
    .from("photos")
    .update({ is_cover: true })
    .eq("id", photoId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchCoverPhoto(category) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("category", category)
    .eq("is_cover", true)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function reorderPhotos(items) {
  const supabase = getSupabase()
  const updates = items.map(({ id, sort_order }) => ({
    id,
    sort_order,
  }))

  const { error } = await supabase.from("photos").upsert(updates)
  if (error) throw error
}

import { getSupabase } from "./supabase"

export async function fetchPortfolioContent() {
  const supabase = getSupabase()
  const { data, error } = await supabase.from("portfolio_content").select("*").eq("id", 1).maybeSingle()
  if (error) throw error
  return data
}

export async function updatePortfolioContent(values) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("portfolio_content")
    .upsert({ id: 1, ...values, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchPortfolioVideos(category) {
  const supabase = getSupabase()
  let query = supabase.from("portfolio_videos").select("*").order("sort_order", { ascending: true })
  if (category) query = query.eq("category", category)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function upsertVideo(video) {
  const supabase = getSupabase()
  const payload = { ...video, updated_at: new Date().toISOString() }
  if (!payload.id) {
    const { data, error } = await supabase.from("portfolio_videos").insert(payload).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await supabase.from("portfolio_videos").update(payload).eq("id", payload.id).select().single()
  if (error) throw error
  return data
}

async function getAccessToken() {
  const supabase = getSupabase()
  const { data } = await supabase.auth.getSession()
  return data?.session?.access_token
}

export async function deleteVideo(id, videoKey) {
  if (videoKey) {
    try {
      const token = await getAccessToken()
      if (token) {
        await fetch("/api/delete-video", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ video_key: videoKey }),
        })
      }
    } catch { /* ignore */ }
  }
  const supabase = getSupabase()
  const { error } = await supabase.from("portfolio_videos").delete().eq("id", id)
  if (error) throw error
}

export async function uploadVideo(file, category) {
  const supabase = getSupabase()
  const session = (await supabase.auth.getSession()).data?.session
  if (!session) throw new Error("Not authenticated")

  const token = session.access_token

  const urlRes = await fetch("/api/generate-upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || "video/mp4",
      category,
    }),
  })

  if (!urlRes.ok) {
    const err = await urlRes.json().catch(() => ({ error: "Failed to get upload URL" }))
    throw new Error(err.error || "Failed to get upload URL")
  }

  const { upload_url, video_key, video_url } = await urlRes.json()

  const uploadRes = await fetch(upload_url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "video/mp4" },
  })

  if (!uploadRes.ok) {
    throw new Error(`Upload to R2 failed: HTTP ${uploadRes.status}`)
  }

  return { video_url, video_key }
}

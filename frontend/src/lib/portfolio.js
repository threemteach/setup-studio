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

export async function uploadVideo(file, category, onProgress) {
  const supabase = getSupabase()
  const session = (await supabase.auth.getSession()).data?.session
  if (!session) throw new Error("Not authenticated")

  const reader = new FileReader()
  const data = await new Promise((resolve) => {
    reader.onload = () => {
      const base64 = reader.result.split(",")[1]
      resolve(base64)
    }
    reader.readAsDataURL(file)
  })

  const res = await fetch("/api/upload-video", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({
      file: { name: `${Date.now()}-${file.name}`, type: file.type, data },
      category,
    }),
  })

  if (!res.ok) {
    let detail = "Upload failed"
    try {
      const err = await res.json()
      detail = err.error || `HTTP ${res.status}`
    } catch {
      const text = await res.text().catch(() => "")
      detail = text ? `HTTP ${res.status}: ${text.slice(0, 100)}` : `HTTP ${res.status}`
    }
    if (detail.includes("Cannot") || detail.includes("500") || detail.includes("404")) {
      detail += " — run 'npm run dev:all' instead of 'npm run dev' for API endpoint support"
    }
    throw new Error(detail)
  }

  return res.json()
}

import { getSupabase } from "./supabase"
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const r2Endpoint = import.meta.env.VITE_R2_ENDPOINT || "https://fba1cd78b5f83abd727ffd95bd6ce95e.r2.cloudflarestorage.com"
const r2Bucket = import.meta.env.VITE_R2_BUCKET_NAME || "setup-studio-videos"
const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL
const r2AccessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID
const r2SecretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: r2Endpoint,
    credentials: { accessKeyId: r2AccessKeyId, secretAccessKey: r2SecretAccessKey },
  })
}

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

export async function deleteVideo(id, videoKey) {
  if (videoKey) {
    try {
      const client = getR2Client()
      await client.send(new DeleteObjectCommand({ Bucket: r2Bucket, Key: videoKey }))
    } catch { /* ignore R2 delete errors */ }
  }
  const supabase = getSupabase()
  const { error } = await supabase.from("portfolio_videos").delete().eq("id", id)
  if (error) throw error
}

export async function uploadVideo(file, category) {
  if (!r2AccessKeyId || !r2SecretAccessKey || !r2PublicUrl) {
    throw new Error("R2 credentials not configured. Add VITE_R2_ACCESS_KEY_ID, VITE_R2_SECRET_ACCESS_KEY, and VITE_R2_PUBLIC_URL to .env")
  }

  const client = getR2Client()
  const key = `${category}/${Date.now()}-${file.name}`
  const contentType = file.type || "video/mp4"

  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: r2Bucket, Key: key, ContentType: contentType }),
    { expiresIn: 3600 }
  )

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
  })

  if (!uploadRes.ok) {
    throw new Error(`Upload to R2 failed: HTTP ${uploadRes.status}`)
  }

  return { video_url: `${r2PublicUrl}/${key}`, video_key: key }
}

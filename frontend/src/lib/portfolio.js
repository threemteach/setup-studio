import { getSupabase } from "./supabase"
import { S3Client, PutObjectCommand, DeleteObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const r2Endpoint = import.meta.env.VITE_R2_ENDPOINT || "https://fba1cd78b5f83abd727ffd95bd6ce95e.r2.cloudflarestorage.com"
const r2Bucket = import.meta.env.VITE_R2_BUCKET_NAME || "setup-studio-videos"
const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL
const r2AccessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID
const r2SecretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY

const CHUNK_SIZE = 10 * 1024 * 1024 // 10MB per part
const MULTIPART_THRESHOLD = 50 * 1024 * 1024 // 50MB

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

async function uploadSimple(file, key, contentType, onProgress) {
  const client = getR2Client()
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: r2Bucket, Key: key, ContentType: contentType }),
    { expiresIn: 3600 }
  )
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", uploadUrl)
    xhr.setRequestHeader("Content-Type", contentType)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded, e.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload to R2 failed: HTTP ${xhr.status}`))
    }
    xhr.onerror = () => reject(new Error("Upload to R2 failed: network error"))
    xhr.send(file)
  })
}

async function uploadMultipart(file, key, contentType, onProgress) {
  const client = getR2Client()

  const { UploadId } = await client.send(
    new CreateMultipartUploadCommand({ Bucket: r2Bucket, Key: key, ContentType: contentType })
  )

  const numParts = Math.ceil(file.size / CHUNK_SIZE)
  const partSize = CHUNK_SIZE
  const done = new Array(numParts).fill(false)
  function reportProgress() {
    let bytes = 0
    for (let j = 0; j < numParts; j++) {
      if (done[j]) bytes += Math.min((j + 1) * partSize, file.size) - j * partSize
    }
    if (onProgress) onProgress(bytes, file.size)
  }
  const parts = []
  const CONCURRENCY = 6
  try {
    // Pre-compute all part boundaries
    const parts_config = Array.from({ length: numParts }, (_, i) => ({
      start: i * partSize,
      end: Math.min((i + 1) * partSize, file.size),
    }))
    for (let batch = 0; batch < numParts; batch += CONCURRENCY) {
      const batchEnd = Math.min(batch + CONCURRENCY, numParts)
      // Convert blobs to ArrayBuffers before sending (in parallel within batch)
      const buffers = await Promise.all(
        parts_config.slice(batch, batchEnd).map(p => file.slice(p.start, p.end).arrayBuffer())
      )
      const batchResults = await Promise.all(
        buffers.map((buf, j) => {
          const i = batch + j
          return client.send(new UploadPartCommand({
            Bucket: r2Bucket,
            Key: key,
            UploadId,
            PartNumber: i + 1,
            Body: new Uint8Array(buf),
          })).then(r => {
            done[i] = true
            reportProgress()
            return { ETag: r.ETag, PartNumber: i + 1 }
          })
        })
      )
      parts.push(...batchResults)
    }

    await client.send(new CompleteMultipartUploadCommand({
      Bucket: r2Bucket,
      Key: key,
      UploadId,
      MultipartUpload: { Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber) },
    }))
  } catch (err) {
    await client.send(new AbortMultipartUploadCommand({ Bucket: r2Bucket, Key: key, UploadId })).catch(() => {})
    throw err
  }
}

export async function uploadVideo(file, category, onProgress) {
  if (!r2AccessKeyId || !r2SecretAccessKey || !r2PublicUrl) {
    throw new Error("R2 credentials not configured. Add VITE_R2_ACCESS_KEY_ID, VITE_R2_SECRET_ACCESS_KEY, and VITE_R2_PUBLIC_URL to .env")
  }

  const client = getR2Client()
  const key = `${category}/${Date.now()}-${file.name}`
  const contentType = file.type || "video/mp4"

  if (file.size < MULTIPART_THRESHOLD) {
    await uploadSimple(file, key, contentType, onProgress)
  } else {
    await uploadMultipart(file, key, contentType, onProgress)
  }

  return { video_url: `${r2PublicUrl}/${key}`, video_key: key }
}

import { getSupabase } from "./supabase"
import { S3Client, PutObjectCommand, DeleteObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, AbortMultipartUploadCommand, ListObjectsV2Command } from "@aws-sdk/client-s3"
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
  const partSize = CHUNK_SIZE

  // 1. Create multipart upload via presigned URL
  const createUrl = await getSignedUrl(
    client,
    new CreateMultipartUploadCommand({ Bucket: r2Bucket, Key: key, ContentType: contentType }),
    { expiresIn: 3600 }
  )
  const createRes = await fetch(createUrl, { method: "POST" })
  if (!createRes.ok) throw new Error(`CreateMultipartUpload failed: HTTP ${createRes.status}`)
  const xml = await createRes.text()
  const uploadId = xml.match(/<UploadId>([^<]+)<\/UploadId>/)?.[1]
  if (!uploadId) throw new Error("Failed to parse UploadId from CreateMultipartUpload response")

  const numParts = Math.ceil(file.size / partSize)
  const done = new Array(numParts).fill(0)
  function reportProgress() {
    let bytes = 0
    for (let j = 0; j < numParts; j++) {
      if (done[j]) {
        const partBytes = Math.min((j + 1) * partSize, file.size) - j * partSize
        bytes += done[j] === true ? partBytes : partBytes * done[j]
      }
    }
    if (onProgress) onProgress(bytes, file.size)
  }

  const CONCURRENCY = 6
  try {
    const parts_config = Array.from({ length: numParts }, (_, i) => ({
      start: i * partSize,
      end: Math.min((i + 1) * partSize, file.size),
    }))

    for (let batch = 0; batch < numParts; batch += CONCURRENCY) {
      const batchEnd = Math.min(batch + CONCURRENCY, numParts)
      const batchSlice = parts_config.slice(batch, batchEnd)

      // Generate presigned URLs for this batch
      const partUrls = await Promise.all(
        batchSlice.map((_, j) => {
          const i = batch + j
          return getSignedUrl(
            client,
            new UploadPartCommand({ Bucket: r2Bucket, Key: key, UploadId: uploadId, PartNumber: i + 1 }),
            { expiresIn: 3600 }
          )
        })
      )

      // Upload parts in parallel via XHR (same as simple upload)
      await Promise.all(
        batchSlice.map((p, j) => {
          const i = batch + j
          const body = file.slice(p.start, p.end)
          return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.open("PUT", partUrls[j])
            xhr.setRequestHeader("Content-Type", contentType)
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable && onProgress) {
                done[i] = e.loaded / e.total
                reportProgress()
              }
            }
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                done[i] = true
                reportProgress()
                resolve()
              } else reject(new Error(`UploadPart ${i + 1} failed: HTTP ${xhr.status}`))
            }
            xhr.onerror = () => reject(new Error(`UploadPart ${i + 1} failed: network error`))
            xhr.send(body)
          })
        })
      )
    }

    // 3. Complete multipart via server API (no CORS)
    const apiUrl = import.meta.env.PROD ? "/api/complete-multipart" : "http://localhost:3001/api/complete-multipart"
    const completeRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, uploadId }),
    })
    if (!completeRes.ok) {
      const errData = await completeRes.json().catch(() => ({}))
      throw new Error(`CompleteMultipartUpload failed: ${errData.error || `HTTP ${completeRes.status}`}`)
    }
  } catch (err) {
    const abortUrl = await getSignedUrl(
      client,
      new AbortMultipartUploadCommand({ Bucket: r2Bucket, Key: key, UploadId: uploadId }),
      { expiresIn: 60 }
    ).catch(() => null)
    if (abortUrl) await fetch(abortUrl, { method: "DELETE" }).catch(() => {})
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

const TOTAL_LIMIT = 100 * 1024 * 1024 * 1024 // 100 GB

export async function fetchStorageUsage() {
  const client = getR2Client()
  let total = 0
  let cursor
  do {
    const { Contents, NextContinuationToken } = await client.send(new ListObjectsV2Command({
      Bucket: r2Bucket,
      ContinuationToken: cursor,
    }))
    if (Contents) total += Contents.reduce((s, o) => s + (o.Size || 0), 0)
    cursor = NextContinuationToken
  } while (cursor)
  return { usedBytes: total, limitBytes: TOTAL_LIMIT, usedGB: total / (1024 ** 3), usedMB: total / (1024 ** 2), limitGB: 100 }
}

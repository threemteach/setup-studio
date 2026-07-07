import { getSupabase } from "./supabase"
import { uploadToCloudinary } from "./cloudinary"

const CHUNK_SIZE = 10 * 1024 * 1024
const MULTIPART_THRESHOLD = 50 * 1024 * 1024
const TOTAL_LIMIT = 100 * 1024 * 1024 * 1024

const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL

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
      const token = (await getSupabase().auth.getSession()).data.session?.access_token
      const apiUrl = import.meta.env.PROD ? "/api/delete-video" : "http://localhost:3001/api/delete-video"
      await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ video_key: videoKey }),
      })
    } catch { /* ignore R2 delete errors */ }
  }
  const supabase = getSupabase()
  const { error } = await supabase.from("portfolio_videos").delete().eq("id", id)
  if (error) throw error
}

async function uploadSimple(file, key, contentType, onProgress) {
  const token = (await getSupabase().auth.getSession()).data.session?.access_token
  const apiUrl = import.meta.env.PROD ? "/api/generate-upload-url" : "http://localhost:3001/api/generate-upload-url"
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ filename: key, contentType, category: key.split("/")[0] }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Failed to get upload URL: HTTP ${res.status}`)
  }
  const { upload_url } = await res.json()
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", upload_url)
    xhr.setRequestHeader("Content-Type", contentType)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded, e.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload failed: HTTP ${xhr.status}`))
    }
    xhr.onerror = () => reject(new Error("Upload failed: network error"))
    xhr.send(file)
  })
}

async function uploadMultipart(file, key, contentType, onProgress) {
  const partSize = CHUNK_SIZE
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

  const token = (await getSupabase().auth.getSession()).data.session?.access_token
  const apiUrl = import.meta.env.PROD ? "/api/generate-upload-url" : "http://localhost:3001/api/generate-upload-url"

  // 1. Create multipart upload via server API
  const createRes = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ filename: key, contentType, category: key.split("/")[0], multipart: true }),
  })
  if (!createRes.ok) throw new Error(`CreateMultipartUpload failed: HTTP ${createRes.status}`)
  const { uploadId } = await createRes.json()

  const CONCURRENCY = 6
  try {
    const partsConfig = Array.from({ length: numParts }, (_, i) => ({
      start: i * partSize,
      end: Math.min((i + 1) * partSize, file.size),
    }))

    for (let batch = 0; batch < numParts; batch += CONCURRENCY) {
      const batchEnd = Math.min(batch + CONCURRENCY, numParts)
      const batchSlice = partsConfig.slice(batch, batchEnd)
      const partNumbers = batchSlice.map((_, j) => batch + j + 1)

      // Generate presigned URLs for this batch via server
      const partsApiUrl = import.meta.env.PROD ? "/api/generate-upload-part-urls" : "http://localhost:3001/api/generate-upload-part-urls"
      const urlsRes = await fetch(partsApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ key, uploadId, partNumbers }),
      })
      if (!urlsRes.ok) throw new Error(`Failed to get part URLs: HTTP ${urlsRes.status}`)
      const { partUrls } = await urlsRes.json()

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

    // 3. Complete multipart via server API
    const completeApiUrl = import.meta.env.PROD ? "/api/complete-multipart" : "http://localhost:3001/api/complete-multipart"
    const completeRes = await fetch(completeApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, uploadId }),
    })
    if (!completeRes.ok) {
      const errData = await completeRes.json().catch(() => ({}))
      throw new Error(`CompleteMultipartUpload failed: ${errData.error || `HTTP ${completeRes.status}`}`)
    }
  } catch (err) {
    // abort multipart
    try {
      const abortApiUrl = import.meta.env.PROD ? "/api/abort-multipart" : "http://localhost:3001/api/abort-multipart"
      await fetch(abortApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, uploadId }),
      })
    } catch {}
    throw err
  }
}

export async function uploadVideo(file, category, onProgress) {
  if (!r2PublicUrl) {
    throw new Error("VITE_R2_PUBLIC_URL not configured")
  }
  const key = `${category}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
  const contentType = file.type || "video/mp4"

  if (file.size < MULTIPART_THRESHOLD) {
    await uploadSimple(file, key, contentType, onProgress)
  } else {
    await uploadMultipart(file, key, contentType, onProgress)
  }

  const video_url = `${r2PublicUrl}/${key}`
  const thumbnail_url = await generateVideoThumbnail(video_url).catch(() => null)

  return { video_url, video_key: key, thumbnail_url }
}

export async function generateVideoThumbnail(videoUrl) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.crossOrigin = "anonymous"
    video.src = videoUrl
    video.muted = true
    video.currentTime = 0.5
    video.oncanplay = () => {
      video.currentTime = 0.5
    }
    video.onseeked = () => {
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext("2d").drawImage(video, 0, 0)
      canvas.toBlob(async (blob) => {
        if (!blob) return reject(new Error("Failed to capture thumbnail"))
        try {
          const result = await uploadToCloudinary(new File([blob], "thumb.jpg", { type: "image/jpeg" }), "portfolio-thumbnails")
          resolve(result.secure_url)
        } catch (err) {
          reject(err)
        }
      }, "image/jpeg", 0.8)
      video.remove()
    }
    video.onerror = () => {
      video.remove()
      resolve(null)
    }
    // timeout fallback
    setTimeout(() => { video.remove(); resolve(null) }, 15000)
  })
}

export async function fetchStorageUsage() {
  const res = await fetch("/api/r2-storage")
  if (res.ok) {
    const data = await res.json()
    if (data.usedBytes != null) return formatStorage(data.usedBytes)
  }
  return formatStorage(0)
}

function formatStorage(total) {
  return { usedBytes: total, limitBytes: TOTAL_LIMIT, usedGB: total / (1024 ** 3), usedMB: total / (1024 ** 2), limitGB: 100 }
}

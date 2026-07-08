import { S3Client, PutObjectCommand, CreateMultipartUploadCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { endpoint, bucket, accessKeyId, secretAccessKey, publicUrl } from "./_r2.js"

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json")
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) return res.status(401).json({ error: "Missing authorization token" })

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" })

  const { filename, contentType, category, multipart } = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {}
  if (!filename || !category) return res.status(400).json({ error: "Missing filename or category" })

  if (!accessKeyId || !secretAccessKey || !publicUrl) {
    return res.status(500).json({ error: "R2 credentials not configured in environment variables" })
  }

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })

  const key = filename.includes("/") ? filename : `${category}/${Date.now()}-${filename}`

  if (multipart) {
    const command = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType || "video/mp4",
      CacheControl: "public, max-age=31536000, immutable",
    })
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 })
    const createRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": contentType || "video/mp4" },
    })
    if (!createRes.ok) return res.status(502).json({ error: `CreateMultipartUpload failed: HTTP ${createRes.status}` })
    const xml = await createRes.text()
    const uploadId = xml.match(/<UploadId>([^<]+)<\/UploadId>/)?.[1]
    if (!uploadId) return res.status(502).json({ error: "Failed to parse UploadId" })
    return res.json({ key, uploadId, video_url: `${publicUrl}/${key}`, video_key: key })
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType || "video/mp4",
    CacheControl: "public, max-age=31536000, immutable",
  })
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 })
  return res.json({ upload_url: uploadUrl, video_key: key, video_url: `${publicUrl}/${key}` })
}
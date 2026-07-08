import { S3Client, AbortMultipartUploadCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

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

  const { key, uploadId } = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {}
  if (!key || !uploadId) return res.status(400).json({ error: "Missing key or uploadId" })

  const endpoint = process.env.R2_ENDPOINT || process.env.VITE_R2_ENDPOINT || "https://fba1cd78b5f83abd727ffd95bd6ce95e.r2.cloudflarestorage.com"
  const bucket = process.env.R2_BUCKET_NAME || process.env.VITE_R2_BUCKET_NAME || "setup-studio-videos"
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.VITE_R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.VITE_R2_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) return res.status(500).json({ error: "R2 credentials not configured" })

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })

  try {
    const abortUrl = await getSignedUrl(
      client,
      new AbortMultipartUploadCommand({ Bucket: bucket, Key: key, UploadId: uploadId }),
      { expiresIn: 60 }
    )
    await fetch(abortUrl, { method: "DELETE" })
    res.json({ success: true })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
}

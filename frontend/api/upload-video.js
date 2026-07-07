import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json")

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: "Missing authorization token" })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Supabase not configured" })
  }

  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { file, category } = typeof req.body === "string" ? JSON.parse(req.body) : req.body
  if (!file || !category) {
    return res.status(400).json({ error: "Missing file or category" })
  }

  const endpoint = process.env.R2_ENDPOINT || process.env.VITE_R2_ENDPOINT || "https://fba1cd78b5f83abd727ffd95bd6ce95e.r2.cloudflarestorage.com"
  const bucket = process.env.R2_BUCKET_NAME || process.env.VITE_R2_BUCKET_NAME || "setup-studio-videos"
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.VITE_R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.VITE_R2_SECRET_ACCESS_KEY
  const publicUrl = process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL

  if (!accessKeyId || !secretAccessKey || !publicUrl) {
    return res.status(500).json({ error: "R2 credentials not configured in environment variables" })
  }

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })

  const raw = Buffer.from(file.data, "base64")
  const key = `${category}/${file.name}`
  const contentType = file.type || "video/mp4"

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: raw,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }))

  return res.status(200).json({
    video_url: `${publicUrl}/${key}`,
    video_key: key,
  })
}
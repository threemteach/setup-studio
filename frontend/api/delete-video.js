import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { endpoint, bucket, accessKeyId, secretAccessKey } from "./_r2.js"

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
  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { video_key } = typeof req.body === "string" ? JSON.parse(req.body) : req.body
  if (!video_key) {
    return res.status(400).json({ error: "Missing video_key" })
  }

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })

  await client.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: video_key,
  }))

  return res.status(200).json({ success: true })
}

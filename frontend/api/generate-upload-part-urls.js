import { S3Client, UploadPartCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { endpoint, bucket, accessKeyId, secretAccessKey } from "./_r2.js"

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

  const { key, uploadId, partNumbers } = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {}
  if (!key || !uploadId || !partNumbers?.length) return res.status(400).json({ error: "Missing key, uploadId, or partNumbers" })

  if (!accessKeyId || !secretAccessKey) return res.status(500).json({ error: "R2 credentials not configured" })

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })

  const partUrls = await Promise.all(
    partNumbers.map((partNumber) =>
      getSignedUrl(
        client,
        new UploadPartCommand({ Bucket: bucket, Key: key, UploadId: uploadId, PartNumber: partNumber }),
        { expiresIn: 3600 }
      )
    )
  )

  res.json({ partUrls })
}

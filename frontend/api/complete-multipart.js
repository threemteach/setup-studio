import { S3Client, CompleteMultipartUploadCommand, ListPartsCommand } from "@aws-sdk/client-s3"
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

  const { key, uploadId } = req.body
  if (!key || !uploadId) return res.status(400).json({ error: "key and uploadId required" })

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })

  try {
    const listed = await client.send(new ListPartsCommand({ Bucket: bucket, Key: key, UploadId: uploadId }))
    const parts = (listed.Parts || []).sort((a, b) => a.PartNumber - b.PartNumber).map(p => ({
      ETag: p.ETag,
      PartNumber: p.PartNumber,
    }))
    await client.send(new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    }))
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

import { S3Client, CompleteMultipartUploadCommand, ListPartsCommand } from "@aws-sdk/client-s3"

const R2_ENDPOINT = process.env.R2_ENDPOINT || process.env.VITE_R2_ENDPOINT
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || process.env.VITE_R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.VITE_R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.VITE_R2_BUCKET_NAME

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })
  const { key, uploadId } = req.body
  if (!key || !uploadId) return res.status(400).json({ error: "key and uploadId required" })

  const client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  })

  try {
    const listed = await client.send(new ListPartsCommand({ Bucket: R2_BUCKET_NAME, Key: key, UploadId: uploadId }))
    const parts = (listed.Parts || []).sort((a, b) => a.PartNumber - b.PartNumber).map(p => ({
      ETag: p.ETag,
      PartNumber: p.PartNumber,
    }))
    await client.send(new CompleteMultipartUploadCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    }))
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const R2_ENDPOINT = process.env.R2_ENDPOINT || process.env.VITE_R2_ENDPOINT
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.VITE_R2_BUCKET_NAME
const CF_API_TOKEN = process.env.CF_API_TOKEN
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || R2_ENDPOINT?.match(/https?:\/\/(.+)\.r2\.cloudflarestorage\.com/)?.[1]

export default async function handler(req, res) {
  if (!CF_API_TOKEN) return res.status(503).json({ error: "CF_API_TOKEN not configured" })
  if (!CF_ACCOUNT_ID) return res.status(503).json({ error: "Could not determine CF_ACCOUNT_ID" })

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}`
    const cfRes = await fetch(url, {
      headers: { Authorization: `Bearer ${CF_API_TOKEN}`, "Content-Type": "application/json" },
    })
    const data = await cfRes.json()
    if (!data.success) return res.status(502).json({ error: data.errors?.[0]?.message || "Cloudflare API error" })

    const bucketSize = data.result?.bucketSize
    if (bucketSize == null) return res.status(502).json({ error: "bucketSize not in response" })

    res.json({ usedBytes: bucketSize })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

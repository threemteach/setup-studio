const R2_ENDPOINT = process.env.R2_ENDPOINT || process.env.VITE_R2_ENDPOINT
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.VITE_R2_BUCKET_NAME
const CF_API_TOKEN = process.env.CF_API_TOKEN
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || R2_ENDPOINT?.match(/https?:\/\/(.+)\.r2\.cloudflarestorage\.com/)?.[1]

async function cfFetch(path) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}${path}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${CF_API_TOKEN}`, "Content-Type": "application/json" },
  })
  return res.json()
}

export default async function handler(req, res) {
  if (!CF_API_TOKEN) return res.status(503).json({ error: "CF_API_TOKEN not configured" })
  if (!CF_ACCOUNT_ID) return res.status(503).json({ error: "Could not determine CF_ACCOUNT_ID" })

  try {
    // try usage endpoint first
    const usageData = await cfFetch(`/r2/buckets/${R2_BUCKET_NAME}/usage`)
    console.log("Cloudflare /usage response:", JSON.stringify(usageData, null, 2))
    if (usageData.success) {
      const objectsSize = usageData.result?.usage?.objectsSize
      if (objectsSize != null) return res.json({ usedBytes: objectsSize })
    }

    // fallback: bucket detail endpoint
    const bucketData = await cfFetch(`/r2/buckets/${R2_BUCKET_NAME}`)
    console.log("Cloudflare /buckets response:", JSON.stringify(bucketData, null, 2))
    if (!bucketData.success) return res.status(502).json({ error: bucketData.errors?.[0]?.message || "Cloudflare API error" })

    const bucketSize = bucketData.result?.bucketSize
    if (bucketSize != null) return res.json({ usedBytes: bucketSize })

    // if neither worked, return raw response for debugging
    res.status(502).json({ error: "Could not find storage size in Cloudflare API response", debug: bucketData })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

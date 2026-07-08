import { endpoint, bucket } from "./_r2.js"

const CF_API_TOKEN = process.env.CF_API_TOKEN
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || endpoint?.match(/https?:\/\/(.+)\.r2\.cloudflarestorage\.com/)?.[1]

async function cfFetch(path) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}${path}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${CF_API_TOKEN}`, "Content-Type": "application/json" },
  })
  return { status: res.status, body: await res.json() }
}

export default async function handler(req, res) {
  try {
    if (!CF_API_TOKEN) return res.json({ error: "CF_API_TOKEN not configured", usedBytes: null })
    if (!CF_ACCOUNT_ID) return res.json({ error: "Could not determine CF_ACCOUNT_ID", usedBytes: null })

    const usageResp = await cfFetch(`/r2/buckets/${bucket}/usage`)
    if (usageResp.body.success) {
      const payloadSize = usageResp.body.result?.payloadSize
      if (payloadSize != null) return res.json({ usedBytes: Number(payloadSize), raw: usageResp.body, status: usageResp.status })
    }

    const bucketResp = await cfFetch(`/r2/buckets/${bucket}`)
    if (bucketResp.body.success) {
      const bucketSize = bucketResp.body.result?.bucketSize
      if (bucketSize != null) return res.json({ usedBytes: bucketSize, raw: bucketResp.body, status: bucketResp.status })
    }

    res.json({ error: "Cloudflare API did not return storage size", usedBytes: null, raw: [usageResp, bucketResp] })
  } catch (err) {
    res.json({ error: err.message, usedBytes: null })
  }
}

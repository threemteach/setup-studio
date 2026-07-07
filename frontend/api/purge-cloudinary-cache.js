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

  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ error: "Cloudinary credentials not configured" })
  }

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")

  // Purge portfolio-thumbnails URLs via Cloudinary Admin API
  // First list all remaining images under the prefix to get their URLs
  const params = new URLSearchParams({
    prefix: "setup-studio/locations/portfolio-thumbnails/",
    max_results: "500",
    type: "upload",
  })

  const listRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?${params}`,
    { headers: { Authorization: `Basic ${auth}` } }
  )

  if (!listRes.ok) {
    const errText = await listRes.text()
    return res.status(500).json({ error: `Cloudinary list failed: ${errText}` })
  }

  const listData = await listRes.json()
  const resources = listData.resources || []
  const urls = resources.map(r => r.secure_url)

  // Purge all found URLs
  let purged = 0
  const errors = []

  for (let i = 0; i < urls.length; i += 100) {
    const batch = urls.slice(i, i + 100)
    try {
      const purgeRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/cache/purge`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ urls: batch }),
        }
      )
      if (purgeRes.ok) {
        purged += batch.length
      } else {
        const errText = await purgeRes.text().catch(() => "unknown")
        errors.push({ batch: i / 100, error: errText.slice(0, 200) })
      }
    } catch (err) {
      errors.push({ batch: i / 100, error: err.message })
    }
  }

  return res.status(200).json({
    purged,
    total_found: urls.length,
    errors: errors.length > 0 ? errors : undefined,
    note: "CDN cache invalidation may take up to 30 minutes to propagate globally",
  })
}

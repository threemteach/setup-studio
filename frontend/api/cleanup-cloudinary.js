import { createClient } from "@supabase/supabase-js"

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

  // Accept optional next_cursor + total stats from previous runs
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {}
  const incomingCursor = body.next_cursor || null
  const accumulatedDeleted = body.deleted_so_far || 0

  // 1. Fetch all used public_ids from the photos table
  const { data: photos } = await supabase
    .from("photos")
    .select("cloudinary_public_id")
    .not("cloudinary_public_id", "is", null)

  const usedIds = new Set(photos?.map(p => p.cloudinary_public_id) || [])

  // Also protect portfolio video thumbnails (stored as Cloudinary URLs)
  const { data: portfolioVideos } = await supabase
    .from("portfolio_videos")
    .select("thumbnail_url")
    .not("thumbnail_url", "is", null)
    .neq("thumbnail_url", "")

  for (const v of portfolioVideos || []) {
    const match = v.thumbnail_url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i)
    if (match) usedIds.add(match[1])
  }

  // 2. List ONE page of Cloudinary images
  // First, try getting total count via a separate request with max_results=0
  let totalOnCloudinary = null
  if (!incomingCursor) {
    const countParams = new URLSearchParams({
      prefix: "setup-studio/locations/",
      max_results: "0",
      type: "upload",
    })
    const countRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?${countParams}`,
      { headers: { Authorization: `Basic ${auth}` } }
    )
    if (countRes.ok) {
      const countData = await countRes.json()
      totalOnCloudinary = countData.total_count || countData.resources?.length || null
    }
  }

  const params = new URLSearchParams({
    prefix: "setup-studio/locations/",
    max_results: "500",
    type: "upload",
  })
  if (incomingCursor) params.set("next_cursor", incomingCursor)

  const listRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?${params}`,
    { headers: { Authorization: `Basic ${auth}` } }
  )

  if (!listRes.ok) {
    const errText = await listRes.text()
    return res.status(500).json({ error: `Cloudinary list failed: ${errText}` })
  }

  const listData = await listRes.json()
  const pageIds = (listData.resources || []).map(r => r.public_id)
  const nextCursor = listData.next_cursor || null

  // Debug: show sample IDs on first page to understand format mismatch
  const extactedPortfolioIds = [...usedIds].filter(id => id.includes("portfolio-thumbnails"))
  const debug = !incomingCursor ? {
    total_on_cloudinary: totalOnCloudinary,
    used_in_photos: usedIds.size,
    used_from_portfolio_videos: portfolioVideos?.length || 0,
    sample_cloudinary_ids: pageIds.slice(0, 3),
    sample_used_ids: [...usedIds].slice(0, 3),
    sample_portfolio_used_ids: extactedPortfolioIds.slice(0, 5),
    portfolio_used_count: extactedPortfolioIds.length,
  } : undefined

  // 3. Find unused IDs on this page
  const unusedIds = pageIds.filter(id => !usedIds.has(id))

  // Debug portfolio thumbnails on this page
  const portfolioOnPage = pageIds.filter(id => id.includes("portfolio-thumbnails"))
  const unusedPortfolioOnPage = portfolioOnPage.filter(id => !usedIds.has(id))

  // 4. Delete this page's unused images using the same proven endpoint as delete-image.js
  let pageDeleted = 0
  const deleteErrors = []

  for (const publicId of unusedIds) {
    try {
      const delRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ public_id: publicId }),
        }
      )
      if (delRes.ok) {
        const delData = await delRes.json()
        if (delData.result === "ok") pageDeleted++
      } else {
        const errText = await delRes.text().catch(() => "unknown")
        deleteErrors.push({ publicId, status: delRes.status, error: errText.slice(0, 100) })
      }
    } catch (err) {
      deleteErrors.push({ publicId, error: err.message })
    }
  }

  const totalDeleted = accumulatedDeleted + pageDeleted

  return res.status(200).json({
    page_deleted: pageDeleted,
    total_deleted: totalDeleted,
    next_cursor: nextCursor,
    done: !nextCursor,
    page_portfolio_count: portfolioOnPage.length,
    page_portfolio_unused: unusedPortfolioOnPage.length,
    delete_error_count: deleteErrors.length,
    delete_errors_sample: deleteErrors.slice(0, 3),
    ...(debug ? { debug } : {}),
  })
}

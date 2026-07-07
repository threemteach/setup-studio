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

  // 1. Fetch all used public_ids from the photos table
  const { data: photos } = await supabase
    .from("photos")
    .select("cloudinary_public_id")
    .not("cloudinary_public_id", "is", null)

  const usedIds = new Set(photos?.map(p => p.cloudinary_public_id) || [])

  // 2. List all images from Cloudinary (paginated)
  let allCloudinaryIds = []
  let nextCursor = null

  do {
    const params = new URLSearchParams({
      prefix: "setup-studio/locations/",
      max_results: "500",
      type: "upload",
    })
    if (nextCursor) params.set("next_cursor", nextCursor)

    const listRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?${params}`,
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    )

    if (!listRes.ok) {
      const errText = await listRes.text()
      return res.status(500).json({ error: `Cloudinary list failed: ${errText}` })
    }

    const listData = await listRes.json()
    for (const resource of listData.resources || []) {
      allCloudinaryIds.push(resource.public_id)
    }
    nextCursor = listData.next_cursor || null
  } while (nextCursor)

  // 3. Find unused ones
  const unusedIds = allCloudinaryIds.filter(id => !usedIds.has(id))
  const totalUnused = unusedIds.length

  // 4. Delete in batches of 100
  const BATCH_SIZE = 100
  let deleted = 0
  const errors = []

  for (let i = 0; i < unusedIds.length; i += BATCH_SIZE) {
    const batch = unusedIds.slice(i, i + BATCH_SIZE)
    try {
      const delRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload/destroy`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ public_ids: batch }),
        }
      )
      const delData = await delRes.json()
      if (delData.deleted) {
        deleted += Object.values(delData.deleted).filter(s => s === "deleted").length
      }
      if (delData.deleted_counts) {
        deleted += delData.deleted_counts.deleted || 0
      }
    } catch (err) {
      errors.push({ batch: i / BATCH_SIZE, error: err.message })
    }
  }

  return res.status(200).json({
    total_on_cloudinary: allCloudinaryIds.length,
    total_used_in_db: usedIds.size,
    total_unused: totalUnused,
    deleted,
    errors: errors.length > 0 ? errors : undefined,
  })
}

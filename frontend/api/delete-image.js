import { createClient } from "@supabase/supabase-js"

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json")

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  // Verify auth
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

  // Delete from Cloudinary
  const { public_id } = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {}
  if (!public_id) {
    return res.status(400).json({ error: "Missing public_id" })
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ error: "Cloudinary credentials not configured" })
  }

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ public_id }),
      }
    )

    const data = await response.json()

    if (data.result === "ok") {
      return res.status(200).json({ success: true })
    }

    return res.status(400).json({ error: "Cloudinary delete failed", details: data })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

import { readdirSync, statSync, createReadStream } from "fs"
import { join } from "path"
import { createClient } from "@supabase/supabase-js"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { readFile } from "fs/promises"

// ── Config ──────────────────────────────────────────────────────────
const SOURCE = "C:\\Users\\mahmo\\Downloads\\Video Showcase"

const SUPABASE_URL = "https://mrtxjbwdcxqmiocpnzvi.supabase.co"
const SUPABASE_KEY = "sb_publishable_eMHBoRF3jGQ2xTFg7ph-iw_M6bmY6TH"

const R2_ENDPOINT = "https://fba1cd78b5f83abd727ffd95bd6ce95e.r2.cloudflarestorage.com"
const R2_BUCKET = "setup-studio-videos"
const R2_PUBLIC_URL = "https://pub-c4df1a6cb264438fac91039f7a4e0e5d.r2.dev"
const R2_ACCESS_KEY_ID = "f36882d966a5aa9a7d458a05fc329f5f"
const R2_SECRET_ACCESS_KEY = "ccf4376844c01fab93f841891a37764ba58a9905fce50246da85d333c9f810de"

// Folder display name → slug mapping
const FOLDER_MAP = {
  "Event Coverage": "event-coverage",
  "Fashion Content": "fashion-content",
  "Food & Beverage": "food-beverage",
  "Medical  Content": "medical-content",
  "Reels & Social Content": "reels-social",
  "Social Media Ads- Ad Campaigns": "ads-campaigns",
}

// ── Clients ─────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

// ── Helpers ─────────────────────────────────────────────────────────
const VIDEO_EXTS = new Set([".mp4", ".mov", ".webm", ".avi", ".mkv", ".m4v"])

function makeSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `cat-${Date.now()}`
}

function isVideo(file) {
  const ext = file.toLowerCase().slice(file.lastIndexOf("."))
  return VIDEO_EXTS.has(ext)
}

function fileNameWithoutExt(name) {
  return name.slice(0, name.lastIndexOf(".")) || name
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log("Reading folders from:", SOURCE)
  const folders = readdirSync(SOURCE, { withFileTypes: true }).filter(d => d.isDirectory())

  let totalVideos = 0
  let uploaded = 0
  let skipped = 0

  for (const folder of folders) {
    const folderName = folder.name.trim()
    const slug = FOLDER_MAP[folderName]
    if (!slug) {
      console.warn(`⚠  No slug mapping for folder "${folderName}" — skipping`)
      continue
    }
    console.log(`\n── ${folderName} ──> slug: ${slug}`)

    const files = readdirSync(join(SOURCE, folderName)).filter(f => isVideo(f))
    if (files.length === 0) {
      console.log("  No video files found")
      continue
    }

    for (const file of files) {
      totalVideos++
      const filePath = join(SOURCE, folderName, file)
      const title = fileNameWithoutExt(file)

      // Skip if already imported (by title_en + category)
      const { data: existing } = await supabase
        .from("portfolio_videos")
        .select("id")
        .eq("category", slug)
        .eq("title_en", title)
        .maybeSingle()
      if (existing) {
        console.log(`  - ${file} (already imported)`)
        skipped++
        continue
      }

      const key = `${slug}/${Date.now()}-${file}`
      const contentType = `video/${file.split(".").pop()}`
      const videoUrl = `${R2_PUBLIC_URL}/${key}`

      try {
        const stats = statSync(filePath)
        console.log(`  Uploading: ${file} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`)

        const body = stats.size > 100 * 1024 * 1024
          ? createReadStream(filePath)
          : await readFile(filePath)

        await s3.send(new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: body,
          ContentType: contentType,
        }))

        const { error } = await supabase.from("portfolio_videos").insert({
          category: slug,
          title_en: title,
          title_ar: "",
          description_en: "",
          description_ar: "",
          video_url: videoUrl,
          video_key: key,
          sort_order: 0,
        })
        if (error) throw error

        uploaded++
        console.log(`  ✓ ${file}`)
      } catch (err) {
        console.error(`  ✗ ${file}: ${err.message}`)
      }
    }
  }

  // Ensure portfolio_content exists
  console.log("\n── Ensuring portfolio_content exists ──")
  const { data: existing } = await supabase.from("portfolio_content").select("id").eq("id", 1).maybeSingle()
  if (!existing) {
    const cats = Object.entries(FOLDER_MAP).map(([display, slug]) => ({
      slug,
      heading_en: display,
      heading_ar: "",
      desc_en: "",
      desc_ar: "",
    }))
    const { error } = await supabase.from("portfolio_content").insert({
      id: 1,
      hero_heading_en: "Our Work",
      hero_heading_ar: "أعمالنا",
      hero_subtitle_en: "Explore our video production portfolio across different categories",
      hero_subtitle_ar: "تصفح أعمالنا في إنتاج الفيديو عبر مختلف الفئات",
      categories: cats,
    })
    if (error) console.error("  ✗ Failed to create portfolio_content:", error.message)
    else console.log("  ✓ portfolio_content created")
  } else {
    console.log("  portfolio_content already exists")
  }

  console.log(`\n── Done ── ${uploaded} uploaded, ${skipped} skipped, ${totalVideos} total`)
}

main().catch(console.error)

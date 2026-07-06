import http from "http"
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

// load .env
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, "..", ".env")
try {
  const envText = readFileSync(envPath, "utf-8")
  for (const line of envText.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const idx = trimmed.indexOf("=")
    if (idx === -1) continue
    const key = trimmed.slice(0, idx)
    let val = trimmed.slice(idx + 1)
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
    if (!process.env[key]) process.env[key] = val
  }
} catch {}

async function loadHandler(name) {
  const mod = await import(`../api/${name}.js`)
  return mod.default
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = ""
    req.on("data", (chunk) => { body += chunk })
    req.on("end", () => {
      try { resolve(JSON.parse(body)) }
      catch { resolve({}) }
    })
  })
}

function wrapRes(res) {
  res.status = function (code) {
    res.statusCode = code
    return res
  }
  res.json = function (obj) {
    res.setHeader("Content-Type", "application/json")
    res.end(JSON.stringify(obj))
  }
  return res
}

const server = http.createServer(async (req, res) => {
  wrapRes(res)
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "*")
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return }

  const url = new URL(req.url, "http://localhost")
  const path = url.pathname

  if (path.startsWith("/api/")) {
    const name = path.replace("/api/", "").replace(/\.js$/, "")
    try {
      const handler = await loadHandler(name)
      const body = await parseBody(req)
      req.body = body
      await handler(req, res)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
    return
  }

  res.writeHead(404).end()
})

const PORT = 3001
server.listen(PORT, () => {
  console.log(`API dev server running on http://localhost:${PORT}`)
})

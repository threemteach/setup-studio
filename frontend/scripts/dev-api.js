import http from "http"
import { readFileSync, existsSync } from "fs"

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

const server = http.createServer(async (req, res) => {
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
      res.writeHead(500, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  res.writeHead(404).end()
})

const PORT = 3001
server.listen(PORT, () => {
  console.log(`API dev server running on http://localhost:${PORT}`)
})

export function sanitizeError(msg) {
  if (!msg) return ""
  return msg
    .replace(/[Cc]loudflare/gi, "database")
    .replace(/[Cc]loudinary/gi, "photos database")
    .replace(/[Ss]upabase/gi, "backend")
}

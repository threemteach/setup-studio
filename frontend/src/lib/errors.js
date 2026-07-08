export function sanitizeError(msg) {
  if (!msg) return ""
  return msg
    .replace(/(?<!\.)\b[Cc]loudflare\b/gi, "database")
    .replace(/(?<!\.)\b[Cc]loudinary\b/gi, "photos database")
    .replace(/(?<!\.)\b[Ss]upabase\b/gi, "backend")
}

export function optimizeImageUrl(url, width) {
  if (!url || !url.includes("res.cloudinary.com")) return url

  const parts = url.split("/upload/")
  if (parts.length !== 2) return url

  let transforms = "f_auto,q_auto:eco"
  if (width) transforms += `,w_${width}`

  return `${parts[0]}/upload/${transforms}/${parts[1]}`
}

export function imgSize(width) {
  return width ? `w_${width}` : ""
}

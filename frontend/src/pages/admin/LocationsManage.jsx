import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import AdminLayout from "../../components/admin/AdminLayout"
import { fetchAllPhotos, fetchCoverPhoto } from "../../lib/photos"
import { optimizeImageUrl } from "../../lib/images"

const categories = [
  { slug: "podcast", title: "Podcast" },
  { slug: "reels", title: "Reels" },
  { slug: "office", title: "Office" },
  { slug: "samples", title: "Samples" },
]

export default function LocationsManage() {
  const navigate = useNavigate()
  const [allPhotos, setAllPhotos] = useState([])
  const [coverPhotos, setCoverPhotos] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchAllPhotos().catch(() => []),
      ...categories.map((cat) =>
        fetchCoverPhoto(cat.slug)
          .then((photo) => ({ slug: cat.slug, url: photo?.cloudinary_url || "" }))
          .catch(() => ({ slug: cat.slug, url: "" }))
      ),
    ]).then(([all, ...covers]) => {
      setAllPhotos(all)
      const map = {}
      covers.forEach(({ slug, url }) => { map[slug] = url })
      setCoverPhotos(map)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  const categoryCounts = categories.map((cat) => {
    const count = allPhotos.filter((p) => p.category === cat.slug).length
    return {
      slug: cat.slug,
      title: cat.title,
      count,
      percentage: allPhotos.length > 0 ? Math.round((count / allPhotos.length) * 100) : 0,
    }
  })

  const recentPhotos = [...allPhotos]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4)

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-navy font-bold text-2xl m-0">Location Categories</h1>
        <p className="text-muted text-sm m-0 mt-1">Manage photos across all your studio spaces</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6.5 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-border/85 p-6.5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-navy font-bold text-base m-0">Library Allocation</h3>
                  <p className="text-muted text-xs m-0 mt-0.5">Distribution of assets across locations</p>
                </div>
                <span className="text-xs font-bold text-navy bg-navy/5 px-3 py-1 rounded-full">
                  {allPhotos.length} Total Assets
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categoryCounts.map(({ slug, title, count, percentage }) => {
                  const coverUrl = coverPhotos[slug] || allPhotos.find((p) => p.category === slug)?.cloudinary_url || ""
                  return (
                    <button
                      key={slug}
                      onClick={() => navigate(`/admin/locations/${slug}`)}
                      className="group relative rounded-[1.5rem] overflow-hidden bg-gray-100 shadow-[0_4px_24px_rgba(48,93,116,0.08)] hover:shadow-[0_8px_32px_rgba(48,93,116,0.16)] transition-all duration-300 w-full ltr:text-left rtl:text-right cursor-pointer"
                    >
                      <div className="w-full aspect-square relative">
                        {coverUrl ? (
                          <img
                            src={optimizeImageUrl(coverUrl, 800)}
                            alt={slug}
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <i className="fa-solid fa-image text-gray-300 text-3xl" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-400/60 via-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </div>
                      <div className="absolute bottom-0 ltr:left-4 rtl:right-4 ltr:right-4 rtl:left-4 bg-white rounded-t-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-1px_8px_rgba(48,93,116,0.06)]">
                        <div>
                          <h3 className="text-navy font-bold text-sm m-0 capitalize tracking-tight">{title}</h3>
                          <p className="text-muted text-[11px] m-0 mt-0.5 font-medium">{count} photo{count !== 1 ? "s" : ""} ({percentage}%)</p>
                        </div>
                        <span className="block w-[3px] self-stretch bg-navy rounded-sm shrink-0" />
                        <span className="text-[11px] font-semibold text-navy shrink-0 whitespace-nowrap">
                          Manage <i className="fa-solid fa-arrow-right ltr:ml-1 rtl:mr-1 text-[10px]" />
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-border/85 p-6.5 shadow-sm flex flex-col">
            <div className="mb-5">
              <h3 className="text-navy font-bold text-base m-0">Recent Uploads</h3>
              <p className="text-muted text-xs m-0 mt-0.5">Latest library acquisitions</p>
            </div>

            {recentPhotos.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-muted">
                <i className="fa-solid fa-photo-film text-gray-300 text-3xl mb-2" />
                <p className="text-xs m-0 font-medium">No recent uploads found</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4.5 flex-1">
                {recentPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => navigate(`/admin/locations/${photo.category}`)}
                    className="group flex items-center gap-3.5 p-2 rounded-2xl hover:bg-gray-50/80 cursor-pointer transition-all duration-200"
                  >
                    <div className="w-12.5 h-12.5 rounded-xl overflow-hidden bg-gray-100 shrink-0 shadow-sm">
                      <img
                        src={optimizeImageUrl(photo.cloudinary_url, 150)}
                        alt=""
                        className="w-full h-full object-cover block"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-navy font-bold text-xs.5 truncate m-0 leading-tight">
                        {photo.title || "Untitled File"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-red bg-red/5 px-2 py-0.5 rounded-md">
                          {photo.category}
                        </span>
                        <span className="text-[10px] text-muted font-medium">
                          {new Date(photo.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <i className="fa-solid fa-circle-chevron-right text-muted/30 group-hover:text-red transition-colors duration-200 text-sm shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

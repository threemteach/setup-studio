import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import AdminLayout from "../../components/admin/AdminLayout"
import { fetchAllPhotos, fetchCoverPhoto } from "../../lib/photos"
import { optimizeImageUrl } from "../../lib/images"
import { fetchStorageUsage } from "../../lib/portfolio"

const statCards = [
  {
    label: "Total Gallery Photos",
    icon: "fa-solid fa-image",
    gradient: "from-[#e73b49] to-[#ff6b7a]",
    light: "bg-red/5",
    accent: "text-red",
  },
  {
    label: "Active Categories",
    icon: "fa-solid fa-layer-group",
    gradient: "from-[#305d74] to-[#4a84a1]",
    light: "bg-navy/5",
    accent: "text-navy",
  },
  {
    label: "Library Status",
    icon: "fa-solid fa-circle-check",
    gradient: "from-emerald-500 to-teal-500",
    light: "bg-emerald-500/5",
    accent: "text-emerald-600",
  },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const [allPhotos, setAllPhotos] = useState([])
  const [coverPhotos, setCoverPhotos] = useState({})
  const [storage, setStorage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchAllPhotos().catch(() => []),
      ...categories.map((slug) =>
        fetchCoverPhoto(slug)
          .then((photo) => ({ slug, url: photo?.cloudinary_url || "" }))
          .catch(() => ({ slug, url: "" }))
      ),
    ]).then(([all, ...covers]) => {
      setAllPhotos(all)
      const map = {}
      covers.forEach(({ slug, url }) => { map[slug] = url })
      setCoverPhotos(map)
    }).catch(console.error)
    fetchStorageUsage().then(setStorage).catch(() => {})
    .finally(() => setLoading(false))
  }, [])

  const categories = ["podcast", "reels", "office", "samples"]
  const categoryCounts = categories.map((slug) => {
    const count = allPhotos.filter((p) => p.category === slug).length
    return {
      slug,
      count,
      percentage: allPhotos.length > 0 ? Math.round((count / allPhotos.length) * 100) : 0,
    }
  })

  // Get the 4 most recently uploaded photos
  const recentPhotos = [...allPhotos]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4)

  const stats = [
    {
      label: statCards[0].label,
      value: allPhotos.length.toString(),
      icon: statCards[0].icon,
      gradient: statCards[0].gradient,
      light: statCards[0].light,
      accent: statCards[0].accent,
    },
    {
      label: statCards[1].label,
      value: categories.length.toString(),
      icon: statCards[1].icon,
      gradient: statCards[1].gradient,
      light: statCards[1].light,
      accent: statCards[1].accent,
    },
    {
      label: statCards[2].label,
      value: allPhotos.length > 0 ? "Operational" : "Empty",
      icon: statCards[2].icon,
      gradient: statCards[2].gradient,
      light: statCards[2].light,
      accent: statCards[2].accent,
    },
  ]

  // Format today's date elegantly
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <AdminLayout>
      {/* ─── Premium Welcome Banner (Dark theme style) ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0A1216] text-white p-6 sm:p-8 mb-8 shadow-xl shadow-navy/5">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#11AFFF] opacity-25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-red opacity-15 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red animate-pulse" />
              <span className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-white/60">Studio Control Center</span>
            </div>
            <h1 className="text-white font-extrabold text-2xl sm:text-3xl m-0 tracking-tight leading-tight">
              Welcome back, Setup Admin
            </h1>
            <p className="text-white/60 text-xs sm:text-sm m-0 mt-1.5 font-medium">
              Monitor, organize, and publish visual assets for Setup Studio.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center md:text-right shrink-0">
            <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wider m-0">System Date</p>
            <p className="text-white font-bold text-xs sm:text-sm m-0 mt-0.5">{formattedDate}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-navy/20 dark:border-white/20 border-t-navy dark:border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ─── Metric Cards Grid ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {stats.map((s) => (
              <div
                key={s.label}
                className="group relative bg-white dark:bg-[#15202b] rounded-2xl border border-border/80 dark:border-[#1e2d3d]/80 p-5.5 hover:shadow-xl hover:shadow-navy/[0.04] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 ltr:right-0 rtl:left-0 w-24 h-24 rounded-full bg-gradient-to-br from-navy/[0.02] to-transparent -translate-y-8 ltr:translate-x-8 rtl:-translate-x-8" />
                
                <div className="flex items-center justify-between mb-4.5">
                  <div className={`w-11 h-11 rounded-xl ${s.light} flex items-center justify-center`}>
                    <i className={`${s.icon} bg-gradient-to-br ${s.gradient} bg-clip-text text-transparent text-xl`} />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md flex items-center gap-1">
                    <i className="fa-solid fa-circle text-[6px] animate-pulse" /> Live
                  </span>
                </div>
                
                <p className="text-muted dark:text-white/50 text-xs font-semibold uppercase tracking-wider m-0 mb-1">{s.label}</p>
                <p className="text-navy dark:text-white font-bold text-2.5xl m-0 tracking-tight leading-none">{s.value}</p>
              </div>
            ))}
          </div>

          {/* ─── Storage Bar ─── */}
          {storage && (() => {
            const pct = (storage.usedBytes / storage.limitBytes) * 100
            const barColor = pct < 70 ? "bg-green-500" : pct < 90 ? "bg-yellow-500" : "bg-red-500"
            const textColor = pct < 70 ? "text-green-600" : pct < 90 ? "text-yellow-600" : "text-red-600"
            return (
              <div className="bg-white dark:bg-[#15202b] rounded-3xl border border-border/50 dark:border-[#1e2d3d]/50 shadow-sm p-5 mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-navy dark:text-white font-semibold text-sm"><i className="fa-solid fa-database mr-2 text-navy/40 dark:text-white/40" />Database</span>
                  <span className={`text-xs font-bold ${textColor}`}>{storage.usedMB.toFixed(2)} MB / {storage.limitGB} GB</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-[#1e2d3d] rounded-full h-3 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-muted/50 dark:text-white/30 mt-1">
                  <span>0 GB</span>
                  <span>{pct < 100 ? `${pct.toFixed(1)}% used` : "FULL"}</span>
                  <span>{storage.limitGB} GB</span>
                </div>
              </div>
            )
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6.5 mb-8">
            {/* ─── Column 1 & 2: Dynamic Category Progress & Quick Actions ─── */}
            <div className="lg:col-span-2 flex flex-col gap-6.5">
              {/* Category Breakdown Panel */}
              <div className="bg-white dark:bg-[#15202b] rounded-3xl border border-border/85 dark:border-[#1e2d3d]/85 p-6.5 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-navy dark:text-white font-bold text-base m-0">Library Allocation</h3>
                    <p className="text-muted dark:text-white/50 text-xs m-0 mt-0.5">Distribution of assets across locations</p>
                  </div>
                  <span className="text-xs font-bold text-navy dark:text-white bg-navy/5 dark:bg-white/10 px-3 py-1 rounded-full">
                    {allPhotos.length} Total Assets
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categoryCounts.map(({ slug, count, percentage }) => {
                    const coverUrl = coverPhotos[slug] || allPhotos.find((p) => p.category === slug)?.cloudinary_url || ""
                    return (
                      <button
                        key={slug}
                        onClick={() => navigate(`/admin/locations/${slug}`)}
                        className="group relative rounded-[1.5rem] overflow-hidden bg-gray-100 dark:bg-[#0f1a24] shadow-[0_4px_24px_rgba(48,93,116,0.08)] hover:shadow-[0_8px_32px_rgba(48,93,116,0.16)] transition-all duration-300 w-full ltr:text-left rtl:text-right cursor-pointer"
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
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-[#0f1a24]">
                              <i className="fa-solid fa-image text-gray-300 dark:text-white/20 text-3xl" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-blue-400/60 via-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        </div>
                        <div className="absolute bottom-0 ltr:left-4 rtl:right-4 ltr:right-4 rtl:left-4 bg-white dark:bg-[#0f1a24] rounded-t-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-1px_8px_rgba(48,93,116,0.06)]">
                          <div>
                            <h3 className="text-navy dark:text-white font-bold text-sm m-0 capitalize tracking-tight">{slug}</h3>
                            <p className="text-muted dark:text-white/50 text-[11px] m-0 mt-0.5 font-medium">{count} photo{count !== 1 ? "s" : ""} ({percentage}%)</p>
                          </div>
                          <span className="block w-[3px] self-stretch bg-navy dark:bg-white/30 rounded-sm shrink-0" />
                          <span className="text-[11px] font-semibold text-navy dark:text-white shrink-0 whitespace-nowrap">
                            Manage <i className="fa-solid fa-arrow-right ltr:ml-1 rtl:mr-1 text-[10px]" />
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quick Shortcuts */}
              <div className="bg-white dark:bg-[#15202b] rounded-3xl border border-border/85 dark:border-[#1e2d3d]/85 p-6.5 shadow-sm">
                <h3 className="text-navy dark:text-white font-bold text-base mb-4.5">Quick Shortcuts</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate("/admin/locations")}
                    className="group flex items-center gap-4 bg-[#F8FAFC] dark:bg-[#1e2d3d] hover:bg-navy hover:text-white rounded-2xl p-4.5 transition-all duration-300 border-0 cursor-pointer ltr:text-left rtl:text-right w-full shadow-sm hover:shadow-lg hover:shadow-navy/10 hover:-translate-y-0.5"
                  >
                    <div className="w-11 h-11 rounded-xl bg-navy text-white flex items-center justify-center shrink-0 group-hover:bg-white transition-all duration-300">
                      <i className="fa-solid fa-location-dot text-lg group-hover:text-navy" />
                    </div>
                    <div>
                      <p className="text-navy dark:text-white font-bold text-sm m-0 group-hover:text-white transition-colors duration-300">Manage Locations</p>
                      <p className="text-muted dark:text-white/50 text-xs m-0 mt-0.5 group-hover:text-white/70 transition-colors duration-300">Upload & organize photos</p>
                    </div>
                    <i className="fa-solid fa-chevron-right text-muted/40 dark:text-white/20 text-xs ltr:ml-auto rtl:mr-auto group-hover:text-white/80 group-hover:ltr:translate-x-0.5 group-hover:rtl:-translate-x-0.5 transition-all duration-300" />
                  </button>

                  <button
                    onClick={() => navigate("/admin/homepage")}
                    className="group flex items-center gap-4 bg-[#F8FAFC] dark:bg-[#1e2d3d] hover:bg-emerald-600 hover:text-white rounded-2xl p-4.5 transition-all duration-300 border-0 cursor-pointer ltr:text-left rtl:text-right w-full shadow-sm hover:shadow-lg hover:shadow-navy/10 hover:-translate-y-0.5"
                  >
                    <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:bg-white transition-all duration-300">
                      <i className="fa-solid fa-house text-lg group-hover:text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-navy dark:text-white font-bold text-sm m-0 group-hover:text-white transition-colors duration-300">Edit Homepage</p>
                      <p className="text-muted dark:text-white/50 text-xs m-0 mt-0.5 group-hover:text-white/70 transition-colors duration-300">Hero, process, quotes & more</p>
                    </div>
                    <i className="fa-solid fa-chevron-right text-muted/40 dark:text-white/20 text-xs ltr:ml-auto rtl:mr-auto group-hover:text-white/80 group-hover:ltr:translate-x-0.5 group-hover:rtl:-translate-x-0.5 transition-all duration-300" />
                  </button>

                  <button
                    onClick={() => navigate("/admin/about")}
                    className="group flex items-center gap-4 bg-[#F8FAFC] dark:bg-[#1e2d3d] hover:bg-violet-600 hover:text-white rounded-2xl p-4.5 transition-all duration-300 border-0 cursor-pointer ltr:text-left rtl:text-right w-full shadow-sm hover:shadow-lg hover:shadow-navy/10 hover:-translate-y-0.5"
                  >
                    <div className="w-11 h-11 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 group-hover:bg-white transition-all duration-300">
                      <i className="fa-solid fa-circle-info text-lg group-hover:text-violet-600" />
                    </div>
                    <div>
                      <p className="text-navy dark:text-white font-bold text-sm m-0 group-hover:text-white transition-colors duration-300">Edit About Page</p>
                      <p className="text-muted dark:text-white/50 text-xs m-0 mt-0.5 group-hover:text-white/70 transition-colors duration-300">Story, services & values</p>
                    </div>
                    <i className="fa-solid fa-chevron-right text-muted/40 dark:text-white/20 text-xs ltr:ml-auto rtl:mr-auto group-hover:text-white/80 group-hover:ltr:translate-x-0.5 group-hover:rtl:-translate-x-0.5 transition-all duration-300" />
                  </button>

                  <button
                    onClick={() => navigate("/admin/academy")}
                    className="group flex items-center gap-4 bg-[#F8FAFC] dark:bg-[#1e2d3d] hover:bg-amber-600 hover:text-white rounded-2xl p-4.5 transition-all duration-300 border-0 cursor-pointer ltr:text-left rtl:text-right w-full shadow-sm hover:shadow-lg hover:shadow-navy/10 hover:-translate-y-0.5"
                  >
                    <div className="w-11 h-11 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 group-hover:bg-white transition-all duration-300">
                      <i className="fa-solid fa-graduation-cap text-lg group-hover:text-amber-600" />
                    </div>
                    <div>
                      <p className="text-navy dark:text-white font-bold text-sm m-0 group-hover:text-white transition-colors duration-300">Edit Academy Page</p>
                      <p className="text-muted dark:text-white/50 text-xs m-0 mt-0.5 group-hover:text-white/70 transition-colors duration-300">Courses, instructors & FAQ</p>
                    </div>
                    <i className="fa-solid fa-chevron-right text-muted/40 dark:text-white/20 text-xs ltr:ml-auto rtl:mr-auto group-hover:text-white/80 group-hover:ltr:translate-x-0.5 group-hover:rtl:-translate-x-0.5 transition-all duration-300" />
                  </button>

                  <button
                    onClick={() => navigate("/admin/portfolio")}
                    className="group flex items-center gap-4 bg-[#F8FAFC] dark:bg-[#1e2d3d] hover:bg-sky-600 hover:text-white rounded-2xl p-4.5 transition-all duration-300 border-0 cursor-pointer ltr:text-left rtl:text-right w-full shadow-sm hover:shadow-lg hover:shadow-navy/10 hover:-translate-y-0.5"
                  >
                    <div className="w-11 h-11 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 group-hover:bg-white transition-all duration-300">
                      <i className="fa-solid fa-folder-open text-lg group-hover:text-sky-600" />
                    </div>
                    <div>
                      <p className="text-navy dark:text-white font-bold text-sm m-0 group-hover:text-white transition-colors duration-300">Edit Portfolio</p>
                      <p className="text-muted dark:text-white/50 text-xs m-0 mt-0.5 group-hover:text-white/70 transition-colors duration-300">Hero, categories & videos</p>
                    </div>
                    <i className="fa-solid fa-chevron-right text-muted/40 dark:text-white/20 text-xs ltr:ml-auto rtl:mr-auto group-hover:text-white/80 group-hover:ltr:translate-x-0.5 group-hover:rtl:-translate-x-0.5 transition-all duration-300" />
                  </button>

                  <button
                    onClick={() => window.open("/", "_blank")}
                    className="group flex items-center gap-4 bg-[#F8FAFC] dark:bg-[#1e2d3d] hover:bg-red hover:text-white rounded-2xl p-4.5 transition-all duration-300 border-0 cursor-pointer ltr:text-left rtl:text-right w-full shadow-sm hover:shadow-lg hover:shadow-red/10 hover:-translate-y-0.5"
                  >
                    <div className="w-11 h-11 rounded-xl bg-red text-white flex items-center justify-center shrink-0 group-hover:bg-white transition-all duration-300">
                      <i className="fa-solid fa-up-right-from-square text-lg group-hover:text-red" />
                    </div>
                    <div>
                      <p className="text-navy dark:text-white font-bold text-sm m-0 group-hover:text-white transition-colors duration-300">View Public Site</p>
                      <p className="text-muted dark:text-white/50 text-xs m-0 mt-0.5 group-hover:text-white/70 transition-colors duration-300">Open site in new tab</p>
                    </div>
                    <i className="fa-solid fa-up-right-from-square text-muted/40 dark:text-white/20 text-xs ltr:ml-auto rtl:mr-auto group-hover:text-white/80 group-hover:ltr:translate-x-0.5 group-hover:rtl:-translate-x-0.5 transition-all duration-300" />
                  </button>
                </div>
              </div>
            </div>

            {/* ─── Column 3: Live Recent Activities ─── */}
            <div className="bg-white dark:bg-[#15202b] rounded-3xl border border-border/85 dark:border-[#1e2d3d]/85 p-6.5 shadow-sm flex flex-col">
              <div className="mb-5">
                <h3 className="text-navy dark:text-white font-bold text-base m-0">Recent Uploads</h3>
                <p className="text-muted dark:text-white/50 text-xs m-0 mt-0.5">Latest library acquisitions</p>
              </div>

              {recentPhotos.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-muted dark:text-white/50">
                  <i className="fa-solid fa-photo-film text-gray-300 dark:text-white/20 text-3xl mb-2" />
                  <p className="text-xs m-0 font-medium">No recent uploads found</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4.5 flex-1">
                  {recentPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => navigate(`/admin/locations/${photo.category}`)}
                      className="group flex items-center gap-3.5 p-2 rounded-2xl hover:bg-gray-50/80 dark:hover:bg-white/5 cursor-pointer transition-all duration-200"
                    >
                      <div className="w-12.5 h-12.5 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#0f1a24] shrink-0 shadow-sm">
                        <img
                          src={optimizeImageUrl(photo.cloudinary_url, 150)}
                          alt=""
                          className="w-full h-full object-cover block"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-navy dark:text-white font-bold text-xs.5 truncate m-0 leading-tight">
                          {photo.title || "Untitled File"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-red bg-red/5 px-2 py-0.5 rounded-md">
                            {photo.category}
                          </span>
                          <span className="text-[10px] text-muted dark:text-white/50 font-medium">
                            {new Date(photo.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                      <i className="fa-solid fa-circle-chevron-right text-muted/30 dark:text-white/20 group-hover:text-red transition-colors duration-200 text-sm shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}

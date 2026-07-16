import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import AdminLayout from "../../components/admin/AdminLayout"
import Button from "../../components/ui/Button"
import Toast from "../../components/ui/Toast"
import CropModal from "../../components/admin/CropModal"
import ConfirmModal from "../../components/admin/ConfirmModal"
import { uploadToCloudinary } from "../../lib/cloudinary"
import { getSupabase } from "../../lib/supabase"
import { sanitizeError } from "../../lib/errors"
import { fetchPhotos, createPhoto, deletePhoto, updatePhoto, reorderPhotos, setCoverPhoto } from "../../lib/photos"
import { optimizeImageUrl } from "../../lib/images"

const categories = [
  { slug: "podcast", title: "Podcast" },
  { slug: "reels", title: "Reels" },
  { slug: "office", title: "Office" },
  { slug: "samples", title: "Samples" },
]

const iconMap = {
  podcast: "fa-solid fa-microphone",
  reels: "fa-solid fa-clapperboard",
  office: "fa-solid fa-building",
  samples: "fa-solid fa-folder-open",
}

export default function LocationCategory() {
  const { category } = useParams()
  const navigate = useNavigate()
  const cat = categories.find((c) => c.slug === category)

  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadCount, setUploadCount] = useState(0)

  const [cropPhoto, setCropPhoto] = useState(null)
  const fileInputRef = useRef(null)
  const replacingRef = useRef(null)
  const [pendingClearId, setPendingClearId] = useState(null)
  const [replaceMeta, setReplaceMeta] = useState(null)

  const [editing, setEditing] = useState(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editAlt, setEditAlt] = useState("")
  const [draggedIdx, setDraggedIdx] = useState(null)

  const [toast, setToast] = useState(null)
  const showToast = useCallback((message, type = "success") => setToast({ message, type }), [])
  const closeToast = useCallback(() => setToast(null), [])
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    if (editing) {
      const prev = document.body.style.overflow
      const prevOverscroll = document.body.style.overscrollBehavior
      document.body.style.overflow = "hidden"
      document.body.style.overscrollBehavior = "contain"
      return () => {
        document.body.style.overflow = prev
        document.body.style.overscrollBehavior = prevOverscroll
      }
    }
  }, [editing])

  const loadPhotos = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchPhotos(category)
      setPhotos(data)
    } catch (err) {
      console.error("Failed to load photos:", err)
    } finally {
      setLoading(false)
    }
  }, [category])

  useEffect(() => {
    if (cat) loadPhotos()
  }, [cat, loadPhotos])

  const uploadFile = async (file, replaceId) => {
    setUploading(true)
    try {
      const result = await uploadToCloudinary(file, category)

      if (replaceId) {
        const oldPhoto = photos.find((p) => p.id === replaceId)
        if (oldPhoto?.cloudinary_public_id) {
          const { data: { session } } = await getSupabase().auth.getSession()
          const token = session?.access_token
          fetch("/api/delete-image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ public_id: oldPhoto.cloudinary_public_id }),
          }).catch(() => {})
        }
        const updated = await updatePhoto(replaceId, {
          cloudinary_url: result.secure_url,
          cloudinary_public_id: result.public_id,
        })
        setPhotos((prev) => prev.map((p) => (p.id === replaceId ? { ...p, ...updated } : p)))
      } else {
        const created = await createPhoto({
          category,
          cloudinaryUrl: result.secure_url,
          cloudinaryPublicId: result.public_id,
        })
        if (photos.length === 0) {
          await setCoverPhoto(category, created.id).catch(() => {})
          created.is_cover = true
        }
        setPhotos((prev) => [...prev, created])
        setUploadCount((prev) => prev + 1)
        setEditing(created.id)
        setEditTitle("")
        setEditDesc("")
        setEditAlt("")
      }
    } catch (err) {
      showToast(sanitizeError(err.message) || "Upload failed", "error")
      setUploading(false)
      return
    }
    setUploading(false)
  }

  const uploadNext = async (files) => {
    if (files.length === 0) return
    const [first, ...rest] = files
    const replaceId = replacingRef.current
    replacingRef.current = null
    await uploadFile(first, replaceId)
    loadPhotos()
    if (rest.length > 0) uploadNext(rest)
  }

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) {
      replacingRef.current = null
      setReplaceMeta(null)
      return
    }
    e.target.value = ""
    uploadNext(files)
  }

  const handleDelete = async (id) => {
    setUploadCount(0)
    setToast(null)
    const photo = photos.find((p) => p.id === id)
    const wasCover = photo?.is_cover
    const remaining = photos.filter((p) => p.id !== id)
    setPhotos(remaining)
    try {
      await deletePhoto(id, photo?.cloudinary_public_id)
      if (wasCover && remaining.length > 0) {
        const nextCover = [...remaining].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )[0]
        const updated = await setCoverPhoto(category, nextCover.id)
        setPhotos((prev) => prev.map((p) => (p.id === updated.id ? updated : { ...p, is_cover: false })))
      }
    } catch (err) {
      showToast(sanitizeError(err.message) || "Delete failed", "error")
      console.error("Failed to delete:", err)
    }
  }

  const handleClearImage = (photo) => {
    setPendingClearId(photo.id)
  }

  const openEdit = (photo) => {
    setEditing(photo.id)
    setEditTitle(photo.title || "")
    setEditDesc(photo.description || "")
    setEditAlt(photo.alt || "")
  }

  const saveEdit = async (id) => {
    try {
      const updated = await updatePhoto(id, { title: editTitle || null, description: editDesc || null, alt: editAlt || null })
      setPhotos((prev) => prev.map((p) => (p.id === id ? updated : p)))
      setEditing(null)
    } catch (err) {
      console.error("Failed to update:", err)
    }
  }

  const handleSetCover = async (photo) => {
    try {
      const updated = await setCoverPhoto(category, photo.id)
      setPhotos((prev) => prev.map((p) => (p.category === category ? { ...p, is_cover: p.id === photo.id } : p)))
    } catch (err) {
      showToast(sanitizeError(err.message) || "Failed to set main photo", "error")
      console.error("Failed to set cover:", err)
    }
  }

  const handleCropClick = async (photo) => {
    try {
      const res = await fetch(photo.cloudinary_url)
      const blob = await res.blob()
      const file = new File([blob], "image.jpg", { type: blob.type })
      setCropPhoto({ photo, file })
    } catch {
      showToast("Failed to load image for cropping", "error")
    }
  }

  const handleCropEditDone = async ({ file: croppedFile, title, description, alt }) => {
    if (!cropPhoto) return
    const photo = cropPhoto.photo
    setCropPhoto(null)
    setUploading(true)
    try {
      const result = await uploadToCloudinary(croppedFile, category)
      if (photo?.cloudinary_public_id) {
        const { data: { session } } = await getSupabase().auth.getSession()
        const token = session?.access_token
        fetch("/api/delete-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ public_id: photo.cloudinary_public_id }),
        }).catch(() => {})
      }
      const updated = await updatePhoto(photo.id, {
        cloudinary_url: result.secure_url,
        cloudinary_public_id: result.public_id,
        ...(title != null ? { title, description, alt } : {}),
      })
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, ...updated } : p)))
      setUploading(false)
      loadPhotos()
    } catch (err) {
      showToast(sanitizeError(err.message) || "Crop upload failed", "error")
      setUploading(false)
    }
  }

  const handleCropEditCancel = () => {
    setCropPhoto(null)
  }

  const handleDrop = async (toIdx) => {
    if (draggedIdx === null || draggedIdx === toIdx) return
    const copy = [...photos]
    const [moved] = copy.splice(draggedIdx, 1)
    copy.splice(toIdx, 0, moved)
    setPhotos(copy)
    setDraggedIdx(null)
    try {
      await reorderPhotos(copy.map((p, i) => ({ id: p.id, sort_order: i })))
    } catch (err) {
      console.error("Failed to reorder:", err)
    }
  }

  if (!cat) {
    return (
      <AdminLayout>
        <p className="text-muted">Category not found.</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <button
          onClick={() => navigate("/admin/locations")}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-[#15202b] border border-border/60 dark:border-[#1e2d3d]/60 flex items-center justify-center text-muted dark:text-white/50 hover:text-navy dark:hover:text-white hover:border-navy/30 transition-all duration-200 cursor-pointer shrink-0"
        >
          <i className="fa-solid fa-arrow-left text-sm" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-navy/5 dark:bg-white/10 flex items-center justify-center shrink-0">
              <i className={`${iconMap[cat.slug]} text-navy dark:text-white text-sm`} />
            </div>
            <h1 className="text-navy dark:text-white font-bold text-xl sm:text-2xl m-0 truncate">{cat.title}</h1>
          </div>
        </div>
      </div>

      {/* Upload area */}
      <div className="bg-white dark:bg-[#15202b] rounded-2xl border border-border/60 dark:border-[#1e2d3d]/60 p-4 sm:p-6 mb-6">
        <div className="flex flex-col items-center justify-center gap-4 py-6 sm:py-10 px-4 rounded-xl border-2 border-dashed border-border/70 dark:border-[#1e2d3d]/70 bg-[#fafbfc] dark:bg-[#0f1a24]">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-navy/5 dark:bg-white/10 flex items-center justify-center">
            <i className="fa-solid fa-crop text-navy/40 dark:text-white/40 text-xl sm:text-2xl" />
          </div>
          <div className="text-center">
            <p className="text-navy dark:text-white font-semibold text-sm m-0">Upload photos</p>
            <p className="text-muted dark:text-white/50 text-xs m-0 mt-1">Tap to browse and upload photos</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFilesSelected}
          />
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? (
                <><i className="fa-solid fa-spinner animate-spin" /> Uploading...</>
              ) : (
                <><i className="fa-solid fa-cloud-arrow-up" /> Select Photos</>
              )}
            </Button>
            {uploadCount > 0 && (
              <span className="text-xs text-green font-medium bg-green/5 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <i className="fa-solid fa-check-circle" />
                {uploadCount} uploaded
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Photo grid */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-navy dark:text-white font-bold text-sm sm:text-base m-0">Photos</h3>
          <span className="text-xs bg-navy/5 dark:bg-white/10 text-navy/60 dark:text-white/50 font-medium px-2.5 py-1 rounded-full">
            {loading ? "..." : `${photos.length}`}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-navy/20 dark:border-white/20 border-t-navy dark:border-t-white rounded-full animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 bg-white dark:bg-[#15202b] rounded-2xl border border-border/60 dark:border-[#1e2d3d]/60">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gray-50 dark:bg-[#0f1a24] flex items-center justify-center mb-4">
            <i className="fa-solid fa-image text-gray-200 dark:text-white/20 text-2xl sm:text-3xl" />
          </div>
          <p className="text-navy dark:text-white font-semibold text-sm m-0">No photos yet</p>
          <p className="text-muted dark:text-white/50 text-xs m-0 mt-1">Upload your first photo to get started</p>
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 sm:gap-4 w-full [column-fill:_balance]">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              draggable={editing !== photo.id}
              onDragStart={() => setDraggedIdx(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(i)}
              className={`break-inside-avoid inline-block w-full mb-3 sm:mb-4 relative group rounded-xl overflow-hidden bg-white dark:bg-[#0f1a24] border border-border/60 dark:border-[#1e2d3d]/60 shadow-sm transition-all duration-300 ${
                editing === photo.id ? "ring-2 ring-navy ring-offset-2 dark:ring-offset-[#0A1216]" : "hover:shadow-md hover:shadow-navy/[0.06]"
              } ${!photo.cloudinary_url ? "border-2 border-dashed border-border dark:border-[#1e2d3d]" : ""}`}
            >
              {photo.cloudinary_url ? (
                <>
                  <div className="relative bg-gray-50">
                      <img
                        src={optimizeImageUrl(photo.cloudinary_url, 800)}
                        alt={photo.alt || ""}
                        className="w-full h-auto block"
                        loading="lazy"
                      />
                    {/* Always-visible gradient + overlay for title/desc on mobile */}
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-400/60 via-transparent to-transparent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    {(photo.title || photo.description) && (
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-400/80 via-blue-400/20 to-transparent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2 sm:p-3 pointer-events-none">
                        {photo.title && (
                          <p className="text-white font-semibold text-xs sm:text-sm leading-tight m-0">{photo.title}</p>
                        )}
                        {photo.description && (
                          <p className="text-white/60 text-[10px] sm:text-xs mt-0.5 leading-tight line-clamp-2 m-0">{photo.description}</p>
                        )}
                      </div>
                    )}
                    {/* Cover badge */}
                    {photo.is_cover && (
                      <div className="absolute top-1.5 ltr:left-1.5 rtl:right-1.5 bg-yellow-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm flex items-center gap-0.5">
                        <i className="fa-solid fa-star text-[8px]" />
                        <span>Cover</span>
                      </div>
                    )}
                  </div>
                  {/* Always-visible action buttons below image */}
                  <div className="absolute top-1.5 ltr:right-1.5 rtl:left-1.5 flex gap-1">
                    <button
                      onClick={() => openEdit(photo)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/85 text-navy text-xs flex items-center justify-center border-0 cursor-pointer hover:bg-white active:scale-95 transition-all duration-200 shadow-sm"
                      title="Edit details"
                    >
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button
                      onClick={() => handleSetCover(photo)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs flex items-center justify-center border-0 cursor-pointer active:scale-95 transition-all duration-200 shadow-sm ${
                        photo.is_cover
                          ? "bg-yellow-400 text-white hover:bg-yellow-500"
                          : "bg-white/85 text-muted hover:bg-white"
                      }`}
                      title={photo.is_cover ? "Main photo" : "Set as main photo"}
                    >
                      <i className="fa-solid fa-star" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(photo.id)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red/80 text-white text-xs flex items-center justify-center border-0 cursor-pointer hover:bg-red active:scale-95 transition-all duration-200 shadow-sm"
                      title="Delete"
                    >
                      <i className="fa-solid fa-trash-can" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => {
                    replacingRef.current = photo.id
                    fileInputRef.current?.click()
                  }}
                  className="w-full aspect-[4/3] flex flex-col items-center justify-center gap-2 bg-gray-50 border-0 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                >
                  <i className="fa-solid fa-cloud-arrow-up text-navy/20 text-xl sm:text-2xl" />
                  <span className="text-navy/30 text-[10px] sm:text-xs font-medium">Upload</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (() => {
        const photo = photos.find((p) => p.id === editing)
        const isPendingClear = pendingClearId === photo?.id
        return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => { setPendingClearId(null); setEditing(null) }}
        >
          <div className="bg-white dark:bg-[#15202b] rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border/60 dark:border-[#1e2d3d]/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-navy/5 dark:bg-white/10 flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-pen text-navy dark:text-white text-xs" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-navy dark:text-white font-bold text-sm sm:text-base m-0">Edit Photo</h3>
                  <p className="text-muted dark:text-white/50 text-[11px] m-0 mt-0.5 truncate">Update title, description, or image</p>
                </div>
              </div>
              <button
                onClick={() => { setPendingClearId(null); setEditing(null) }}
                className="w-8 h-8 rounded-lg bg-transparent border-0 text-muted dark:text-white/50 hover:text-navy dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1e2d3d] cursor-pointer flex items-center justify-center transition-colors duration-200 text-lg shrink-0"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6">
              {photo && (
                <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-[#0f1a24] mb-5 aspect-[4/3]">
                  {isPendingClear ? (
                    <div className="flex flex-col items-center justify-center w-full h-full gap-3">
                      <div className="w-12 h-12 rounded-xl bg-red/5 flex items-center justify-center">
                        <i className="fa-solid fa-trash-can text-red/30 text-xl" />
                      </div>
                      <span className="text-navy/40 dark:text-white/40 text-xs text-center px-4">Image cleared — upload a new one or delete the card</span>
                    </div>
                  ) : (
                    <>
                      <img
                        src={optimizeImageUrl(photo.cloudinary_url, 800)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 ltr:right-2 rtl:left-2 flex gap-1.5">
                        <button
                          onClick={() => handleCropClick(photo)}
                          className="px-3 py-1.5 rounded-lg bg-white/90 dark:bg-[#0f1a24]/90 backdrop-blur-sm text-navy dark:text-white text-xs font-semibold border-0 cursor-pointer hover:bg-white dark:hover:bg-[#0f1a24] transition-all duration-200 flex items-center gap-1.5 shadow-sm"
                        >
                          <i className="fa-solid fa-crop" /> Crop
                        </button>
                        <button
                          onClick={() => handleClearImage(photo)}
                          className="px-3 py-1.5 rounded-lg bg-red/90 backdrop-blur-sm text-white text-xs font-semibold border-0 cursor-pointer hover:bg-red transition-all duration-200 flex items-center gap-1.5 shadow-sm"
                        >
                          <i className="fa-solid fa-trash-can" /> Clear
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Photo title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border border-border/70 dark:border-[#1e2d3d]/70 rounded-xl px-4 py-3 text-sm text-navy dark:text-white outline-none focus:border-navy/40 focus:ring-2 focus:ring-navy/5 transition-all duration-200 placeholder:text-muted/50 dark:bg-[#0f1a24]"
                />
                <textarea
                  placeholder="Photo description"
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full border border-border/70 dark:border-[#1e2d3d]/70 rounded-xl px-4 py-3 text-sm text-navy dark:text-white outline-none focus:border-navy/40 focus:ring-2 focus:ring-navy/5 transition-all duration-200 resize-none placeholder:text-muted/50 dark:bg-[#0f1a24]"
                />
                <input
                  type="text"
                  placeholder="Alt text"
                  value={editAlt}
                  onChange={(e) => setEditAlt(e.target.value)}
                  className="w-full border border-border/70 dark:border-[#1e2d3d]/70 rounded-xl px-4 py-3 text-sm text-navy dark:text-white outline-none focus:border-navy/40 focus:ring-2 focus:ring-navy/5 transition-all duration-200 placeholder:text-muted/50 dark:bg-[#0f1a24]"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 sm:px-6 pb-5 sm:pb-6 pt-4 border-t border-border/60 dark:border-[#1e2d3d]/60">
              {isPendingClear ? (
                <>
                  <button
                    onClick={() => {
                      setEditing(null)
                      setConfirmDelete(photo.id)
                    }}
                    className="px-4 py-2 text-sm text-red font-medium bg-transparent border border-red/20 rounded-xl cursor-pointer hover:bg-red/5 transition-colors duration-200 flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-trash-can" /> Delete Card
                  </button>
                  <Button size="sm" onClick={() => {
                    setPendingClearId(null)
                    replacingRef.current = photo.id
                    setReplaceMeta({ title: editTitle, description: editDesc, alt: photo?.alt || "" })
                    setEditing(null)
                    setTimeout(() => fileInputRef.current?.click(), 100)
                  }}>
                    <i className="fa-solid fa-cloud-arrow-up" /> Upload
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    {photo?.cloudinary_url && (
                      <button
                        onClick={() => {
                          replacingRef.current = editing
                          setReplaceMeta({ title: editTitle, description: editDesc, alt: photo?.alt || "" })
                          setEditing(null)
                          setTimeout(() => fileInputRef.current?.click(), 100)
                        }}
                        className="px-4 py-2 text-sm text-muted font-medium bg-transparent border border-border/70 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-navy/20 transition-all duration-200 flex items-center gap-1.5"
                      >
                        <i className="fa-solid fa-arrow-up-from-bracket" /> Replace
                      </button>
                    )}
                  </div>
                  <Button size="sm" onClick={() => saveEdit(editing)}>
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        )
      })()}

      {cropPhoto && (
        <CropModal
          file={cropPhoto.file}
          onCrop={handleCropEditDone}
          onCancel={handleCropEditCancel}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          message="Delete this photo?"
          onConfirm={() => { handleDelete(confirmDelete); setConfirmDelete(null) }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <Toast toast={toast} onClose={closeToast} />
    </AdminLayout>
  )
}

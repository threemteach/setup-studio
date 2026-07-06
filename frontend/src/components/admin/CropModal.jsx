import { useState, useRef, useEffect } from "react"

export default function CropModal({ file, onCrop, onCancel, initialTitle, initialDescription, initialAlt }) {
  const displayImgRef = useRef(null)
  const loadImgRef = useRef(null)
  const containerRef = useRef(null)
  const urlRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [nat, setNat] = useState({ w: 0, h: 0 })
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [drag, setDrag] = useState(false)
  const [error, setError] = useState("")
  const [title, setTitle] = useState(initialTitle || "")
  const [description, setDescription] = useState(initialDescription || "")
  const [alt, setAlt] = useState(initialAlt || "")
  const d = useRef({})

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setNat({ w: img.naturalWidth, h: img.naturalHeight })
      loadImgRef.current = img
      urlRef.current = URL.createObjectURL(file)
      setReady(true)
    }
    img.src = URL.createObjectURL(file)
    return () => {
      img.onload = null
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [file])

  const box = containerRef.current
  const cw = box?.clientWidth || 600
  const ch = box?.clientHeight || 450
  const iar = nat.w / nat.h
  const bar = cw / ch

  let baseW, baseH
  if (ready) {
    if (iar > bar) { baseH = ch; baseW = ch * iar }
    else { baseW = cw; baseH = cw / iar }
    baseW = Math.round(baseW)
    baseH = Math.round(baseH)
  }

  const scale = Math.max(0.3, zoom)

  const handleCrop = async () => {
    setError("")
    const srcImg = loadImgRef.current
    const el = displayImgRef.current
    if (!srcImg || !el) return
    try {
      const ir = el.getBoundingClientRect()
      const cr = containerRef.current.getBoundingClientRect()
      const l = Math.max(0, (cr.left - ir.left) * (nat.w / ir.width))
      const t = Math.max(0, (cr.top - ir.top) * (nat.h / ir.height))
      const r = Math.min(nat.w, (cr.right - ir.left) * (nat.w / ir.width))
      const b = Math.min(nat.h, (cr.bottom - ir.top) * (nat.h / ir.height))
      const cw2 = r - l
      const ch2 = b - t
      if (cw2 < 20 || ch2 < 20) { setError("Crop area too small"); return }

      const cnv = document.createElement("canvas")
      cnv.width = cw2; cnv.height = ch2
      cnv.getContext("2d").drawImage(srcImg, l, t, cw2, ch2, 0, 0, cw2, ch2)
      const blob = await new Promise((r) => cnv.toBlob(r, "image/jpeg", 0.92))
      if (!blob) throw new Error("Failed")
      const croppedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" })
      onCrop({ file: croppedFile, title: title || null, description: description || null, alt: alt || null })
    } catch (err) {
      setError(err.message || "Crop failed")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-navy/5 flex items-center justify-center">
              <i className="fa-solid fa-crop text-navy text-sm" />
            </div>
            <div>
              <h3 className="text-navy font-bold text-base m-0">Crop Photo</h3>
              <p className="text-muted text-[11px] m-0 mt-0.5">Adjust to 4:3 card format</p>
            </div>
                        <span className="text-[10px] bg-navy/5 text-navy/50 font-semibold px-2 py-0.5 rounded-full ltr:ml-1 rtl:mr-1">4:3</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(1)))} className="w-8 h-8 rounded-lg border border-border/60 text-navy text-sm bg-transparent cursor-pointer hover:bg-gray-50 hover:border-navy/20 transition-all duration-200 flex items-center justify-center"><i className="fa-solid fa-minus" /></button>
            <span className="text-xs text-muted w-10 text-center font-medium">{Math.round(scale * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(4, +(z + 0.1).toFixed(1)))} className="w-8 h-8 rounded-lg border border-border/60 text-navy text-sm bg-transparent cursor-pointer hover:bg-gray-50 hover:border-navy/20 transition-all duration-200 flex items-center justify-center"><i className="fa-solid fa-plus" /></button>
            <button onClick={() => { setPos({ x: 0, y: 0 }); setZoom(1) }} className="w-8 h-8 rounded-lg border border-border/60 text-navy text-sm bg-transparent cursor-pointer hover:bg-gray-50 hover:border-navy/20 transition-all duration-200 flex items-center justify-center ltr:ml-1 rtl:mr-1" title="Reset"><i className="fa-solid fa-rotate-left" /></button>
          </div>
        </div>

        {/* Crop area */}
        <div className="bg-[#1a1a1a] p-4 flex items-center justify-center">
          <div ref={containerRef} className="relative overflow-hidden rounded-lg w-full" style={{ aspectRatio: "4/3", maxHeight: "65vh" }}>
            {ready ? (
              <img
                ref={displayImgRef}
                src={urlRef.current}
                alt=""
                draggable={false}
                onMouseDown={(e) => { setDrag(true); d.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y } }}
                onMouseMove={(e) => { if (!drag) return; setPos({ x: d.current.px + e.clientX - d.current.x, y: d.current.py + e.clientY - d.current.y }) }}
                onMouseUp={() => setDrag(false)}
                onMouseLeave={() => setDrag(false)}
                className="absolute block"
                style={{
                  width: baseW, height: baseH,
                  left: "50%", top: "50%",
                  marginLeft: -(baseW / 2), marginTop: -(baseH / 2),
                  transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                  cursor: drag ? "grabbing" : "grab",
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: "linear-gradient(to right,rgba(255,255,255,0.06) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.06) 1px,transparent 1px)",
              backgroundSize: "33.33% 33.33%",
            }} />
            {ready && <p className="absolute bottom-2 ltr:left-1/2 rtl:right-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2 text-white/30 text-xs pointer-events-none bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">Drag to reposition</p>}
          </div>
        </div>

        {/* Title / Description / Alt */}
        <div className="px-5 py-4 border-b border-border/60 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-border/70 rounded-xl px-4 py-2.5 text-sm text-navy outline-none focus:border-navy/40 focus:ring-2 focus:ring-navy/5 transition-all duration-200 placeholder:text-muted/40"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-border/70 rounded-xl px-4 py-2.5 text-sm text-navy outline-none focus:border-navy/40 focus:ring-2 focus:ring-navy/5 transition-all duration-200 placeholder:text-muted/40"
          />
          <input
            type="text"
            placeholder="Alt text (optional)"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            className="w-full border border-border/70 rounded-xl px-4 py-2.5 text-sm text-navy outline-none focus:border-navy/40 focus:ring-2 focus:ring-navy/5 transition-all duration-200 placeholder:text-muted/40"
          />
        </div>

        {error && <div className="px-5 pt-4"><div className="bg-red/5 border border-red/20 rounded-xl px-4 py-2.5 text-red text-sm flex items-center gap-2"><i className="fa-solid fa-circle-exclamation" />{error}</div></div>}

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border/60 flex items-center justify-between">
          <p className="text-xs text-muted/60 m-0 font-medium">
            {ready ? `${nat.w} × ${nat.h}` : "Loading..."}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-5 py-2 text-sm font-medium text-muted bg-transparent border border-border/70 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-navy/20 transition-all duration-200"
            >
              Skip
            </button>
            <button
              onClick={handleCrop}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm rounded-xl font-semibold cursor-pointer bg-navy text-white border border-navy shadow-[3px_3px_0_var(--red)] hover:shadow-[2px_2px_0_var(--red)] hover:-translate-y-0.5 transition-all duration-200"
            >
              <i className="fa-solid fa-check" /> Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

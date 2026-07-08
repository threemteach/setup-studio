import { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import { getCroppedBlob } from "../../lib/cropImage"
import "react-easy-crop/react-easy-crop.css"

export default function ImageCropperModal({ src, aspect, onConfirm, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedPixels, setCroppedPixels] = useState(null)
  const [processing, setProcessing] = useState(false)

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedPixels(croppedAreaPixels)
  }, [])

  async function handleConfirm() {
    if (!croppedPixels) return
    setProcessing(true)
    try {
      const blob = await getCroppedBlob(src, croppedPixels)
      onConfirm(blob)
    } catch (err) {
      console.error("Crop failed:", err)
    }
    setProcessing(false)
  }

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-[#15202b] rounded-3xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#1e2d3d] shrink-0">
          <div>
            <h3 className="text-white font-bold text-base m-0">Crop Photo</h3>
            <p className="text-white/50 text-xs m-0 mt-0.5">Drag to position the image within the frame</p>
          </div>
          <button onClick={onCancel}
            className="w-8 h-8 rounded-full bg-[#1e2d3d] border-0 text-white/50 cursor-pointer hover:bg-[#2a3d4d] transition-colors flex items-center justify-center">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="relative w-full bg-[#0A1216]" style={{ height: "min(60vh, 500px)" }}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="cover"
            restrictPosition={true}
            style={{
              containerStyle: { background: "#0A1216" },
              cropAreaStyle: { border: "2px solid #e74c4c", color: "#e74c4c" },
            }}
          />
        </div>

        <div className="px-5 py-3 border-t border-[#1e2d3d] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="text-white/40 text-xs">Zoom:</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 sm:w-32 accent-red"
            />
          </div>
          <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            <button onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-[#1e2d3d] bg-transparent text-white/70 text-sm font-semibold cursor-pointer hover:bg-white/10 transition-colors">
              Cancel
            </button>
            <button onClick={handleConfirm} disabled={!croppedPixels || processing}
              className="px-5 py-2 rounded-xl bg-red text-white text-sm font-semibold cursor-pointer hover:bg-red/90 transition-colors disabled:opacity-50 border-0">
              {processing ? "Processing..." : "Apply Crop"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

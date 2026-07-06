import { useEffect, useRef } from "react"

export default function Toast({ toast, onClose }) {
  const barRef = useRef(null)
  const DURATION = 3500

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(onClose, DURATION)
    if (barRef.current) {
      barRef.current.style.transition = `width ${DURATION}ms linear`
      requestAnimationFrame(() => { barRef.current.style.width = "0%" })
    }
    return () => clearTimeout(timer)
  }, [toast])

  if (!toast) return null

  const isError = toast.type === "error"

  return (
    <div
      className="fixed bottom-6 right-6 z-[300] min-w-[280px] max-w-[400px] rounded-2xl shadow-2xl overflow-hidden"
      style={{ animation: "toastSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <div className={`${isError ? "bg-gradient-to-r from-red-600 to-red-500" : "bg-gradient-to-r from-emerald-600 to-green-500"} px-5 py-3.5`}>
        <div className="flex items-start gap-3">
          <div className={`w-7 h-7 rounded-full ${isError ? "bg-white/20" : "bg-white/20"} flex items-center justify-center shrink-0 mt-0.5`}>
            <i className={`fa-solid text-xs text-white ${isError ? "fa-circle-exclamation" : "fa-check"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold m-0 leading-snug">{toast.message}</p>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 border-0 text-white/70 hover:text-white cursor-pointer flex items-center justify-center shrink-0 transition-colors text-xs"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      </div>
      <div className="h-[3px] bg-black/10">
        <div ref={barRef} className={`h-full ${isError ? "bg-white/40" : "bg-white/40"}`} style={{ width: "100%" }} />
      </div>
    </div>
  )
}

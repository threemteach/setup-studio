import { useState, useEffect } from "react"

export default function SplashScreen({ onFinish }) {
  const [phase, setPhase] = useState("enter")
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 10, 80))
    }, 300)

    const finish = () => {
      setProgress(100)
      clearInterval(timer)
      setTimeout(() => setPhase("exit"), 250)
      setTimeout(() => setPhase("done"), 800)
      setTimeout(onFinish, 1100)
    }

    const onLoad = () => {
      clearInterval(timer)
      setProgress(92)
      setTimeout(finish, 300)
    }

    if (document.readyState === "complete") {
      onLoad()
    } else {
      window.addEventListener("load", onLoad)
    }

    return () => {
      clearInterval(timer)
      window.removeEventListener("load", onLoad)
    }
  }, [])

  if (phase === "done") return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0A1216] transition-all duration-700 ${
        phase === "exit" ? "opacity-0 scale-105" : "opacity-100 scale-100"
      }`}
    >
      <div className="absolute -top-32 w-96 h-96 rounded-full bg-[#11AFFF] opacity-20 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 w-80 h-80 rounded-full bg-red opacity-10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="animate-pulse">
            <circle cx="40" cy="40" r="38" stroke="url(#sg)" strokeWidth="4" fill="none" opacity="0.3" />
            <circle cx="40" cy="40" r="38" stroke="url(#sg)" strokeWidth="4" fill="none"
              strokeDasharray="240" strokeDashoffset={240 - (240 * progress) / 100}
              className="transition-all duration-300 ease-out" style={{ transform: "rotate(-90deg)", transformOrigin: "center" }} />
            <polygon points="40,15 65,60 15,60" fill="url(#sg)" opacity="0.9" />
            <defs>
              <linearGradient id="sg" x1="0" y1="0" x2="80" y2="80">
                <stop stopColor="#e73b49" />
                <stop offset="1" stopColor="#11AFFF" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="text-center">
          <h1 className="text-white font-extrabold text-3xl tracking-tight m-0">SETUP STUDIO</h1>
          <p className="text-white/40 text-xs font-medium tracking-[0.3em] uppercase mt-2 m-0">Loading experience</p>
        </div>

        <div className="w-48 h-1 rounded-full bg-white/10 overflow-hidden mt-2">
          <div className="h-full rounded-full bg-gradient-to-r from-red to-[#11AFFF] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}

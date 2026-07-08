import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../../components/ui/Navbar"
import Footer from "../../components/ui/Footer"
import Button from "../../components/ui/Button"
import { getSupabase } from "../../lib/supabase"
import { sanitizeError } from "../../lib/errors"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { useTranslation } from "../../context/LanguageContext"

export default function LoginPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { dark } = useTheme()
  const { lang } = useTranslation()

  useEffect(() => {
    if (user) navigate("/admin/dashboard", { replace: true })
  }, [user, navigate])
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error: signInError } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(sanitizeError(signInError.message))
      setLoading(false)
      return
    }

    navigate("/admin/dashboard")
  }

  return (
    <div className="w-full overflow-x-hidden" dir={lang === "ar" ? "rtl" : "ltr"}>
      <Navbar />
      <main className="pt-[clamp(3rem,5.5vw,4rem)] min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
        style={{ backgroundColor: dark ? "#0A1216" : "#f8f9fb" }}
      >
        <div className="absolute -top-[clamp(8rem,15vw,12rem)] -right-[clamp(4rem,8vw,6rem)] w-[clamp(16rem,40vw,30rem)] h-[clamp(16rem,40vw,30rem)] rounded-full bg-[#11AFFF] opacity-[0.25] blur-[clamp(4rem,8vw,6rem)] pointer-events-none" />
        <div className="absolute -bottom-[clamp(6rem,12vw,10rem)] -left-[clamp(2rem,4vw,4rem)] w-[clamp(12rem,30vw,22rem)] h-[clamp(12rem,30vw,22rem)] rounded-full bg-[#11AFFF] opacity-[0.18] blur-[clamp(4rem,8vw,6rem)] pointer-events-none" />
        <div className="absolute top-[clamp(2rem,5vw,4rem)] right-[clamp(10%,20%,30%)] w-[clamp(8rem,20vw,16rem)] h-[clamp(8rem,20vw,16rem)] rounded-full bg-[#11AFFF] opacity-[0.12] blur-[clamp(2rem,4vw,3rem)] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/images/logo.png" alt="SETUP" className="h-[clamp(3rem,6vw,4.5rem)] w-auto mx-auto mb-5" />
            <h1 className={`text-2xl font-bold m-0 tracking-tight ${dark ? "text-white" : "text-navy"}`}>Welcome back</h1>
            <p className={`text-sm mt-1.5 ${dark ? "text-white/40" : "text-navy/40"}`}>Sign in to manage your studio content</p>
          </div>

          <div className={`backdrop-blur-xl rounded-2xl p-8 shadow-2xl border ${dark ? "bg-white/5 border-white/[0.06]" : "bg-white border-border/80"}`}>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {error && (
                <div className="bg-red/10 border-l-4 border-red rounded-xl px-4 py-3 text-red text-sm flex items-center gap-2.5 shadow-lg shadow-red/5" style={{ animation: "toastSlideUp 0.3s ease-out" }}>
                  <div className="w-7 h-7 rounded-full bg-red/15 flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-circle-exclamation text-xs" />
                  </div>
                  <span className="font-medium">{error}</span>
                </div>
              )}
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${dark ? "text-white/70" : "text-navy/70"}`}>Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@setup.com"
                  className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-sm ${dark ? "bg-white/10 border border-white/10 text-white focus:border-white/20 focus:ring-2 focus:ring-white/5 placeholder:text-white/30" : "bg-white border border-border text-navy focus:border-navy/30 focus:ring-2 focus:ring-navy/5 placeholder:text-navy/30"}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${dark ? "text-white/70" : "text-navy/70"}`}>Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-sm ${dark ? "bg-white/10 border border-white/10 text-white focus:border-white/20 focus:ring-2 focus:ring-white/5 placeholder:text-white/30" : "bg-white border border-border text-navy focus:border-navy/30 focus:ring-2 focus:ring-navy/5 placeholder:text-navy/30"}`}
                />
              </div>
              <Button size="md" className="w-full mt-2" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

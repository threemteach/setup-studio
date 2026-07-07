import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Button from "../../components/ui/Button"
import { getSupabase } from "../../lib/supabase"
import { sanitizeError } from "../../lib/errors"
import { useAuth } from "../../contexts/AuthContext"

export default function LoginPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

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
    <div className="min-h-screen bg-[#0A1216] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Glow effects */}
      <div className="absolute -top-[clamp(8rem,15vw,12rem)] -right-[clamp(4rem,8vw,6rem)] w-[clamp(16rem,40vw,30rem)] h-[clamp(16rem,40vw,30rem)] rounded-full bg-[#11AFFF] opacity-[0.25] blur-[clamp(4rem,8vw,6rem)] pointer-events-none" />
      <div className="absolute -bottom-[clamp(6rem,12vw,10rem)] -left-[clamp(2rem,4vw,4rem)] w-[clamp(12rem,30vw,22rem)] h-[clamp(12rem,30vw,22rem)] rounded-full bg-[#11AFFF] opacity-[0.18] blur-[clamp(4rem,8vw,6rem)] pointer-events-none" />
      <div className="absolute top-[clamp(2rem,5vw,4rem)] right-[clamp(10%,20%,30%)] w-[clamp(8rem,20vw,16rem)] h-[clamp(8rem,20vw,16rem)] rounded-full bg-[#11AFFF] opacity-[0.12] blur-[clamp(2rem,4vw,3rem)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <svg className="w-20 h-auto mx-auto mb-5" viewBox="55 -5 170 75" fill="none" aria-label="SETUP">
            <defs>
              <pattern id="login-svg" patternUnits="userSpaceOnUse" width="170" height="75" patternTransform="translate(30, -50) scale(1.5)">
                <rect width="170" height="75" fill="#8fc3e0"/>
                <image href="/images/setup-bg.jpg" width="170" height="75" preserveAspectRatio="xMidYMid slice"/>
              </pattern>
            </defs>
            <path d="M190.433 41.9092V31.8106C194.432 32.5569 198.483 29.1635 198.721 23.5894C199.048 15.753 192.455 10.8553 187.732 15.823C187.053 16.5343 185.34 19.6712 185.34 20.6624V58.7364H177.379V21.502C177.379 6.64557 191.978 -1.1908 200.778 8.25482C211.829 20.126 204.467 43.7051 190.433 41.9092Z" fill="url(#login-svg)"/>
            <path d="M114.322 4.0451V14.9834H104.128V25.2919C104.128 26.4347 106.281 25.5018 106.82 25.4785C109.38 25.3852 111.772 26.0382 114.314 25.5018V36.0203H104.119V47.5883L104.596 48.218H114.623V58.7364H95.8309V4.0451H114.305H114.322Z" fill="url(#login-svg)"/>
            <path d="M88.2137 15.4032L81.073 17.5488C79.1489 10.074 70.8431 14.6918 73.4381 21.6769C74.7709 25.2569 79.7402 25.84 82.3794 27.5425C89.7407 32.3003 91.8237 43.8217 86.8897 52.5793C80.2522 64.3338 66.6064 58.9113 65 44.9062L72.2995 42.3407C72.8026 52.4277 83.315 50.4103 82.1587 40.8947C81.5938 36.2768 73.6147 34.0729 70.7372 31.5773C60.7633 22.913 66.7123 2.52914 78.4604 4.10341C83.315 4.74478 86.8367 9.46759 88.2137 15.4032Z" fill="url(#login-svg)"/>
            <path d="M147.766 4.0451V14.5636H137.889V58.7364H129.61V14.5636H121.013V4.0451H147.766Z" fill="url(#bg)"/>
            <path d="M165.689 31.8106H173.333V46.7486C173.333 49.9438 169.67 55.2847 167.578 56.824C160.093 62.3397 149.766 55.7045 149.766 44.2298V15.1933L150.243 14.5636H157.251L157.727 15.1933V45.4892C157.727 47.1568 160.72 49.2092 162.026 49.0926C163.332 48.9759 165.689 46.6553 165.689 45.0694V31.8222V31.8106Z" fill="url(#bg)"/>
            <path d="M155.717 -3.5362e-06L150.276 7.22437L155.719 14.3806L161.16 7.15625L155.717 -3.5362e-06Z" fill="url(#bg)"/>
          </svg>
          <h1 className="text-white text-2xl font-bold m-0 tracking-tight">Welcome back</h1>
          <p className="text-white/40 text-sm mt-1.5">Sign in to manage your studio content</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/[0.06]">
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
              <label className="block text-white/70 text-sm font-semibold mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@setup.com"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-white/20 focus:ring-2 focus:ring-white/5 transition-all duration-200 placeholder:text-white/20"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-semibold mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-white/20 focus:ring-2 focus:ring-white/5 transition-all duration-200 placeholder:text-white/20"
              />
            </div>
            <Button size="md" className="w-full mt-2" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

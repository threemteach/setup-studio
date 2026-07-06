import { Outlet, useLocation } from "react-router-dom"
import { useEffect } from "react"
import Navbar from "./ui/Navbar"
import Footer from "./ui/Footer"
import WhatsAppButton from "./WhatsAppButton"
import { useTranslation } from "../context/LanguageContext"

/** Scrolls to top on every route change, or to hash if present */
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.replace("#", ""))
      if (el) el.scrollIntoView({ behavior: "smooth" })
    } else {
      window.scrollTo({ top: 0, behavior: "instant" })
    }
  }, [pathname, hash])
  return null
}

export default function Layout() {
  const { lang } = useTranslation()

  return (
    <div className="w-full overflow-x-hidden" dir={lang === "ar" ? "rtl" : "ltr"}>
      <ScrollToTop />
      <Navbar />
      <main className="pt-[clamp(3rem,5.5vw,4rem)]">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}

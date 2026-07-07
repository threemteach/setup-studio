import { useState, useEffect, useCallback } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { useTranslation } from "../../context/LanguageContext"
import { useTheme } from "../../context/ThemeContext"

const t = (en, ar, lang) => lang === "ar" ? ar : en

const navLinks = [
  { labelEn: "Home", labelAr: "الرئيسية", to: "/" },
  { labelEn: "Portfolio", labelAr: "أعمالنا", to: "/portfolio" },
  { labelEn: "Locations", labelAr: "المواقع", to: "/locations" },
  { labelEn: "About Us", labelAr: "عن سيت أب", to: "/about" },
  { labelEn: "Setup Academy", labelAr: "أكاديمية سيت أب", to: "/academy" },
]

export default function Navbar() {
  const { lang, setLang } = useTranslation()
  const { dark, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  const handleContactClick = useCallback((e) => {
    if (location.pathname === "/") {
      e.preventDefault()
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
    }
  }, [location.pathname])

  const toggleLang = () => {
    const next = lang === "en" ? "ar" : "en"
    setLang(next)
    document.documentElement.lang = next
  }

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 border-b ${
        scrolled
          ? "dark:bg-[#0f1a24]/95 bg-white lg:bg-white/95 lg:backdrop-blur-lg lg:shadow-[0_1px_16px_rgba(48,93,116,0.08)] border-transparent"
          : "bg-white dark:bg-[#0A1216] border-border dark:border-[#1e2d3d]"
      }`}
    >
      <div dir="ltr" className="max-w-[1280px] mx-auto flex items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-x-10 px-[clamp(1rem,4vw,3rem)] py-[clamp(0.7rem,1.5vw,1.1rem)] w-full">
        <a href="/" onClick={() => window.location.reload()} className="flex items-center shrink-0 relative z-[110]">
          <img
            src="/images/logo.png"
            alt="SETUP"
            className="block h-[clamp(2rem,4vw,2.8rem)] w-auto"
          />
        </a>

        <div className="flex lg:hidden items-center gap-2 relative z-[110]">
          <button
            onClick={toggle}
            className="bg-transparent border border-border dark:border-[#1e2d3d] text-navy dark:text-white/80 font-semibold text-xs px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
            aria-label="Toggle dark mode"
          >
            {dark ? <i className="fa-solid fa-sun" /> : <i className="fa-solid fa-moon" />}
          </button>
          <button
            onClick={toggleLang}
            className="bg-transparent border border-border dark:border-[#1e2d3d] text-navy dark:text-white/80 font-semibold text-xs px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
          <button
          className="flex flex-col justify-center gap-[5px] w-10 h-10 bg-transparent border-none cursor-pointer p-1 shrink-0"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span
            className={`block h-[2px] w-full bg-navy dark:bg-white/80 rounded-[2px] transition-all duration-300 origin-center ${
              menuOpen ? "rotate-45 translate-y-[7px]" : ""
            }`}
          />
          <span
            className={`block h-[2px] w-full bg-navy dark:bg-white/80 rounded-[2px] transition-all duration-300 ${
              menuOpen ? "opacity-0 scale-x-0" : ""
            }`}
          />
          <span
            className={`block h-[2px] w-full bg-navy dark:bg-white/80 rounded-[2px] transition-all duration-300 origin-center ${
              menuOpen ? "-rotate-45 -translate-y-[7px]" : ""
            }`}
          />
        </button>
        </div>

        <div
          className={`lg:contents fixed lg:static inset-0 top-0 lg:top-auto bg-white dark:bg-[#0A1216] lg:bg-transparent lg:dark:bg-transparent z-[105] pt-20 lg:pt-0 px-8 lg:px-0 transition-all duration-300 ${
            menuOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto"
          }`}
        >
          <ul className="flex flex-col lg:flex-row items-start lg:items-center justify-center gap-7 lg:gap-[clamp(1.2rem,3vw,2.8rem)] list-none m-0 p-0">
            {navLinks.map((link) => (
              <li key={link.to}>
                  <NavLink
                      to={link.to}
                      end={link.to === "/"}
                      className={({ isActive }) =>
                        `no-underline text-[1.1rem] lg:text-[0.85rem] font-medium transition-colors duration-200 ${
                          isActive
                            ? "font-bold text-navy dark:text-white"
                            : "text-[#8899a6] dark:text-white/50 hover:text-navy dark:hover:text-white"
                        }`
                      }
                    >
                  {t(link.labelEn, link.labelAr, lang)}
                </NavLink>
              </li>
            ))}
            <li className="lg:hidden w-full pt-2">
              <a
                href="/#contact"
                onClick={handleContactClick}
                className="flex items-center justify-center w-full no-underline text-white bg-navy border border-navy rounded-full px-6 py-3.5 font-semibold text-sm shadow-[3px_3px_0_var(--color-red)] active:shadow-[1px_1px_0_var(--color-red)] transition-shadow duration-200"
              >
                {t("Contact", "اتصل بنا", lang)}
              </a>
            </li>
          </ul>
        </div>

        <div className="hidden lg:flex items-center gap-4 justify-self-end">
          <button
            onClick={toggle}
            className="bg-transparent border border-border dark:border-[#1e2d3d] text-navy dark:text-white/80 font-semibold text-[0.75rem] px-3 py-[0.45rem] rounded-full cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 transition-colors whitespace-nowrap flex items-center gap-1.5"
            aria-label="Toggle dark mode"
          >
            {dark ? <><i className="fa-solid fa-sun" /> Light</> : <><i className="fa-solid fa-moon" /> Dark</>}
          </button>
          <button
            onClick={toggleLang}
            className="bg-transparent border border-border dark:border-[#1e2d3d] text-navy dark:text-white/80 font-semibold text-[0.75rem] px-3 py-[0.45rem] rounded-full cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
          <a
            href="/#contact"
            onClick={handleContactClick}
            className="no-underline text-white bg-navy border border-navy rounded-full px-[1.5rem] py-[0.5rem] font-semibold text-[0.82rem] whitespace-nowrap shadow-[4px_4px_0_var(--color-red)] hover:shadow-[2px_2px_0_var(--color-red)] transition-shadow duration-200"
          >
            {t("Contact", "اتصل بنا", lang)}
          </a>
        </div>
      </div>
    </nav>
  )
}

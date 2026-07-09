import { NavLink } from "react-router-dom"
import { useTranslation } from "../../context/LanguageContext"

const t = (en, ar, lang) => lang === "ar" ? ar : en

const navLinks = [
  { labelEn: "Home", labelAr: "الرئيسية", to: "/" },
  { labelEn: "Portfolio", labelAr: "أعمالنا", to: "/portfolio" },
  { labelEn: "Locations", labelAr: "المواقع", to: "/locations" },
  { labelEn: "About Us", labelAr: "عن سيت أب", to: "/about" },
  { labelEn: "Setup Academy", labelAr: "أكاديمية سيت أب", to: "/academy" },
]

const socialLinks = [
  { icon: "fa-brands fa-facebook", href: "https://www.facebook.com/profile.php?id=61565221328880", label: "Facebook", color: "#4a7aff" },
  { icon: "fa-brands fa-instagram", href: "https://www.instagram.com/setupstudio24/", label: "Instagram", color: "#E4405F" },
]

export default function Footer() {
  const { lang } = useTranslation()
  return (
    <footer className="w-full bg-white dark:bg-[#0A1216] pb-[clamp(5rem,12vw,6rem)] md:pb-0">
      <div className="h-[1.5px] bg-[#305D74] w-3/5 mx-auto" />

      <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)] py-[clamp(2rem,4vw,3.5rem)] flex flex-col items-center text-center">
        <a href="/" onClick={() => window.location.reload()} className="flex items-center justify-center gap-1.5 mb-8" dir="ltr">
        <img src="/images/SETUP@2x-8.png" alt="SETUP" className="h-[clamp(3rem,7vw,6rem)] w-auto shrink-0" />
        </a>

        <div className="flex items-center justify-center gap-6 mb-8">
          {socialLinks.map((s) => (
            <a
              key={s.label}
              href={s.href}
              aria-label={s.label}
              className="text-[clamp(1.2rem,2.2vw,1.8rem)] transition-opacity duration-200 hover:opacity-70"
              style={{ color: s.color }}
            >
              <i className={s.icon} />
            </a>
          ))}
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-8">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `text-sm no-underline transition-colors duration-200 font-medium ${
                  isActive
                    ? "text-navy dark:text-white font-bold"
                    : "text-[#8899a6] dark:text-white/50 hover:text-navy dark:hover:text-white"
                }`
              }
            >
              {t(link.labelEn, link.labelAr, lang)}
            </NavLink>
          ))}
        </nav>

        <p className="text-[#0A1216]/50 dark:text-white/40 text-xs m-0">
          &copy; {new Date().getFullYear()} {t("Setup Studio. All rights reserved.", "سيت أب ستوديو. جميع الحقوق محفوظة.", lang)}
        </p>
        <p className="text-[#0A1216]/40 dark:text-white/30 text-sm m-0 mt-2">
          {t("by 3m Tech", " بواسطة 3m Tech", lang)}
        </p>
      </div>
    </footer>
  )
}

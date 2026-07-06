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
    <footer className="w-full bg-white">
      {/* ─── Top navy line 60% centered ─── */}
      <div className="h-[1.5px] bg-[#305D74] w-3/5 mx-auto" />

      <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)] py-[clamp(2rem,4vw,3.5rem)] flex flex-col items-center text-center">
        {/* ─── SETUP wordmark centered ─── */}
        <a href="/" onClick={() => window.location.reload()} className="flex items-center justify-center gap-2 mb-8">
        <svg
          className="h-[clamp(3rem,7vw,6rem)] w-auto"
          viewBox="0 0 551 218"
          fill="none"
          aria-label="SETUP"
        >
          <path d="M463.386 154.822V117.515C478.157 120.272 493.124 107.736 494.004 87.1437C495.211 58.194 470.853 40.1004 453.408 58.4525C450.897 61.0804 444.571 72.6689 444.571 76.3307V216.987H415.159V79.4324C415.159 24.5486 469.092 -4.40118 501.602 30.4936C542.426 74.349 515.232 161.457 463.386 154.822Z" fill="#305D74"/>
          <path d="M182.211 14.9424V55.3514H144.549V93.4341C144.549 97.6559 152.505 94.2095 154.494 94.1234C163.951 93.7787 172.787 96.1912 182.178 94.2095V133.068H144.517V175.803L146.277 178.129H183.32V216.987H113.898V14.9424H182.146H182.211Z" fill="#305D74"/>
          <path d="M85.7578 56.904L59.3783 64.8307C52.2699 37.2165 21.5862 54.2761 31.1728 80.081C36.0965 93.3066 54.4546 95.4606 64.2042 101.75C91.3989 119.327 99.0943 161.89 80.8667 194.243C56.3458 237.668 5.93457 217.635 0 165.896L26.9664 156.419C28.8251 193.683 67.6606 186.23 63.389 151.077C61.3022 134.017 31.825 125.875 21.1949 116.656C-15.6516 84.6475 6.32586 9.34372 49.7265 15.1595C67.6606 17.5289 80.671 34.9763 85.7578 56.904Z" fill="#305D74"/>
          <path d="M305.761 14.9424V53.8005H269.273V216.987H238.687V53.8005H206.927V14.9424H305.761Z" fill="#305D74"/>
          <path d="M364.585 117.516H392.823V172.701C392.823 184.505 379.291 204.236 371.563 209.923C343.912 230.299 305.761 205.787 305.761 163.396V56.1271L307.522 53.8008H333.412L335.173 56.1271V168.049C335.173 174.209 346.227 181.791 351.053 181.361C355.879 180.93 364.585 172.357 364.585 166.498V117.559V117.516Z" fill="#305D74"/>
          <path d="M335.134 -0.000393149L315.032 26.6885L335.14 53.1257L355.243 26.4368L335.134 -0.000393149Z" fill="#E73B49"/>
          <path d="M550.448 179.68H522.21V216.987H550.448V179.68Z" fill="#E73B49"/>
        </svg>
        <span className="text-[clamp(0.65rem,1.5vw,1rem)] text-navy font-bold ltr:self-end rtl:self-start tracking-wider">BY VITA</span>
        </a>

        {/* ─── Social icons (brand colors, no bg) ─── */}
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

        {/* ─── Nav links ─── */}
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-8">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `text-sm no-underline transition-colors duration-200 font-medium ${
                  isActive
                    ? "text-navy font-bold"
                    : "text-[#8899a6] hover:text-navy"
                }`
              }
            >
              {t(link.labelEn, link.labelAr, lang)}
            </NavLink>
          ))}
        </nav>

        {/* ─── Copyright ─── */}
        <p className="text-[#0A1216]/50 text-xs m-0">
          &copy; {new Date().getFullYear()} {t("Setup Studio. All rights reserved.", "سيت أب ستوديو. جميع الحقوق محفوظة.", lang)}
        </p>
        <p className="text-[#0A1216]/40 text-[10px] m-0 mt-2">
          {t("Designed by 3m Tech", "تم التصميم بواسطة 3m Tech", lang)}
        </p>
      </div>
    </footer>
  )
}

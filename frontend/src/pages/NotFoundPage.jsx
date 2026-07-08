import { Link, useLocation } from "react-router-dom"
import SEO from "../components/SEO"
import Button from "../components/ui/Button"
import { useTranslation } from "../context/LanguageContext"

const t = (en, ar, lang) => lang === "ar" ? ar : en

export default function NotFoundPage() {
  const { lang } = useTranslation()
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith("/admin")

  return (
    <>
      <SEO titleEn="404" titleAr="٤٠٤" descEn="Page not found — Setup Studio" descAr="الصفحة غير موجودة — سيت أب ستوديو" path={pathname} />
    <div className="min-h-screen bg-[#0A1216] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-[clamp(5rem,12vw,10rem)] font-black text-red leading-none mb-2 tracking-tighter">
          404
        </div>
        <div className="w-16 h-[3px] bg-red mx-auto rounded-full mb-6" />
        <h1 className="text-white font-bold text-xl sm:text-2xl m-0 mb-3">
          {t("Page not found", "الصفحة غير موجودة", lang)}
        </h1>
        <p className="text-white/50 text-sm sm:text-base m-0 mb-8 leading-relaxed">
          {t("The page", "الصفحة", lang)} <span className="text-white/70 font-mono text-xs break-all">{pathname}</span> {t("doesn't exist or has been moved.", "غير موجودة أو تم نقلها.", lang)}
        </p>
        <Link to={isAdmin ? "/admin" : "/"} className="no-underline">
          <Button variant="navy" size="md">
            <i className="fa-solid fa-arrow-left ltr:mr-2 rtl:ml-2" />
            {isAdmin ? t("Back to Dashboard", "العودة للوحة التحكم", lang) : t("Back to Home", "العودة للرئيسية", lang)}
          </Button>
        </Link>
      </div>
    </div>
    </>
  )
}

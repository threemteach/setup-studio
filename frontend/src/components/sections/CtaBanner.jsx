import { Link, useLocation } from "react-router-dom"
import Reveal from "../ui/Reveal"
import { useTranslation } from "../../context/LanguageContext"

const t = (en, ar, lang) => lang === "ar" ? ar : en

export default function CtaBanner() {
  const { lang } = useTranslation()
  const location = useLocation()

  function scrollToContact(e) {
    if (location.pathname === "/") {
      e.preventDefault()
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section className="w-full py-[clamp(2rem,5vw,4rem)] px-[clamp(1rem,4vw,3rem)] bg-white dark:bg-[#0A1216]">
      <div className="max-w-[1280px] mx-auto">
        <Reveal>
          <div className="relative overflow-hidden rounded-[clamp(1.25rem,2.5vw,2.5rem)] bg-[#0A1216] min-h-[clamp(10rem,16vw,16rem)] flex items-center">
            <div className="absolute -top-[clamp(8rem,15vw,12rem)] -right-[clamp(4rem,8vw,6rem)] w-[clamp(16rem,40vw,30rem)] h-[clamp(16rem,40vw,30rem)] rounded-full bg-[#11AFFF] opacity-[0.35] blur-[clamp(3rem,6vw,4rem)] pointer-events-none" />
            <div className="absolute -bottom-[clamp(6rem,12vw,10rem)] -left-[clamp(2rem,4vw,4rem)] w-[clamp(12rem,30vw,22rem)] h-[clamp(12rem,30vw,22rem)] rounded-full bg-[#11AFFF] opacity-[0.30] blur-[clamp(3rem,6vw,4rem)] pointer-events-none" />
            <div className="absolute top-[clamp(1rem,3vw,2rem)] left-[clamp(20%,35%,40%)] w-[clamp(6rem,15vw,12rem)] h-[clamp(6rem,15vw,12rem)] rounded-full bg-[#11AFFF] opacity-[0.20] blur-[clamp(2rem,4vw,3rem)] pointer-events-none" />

            <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-[clamp(1.25rem,3vw,2.5rem)] px-[clamp(1.5rem,4vw,3.5rem)] py-[clamp(1.5rem,3vw,2.5rem)]">
              <div className={`text-center ${lang === 'ar' ? 'md:text-right' : 'md:text-left'}`}>
                <h2 className="text-white font-bold text-[clamp(1.3rem,3vw,2.2rem)] m-0 leading-tight">
                  {t("Your Next Scene", "مشهدك القادم", lang)}<br />
                  {t("Starts", "يبدأ", lang)} <span className="text-[#11AFFF]">{t("Here.", "هنا", lang)}</span>
                </h2>
                <p className={`text-white/50 text-[clamp(0.8rem,1.3vw,1rem)] mt-2 m-0 max-w-[36rem] leading-relaxed ${lang === 'ar' ? 'text-right' : ''}`}>
                  {t("Contact our team to book the perfect location for your production.", "تواصل مع فريقنا لحجز الموقع المثالي لإنتاجك.", lang)}
                </p>
              </div>

              <div className="flex items-center gap-[clamp(0.6rem,1.5vw,1rem)] shrink-0">
                <a
                  href="/#contact"
                  onClick={scrollToContact}
                  className="inline-flex items-center gap-2 bg-white text-[#0A1216] font-semibold text-[clamp(0.85rem,1.2vw,1rem)] px-[clamp(1.25rem,2.5vw,2rem)] py-[clamp(0.6rem,1.2vw,1rem)] rounded-full hover:bg-white/90 transition-all duration-300 shadow-lg"
                >
                  {t("Get Quote", "احصل على عرض", lang)}
                </a>
                <Link
                  to="/locations"
                  className="inline-flex items-center gap-2 border-2 border-white text-white font-semibold text-[clamp(0.85rem,1.2vw,1rem)] px-[clamp(1.25rem,2.5vw,2rem)] py-[clamp(0.6rem,1.2vw,1rem)] rounded-full hover:bg-white/10 transition-all duration-300"
                >
                  {t("View Studios", "شاهد الاستوديوهات", lang)}
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

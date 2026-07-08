import { useTranslation } from "../../context/LanguageContext"

const t = (en, ar, lang) => lang === "ar" ? ar : en

const itemsEn = ["PODCAST", "REELS", "OFFICE", "SAMPLES", "OUTDOOR"]
const itemsAr = ["بودكاست", "ريلز", "مكتب", "نماذج", "إنتاج خارجي"]

export default function Slider() {
  const { lang } = useTranslation()
  const items = lang === "ar" ? itemsAr : itemsEn
  const content = [...Array(6)].flatMap(() => items)
  const isRtl = lang === "ar"

  return (
    <section className="w-full bg-navy overflow-hidden py-[0.3rem]" dir="ltr">
      <div className="w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)]">
        <div
          dir="ltr"
          className={`flex items-center w-max marquee-track${isRtl ? "-rtl" : ""}`}
          style={{ animationDelay: '-10s' }}
        >
          {content.flatMap((text, i) => [
            <span
              key={`t-${i}`}
              dir={isRtl ? "rtl" : "ltr"}
              className="text-white text-[clamp(0.6rem,1.2vw,0.85rem)] font-semibold tracking-[0.12em] whitespace-nowrap shrink-0"
            >
              {text}
            </span>,
            <i
              key={`s-${i}`}
              className="fa-solid fa-asterisk text-white text-[clamp(8px,0.8vw,14px)] mx-[clamp(0.6rem,2vw,1.5rem)]"
            />,
          ])}
        </div>
      </div>

      <style>{`
        .marquee-track {
          animation: setup-marquee 25s linear infinite;
          will-change: transform;
        }
        @keyframes setup-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track-rtl {
          animation: setup-marquee-rtl 25s linear infinite;
          will-change: transform;
        }
        @keyframes setup-marquee-rtl {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </section>
  )
}
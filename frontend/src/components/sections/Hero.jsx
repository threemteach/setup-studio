import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Button from "../ui/Button"
import { fetchHomepageContent } from "../../lib/homepage"
import { optimizeImageUrl } from "../../lib/images"
import { useTranslation } from "../../context/LanguageContext"

const t = (en, ar, lang) => lang === "ar" ? ar : en

const positions = [
  { top: "0%", left: "0%", rotate: "-16deg", z: 1 },
  { top: "6%", left: "12%", rotate: "-6deg", z: 2 },
  { top: "12%", left: "22%", rotate: "5deg", z: 3 },
  { top: "20%", left: "32%", rotate: "14deg", z: 4, wide: true },
]

function getCardClasses(wide) {
  return `absolute object-cover rounded-[10%] shadow-[0_8px_20px_rgba(48,93,116,0.22)] border-[3px] sm:border-4 border-white dark:border-[#1e2d3d] ${
    wide ? "w-[52%] h-[76%]" : "w-[46%] h-[70%]"
  }`
}

export default function Hero() {
  const [content, setContent] = useState(null)
  const { lang } = useTranslation()

  useEffect(() => {
    fetchHomepageContent().then((data) => {
      setContent(data.hero || null)
    }).catch(console.error)
  }, [])

  const localized = content ? (content[`content_${lang}`] || content.content_en) : null
  const photos = content?.content_en?.photos?.filter(Boolean) || []
  const description = localized?.description || ""

  return (
    <section
      id="hero"
      dir="ltr"
      className="w-full bg-white dark:bg-[#0A1216] flex flex-col justify-center min-h-[60svh] sm:min-h-[75vh] lg:min-h-[calc(100vh-4.5rem)] py-[clamp(1rem,3vw,2rem)] overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)] flex flex-col justify-center flex-1 min-h-0 w-full gap-[clamp(1rem,3vw,1.5rem)]">
        <div className="flex flex-col sm:flex-row items-center justify-center w-full gap-1 sm:gap-[clamp(1rem,3vw,1.5rem)]">
          <div className="flex items-center justify-center sm:justify-start w-full sm:w-auto">
            <svg
              className="w-[clamp(18rem,80vw,50rem)] sm:w-[clamp(11rem,55vw,50rem)] h-auto block animate-fade-up opacity-0"
              style={{ animationDelay: "0.1s" }}
              viewBox="55 -5 170 75"
              fill="none"
              aria-label="SETUP"
            >
              <defs>
                <pattern id="bg" patternUnits="userSpaceOnUse" width="170" height="75" patternTransform="translate(30, -50) scale(1.5)">
                  <rect width="170" height="75" fill="#8fc3e0"/>
                  <image href="/images/setup-bg.jpg" width="170" height="75" preserveAspectRatio="xMidYMid slice"/>
                </pattern>
              </defs>
              <path d="M190.433 41.9092V31.8106C194.432 32.5569 198.483 29.1635 198.721 23.5894C199.048 15.753 192.455 10.8553 187.732 15.823C187.053 16.5343 185.34 19.6712 185.34 20.6624V58.7364H177.379V21.502C177.379 6.64557 191.978 -1.1908 200.778 8.25482C211.829 20.126 204.467 43.7051 190.433 41.9092Z" fill="url(#bg)"/>
              <path d="M114.322 4.0451V14.9834H104.128V25.2919C104.128 26.4347 106.281 25.5018 106.82 25.4785C109.38 25.3852 111.772 26.0382 114.314 25.5018V36.0203H104.119V47.5883L104.596 48.218H114.623V58.7364H95.8309V4.0451H114.305H114.322Z" fill="url(#bg)"/>
              <path d="M88.2137 15.4032L81.073 17.5488C79.1489 10.074 70.8431 14.6918 73.4381 21.6769C74.7709 25.2569 79.7402 25.84 82.3794 27.5425C89.7407 32.3003 91.8237 43.8217 86.8897 52.5793C80.2522 64.3338 66.6064 58.9113 65 44.9062L72.2995 42.3407C72.8026 52.4277 83.315 50.4103 82.1587 40.8947C81.5938 36.2768 73.6147 34.0729 70.7372 31.5773C60.7633 22.913 66.7123 2.52914 78.4604 4.10341C83.315 4.74478 86.8367 9.46759 88.2137 15.4032Z" fill="url(#bg)"/>
              <path d="M147.766 4.0451V14.5636H137.889V58.7364H129.61V14.5636H121.013V4.0451H147.766Z" fill="url(#bg)"/>
              <path d="M165.689 31.8106H173.333V46.7486C173.333 49.9438 169.67 55.2847 167.578 56.824C160.093 62.3397 149.766 55.7045 149.766 44.2298V15.1933L150.243 14.5636H157.251L157.727 15.1933V45.4892C157.727 47.1568 160.72 49.2092 162.026 49.0926C163.332 48.9759 165.689 46.6553 165.689 45.0694V31.8222V31.8106Z" fill="url(#bg)"/>
              <path d="M155.717 -3.5362e-06L150.276 7.22437L155.719 14.3806L161.16 7.15625L155.717 -3.5362e-06Z" fill="url(#bg)"/>
              <path d="M214 48.6378H206.356V58.7364H214V48.6378Z" fill="url(#bg)"/>
            </svg>
          </div>

          <div className="relative w-[clamp(10rem,45vw,24rem)] sm:w-[clamp(7.5rem,32vw,24rem)] aspect-square shrink-0">
            {photos.slice(0, 4).map((photo, i) => {
              const pos = positions[i] || positions[0]
              return (
                <motion.img
                  key={photo.id || i}
                  src={optimizeImageUrl(photo.url, 500)}
                  alt=""
                  className={getCardClasses(pos.wide)}
                  style={{
                    top: pos.top,
                    left: pos.left,
                    rotate: pos.rotate,
                    zIndex: pos.z,
                  }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  viewport={{ once: false, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: 0.15 + pos.z * 0.08 }}
                />
              )
            })}
          </div>
        </div>

        <div className="flex flex-col items-center text-center gap-[clamp(0.5rem,1.5vw,0.75rem)] w-full">
          {description && (
            <p className="m-0 max-w-[42rem] leading-[1.5] animate-fade-up opacity-0"
              style={{ animationDelay: "0.35s" }}
            >
              <span className="block text-[clamp(0.8rem,2vw,1rem)] sm:text-[clamp(0.6rem,2vw,1rem)] text-navy dark:text-white/80 font-semibold">
                {description}
              </span>
            </p>
          )}

          <div className="flex items-center gap-4 animate-fade-up opacity-0" style={{ animationDelay: "0.45s" }}>
            <Button
              variant="navy"
              size="md"
              className="text-[clamp(0.75rem,1.6vw,0.875rem)]"
              onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
            >
              {t("Get Quotes", "احصل على عرض", lang)}
            </Button>
            <Button
              variant="red"
              size="md"
              className="text-[clamp(0.75rem,1.6vw,0.875rem)]"
              onClick={() => document.getElementById("spaces")?.scrollIntoView({ behavior: "smooth" })}
            >
              {t("See Locations", "شاهد المواقع", lang)}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

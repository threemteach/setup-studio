import { useState, useEffect } from "react"
import Reveal from "../ui/Reveal"
import Button from "../ui/Button"
import { fetchHomepageContent } from "../../lib/homepage"
import { useTranslation } from "../../context/LanguageContext"

const t = (en, ar, lang) => lang === "ar" ? ar : en

export default function PlansAndContact() {
  const [content, setContent] = useState(null)
  const { lang } = useTranslation()
  const [form, setForm] = useState({ name: "", phone: "", email: "", details: "" })

  useEffect(() => {
    fetchHomepageContent().then((data) => {
      setContent(data.quotes || null)
    }).catch(console.error)
  }, [])

  const localized = content ? (content[`content_${lang}`] || content.content_en) : null
  const plans = localized?.plans || []

  function handleSubmit(e) {
    e.preventDefault()
    const msg = encodeURIComponent(
      `Hi setupstudio! I have an inquiry.\n\nName: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email}\nDetails: ${form.details}`
    )
    window.open(`https://wa.me/201012846764?text=${msg}`, "_blank")
  }

  return (
    <section className="w-full bg-[#0A1216] overflow-hidden pt-[clamp(2rem,5vw,4rem)]">
      <div className="relative">
        <div className="absolute -top-[clamp(4rem,8vw,10rem)] -right-[clamp(2rem,4vw,6rem)] w-[clamp(20rem,50vw,40rem)] h-[clamp(20rem,50vw,40rem)] rounded-full bg-[#11AFFF] opacity-[0.18] blur-[clamp(4rem,8vw,6rem)] pointer-events-none" />
        <div className="absolute top-[clamp(8rem,20vw,30rem)] -left-[clamp(4rem,8vw,10rem)] w-[clamp(16rem,40vw,32rem)] h-[clamp(16rem,40vw,32rem)] rounded-full bg-[#11AFFF] opacity-[0.15] blur-[clamp(4rem,8vw,6rem)] pointer-events-none" />
        <div className="absolute top-[clamp(20rem,40vw,60rem)] right-[clamp(2rem,5vw,8rem)] w-[clamp(14rem,35vw,28rem)] h-[clamp(14rem,35vw,28rem)] rounded-full bg-[#11AFFF] opacity-[0.12] blur-[clamp(3rem,6vw,5rem)] pointer-events-none" />
        <div className="absolute bottom-[clamp(4rem,8vw,12rem)] -left-[clamp(4rem,8vw,12rem)] w-[clamp(18rem,45vw,36rem)] h-[clamp(18rem,45vw,36rem)] rounded-full bg-[#11AFFF] opacity-[0.15] blur-[clamp(4rem,8vw,6rem)] pointer-events-none" />

        <div className="relative z-10 max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)] pt-[clamp(1.5rem,3vw,2.5rem)] pb-[clamp(1.5rem,3vw,3rem)]">
          <div className="flex flex-col items-center text-center mb-[clamp(2rem,4vw,3.5rem)]">
            <Reveal>
              <div className="flex items-center justify-center w-full px-0">
                <div className="flex items-center min-w-0 shrink">
                  <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                    <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                  </svg>
                  <span className="block w-[clamp(1.5rem,12vw,16rem)] h-[2px] bg-red" />
                </div>
                <h2 className="text-white text-[clamp(1.3rem,4.5vw,3.5rem)] font-bold leading-tight m-0 px-[clamp(0.4rem,2vw,1.5rem)] whitespace-nowrap">
                  {t("Our Quotes", "عروض الأسعار", lang)}
                </h2>
                <div className="flex items-center min-w-0 shrink">
                  <span className="block w-[clamp(1.5rem,12vw,16rem)] h-[2px] bg-red" />
                  <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                    <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                  </svg>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[clamp(1rem,2vw,1.5rem)] items-stretch">
            {plans.map((plan, i) => (
              <Reveal key={i} delay={0.1 * i}>
                <div className="relative bg-white rounded-[clamp(1.25rem,2.5vw,2rem)] p-[clamp(1.25rem,2.2vw,2rem)] flex flex-col h-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] min-h-[clamp(18rem,28vw,28rem)]">
                  {plan.popular && (
                    <span className="absolute -top-3 ltr:left-1/2 rtl:right-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2 bg-red text-white text-[0.65rem] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      {t("Most Popular", "الأكثر طلباً", lang)}
                    </span>
                  )}
                  <h3 className="text-navy font-extrabold text-[clamp(1.3rem,2.5vw,2.2rem)] m-0 text-center leading-tight">{plan.name}</h3>
                  <p className="text-navy/60 text-[clamp(0.7rem,1vw,0.85rem)] mt-2 mb-0 leading-relaxed text-center">{plan.desc}</p>
                    <ul className="mt-4 space-y-2 m-0 p-0 list-none flex-1 flex flex-col items-center">
                    {plan.features?.map((f, j) => (
                      <li key={j} className="text-navy/70 text-[clamp(0.7rem,0.9vw,0.85rem)] flex items-center gap-2">
                        <svg className="w-[clamp(0.45rem,0.6vw,0.55rem)] h-[clamp(0.45rem,0.6vw,0.55rem)] text-red shrink-0" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M4.5 8.5L2 6l-.7.7L4.5 10l6-6-.7-.7z" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`https://wa.me/201012846764?text=${encodeURIComponent("Hi setupstudio! I'd like to ask about the " + (plan.name || "") + " plan.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-underline mt-4 self-center w-full"
                  >
                    <Button variant="navy" size="sm" className="w-full text-[clamp(0.7rem,0.9vw,0.85rem)]">
                      {t("Get This Plan", "احصل على الباقة", lang)}
                    </Button>
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* ─── Contact ─── */}
        <div id="contact" className="relative z-10 max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)] pt-[clamp(2rem,4vw,3.5rem)] pb-[clamp(2.5rem,6vw,5.5rem)]">
            <Reveal>
              <div className="text-center mb-[clamp(2rem,4vw,3rem)]">
                <h2 className="text-white font-bold text-[clamp(1.5rem,3.5vw,2.5rem)] m-0 leading-tight">
                  {t("Contact With Us", "تواصل معنا", lang)}
                </h2>
                <p className="text-white font-semibold text-[clamp(1rem,1.8vw,1.3rem)] mt-4 m-0">
                  {t("Ready to Find the Perfect Location?", "هل أنت مستعد لإيجاد الموقع المثالي؟", lang)}
                </p>
                <p className="text-white/50 text-[clamp(0.8rem,1.3vw,1rem)] mt-2 m-0 max-w-[32rem] mx-auto">
                  {t("Let's discuss your project and help you choose the ideal space for your next production.", "دعنا نناقش مشروعك ونساعدك في اختيار المساحة المثالية لإنتاجك القادم.", lang)}
                </p>
              </div>
            </Reveal>

            <div className="max-w-[720px] mx-auto">
              <Reveal delay={0.2}>
                <form className="flex flex-col gap-4 items-center" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <input type="text" placeholder={t("Name", "الاسم", lang)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#b5b7b9] border border-[#b5b7b9]/80 rounded-full px-5 py-[clamp(0.7rem,1.1vw,0.95rem)] text-[#0A1216] placeholder-[#0A1216]/40 text-[clamp(0.8rem,1.1vw,0.9rem)] outline-none focus:border-[#11AFFF]/50 transition-colors duration-200" required />
                    <input type="tel" placeholder={t("Phone", "الهاتف", lang)} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-[#b5b7b9] border border-[#b5b7b9]/80 rounded-full px-5 py-[clamp(0.7rem,1.1vw,0.95rem)] text-[#0A1216] placeholder-[#0A1216]/40 text-[clamp(0.8rem,1.1vw,0.9rem)] outline-none focus:border-[#11AFFF]/50 transition-colors duration-200" required />
                  </div>
                  <input type="email" placeholder={t("Email", "البريد الإلكتروني", lang)} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-[#b5b7b9] border border-[#b5b7b9]/80 rounded-full px-5 py-[clamp(0.7rem,1.1vw,0.95rem)] text-[#0A1216] placeholder-[#0A1216]/40 text-[clamp(0.8rem,1.1vw,0.9rem)] outline-none focus:border-[#11AFFF]/50 transition-colors duration-200 w-full" />
                  <textarea rows={4} placeholder={t("Project Details", "تفاصيل المشروع", lang)} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} className="bg-[#b5b7b9] border border-[#b5b7b9]/80 rounded-[clamp(1rem,2vw,2rem)] px-5 py-[clamp(0.7rem,1.1vw,0.95rem)] text-[#0A1216] placeholder-[#0A1216]/40 text-[clamp(0.8rem,1.1vw,0.9rem)] outline-none focus:border-[#11AFFF]/50 transition-colors duration-200 resize-none w-full" />
                  <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-full font-semibold cursor-pointer select-none transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--navy)] active:scale-[0.97] w-full px-6 py-3 text-[clamp(0.9rem,1.3vw,1.1rem)] bg-white text-navy border border-white shadow-[3px_3px_0_var(--red)] hover:shadow-[2px_2px_0_var(--red)] hover:-translate-y-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {t("Send Request", "إرسال الطلب", lang)}
                  </button>
                  <a href="https://maps.app.goo.gl/1jnx5YpxZe9oZnpL7" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full font-semibold text-[clamp(0.85rem,1.1vw,1rem)] bg-transparent text-white border-2 border-white/30 hover:border-white/60 hover:bg-white/5 transition-all duration-300 no-underline mt-2">
                    <i className="fa-solid fa-location-dot text-red" />
                    {t("View Location on Map", "عرض الموقع على الخريطة", lang)}
                  </a>
                </form>
              </Reveal>
            </div>
          </div>
      </div>
    </section>
  )
}

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import SEO from "../components/SEO"
import Reveal from "../components/ui/Reveal"
import { optimizeImageUrl } from "../lib/images"
import { useTranslation } from "../context/LanguageContext"
import { fetchAcademyContent } from "../lib/academy"

const t = (en, ar, lang) => lang === "ar" ? ar : en

const defaultDifferences = [
  { en: "Practical training inside a real production studio", ar: "تدريب عملي داخل استوديو إنتاج حقيقي" },
  { en: "Hands-on learning, not just theoretical sessions", ar: "تعلم تطبيقي، وليس مجرد جلسات نظرية" },
  { en: "Access to studio locations, lighting setups, and production tools", ar: "الوصول إلى مواقع الاستوديو وإعدادات الإضاءة وأدوات الإنتاج" },
  { en: "Courses designed around real content creation needs", ar: "دورات مصممة حول احتياجات صناعة المحتوى الحقيقية" },
  { en: "Guidance from instructors with market experience", ar: "إرشاد من مدربين ذوي خبرة في السوق" },
  { en: "A learning environment connected to an active creative studio", ar: "بيئة تعليمية متصلة باستوديو إبداعي نشط" },
]

const defaultFocusItems = [
  { en: "Camera & equipment basics", ar: "أساسيات الكاميرا والمعدات" },
  { en: "Understanding light & audio", ar: "فهم الإضاءة والصوت" },
  { en: "Framing and composition", ar: "التأطير والتكوين" },
  { en: "Practical shooting techniques", ar: "تقنيات التصوير العملية" },
]

const defaultExpectations = [
  { icon: "fa-solid fa-calendar-check", textEn: "Attend structured learning sessions", textAr: "حضور جلسات تعليمية منظمة" },
  { icon: "fa-solid fa-building", textEn: "Practice with real studio equipment & setups", textAr: "التدرب بمعدات وإعدادات استوديو حقيقية" },
  { icon: "fa-solid fa-comment-dots", textEn: "Receive feedback on your work", textAr: "تلقي ملاحظات على عملك" },
  { icon: "fa-solid fa-camera", textEn: "Build confidence behind the camera", textAr: "بناء ثقة خلف الكاميرا" },
]

const defaultUpcomingCourses = [
  { titleEn: "Podcast Production", titleAr: "إنتاج البودكاست", icon: "fa-solid fa-microphone", descEn: "Master professional podcast recording and production.", descAr: "أتقن التسجيل والإنتاج الاحترافي للبودكاست." },
  { titleEn: "Video Content Creation", titleAr: "صناعة المحتوى المرئي", icon: "fa-solid fa-video", descEn: "Learn end-to-end video production from concept to final cut.", descAr: "تعلم إنتاج الفيديو من البداية إلى النهاية." },
  { titleEn: "Studio Lighting & Design", titleAr: "إضاءة وتصميم الاستوديو", icon: "fa-solid fa-lightbulb", descEn: "Understand professional lighting setups for any production.", descAr: "افهم إعدادات الإضاءة الاحترافية لأي إنتاج." },
  { titleEn: "Short-Form Content", titleAr: "المحتوى القصير", icon: "fa-solid fa-mobile-screen", descEn: "Create engaging reels and short videos that drive results.", descAr: "أنشئ ريلز وفيديوهات قصيرة جذابة تحقق نتائج." },
]

const defaultFaqs = [
  { qEn: "Do I need previous video production experience?", qAr: "هل أحتاج إلى خبرة سابقة في إنتاج الفيديو؟", aEn: "No. The Video Content Foundation Course is designed for beginners and anyone who wants to build a stronger practical foundation.", aAr: "لا. دورة أساسيات إنتاج المحتوى المرئي مصممة للمبتدئين وأي شخص يرغب في بناء أساس عملي أقوى." },
  { qEn: "Do I need to have my own camera?", qAr: "هل أحتاج إلى امتلاك كاميرا خاصة بي؟", aEn: "Having a camera is helpful, but the course is also suitable for those who want to understand video production basics before investing in equipment.", aAr: "امتلاك كاميرا مفيد، لكن الدورة مناسبة أيضاً لمن يريدون فهم أساسيات إنتاج الفيديو قبل الاستثمار في المعدات." },
  { qEn: "Is the course practical or theoretical?", qAr: "هل الدورة عملية أم نظرية؟", aEn: "The course is practical — with explanation, demonstration, and hands-on application inside Setup Studio using real equipment and scenarios.", aAr: "الدورة عملية — مع الشرح والعرض والتطبيق العملي داخل سيت أب ستوديو باستخدام معدات وسيناريوهات حقيقية." },
  { qEn: "What makes Setup Academy different?", qAr: "ما الذي يميز أكاديمية سيت أب؟", aEn: "Setup Academy is built inside a real production studio. You learn by doing — using professional equipment, real sets, and actual production workflows.", aAr: "أكاديمية سيت أب مبنية داخل استوديو إنتاج حقيقي. تتعلم بالممارسة — باستخدام معدات احترافية ومجموعات تصوير حقيقية وسير عمل إنتاجي فعلي." },
]

const defaultAudiences = [
  { titleEn: "Beginners", titleAr: "المبتدئون", descEn: "Start learning video and content creation from scratch", descAr: "ابدأ تعلم الفيديو وصناعة المحتوى من الصفر" },
  { titleEn: "Content Creators", titleAr: "صانعو المحتوى", descEn: "Improve the quality of your visuals and production value", descAr: "حسّن جودة المرئيات وقيمة الإنتاج لديك" },
  { titleEn: "Business Owners", titleAr: "أصحاب الأعمال", descEn: "Create better content for your brand and marketing", descAr: "أنشئ محتوى أفضل لعلامتك التجارية وتسويقك" },
  { titleEn: "Social Media Specialists", titleAr: "متخصصو التواصل الاجتماعي", descEn: "Understand professional video production", descAr: "افهم إنتاج الفيديو الاحترافي" },
]

export default function AcademyPage() {
  const { lang } = useTranslation()
  const [openFaq, setOpenFaq] = useState(null)
  const [cmsData, setCmsData] = useState(null)

  useEffect(() => {
    fetchAcademyContent().then(setCmsData).catch(() => {})
  }, [])

  const cms = (field) => cmsData?.[`${field}_${lang}`] || cmsData?.[`${field}_en`] || ""
  const cmsPhoto = (field, fallback) => cmsData?.[`${field}_photo_url`] || fallback

  const differences = cmsData?.differences || defaultDifferences
  const focusItems = cmsData?.focus_items || defaultFocusItems
  const expectations = cmsData?.expectations || defaultExpectations
  const upcomingCourses = cmsData?.upcoming_courses || defaultUpcomingCourses
  const faqs = cmsData?.faqs || defaultFaqs
  const audiences = cmsData?.audiences || defaultAudiences
  const audienceHeading = cms("audience_heading")

  return (
    <>
      <SEO titleEn="Academy" titleAr="الأكاديمية" descEn="Learn content creation and video production at Setup Studio Academy in Alexandria. Courses in podcasting, lighting, short-form content, and more." descAr="تعلم صناعة المحتوى وإنتاج الفيديو في أكاديمية سيت أب ستوديو بالإسكندرية. دورات في البودكاست والإضاءة والمحتوى القصير والمزيد." path="/academy" />
      <div className="page-enter">
      <section className="w-full bg-[#0A1216] py-[clamp(3rem,8vw,5.5rem)] overflow-hidden relative">
        <div className="absolute -top-[clamp(8rem,15vw,12rem)] ltr:-right-[clamp(4rem,8vw,6rem)] rtl:-left-[clamp(4rem,8vw,6rem)] w-[clamp(16rem,40vw,30rem)] h-[clamp(16rem,40vw,30rem)] rounded-full bg-[#11AFFF] opacity-[0.25] blur-[clamp(4rem,8vw,6rem)] pointer-events-none" />
        <div className="absolute -bottom-[clamp(6rem,12vw,10rem)] ltr:-left-[clamp(2rem,4vw,4rem)] rtl:-right-[clamp(2rem,4vw,4rem)] w-[clamp(12rem,30vw,22rem)] h-[clamp(12rem,30vw,22rem)] rounded-full bg-[#11AFFF] opacity-[0.18] blur-[clamp(4rem,8vw,6rem)] pointer-events-none" />
        <div className="absolute top-[clamp(2rem,5vw,4rem)] ltr:right-[clamp(10%,20%,30%)] rtl:left-[clamp(10%,20%,30%)] w-[clamp(8rem,20vw,16rem)] h-[clamp(8rem,20vw,16rem)] rounded-full bg-[#11AFFF] opacity-[0.12] blur-[clamp(2rem,4vw,3rem)] pointer-events-none" />
        <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)] relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(2rem,4vw,4rem)] items-center">
            <Reveal>
              <div className={`flex flex-col items-center text-center ${lang === 'ar' ? 'lg:items-start lg:text-right' : 'lg:items-start lg:text-left'}`}>
                <div className="flex items-center w-full mb-4 lg:justify-start justify-center">
                  <div className="flex items-center min-w-0 shrink">
                    <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                      <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                    </svg>
                    <span className="block w-[clamp(1.5rem,12vw,16rem)] h-[2px] bg-red" />
                  </div>
                  <h1 className={`text-white font-bold text-[clamp(2rem,5vw,3.25rem)] leading-[1.15] m-0 px-[clamp(0.4rem,2vw,1.5rem)] whitespace-nowrap w-full ${lang === 'ar' ? 'text-right' : ''}`}>
                    {t("Setup Academy", "أكاديمية سيت أب", lang)}
                  </h1>
                  <div className="flex items-center min-w-0 shrink">
                    <span className="block w-[clamp(1.5rem,12vw,16rem)] h-[2px] bg-red" />
                    <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                      <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                    </svg>
                  </div>
                </div>
                <p className={`text-white/70 font-semibold text-[clamp(1rem,1.8vw,1.2rem)] max-w-[620px] leading-snug m-0 mb-4 w-full ${lang === 'ar' ? 'text-right' : ''}`}>
                  {cms("hero_subtitle") || t("Learn Content Creation Inside a Real Production Studio", "تعلم صناعة المحتوى داخل استوديو إنتاج حقيقي", lang)}
                </p>
                <p className={`text-white/60 text-[clamp(0.875rem,1.5vw,1rem)] max-w-[620px] leading-relaxed m-0 w-full ${lang === 'ar' ? 'text-right' : ''}`}>
                  {cms("hero_body") || t("Setup Academy is the educational arm of Setup Studio — built for anyone who wants to learn video production through real practice, from concept to final delivery.", "أكاديمية سيت أب هي الذراع التعليمية لاستوديو سيت أب — أنشئت لكل من يرغب في تعلم إنتاج الفيديو بالممارسة الحقيقية، من الفكرة إلى التسليم النهائي.", lang)}
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.2} className="hidden lg:block">
              <div className="relative">
                <div className="rounded-[clamp(1.5rem,3vw,3rem)] overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.3)]">
                  <img
                    src={optimizeImageUrl(cmsPhoto("hero", "https://res.cloudinary.com/yscxguwn/image/upload/v1783214841/setup-studio/locations/reels/z3cbr9ijav0r2c111hw4.jpg"), 800)}
                    alt="Setup Studio production"
                    className="w-full h-[clamp(16rem,28vw,22rem)] object-cover" style={{ objectPosition: 'center 70%' }}
                  />
                </div>
                <div className="absolute -bottom-3 ltr:-right-3 rtl:-left-3 w-24 h-24 rounded-2xl bg-red/20 -z-10" />
                <div className="absolute -top-3 ltr:-left-3 rtl:-right-3 w-16 h-16 rounded-2xl bg-white/10 -z-10" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="w-full bg-white dark:bg-[#0A1216] py-[clamp(2rem,5vw,5rem)] overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <div className="flex flex-col items-center text-center mb-[clamp(2rem,4vw,4rem)]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-[2px] bg-red rounded-full" />
              <span className="text-[clamp(0.7rem,1vw,0.8rem)] font-semibold uppercase tracking-wider text-red/70">{cms("why_label") || t("Why Setup Academy?", "لماذا أكاديمية سيت أب؟", lang)}</span>
              <span className="w-5 h-[2px] bg-red rounded-full" />
            </div>
            <div className="flex items-center justify-center w-full mb-3">
              <div className="flex items-center min-w-0 shrink">
                <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                  <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                </svg>
                <span className="block w-[clamp(1.5rem,8vw,10rem)] h-[2px] bg-red" />
              </div>
              <h2 className="text-navy dark:text-white font-bold text-[clamp(1.5rem,4vw,2.5rem)] leading-tight mx-[clamp(0.75rem,2vw,1.5rem)] whitespace-nowrap">
                {cms("why_heading") || t("What Makes Us Different?", "ما الذي يميزنا؟", lang)}
              </h2>
              <div className="flex items-center min-w-0 shrink">
                <span className="block w-[clamp(1.5rem,8vw,10rem)] h-[2px] bg-red" />
                <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                  <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                </svg>
              </div>
            </div>
            <p className="text-navy/60 dark:text-white/50 text-[clamp(0.9rem,1.3vw,1rem)] max-w-[600px] mx-auto leading-relaxed">
              {cms("why_intro") || t("Learning happens where real production happens.", "التعلم يحدث حيث يحدث الإنتاج الحقيقي.", lang)}
            </p>
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-[clamp(2rem,4vw,4rem)] items-center ${lang === 'ar' ? '[&>*:first-child]:lg:order-2 [&>*:last-child]:lg:order-1' : ''}`}>
            <Reveal>
              <div className="relative">
                <div className="rounded-[clamp(1.25rem,2.5vw,2.5rem)] overflow-hidden shadow-[0_8px_32px_rgba(48,93,116,0.12)]">
                  <img
                    src={optimizeImageUrl(cmsPhoto("why", "https://res.cloudinary.com/yscxguwn/image/upload/v1783214895/setup-studio/locations/reels/acphlvi0gzn7ag29zstf.jpg"), 800)}
                    alt="Studio production setup"
                    className="w-full aspect-[4/3] object-cover"
                  />
                </div>
                <div className="absolute -bottom-4 ltr:-left-4 rtl:-right-4 w-20 h-20 rounded-xl bg-red/10 -z-10" />
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <p className={`text-navy/60 dark:text-white/50 text-[clamp(0.9rem,1.3vw,1rem)] leading-relaxed mb-6 ${lang === 'ar' ? 'text-right' : ''}`}>
                {cms("why_body") || t("Instead of traditional theory-heavy courses, our students train inside Setup Studio with real spaces, lighting, equipment, and creative scenarios — a practical, engaging experience that's market-ready.", "بدلاً من الدورات النظرية التقليدية، يتدرب طلابنا داخل سيت أب ستوديو بمساحات حقيقية وإضاءة ومعدات وسيناريوهات إبداعية — تجربة عملية جاهزة للسوق.", lang)}
              </p>
              <ul className="space-y-3 m-0 p-0 list-none">
                {differences.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-navy/70 dark:text-white/70 text-[clamp(0.85rem,1.2vw,0.95rem)]">
                    <svg className="w-[clamp(0.55rem,0.8vw,0.7rem)] h-[clamp(0.55rem,0.8vw,0.7rem)] text-red shrink-0 mt-[0.35em]" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M4.5 8.5L2 6l-.7.7L4.5 10l6-6-.7-.7z" />
                    </svg>
                    {t(item.en, item.ar, lang)}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="w-full bg-[#f8f9fb] dark:bg-[#15202b] py-[clamp(2rem,5vw,5rem)] overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <div className="flex items-center justify-center w-full mb-[clamp(2rem,4vw,4rem)]">
            <div className="flex items-center min-w-0 shrink">
              <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
              </svg>
              <span className="block w-[clamp(1.5rem,8vw,10rem)] h-[2px] bg-red" />
            </div>
            <h2 className="text-navy dark:text-white font-bold text-[clamp(1.5rem,4vw,2.5rem)] leading-tight mx-[clamp(0.75rem,2vw,1.5rem)] whitespace-nowrap">
              {audienceHeading || t("Who Is Setup Academy For?", "لمن هذه الأكاديمية؟", lang)}
            </h2>
            <div className="flex items-center min-w-0 shrink">
              <span className="block w-[clamp(1.5rem,8vw,10rem)] h-[2px] bg-red" />
              <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[clamp(0.75rem,1.5vw,1.25rem)]">
            {audiences.map((item, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="group p-[clamp(1.25rem,2vw,1.75rem)] rounded-2xl border border-border dark:border-[#1e2d3d] bg-white dark:bg-[#0f1a24] hover:shadow-[0_8px_32px_rgba(48,93,116,0.1)] hover:border-navy/20 dark:hover:border-white/20 transition-all duration-300 h-full hover:-translate-y-0.5">
                  <span className="w-[clamp(2rem,2.5vw,2.5rem)] h-[clamp(2rem,2.5vw,2.5rem)] rounded-full bg-navy dark:bg-white/20 text-white text-[clamp(0.8rem,1vw,1rem)] font-bold flex items-center justify-center mb-3">
                    {i + 1}
                  </span>
                  <h3 className="text-navy dark:text-white font-bold text-[clamp(0.95rem,1.5vw,1.15rem)] m-0 mb-1.5">
                    {t(item.titleEn, item.titleAr, lang)}
                  </h3>
                  <p className={`text-navy/60 dark:text-white/50 text-[clamp(0.8rem,1.1vw,0.9rem)] leading-relaxed m-0 ${lang === 'ar' ? 'text-right' : ''}`}>
                    {t(item.descEn, item.descAr, lang)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-[#0A1216] py-[clamp(2rem,5vw,5rem)] overflow-hidden relative">
        <div className="absolute -top-[clamp(8rem,15vw,12rem)] ltr:left-[clamp(2rem,10vw,6rem)] rtl:right-[clamp(2rem,10vw,6rem)] w-[clamp(30rem,60vw,50rem)] h-[clamp(30rem,60vw,50rem)] rounded-full bg-[#11AFFF] opacity-[0.10] blur-[clamp(5rem,10vw,8rem)] pointer-events-none" />
        <div className="absolute top-[clamp(20rem,40vw,50rem)] ltr:-right-[clamp(4rem,8vw,6rem)] rtl:-left-[clamp(4rem,8vw,6rem)] w-[clamp(20rem,40vw,35rem)] h-[clamp(20rem,40vw,35rem)] rounded-full bg-[#11AFFF] opacity-[0.12] blur-[clamp(4rem,8vw,6rem)] pointer-events-none" />
        <div className="absolute -bottom-[clamp(6rem,12vw,10rem)] ltr:left-[clamp(10%,20%,30%)] rtl:right-[clamp(10%,20%,30%)] w-[clamp(16rem,35vw,28rem)] h-[clamp(16rem,35vw,28rem)] rounded-full bg-[#11AFFF] opacity-[0.08] blur-[clamp(3rem,6vw,5rem)] pointer-events-none" />
        <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)] relative z-10">
          <div className="flex flex-col items-center text-center mb-[clamp(2rem,4vw,4rem)]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-[2px] bg-red rounded-full" />
              <span className="text-[clamp(0.7rem,1vw,0.8rem)] font-semibold uppercase tracking-wider text-red/70">{cms("first_course_label") || t("Our First Course", "دورتنا الأولى", lang)}</span>
              <span className="w-5 h-[2px] bg-red rounded-full" />
            </div>
            <div className="flex items-center justify-center w-full mb-3">
              <div className="flex items-center min-w-0 shrink">
                <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                  <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                </svg>
                <span className="block w-[clamp(1.5rem,8vw,10rem)] h-[2px] bg-red" />
              </div>
              <h2 className="text-white font-bold text-[clamp(1.5rem,4vw,2.5rem)] leading-tight mx-[clamp(0.75rem,2vw,1.5rem)] whitespace-nowrap">
                {cms("first_course_heading") || t("Video Content Foundation Course", "دورة أساسيات إنتاج المحتوى المرئي", lang)}
              </h2>
              <div className="flex items-center min-w-0 shrink">
                <span className="block w-[clamp(1.5rem,8vw,10rem)] h-[2px] bg-red" />
                <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                  <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                </svg>
              </div>
            </div>
            <p className="text-white/60 text-[clamp(0.9rem,1.3vw,1rem)] max-w-[600px] mx-auto leading-relaxed">
              {cms("first_course_desc") || t("Learn professional video production through hands-on practice inside Setup Studio with real lighting, audio, and shooting setups.", "تعلم إنتاج الفيديو الاحترافي من خلال التطبيق العملي داخل سيت أب ستوديو بإضاءة حقيقية وصوت وإعدادات تصوير احترافية.", lang)}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(1.5rem,3vw,2.5rem)]">
            <Reveal className="h-full">
              <a href="/#" className="group block h-full flex flex-col no-underline rounded-[clamp(1.5rem,3vw,3rem)] border border-border dark:border-[#1e2d3d] bg-white dark:bg-[#0f1a24] overflow-hidden hover:shadow-[0_12px_48px_rgba(48,93,116,0.16)] hover:border-navy/20 dark:hover:border-white/20 transition-all duration-500 hover:-translate-y-1 cursor-pointer"
                onClick={(e) => e.preventDefault()}
              >
                <div className="relative overflow-hidden">
                  <img src={optimizeImageUrl(cmsPhoto("first_course", "https://res.cloudinary.com/yscxguwn/image/upload/v1783214748/setup-studio/locations/podcast/ss5shyhyqpksgpxdfwld.jpg"), 800)}
                    alt="Video production course" className="w-full aspect-[16/9] object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 ltr:left-5 rtl:right-5 ltr:right-5 rtl:left-5 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-white text-[0.75rem] font-medium bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <i className="fa-regular fa-clock" />
                      {t("Coming Soon", "قريباً", lang)}
                    </span>
                    <span className="text-[0.65rem] font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {t("Beginner", "مبتدئ", lang)}
                    </span>
                  </div>
                </div>
                <div className="p-[clamp(1.25rem,2.5vw,2rem)] flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy/10 dark:bg-white/10 flex items-center justify-center">
                      <i className="fa-solid fa-video text-navy dark:text-white/80" />
                    </div>
                    <h3 className="text-navy dark:text-white font-bold text-[clamp(1.2rem,2.5vw,1.5rem)] m-0">
                      {cms("first_course_heading") || t("Video Content Foundation Course", "دورة أساسيات إنتاج المحتوى المرئي", lang)}
                    </h3>
                  </div>
                  <p className={`text-navy/60 dark:text-white/50 text-[clamp(0.85rem,1.2vw,0.95rem)] leading-relaxed m-0 ${lang === 'ar' ? 'text-right' : ''}`}>
                    {cms("first_course_desc") || t("Learn professional video production through hands-on practice inside Setup Studio with real lighting, audio, and shooting setups.", "تعلم إنتاج الفيديو الاحترافي من خلال التطبيق العملي داخل سيت أب ستوديو بإضاءة حقيقية وصوت وإعدادات تصوير احترافية.", lang)}
                  </p>
                  <div className="bg-[#f8f9fb] dark:bg-[#15202b] rounded-xl p-[clamp(1rem,1.5vw,1.25rem)]">
                    <h4 className="text-navy dark:text-white font-semibold text-[clamp(0.85rem,1.2vw,0.95rem)] mb-2.5 flex items-center gap-2">
                      <i className="fa-solid fa-list-check text-red text-[0.75rem]" />
                      {t("Course Focus", "محاور الدورة", lang)}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                      {focusItems.map((item, i) => (
                        <span key={i} className="text-navy/60 dark:text-white/50 text-[clamp(0.75rem,1vw,0.85rem)] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red shrink-0" />
                          {t(item.en, item.ar, lang)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/50 dark:border-[#1e2d3d]/50">
                    <span className="text-muted dark:text-white/40 text-[0.75rem] flex items-center gap-1.5">
                      <i className="fa-regular fa-clock text-navy/40 dark:text-white/40" />
                      {t("Limited spots available", "أماكن محدودة متاحة", lang)}
                    </span>
                    <a href={`https://wa.me/201012846764?text=${encodeURIComponent("Hi setupstudio! I want to join the Setup Academy waiting list.")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-navy dark:text-white/80 font-semibold text-[0.85rem] hover:text-red dark:hover:text-red transition-colors duration-200 flex items-center gap-2 no-underline"
                    >
                      {cms("cta_button") || t("Join the Waiting List", "انضم لقائمة الانتظار", lang)}
                      <i className="fa-solid fa-arrow-right text-[0.7rem] group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1 transition-transform duration-200" />
                    </a>
                  </div>
                </div>
              </a>
            </Reveal>

            <Reveal delay={0.15} className="h-full">
              <div className="rounded-[clamp(1.5rem,3vw,3rem)] border border-border dark:border-[#1e2d3d] bg-white dark:bg-[#0f1a24] overflow-hidden h-full flex flex-col">
                <div className="relative">
                  <img src={optimizeImageUrl(cmsPhoto("instructor", "https://res.cloudinary.com/yscxguwn/image/upload/v1783214750/setup-studio/locations/podcast/nazipuzb6ndg6pvzfam7.jpg"), 800)}
                    alt="Instructor" className="w-full aspect-[16/7] object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 ltr:left-5 rtl:right-5">
                    <span className="text-white/70 text-[0.65rem] font-medium uppercase tracking-wider bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      {t("Learn From Market Experience", "تعلم من خبراء السوق", lang)}
                    </span>
                  </div>
                </div>
                <div className="p-[clamp(1.25rem,2.5vw,2rem)] flex flex-col gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-5 h-[2px] bg-red rounded-full" />
                      <span className="text-[clamp(0.7rem,1vw,0.8rem)] font-semibold uppercase tracking-wider text-red/70">{cms("instructor_label") || t("Instructor", "المدرب", lang)}</span>
                      <span className="block w-[clamp(1.5rem,12vw,16rem)] h-[2px] bg-red" />
                      <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                        <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                      </svg>
                    </div>
                    <h3 className="text-navy dark:text-white font-bold text-[clamp(1.35rem,2.8vw,1.65rem)] m-0 leading-tight">
                      {cms("instructor_heading") || t("Meet Your Instructor", "تعرف على مدربك", lang)}
                    </h3>
                  </div>
                  <p className={`text-navy/60 dark:text-white/50 text-[clamp(0.85rem,1.2vw,0.95rem)] leading-relaxed m-0 ${lang === 'ar' ? 'text-right' : ''}`}>
                    {cms("instructor_body") || t("Our instructors are selected for their practical experience and ability to turn real production knowledge into clear learning steps.", "يتم اختيار مدربينا بناءً على خبرتهم العملية وقدرتهم على تحويل المعرفة الإنتاجية إلى خطوات تعليمية واضحة.", lang)}
                  </p>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f8f9fb] dark:bg-[#15202b] border border-dashed border-navy/10 dark:border-white/10">
                    <div className="w-10 h-10 rounded-full bg-navy/5 dark:bg-white/10 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-user-tie text-navy/30 dark:text-white/30 text-lg" />
                    </div>
                    <p className={`text-navy/45 dark:text-white/40 text-[clamp(0.7rem,0.9vw,0.8rem)] m-0 leading-relaxed ${lang === 'ar' ? 'text-right' : ''}`}>
                      {cms("instructor_info") || t("Full instructor details will be announced before the course launch.", "سيتم الإعلان عن تفاصيل المدرب قبل إطلاق الدورة.", lang)}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="mt-[clamp(3rem,6vw,5rem)]">
            <div className="flex items-center justify-center w-full mb-[clamp(2rem,4vw,4rem)]">
              <div className="flex items-center min-w-0 shrink">
                <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                  <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                </svg>
                <span className="block w-[clamp(1.5rem,8vw,10rem)] h-[2px] bg-red" />
              </div>
              <h2 className="text-white font-bold text-[clamp(1.5rem,4vw,2.5rem)] leading-tight mx-[clamp(0.75rem,2vw,1.5rem)] whitespace-nowrap">
                {cms("expectations_heading") || t("What Students Can Expect", "ماذا يمكن أن يتوقع الطلاب", lang)}
              </h2>
              <div className="flex items-center min-w-0 shrink">
                <span className="block w-[clamp(1.5rem,8vw,10rem)] h-[2px] bg-red" />
                <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
                  <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[clamp(0.75rem,1.5vw,1.25rem)]">
              {expectations.map((item, i) => (
                <Reveal key={i} delay={i * 0.05}>
                  <div className="flex flex-col items-center text-center gap-3 p-[clamp(1.25rem,2vw,1.75rem)] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 h-full hover:-translate-y-0.5">
                    <div className="w-[clamp(2.5rem,3.5vw,3.5rem)] h-[clamp(2.5rem,3.5vw,3.5rem)] rounded-full bg-red/20 flex items-center justify-center">
                      <i className={`${item.icon} text-red text-[clamp(1rem,1.5vw,1.35rem)]`} />
                    </div>
                    <p className={`text-white/70 text-[clamp(0.8rem,1.1vw,0.9rem)] leading-relaxed m-0 font-medium ${lang === 'ar' ? 'text-right' : ''}`}>
                      {t(item.textEn, item.textAr, lang)}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-white dark:bg-[#0A1216] py-[clamp(2rem,5vw,5rem)] overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <div className="flex flex-col items-center text-center mb-[clamp(2rem,4vw,4rem)]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-[2px] bg-red rounded-full" />
              <span className="text-[clamp(0.7rem,1vw,0.8rem)] font-semibold uppercase tracking-wider text-red/70">{cms("production_label") || t("Full Production", "إنتاج كامل", lang)}</span>
              <span className="w-5 h-[2px] bg-red rounded-full" />
            </div>
            <div className="flex items-center justify-center w-full mb-3">
              <div className="flex items-center min-w-0 shrink">
                <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor"><polygon points="6.5,0 13,6.5 6.5,13 0,6.5" /></svg>
                <span className="block w-[clamp(1.5rem,8vw,10rem)] h-[2px] bg-red" />
              </div>
              <h2 className="text-navy dark:text-white font-bold text-[clamp(1.5rem,4vw,2.5rem)] leading-tight mx-[clamp(0.75rem,2vw,1.5rem)] whitespace-nowrap">
                {cms("production_heading") || t("Beyond Just Shooting", "أبعد من مجرد التصوير", lang)}
              </h2>
              <div className="flex items-center min-w-0 shrink">
                <span className="block w-[clamp(1.5rem,8vw,10rem)] h-[2px] bg-red" />
                <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor"><polygon points="6.5,0 13,6.5 6.5,13 0,6.5" /></svg>
              </div>
            </div>
            <p className="text-navy/60 dark:text-white/50 text-[clamp(0.9rem,1.3vw,1rem)] max-w-[600px] mx-auto leading-relaxed">
              {cms("production_intro") || t("We teach the complete production journey — from concept to final delivery.", "نعلم رحلة الإنتاج الكاملة - من الفكرة إلى التسليم النهائي.", lang)}
            </p>
          </div>
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-[clamp(2rem,4vw,4rem)] items-center ${lang === 'ar' ? '[&>*:first-child]:lg:order-2 [&>*:last-child]:lg:order-1' : ''}`}>
            <Reveal>
              <div className="relative">
                <div className="rounded-[clamp(1.25rem,2.5vw,2.5rem)] overflow-hidden shadow-[0_8px_32px_rgba(48,93,116,0.12)]">
                  <img src={optimizeImageUrl(cmsPhoto("production", "https://res.cloudinary.com/yscxguwn/image/upload/v1783214897/setup-studio/locations/reels/lfe2rvpyltmegs7viffh.jpg"), 800)} alt="Full production setup" className="w-full aspect-[4/3] object-cover" />
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <p className={`text-navy/60 dark:text-white/50 text-[clamp(0.9rem,1.3vw,1rem)] leading-relaxed mb-5 ${lang === 'ar' ? 'text-right' : ''}`}>
                {cms("production_body") || t("Setup Academy teaches the complete production workflow — not just shooting, but every step professional creators use to deliver high-quality content.", "أكاديمية سيت أب تعلم سير العمل الإنتاجي الكامل — ليس التصوير فقط، بل كل خطوة يستخدمها المبدعون المحترفون لتقديم محتوى عالي الجودة.", lang)}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(cmsData?.production_stages || [
                  { icon: "fa-solid fa-pen-clip", titleEn: "Pre-Production", titleAr: "ما قبل الإنتاج", descEn: "Planning, scripting, storyboarding, and crew coordination", descAr: "التخطيط والكتابة والتصوير القصصي وتنسيق الفريق" },
                  { icon: "fa-solid fa-video", titleEn: "Production", titleAr: "الإنتاج", descEn: "Shooting, lighting, audio capture, and directing", descAr: "التصوير والإضاءة والتسجيل الصوتي والإخراج" },
                  { icon: "fa-solid fa-scissors", titleEn: "Post-Production", titleAr: "ما بعد الإنتاج", descEn: "Editing, color grading, sound design, and motion graphics", descAr: "المونتاج وتصحيح الألوان وتصميم الصوت والرسوم المتحركة" },
                  { icon: "fa-solid fa-bullhorn", titleEn: "Marketing & Delivery", titleAr: "التسويق والتسليم", descEn: "Content packaging, distribution strategy, and audience growth", descAr: "تغليف المحتوى واستراتيجية التوزيع وتنمية الجمهور" },
                ]).map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-border dark:border-[#1e2d3d] bg-white dark:bg-[#0f1a24] hover:shadow-[0_4px_16px_rgba(48,93,116,0.06)] transition-all duration-200">
                    <div className="w-9 h-9 rounded-lg bg-navy/10 dark:bg-white/10 flex items-center justify-center shrink-0">
                      <i className={`${item.icon} text-navy dark:text-white/80 text-[0.9rem]`} />
                    </div>
                    <div>
                      <h4 className="text-navy dark:text-white font-semibold text-[0.85rem] m-0">{t(item.titleEn, item.titleAr, lang)}</h4>
                      <p className="text-navy/50 dark:text-white/40 text-[0.75rem] leading-relaxed m-0 mt-0.5">{t(item.descEn, item.descAr, lang)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="w-full bg-[#0A1216] py-[clamp(2rem,5vw,5rem)] overflow-hidden relative">
        <div className="absolute -top-[clamp(8rem,15vw,12rem)] ltr:-right-[clamp(4rem,8vw,6rem)] rtl:-left-[clamp(4rem,8vw,6rem)] w-[clamp(16rem,40vw,30rem)] h-[clamp(16rem,40vw,30rem)] rounded-full bg-[#11AFFF] opacity-[0.18] blur-[clamp(4rem,8vw,6rem)] pointer-events-none" />
        <div className="absolute -bottom-[clamp(6rem,12vw,10rem)] ltr:-left-[clamp(2rem,4vw,4rem)] rtl:-right-[clamp(2rem,4vw,4rem)] w-[clamp(12rem,30vw,22rem)] h-[clamp(12rem,30vw,22rem)] rounded-full bg-[#11AFFF] opacity-[0.12] blur-[clamp(4rem,8vw,6rem)] pointer-events-none" />
        <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)] relative z-10">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-[clamp(2rem,4vw,4rem)] items-center ${lang === 'ar' ? '[&>*:first-child]:lg:order-2 [&>*:last-child]:lg:order-1' : ''}`}>
            <Reveal>
              <div className="relative">
                <div className="rounded-[clamp(1.25rem,2.5vw,2.5rem)] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                  <img src={optimizeImageUrl(cmsPhoto("beyond", "https://res.cloudinary.com/yscxguwn/image/upload/v1783214898/setup-studio/locations/reels/jigcuog93qjqliqk8ucv.jpg"), 800)} alt="Creative community" className="w-full aspect-[4/3] object-cover" />
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <span className="section-label !text-red/80">{cms("beyond_label") || t("Beyond the Course", "ما بعد الدورة", lang)}</span>
              <div className="flex items-center justify-center w-full mb-4">
                <div className="flex items-center min-w-0 shrink">
                  <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor"><polygon points="6.5,0 13,6.5 6.5,13 0,6.5" /></svg>
                  <span className="block w-[clamp(1.5rem,8vw,10rem)] h-[2px] bg-red" />
                </div>
                <h2 className="text-white font-bold text-[clamp(1.5rem,4vw,2.5rem)] leading-tight mx-[clamp(0.75rem,2vw,1.5rem)] whitespace-nowrap">
                  {cms("beyond_heading") || t("More Than Just a Course", "أكثر من مجرد دورة", lang)}
                </h2>
                <div className="flex items-center min-w-0 shrink">
                  <span className="block w-[clamp(1.5rem,8vw,10rem)] h-[2px] bg-red" />
                  <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor"><polygon points="6.5,0 13,6.5 6.5,13 0,6.5" /></svg>
                </div>
              </div>
              <p className={`text-white/60 text-[clamp(0.9rem,1.3vw,1rem)] leading-relaxed ${lang === 'ar' ? 'text-right' : ''}`}>
                {cms("beyond_body") || t("Setup Academy is about helping learners take their first serious steps into the creative field.", "أكاديمية سيت أب تدور حول مساعدة المتعلمين على اتخاذ خطواتهم الجادة الأولى في المجال الإبداعي.", lang)}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="w-full bg-white dark:bg-[#0A1216] py-[clamp(2rem,5vw,5rem)] overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <div className="flex flex-col items-center text-center mb-[clamp(2rem,4vw,4rem)]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-[2px] bg-red rounded-full" />
              <span className="text-[clamp(0.7rem,1vw,0.8rem)] font-semibold uppercase tracking-wider text-red/70">{cms("upcoming_label") || t("Coming Soon", "قريباً", lang)}</span>
              <span className="w-5 h-[2px] bg-red rounded-full" />
            </div>
            <div className="flex items-center justify-center w-full mb-3">
              <div className="flex items-center min-w-0 shrink">
                <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor"><polygon points="6.5,0 13,6.5 6.5,13 0,6.5" /></svg>
                <span className="block w-[clamp(1.5rem,8vw,10rem)] h-[2px] bg-red" />
              </div>
              <h2 className="text-navy dark:text-white font-bold text-[clamp(1.5rem,4vw,2.5rem)] leading-tight mx-[clamp(0.75rem,2vw,1.5rem)] whitespace-nowrap">
                {cms("upcoming_heading") || t("Upcoming Courses", "الدورات القادمة", lang)}
              </h2>
              <div className="flex items-center min-w-0 shrink">
                <span className="block w-[clamp(1.5rem,8vw,10rem)] h-[2px] bg-red" />
                <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor"><polygon points="6.5,0 13,6.5 6.5,13 0,6.5" /></svg>
              </div>
            </div>
            <p className="text-navy/60 dark:text-white/50 text-[clamp(0.9rem,1.3vw,1rem)] max-w-[600px] mx-auto leading-relaxed">
              {cms("upcoming_intro") || t("We're building a full catalog of practical courses and workshops.", "نحن نبني كتالوجاً كاملاً من الدورات العملية وورش العمل.", lang)}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[clamp(0.75rem,1.5vw,1.25rem)]">
            {upcomingCourses.map((course, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="group p-[clamp(1.25rem,2vw,1.5rem)] rounded-2xl border border-border dark:border-[#1e2d3d] bg-white dark:bg-[#0f1a24] hover:shadow-[0_8px_32px_rgba(48,93,116,0.1)] hover:border-navy/20 dark:hover:border-white/20 transition-all duration-300 h-full hover:-translate-y-0.5">
                  <div className="w-10 h-10 rounded-full bg-navy/10 dark:bg-white/10 flex items-center justify-center mb-3 group-hover:bg-navy dark:group-hover:bg-white/20 transition-colors duration-300">
                    <i className={`${course.icon} text-navy dark:text-white/80 text-[1rem] group-hover:text-white dark:group-hover:text-white transition-colors duration-300`} />
                  </div>
                  <h3 className="text-navy dark:text-white font-bold text-[clamp(0.85rem,1.2vw,1rem)] m-0 mb-1.5">
                    {t(course.titleEn, course.titleAr, lang)}
                  </h3>
                  <p className={`text-navy/50 dark:text-white/40 text-[clamp(0.75rem,1vw,0.85rem)] leading-relaxed m-0 ${lang === 'ar' ? 'text-right' : ''}`}>
                    {t(course.descEn, course.descAr, lang)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-[#f8f9fb] dark:bg-[#15202b] py-[clamp(2rem,5vw,5rem)] overflow-hidden">
        <div className="max-w-[800px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <div className="flex items-center justify-center w-full mb-[clamp(2rem,4vw,4rem)]">
            <div className="flex items-center min-w-0 shrink">
              <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor"><polygon points="6.5,0 13,6.5 6.5,13 0,6.5" /></svg>
              <span className="block w-[clamp(1.5rem,8vw,10rem)] h-[2px] bg-red" />
            </div>
            <h2 className="text-navy dark:text-white font-bold text-[clamp(1.5rem,4vw,2.5rem)] leading-tight mx-[clamp(0.75rem,2vw,1.5rem)] whitespace-nowrap">
              {cms("faq_heading") || t("Frequently Asked Questions", "الأسئلة الشائعة", lang)}
            </h2>
            <div className="flex items-center min-w-0 shrink">
              <span className="block w-[clamp(1.5rem,8vw,10rem)] h-[2px] bg-red" />
              <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor"><polygon points="6.5,0 13,6.5 6.5,13 0,6.5" /></svg>
            </div>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={i * 0.04}>
                <div className={`rounded-2xl border cursor-pointer transition-all duration-300 ${openFaq === i ? "border-navy bg-white dark:bg-[#0f1a24] dark:border-white/30 shadow-[0_4px_20px_rgba(48,93,116,0.08)]" : "border-border dark:border-[#1e2d3d] bg-white dark:bg-[#0f1a24] hover:border-navy/20 dark:hover:border-white/20 hover:shadow-sm"}`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="flex items-center justify-between px-[clamp(1rem,2vw,1.5rem)] py-[clamp(0.85rem,1.5vw,1.15rem)]">
                    <h3 className="text-navy dark:text-white font-semibold text-[clamp(0.85rem,1.2vw,0.95rem)] m-0 ltr:pr-4 rtl:pl-4 leading-snug">
                      {t(faq.qEn, faq.qAr, lang)}
                    </h3>
                    <span className={`shrink-0 w-7 h-7 rounded-full bg-navy/5 dark:bg-white/10 flex items-center justify-center text-navy/50 dark:text-white/50 text-sm transition-all duration-300 ${openFaq === i ? "rotate-45 bg-red/10 text-red" : ""}`}>
                      <i className="fa-solid fa-plus" />
                    </span>
                  </div>
                  <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"}`}>
                    <p className="text-navy/60 dark:text-white/60 text-[clamp(0.8rem,1.1vw,0.9rem)] leading-relaxed m-0 px-[clamp(1rem,2vw,1.5rem)] pb-[clamp(0.85rem,1.5vw,1.15rem)]">
                      {t(faq.aEn, faq.aAr, lang)}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full py-[clamp(2rem,5vw,4rem)] px-[clamp(1rem,4vw,3rem)] bg-white dark:bg-[#0A1216]">
        <div className="max-w-[1280px] mx-auto">
          <Reveal>
            <div className="relative overflow-hidden rounded-[clamp(1.25rem,2.5vw,2.5rem)] bg-[#0A1216] min-h-[clamp(10rem,16vw,16rem)] flex items-center">
              <div className="absolute -top-[clamp(8rem,15vw,12rem)] ltr:-right-[clamp(4rem,8vw,6rem)] rtl:-left-[clamp(4rem,8vw,6rem)] w-[clamp(16rem,40vw,30rem)] h-[clamp(16rem,40vw,30rem)] rounded-full bg-[#11AFFF] opacity-[0.35] blur-[clamp(3rem,6vw,4rem)] pointer-events-none" />
              <div className="absolute -bottom-[clamp(6rem,12vw,10rem)] ltr:-left-[clamp(2rem,4vw,4rem)] rtl:-right-[clamp(2rem,4vw,4rem)] w-[clamp(12rem,30vw,22rem)] h-[clamp(12rem,30vw,22rem)] rounded-full bg-[#11AFFF] opacity-[0.30] blur-[clamp(3rem,6vw,4rem)] pointer-events-none" />
              <div className="absolute top-[clamp(1rem,3vw,2rem)] ltr:left-[clamp(20%,35%,40%)] rtl:right-[clamp(20%,35%,40%)] w-[clamp(6rem,15vw,12rem)] h-[clamp(6rem,15vw,12rem)] rounded-full bg-[#11AFFF] opacity-[0.20] blur-[clamp(2rem,4vw,3rem)] pointer-events-none" />
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
                  <a href="/#contact" className="inline-flex items-center gap-2 bg-white text-[#0A1216] font-semibold text-[clamp(0.85rem,1.2vw,1rem)] px-[clamp(1.25rem,2.5vw,2rem)] py-[clamp(0.6rem,1.2vw,1rem)] rounded-full hover:bg-white/90 transition-all duration-300 shadow-lg">
                    {t("Get Quote", "احصل على عرض", lang)}
                  </a>
                  <Link to="/locations" className="inline-flex items-center gap-2 border-2 border-white text-white font-semibold text-[clamp(0.85rem,1.2vw,1rem)] px-[clamp(1.25rem,2.5vw,2rem)] py-[clamp(0.6rem,1.2vw,1rem)] rounded-full hover:bg-white/10 transition-all duration-300">
                    {t("View Studios", "شاهد الاستوديوهات", lang)}
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
    </>
  )
}

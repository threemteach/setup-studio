import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from '../context/LanguageContext'

const WHATSAPP_NUMBER = '201012846764'
const WHATSAPP_MSG = encodeURIComponent("Hi setupstudio! I have an inquiry.")

function WhatsAppLink({ children, className, onClick, ariaLabel }) {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={onClick}
      aria-label={ariaLabel || 'Chat on WhatsApp'}
    >
      {children}
    </a>
  )
}

function WhatsAppIcon({ size = 28 }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function PulseRings() {
  return (
    <span className="absolute inset-0 flex items-center justify-center">
      <span className="absolute w-full h-full rounded-full bg-[#25D366]/20 animate-ping" style={{ animationDuration: '2.5s' }} />
      <span className="absolute w-[130%] h-[130%] rounded-full bg-[#25D366]/10 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.6s' }} />
      <span className="absolute w-[160%] h-[160%] rounded-full bg-[#25D366]/5 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1.2s' }} />
    </span>
  )
}

function DesktopButton({ lang, showLabel }) {
  return (
    <div className="hidden md:block fixed bottom-6 ltr:left-6 rtl:right-6 z-50">
      <WhatsAppLink
        className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer border-none transition-all duration-300 hover:scale-110 hover:shadow-xl group"
        ariaLabel="Chat on WhatsApp"
      >
        <PulseRings />
        <div
          className="relative w-full h-full rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #25D366, #128C7E)',
            color: '#fff',
            fontSize: 28,
          }}
        >
          <WhatsAppIcon size={28} />
        </div>
      </WhatsAppLink>

      <div
        className={`absolute ltr:left-16 rtl:right-16 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-500 ${
          showLabel
            ? 'opacity-100 ltr:translate-x-0 rtl:translate-x-0'
            : 'opacity-0 ltr:-translate-x-2 rtl:translate-x-2'
        }`}
      >
        <div className="flex items-center gap-2 bg-white text-[#075E54] text-xs font-semibold px-4 py-2 rounded-xl shadow-lg whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
          {lang === 'en' ? 'Chat with us' : 'تواصل معنا'}
          <div
            className="absolute ltr:left-[-6px] rtl:right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-white"
            style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
          />
        </div>
      </div>
    </div>
  )
}

function MobileBar({ scrolled, onDismiss, lang }) {
  return (
    <div
      className={`md:hidden fixed bottom-0 ltr:left-0 rtl:right-0 ltr:right-0 rtl:left-0 z-50 px-4 pb-4 pt-2 transition-all duration-500 ${
        scrolled ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{
        background: 'linear-gradient(to top, rgba(0,0,0,0.15), transparent)',
        pointerEvents: scrolled ? 'auto' : 'none',
      }}
    >
      <div
        className="relative flex items-center justify-between px-5 py-3.5 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
          color: '#fff',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.4), transparent 60%)',
          }}
        />

        <WhatsAppLink
          className="relative flex items-center gap-3 flex-1 no-underline"
          style={{ color: '#fff' }}
          ariaLabel={lang === 'en' ? 'Chat with us' : 'تواصل معنا'}
        >
          <span className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/15">
            <WhatsAppIcon size={20} />
            <span className="absolute -top-0.5 ltr:-right-0.5 rtl:-left-0.5 w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span className="absolute -top-0.5 ltr:-right-0.5 rtl:-left-0.5 w-2.5 h-2.5 rounded-full bg-white" />
          </span>

          <span className="flex items-center gap-1 text-sm font-semibold">
            {lang === 'en' ? 'Chat with us' : 'تواصل معنا'}
            <span className="inline-flex items-center gap-0.5 ltr:ml-1 rtl:mr-1">
              <span className="w-1 h-1 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </span>
        </WhatsAppLink>

        <button
          onClick={onDismiss}
          className="relative bg-transparent border-none cursor-pointer p-1.5 rounded-full hover:bg-white/10 transition-colors shrink-0"
          style={{ color: '#fff' }}
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

function MobileButton() {
  return (
    <div className="md:hidden fixed bottom-6 ltr:left-6 rtl:right-6 z-50">
      <WhatsAppLink
        className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer border-none"
        ariaLabel="Chat on WhatsApp"
      >
        <PulseRings />
        <div
          className="relative w-full h-full rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #25D366, #128C7E)',
            color: '#fff',
            fontSize: 28,
          }}
        >
          <WhatsAppIcon size={28} />
        </div>
      </WhatsAppLink>
    </div>
  )
}

export default function WhatsAppButton() {
  const { lang } = useTranslation()
  const [dismissed, setDismissed] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [desktopLabel, setDesktopLabel] = useState(false)

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY
      setScrolled(y > 300)
      setDesktopLabel(y > 500)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <DesktopButton lang={lang} showLabel={desktopLabel} />
      {dismissed ? (
        <MobileButton />
      ) : (
        <MobileBar scrolled={scrolled} onDismiss={() => setDismissed(true)} lang={lang} />
      )}
    </>
  )
}

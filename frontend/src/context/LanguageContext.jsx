import { createContext, useContext, useState, useEffect, useCallback } from "react"

const COOKIE_NAME = "setup_lang"

function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name, value) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=31536000;SameSite=Lax`
}

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => getCookie(COOKIE_NAME) || "en")

  useEffect(() => {
    document.documentElement.lang = lang
    setCookie(COOKIE_NAME, lang)
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(LanguageContext)
  if (!ctx) return { lang: "en", setLang: () => {} }
  return ctx
}

export default LanguageContext

import { createContext, useContext, useState, useEffect } from "react"

const COOKIE_NAME = "setup_theme"

function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name, value) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=31536000;SameSite=Lax`
}

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const saved = getCookie(COOKIE_NAME)
    if (saved) return saved === "dark"
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
  })

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    setCookie(COOKIE_NAME, dark ? "dark" : "light")
  }, [dark])

  const toggle = () => setDark((prev) => !prev)

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) return { dark: false, toggle: () => {} }
  return ctx
}

export default ThemeContext

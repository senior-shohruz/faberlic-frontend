import { createContext, useContext, useState, useCallback } from 'react'
import uz from '../i18n/uz'
import ru from '../i18n/ru'
import en from '../i18n/en'

const LANGS = { uz, ru, en }
const SUPPORTED = ['uz', 'ru', 'en']

function detectLang() {
  const saved = localStorage.getItem('fab_lang')
  if (saved && SUPPORTED.includes(saved)) return saved
  const browser = navigator.language?.slice(0, 2).toLowerCase()
  if (browser === 'ru') return 'ru'
  if (browser === 'en') return 'en'
  return 'uz'
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

const LangCtx = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectLang)

  const setLang = useCallback((code) => {
    if (!SUPPORTED.includes(code)) return
    setLangState(code)
    localStorage.setItem('fab_lang', code)
    document.documentElement.lang = code === 'uz' ? 'uz' : code === 'ru' ? 'ru' : 'en'
  }, [])

  const t = useCallback((key, vars) => {
    const translations = LANGS[lang] || LANGS.uz
    const value = getNestedValue(translations, key)
    if (value === undefined) {
      const fallback = getNestedValue(LANGS.uz, key)
      return fallback ?? key
    }
    if (typeof value === 'string' && vars) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`)
    }
    return value
  }, [lang])

  return (
    <LangCtx.Provider value={{ lang, setLang, t, langs: SUPPORTED }}>
      {children}
    </LangCtx.Provider>
  )
}

export const useLang = () => useContext(LangCtx)

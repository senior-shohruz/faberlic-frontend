import { useState, useRef, useEffect } from 'react'
import { useLang } from '../context/LanguageContext'

const FLAGS = {
  uz: (
    <svg width="20" height="14" viewBox="0 0 60 40" style={{ flexShrink: 0, borderRadius: 2 }}>
      <rect width="60" height="40" fill="#1EB3E4"/>
      <rect y="13" width="60" height="14" fill="#fff"/>
      <rect y="27" width="60" height="13" fill="#34A853"/>
      <rect y="12" width="60" height="1.5" fill="#E63946"/>
      <rect y="26.5" width="60" height="1.5" fill="#E63946"/>
      <circle cx="14" cy="7" r="4" fill="#fff"/>
      <circle cx="16" cy="7" r="4" fill="#1EB3E4"/>
      {[0,1,2,3,4,6,7,8,9,10,11].map((i) => (
        <circle key={i} cx={9 + (i % 6) * 3.5} cy={i < 6 ? 4.5 : 9} r="0.9" fill="#fff"/>
      ))}
    </svg>
  ),
  ru: (
    <svg width="20" height="14" viewBox="0 0 60 40" style={{ flexShrink: 0, borderRadius: 2 }}>
      <rect width="60" height="14" fill="#fff"/>
      <rect y="13" width="60" height="14" fill="#1C3FA0"/>
      <rect y="27" width="60" height="13" fill="#E63946"/>
    </svg>
  ),
  en: (
    <svg width="20" height="14" viewBox="0 0 60 40" style={{ flexShrink: 0, borderRadius: 2 }}>
      <rect width="60" height="40" fill="#012169"/>
      <path d="M0 0 L60 40 M60 0 L0 40" stroke="#fff" strokeWidth="8"/>
      <path d="M0 0 L60 40 M60 0 L0 40" stroke="#C8102E" strokeWidth="5"/>
      <path d="M30 0 V40 M0 20 H60" stroke="#fff" strokeWidth="13"/>
      <path d="M30 0 V40 M0 20 H60" stroke="#C8102E" strokeWidth="8"/>
    </svg>
  ),
}

const LABELS = { uz: "O'Z", ru: "РУ", en: "EN" }
const NAMES  = { uz: "O'zbekcha", ru: "Русский", en: "English" }

export default function LanguageSwitcher({ mobile = false }) {
  const { lang, setLang } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function select(code) {
    setLang(code)
    setOpen(false)
  }

  if (mobile) {
    return (
      <div className="ls-mobile" ref={ref}>
        {['uz', 'ru', 'en'].map(code => (
          <button
            key={code}
            className={`ls-mobile-btn ${lang === code ? 'active' : ''}`}
            onClick={() => select(code)}
          >
            {FLAGS[code]}
            <span>{LABELS[code]}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="ls-wrap" ref={ref}>
      <button
        className={`ls-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Change language"
      >
        {FLAGS[lang]}
        <span className="ls-label">{LABELS[lang]}</span>
        <svg
          className="ls-chevron"
          width="10" height="10" fill="none"
          stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div className="ls-dropdown">
          <div className="ls-dropdown-inner">
            {['uz', 'ru', 'en'].map((code, i) => (
              <button
                key={code}
                className={`ls-option ${lang === code ? 'active' : ''}`}
                onClick={() => select(code)}
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <span className="ls-option-flag">{FLAGS[code]}</span>
                <div className="ls-option-text">
                  <span className="ls-option-name">{NAMES[code]}</span>
                  <span className="ls-option-code">{LABELS[code]}</span>
                </div>
                {lang === code && (
                  <svg width="14" height="14" fill="none" stroke="#e63946" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

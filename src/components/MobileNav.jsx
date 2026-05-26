import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'

const LANG_CYCLE = { uz: 'ru', ru: 'en', en: 'uz' }
const LANG_FLAG = {
  uz: '🇺🇿',
  ru: '🇷🇺',
  en: '🇬🇧',
}

export default function MobileNav({ onOpenSearch, onOpenAuth, onOpenFace }) {
  const { count, setOpen: openCart } = useCart()
  const { user } = useAuth()
  const { t, lang, setLang } = useLang()

  function handleProfile() {
    if (!user) onOpenAuth?.()
  }

  function cycleLang() {
    setLang(LANG_CYCLE[lang] || 'uz')
  }

  return (
    <nav className="mob-nav">
      <a href="/" className="mob-nav-item">
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>{t('mobile.home')}</span>
      </a>

      <button className="mob-nav-item" onClick={onOpenSearch}>
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <span>{t('mobile.search')}</span>
      </button>

      {onOpenFace && (
        <button className="mob-nav-item mob-nav-ai" onClick={onOpenFace}>
          <span className="mob-nav-ai-pulse" />
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="9" cy="10" r="0.9" fill="currentColor"/>
            <circle cx="15" cy="10" r="0.9" fill="currentColor"/>
            <path d="M9 15c1 1 2 1.5 3 1.5s2-0.5 3-1.5" strokeLinecap="round"/>
          </svg>
          <span>AI Scan</span>
        </button>
      )}

      <button className="mob-nav-item mob-nav-cart" onClick={() => openCart(true)}>
        <div className="mob-nav-cart-wrap">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          {count > 0 && <span className="mob-nav-badge">{count > 9 ? '9+' : count}</span>}
        </div>
        <span>{t('mobile.cart')}</span>
      </button>

      <button className="mob-nav-item" onClick={handleProfile}>
        {user ? (
          <div className="mob-nav-avatar">{user.name[0].toUpperCase()}</div>
        ) : (
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        )}
        <span>{user ? user.name.split(' ')[0] : t('mobile.profile')}</span>
      </button>

      <button className="mob-nav-item mob-nav-lang" onClick={cycleLang}>
        <span className="mob-nav-flag">{LANG_FLAG[lang]}</span>
        <span>{lang.toUpperCase()}</span>
      </button>
    </nav>
  )
}

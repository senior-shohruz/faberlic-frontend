import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useTheme } from '../context/ThemeContext'
import { useLang } from '../context/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'
import MyOrders from './MyOrders'

export default function Header({ onOpenAuth, onOpenCart, onOpenSearch }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [ordersOpen, setOrdersOpen] = useState(false)
  const { user, logout } = useAuth()
  const { count } = useCart()
  const { dark, toggle } = useTheme()
  const { t } = useLang()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenSearch()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onOpenSearch])

  function handleLogout() { logout(); setDropOpen(false) }

  return (
    <>
    <div className={`header-wrap ${scrolled ? 'scrolled' : ''}`}>
      <header className="header">
        <a href="/" className="logo">
          <span className="logo-icon">F</span>
          <span className="logo-text">aberlic</span>
          <span className="logo-dot">.</span>
        </a>

        <nav className={`nav ${menuOpen ? 'open' : ''}`}>
          <a href="/" className="nav-link" onClick={() => setMenuOpen(false)}>{t('nav.home')}</a>
          <a href="#products" className="nav-link" onClick={() => setMenuOpen(false)}>{t('nav.products')}</a>
          <a href="#footer" className="nav-link" onClick={() => setMenuOpen(false)}>{t('nav.contact')}</a>
        </nav>

        <button className="header-search-btn" onClick={onOpenSearch}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <span>{t('nav.search')}</span>
          <span className="search-kbd">⌘K</span>
        </button>

        <div className="header-actions">
          <LanguageSwitcher />

          <button className="theme-toggle" onClick={toggle} title={dark ? t('nav.lightMode') : t('nav.darkMode')}>
            {dark ? (
              <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            )}
          </button>

          {user ? (
            <div className="user-menu">
              <button className="user-avatar" onClick={() => setDropOpen(o => !o)}>
                <div className="user-avatar-circle">{user.name[0].toUpperCase()}</div>
                <span className="user-avatar-name">{user.name.split(' ')[0]}</span>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                  style={{ transition: 'transform 0.2s', transform: dropOpen ? 'rotate(180deg)' : 'none' }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {dropOpen && (
                <>
                  <div className="user-drop-backdrop" onClick={() => setDropOpen(false)} />
                  <div className="user-drop">
                    <div className="user-drop-info">
                      <div className="user-drop-avatar">{user.name[0].toUpperCase()}</div>
                      <div>
                        <p className="user-drop-name">{user.name}</p>
                        <p className="user-drop-email">{user.email}</p>
                      </div>
                    </div>
                    <button className="user-drop-admin" onClick={() => { setOrdersOpen(true); setDropOpen(false) }}>
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 01-8 0"/>
                      </svg>
                      {t('nav.myOrders')}
                    </button>
                    {user.role === 'admin' && (
                      <button className="user-drop-admin" onClick={() => { navigate('/admin'); setDropOpen(false) }}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                        </svg>
                        {t('nav.adminPanel')}
                      </button>
                    )}
                    <div className="user-drop-divider" />
                    <button className="user-drop-logout" onClick={handleLogout}>
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                      </svg>
                      {t('nav.logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button className="header-cta" onClick={onOpenAuth}>{t('nav.login')}</button>
          )}

          <button className="cart-btn" onClick={onOpenCart}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {count > 0 && <span className="cart-badge">{count > 9 ? '9+' : count}</span>}
          </button>

          <button className={`burger ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
        </div>
      </header>
    </div>
    {ordersOpen && <MyOrders onClose={() => setOrdersOpen(false)} />}
    </>
  )
}

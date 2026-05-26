import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LanguageContext'
import LanguageSwitcher from '../../components/LanguageSwitcher'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { login, user } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()

  if (user?.role === 'admin') return <Navigate to="/admin" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await login(email, password)
    setLoading(false)
    if (err) { setError(err); return }

    const u = JSON.parse(localStorage.getItem('fab_user') || '{}')
    if (u.role !== 'admin') {
      setError("Siz admin emassiz. Admin huquqi kerak.")
      return
    }
    navigate('/admin')
  }

  return (
    <div className="al-wrap">
      <div className="al-left">
        <div className="al-brand">
          <span className="al-brand-name">PREMIUM STORE</span>
        </div>
        <h1 className="al-tagline">
          {t('admin.login.tagline').split('\n').map((line, i) => (
            <span key={i}>{line}{i === 0 && <br />}</span>
          ))}
        </h1>
        <p className="al-sub">{t('admin.login.subtitle')}</p>

        <div className="al-features">
          <div className="al-feature"><span>📦</span> {t('admin.login.features')[0]}</div>
          <div className="al-feature"><span>👥</span> {t('admin.login.features')[1]}</div>
          <div className="al-feature"><span>🛒</span> {t('admin.login.features')[2]}</div>
        </div>
      </div>

      <div className="al-right">
        <div className="al-card">
          <div className="al-card-logo">
            <span className="al-brand-icon" style={{ width: 48, height: 48, fontSize: 11, letterSpacing: '1px', background: '#e63946', color: '#fff', borderRadius: 12 }}>PS</span>
          </div>
          <div style={{ position: 'absolute', top: 20, right: 20 }}>
            <LanguageSwitcher />
          </div>
          <h2 className="al-card-title">{t('admin.login.title')}</h2>
          <p className="al-card-sub">{t('admin.login.sub')}</p>

          <form className="al-form" onSubmit={handleSubmit}>
            <div className="al-field">
              <label>{t('admin.login.email')}</label>
              <div className="al-input-wrap">
                <svg width="16" height="16" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  type="email"
                  placeholder={t('admin.login.emailPlaceholder')}
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="al-field">
              <label>{t('admin.login.password')}</label>
              <div className="al-input-wrap">
                <svg width="16" height="16" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder={t('admin.login.passwordPlaceholder')}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  required
                />
                <button type="button" className="al-eye" onClick={() => setShowPass(s => !s)}>
                  {showPass
                    ? <svg width="16" height="16" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/></svg>
                    : <svg width="16" height="16" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {error && (
              <div className="al-error">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className="al-submit" disabled={loading}>
              {loading
                ? <span className="auth-spinner" />
                : <>
                    {t('admin.login.submit')}
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
              }
            </button>
          </form>

          <a href="/" className="al-back">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            {t('admin.login.back')}
          </a>
        </div>
      </div>
    </div>
  )
}

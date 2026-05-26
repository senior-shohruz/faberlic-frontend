import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'

export default function AuthModal({ onClose }) {
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { login, register } = useAuth()
  const { t } = useLang()

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); setError('') }

  function switchTab(tab) { setTab(tab); setError(''); setForm({ name: '', email: '', phone: '', password: '' }) }

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    const err = tab === 'login'
      ? await login(form.email, form.password)
      : await register(form.name, form.email, form.phone, form.password)
    setLoading(false)
    if (err) { setError(err); return }
    onClose()
  }

  return (
    <div className="auth-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose} aria-label={t('common.close')}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        <div className="auth-brand">
          <span className="logo-icon" style={{ width: 38, height: 38, fontSize: 14 }}>PS</span>
          <span className="auth-brand-name">Premium Store</span>
        </div>

        <h2 className="auth-heading">
          {tab === 'login' ? t('auth.welcome') : t('auth.createAccount')}
        </h2>
        <p className="auth-sub">
          {tab === 'login' ? t('auth.loginSub') : t('auth.registerSub')}
        </p>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>{t('auth.tabLogin')}</button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => switchTab('register')}>{t('auth.tabRegister')}</button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {tab === 'register' && (
            <>
              <div className="auth-field">
                <label>{t('auth.fullName')}</label>
                <input
                  type="text"
                  placeholder={t('auth.namePlaceholder')}
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="auth-field">
                <label>{t('auth.phone')}</label>
                <div className="phone-input-wrap">
                  <span className="phone-prefix">+998</span>
                  <input
                    type="tel"
                    placeholder={t('auth.phonePlaceholder')}
                    value={form.phone}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 9)
                      setField('phone', val)
                    }}
                    required
                  />
                </div>
              </div>
            </>
          )}
          <div className="auth-field">
            <label>{t('auth.email')}</label>
            <input
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={form.email}
              onChange={e => setField('email', e.target.value)}
              required
              autoFocus={tab === 'login'}
            />
          </div>
          <div className="auth-field">
            <label>{t('auth.password')}</label>
            <div className="auth-pass-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder={t('auth.passwordPlaceholder')}
                value={form.password}
                onChange={e => setField('password', e.target.value)}
                required
                minLength={6}
              />
              <button type="button" className="auth-eye" onClick={() => setShowPass(s => !s)}>
                {showPass
                  ? <svg width="16" height="16" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/></svg>
                  : <svg width="16" height="16" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-error">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              {error}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading
              ? <span className="auth-spinner" />
              : (tab === 'login' ? t('auth.submitLogin') : t('auth.submitRegister'))
            }
          </button>
        </form>

        <p className="auth-switch">
          {tab === 'login' ? (
            <>{t('auth.noAccount')} <button type="button" onClick={() => switchTab('register')}>{t('auth.registerLink')}</button></>
          ) : (
            <>{t('auth.hasAccount')} <button type="button" onClick={() => switchTab('login')}>{t('auth.loginLink')}</button></>
          )}
        </p>
      </div>
    </div>
  )
}

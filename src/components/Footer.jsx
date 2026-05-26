import { useState } from 'react'
import { useLang } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'

export default function Footer() {
  const { t } = useLang()
  const { addToast } = useToast()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  function handleSubscribe(e) {
    e.preventDefault()
    if (!email.includes('@')) { addToast('Email manzilni to\'g\'ri kiriting', 'error'); return }
    setSubscribed(true)
    setEmail('')
    addToast('✉️ Obuna muvaffaqiyatli amalga oshirildi!', 'success')
  }

  return (
    <footer className="footer" id="footer">
      <div className="footer-newsletter">
        <div className="footer-nl-inner">
          <div className="footer-nl-text">
            <h3>{t('footer.newsletter.title')}</h3>
            <p>{t('footer.newsletter.desc')}</p>
          </div>
          <form className="footer-nl-form" onSubmit={handleSubscribe}>
            {subscribed ? (
              <p className="footer-nl-success">✅ Obuna bo'ldingiz!</p>
            ) : (
              <>
                <input
                  type="email"
                  placeholder={t('footer.newsletter.placeholder')}
                  className="footer-nl-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <button type="submit" className="footer-nl-btn">{t('footer.newsletter.btn')}</button>
              </>
            )}
          </form>
        </div>
      </div>

      <div className="footer-inner">
        <div className="footer-brand">
          <a href="#" className="logo footer-logo">
            <span className="logo-icon">PS</span>
            <span className="logo-text">Premium Store</span>
          </a>
          <p className="footer-brand-desc">{t('footer.brandDesc')}</p>
          <div className="footer-socials">
            <a href="https://t.me/faberlic_uz" target="_blank" rel="noopener noreferrer" className="footer-social tg" aria-label="Telegram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>
            <a href="#" className="footer-social ig" aria-label="Instagram">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="#" className="footer-social fb" aria-label="Facebook">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="footer-links">
          <h4>{t('footer.pages.title')}</h4>
          <a href="/">{t('footer.pages.home')}</a>
          <a href="#products">{t('footer.pages.products')}</a>
          <a href="#categories">{t('footer.pages.categories')}</a>
          <a href="#footer">{t('footer.pages.contact')}</a>
        </div>

        <div className="footer-links">
          <h4>{t('footer.customers.title')}</h4>
          <a href="#">{t('footer.customers.order')}</a>
          <a href="#">{t('footer.customers.delivery')}</a>
          <a href="#">{t('footer.customers.returns')}</a>
          <a href="#">{t('footer.customers.guarantee')}</a>
          <a href="#">{t('footer.customers.faq')}</a>
        </div>

        <div className="footer-links">
          <h4>{t('footer.contact.title')}</h4>
          <a href="tel:+998901234567" className="footer-contact-link">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
            +998 90 123 45 67
          </a>
          <a href="mailto:info@faberlic.uz" className="footer-contact-link">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            info@faberlic.uz
          </a>
          <a href="https://t.me/faberlic_uz" target="_blank" rel="noopener noreferrer" className="footer-contact-link tg-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            {t('footer.contact.telegramSupport')}
          </a>
          <p className="footer-addr">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {t('footer.contact.address')}
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>{t('footer.copyright')}</p>
        <div className="footer-bottom-links">
          <a href="#">{t('footer.privacy')}</a>
          <a href="#">{t('footer.terms')}</a>
        </div>
      </div>
    </footer>
  )
}

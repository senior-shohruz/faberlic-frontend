import { useLang } from '../context/LanguageContext'

const TXT = {
  tag:  { uz: 'AI',         ru: 'AI',         en: 'AI' },
  text: { uz: 'Chat',       ru: 'Чат',        en: 'Chat' },
  aria: { uz: 'AI Chat',    ru: 'AI Чат',     en: 'AI Chat' },
}

export default function AiChatButton({ onClick }) {
  const { lang } = useLang()
  const tx = (k) => TXT[k][lang] || TXT[k].uz
  return (
    <button className="aic-float" onClick={onClick} aria-label={tx('aria')} title={tx('aria')}>
      <span className="aic-float-pulse" />
      <span className="aic-float-icon">
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          <circle cx="9" cy="11" r="0.9" fill="currentColor" />
          <circle cx="12" cy="11" r="0.9" fill="currentColor" />
          <circle cx="15" cy="11" r="0.9" fill="currentColor" />
        </svg>
      </span>
      <span className="aic-float-label">
        <span className="aic-float-tag">{tx('tag')}</span>
        <span className="aic-float-text">{tx('text')}</span>
      </span>
    </button>
  )
}

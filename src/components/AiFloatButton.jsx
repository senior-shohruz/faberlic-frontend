import { useLang } from '../context/LanguageContext'

const TXT = {
  tag:  { uz: 'AI',          ru: 'AI',          en: 'AI' },
  text: { uz: 'Skin Scan',   ru: 'Skin Scan',   en: 'Skin Scan' },
  aria: { uz: 'AI Skin Scan', ru: 'AI Skin Scan', en: 'AI Skin Scan' },
}

export default function AiFloatButton({ onClick }) {
  const { lang } = useLang()
  const tx = (k) => TXT[k][lang] || TXT[k].uz
  return (
    <button className="ai-float" onClick={onClick} aria-label={tx('aria')} title={tx('aria')}>
      <span className="ai-float-pulse" />
      <span className="ai-float-pulse ai-float-pulse-2" />
      <span className="ai-float-icon">
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <circle cx="9" cy="10" r="0.9" fill="currentColor" />
          <circle cx="15" cy="10" r="0.9" fill="currentColor" />
          <path d="M9 15c1 1 2 1.5 3 1.5s2-0.5 3-1.5" strokeLinecap="round" />
        </svg>
      </span>
      <span className="ai-float-label">
        <span className="ai-float-tag">{tx('tag')}</span>
        <span className="ai-float-text">{tx('text')}</span>
      </span>
    </button>
  )
}

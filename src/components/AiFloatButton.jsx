// Floating AI Skin Scan button — always visible, bottom-right
export default function AiFloatButton({ onClick }) {
  return (
    <button className="ai-float" onClick={onClick} aria-label="AI Skin Scan" title="AI Skin Scan">
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
        <span className="ai-float-tag">AI</span>
        <span className="ai-float-text">Skin Scan</span>
      </span>
    </button>
  )
}

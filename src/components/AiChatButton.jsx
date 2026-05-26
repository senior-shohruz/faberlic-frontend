// Floating AI Chat button — bottom-right, above AI Skin Scan
export default function AiChatButton({ onClick }) {
  return (
    <button className="aic-float" onClick={onClick} aria-label="AI Chat" title="Premium AI Chat">
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
        <span className="aic-float-tag">AI</span>
        <span className="aic-float-text">Chat</span>
      </span>
    </button>
  )
}

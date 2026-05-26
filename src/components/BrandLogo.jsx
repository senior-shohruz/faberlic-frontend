// PREMIUM STORE — luxury wordmark with diamond mark
// Variants: inline (Header, Footer), stacked (Loading), admin (sidebar), light (dark bg)

function DiamondMark({ size = 16 }) {
  return (
    <svg
      className="bl-mark"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={`bl-diamond-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff6b78" />
          <stop offset="100%" stopColor="#c1121f" />
        </linearGradient>
      </defs>
      {/* Diamond body */}
      <path
        d="M12 2 L20 9 L12 22 L4 9 Z"
        fill={`url(#bl-diamond-${size})`}
      />
      {/* Top facet line */}
      <path
        d="M4 9 L20 9 M8 9 L12 2 L16 9 M12 9 L12 22"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="0.7"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function BrandLogo({ variant = 'inline', size = 'md' }) {
  const markSize =
    size === 'xl' ? 32 :
    size === 'lg' ? 22 :
    size === 'sm' ? 14 : 18

  if (variant === 'stacked') {
    return (
      <div className={`bl bl-stacked bl-${size}`}>
        <span className="bl-top">PREMIUM</span>
        <span className="bl-divider">
          <span className="bl-line" />
          <DiamondMark size={markSize} />
          <span className="bl-line" />
        </span>
        <span className="bl-bottom">STORE</span>
      </div>
    )
  }

  return (
    <span className={`bl bl-inline bl-${size} ${variant === 'admin' ? 'bl-admin' : ''} ${variant === 'light' ? 'bl-light' : ''}`}>
      <DiamondMark size={markSize} />
      <span className="bl-words">
        <span className="bl-word bl-word-1">PREMIUM</span>
        <span className="bl-word bl-word-2">STORE</span>
      </span>
    </span>
  )
}

// PREMIUM STORE — luxury wordmark with shopping bag mark
// Variants: inline (Header, Footer), stacked (Loading), admin (sidebar), light (dark bg)

function ShopMark({ size = 16 }) {
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
        <linearGradient id={`bl-shop-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff6b78" />
          <stop offset="100%" stopColor="#c1121f" />
        </linearGradient>
      </defs>
      {/* Bag body */}
      <path
        d="M5 8 L19 8 L17.6 21 C17.5 21.6 17 22 16.4 22 L7.6 22 C7 22 6.5 21.6 6.4 21 L5 8 Z"
        fill={`url(#bl-shop-${size})`}
      />
      {/* Bag highlight */}
      <path
        d="M5.4 9.5 L7 9.5 L7.7 13"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      {/* Bag handles */}
      <path
        d="M8.5 11 L8.5 7.5 C8.5 5.57 10.07 4 12 4 C13.93 4 15.5 5.57 15.5 7.5 L15.5 11"
        stroke={`url(#bl-shop-${size})`}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Star/sparkle on bag */}
      <path
        d="M12 14 L12.5 15.5 L14 16 L12.5 16.5 L12 18 L11.5 16.5 L10 16 L11.5 15.5 Z"
        fill="rgba(255,255,255,0.9)"
      />
    </svg>
  )
}

export default function BrandLogo({ variant = 'inline', size = 'md' }) {
  const markSize =
    size === 'xl' ? 32 :
    size === 'lg' ? 24 :
    size === 'sm' ? 16 : 20

  if (variant === 'stacked') {
    return (
      <div className={`bl bl-stacked bl-${size}`}>
        <span className="bl-top">PREMIUM</span>
        <span className="bl-divider">
          <span className="bl-line" />
          <ShopMark size={markSize} />
          <span className="bl-line" />
        </span>
        <span className="bl-bottom">STORE</span>
      </div>
    )
  }

  return (
    <span className={`bl bl-inline bl-${size} ${variant === 'admin' ? 'bl-admin' : ''} ${variant === 'light' ? 'bl-light' : ''}`}>
      <ShopMark size={markSize} />
      <span className="bl-words">
        <span className="bl-word bl-word-1">PREMIUM</span>
        <span className="bl-word bl-word-2">STORE</span>
      </span>
    </span>
  )
}

// PREMIUM STORE — luxury wordmark logo
// Variants:
//   inline   → single line, compact (Header, Footer)
//   stacked  → two lines (loading, splash)
//   admin    → for admin sidebar (white text)
//   light    → for dark backgrounds (auth modal)

export default function BrandLogo({ variant = 'inline', size = 'md' }) {
  const sizeClass = `bl-${size}` // sm | md | lg | xl

  if (variant === 'stacked') {
    return (
      <div className={`bl bl-stacked ${sizeClass}`}>
        <span className="bl-top">PREMIUM</span>
        <span className="bl-divider">
          <span className="bl-line" />
          <span className="bl-star">✦</span>
          <span className="bl-line" />
        </span>
        <span className="bl-bottom">STORE</span>
      </div>
    )
  }

  return (
    <span className={`bl bl-inline ${sizeClass} ${variant === 'admin' ? 'bl-admin' : ''} ${variant === 'light' ? 'bl-light' : ''}`}>
      <span className="bl-word bl-word-1">PREMIUM</span>
      <span className="bl-sep">✦</span>
      <span className="bl-word bl-word-2">STORE</span>
    </span>
  )
}

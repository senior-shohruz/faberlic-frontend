// Premium Store SVG monogram — elegant "P" with crown serif
export default function BrandLogo({ size = 40, variant = 'gradient' }) {
  const id = `bl-grad-${size}-${variant}`
  const fill = variant === 'solid' ? '#e63946' : `url(#${id})`
  const isLight = variant === 'light'

  return (
    <span className="brand-mark" style={{ width: size, height: size }} aria-hidden>
      <svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff5560" />
            <stop offset="100%" stopColor="#c1121f" />
          </linearGradient>
        </defs>

        {/* Rounded square plate */}
        <rect
          x="1"
          y="1"
          width="46"
          height="46"
          rx="13"
          fill={isLight ? '#ffffff' : fill}
        />

        {/* Subtle inner highlight */}
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="12"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
        />

        {/* Crown 3 dots above */}
        <circle cx="14" cy="11" r="1.6" fill={isLight ? '#e63946' : '#fff'} opacity="0.9" />
        <circle cx="24" cy="9" r="2"   fill={isLight ? '#e63946' : '#fff'} />
        <circle cx="34" cy="11" r="1.6" fill={isLight ? '#e63946' : '#fff'} opacity="0.9" />

        {/* Stylized P with serif notch — classic luxury feel */}
        <path
          d="M16 17 L16 38 L20 38 L20 30 L26 30 C30.4183 30 34 26.4183 34 22 C34 17.5817 30.4183 14 26 14 L16 14 L16 17 Z M20 18 L26 18 C28.2091 18 30 19.7909 30 22 C30 24.2091 28.2091 26 26 26 L20 26 L20 18 Z"
          fill={isLight ? '#e63946' : '#ffffff'}
        />

        {/* Tiny accent dot — luxury dot */}
        <circle cx="33.5" cy="36.5" r="1.6" fill={isLight ? '#e63946' : '#fff'} opacity="0.85" />
      </svg>
    </span>
  )
}

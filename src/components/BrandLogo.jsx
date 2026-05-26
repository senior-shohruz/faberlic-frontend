// Premium Store SVG monogram — luxury shopping bag with crown
export default function BrandLogo({ size = 40, variant = 'gradient' }) {
  const id = `bl-grad-${size}-${variant}`
  const isLight = variant === 'light'
  const plateFill = isLight ? '#ffffff' : `url(#${id})`
  const markFill = isLight ? '#e63946' : '#ffffff'

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
            <stop offset="0%" stopColor="#ff4d5b" />
            <stop offset="100%" stopColor="#b30e1c" />
          </linearGradient>
          <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Plate */}
        <rect x="1" y="1" width="46" height="46" rx="12" fill={plateFill} />

        {/* Top inner shine */}
        {!isLight && (
          <rect x="1" y="1" width="46" height="22" rx="12" fill={`url(#${id}-shine)`} />
        )}

        {/* Inner stroke */}
        <rect
          x="1.5"
          y="1.5"
          width="45"
          height="45"
          rx="11.5"
          fill="none"
          stroke={isLight ? 'rgba(230,57,70,0.1)' : 'rgba(255,255,255,0.18)'}
          strokeWidth="1"
        />

        {/* Crown — 3 peaks above the bag */}
        <path
          d="M16 13 L18.5 9 L21 12.5 L24 8 L27 12.5 L29.5 9 L32 13 L32 14.5 L16 14.5 Z"
          fill={markFill}
        />
        {/* Crown gem */}
        <circle cx="24" cy="11" r="0.9" fill={isLight ? '#ffffff' : '#ffd2d6'} />

        {/* Shopping bag body */}
        <path
          d="M14 18 L34 18 L32.5 38 C32.4 39.1 31.5 40 30.4 40 L17.6 40 C16.5 40 15.6 39.1 15.5 38 L14 18 Z"
          fill={markFill}
        />

        {/* Bag handles (cut-outs) */}
        <path
          d="M19 22 C19 19.5 21 17.5 24 17.5 C27 17.5 29 19.5 29 22"
          fill="none"
          stroke={plateFill === '#ffffff' ? '#e63946' : '#ffffff'}
          strokeOpacity="0"
        />
        <path
          d="M19 24 L19 21 C19 18.79 21.24 17 24 17 C26.76 17 29 18.79 29 21 L29 24 L26.5 24 L26.5 21 C26.5 19.62 25.38 18.5 24 18.5 C22.62 18.5 21.5 19.62 21.5 21 L21.5 24 Z"
          fill={isLight ? '#ffffff' : '#e63946'}
        />

        {/* Sparkle accent */}
        <g fill={markFill} opacity="0.9">
          <path d="M37 22 L37.6 23.4 L39 24 L37.6 24.6 L37 26 L36.4 24.6 L35 24 L36.4 23.4 Z" />
        </g>
      </svg>
    </span>
  )
}

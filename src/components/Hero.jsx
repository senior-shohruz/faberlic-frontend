import { useState, useEffect, useRef } from 'react'
import { useLang } from '../context/LanguageContext'

const THEMES = [
  {
    bg: 'linear-gradient(135deg, #0c001f 0%, #1a0040 60%, #0a0018 100%)',
    accent: '#a855f7', dim: '#7c3aed',
    tag: 'YANGI KOLLEKSIYA',
  },
  {
    bg: 'linear-gradient(135deg, #00050f 0%, #001830 60%, #000c20 100%)',
    accent: '#0ea5e9', dim: '#0284c7',
    tag: 'BESTSELLER',
  },
  {
    bg: 'linear-gradient(135deg, #000d08 0%, #00251a 60%, #001410 100%)',
    accent: '#22c55e', dim: '#16a34a',
    tag: 'ECO & NATURAL',
  },
  {
    bg: 'linear-gradient(135deg, #100800 0%, #271500 60%, #180e00 100%)',
    accent: '#f59e0b', dim: '#d97706',
    tag: 'HOT DEALS',
  },
]

const TICKERS = [
  'PREMIUM STORE', 'PREMIUM BEAUTY', 'NATURAL CARE', 'ECO COSMETICS',
  'SKIN EXPERT', 'LUXURY BRAND', 'FREE PICKUP',
]

export default function Hero({ onOpenQuiz }) {
  const [cur, setCur] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const [apiSlides, setApiSlides] = useState([])
  const timer = useRef(null)
  const { t } = useLang()

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/banners`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (data.length > 0) setApiSlides(data) })
      .catch(() => {})
  }, [])

  const staticSlides = t('hero.slides')

  const slides = apiSlides.length > 0
    ? apiSlides.map((b, i) => {
        const theme = THEMES[i % THEMES.length]
        return {
          bg: theme.bg,
          accent: b.accentColor || theme.accent,
          dim: theme.dim,
          bgImage: b.bgImage || '',
          productImage: b.productImage || '',
          title: (b.title || 'BANNER').toUpperCase(),
          desc: b.subtitle || '',
          badge: b.badge || '',
          badgeSub: b.badgeSub || '',
          btn: b.btnText || "Mahsulotlarni ko'rish",
          tag: theme.tag,
        }
      })
    : staticSlides.map((sl, i) => {
        const theme = THEMES[i % THEMES.length]
        const titleArr = Array.isArray(sl.title) ? sl.title : [sl.title]
        return {
          bg: theme.bg,
          accent: theme.accent,
          dim: theme.dim,
          bgImage: '',
          productImage: '',
          title: titleArr.join(' '),
          desc: sl.desc,
          badge: sl.badge,
          badgeSub: sl.badgeSub,
          btn: sl.btn || "Mahsulotlarni ko'rish",
          tag: theme.tag,
        }
      })

  function resetTimer() {
    clearInterval(timer.current)
    timer.current = setInterval(() => {
      setCur(c => (c + 1) % slides.length)
      setAnimKey(k => k + 1)
    }, 6000)
  }

  function go(idx) { setCur(idx); setAnimKey(k => k + 1); resetTimer() }
  function prev() { go((cur - 1 + slides.length) % slides.length) }
  function next() { go((cur + 1) % slides.length) }

  useEffect(() => { setCur(0) }, [apiSlides.length])
  useEffect(() => { resetTimer(); return () => clearInterval(timer.current) }, [slides.length])

  function scrollShop() {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const s = slides[Math.min(cur, slides.length - 1)] || slides[0]
  if (!s) return null

  const bgStyle = s.bgImage
    ? { backgroundImage: `url(${s.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: s.bg }

  const words = s.title.split(' ')
  const half = Math.ceil(words.length / 2)

  return (
    <section className="hs" style={bgStyle}>

      {/* Bg layers */}
      {s.bgImage && <div className="hs-img-veil" />}
      {!s.bgImage && <>
        <div className="hs-blob hs-blob-1" style={{ background: s.accent }} />
        <div className="hs-blob hs-blob-2" style={{ background: s.dim }} />
        <div className="hs-noise" />
      </>}

      {/* Slide */}
      <div className="hs-body" key={animKey}>

        {/* LEFT */}
        <div className="hs-left">

          <span className="hs-eyebrow" style={{ color: s.accent, borderColor: s.accent + '35', background: s.accent + '12' }}>
            <i className="hs-eyebrow-dot" style={{ background: s.accent }} />
            {s.tag}
          </span>

          <h1 className="hs-title">
            <span className="hs-t1">{words.slice(0, half).join(' ')}</span>
            {words.length > half && (
              <span className="hs-t2" style={{ color: s.accent }}>{words.slice(half).join(' ')}</span>
            )}
          </h1>

          {s.desc && <p className="hs-sub">{s.desc}</p>}

          {s.badge && (
            <div className="hs-badge" style={{ '--a': s.accent }}>
              <span className="hs-badge-num">{s.badge}</span>
              <span className="hs-badge-lbl">{s.badgeSub || 'CHEGIRMA'}</span>
            </div>
          )}

          <div className="hs-row">
            <button className="hs-btn" style={{ background: s.accent, boxShadow: `0 8px 32px ${s.accent}55` }} onClick={scrollShop}>
              {s.btn}
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
            </button>
            {onOpenQuiz && (
              <button className="hs-quiz-btn" onClick={onOpenQuiz} style={{ borderColor: s.accent + '50', color: s.accent }}>
                <span className="hs-quiz-icon">✨</span>
                Teri tahlili
              </button>
            )}
            <div className="hs-kpi">
              <div className="hs-kpi-item">
                <b style={{ color: s.accent }}>500+</b><small>Mahsulot</small>
              </div>
              <div className="hs-kpi-sep" />
              <div className="hs-kpi-item">
                <b style={{ color: s.accent }}>4.9★</b><small>Reyting</small>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="hs-right">
          {s.productImage ? (
            <div className="hs-prodwrap">
              <div className="hs-prod-glow" style={{ background: s.accent }} />
              <img src={s.productImage} alt="" className="hs-prod-img" />
            </div>
          ) : (
            <div className="hs-visual">
              <div className="hs-ring hs-ring-1" style={{ borderColor: s.accent + '28' }} />
              <div className="hs-ring hs-ring-2" style={{ borderColor: s.accent + '18' }} />
              <div className="hs-ring hs-ring-3" style={{ borderColor: s.accent + '10' }} />
              <div className="hs-vcore" style={{ background: s.accent + '12', borderColor: s.accent + '30' }}>
                <div className="hs-vcore-inner" style={{ borderColor: s.accent + '20' }}>
                  <CosmeticIcon color={s.accent} />
                </div>
              </div>
              <div className="hs-spark hs-sp1" style={{ background: s.accent }} />
              <div className="hs-spark hs-sp2" style={{ background: s.accent }} />
              <div className="hs-spark hs-sp3" style={{ background: s.accent }} />
              <div className="hs-floatchip hs-fc1" style={{ borderColor: s.accent + '40', color: s.accent }}>✨ Premium</div>
              <div className="hs-floatchip hs-fc2" style={{ borderColor: s.accent + '40', color: s.accent }}>🌿 Natural</div>
            </div>
          )}
        </div>
      </div>

      {/* Marquee */}
      <div className="hs-ticker" style={{ borderTopColor: s.accent + '18' }}>
        <div className="hs-ticker-track">
          {[...TICKERS, ...TICKERS, ...TICKERS].map((item, i) => (
            <span key={i} className="hs-ticker-item">
              <span className="hs-ticker-dot" style={{ background: s.accent }} />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Arrows */}
      <button className="hs-arr hs-arr-l" onClick={prev} style={{ borderColor: s.accent + '35', color: s.accent }}>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button className="hs-arr hs-arr-r" onClick={next} style={{ borderColor: s.accent + '35', color: s.accent }}>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      {/* Progress dots */}
      <div className="hs-dots">
        {slides.map((_, i) => (
          <button key={i} className={`hs-dot${i === cur ? ' on' : ''}`}
            style={i === cur ? { background: s.accent } : {}} onClick={() => go(i)} />
        ))}
      </div>
      <div className="hs-num">
        <span style={{ color: s.accent, fontWeight: 800, fontSize: 18 }}>{String(cur + 1).padStart(2, '0')}</span>
        <span className="hs-num-sep" /><span className="hs-num-tot">{String(slides.length).padStart(2, '0')}</span>
      </div>
    </section>
  )
}

function CosmeticIcon({ color }) {
  return (
    <svg width="64" height="64" fill="none" viewBox="0 0 64 64">
      <ellipse cx="32" cy="20" rx="9" ry="13" stroke={color} strokeWidth="1.5"/>
      <path d="M20 34c0 9 5.4 18 12 18s12-9 12-18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M23 30h18M23 39h12" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity=".5"/>
      <circle cx="46" cy="14" r="7" stroke={color} strokeWidth="1.2" opacity=".6"/>
      <path d="M43 14h6M46 11v6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

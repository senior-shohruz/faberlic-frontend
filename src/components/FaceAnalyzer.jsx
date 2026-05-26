import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../context/LanguageContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/* ────────────────────────────────────────────────
   Heuristic face / skin analysis (client-side only)
   No image is uploaded anywhere.
   ──────────────────────────────────────────────── */
function analyzeImage(imageData) {
  const { data, width, height } = imageData
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) * 0.32

  let foreheadB = 0, foreheadN = 0
  let cheekB = 0, cheekN = 0
  let chinB = 0, chinN = 0
  let totalR = 0, totalG = 0, totalB = 0, totalN = 0
  let varianceSum = 0

  for (let y = 0; y < height; y += 3) {
    for (let x = 0; x < width; x += 3) {
      const dx = x - cx, dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > radius) continue

      const idx = (y * width + x) * 4
      const r = data[idx], g = data[idx + 1], b = data[idx + 2]

      // Basic skin colour filter
      if (r < 50 || g < 25 || b < 15) continue
      if (r <= g || r <= b) continue
      if (Math.abs(r - g) > 80) continue

      const brightness = (r + g + b) / 3
      totalN++
      totalR += r; totalG += g; totalB += b

      // T-zone (forehead): upper third
      if (dy < -radius * 0.3) {
        foreheadB += brightness
        foreheadN++
      }
      // Cheeks: middle band, away from centre
      else if (Math.abs(dy) <= radius * 0.3 && Math.abs(dx) > radius * 0.3) {
        cheekB += brightness
        cheekN++
      }
      // Chin: lower third
      else if (dy > radius * 0.3) {
        chinB += brightness
        chinN++
      }

      varianceSum += brightness * brightness
    }
  }

  if (totalN < 80) {
    return { ok: false, error: 'noface' }
  }

  const avgR = totalR / totalN
  const avgG = totalG / totalN
  const avgB = totalB / totalN
  const avg = (avgR + avgG + avgB) / 3
  const variance = Math.sqrt(varianceSum / totalN - avg * avg)

  const fAvg = foreheadN > 0 ? foreheadB / foreheadN : avg
  const cAvg = cheekN > 0 ? cheekB / cheekN : avg
  const chAvg = chinN > 0 ? chinB / chinN : avg

  // T-zone "shine" = forehead brighter than cheeks
  const tZoneShine = fAvg - cAvg
  // Redness ratio
  const redness = avgR / Math.max(avgG, 1)
  // Tone
  let tone = 'medium'
  if (avg > 175) tone = 'light'
  else if (avg < 125) tone = 'dark'

  // Skin type
  let skinType = 'normal'
  if (tZoneShine > 14) skinType = 'oily'
  else if (tZoneShine > 6) skinType = 'combo'
  else if (avg < 130 && variance < 28) skinType = 'dry'

  // Concerns (max 3)
  const concerns = []
  if (tZoneShine > 8) concerns.push('oily')
  if (redness > 1.18 || variance > 38) concerns.push('redness')
  if (avg < 130 || (skinType === 'dry')) concerns.push('moisture')
  if (variance > 40) concerns.push('spots')
  if (concerns.length === 0) concerns.push('balanced')

  // Hydration score (0-100): higher = better
  const hydration = Math.max(20, Math.min(99, Math.round(50 + (avg - 130) * 0.6 - tZoneShine * 1.2)))
  // Oiliness 0-100
  const oilLevel = Math.max(5, Math.min(99, Math.round(40 + tZoneShine * 2.4)))
  // Redness 0-100
  const rednessLevel = Math.max(5, Math.min(99, Math.round((redness - 1.0) * 220 + variance * 0.6)))
  // Confidence based on sample size
  const confidence = Math.min(98, 72 + Math.floor(totalN / 90))

  return {
    ok: true,
    skinType,
    concerns: concerns.slice(0, 3),
    tone,
    hydration,
    oilLevel,
    rednessLevel,
    confidence,
  }
}

/* ────────────────────────────────────────────────
   Match products to analysis (re-uses backend /api/products)
   ──────────────────────────────────────────────── */
function scoreProduct(p, analysis) {
  let score = 0
  const name = (p.name || '').toLowerCase()
  const cat = (p.category || '').toLowerCase()

  if (analysis.skinType === 'oily' && (cat === 'gigiena' || name.includes('toza') || name.includes('mat'))) score += 4
  if (analysis.skinType === 'dry' && (name.includes('namlov') || name.includes('krem') || name.includes('serum'))) score += 5
  if (analysis.skinType === 'combo' && cat === 'kosmetika') score += 2
  if (analysis.skinType === 'normal') score += 1

  if (analysis.concerns.includes('moisture') && (name.includes('namlov') || name.includes('krem') || name.includes('serum') || name.includes('losy'))) score += 4
  if (analysis.concerns.includes('redness') && (name.includes('toza') || name.includes('soft') || name.includes('lab'))) score += 3
  if (analysis.concerns.includes('oily') && (cat === 'gigiena' || name.includes('toza'))) score += 3
  if (analysis.concerns.includes('spots') && (name.includes('oqart') || name.includes("dog'") || name.includes('vitamin'))) score += 4

  if (cat === 'kosmetika') score += 0.5
  if ((p.discount || 0) >= 40) score += 0.8

  return score
}

/* ────────────────────────────────────────────────
   The component
   ──────────────────────────────────────────────── */
const STAGES = ['intro', 'scanning', 'analyzing', 'result']

export default function FaceAnalyzer({ onClose, onRequireAuth }) {
  const [stage, setStage] = useState('intro')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [analysis, setAnalysis] = useState(null)
  const [products, setProducts] = useState([])
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const captureTimerRef = useRef(null)
  const progressTimerRef = useRef(null)
  const analyzeTimerRef = useRef(null)

  const { addItem } = useCart()
  const { user } = useAuth()
  const { addToast } = useToast()
  const { t } = useLang()

  /* lock body scroll */
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  /* esc to close */
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* fetch products once */
  useEffect(() => {
    fetch(`${API}/products`).then(r => r.json()).then(data => {
      setProducts(Array.isArray(data) ? data : (data?.data || []))
    }).catch(() => setProducts([]))
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    if (captureTimerRef.current) clearTimeout(captureTimerRef.current)
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current)
  }, [])

  const handleClose = useCallback(() => {
    stopCamera()
    onClose?.()
  }, [stopCamera, onClose])

  const startScan = async () => {
    setError('')

    // Browser support check
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // HTTPS check
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        setError('insecure')
      } else {
        setError('unavailable')
      }
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream
      // Switch stage first so that <video> element exists in DOM
      setStage('scanning')
      setProgress(0)

      // Wait next tick for DOM render then attach stream
      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          try {
            await videoRef.current.play()
          } catch (playErr) {
            console.warn('play error', playErr)
          }
        }
      }, 50)

      // animate progress
      progressTimerRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) return 100
          return p + (Math.random() * 6 + 2)
        })
      }, 120)
      // capture frame after ~3.5s
      captureTimerRef.current = setTimeout(() => {
        captureAndAnalyze()
      }, 3500)
    } catch (e) {
      console.warn('camera error', e)
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setError('denied')
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        setError('unavailable')
      } else {
        setError('unavailable')
      }
    }
  }

  const captureAndAnalyze = () => {
    clearInterval(progressTimerRef.current)
    setProgress(100)
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    // Mirror so analysis matches what user sees
    ctx.save()
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    ctx.restore()
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    setStage('analyzing')

    analyzeTimerRef.current = setTimeout(() => {
      const result = analyzeImage(imageData)
      stopCamera()
      if (!result.ok) {
        setError('noface')
        setStage('intro')
        return
      }
      setAnalysis(result)
      setStage('result')
    }, 1600)
  }

  const handleAdd = (p) => {
    if (!user) { onRequireAuth?.(); handleClose(); return }
    addItem(p)
    addToast(`${p.emoji || '🛍️'} ${t('products.addedToCart') || "Savatga qo'shildi"}`, 'success')
  }

  const restart = () => {
    setAnalysis(null)
    setError('')
    setProgress(0)
    setStage('intro')
  }

  /* recommendations */
  const recommendations = analysis
    ? products
        .map(p => ({ ...p, _score: scoreProduct(p, analysis) }))
        .filter(p => p._score > 0)
        .sort((a, b) => b._score - a._score)
        .slice(0, 6)
    : []

  return createPortal(
    <div className="fa-overlay" onMouseDown={e => e.target === e.currentTarget && handleClose()}>
      <div className="fa-modal">

        {/* Header */}
        <div className="fa-head">
          <div className="fa-head-left">
            <span className="fa-head-badge">
              <span className="fa-head-dot" />
              AI BEAUTY SCAN
            </span>
            <h2 className="fa-head-title">
              {stage === 'result' ? "Sizning teri tahlilingiz" : "AI Yuz tahlili"}
            </h2>
          </div>
          <button className="fa-close" onClick={handleClose} aria-label="Yopish">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="fa-body">

          {/* INTRO */}
          {stage === 'intro' && (
            <div className="fa-intro">
              <div className="fa-intro-visual">
                <div className="fa-orb">
                  <div className="fa-orb-ring fa-orb-r1" />
                  <div className="fa-orb-ring fa-orb-r2" />
                  <div className="fa-orb-ring fa-orb-r3" />
                  <div className="fa-orb-core">
                    <svg width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="9" cy="10" r="0.8" fill="currentColor" />
                      <circle cx="15" cy="10" r="0.8" fill="currentColor" />
                      <path d="M9 15c1 1 2 1.5 3 1.5s2-0.5 3-1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>

              <h3 className="fa-intro-title">Yuzingizni 5 soniyada tahlil qilamiz</h3>
              <p className="fa-intro-sub">
                Kamerangiz orqali teri turini aniqlaymiz va sizga eng mos kremlarni tavsiya qilamiz.
              </p>

              <ul className="fa-features">
                <li><span className="fa-feature-ico">🔒</span> Maxfiy — rasm hech qayoqqa yuborilmaydi</li>
                <li><span className="fa-feature-ico">⚡</span> 5 soniyada natija</li>
                <li><span className="fa-feature-ico">🎯</span> Shaxsiy mahsulot tavsiyalari</li>
              </ul>

              {error === 'denied' && (
                <div className="fa-error">
                  <span>⚠️</span> Kamera ruxsati berilmadi. Brauzer sozlamalaridan kameraga ruxsat bering va qayta urining.
                </div>
              )}
              {error === 'unavailable' && (
                <div className="fa-error">
                  <span>⚠️</span> Kamera topilmadi. Iltimos, qurilmangizda kamera mavjudligini tekshiring.
                </div>
              )}
              {error === 'noface' && (
                <div className="fa-error">
                  <span>⚠️</span> Yuz aniqlanmadi. Yorug' joyda yuzingizni doiraga to'g'ridan-to'g'ri qarating va qayta urining.
                </div>
              )}
              {error === 'insecure' && (
                <div className="fa-error">
                  <span>⚠️</span> Kamera faqat HTTPS sayt orqali ishlaydi. Iltimos, sayt manzilida HTTPS borligini tekshiring.
                </div>
              )}

              <p className="fa-disclaimer">
                Tavsiyalar ma'lumot uchun, dermatolog ko'rigi o'rnini bosmaydi.
              </p>
            </div>
          )}

          {/* SCANNING */}
          {stage === 'scanning' && (
            <div className="fa-scan">
              <div className="fa-cam-wrap">
                <video ref={videoRef} className="fa-video" playsInline muted />
                <div className="fa-cam-overlay">
                  <div className="fa-face-frame">
                    <div className="fa-face-corner fa-fc-tl" />
                    <div className="fa-face-corner fa-fc-tr" />
                    <div className="fa-face-corner fa-fc-bl" />
                    <div className="fa-face-corner fa-fc-br" />
                    <div className="fa-scanline" />
                    <div className="fa-grid" />
                  </div>
                </div>
                <div className="fa-cam-hint">Yuzingizni doiraga to'g'rilang</div>
              </div>
              <div className="fa-progress-wrap">
                <div className="fa-progress-info">
                  <span className="fa-progress-label">Skaner ishlamoqda…</span>
                  <span className="fa-progress-pct">{Math.min(100, Math.round(progress))}%</span>
                </div>
                <div className="fa-progress-track">
                  <div className="fa-progress-fill" style={{ width: `${Math.min(100, progress)}%` }} />
                </div>
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          )}

          {/* ANALYZING */}
          {stage === 'analyzing' && (
            <div className="fa-thinking">
              <div className="fa-think-orb">
                <div className="fa-think-pulse" />
                <div className="fa-think-pulse fa-think-pulse-2" />
                <div className="fa-think-core">
                  <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path d="M12 2a3 3 0 00-3 3v0a3 3 0 00-3 3 3 3 0 00-3 3 3 3 0 003 3 3 3 0 003 3 3 3 0 003 3 3 3 0 003-3 3 3 0 003-3 3 3 0 003-3 3 3 0 00-3-3 3 3 0 00-3-3 3 3 0 00-3-3z" />
                  </svg>
                </div>
              </div>
              <p className="fa-think-title">AI tahlil qilmoqda…</p>
              <p className="fa-think-sub">Teri turingiz va ehtiyojlaringiz aniqlanmoqda</p>
              <div className="fa-think-steps">
                <span className="fa-think-step active">Yuz aniqlash</span>
                <span className="fa-think-step active">Teri rangi</span>
                <span className="fa-think-step active">T-zona tahlili</span>
                <span className="fa-think-step">Mos kremlar</span>
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          )}

          {/* RESULT */}
          {stage === 'result' && analysis && (
            <div className="fa-result">

              <div className="fa-result-hero">
                <div className="fa-result-emoji">
                  {analysis.skinType === 'oily' ? '💧' :
                   analysis.skinType === 'dry' ? '🌵' :
                   analysis.skinType === 'combo' ? '🔄' : '✨'}
                </div>
                <div>
                  <p className="fa-result-label">Aniqlangan teri turi</p>
                  <h3 className="fa-result-type">
                    {analysis.skinType === 'oily' ? "Yog'li teri" :
                     analysis.skinType === 'dry' ? 'Quruq teri' :
                     analysis.skinType === 'combo' ? 'Kombinatsiya' : 'Normal teri'}
                  </h3>
                  <p className="fa-result-conf">
                    Aniqlik darajasi: <strong>{analysis.confidence}%</strong>
                  </p>
                </div>
              </div>

              <div className="fa-metrics">
                <Metric label="Namlanish" value={analysis.hydration} color="#3b82f6" suffix="%" />
                <Metric label="Yog'lilik" value={analysis.oilLevel} color="#f59e0b" suffix="%" invert />
                <Metric label="Qizarish" value={analysis.rednessLevel} color="#ef4444" suffix="%" invert />
              </div>

              {analysis.concerns?.length > 0 && analysis.concerns[0] !== 'balanced' && (
                <div className="fa-concerns">
                  <p className="fa-concerns-label">Asosiy ehtiyojlar:</p>
                  <div className="fa-concern-pills">
                    {analysis.concerns.map(c => (
                      <span key={c} className={`fa-concern fa-concern-${c}`}>
                        {c === 'moisture' ? '💦 Namlanish' :
                         c === 'oily' ? "🛢️ Yog'lilikni nazorat" :
                         c === 'redness' ? '🔴 Qizarish' :
                         c === 'spots' ? "⚪ Bir tekis ranglilik" :
                         "✅ Muvozanat"}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="fa-rec">
                <h4 className="fa-rec-title">
                  <span className="fa-rec-icon">🎯</span>
                  Sizga tavsiya etilgan kremlar
                </h4>
                {recommendations.length === 0 ? (
                  <p className="fa-rec-empty">Hozircha mos mahsulot topilmadi.</p>
                ) : (
                  <div className="fa-rec-grid">
                    {recommendations.map(p => (
                      <div key={p.id} className="fa-rec-card">
                        <div className="fa-rec-thumb">
                          {p.image ? <img src={p.image} alt={p.name} /> : <span>{p.emoji || '🛍️'}</span>}
                        </div>
                        <div className="fa-rec-info">
                          <p className="fa-rec-name">{p.name}</p>
                          <div className="fa-rec-bottom">
                            <span className="fa-rec-price">{p.price?.toLocaleString()} UZS</span>
                            {p.discount > 0 && <span className="fa-rec-disc">-{p.discount}%</span>}
                          </div>
                        </div>
                        <button className="fa-rec-add" onClick={() => handleAdd(p)} aria-label="Savatga">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Sticky footer with action — always visible */}
        {stage === 'intro' && (
          <div className="fa-foot">
            <button className="fa-cta" onClick={startScan}>
              <span className="fa-cta-icon">📸</span>
              Skanerni boshlash
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
        {stage === 'result' && (
          <div className="fa-foot fa-foot-result">
            <button className="fa-restart" onClick={restart}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>
              Qayta skan
            </button>
            <button className="fa-finish" onClick={handleClose}>Tushunarli ✓</button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

function Metric({ label, value, color, suffix = '', invert = false }) {
  // Display logic: hydration "more is better", oilLevel/redness "less is better"
  const displayValue = value
  const status = invert
    ? (value < 30 ? 'good' : value < 60 ? 'mid' : 'high')
    : (value > 70 ? 'good' : value > 40 ? 'mid' : 'low')
  return (
    <div className="fa-metric">
      <div className="fa-metric-top">
        <span className="fa-metric-label">{label}</span>
        <span className={`fa-metric-status fa-metric-${status}`}>
          {status === 'good' ? '✓ Yaxshi' : status === 'mid' ? '~ O\'rta' : (invert ? '! Yuqori' : '! Past')}
        </span>
      </div>
      <div className="fa-metric-bar">
        <div className="fa-metric-fill" style={{ width: `${displayValue}%`, background: color }} />
      </div>
      <p className="fa-metric-val">{displayValue}{suffix}</p>
    </div>
  )
}

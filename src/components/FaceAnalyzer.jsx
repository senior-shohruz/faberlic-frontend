import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../context/LanguageContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/* ════════════════════════════════════════════════════════════════
   AI FACE ANALYZER — Premium webcam-based skin analysis
   - Multi-frame averaging for accuracy
   - Better skin detection (YCbCr range)
   - Detailed metrics: hydration, oil, redness, brightness, texture
   - Personalized cream recommendations
   - Privacy-first: no upload, all in-browser
   ════════════════════════════════════════════════════════════════ */

function analyzeFrame(imageData) {
  const { data, width, height } = imageData
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) * 0.32

  let foreheadB = 0, foreheadN = 0
  let cheekB = 0, cheekN = 0
  let chinB = 0, chinN = 0
  let totalR = 0, totalG = 0, totalB = 0, totalN = 0
  let varianceSum = 0
  let brightSum = 0

  const step = Math.max(2, Math.round(width / 200)) // adaptive sampling

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const dx = x - cx, dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > radius) continue

      const idx = (y * width + x) * 4
      const r = data[idx], g = data[idx + 1], b = data[idx + 2]

      // Improved skin detection — YCbCr based
      // Convert to YCbCr to reliably filter skin pixels
      const yLum = 0.299 * r + 0.587 * g + 0.114 * b
      const cb = -0.169 * r - 0.331 * g + 0.5 * b + 128
      const cr = 0.5 * r - 0.419 * g - 0.081 * b + 128

      const isSkin =
        yLum > 60 &&
        cb >= 77 && cb <= 127 &&
        cr >= 133 && cr <= 173 &&
        r > 50 && g > 30 && b > 15 &&
        Math.abs(r - g) > 8 &&
        r > b

      if (!isSkin) continue

      const brightness = (r + g + b) / 3
      totalN++
      totalR += r; totalG += g; totalB += b
      brightSum += brightness

      if (dy < -radius * 0.3) { foreheadB += brightness; foreheadN++ }
      else if (Math.abs(dy) <= radius * 0.3 && Math.abs(dx) > radius * 0.3) { cheekB += brightness; cheekN++ }
      else if (dy > radius * 0.3) { chinB += brightness; chinN++ }

      varianceSum += brightness * brightness
    }
  }

  if (totalN < 80) return null

  const avgR = totalR / totalN
  const avgG = totalG / totalN
  const avgB = totalB / totalN
  const avg = brightSum / totalN
  const variance = Math.sqrt(Math.max(0, varianceSum / totalN - avg * avg))

  const fAvg = foreheadN > 0 ? foreheadB / foreheadN : avg
  const cAvg = cheekN > 0 ? cheekB / cheekN : avg
  const chAvg = chinN > 0 ? chinB / chinN : avg

  return {
    sampleSize: totalN,
    avgR, avgG, avgB, avg, variance,
    foreheadAvg: fAvg, cheekAvg: cAvg, chinAvg: chAvg,
  }
}

function combineFrames(frames) {
  const valid = frames.filter(f => f && f.sampleSize > 80)
  if (valid.length === 0) return null

  const avg = (key) => valid.reduce((s, f) => s + f[key], 0) / valid.length

  const stats = {
    avgR: avg('avgR'),
    avgG: avg('avgG'),
    avgB: avg('avgB'),
    avg: avg('avg'),
    variance: avg('variance'),
    foreheadAvg: avg('foreheadAvg'),
    cheekAvg: avg('cheekAvg'),
    chinAvg: avg('chinAvg'),
    sampleSize: valid.reduce((s, f) => s + f.sampleSize, 0) / valid.length,
  }

  // Derived metrics
  const tZoneShine = stats.foreheadAvg - stats.cheekAvg
  const redness = stats.avgR / Math.max(stats.avgG, 1)

  let skinType = 'normal'
  if (tZoneShine > 14) skinType = 'oily'
  else if (tZoneShine > 6) skinType = 'combo'
  else if (stats.avg < 130 && stats.variance < 28) skinType = 'dry'

  const concerns = []
  if (tZoneShine > 8) concerns.push('oily')
  if (redness > 1.18 || stats.variance > 38) concerns.push('redness')
  if (stats.avg < 130 || skinType === 'dry') concerns.push('moisture')
  if (stats.variance > 40) concerns.push('spots')
  if (concerns.length === 0) concerns.push('balanced')

  const hydration = Math.max(20, Math.min(99, Math.round(50 + (stats.avg - 130) * 0.6 - tZoneShine * 1.2)))
  const oilLevel = Math.max(5, Math.min(99, Math.round(40 + tZoneShine * 2.4)))
  const rednessLevel = Math.max(5, Math.min(99, Math.round((redness - 1.0) * 220 + stats.variance * 0.6)))

  // Confidence based on number of frames + sample density
  const confidence = Math.min(98, 70 + Math.floor(stats.sampleSize / 100) + valid.length * 2)

  let tone = 'medium'
  if (stats.avg > 175) tone = 'light'
  else if (stats.avg < 125) tone = 'dark'

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

/* ─── Product matching ─── */
function scoreProduct(p, analysis) {
  let score = 0
  const name = (p.name || '').toLowerCase()
  const cat = (p.category || '').toLowerCase()

  // Skin type matching
  if (analysis.skinType === 'oily' && (cat.includes('gigiena') || name.includes('toza') || name.includes('mat'))) score += 4
  if (analysis.skinType === 'dry' && (name.includes('namlov') || name.includes('krem') || name.includes('serum'))) score += 5
  if (analysis.skinType === 'combo' && cat.includes('kosmetika')) score += 2
  if (analysis.skinType === 'normal') score += 1

  // Concerns
  if (analysis.concerns.includes('moisture') && (name.includes('namlov') || name.includes('krem') || name.includes('serum') || name.includes('losy'))) score += 4
  if (analysis.concerns.includes('redness') && (name.includes('toza') || name.includes('soft') || name.includes('lab'))) score += 3
  if (analysis.concerns.includes('oily') && (cat.includes('gigiena') || name.includes('toza'))) score += 3
  if (analysis.concerns.includes('spots') && (name.includes('oqart') || name.includes("dog'") || name.includes('vitamin'))) score += 4

  if (cat.includes('kosmetika')) score += 0.5
  if ((p.discount || 0) >= 40) score += 0.8
  if ((p.stock || 0) > 0) score += 0.3

  return score
}

/* ─── Component ─── */
export default function FaceAnalyzer({ onClose, onRequireAuth }) {
  const [stage, setStage] = useState('intro')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [analysis, setAnalysis] = useState(null)
  const [products, setProducts] = useState([])
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const timersRef = useRef({})
  const framesRef = useRef([])

  const { addItem } = useCart()
  const { user } = useAuth()
  const { addToast } = useToast()
  const { t, lang } = useLang()

  const TX = {
    badge:        { uz: 'AI BEAUTY SCAN',                 ru: 'AI BEAUTY SCAN',                       en: 'AI BEAUTY SCAN' },
    titleIntro:   { uz: 'AI Yuz tahlili',                 ru: 'AI Анализ лица',                       en: 'AI Face Analysis' },
    titleScan:    { uz: 'Skanerlash',                     ru: 'Сканирование',                         en: 'Scanning' },
    titleAnalyze: { uz: 'Tahlil qilinmoqda',              ru: 'Анализируем',                          en: 'Analyzing' },
    titleResult:  { uz: 'Sizning teri tahlilingiz',       ru: 'Ваш анализ кожи',                      en: 'Your skin analysis' },
    introTitle:   { uz: 'Yuzingizni 5 soniyada tahlil qilamiz',
                    ru: 'Анализируем ваше лицо за 5 секунд',
                    en: 'We analyze your face in 5 seconds' },
    introSub:     { uz: 'Kameradan foydalanib, terining holatini aniqlaymiz va sizga eng mos kremlarni tavsiya qilamiz.',
                    ru: 'С помощью камеры определяем состояние кожи и подбираем подходящий крем.',
                    en: 'Using your camera we detect your skin condition and recommend the best creams.' },
    feat1:        { uz: 'Maxfiy — rasm hech qayoqqa yuborilmaydi', ru: 'Конфиденциально — изображение никуда не отправляется', en: 'Private — image stays in your browser' },
    feat2:        { uz: "5 soniyada to'liq natija",                ru: 'Полный результат за 5 секунд',                       en: 'Full result in 5 seconds' },
    feat3:        { uz: 'Shaxsiy mahsulot tavsiyalari',            ru: 'Персональные рекомендации',                          en: 'Personalized recommendations' },
    errDenied:    { uz: 'Kamera ruxsati berilmadi.',               ru: 'Доступ к камере запрещён.',                          en: 'Camera permission denied.' },
    errDeniedSub: { uz: "Brauzer manzil paneli yoniga bosing → Kamera → Allow / Ruxsat bering, va qayta urinib ko'ring.",
                    ru: 'Нажмите на адресную строку → Камера → Разрешить, и попробуйте снова.',
                    en: 'Click the address bar → Camera → Allow, then try again.' },
    errUnavail:   { uz: 'Kamera topilmadi. Iltimos, qurilmangizda kamera mavjudligini tekshiring.',
                    ru: 'Камера не найдена. Проверьте, что камера доступна.',
                    en: 'Camera not found. Please check camera availability.' },
    errBusy:      { uz: 'Kamera boshqa ilova tomonidan ishlatilmoqda. Telegram, Zoom kabi ilovalarni yoping.',
                    ru: 'Камера используется другим приложением. Закройте Telegram, Zoom и т.п.',
                    en: 'Camera is used by another app. Close Telegram, Zoom, etc.' },
    errNoFace:    { uz: "Yuz aniqlanmadi. Yorug' joyda yuzingizni doiraga to'g'rilang va qayta urining.",
                    ru: 'Лицо не обнаружено. Встаньте к свету и снова поднесите лицо к кадру.',
                    en: "Face not detected. Move to better lighting and align your face." },
    errInsecure:  { uz: 'Kamera faqat HTTPS sayt orqali ishlaydi.',
                    ru: 'Камера работает только на HTTPS.',
                    en: 'Camera works only on HTTPS sites.' },
    disclaimer:   { uz: "Tavsiyalar maslahat sifatida xizmat qiladi va dermatolog ko'rigi o'rnini bosmaydi.",
                    ru: 'Рекомендации информативные и не заменяют визит к дерматологу.',
                    en: 'Recommendations are informational and do not replace a dermatologist visit.' },
    btnStart:     { uz: 'Skanerni boshlash',                       ru: 'Начать сканирование',                                en: 'Start scan' },
    btnRestart:   { uz: 'Qayta skan',                              ru: 'Заново',                                              en: 'Rescan' },
    btnDone:      { uz: 'Tushunarli ✓',                            ru: 'Готово ✓',                                            en: 'Done ✓' },
    hintAlign:    { uz: "Yuzingizni doiraga to'g'rilang",          ru: 'Поместите лицо в круг',                              en: 'Center your face in the circle' },
    progress:     { uz: 'Skaner ishlamoqda',                       ru: 'Идёт сканирование',                                  en: 'Scanning' },
    analyzing:    { uz: 'AI tahlil qilmoqda…',                     ru: 'AI анализирует…',                                    en: 'AI is analyzing…' },
    analyzingSub: { uz: 'Teri turingiz va ehtiyojlaringiz aniqlanmoqda',
                    ru: 'Определяем тип кожи и потребности',
                    en: 'Detecting your skin type and needs' },
    step1:        { uz: 'Yuz aniqlash',                            ru: 'Распознавание лица',                                 en: 'Face detection' },
    step2:        { uz: 'Teri rangi',                              ru: 'Тон кожи',                                            en: 'Skin tone' },
    step3:        { uz: 'T-zona tahlili',                          ru: 'Анализ T-зоны',                                       en: 'T-zone analysis' },
    step4:        { uz: 'Mos kremlar',                             ru: 'Подбор кремов',                                       en: 'Matching creams' },
    skinLabel:    { uz: 'Aniqlangan teri turi',                    ru: 'Определённый тип кожи',                               en: 'Detected skin type' },
    skinOily:     { uz: "Yog'li teri",                             ru: 'Жирная кожа',                                         en: 'Oily skin' },
    skinDry:      { uz: 'Quruq teri',                              ru: 'Сухая кожа',                                          en: 'Dry skin' },
    skinCombo:    { uz: 'Kombinatsiya',                            ru: 'Комбинированная',                                     en: 'Combination' },
    skinNormal:   { uz: 'Normal teri',                             ru: 'Нормальная кожа',                                     en: 'Normal skin' },
    confidence:   { uz: 'Aniqlik',                                 ru: 'Точность',                                            en: 'Confidence' },
    metricH:      { uz: 'Namlanish',                               ru: 'Увлажнение',                                          en: 'Hydration' },
    metricO:      { uz: "Yog'lilik",                               ru: 'Жирность',                                            en: 'Oiliness' },
    metricR:      { uz: 'Qizarish',                                ru: 'Покраснение',                                         en: 'Redness' },
    statusGood:   { uz: '✓ Yaxshi',                                ru: '✓ Хорошо',                                            en: '✓ Good' },
    statusMid:    { uz: "~ O'rta",                                 ru: '~ Средне',                                            en: '~ Average' },
    statusHigh:   { uz: '! Yuqori',                                ru: '! Высокое',                                           en: '! High' },
    statusLow:    { uz: '! Past',                                  ru: '! Низкое',                                            en: '! Low' },
    concernsLbl:  { uz: 'Asosiy ehtiyojlar:',                      ru: 'Основные потребности:',                              en: 'Main needs:' },
    concMoisture: { uz: '💦 Namlanish',                            ru: '💦 Увлажнение',                                       en: '💦 Hydration' },
    concOily:     { uz: "🛢️ Yog'lilikni nazorat",                  ru: '🛢️ Контроль жирности',                                en: '🛢️ Oil control' },
    concRedness:  { uz: '🔴 Qizarish',                             ru: '🔴 Покраснение',                                      en: '🔴 Redness' },
    concSpots:    { uz: '⚪ Bir tekis ranglilik',                   ru: '⚪ Ровный тон',                                        en: '⚪ Even tone' },
    concBalance:  { uz: '✅ Muvozanat',                             ru: '✅ Баланс',                                            en: '✅ Balanced' },
    recTitle:     { uz: 'Sizga tavsiya etilgan kremlar',           ru: 'Рекомендуемые кремы',                                en: 'Recommended creams' },
    recEmpty:     { uz: 'Hozircha mos mahsulot topilmadi.',        ru: 'Пока не нашли подходящий товар.',                    en: 'No matching products yet.' },
    addedToast:   { uz: "Savatga qo'shildi",                       ru: 'Добавлено в корзину',                                en: 'Added to cart' },
    closeAria:    { uz: 'Yopish',                                  ru: 'Закрыть',                                             en: 'Close' },
  }
  const tx = (key) => (TX[key] && TX[key][lang]) || TX[key]?.uz || key

  /* lock body scroll */
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  /* esc close */
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* fetch products */
  useEffect(() => {
    let alive = true
    fetch(`${API}/products`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (!alive) return
        setProducts(Array.isArray(data) ? data : (data?.data || []))
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  const stopAll = useCallback(() => {
    if (streamRef.current) {
      try { streamRef.current.getTracks().forEach(tr => tr.stop()) } catch {}
      streamRef.current = null
    }
    if (videoRef.current) {
      try { videoRef.current.srcObject = null } catch {}
    }
    Object.values(timersRef.current).forEach(t => {
      try { clearTimeout(t); clearInterval(t) } catch {}
    })
    timersRef.current = {}
    framesRef.current = []
  }, [])

  const handleClose = useCallback(() => {
    stopAll()
    onClose?.()
  }, [stopAll, onClose])

  /* cleanup on unmount */
  useEffect(() => () => stopAll(), [stopAll])

  const captureSingleFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth) return null

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null

    ctx.save()
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    ctx.restore()

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      return analyzeFrame(imageData)
    } catch (err) {
      console.warn('frame capture error', err)
      return null
    }
  }, [])

  const startScan = async () => {
    setError('')

    // Browser support check
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const isSecure = window.isSecureContext || window.location.hostname === 'localhost'
      setError(isSecure ? 'unavailable' : 'insecure')
      return
    }

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
        },
        audio: false,
      })
    } catch (e) {
      console.warn('camera error:', e)
      const name = (e?.name || '').toLowerCase()
      if (name.includes('notallowed') || name.includes('permission')) setError('denied')
      else if (name.includes('notfound') || name.includes('devicesnotfound')) setError('unavailable')
      else if (name.includes('overconstrained')) setError('unavailable')
      else if (name.includes('notreadable') || name.includes('trackstart')) setError('busy')
      else setError('unavailable')
      return
    }

    streamRef.current = stream
    framesRef.current = []
    setProgress(0)
    setStage('scanning')

    // attach stream after stage transition
    setTimeout(async () => {
      const v = videoRef.current
      if (!v || !streamRef.current) return
      v.srcObject = streamRef.current
      v.muted = true
      v.playsInline = true
      try {
        await v.play()
      } catch (playErr) {
        console.warn('autoplay blocked:', playErr)
        // try once more on user interaction (already gave permission)
        try { await v.play() } catch {}
      }
    }, 80)

    // progress animation
    timersRef.current.progress = setInterval(() => {
      setProgress(p => {
        if (p >= 100) return 100
        return Math.min(100, p + (Math.random() * 4 + 2.5))
      })
    }, 130)

    // start capturing frames after a moment (let camera warm up)
    timersRef.current.firstFrame = setTimeout(() => {
      timersRef.current.frames = setInterval(() => {
        const f = captureSingleFrame()
        if (f) framesRef.current.push(f)
      }, 350)
    }, 800)

    // finish after 4s
    timersRef.current.finish = setTimeout(() => {
      clearInterval(timersRef.current.frames)
      clearInterval(timersRef.current.progress)
      setProgress(100)

      // capture a few final frames to ensure data
      for (let i = 0; i < 2; i++) {
        const f = captureSingleFrame()
        if (f) framesRef.current.push(f)
      }

      setStage('analyzing')

      timersRef.current.analyze = setTimeout(() => {
        const result = combineFrames(framesRef.current)
        // stop camera once we have data
        if (streamRef.current) {
          try { streamRef.current.getTracks().forEach(tr => tr.stop()) } catch {}
          streamRef.current = null
        }
        if (videoRef.current) {
          try { videoRef.current.srcObject = null } catch {}
        }
        if (!result) {
          setError('noface')
          setStage('intro')
          return
        }
        setAnalysis(result)
        setStage('result')
      }, 1700)
    }, 4000)
  }

  const handleAdd = (p) => {
    if (!user) { onRequireAuth?.(); handleClose(); return }
    addItem(p)
    addToast(`${p.emoji || '🛍️'} ${tx('addedToast')}`, 'success')
  }

  const restart = () => {
    stopAll()
    setAnalysis(null)
    setError('')
    setProgress(0)
    setStage('intro')
  }

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
              {tx('badge')}
            </span>
            <h2 className="fa-head-title">
              {stage === 'result' ? tx('titleResult') :
               stage === 'scanning' ? tx('titleScan') :
               stage === 'analyzing' ? tx('titleAnalyze') :
               tx('titleIntro')}
            </h2>
          </div>
          <button className="fa-close" onClick={handleClose} aria-label={tx('closeAria')}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

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

              <h3 className="fa-intro-title">{tx('introTitle')}</h3>
              <p className="fa-intro-sub">
                {tx('introSub')}
              </p>

              <ul className="fa-features">
                <li><span className="fa-feature-ico">🔒</span> {tx('feat1')}</li>
                <li><span className="fa-feature-ico">⚡</span> {tx('feat2')}</li>
                <li><span className="fa-feature-ico">🎯</span> {tx('feat3')}</li>
              </ul>

              {error === 'denied' && (
                <div className="fa-error">
                  <span>⚠️</span>
                  <div>
                    <strong>{tx('errDenied')}</strong><br />
                    {tx('errDeniedSub')}
                  </div>
                </div>
              )}
              {error === 'unavailable' && (
                <div className="fa-error">
                  <span>⚠️</span> {tx('errUnavail')}
                </div>
              )}
              {error === 'busy' && (
                <div className="fa-error">
                  <span>⚠️</span> {tx('errBusy')}
                </div>
              )}
              {error === 'noface' && (
                <div className="fa-error">
                  <span>⚠️</span> {tx('errNoFace')}
                </div>
              )}
              {error === 'insecure' && (
                <div className="fa-error">
                  <span>⚠️</span> {tx('errInsecure')}
                </div>
              )}

              <p className="fa-disclaimer">
                {tx('disclaimer')}
              </p>
            </div>
          )}

          {/* SCANNING */}
          {stage === 'scanning' && (
            <div className="fa-scan">
              <div className="fa-cam-wrap">
                <video ref={videoRef} className="fa-video" playsInline muted autoPlay />
                <div className="fa-cam-overlay">
                  <div className="fa-face-frame">
                    <div className="fa-face-corner fa-fc-tl" />
                    <div className="fa-face-corner fa-fc-tr" />
                    <div className="fa-face-corner fa-fc-bl" />
                    <div className="fa-face-corner fa-fc-br" />
                    <div className="fa-scanline" />
                  </div>
                </div>
                <div className="fa-cam-hint">{tx('hintAlign')}</div>
              </div>
              <div className="fa-progress-wrap">
                <div className="fa-progress-info">
                  <span className="fa-progress-label">{tx('progress')}</span>
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
              <p className="fa-think-title">{tx('analyzing')}</p>
              <p className="fa-think-sub">{tx('analyzingSub')}</p>
              <div className="fa-think-steps">
                <span className="fa-think-step active">{tx('step1')}</span>
                <span className="fa-think-step active">{tx('step2')}</span>
                <span className="fa-think-step active">{tx('step3')}</span>
                <span className="fa-think-step active">{tx('step4')}</span>
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
                  <p className="fa-result-label">{tx('skinLabel')}</p>
                  <h3 className="fa-result-type">
                    {analysis.skinType === 'oily' ? tx('skinOily') :
                     analysis.skinType === 'dry' ? tx('skinDry') :
                     analysis.skinType === 'combo' ? tx('skinCombo') : tx('skinNormal')}
                  </h3>
                  <p className="fa-result-conf">
                    {tx('confidence')}: <strong>{analysis.confidence}%</strong>
                  </p>
                </div>
              </div>

              <div className="fa-metrics">
                <Metric label={tx('metricH')} value={analysis.hydration} color="#3b82f6" suffix="%" lang={lang} />
                <Metric label={tx('metricO')} value={analysis.oilLevel}  color="#f59e0b" suffix="%" invert lang={lang} />
                <Metric label={tx('metricR')} value={analysis.rednessLevel} color="#ef4444" suffix="%" invert lang={lang} />
              </div>

              {analysis.concerns?.length > 0 && analysis.concerns[0] !== 'balanced' && (
                <div className="fa-concerns">
                  <p className="fa-concerns-label">{tx('concernsLbl')}</p>
                  <div className="fa-concern-pills">
                    {analysis.concerns.map(c => (
                      <span key={c} className={`fa-concern fa-concern-${c}`}>
                        {c === 'moisture' ? tx('concMoisture') :
                         c === 'oily' ? tx('concOily') :
                         c === 'redness' ? tx('concRedness') :
                         c === 'spots' ? tx('concSpots') :
                         tx('concBalance')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="fa-rec">
                <h4 className="fa-rec-title">
                  <span className="fa-rec-icon">🎯</span>
                  {tx('recTitle')}
                </h4>
                {recommendations.length === 0 ? (
                  <p className="fa-rec-empty">{tx('recEmpty')}</p>
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

        {/* Sticky footer */}
        {stage === 'intro' && (
          <div className="fa-foot">
            <button className="fa-cta" onClick={startScan}>
              <span className="fa-cta-icon">📸</span>
              {tx('btnStart')}
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
              {tx('btnRestart')}
            </button>
            <button className="fa-finish" onClick={handleClose}>{tx('btnDone')}</button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

function Metric({ label, value, color, suffix = '', invert = false, lang = 'uz' }) {
  const status = invert
    ? (value < 30 ? 'good' : value < 60 ? 'mid' : 'high')
    : (value > 70 ? 'good' : value > 40 ? 'mid' : 'low')
  const txt = {
    good: { uz: '✓ Yaxshi', ru: '✓ Хорошо', en: '✓ Good' },
    mid:  { uz: "~ O'rta",  ru: '~ Средне', en: '~ Average' },
    high: { uz: '! Yuqori', ru: '! Высокое', en: '! High' },
    low:  { uz: '! Past',   ru: '! Низкое',  en: '! Low' },
  }
  const label2 = txt[status][lang] || txt[status].uz
  return (
    <div className="fa-metric">
      <div className="fa-metric-top">
        <span className="fa-metric-label">{label}</span>
        <span className={`fa-metric-status fa-metric-${status}`}>{label2}</span>
      </div>
      <div className="fa-metric-bar">
        <div className="fa-metric-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <p className="fa-metric-val">{value}{suffix}</p>
    </div>
  )
}

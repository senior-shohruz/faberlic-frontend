import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const STEPS = [
  {
    id: 'skin',
    title: 'Teri turingiz qanday?',
    subtitle: 'Eng mos skincare mahsulotlarini topamiz',
    options: [
      { id: 'normal', label: 'Normal', desc: 'Muammosiz, tekis', icon: '✨' },
      { id: 'dry',    label: 'Quruq',  desc: 'Tarang, quriydi',  icon: '🌵' },
      { id: 'oily',   label: "Yog'li", desc: 'Yiltillab turadi', icon: '💧' },
      { id: 'combo',  label: 'Kombinatsiya', desc: "T-zona yog'li, chekka quruq", icon: '🔄' },
    ],
  },
  {
    id: 'problem',
    title: 'Asosiy muammoingiz?',
    subtitle: '2 tagacha tanlashingiz mumkin',
    multi: true,
    options: [
      { id: 'moisture', label: 'Namlanish',  desc: 'Teri qurib ketadi',    icon: '💦' },
      { id: 'acne',     label: 'Husnbuzar',  desc: 'Toshmalar, qizarishlar', icon: '😔' },
      { id: 'aging',    label: 'Ajinlar',    desc: 'Yosharish, tonlash',   icon: '⏳' },
      { id: 'spots',    label: "Dog'lar",    desc: "Qoramtir, qo'ng'ir dog'lar", icon: '🔵' },
    ],
  },
  {
    id: 'age',
    title: 'Yoshingiz?',
    subtitle: 'Yoshga mos formula tavsiya qilamiz',
    options: [
      { id: '18', label: '18–25', desc: 'Yosh teri, profilaktika', icon: '🌱' },
      { id: '26', label: '26–35', desc: 'Aktiv parvarish',         icon: '🌿' },
      { id: '36', label: '36–45', desc: 'Intensiv parvarish',      icon: '🍃' },
      { id: '45', label: '45+',   desc: 'Anti-aging formula',      icon: '🌳' },
    ],
  },
]

function scoreProduct(p, answers) {
  let score = 0
  const name = (p.name || '').toLowerCase()
  const cat  = (p.category || '').toLowerCase()
  const tags = ((p.badges || []).join(' ')).toLowerCase()

  if (answers.skin === 'dry'   && (name.includes('namlov') || name.includes('quruq') || name.includes('krem') || tags.includes('namlov'))) score += 3
  if (answers.skin === 'oily'  && (cat === 'gigiena' || name.includes('tozalov') || name.includes('toza'))) score += 2
  if (answers.skin === 'combo' && cat === 'kosmetika') score += 1
  if (answers.skin === 'normal') score += 0.5

  const probs = Array.isArray(answers.problem) ? answers.problem : [answers.problem].filter(Boolean)
  if (probs.includes('moisture') && (name.includes('namlov') || name.includes('krem') || name.includes('serum') || name.includes('losy'))) score += 4
  if (probs.includes('acne')     && (cat === 'gigiena' || name.includes('tosh') || name.includes('tozalov'))) score += 4
  if (probs.includes('aging')    && (name.includes('kollag') || name.includes('45') || name.includes('yoshart') || name.includes('peptid') || name.includes('anti'))) score += 5
  if (probs.includes('spots')    && (name.includes('oqart') || name.includes("dog'") || name.includes('vitamin'))) score += 4

  if (answers.age === '45' && (name.includes('45+') || name.includes('kollag') || name.includes('intensiv'))) score += 3
  if (answers.age === '36' && (cat === 'kosmetika' || name.includes('intensiv'))) score += 2
  if (answers.age === '26' && cat === 'kosmetika') score += 1
  if (answers.age === '18' && (tags.includes('yangi') || cat === 'gigiena')) score += 1

  if (cat === 'kosmetika') score += 0.5
  if ((p.discount || 0) >= 40) score += 1

  return score
}

export default function SkinQuiz({ onClose, onRequireAuth }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({ skin: null, problem: [], age: null })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const { addItem } = useCart()
  const { user } = useAuth()
  const { addToast } = useToast()

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const cur = STEPS[step]

  function select(id) {
    if (cur.multi) {
      setAnswers(a => {
        const arr = a.problem.includes(id)
          ? a.problem.filter(x => x !== id)
          : a.problem.length < 2 ? [...a.problem, id] : a.problem
        return { ...a, problem: arr }
      })
    } else {
      setAnswers(a => ({ ...a, [cur.id]: id }))
    }
  }

  function isSelected(id) {
    return cur.multi ? answers.problem.includes(id) : answers[cur.id] === id
  }

  function canNext() {
    if (cur.multi) return answers.problem.length > 0
    return answers[cur.id] !== null
  }

  async function next() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      setLoading(true)
      try {
        const res = await fetch(`${API}/products`)
        const data = await res.json()
        const all = Array.isArray(data) ? data : (data.data || [])
        const scored = all
          .map(p => ({ ...p, _score: scoreProduct(p, answers) }))
          .filter(p => p._score > 0)
          .sort((a, b) => b._score - a._score)
          .slice(0, 8)
        setResults(scored)
      } catch {
        setResults([])
      }
      setLoading(false)
    }
  }

  function handleAdd(p) {
    if (!user) { onRequireAuth?.(); onClose(); return }
    addItem(p)
    addToast(`${p.emoji || '🛍️'} Savatga qo'shildi`, 'success')
  }

  const progress = ((step + (results !== null ? 1 : 0)) / STEPS.length) * 100

  return (
    <div className="quiz-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="quiz-modal">

        {/* Header */}
        <div className="quiz-header">
          <div className="quiz-header-left">
            <span className="quiz-badge">✨ AI Skincare</span>
            <p className="quiz-header-title">Teri tahlili</p>
          </div>
          <button className="quiz-close" onClick={onClose}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Progress */}
        <div className="quiz-progress-track">
          <div className="quiz-progress-fill" style={{ width: `${results !== null ? 100 : progress}%` }} />
        </div>

        {/* Content */}
        <div className="quiz-body">
          {loading ? (
            <div className="quiz-loading">
              <div className="quiz-loading-ring" />
              <p>Tahlil qilinmoqda...</p>
            </div>
          ) : results !== null ? (
            <div className="quiz-results">
              <div className="quiz-results-hero">
                <div className="quiz-results-icon">🎯</div>
                <h3>Sizga mos mahsulotlar</h3>
                <p>{results.length} ta tavsiya topildi</p>
              </div>
              <div className="quiz-results-grid">
                {results.length === 0
                  ? <p className="quiz-no-res">Mahsulot topilmadi. Admin yangi mahsulot qo'shsin.</p>
                  : results.map(p => (
                    <div key={p.id} className="quiz-prod-card">
                      <div className="quiz-prod-thumb">
                        {p.image ? <img src={p.image} alt={p.name} /> : <span>{p.emoji || '🛍️'}</span>}
                      </div>
                      <div className="quiz-prod-info">
                        <p className="quiz-prod-name">{p.name}</p>
                        <p className="quiz-prod-cat">{p.category}</p>
                        <div className="quiz-prod-bottom">
                          <span className="quiz-prod-price">{p.price?.toLocaleString()} UZS</span>
                          {p.discount > 0 && <span className="quiz-prod-disc">-{p.discount}%</span>}
                        </div>
                      </div>
                      <button className="quiz-add-btn" onClick={() => handleAdd(p)}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                      </button>
                    </div>
                  ))
                }
              </div>
              <div className="quiz-results-footer">
                <button className="quiz-retry" onClick={() => { setStep(0); setAnswers({ skin: null, problem: [], age: null }); setResults(null) }}>
                  Qaytadan test berish
                </button>
                <button className="quiz-cta" onClick={onClose}>Barcha mahsulotlar →</button>
              </div>
            </div>
          ) : (
            <div className="quiz-step">
              <div className="quiz-step-num">
                {step + 1} / {STEPS.length}
              </div>
              <h2 className="quiz-step-title">{cur.title}</h2>
              <p className="quiz-step-sub">{cur.subtitle}</p>
              <div className="quiz-options">
                {cur.options.map(opt => (
                  <button
                    key={opt.id}
                    className={`quiz-option${isSelected(opt.id) ? ' selected' : ''}`}
                    onClick={() => select(opt.id)}
                  >
                    <span className="quiz-opt-icon">{opt.icon}</span>
                    <div className="quiz-opt-text">
                      <strong>{opt.label}</strong>
                      <small>{opt.desc}</small>
                    </div>
                    <span className="quiz-opt-check">
                      {isSelected(opt.id) && <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>}
                    </span>
                  </button>
                ))}
              </div>
              <div className="quiz-nav">
                {step > 0 && (
                  <button className="quiz-back" onClick={() => setStep(s => s - 1)}>
                    ← Orqaga
                  </button>
                )}
                <button
                  className="quiz-next"
                  disabled={!canNext()}
                  onClick={next}
                >
                  {step === STEPS.length - 1 ? '✨ Natijani ko\'rish' : 'Davom etish →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

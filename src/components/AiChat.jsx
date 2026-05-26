import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../context/LanguageContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/* ────────────────────────────────────────────────
   Smart local AI router — keyword + intent matching
   Kelajakda real LLM API'ga (OpenAI, Groq) ham ulanadi
   ──────────────────────────────────────────────── */

const QUICK_PROMPTS = [
  { id: 'recommend', text: 'Menga krem tavsiya qiling', icon: '✨' },
  { id: 'delivery', text: 'Yetkazib berish qancha?', icon: '🚚' },
  { id: 'payment', text: "To'lov qanday qilinadi?", icon: '💳' },
  { id: 'oily', text: "Yog'li teri uchun nima?", icon: '💧' },
  { id: 'dry', text: 'Quruq teri parvarishi', icon: '🌵' },
  { id: 'spots', text: "Husnbuzar uchun krem", icon: '⚪' },
  { id: 'antiage', text: 'Yoshartiruvchi krem', icon: '⏳' },
  { id: 'price', text: 'Eng arzon mahsulotlar', icon: '🏷️' },
]

const KEYWORDS = {
  greeting: ['salom', 'assalom', 'hi', 'hello', 'привет', 'здравствуйте', "yaxshimisiz"],
  delivery: ['yetkazib', 'yetkazish', 'dostavka', 'kelta', 'olib kel', 'tezda', "qachon", 'qachongacha', 'доставка', 'привезу', 'delivery'],
  payment: ["to'lov", 'tolov', 'tulov', 'pul', 'naqd', 'karta', 'plastik', 'click', 'payme', 'оплата', 'pay', 'payment'],
  pickup: ['punkt', 'olib ket', 'olib oli', 'where', 'qaerdan', 'manzil', 'samovыvoz', 'самовывоз'],
  return: ['qaytar', 'qaytarish', 'return', 'возврат', 'обмен'],
  guarantee: ['kafolat', 'guarantee', 'гарантия', 'sifat', 'sifatli'],
  account: ['profil', 'hisob', 'akkaunt', "ro'yxat", 'login', 'регистрация'],
  oily: ["yog'li", 'yogli', 'жирная', 'oily', 'mat', 'yaltir'],
  dry: ['quruq', 'quri', 'dry', 'сухая', 'tarang'],
  combo: ['kombinatsiya', 'aralash', 'combo', 'kombo', 'смешанная'],
  acne: ['toshma', 'acne', 'husnbuzar', 'pryshchi', 'прыщи', 'tosh'],
  spots: ["dog'", 'dog', 'oqart', 'spots', 'pigmentat', 'пигмент', 'qoramt'],
  antiage: ['ajin', 'yoshart', 'anti-age', 'antiage', 'kollag', 'collagen', "qaridi", 'старение', 'морщины'],
  hydration: ['namlov', 'namlanish', 'hydra', 'moistur', 'влаг', 'oziq'],
  cheap: ['arzon', 'cheap', 'дешев', 'narxi past', "yog'on"],
  recommend: ['tavsiya', "tafsiya", 'recommend', 'mos', 'qaysi', 'qanday', 'рекоменд', 'mensa'],
  perfume: ['atir', 'parfyum', 'parfum', 'parfumeriya', 'духи', 'perfume', 'hid'],
  hair: ['soch', 'shamp', 'shampun', 'hair', 'волос'],
  search: ['qidir', 'topi', 'find', 'search', 'найди', 'поиск'],
  thanks: ['rahmat', 'спасибо', 'thank', 'thanks', 'tushunarli', 'rasm bo\'ldi'],
  bye: ['xayr', 'salomat', 'до свидания', 'bye'],
}

const RESPONSES = {
  greeting: [
    "Salom! 👋 Men Premium Store AI yordamchisiman. Sizga qanday yordam bera olaman?",
    "Assalomu alaykum! Mahsulot tanlash, yetkazib berish yoki teri parvarishi haqida so'rang.",
  ],
  delivery: [
    "🚚 Yetkazib berish:\n• Toshkent shahri ichida — 1 kun\n• Viloyatlar — 2-4 kun\n• Olib ketish punktlaridan — bepul\nBuyurtmangizni admin tasdiqlagandan so'ng yo'lga qo'yamiz.",
  ],
  payment: [
    "💳 To'lov turlari:\n• Naqd pul — buyurtmani olganda\n• Bank kartasi — pul o'tkazma orqali\nIstalganini tanlashingiz mumkin. Karta orqali to'lov tafsilotlari operatorimiz orqali yuboriladi.",
  ],
  pickup: [
    "📍 Olib ketish punktlari:\n• Toshkent — bir nechta filiali\n• Ish vaqti: dushanbadan-shanba 09:00-20:00\nCheckout vaqtida punktni tanlashingiz mumkin.",
  ],
  return: [
    "↩️ Qaytarish:\n14 kun ichida ochilmagan mahsulotlarni qaytarish mumkin. Barcha kremlar va kosmetika sifat kafolatiga ega.",
  ],
  guarantee: [
    "🛡️ Mahsulotlarimiz:\n• Faqat asl Premium Store mahsulotlari\n• Sertifikat bilan\n• Sifat kafolati\n• 14 kunlik qaytarish",
  ],
  account: [
    "👤 Hisob:\nYuqori o'ngdagi 'Kirish' tugmasini bosing va Email/Parol orqali ro'yxatdan o'ting. Buyurtmalaringiz 'Buyurtmalarim' bo'limida saqlanadi.",
  ],
  thanks: [
    "Sog' bo'ling! 🌸 Yana boshqa savol bo'lsa, so'rang.",
    "Marhamat! 💖 Xaridingiz muvofaqiyatli bo'lsin.",
  ],
  bye: [
    "Xayr, sog' bo'ling! ✨ Premium Store doimo siz bilan.",
  ],
  fallback: [
    "Tushundim, lekin aniq javob berish uchun savolingizni biroz aniqroq yozsangiz. Yoki pastdagi tezkor savollarni tanlang ⬇️",
    "Buni hozircha aniq bilolmadim. Sizga mahsulot tavsiya qilishimni, narxlarni ko'rsatishimni, yoki yetkazib berish haqida so'rashingiz mumkin.",
  ],
}

const SKIN_INTENT = {
  oily: { type: 'oily', terms: ['toza', 'mat', 'lab', 'gigiena'] },
  dry: { type: 'dry', terms: ['namlov', 'krem', 'serum', 'losy', 'oziq'] },
  combo: { type: 'combo', terms: ['krem', 'serum'] },
  acne: { type: 'acne', terms: ['toza', 'lab', 'tosh'] },
  spots: { type: 'spots', terms: ['oqart', 'vitamin'] },
  antiage: { type: 'antiage', terms: ['kollag', 'yoshart', 'peptid', 'anti', '45'] },
  hydration: { type: 'hydration', terms: ['namlov', 'krem', 'serum'] },
  recommend: { type: 'recommend', terms: ['krem', 'serum', 'kollag', 'namlov'] },
  perfume: { type: 'perfume', terms: ['atir', 'parfyum'] },
  hair: { type: 'hair', terms: ['shamp', 'soch'] },
}

function detectIntents(text) {
  const lower = text.toLowerCase()
  const found = []
  for (const [intent, words] of Object.entries(KEYWORDS)) {
    for (const w of words) {
      if (lower.includes(w)) {
        if (!found.includes(intent)) found.push(intent)
        break
      }
    }
  }
  return found
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/* ────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────── */
export default function AiChat({ onClose, onRequireAuth }) {
  const [messages, setMessages] = useState([
    {
      id: 'm0',
      role: 'ai',
      text: "Salom! 👋 Men Premium Store AI yordamchisiman.\n\nSizga teringizga mos kremlarni tavsiya qilaman, mahsulot, narx, yetkazib berish va boshqa savollaringizga javob beraman.",
      ts: Date.now(),
    }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [products, setProducts] = useState([])
  const listRef = useRef(null)
  const inputRef = useRef(null)
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
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  /* fetch products once */
  useEffect(() => {
    fetch(`${API}/products`).then(r => r.json()).then(data => {
      setProducts(Array.isArray(data) ? data : (data?.data || []))
    }).catch(() => setProducts([]))
  }, [])

  /* auto scroll */
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, typing])

  /* focus input */
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200)
  }, [])

  const findProductsForIntent = useCallback((intent, limit = 4) => {
    const cfg = SKIN_INTENT[intent]
    if (!cfg) return []
    const scored = products.map(p => {
      const name = (p.name || '').toLowerCase()
      const cat = (p.category || '').toLowerCase()
      let score = 0
      for (const term of cfg.terms) {
        if (name.includes(term)) score += 2
        if (cat.includes(term)) score += 1
      }
      if (intent === 'antiage' && (name.includes('45') || name.includes('kollag'))) score += 3
      if (intent === 'hydration' && name.includes('namlov')) score += 3
      if (intent === 'oily' && cat.includes('gigiena')) score += 2
      if (intent === 'spots' && name.includes('oqart')) score += 3
      if (intent === 'perfume' && cat.includes('parfyum')) score += 5
      if (intent === 'hair' && name.includes('shamp')) score += 5
      if ((p.discount || 0) >= 40) score += 0.5
      return { ...p, _s: score }
    }).filter(p => p._s > 0)
      .sort((a, b) => b._s - a._s)
      .slice(0, limit)
    return scored
  }, [products])

  const findCheap = useCallback((limit = 4) => {
    return [...products]
      .sort((a, b) => (a.price || 0) - (b.price || 0))
      .slice(0, limit)
  }, [products])

  const findBySearch = useCallback((q, limit = 4) => {
    const lower = q.toLowerCase().trim()
    if (lower.length < 3) return []
    return products
      .filter(p =>
        (p.name || '').toLowerCase().includes(lower) ||
        (p.category || '').toLowerCase().includes(lower)
      )
      .slice(0, limit)
  }, [products])

  const buildResponse = useCallback((userText) => {
    const intents = detectIntents(userText)

    // No intent → search products by user words OR fallback
    if (intents.length === 0) {
      const found = findBySearch(userText, 4)
      if (found.length > 0) {
        return {
          text: `"${userText.trim()}" bo'yicha topilgan mahsulotlar:`,
          products: found,
        }
      }
      return { text: pick(RESPONSES.fallback) }
    }

    // Greetings / chat-only intents
    const chatOnly = ['greeting', 'delivery', 'payment', 'pickup', 'return', 'guarantee', 'account', 'thanks', 'bye']
    const ci = intents.find(i => chatOnly.includes(i))
    if (ci && intents.length === 1) {
      return { text: pick(RESPONSES[ci]) }
    }

    // Cheap products
    if (intents.includes('cheap') || intents.includes('price')) {
      const cheap = findCheap(4)
      return {
        text: '🏷️ Eng arzon mahsulotlarimiz:',
        products: cheap,
      }
    }

    // Skin / product based intents — find best match
    const productIntent = intents.find(i => SKIN_INTENT[i])
    if (productIntent) {
      const found = findProductsForIntent(productIntent, 4)
      if (found.length > 0) {
        const intro = {
          oily: "Yog'li teri uchun mat va tozalovchi mahsulotlar tavsiya qilaman:",
          dry: 'Quruq teri uchun namlovchi va krem mahsulotlar:',
          combo: 'Kombinatsiya teri uchun balansli kremlar:',
          acne: 'Husnbuzarga qarshi tozalovchi mahsulotlar:',
          spots: "Dog'larga qarshi va oqartiruvchi mahsulotlar:",
          antiage: 'Yoshartiruvchi va anti-age kremlar:',
          hydration: 'Namlanish uchun eng yaxshi mahsulotlar:',
          recommend: 'Sizga tavsiya qiladigan mahsulotlar:',
          perfume: 'Atir kolleksiyamizdan:',
          hair: 'Soch parvarishi mahsulotlari:',
        }[productIntent] || 'Sizga mos mahsulotlar:'
        return { text: intro, products: found }
      }
    }

    // Combined: chat + product (e.g. "salom + krem tavsiya")
    if (ci) return { text: pick(RESPONSES[ci]) }

    return { text: pick(RESPONSES.fallback) }
  }, [findBySearch, findCheap, findProductsForIntent])

  const sendMessage = useCallback((rawText) => {
    const text = (rawText ?? input).trim()
    if (!text) return
    setInput('')
    const userMsg = { id: `u${Date.now()}`, role: 'user', text, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setTyping(true)

    const delay = 700 + Math.random() * 600
    setTimeout(() => {
      const reply = buildResponse(text)
      const aiMsg = {
        id: `a${Date.now()}`,
        role: 'ai',
        text: reply.text,
        products: reply.products,
        ts: Date.now(),
      }
      setMessages(prev => [...prev, aiMsg])
      setTyping(false)
    }, delay)
  }, [input, buildResponse])

  const handleAdd = (p) => {
    if (!user) {
      onRequireAuth?.()
      onClose?.()
      return
    }
    addItem(p)
    addToast(`${p.emoji || '🛍️'} Savatga qo'shildi`, 'success')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleQuick = (p) => {
    sendMessage(p.text)
  }

  const handleReset = () => {
    setMessages([{
      id: 'm0',
      role: 'ai',
      text: "Yangi suhbat boshladik! 🌟 Sizga qanday yordam bera olaman?",
      ts: Date.now(),
    }])
  }

  return createPortal(
    <div className="ac-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="ac-modal">

        {/* Header */}
        <div className="ac-head">
          <div className="ac-head-left">
            <div className="ac-avatar">
              <span className="ac-avatar-status" />
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M12 2L13.5 7L18.5 8L15 11.5L16 16.5L12 14L8 16.5L9 11.5L5.5 8L10.5 7Z" fill="currentColor" stroke="none"/>
              </svg>
            </div>
            <div>
              <h2 className="ac-name">
                Premium AI
                <span className="ac-badge">BETA</span>
              </h2>
              <p className="ac-status">
                <span className="ac-dot" />
                Onlayn — har doim yordamga tayyor
              </p>
            </div>
          </div>
          <div className="ac-head-actions">
            <button className="ac-icon-btn" onClick={handleReset} title="Yangi suhbat">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
              </svg>
            </button>
            <button className="ac-icon-btn ac-close" onClick={onClose} title="Yopish">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="ac-list" ref={listRef}>
          {messages.map(m => (
            <div key={m.id} className={`ac-msg ac-msg-${m.role}`}>
              {m.role === 'ai' && (
                <div className="ac-msg-avatar">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L13.5 7L18.5 8L15 11.5L16 16.5L12 14L8 16.5L9 11.5L5.5 8L10.5 7Z"/>
                  </svg>
                </div>
              )}
              <div className="ac-msg-body">
                <p className="ac-msg-text">{m.text}</p>
                {m.products?.length > 0 && (
                  <div className="ac-products">
                    {m.products.map(p => (
                      <div key={p.id} className="ac-product">
                        <div className="ac-prod-thumb">
                          {p.image ? <img src={p.image} alt={p.name} /> : <span>{p.emoji || '🛍️'}</span>}
                        </div>
                        <div className="ac-prod-info">
                          <p className="ac-prod-name">{p.name}</p>
                          <div className="ac-prod-bottom">
                            <span className="ac-prod-price">{p.price?.toLocaleString()} UZS</span>
                            {p.discount > 0 && <span className="ac-prod-disc">-{p.discount}%</span>}
                          </div>
                        </div>
                        <button className="ac-prod-add" onClick={() => handleAdd(p)} aria-label="Savatga">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {typing && (
            <div className="ac-msg ac-msg-ai ac-msg-typing">
              <div className="ac-msg-avatar">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L13.5 7L18.5 8L15 11.5L16 16.5L12 14L8 16.5L9 11.5L5.5 8L10.5 7Z"/>
                </svg>
              </div>
              <div className="ac-msg-body">
                <div className="ac-typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick prompts (only if first conversation) */}
        {messages.length <= 1 && !typing && (
          <div className="ac-quick">
            <p className="ac-quick-label">💡 Tezkor savollar</p>
            <div className="ac-quick-grid">
              {QUICK_PROMPTS.map(p => (
                <button key={p.id} className="ac-quick-btn" onClick={() => handleQuick(p)}>
                  <span className="ac-quick-icon">{p.icon}</span>
                  <span>{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form className="ac-input-wrap" onSubmit={e => { e.preventDefault(); sendMessage() }}>
          <div className="ac-input-inner">
            <input
              ref={inputRef}
              type="text"
              className="ac-input"
              placeholder="Savolingizni yozing..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={typing}
            />
            <button
              type="submit"
              className="ac-send"
              disabled={!input.trim() || typing}
              aria-label="Yuborish"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <p className="ac-hint">AI javoblari ma'lumot uchun. Mahsulot tavsiyalari avtomatik tanlanadi.</p>
        </form>

      </div>
    </div>,
    document.body
  )
}

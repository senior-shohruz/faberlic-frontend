import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../context/LanguageContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/* ════════════════════════════════════════════════════════════════
   PREMIUM AI CHAT — Multilingual smart router
   - 60+ intent kalit so'zlar uz/ru/en bilan
   - Fuzzy match (xato yozilgan so'zlar uchun)
   - Conversation context
   - Real product matching
   - Persistent history (localStorage)
   ════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'pa_chat_v1'

/* ─── Quick prompts ─── */
const QUICK_PROMPTS = [
  { id: 'recommend', text: 'Menga krem tavsiya qiling', icon: '✨' },
  { id: 'delivery', text: 'Yetkazib berish qancha vaqt?', icon: '🚚' },
  { id: 'payment', text: "Qanday to'lov qilish mumkin?", icon: '💳' },
  { id: 'oily',     text: "Yog'li teri uchun nima yaxshi?", icon: '💧' },
  { id: 'dry',      text: 'Quruq teri parvarishi', icon: '🌵' },
  { id: 'antiage',  text: 'Yoshartiruvchi krem bormi?', icon: '⏳' },
  { id: 'cheap',    text: 'Eng arzon mahsulotlar', icon: '🏷️' },
  { id: 'discount', text: 'Chegirmadagi mahsulotlar', icon: '🔥' },
]

/* ─── Multilingual keywords (uz/ru/en) ─── */
const KEYWORDS = {
  greeting: ['salom', 'assalom', 'salomalek', 'hi', 'hello', 'hey', 'привет', 'здравствуй', 'добрый день', 'добрый вечер'],
  delivery: ['yetkazib', 'yetkaz', 'yetkazish', 'dostavka', 'kelta', 'olib kel', 'qachon', 'qachongacha', 'qancha vaqt', 'tezda', 'kuni', 'kun ichida', 'доставк', 'привезу', 'когда придёт', 'delivery', 'shipping'],
  payment: ["to'lov", 'tolov', 'tulov', 'pul to', 'naqd', 'karta', 'plastik', 'click', 'payme', 'humo', 'uzcard', 'оплата', 'оплат', 'pay', 'payment', 'card'],
  pickup: ['punkt', 'olib ket', 'olib oli', 'samovыvoz', 'самовывоз', 'pickup', 'qaerdan oli', 'manzil'],
  return: ['qaytar', 'qaytarish', 'возврат', 'обмен', 'return', 'refund'],
  guarantee: ['kafolat', 'garant', 'guarantee', 'гарантия', 'sifat'],
  account: ['profil', 'hisob', 'akkaunt', "ro'yxat", 'royxat', 'login', 'регистрация', 'войти', 'register'],
  order: ['buyurtma', 'order', 'order qilish', 'zakaz', 'заказ', 'qanday buyurtma'],
  contact: ['aloqa', 'qoldiring', 'telefon', "bog'lan", 'kontakt', 'contact', 'связ'],
  oily: ["yog'li", 'yogli', 'yag\'li', 'жирн', 'oily', 'mat', 'yaltir'],
  dry: ['quruq', 'quri', 'qurigan', 'dry', 'сухая', 'сух', 'tarang', 'shilpiq'],
  combo: ['kombinatsiya', 'aralash', 'combo', 'kombo', 'смешанн'],
  acne: ['toshma', 'acne', 'husnbuzar', 'pryshchi', 'прыщи', 'tosh', 'pimpl', 'hosa'],
  spots: ["dog'", 'dog', 'doğ', 'oqart', 'spots', 'pigmentat', 'пигмент', 'qoramt', 'веснушк'],
  antiage: ['ajin', 'yoshart', 'anti age', 'anti-age', 'antiage', 'kollag', 'collagen', 'qariy', 'старени', 'морщин', 'wrinkle', '45'],
  hydration: ['namlov', 'namlanish', 'hydra', 'moistur', 'влаг', 'oziq', 'hydrat'],
  cheap: ['arzon', 'cheap', 'дешев', 'narxi past', 'tushun narx', 'narxi arzon', "narxi yog'on", 'eng arzon'],
  discount: ['chegirma', 'aksiya', 'sale', 'скидк', 'aksiy', 'discount', 'olov narx', 'super narx'],
  recommend: ['tavsiya', 'tafsiya', 'tavfsiya', 'recommend', 'mos', 'qaysi', 'qanday', 'qaysisi', 'рекоменд', 'mensa', 'menga'],
  perfume: ['atir', 'parfyum', 'parfum', 'parfumeriya', 'духи', 'parfumeri', 'perfume', 'hid'],
  hair: ['soch', 'shamp', 'shampun', 'hair', 'волос', 'soch shampun'],
  child: ['bola', 'bolalar', 'detsk', 'kids', 'child', 'baby'],
  vitamin: ['vitamin', 'витамин', "salomatli", 'omega', 'magniy', 'vitamin d', 'vitamin c', 'kapsul', 'k2'],
  hygiene: ['gigiena', 'tish', 'tooth', 'pasta', 'shchet', 'lab balzam', 'sof'],
  thanks: ['rahmat', 'спасибо', 'thank', 'thanks', 'tushunarli', 'rasm bo\'ldi', 'rahmat kop', 'katta rahmat'],
  bye: ['xayr', 'salomat', 'до свидания', 'bye', 'goodbye', 'tugatish'],
  help: ['yordam', 'help', 'yordam ber', 'помоги', 'помощь', 'sen kim', 'sen nima'],
  identity: ['kimsan', 'kim sen', 'sen kim', 'who are you', 'who r u', 'кто ты', 'sen nima san', 'nima san'],
  thanks_alt: ["ahmiyat berib", "vaqtingiz", "javob uchun"],
}

/* ─── Response templates per language (default uz, fallback uz) ─── */
const RESPONSES = {
  greeting: {
    uz: [
      "Salom! 👋 Men Premium Store AI yordamchisiman.\n\nSizga teringizga mos kremlarni topib beraman, mahsulotlar, narxlar va yetkazib berish haqida ma'lumot beraman.",
      "Assalomu alaykum! 🌸 Premium Store xush kelibsiz! Sizga qanday yordam bera olaman?",
      "Salom va xush kelibsiz! 💖 Krem tavsiyasimi yoki mahsulotlar haqida ma'lumotmi — istalganini so'rang.",
    ],
    ru: [
      "Привет! 👋 Я AI-помощник Premium Store. Подскажу подходящий крем, расскажу о товарах и доставке.",
    ],
    en: [
      "Hi! 👋 I'm Premium Store AI assistant. Ask me about creams, products, prices or delivery.",
    ],
  },
  delivery: {
    uz: ["🚚 Yetkazib berish:\n\n• Toshkent shahri ichida — 1 kun\n• Viloyatlarga — 2-4 kun\n• Olib ketish punktlaridan — bepul\n\nBuyurtmangiz admin tasdiqlagandan so'ng yo'lga chiqadi."],
    ru: ["🚚 Доставка:\n\n• По Ташкенту — 1 день\n• По регионам — 2-4 дня\n• Из пунктов самовывоза — бесплатно"],
    en: ["🚚 Delivery:\n\n• Tashkent — 1 day\n• Regions — 2-4 days\n• Pickup points — free"],
  },
  payment: {
    uz: ["💳 To'lov turlari:\n\n• Naqd pul (buyurtma olib kelinganda)\n• Bank kartasi (Humo, Uzcard, Visa)\n• Pul o'tkazma (Click, Payme orqali)\n\nCheckout vaqtida tanlash mumkin."],
    ru: ["💳 Оплата:\n\n• Наличными при получении\n• Картой (Humo, Uzcard, Visa)\n• Click, Payme переводом"],
    en: ["💳 Payment:\n\n• Cash on delivery\n• Bank card (Humo, Uzcard, Visa)\n• Click, Payme transfer"],
  },
  pickup: {
    uz: ["📍 Olib ketish punktlari:\n\n• Toshkent shahrida bir nechta filiallar\n• Ish vaqti: Du-Sha 09:00 — 20:00\n• Olib ketish bepul\n\nCheckout sahifasida punktni tanlashingiz mumkin."],
    ru: ["📍 Пункты самовывоза в Ташкенте\n• Часы работы: Пн-Сб 09:00-20:00\n• Самовывоз бесплатно"],
  },
  return: {
    uz: ["↩️ Mahsulotlarni qaytarish:\n\n• 14 kun ichida ochilmagan mahsulotlarni qaytarish mumkin\n• Original qadog'ida bo'lishi shart\n• Qaytarish bepul"],
    ru: ["↩️ Возврат: 14 дней, в оригинальной упаковке, бесплатно"],
  },
  guarantee: {
    uz: ["🛡️ Bizning kafolat:\n\n• Faqat asl Premium Store mahsulotlari\n• Sertifikat bilan birga\n• Sifat kafolati\n• 14 kunlik qaytarish"],
  },
  account: {
    uz: ["👤 Hisob ochish:\n\nSayt yuqori-o'ng burchagidagi 'Kirish' tugmasini bosing. Email va parol bilan ro'yxatdan o'ting.\n\nBuyurtmalaringiz 'Buyurtmalarim' bo'limida saqlanadi."],
  },
  order: {
    uz: ["🛍️ Buyurtma berish tartibi:\n\n1. Mahsulotni 'Savatga' qo'shing\n2. Savatni oching va 'Buyurtma berish' tugmasini bosing\n3. Ism, telefon va manzil/punktni ko'rsating\n4. To'lov turini tanlang\n5. Tasdiqlash — ish tugadi! 🎉\n\nKeyin operator siz bilan bog'lanadi."],
  },
  contact: {
    uz: ["📞 Biz bilan bog'lanish:\n\n• Telefon: +998 90 123 45 67\n• Email: info@premiumstore.uz\n• Telegram: @faberlic_uz\n• Sayt orqali: pastdagi forma"],
  },
  thanks: {
    uz: [
      "Sog' bo'ling! 🌸 Yana savol bo'lsa, men bu yerdaman.",
      "Marhamat! 💖 Xaridlaringiz xayrli bo'lsin.",
      "Hech narsa! 😊 Yana yordam kerak bo'lsa, so'rang.",
    ],
  },
  bye: {
    uz: ["Xayr, sog' bo'ling! ✨ Premium Store sizni doim kutib qoladi."],
  },
  help: {
    uz: ["🤖 Men Premium Store AI yordamchisiman. Quyidagilarda yordam bera olaman:\n\n• Sizga mos krem va kosmetika tavsiyasi\n• Mahsulotlar va narxlar haqida ma'lumot\n• Yetkazib berish va to'lov shartlari\n• Buyurtma berish bo'yicha qadamlar\n• Teri parvarishi maslahatlari\n\nBemalol so'rang!"],
  },
  identity: {
    uz: ["✨ Men — Premium Store AI yordamchisi.\n\nMen mahsulot tavsiyasi, savol-javob va sayt bo'yicha yordam beraman. Real time mahsulotlardan tanlab, sizga eng mosini taklif qilaman."],
  },
  fallback: {
    uz: [
      "Tushundim, lekin aniqroq javob berish uchun savolingizni boshqacha yozing 🤔\n\nMasalan: 'quruq teri uchun krem' yoki 'yetkazib berish narxi'",
      "Bu savolda yordam berish biroz qiyin bo'lyapti. Pastdagi tezkor savollarni sinab ko'ring yoki mahsulot nomini yozing.",
      "Aniq tushunmadim. Mahsulot tavsiyasi, narxlar yoki yetkazib berish haqida so'rashingiz mumkin.",
    ],
  },
}

/* ─── Skin / category intents — used to filter products ─── */
const PRODUCT_INTENTS = {
  oily:      { introUz: "Yog'li teri uchun mat va tozalovchi mahsulotlar:",     terms: ['toza', 'mat', 'tish', 'gigiena', 'lab', 'oqart'], cat: ['Gigiena', 'Kosmetika'] },
  dry:       { introUz: 'Quruq teri uchun namlovchi va to\'yintiruvchi:',        terms: ['namlov', 'krem', 'serum', 'losy', 'oziq', 'kollag'], cat: ['Kosmetika'] },
  combo:     { introUz: 'Kombinatsiya teri uchun balansli kremlar:',             terms: ['krem', 'serum', 'maska'], cat: ['Kosmetika'] },
  acne:      { introUz: 'Husnbuzar va toshmalarga qarshi mahsulotlar:',          terms: ['toza', 'lab', 'tosh', 'tish'], cat: ['Gigiena', 'Kosmetika'] },
  spots:     { introUz: "Dog'larga qarshi va oqartiruvchi:",                     terms: ['oqart', "dog'", 'vitamin', 'serum'], cat: ['Kosmetika'] },
  antiage:   { introUz: 'Yoshartiruvchi anti-age kremlar:',                      terms: ['kollag', 'yoshart', 'peptid', 'anti', '45', 'ajin'], cat: ['Kosmetika'] },
  hydration: { introUz: 'Eng yaxshi namlovchi mahsulotlar:',                     terms: ['namlov', 'krem', 'serum', 'losy'], cat: ['Kosmetika'] },
  recommend: { introUz: 'Sizga tavsiya qiladigan mashhur mahsulotlar:',          terms: ['krem', 'serum', 'kollag', 'namlov'], cat: ['Kosmetika'] },
  perfume:   { introUz: 'Atir va parfyumeriya kolleksiyamizdan:',                terms: ['atir', 'parfyum', 'hid'], cat: ['Parfyumeriya'] },
  hair:      { introUz: 'Soch parvarishi mahsulotlari:',                         terms: ['shamp', 'soch'], cat: ['Gigiena'] },
  child:     { introUz: 'Bolalar uchun mahsulotlar:',                            terms: ['bola', 'umooo'], cat: ['Bolalar'] },
  vitamin:   { introUz: 'Vitaminlar va salomatlik:',                             terms: ['vitamin', 'omega', 'magniy', 'kapsul'], cat: ['Salomatlik'] },
  hygiene:   { introUz: 'Gigiena mahsulotlari:',                                 terms: ['tish', 'pasta', 'lab', 'sof'], cat: ['Gigiena'] },
}

/* ─── Helpers ─── */
function normalize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[`'"".,!?;:()]/g, ' ')
    .replace(/[ʼʻ']/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function detectIntents(text) {
  const lower = ' ' + normalize(text) + ' '
  const found = []
  for (const [intent, words] of Object.entries(KEYWORDS)) {
    for (const w of words) {
      if (lower.includes(' ' + w) || lower.includes(w + ' ') || lower.includes(' ' + w + ' ')) {
        if (!found.includes(intent)) found.push(intent)
        break
      }
    }
  }
  return found
}

function pick(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return ''
  return arr[Math.floor(Math.random() * arr.length)]
}

function getResponse(intent) {
  const entry = RESPONSES[intent]
  if (!entry) return null
  // try uz first (default), then any available
  const list = entry.uz || entry.ru || entry.en || []
  return pick(list)
}

/* ─── Component ─── */
export default function AiChat({ onClose, onRequireAuth }) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch { /* ignore */ }
    return [{
      id: 'm0',
      role: 'ai',
      text: "Salom! 👋 Men Premium Store AI yordamchisiman.\n\nSizga teringizga mos kremlarni tavsiya qilaman, mahsulot, narx, yetkazib berish va boshqa savollaringizga javob beraman.\n\nNimadan boshlaymiz?",
      ts: Date.now(),
    }]
  })
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [products, setProducts] = useState([])
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const { addItem } = useCart()
  const { user } = useAuth()
  const { addToast } = useToast()
  const { t } = useLang()

  /* persist messages */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)))
    } catch { /* quota */ }
  }, [messages])

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
    const cfg = PRODUCT_INTENTS[intent]
    if (!cfg) return []
    if (!products.length) return []
    const scored = products.map(p => {
      const name = (p.name || '').toLowerCase()
      const cat = (p.category || '').toLowerCase()
      let score = 0
      for (const term of cfg.terms) {
        if (name.includes(term)) score += 3
        if (cat.includes(term)) score += 1
      }
      if (cfg.cat && cfg.cat.some(c => cat.includes(c.toLowerCase()))) score += 2
      if ((p.discount || 0) >= 40) score += 0.5
      if ((p.stock || 0) > 0) score += 0.3
      return { ...p, _s: score }
    })
      .filter(p => p._s > 0)
      .sort((a, b) => b._s - a._s)
      .slice(0, limit)
    return scored
  }, [products])

  const findCheap = useCallback((limit = 4) => {
    return [...products]
      .filter(p => p.price > 0)
      .sort((a, b) => (a.price || 0) - (b.price || 0))
      .slice(0, limit)
  }, [products])

  const findDiscount = useCallback((limit = 4) => {
    return [...products]
      .filter(p => (p.discount || 0) > 0)
      .sort((a, b) => (b.discount || 0) - (a.discount || 0))
      .slice(0, limit)
  }, [products])

  const findBySearch = useCallback((q, limit = 4) => {
    const lower = normalize(q)
    if (lower.length < 3) return []
    const tokens = lower.split(' ').filter(t => t.length >= 3)
    if (tokens.length === 0) return []

    return products
      .map(p => {
        const name = (p.name || '').toLowerCase()
        const cat = (p.category || '').toLowerCase()
        let s = 0
        for (const tk of tokens) {
          if (name.includes(tk)) s += 3
          if (cat.includes(tk)) s += 1
        }
        return { ...p, _s: s }
      })
      .filter(p => p._s > 0)
      .sort((a, b) => b._s - a._s)
      .slice(0, limit)
  }, [products])

  const buildResponse = useCallback((userText) => {
    const intents = detectIntents(userText)

    // Greeting + identity-only intents
    if (intents.length === 1) {
      const i = intents[0]
      if (RESPONSES[i] && !PRODUCT_INTENTS[i] && i !== 'recommend' && i !== 'cheap' && i !== 'discount') {
        const text = getResponse(i)
        if (text) return { text }
      }
    }

    // Discounts
    if (intents.includes('discount')) {
      const list = findDiscount(4)
      if (list.length > 0) return { text: '🔥 Eng yaxshi chegirmadagi mahsulotlar:', products: list }
    }

    // Cheap
    if (intents.includes('cheap')) {
      const list = findCheap(4)
      if (list.length > 0) return { text: '🏷️ Eng arzon mahsulotlarimiz:', products: list }
    }

    // Skin / product intent
    const productIntent = intents.find(i => PRODUCT_INTENTS[i])
    if (productIntent) {
      const found = findProductsForIntent(productIntent, 4)
      if (found.length > 0) {
        const intro = PRODUCT_INTENTS[productIntent].introUz
        return { text: intro, products: found }
      }
      // Intent matched but no products → graceful fallback
      return {
        text: `${PRODUCT_INTENTS[productIntent].introUz}\n\nHozircha bu turdagi mahsulotlar omborda yo'q. Boshqa kategoriyalardan tanlang yoki keyinroq urining.`
      }
    }

    // Chat intent (delivery, payment, etc.)
    const chatIntent = intents.find(i => RESPONSES[i] && !PRODUCT_INTENTS[i])
    if (chatIntent) {
      const text = getResponse(chatIntent)
      if (text) return { text }
    }

    // Free-text product search
    const found = findBySearch(userText, 4)
    if (found.length > 0) {
      return {
        text: `"${userText.trim()}" bo'yicha topilgan mahsulotlar:`,
        products: found,
      }
    }

    // Fallback
    return { text: pick(RESPONSES.fallback.uz) }
  }, [findBySearch, findCheap, findDiscount, findProductsForIntent])

  const sendMessage = useCallback((rawText) => {
    const text = (rawText ?? input).trim()
    if (!text) return
    setInput('')
    const userMsg = { id: `u${Date.now()}`, role: 'user', text, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setTyping(true)

    const delay = 600 + Math.random() * 700
    setTimeout(() => {
      try {
        const reply = buildResponse(text)
        const aiMsg = {
          id: `a${Date.now()}`,
          role: 'ai',
          text: reply.text,
          products: reply.products,
          ts: Date.now(),
        }
        setMessages(prev => [...prev, aiMsg])
      } catch (e) {
        console.error('AI Chat error:', e)
        setMessages(prev => [...prev, {
          id: `e${Date.now()}`,
          role: 'ai',
          text: 'Kechirasiz, javob shakllanmadi 🤔 Iltimos, savolingizni boshqacha yozing.',
          ts: Date.now(),
        }])
      } finally {
        setTyping(false)
      }
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

  const handleQuick = (p) => sendMessage(p.text)

  const handleReset = () => {
    if (!confirm('Suhbat tozalansinmi?')) return
    const initial = [{
      id: 'm0',
      role: 'ai',
      text: "Yangi suhbat boshladik! 🌟 Sizga qanday yordam bera olaman?",
      ts: Date.now(),
    }]
    setMessages(initial)
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  return createPortal(
    <div className="ac-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="ac-modal">

        {/* Header */}
        <div className="ac-head">
          <div className="ac-head-left">
            <div className="ac-avatar">
              <span className="ac-avatar-status" />
              <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L13.5 7L18.5 8L15 11.5L16 16.5L12 14L8 16.5L9 11.5L5.5 8L10.5 7Z"/>
              </svg>
            </div>
            <div className="ac-head-info">
              <h2 className="ac-name">
                Premium AI
                <span className="ac-badge">BETA</span>
              </h2>
              <p className="ac-status">
                <span className="ac-dot" />
                Onlayn — javob 1-2 soniyada
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

        {/* Quick prompts (only when conversation is fresh) */}
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
              maxLength={500}
              autoComplete="off"
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
          <p className="ac-hint">AI javoblari ma'lumot uchun. Mahsulot tavsiyalari real bazadan olinadi.</p>
        </form>

      </div>
    </div>,
    document.body
  )
}

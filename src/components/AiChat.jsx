import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../context/LanguageContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const STORAGE_KEY = 'pa_chat_v2'

/* ════════════════════════════════════════════════════════════════
   PREMIUM AI CHAT — Trilingual (uz/ru/en)
   Reacts to user's selected language for both UI text and replies.
   ════════════════════════════════════════════════════════════════ */

/* ─── UI text per language ─── */
const TXT = {
  name:           { uz: 'Premium AI',                   ru: 'Premium AI',                            en: 'Premium AI' },
  status:         { uz: 'Onlayn — javob 1-2 soniyada',  ru: 'Онлайн — ответ за 1-2 секунды',         en: 'Online — replies in 1-2 seconds' },
  newChat:        { uz: 'Yangi suhbat',                 ru: 'Новый чат',                             en: 'New chat' },
  close:          { uz: 'Yopish',                       ru: 'Закрыть',                               en: 'Close' },
  resetConfirm:   { uz: 'Suhbat tozalansinmi?',         ru: 'Очистить чат?',                         en: 'Clear chat?' },
  greetingFirst:  {
    uz: "Salom! 👋 Men Premium Store AI yordamchisiman.\n\nSizga teringizga mos kremlarni tavsiya qilaman, mahsulot, narx, yetkazib berish va boshqa savollaringizga javob beraman.\n\nNimadan boshlaymiz?",
    ru: "Привет! 👋 Я AI-помощник Premium Store.\n\nПодскажу подходящий крем, расскажу о товарах, ценах и доставке. Чем помочь?",
    en: "Hi! 👋 I'm Premium Store AI assistant.\n\nI'll recommend the right cream for your skin, answer questions about products, prices and delivery. How can I help?",
  },
  newConversation: {
    uz: 'Yangi suhbat boshladik! 🌟 Sizga qanday yordam bera olaman?',
    ru: 'Начали новый разговор! 🌟 Чем могу помочь?',
    en: "Let's start fresh! 🌟 How can I help you?",
  },
  quickLabel:     { uz: '💡 Tezkor savollar',           ru: '💡 Быстрые вопросы',                    en: '💡 Quick prompts' },
  inputPlaceholder: { uz: 'Savolingizni yozing...',     ru: 'Напишите свой вопрос...',               en: 'Type your question...' },
  send:           { uz: 'Yuborish',                     ru: 'Отправить',                             en: 'Send' },
  hint:           { uz: "AI javoblari ma'lumot uchun. Mahsulot tavsiyalari real bazadan olinadi.",
                    ru: "Ответы AI носят информационный характер. Товары — из реальной базы.",
                    en: "AI replies are informational. Product recommendations come from real catalogue." },
  errorReply:     {
    uz: "Kechirasiz, javob shakllanmadi 🤔 Iltimos, savolingizni boshqacha yozing.",
    ru: 'Извините, не получилось сформировать ответ 🤔 Попробуйте перефразировать.',
    en: "Sorry, I couldn't form a response 🤔 Please rephrase your question.",
  },
}

/* ─── Quick prompts per language ─── */
const QUICK_PROMPTS = {
  uz: [
    { id: 'recommend', text: 'Menga krem tavsiya qiling', icon: '✨' },
    { id: 'delivery',  text: 'Yetkazib berish qancha vaqt?', icon: '🚚' },
    { id: 'payment',   text: "Qanday to'lov qilish mumkin?", icon: '💳' },
    { id: 'oily',      text: "Yog'li teri uchun nima yaxshi?", icon: '💧' },
    { id: 'dry',       text: 'Quruq teri parvarishi', icon: '🌵' },
    { id: 'antiage',   text: 'Yoshartiruvchi krem bormi?', icon: '⏳' },
    { id: 'cheap',     text: 'Eng arzon mahsulotlar', icon: '🏷️' },
    { id: 'discount',  text: 'Chegirmadagi mahsulotlar', icon: '🔥' },
  ],
  ru: [
    { id: 'recommend', text: 'Порекомендуйте крем', icon: '✨' },
    { id: 'delivery',  text: 'Сколько идёт доставка?', icon: '🚚' },
    { id: 'payment',   text: 'Как оплатить?', icon: '💳' },
    { id: 'oily',      text: 'Что подойдёт для жирной кожи?', icon: '💧' },
    { id: 'dry',       text: 'Уход за сухой кожей', icon: '🌵' },
    { id: 'antiage',   text: 'Есть ли антивозрастной крем?', icon: '⏳' },
    { id: 'cheap',     text: 'Самые дешёвые товары', icon: '🏷️' },
    { id: 'discount',  text: 'Товары со скидкой', icon: '🔥' },
  ],
  en: [
    { id: 'recommend', text: 'Recommend me a cream', icon: '✨' },
    { id: 'delivery',  text: 'How long is delivery?', icon: '🚚' },
    { id: 'payment',   text: 'How can I pay?', icon: '💳' },
    { id: 'oily',      text: "What's good for oily skin?", icon: '💧' },
    { id: 'dry',       text: 'Dry skin care', icon: '🌵' },
    { id: 'antiage',   text: 'Anti-aging cream?', icon: '⏳' },
    { id: 'cheap',     text: 'Cheapest products', icon: '🏷️' },
    { id: 'discount',  text: 'Discounted items', icon: '🔥' },
  ],
}

/* ─── Multilingual keyword bank — language-agnostic intent detection ─── */
const KEYWORDS = {
  greeting:  ['salom','assalom','salomalek','hi','hello','hey','hola','привет','здравствуй','здравствуйте','добрый день','добрый вечер','добрый утро'],
  delivery:  ['yetkazib','yetkaz','yetkazish','dostavka','olib kel','qachon','qancha vaqt','tezda','kun ichida','доставк','привезу','когда придёт','delivery','shipping','ship','arrive'],
  payment:   ["to'lov",'tolov','tulov','naqd','karta','plastik','click','payme','humo','uzcard','оплата','оплат','pay','payment','card','cash'],
  pickup:    ['punkt','olib ket','olib oli','samovыvoz','самовывоз','pickup','qaerdan oli','manzil','address','where to pick'],
  return:    ['qaytar','qaytarish','возврат','обмен','return','refund','exchange'],
  guarantee: ['kafolat','garant','guarantee','гарантия','warranty','sifat','quality'],
  account:   ['profil','hisob','akkaunt',"ro'yxat",'royxat','login','регистрация','войти','register','sign up','sign in','account'],
  order:     ['buyurtma','order','order qilish','zakaz','заказ','qanday buyurtma','how to order','how do i order'],
  contact:   ['aloqa','qoldiring','telefon',"bog'lan",'kontakt','contact','связ','phone','email'],
  oily:      ["yog'li",'yogli','жирн','oily','mat','yaltir','greasy','shiny'],
  dry:       ['quruq','quri','qurigan','dry','сухая','сух','tarang','tight','flak'],
  combo:     ['kombinatsiya','aralash','combo','kombo','смешанн','combination','mixed'],
  acne:      ['toshma','acne','husnbuzar','pryshchi','прыщи','tosh','pimpl','breakout'],
  spots:     ["dog'",'dog','oqart','spots','pigmentat','пигмент','qoramt','dark spot','blemish'],
  antiage:   ['ajin','yoshart','anti age','anti-age','antiage','kollag','collagen','qariy','старени','морщин','wrinkle','aging','45'],
  hydration: ['namlov','namlanish','hydra','moistur','влаг','oziq','hydration','dewy'],
  cheap:     ['arzon','cheap','дешев','narxi past','tushun narx','narxi arzon','low price','affordable'],
  discount:  ['chegirma','aksiya','sale','скидк','aksiy','discount','olov narx','super narx','deal'],
  recommend: ['tavsiya','tafsiya','tavfsiya','recommend','mos','qaysi','qanday','qaysisi','рекоменд','suggest','best','what should'],
  perfume:   ['atir','parfyum','parfum','parfumeriya','духи','parfumeri','perfume','fragrance','scent'],
  hair:      ['soch','shamp','shampun','hair','волос','shampoo'],
  child:     ['bola','bolalar','detsk','kids','child','baby','детск'],
  vitamin:   ['vitamin','витамин',"salomatli",'omega','magniy','vitamin d','vitamin c','kapsul','k2','health','supplement'],
  hygiene:   ['gigiena','tish','tooth','pasta','shchet','lab balzam','sof','toothpaste','hygiene'],
  thanks:    ['rahmat','спасибо','thank','thanks','tushunarli','rahmat kop','katta rahmat','thx','ty'],
  bye:       ['xayr','salomat','до свидания','bye','goodbye','tugatish','see you','farewell'],
  help:      ['yordam','help','yordam ber','помоги','помощь','what can you'],
  identity:  ['kimsan','kim sen','sen kim','who are you','who r u','кто ты','sen nima san','nima san','what are you','как тебя'],
}

/* ─── Responses per intent + language ─── */
const RESPONSES = {
  greeting: {
    uz: ["Salom! 👋 Men Premium Store AI yordamchisiman.\n\nSizga teringizga mos kremlarni topib beraman, narxlar va yetkazib berish haqida ma'lumot beraman.",
         "Assalomu alaykum! 🌸 Premium Store xush kelibsiz! Sizga qanday yordam bera olaman?",
         "Salom va xush kelibsiz! 💖 Krem tavsiyasimi yoki mahsulotlar haqida ma'lumotmi — istalganini so'rang."],
    ru: ["Привет! 👋 Я AI-помощник Premium Store. Подскажу подходящий крем, расскажу о ценах и доставке.",
         "Здравствуйте! 🌸 Добро пожаловать в Premium Store. Чем могу помочь?",
         "Приветствую! 💖 Спросите о товарах, креме или доставке — я подскажу."],
    en: ["Hi! 👋 I'm Premium Store AI assistant. Ask about creams, products, prices or delivery.",
         "Welcome to Premium Store! 🌸 How can I assist you today?",
         "Hello! 💖 Need a cream recommendation or product info? Just ask."],
  },
  delivery: {
    uz: ["🚚 Yetkazib berish:\n\n• Toshkent shahri ichida — 1 kun\n• Viloyatlarga — 2-4 kun\n• Olib ketish punktlaridan — bepul\n\nBuyurtmangiz admin tasdiqlagandan so'ng yo'lga chiqadi."],
    ru: ["🚚 Доставка:\n\n• По Ташкенту — 1 день\n• По регионам — 2-4 дня\n• Из пунктов самовывоза — бесплатно\n\nЗаказ отправляется после подтверждения администратором."],
    en: ["🚚 Delivery:\n\n• Tashkent — 1 day\n• Regions — 2-4 days\n• From pickup points — free\n\nYour order ships after admin confirmation."],
  },
  payment: {
    uz: ["💳 To'lov turlari:\n\n• Naqd pul (buyurtma olib kelinganda)\n• Bank kartasi (Humo, Uzcard, Visa)\n• Pul o'tkazma (Click, Payme orqali)\n\nCheckout vaqtida tanlash mumkin."],
    ru: ["💳 Способы оплаты:\n\n• Наличными при получении\n• Картой (Humo, Uzcard, Visa)\n• Click, Payme\n\nВыбор при оформлении заказа."],
    en: ["💳 Payment methods:\n\n• Cash on delivery\n• Bank card (Humo, Uzcard, Visa)\n• Click, Payme transfer\n\nChoose at checkout."],
  },
  pickup: {
    uz: ["📍 Olib ketish punktlari:\n\n• Toshkent shahrida bir nechta filiallar\n• Ish vaqti: Du-Sha 09:00 — 20:00\n• Olib ketish bepul"],
    ru: ["📍 Пункты самовывоза:\n\n• В Ташкенте несколько филиалов\n• График: Пн-Сб 09:00 — 20:00\n• Самовывоз бесплатно"],
    en: ["📍 Pickup points:\n\n• Multiple branches in Tashkent\n• Hours: Mon-Sat 09:00 — 20:00\n• Pickup is free"],
  },
  return: {
    uz: ["↩️ Mahsulotlarni qaytarish:\n\n• 14 kun ichida ochilmagan mahsulotlarni qaytarish mumkin\n• Original qadog'ida bo'lishi shart\n• Qaytarish bepul"],
    ru: ["↩️ Возврат:\n\n• 14 дней на возврат неиспользованных товаров\n• В оригинальной упаковке\n• Возврат бесплатно"],
    en: ["↩️ Returns:\n\n• 14 days for unopened items\n• In original packaging\n• Free return"],
  },
  guarantee: {
    uz: ["🛡️ Bizning kafolat:\n\n• Faqat asl Premium Store mahsulotlari\n• Sertifikat bilan birga\n• Sifat kafolati\n• 14 kunlik qaytarish"],
    ru: ["🛡️ Наша гарантия:\n\n• Только оригинальные товары Premium Store\n• С сертификатами\n• Гарантия качества\n• 14 дней на возврат"],
    en: ["🛡️ Our guarantee:\n\n• Only authentic Premium Store products\n• With certificates\n• Quality assured\n• 14-day return policy"],
  },
  account: {
    uz: ["👤 Hisob ochish:\n\nSayt yuqori-o'ng burchagidagi 'Kirish' tugmasini bosing. Email va parol bilan ro'yxatdan o'ting.\n\nBuyurtmalaringiz 'Buyurtmalarim' bo'limida saqlanadi."],
    ru: ["👤 Регистрация:\n\nНажмите 'Войти' в правом верхнем углу. Зарегистрируйтесь по email и паролю.\n\nЗаказы будут сохраняться в разделе 'Мои заказы'."],
    en: ["👤 Sign up:\n\nClick 'Sign in' at the top-right. Register with email and password.\n\nOrders are saved in 'My orders'."],
  },
  order: {
    uz: ["🛍️ Buyurtma berish tartibi:\n\n1. Mahsulotni 'Savatga' qo'shing\n2. Savatni oching va 'Buyurtma berish' tugmasini bosing\n3. Ism, telefon va manzil/punktni ko'rsating\n4. To'lov turini tanlang\n5. Tasdiqlash — ish tugadi! 🎉"],
    ru: ["🛍️ Как сделать заказ:\n\n1. Добавьте товар в 'Корзину'\n2. Откройте корзину и нажмите 'Оформить'\n3. Укажите имя, телефон и адрес/пункт\n4. Выберите способ оплаты\n5. Подтвердите — готово! 🎉"],
    en: ["🛍️ How to order:\n\n1. Add a product to your 'Cart'\n2. Open cart and click 'Checkout'\n3. Enter name, phone and address/pickup point\n4. Pick a payment method\n5. Confirm — done! 🎉"],
  },
  contact: {
    uz: ["📞 Biz bilan bog'lanish:\n\n• Telefon: +998 90 123 45 67\n• Email: info@premiumstore.uz\n• Telegram: @faberlic_uz"],
    ru: ["📞 Связь с нами:\n\n• Телефон: +998 90 123 45 67\n• Email: info@premiumstore.uz\n• Telegram: @faberlic_uz"],
    en: ["📞 Contact us:\n\n• Phone: +998 90 123 45 67\n• Email: info@premiumstore.uz\n• Telegram: @faberlic_uz"],
  },
  thanks: {
    uz: ["Sog' bo'ling! 🌸 Yana savol bo'lsa, men bu yerdaman.",
         "Marhamat! 💖 Xaridlaringiz xayrli bo'lsin.",
         "Hech narsa! 😊 Yana yordam kerak bo'lsa, so'rang."],
    ru: ["Пожалуйста! 🌸 Если будут вопросы — я тут.",
         "Не за что! 💖 Удачных покупок!",
         "Всегда рада помочь! 😊"],
    en: ["You're welcome! 🌸 I'm here if you need more help.",
         "My pleasure! 💖 Happy shopping!",
         "Anytime! 😊 Just ask if you need anything."],
  },
  bye: {
    uz: ["Xayr, sog' bo'ling! ✨ Premium Store sizni doim kutib qoladi."],
    ru: ["До свидания! ✨ Premium Store всегда вас ждёт."],
    en: ["Goodbye! ✨ Premium Store is always here for you."],
  },
  help: {
    uz: ["🤖 Men Premium Store AI yordamchisiman. Quyidagilarda yordam bera olaman:\n\n• Sizga mos krem va kosmetika tavsiyasi\n• Mahsulotlar va narxlar haqida ma'lumot\n• Yetkazib berish va to'lov shartlari\n• Buyurtma berish bo'yicha qadamlar\n• Teri parvarishi maslahatlari"],
    ru: ["🤖 Я AI-помощник Premium Store. Помогаю с:\n\n• Подбор крема и косметики\n• Информация о товарах и ценах\n• Условия доставки и оплаты\n• Шаги оформления заказа\n• Советы по уходу за кожей"],
    en: ["🤖 I'm Premium Store AI. I can help with:\n\n• Cream and cosmetic recommendations\n• Product and price info\n• Delivery and payment options\n• Order steps\n• Skincare tips"],
  },
  identity: {
    uz: ["✨ Men — Premium Store AI yordamchisi.\n\nMen mahsulot tavsiyasi, savol-javob va sayt bo'yicha yordam beraman. Real time mahsulotlardan tanlab, sizga eng mosini taklif qilaman."],
    ru: ["✨ Я — AI-помощник Premium Store.\n\nПомогаю с подбором товаров, отвечаю на вопросы. Подбираю реальные товары из каталога."],
    en: ["✨ I'm the Premium Store AI assistant.\n\nI suggest products, answer questions, and pick the best fits from our live catalogue."],
  },
  fallback: {
    uz: ["Tushundim, lekin aniqroq javob berish uchun savolingizni boshqacha yozing 🤔\n\nMasalan: 'quruq teri uchun krem' yoki 'yetkazib berish narxi'",
         "Bu savolda yordam berish biroz qiyin. Pastdagi tezkor savollarni sinab ko'ring yoki mahsulot nomini yozing.",
         "Aniq tushunmadim. Mahsulot tavsiyasi, narxlar yoki yetkazib berish haqida so'rashingiz mumkin."],
    ru: ["Не совсем понял 🤔 Попробуйте перефразировать.\n\nНапример: 'крем для сухой кожи' или 'стоимость доставки'",
         "Сложно понять этот вопрос. Попробуйте быстрые подсказки ниже или напишите название товара.",
         "Не уверен. Можно спросить о товарах, ценах или доставке."],
    en: ["I didn't quite catch that 🤔 Try rephrasing.\n\nFor example: 'cream for dry skin' or 'delivery cost'",
         "Hmm, that's tricky. Try the quick prompts below or type a product name.",
         "Not sure I follow. Ask about products, prices or delivery."],
  },
}

/* ─── Product intents (language-aware intros) ─── */
const PRODUCT_INTENTS = {
  oily:      { intro: { uz: "Yog'li teri uchun mat va tozalovchi mahsulotlar:",     ru: 'Для жирной кожи — матирующие и очищающие средства:',     en: 'For oily skin — mattifying and cleansing products:' },
               terms: ['toza','mat','tish','gigiena','lab','oqart'] },
  dry:       { intro: { uz: "Quruq teri uchun namlovchi va to'yintiruvchi:",        ru: 'Для сухой кожи — увлажняющие и питательные средства:',  en: 'For dry skin — moisturising and nourishing products:' },
               terms: ['namlov','krem','serum','losy','oziq','kollag'] },
  combo:     { intro: { uz: 'Kombinatsiya teri uchun balansli kremlar:',            ru: 'Для комбинированной кожи — балансирующие кремы:',        en: 'For combination skin — balancing creams:' },
               terms: ['krem','serum','maska'] },
  acne:      { intro: { uz: 'Husnbuzar va toshmalarga qarshi mahsulotlar:',         ru: 'Против прыщей и высыпаний:',                              en: 'Anti-acne products:' },
               terms: ['toza','lab','tosh','tish'] },
  spots:     { intro: { uz: "Dog'larga qarshi va oqartiruvchi:",                    ru: 'Против пятен и пигментации:',                             en: 'Against dark spots and pigmentation:' },
               terms: ['oqart',"dog'",'vitamin','serum'] },
  antiage:   { intro: { uz: 'Yoshartiruvchi anti-age kremlar:',                     ru: 'Антивозрастные кремы:',                                   en: 'Anti-aging creams:' },
               terms: ['kollag','yoshart','peptid','anti','45','ajin'] },
  hydration: { intro: { uz: 'Eng yaxshi namlovchi mahsulotlar:',                    ru: 'Лучшие увлажняющие средства:',                            en: 'Best hydrating products:' },
               terms: ['namlov','krem','serum','losy'] },
  recommend: { intro: { uz: 'Sizga tavsiya qiladigan mashhur mahsulotlar:',         ru: 'Рекомендуемые популярные товары:',                        en: 'Recommended popular products:' },
               terms: ['krem','serum','kollag','namlov'] },
  perfume:   { intro: { uz: 'Atir va parfyumeriya kolleksiyamizdan:',               ru: 'Парфюмерная коллекция:',                                  en: 'From our perfume collection:' },
               terms: ['atir','parfyum','hid'] },
  hair:      { intro: { uz: 'Soch parvarishi mahsulotlari:',                        ru: 'Средства для волос:',                                     en: 'Hair care products:' },
               terms: ['shamp','soch'] },
  child:     { intro: { uz: 'Bolalar uchun mahsulotlar:',                           ru: 'Детские товары:',                                         en: 'Products for kids:' },
               terms: ['bola','umooo'] },
  vitamin:   { intro: { uz: 'Vitaminlar va salomatlik:',                            ru: 'Витамины и здоровье:',                                    en: 'Vitamins and health:' },
               terms: ['vitamin','omega','magniy','kapsul'] },
  hygiene:   { intro: { uz: 'Gigiena mahsulotlari:',                                ru: 'Средства гигиены:',                                       en: 'Hygiene products:' },
               terms: ['tish','pasta','lab','sof'] },
}

/* ─── Helpers ─── */
function normalize(text) {
  return (text || '').toLowerCase()
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
      if (lower.includes(w)) {
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

/* ─── Component ─── */
export default function AiChat({ onClose, onRequireAuth }) {
  const { lang } = useLang()
  const tx = useCallback((key) => (TXT[key] && TXT[key][lang]) || TXT[key]?.uz || key, [lang])

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
      text: TXT.greetingFirst[lang] || TXT.greetingFirst.uz,
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

  /* persist messages */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)))
    } catch { /* quota */ }
  }, [messages])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

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

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, typing])

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200)
  }, [])

  const findProductsForIntent = useCallback((intent, limit = 4) => {
    const cfg = PRODUCT_INTENTS[intent]
    if (!cfg || !products.length) return []
    return products.map(p => {
      const name = (p.name || '').toLowerCase()
      const cat = (p.category || '').toLowerCase()
      let s = 0
      for (const term of cfg.terms) {
        if (name.includes(term)) s += 3
        if (cat.includes(term)) s += 1
      }
      if ((p.discount || 0) >= 40) s += 0.5
      if ((p.stock || 0) > 0) s += 0.3
      return { ...p, _s: s }
    })
      .filter(p => p._s > 0)
      .sort((a, b) => b._s - a._s)
      .slice(0, limit)
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
    return products.map(p => {
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

  const intros = useMemo(() => ({
    discountIntro: { uz: '🔥 Eng yaxshi chegirmadagi mahsulotlar:', ru: '🔥 Лучшие товары со скидкой:', en: '🔥 Top discounted products:' },
    cheapIntro:    { uz: '🏷️ Eng arzon mahsulotlarimiz:',          ru: '🏷️ Самые дешёвые товары:',     en: '🏷️ Our cheapest products:' },
    searchIntro:   { uz: 'bo\'yicha topilgan mahsulotlar:',        ru: '— найденные товары:',           en: '— matching products:' },
    emptyStock:    { uz: "\n\nHozircha bu turdagi mahsulotlar omborda yo'q. Boshqa kategoriyalardan tanlang.",
                     ru: '\n\nК сожалению, таких товаров сейчас нет. Попробуйте другие категории.',
                     en: "\n\nThese items aren't currently in stock. Try other categories." },
  }), [])

  const buildResponse = useCallback((userText) => {
    const intents = detectIntents(userText)

    // Single non-product intent (greeting, delivery, payment, etc.)
    if (intents.length === 1) {
      const i = intents[0]
      if (RESPONSES[i] && !PRODUCT_INTENTS[i] && i !== 'recommend' && i !== 'cheap' && i !== 'discount') {
        const list = RESPONSES[i][lang] || RESPONSES[i].uz
        return { text: pick(list) }
      }
    }

    if (intents.includes('discount')) {
      const list = findDiscount(4)
      if (list.length > 0) return { text: intros.discountIntro[lang] || intros.discountIntro.uz, products: list }
    }
    if (intents.includes('cheap')) {
      const list = findCheap(4)
      if (list.length > 0) return { text: intros.cheapIntro[lang] || intros.cheapIntro.uz, products: list }
    }

    const productIntent = intents.find(i => PRODUCT_INTENTS[i])
    if (productIntent) {
      const found = findProductsForIntent(productIntent, 4)
      const intro = PRODUCT_INTENTS[productIntent].intro[lang] || PRODUCT_INTENTS[productIntent].intro.uz
      if (found.length > 0) return { text: intro, products: found }
      return { text: intro + (intros.emptyStock[lang] || intros.emptyStock.uz) }
    }

    const chatIntent = intents.find(i => RESPONSES[i] && !PRODUCT_INTENTS[i])
    if (chatIntent) {
      const list = RESPONSES[chatIntent][lang] || RESPONSES[chatIntent].uz
      return { text: pick(list) }
    }

    const found = findBySearch(userText, 4)
    if (found.length > 0) {
      const sep = intros.searchIntro[lang] || intros.searchIntro.uz
      return {
        text: `"${userText.trim()}" ${sep}`,
        products: found,
      }
    }

    const fb = RESPONSES.fallback[lang] || RESPONSES.fallback.uz
    return { text: pick(fb) }
  }, [findBySearch, findCheap, findDiscount, findProductsForIntent, lang, intros])

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
        setMessages(prev => [...prev, {
          id: `a${Date.now()}`,
          role: 'ai',
          text: reply.text,
          products: reply.products,
          ts: Date.now(),
        }])
      } catch (e) {
        console.error('AI Chat error:', e)
        setMessages(prev => [...prev, {
          id: `e${Date.now()}`,
          role: 'ai',
          text: tx('errorReply'),
          ts: Date.now(),
        }])
      } finally {
        setTyping(false)
      }
    }, delay)
  }, [input, buildResponse, tx])

  const handleAdd = (p) => {
    if (!user) { onRequireAuth?.(); onClose?.(); return }
    addItem(p)
    addToast(`${p.emoji || '🛍️'} ${lang === 'ru' ? 'Добавлено в корзину' : lang === 'en' ? 'Added to cart' : "Savatga qo'shildi"}`, 'success')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleQuick = (p) => sendMessage(p.text)

  const handleReset = () => {
    if (!confirm(tx('resetConfirm'))) return
    setMessages([{
      id: 'm0',
      role: 'ai',
      text: tx('newConversation'),
      ts: Date.now(),
    }])
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  const quickPrompts = QUICK_PROMPTS[lang] || QUICK_PROMPTS.uz

  return createPortal(
    <div className="ac-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="ac-modal">

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
                {tx('name')}
                <span className="ac-badge">BETA</span>
              </h2>
              <p className="ac-status">
                <span className="ac-dot" />
                {tx('status')}
              </p>
            </div>
          </div>
          <div className="ac-head-actions">
            <button className="ac-icon-btn" onClick={handleReset} title={tx('newChat')}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
              </svg>
            </button>
            <button className="ac-icon-btn ac-close" onClick={onClose} title={tx('close')}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

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
                        <button className="ac-prod-add" onClick={() => handleAdd(p)} aria-label={tx('send')}>
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
                <div className="ac-typing"><span /><span /><span /></div>
              </div>
            </div>
          )}
        </div>

        {messages.length <= 1 && !typing && (
          <div className="ac-quick">
            <p className="ac-quick-label">{tx('quickLabel')}</p>
            <div className="ac-quick-grid">
              {quickPrompts.map(p => (
                <button key={p.id} className="ac-quick-btn" onClick={() => handleQuick(p)}>
                  <span className="ac-quick-icon">{p.icon}</span>
                  <span>{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form className="ac-input-wrap" onSubmit={e => { e.preventDefault(); sendMessage() }}>
          <div className="ac-input-inner">
            <input
              ref={inputRef}
              type="text"
              className="ac-input"
              placeholder={tx('inputPlaceholder')}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={typing}
              maxLength={500}
              autoComplete="off"
            />
            <button type="submit" className="ac-send" disabled={!input.trim() || typing} aria-label={tx('send')}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <p className="ac-hint">{tx('hint')}</p>
        </form>

      </div>
    </div>,
    document.body
  )
}

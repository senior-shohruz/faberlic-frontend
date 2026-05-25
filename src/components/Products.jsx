import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../context/LanguageContext'
import ProductModal from './ProductModal'

const STATIC = [
  { id: 1,  name: "Bubble White uzum ta'mli og'iz bo'shlig'ini chayish vositasi",       category: 'Gigiena',      oldPrice: 103000, price: 50900, discount: 51, emoji: '🫐', badges: ['Yangi mahsulot','Supernarx'] },
  { id: 2,  name: "Bubble White malina ta'mli og'iz bo'shlig'ini soflantiruvchi vosita", category: 'Gigiena',      oldPrice: 61900,  price: 36900, discount: 40, emoji: '🍓', badges: ['Yangi mahsulot','Supernarx'] },
  { id: 3,  name: '«Vizual oqartirish» Expert Pharma tish pastasi',                      category: 'Gigiena',      oldPrice: 164000, price: 73900, discount: 55, emoji: '🦷', badges: ['Yangi mahsulot','Supernarx'] },
  { id: 4,  name: "Umooo 3+ vanna uchun o'yinchoqli bolalar to'pchasi",                 category: 'Bolalar',      oldPrice: 81900,  price: 40900, discount: 50, emoji: '🧸', badges: ['Yangi mahsulot','Supernarx'], stock: 17 },
  { id: 5,  name: 'Kollagen kremi 45+ yoshdan oshganlar uchun intensiv parvarish',      category: 'Kosmetika',    oldPrice: 185000, price: 92900, discount: 50, emoji: '✨', badges: ['Top sotuv'] },
  { id: 6,  name: 'Aqua Series namlovchi yuz serumi 30 ml',                             category: 'Kosmetika',    oldPrice: 95000,  price: 52900, discount: 44, emoji: '💧', badges: ['Top sotuv'] },
  { id: 7,  name: "Uy parfyumeriyasi lavanda va yo'lbars ko'zi",                        category: 'Parfyumeriya', oldPrice: 75000,  price: 45900, discount: 39, emoji: '🌸', badges: ['Top sotuv'] },
  { id: 8,  name: 'Kundalik parvarish shampuni barcha soch turlari uchun',              category: 'Gigiena',      oldPrice: 55000,  price: 32900, discount: 40, emoji: '🌿', badges: ['Top sotuv'] },
  { id: 9,  name: 'Yuz uchun krem-maska maksimal namlanish va oziqlantirish',           category: 'Kosmetika',    oldPrice: 220000, price: 79900, discount: 64, emoji: '🔥', badges: ['Olov narx'] },
  { id: 10, name: 'Tana losyoni quruq teri uchun intensiv parvarish 200 ml',            category: 'Kosmetika',    oldPrice: 95000,  price: 35900, discount: 62, emoji: '🧴', badges: ['Olov narx'] },
  { id: 11, name: "Lab balzam gilos ta'mli SPF15 himoya bilan",                         category: 'Kosmetika',    oldPrice: 35000,  price: 14900, discount: 57, emoji: '💋', badges: ['Olov narx'] },
  { id: 12, name: "Ko'z atrofi serumi yoshartiruvchi peptidlar bilan",                  category: 'Kosmetika',    oldPrice: 145000, price: 62900, discount: 57, emoji: '👁', badges: ['Olov narx'] },
  { id: 13, name: 'Omega-3 kapsulalari yurak va qon tomirlari uchun 60 dona',           category: 'Salomatlik',   oldPrice: 165000, price: 89900, discount: 45, emoji: '❤️', badges: ['Salomatlik'], stock: 50 },
  { id: 14, name: 'Vitamin D3 + K2 immunitet va suyak mustahkamligi uchun',             category: 'Salomatlik',   oldPrice: 120000, price: 65900, discount: 45, emoji: '☀️', badges: ['Salomatlik'], stock: 33 },
  { id: 15, name: 'Probiotik ichimlik hazm tizimi uchun 10 ta paket',                   category: 'Salomatlik',   oldPrice: 89000,  price: 45900, discount: 48, emoji: '🥛', badges: ['Salomatlik'] },
  { id: 16, name: 'Magniy + B6 stress va uyqusizlikka qarshi 30 kapsul',               category: 'Salomatlik',   oldPrice: 95000,  price: 52900, discount: 44, emoji: '🧘', badges: ['Salomatlik'] },
]

function SkeletonCard() {
  return (
    <div className="pc">
      <div className="pc-img skeleton" style={{ minHeight: 180 }} />
      <div className="pc-info" style={{ gap: 10, paddingTop: 12 }}>
        <div className="skeleton" style={{ height: 14, borderRadius: 8, width: '85%' }} />
        <div className="skeleton" style={{ height: 14, borderRadius: 8, width: '55%' }} />
        <div className="skeleton" style={{ height: 40, borderRadius: 100, marginTop: 6 }} />
      </div>
    </div>
  )
}

function useFavorites() {
  const [favs, setFavs] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('favs') || '[]')) }
    catch { return new Set() }
  })
  function toggle(id) {
    setFavs(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      localStorage.setItem('favs', JSON.stringify([...next]))
      return next
    })
  }
  return { favs, toggle }
}

function ProductCard({ product, onRequireAuth, onQuickView, favs, onToggleFav }) {
  const { user } = useAuth()
  const { addItem, items } = useCart()
  const { addToast } = useToast()
  const { t } = useLang()
  const liked = favs.has(product.id)
  const inCart = items.some(i => i.id === product.id)

  function handleAdd(e) {
    e.stopPropagation()
    if (!user) { onRequireAuth(); return }
    addItem(product)
    addToast(`${product.emoji || '🛍️'} ${t('products.addedToCart')}`, 'success')
  }

  function handleLike(e) {
    e.stopPropagation()
    onToggleFav(product.id)
    if (!liked) addToast(t('products.addedToFav'), 'success')
  }

  return (
    <div className="pc reveal" onClick={() => onQuickView(product)}>
      <div className="pc-img">
        <button className={`pc-heart ${liked ? 'liked' : ''}`} onClick={handleLike}>
          <svg width="18" height="18" fill={liked ? '#e63946' : 'none'} stroke={liked ? '#e63946' : 'currentColor'} strokeWidth="2" viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
        </button>
        {product.image
          ? <img src={product.image} alt={product.name} className="pc-product-img" />
          : <div className="pc-emoji">{product.emoji || '🛍️'}</div>
        }
        <div className="pc-discount-tag">-{product.discount}%</div>
        <div className="pc-quickview" onClick={e => { e.stopPropagation(); onQuickView(product) }}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          {t('products.quickview')}
        </div>
      </div>
      <div className="pc-info">
        <p className="pc-name">{product.name}</p>
        <div className="pc-prices">
          <span className="pc-price">{product.price?.toLocaleString()} UZS</span>
          <span className="pc-old">{product.oldPrice?.toLocaleString()}</span>
        </div>
        <button className={`pc-btn ${inCart ? 'in-cart' : ''}`} onClick={handleAdd}>
          {inCart ? (
            <>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
              {t('products.inCart')}
            </>
          ) : (
            <>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {t('products.addToCart')}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default function Products({ onRequireAuth }) {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [modalProduct, setModalProduct] = useState(null)
  const { t } = useLang()
  const { favs, toggle: toggleFav } = useFavorites()

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setProducts(Array.isArray(data) && data.length > 0 ? data : STATIC); setLoading(false) })
      .catch(() => { setProducts(STATIC); setLoading(false) })
  }, [])

  return (
    <section className="products-wrap" id="products">
      <div className="section-header reveal">
        <p className="section-tag">{t('products.tag')}</p>
        <h2 className="section-title">{t('products.title')}</h2>
      </div>

      <div className="ps-grid">
        {loading
          ? [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
          : products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onRequireAuth={onRequireAuth}
                onQuickView={setModalProduct}
                favs={favs}
                onToggleFav={toggleFav}
              />
            ))
        }
      </div>

      {modalProduct && (
        <ProductModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
          onRequireAuth={() => { setModalProduct(null); onRequireAuth() }}
        />
      )}
    </section>
  )
}

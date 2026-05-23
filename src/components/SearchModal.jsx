import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../context/LanguageContext'

const FALLBACK = [
  { id: 1,  name: "Bubble White uzum ta'mli og'iz chayish vositasi", price: 50900, oldPrice: 103000, discount: 51, emoji: '🫐', category: 'Gigiena' },
  { id: 2,  name: "Bubble White malina ta'mli soflantiruvchi vosita", price: 36900, oldPrice: 61900,  discount: 40, emoji: '🍓', category: 'Gigiena' },
  { id: 3,  name: '«Vizual oqartirish» Expert Pharma tish pastasi',   price: 73900, oldPrice: 164000, discount: 55, emoji: '🦷', category: 'Gigiena' },
  { id: 5,  name: 'Kollagen kremi 45+ yoshdan oshganlar uchun',       price: 92900, oldPrice: 185000, discount: 50, emoji: '✨', category: 'Kosmetika' },
  { id: 6,  name: 'Aqua Series namlovchi yuz serumi 30 ml',           price: 52900, oldPrice: 95000,  discount: 44, emoji: '💧', category: 'Kosmetika' },
  { id: 7,  name: "Uy parfyumeriyasi lavanda va yo'lbars ko'zi",      price: 45900, oldPrice: 75000,  discount: 39, emoji: '🌸', category: 'Parfyumeriya' },
  { id: 9,  name: 'Yuz uchun krem-maska maksimal namlanish',          price: 79900, oldPrice: 220000, discount: 64, emoji: '🔥', category: 'Kosmetika' },
  { id: 10, name: 'Tana losyoni quruq teri uchun 200 ml',             price: 35900, oldPrice: 95000,  discount: 62, emoji: '🧴', category: 'Kosmetika' },
  { id: 13, name: 'Omega-3 kapsulalari yurak uchun 60 dona',          price: 89900, oldPrice: 165000, discount: 45, emoji: '❤️', category: 'Salomatlik' },
  { id: 14, name: 'Vitamin D3 + K2 immunitet va suyak uchun',         price: 65900, oldPrice: 120000, discount: 45, emoji: '☀️', category: 'Salomatlik' },
  { id: 15, name: 'Probiotik ichimlik hazm tizimi uchun 10 ta',       price: 45900, oldPrice: 89000,  discount: 48, emoji: '🥛', category: 'Salomatlik' },
  { id: 16, name: 'Magniy + B6 stress va uyqusizlikka qarshi',        price: 52900, oldPrice: 95000,  discount: 44, emoji: '🧘', category: 'Salomatlik' },
]

export default function SearchModal({ onClose, onRequireAuth }) {
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState(FALLBACK)
  const inputRef = useRef(null)
  const { addItem } = useCart()
  const { addToast } = useToast()
  const { user } = useAuth()
  const { t } = useLang()

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    fetch('http://localhost:5000/api/products')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data) && data.length > 0) setProducts(data) })
      .catch(() => {})
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  const q = query.trim().toLowerCase()
  const results = q.length < 2
    ? []
    : products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      )

  function handleAdd(p) {
    if (!user) { onRequireAuth?.(); onClose(); return }
    addItem(p)
    addToast(`${p.emoji || '🛍️'} ${t('products.addedToCart')}`, 'success')
  }

  const popularTags = t('search.popularTags')

  return (
    <div className="sm-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="sm">
        <div className="sm-input-wrap">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            className="sm-input"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className="sm-close" onClick={onClose}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="sm-results">
          {q.length < 2 ? (
            <div className="sm-hint">
              <div className="sm-hint-icon">🔍</div>
              <p>{t('search.hintMin')}</p>
              <div className="sm-popular">
                <span>{t('search.popular')}</span>
                {Array.isArray(popularTags) && popularTags.map(tag => (
                  <button key={tag} className="sm-tag" onClick={() => setQuery(tag)}>{tag}</button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="sm-hint">
              <div className="sm-hint-icon">😕</div>
              <p>"{query}" {t('search.notFound')}</p>
            </div>
          ) : (
            <>
              <div className="sm-count">{results.length} {t('search.found')}</div>
              {results.map(p => (
                <div key={p.id} className="sm-result" onClick={() => handleAdd(p)}>
                  <div className="sm-result-media">
                    {p.image
                      ? <img src={p.image} alt={p.name} />
                      : <span>{p.emoji || '🛍️'}</span>
                    }
                  </div>
                  <div className="sm-result-info">
                    <p className="sm-result-name">{p.name}</p>
                    <p className="sm-result-cat">{p.category}</p>
                  </div>
                  <div className="sm-result-right">
                    <span className="sm-result-price">{p.price?.toLocaleString()} UZS</span>
                    {p.discount > 0 && <span className="sm-result-disc">-{p.discount}%</span>}
                  </div>
                  <button className="sm-add-btn" title={t('search.addToCart')}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

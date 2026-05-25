import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../context/LanguageContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function SearchModal({ onClose, onRequireAuth }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef(null)
  const timerRef = useRef(null)
  const { addItem } = useCart()
  const { addToast } = useToast()
  const { user } = useAuth()
  const { t } = useLang()

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const doSearch = useCallback(async (q) => {
    if (q.length < 2) { setResults([]); setSearched(false); return }
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`${API}/products?search=${encodeURIComponent(q)}&limit=20`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResults(Array.isArray(data) ? data : (data.data || []))
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    clearTimeout(timerRef.current)
    const q = query.trim()
    if (q.length < 2) { setResults([]); setSearched(false); setLoading(false); return }
    setLoading(true)
    timerRef.current = setTimeout(() => doSearch(q), 350)
    return () => clearTimeout(timerRef.current)
  }, [query, doSearch])

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
          {loading ? (
            <div className="sm-spinner" />
          ) : (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          )}
          <input
            ref={inputRef}
            className="sm-input"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className="sm-clear" onClick={() => setQuery('')} aria-label="Tozalash">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
          <button className="sm-close" onClick={onClose}>
            <kbd>Esc</kbd>
          </button>
        </div>

        <div className="sm-results">
          {query.trim().length < 2 ? (
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
          ) : !loading && searched && results.length === 0 ? (
            <div className="sm-hint">
              <div className="sm-hint-icon">😕</div>
              <p>"{query}" {t('search.notFound')}</p>
            </div>
          ) : loading && results.length === 0 ? (
            <div className="sm-loading-list">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="sm-result-skeleton">
                  <div className="skeleton sm-skel-thumb" />
                  <div className="sm-skel-lines">
                    <div className="skeleton sm-skel-name" />
                    <div className="skeleton sm-skel-cat" />
                  </div>
                  <div className="skeleton sm-skel-price" />
                </div>
              ))}
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
                  <button className="sm-add-btn" title={t('search.addToCart')} onClick={e => { e.stopPropagation(); handleAdd(p) }}>
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

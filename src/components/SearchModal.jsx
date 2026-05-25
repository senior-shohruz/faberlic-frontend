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
        {/* Input */}
        <div className="sm-input-wrap">
          <div className="sm-search-icon">
            {loading
              ? <div className="sm-spinner" />
              : <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            }
          </div>
          <input
            ref={inputRef}
            className="sm-input"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="sm-input-actions">
            {query && (
              <button className="sm-clear" onClick={() => setQuery('')} aria-label="Tozalash">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
            <button className="sm-esc-btn" onClick={onClose}><kbd>Esc</kbd></button>
          </div>
        </div>

        {/* Body */}
        <div className="sm-body">
          {query.trim().length < 2 ? (
            <div className="sm-empty-state">
              <div className="sm-empty-graphic">
                <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" opacity="0.25"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              </div>
              <p className="sm-empty-title">{t('search.hintMin')}</p>
              <div className="sm-tags-row">
                <span className="sm-tags-label">{t('search.popular')}</span>
                {Array.isArray(popularTags) && popularTags.map(tag => (
                  <button key={tag} className="sm-tag" onClick={() => setQuery(tag)}>{tag}</button>
                ))}
              </div>
            </div>
          ) : !loading && searched && results.length === 0 ? (
            <div className="sm-empty-state">
              <div className="sm-empty-graphic">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity="0.2"><circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="1.5"/><path d="M14 14l12 12M26 14L14 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <p className="sm-empty-title">"{query}" {t('search.notFound')}</p>
              <p className="sm-empty-sub">Boshqa so'z bilan qidiring</p>
            </div>
          ) : loading && results.length === 0 ? (
            <div className="sm-skeletons">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="sm-skel-row">
                  <div className="skeleton sm-skel-thumb" />
                  <div className="sm-skel-lines">
                    <div className="skeleton sm-skel-name" style={{ width: `${55 + i * 7}%` }} />
                    <div className="skeleton sm-skel-cat" />
                  </div>
                  <div className="skeleton sm-skel-price" />
                </div>
              ))}
            </div>
          ) : (
            <div className="sm-results-wrap">
              <div className="sm-results-header">
                <span className="sm-results-label">Natijalar</span>
                <span className="sm-results-count">{results.length} ta</span>
              </div>
              <div className="sm-results-list">
                {results.map(p => (
                  <div key={p.id} className="sm-result" onClick={() => handleAdd(p)}>
                    <div className="sm-result-thumb">
                      {p.image
                        ? <img src={p.image} alt={p.name} />
                        : <span className="sm-result-emoji">{p.emoji || '🛍️'}</span>
                      }
                    </div>
                    <div className="sm-result-info">
                      <p className="sm-result-name">{p.name}</p>
                      <p className="sm-result-cat">{p.category}</p>
                    </div>
                    <div className="sm-result-meta">
                      {p.discount > 0 && <span className="sm-result-disc">-{p.discount}%</span>}
                      <span className="sm-result-price">{p.price?.toLocaleString()} <em>UZS</em></span>
                    </div>
                    <button className="sm-add-btn" title={t('search.addToCart')} onClick={e => { e.stopPropagation(); handleAdd(p) }}>
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sm-footer">
          <div className="sm-footer-hint"><kbd>↵</kbd> <span>Savatga</span></div>
          <div className="sm-footer-hint"><kbd>Esc</kbd> <span>Yopish</span></div>
        </div>
      </div>
    </div>
  )
}

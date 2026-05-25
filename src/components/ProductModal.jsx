import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../context/LanguageContext'

export default function ProductModal({ product, onClose, onRequireAuth }) {
  const { user } = useAuth()
  const { addItem, items } = useCart()
  const { addToast } = useToast()
  const { t } = useLang()
  const [liked, setLiked] = useState(false)
  const [qty, setQty] = useState(1)
  const inCart = items.some(i => i.id === product.id)

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  function handleAdd() {
    if (!user) { onRequireAuth?.(); onClose(); return }
    for (let i = 0; i < qty; i++) addItem(product)
    addToast(`${product.emoji || '🛍️'} ${t('products.addedToCart')}`, 'success')
    onClose()
  }

  function handleLike() {
    setLiked(l => !l)
    if (!liked) addToast(t('products.addedToFav'), 'success')
  }

  const saving = product.oldPrice ? product.oldPrice - product.price : 0

  return createPortal(
    <div className="pm-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="pm">

        {/* Left: image */}
        <div className="pm-img-side">
          <div className="pm-img-bg" />
          <div className="pm-media">
            {product.image
              ? <img src={product.image} alt={product.name} className="pm-img" />
              : <div className="pm-emoji">{product.emoji || '🛍️'}</div>
            }
          </div>
          {product.discount > 0 && (
            <div className="pm-disc-badge">-{product.discount}%</div>
          )}
          {saving > 0 && (
            <div className="pm-save-pill">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              {t('productModal.saving')} {saving.toLocaleString()} UZS
            </div>
          )}
        </div>

        {/* Right: info */}
        <div className="pm-info-side">
          <button className="pm-close" onClick={onClose}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          <div className="pm-top">
            {product.category && (
              <span className="pm-cat-pill">
                {t(`categories.names.${product.category}`) || product.category}
              </span>
            )}
          </div>

          <h2 className="pm-name">{product.name}</h2>

          <div className="pm-price-block">
            <span className="pm-price">{product.price?.toLocaleString()} <span className="pm-cur">UZS</span></span>
            {product.oldPrice && (
              <span className="pm-old">{product.oldPrice?.toLocaleString()} UZS</span>
            )}
          </div>

          {product.stock > 0 && (
            <div className="pm-stock-row">
              <span className="pm-stock-dot" />
              {t('productModal.inStock')} <strong>{product.stock} {t('productModal.pieces')}</strong>
            </div>
          )}

          <div className="pm-divider" />

          <div className="pm-qty-row">
            <span className="pm-qty-label">{t('productModal.qty')}</span>
            <div className="pm-qty">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>
              </button>
              <span>{qty}</span>
              <button onClick={() => setQty(q => q + 1)}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
          </div>

          <div className="pm-actions">
            <button className={`pm-add-btn ${inCart ? 'in-cart' : ''}`} onClick={handleAdd}>
              {inCart ? (
                <>
                  <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                  {t('productModal.inCart')}
                </>
              ) : (
                <>
                  <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 01-8 0"/>
                  </svg>
                  {t('productModal.addToCart')}
                </>
              )}
            </button>
            <button className={`pm-wish-btn ${liked ? 'liked' : ''}`} onClick={handleLike} title={t('productModal.addToFav')}>
              <svg width="20" height="20" fill={liked ? '#e63946' : 'none'} stroke={liked ? '#e63946' : 'currentColor'} strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
            </button>
          </div>

          <div className="pm-features">
            <div className="pm-feat pm-feat-pickup">
              <span className="pm-feat-ico">🏪</span>
              <div className="pm-feat-text">
                <span className="pm-feat-label">{t('productModal.pickup')}</span>
                <span className="pm-feat-free">{t('checkout.free')}</span>
              </div>
            </div>
            <div className="pm-feat pm-feat-guarantee">
              <span className="pm-feat-ico">✅</span>
              <span className="pm-feat-label">{t('productModal.guarantee')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

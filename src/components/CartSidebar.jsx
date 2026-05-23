import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LanguageContext'
import CheckoutModal from './CheckoutModal'

export default function CartSidebar({ onRequireAuth }) {
  const { items, removeItem, updateQty, total, count, open, setOpen, clear } = useCart()
  const { t } = useLang()
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  return (
    <>
      {open && <div className="cs-backdrop" onClick={() => setOpen(false)} />}
      <aside className={`cs-panel ${open ? 'open' : ''}`}>

        {/* Header */}
        <div className="cs-head">
          <div className="cs-head-left">
            <div className="cs-head-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <div>
              <h2 className="cs-title">{t('cart.title')}</h2>
              <p className="cs-subtitle">{count > 0 ? `${count} ${t('cart.items')}` : t('cart.emptyLabel')}</p>
            </div>
          </div>
          <button className="cs-close" onClick={() => setOpen(false)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Pickup badge */}
        {items.length > 0 && (
          <div className="cs-pickup-note">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {t('cart.pickupNote')}
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="cs-empty">
            <div className="cs-empty-ring">
              <div className="cs-empty-ico">
                <svg width="40" height="40" fill="none" stroke="#cbd5e1" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
              </div>
            </div>
            <p className="cs-empty-title">{t('cart.empty')}</p>
            <p className="cs-empty-sub">{t('cart.emptyDesc')}</p>
            <button className="cs-shop-btn" onClick={() => setOpen(false)}>
              {t('cart.shopNow')}
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="cs-items">
              {items.map(item => (
                <div key={item.id} className="cs-item">
                  <div className="cs-item-img">
                    {item.image
                      ? <img src={item.image} alt={item.name} />
                      : <span className="cs-item-emoji">{item.emoji || '📦'}</span>
                    }
                  </div>
                  <div className="cs-item-body">
                    <p className="cs-item-name">{item.name}</p>
                    <p className="cs-item-unit">{item.price.toLocaleString()} UZS / ta</p>
                    <div className="cs-item-row">
                      <div className="cs-qty">
                        <button className="cs-qty-btn" onClick={() => updateQty(item.id, item.qty - 1)}>
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>
                        </button>
                        <span className="cs-qty-val">{item.qty}</span>
                        <button className="cs-qty-btn" onClick={() => updateQty(item.id, item.qty + 1)}>
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                        </button>
                      </div>
                      <span className="cs-item-total">{(item.price * item.qty).toLocaleString()} UZS</span>
                    </div>
                  </div>
                  <button className="cs-remove" onClick={() => removeItem(item.id)} title="O'chirish">
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="cs-foot">
              <div className="cs-totals">
                <div className="cs-tot-row">
                  <span>{count} {t('cart.items')}</span>
                  <span>{total.toLocaleString()} UZS</span>
                </div>
                <div className="cs-tot-sum">
                  <span>{t('cart.total')}</span>
                  <strong>{total.toLocaleString()} UZS</strong>
                </div>
              </div>

              <button className="cs-checkout" onClick={() => { setOpen(false); setCheckoutOpen(true) }}>
                <span>{t('cart.checkout')}</span>
                <span className="cs-checkout-ico">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </span>
              </button>

              <button className="cs-clear" onClick={clear}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                </svg>
                {t('cart.clear')}
              </button>
            </div>
          </>
        )}
      </aside>

      {checkoutOpen && (
        <CheckoutModal
          onClose={() => setCheckoutOpen(false)}
          onRequireAuth={() => { setCheckoutOpen(false); onRequireAuth?.() }}
        />
      )}
    </>
  )
}

import { useState, useEffect } from 'react'
import { api } from '../api'
import { useLang } from '../context/LanguageContext'

const STATUS_COLORS = {
  pending:    { color: '#f59e0b', bg: '#fef3c7' },
  processing: { color: '#3b82f6', bg: '#dbeafe' },
  delivered:  { color: '#22c55e', bg: '#dcfce7' },
  cancelled:  { color: '#ef4444', bg: '#fee2e2' },
}

export default function MyOrders({ onClose }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const { t } = useLang()

  useEffect(() => {
    api.get('/orders/my')
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  const getStatus = (status) => {
    const colors = STATUS_COLORS[status] || STATUS_COLORS.pending
    const label = t(`myOrders.status.${status}`) || t('myOrders.status.pending')
    return { ...colors, label }
  }

  return (
    <div className="mo-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="mo-modal">
        <div className="mo-header">
          <div className="mo-header-left">
            <div className="mo-icon">🛍️</div>
            <div>
              <h2 className="mo-title">{t('nav.myOrders')}</h2>
              <p className="mo-sub">{orders.length} {t('myOrders.count')}</p>
            </div>
          </div>
          <button className="mo-close" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="mo-body">
          {loading ? (
            <div className="mo-loading">
              <div className="mo-spinner" />
              <p>{t('common.loading')}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="mo-empty">
              <div className="mo-empty-icon">📋</div>
              <p className="mo-empty-title">{t('myOrders.empty')}</p>
              <p className="mo-empty-sub">{t('myOrders.emptySub')}</p>
              <button className="mo-close-btn" onClick={onClose}>{t('myOrders.shopNow')}</button>
            </div>
          ) : (
            <div className="mo-list">
              {orders.map((order, i) => {
                const s = getStatus(order.status)
                const isOpen = expanded === order.id
                return (
                  <div key={order.id} className={`mo-order ${isOpen ? 'open' : ''}`}>
                    <button className="mo-order-head" onClick={() => setExpanded(isOpen ? null : order.id)}>
                      <div className="mo-order-left">
                        <span className="mo-order-num">#{orders.length - i}</span>
                        <div>
                          <p className="mo-order-id">#{order.id?.slice(0, 8).toUpperCase()}</p>
                          <p className="mo-order-date">{new Date(order.createdAt).toLocaleDateString('uz-UZ')}</p>
                        </div>
                      </div>
                      <div className="mo-order-right">
                        <span className="mo-status-pill" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                        <strong className="mo-total">{order.total?.toLocaleString()} UZS</strong>
                        <svg
                          width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, color: '#94a3b8' }}
                        >
                          <path d="M6 9l6 6 6-6"/>
                        </svg>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="mo-order-body">
                        {(order.userName || order.fullName || order.phone) && (
                          <div className="mo-customer-card">
                            <div className="mo-customer-label">
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                              </svg>
                              {t('myOrders.customer')}
                            </div>
                            <div className="mo-customer-rows">
                              {(order.userName || order.fullName) && (
                                <div className="mo-customer-row">
                                  <span className="mo-customer-key">{t('myOrders.customerName')}:</span>
                                  <strong className="mo-customer-val">{order.userName || order.fullName}</strong>
                                </div>
                              )}
                              {order.phone && (
                                <div className="mo-customer-row">
                                  <span className="mo-customer-key">{t('myOrders.customerPhone')}:</span>
                                  <a className="mo-customer-phone" href={`tel:${order.phone}`}>{order.phone}</a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {order.pickupPointName && (
                          <div className="mo-punkt-card">
                            <div className="mo-punkt-label">
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                              {t('myOrders.pickupPoint')}
                            </div>
                            <div className="mo-punkt-top">
                              <span className="mo-punkt-ico">🏪</span>
                              <div>
                                <p className="mo-punkt-name">{order.pickupPointName}</p>
                                {order.pickupPointAddress && (
                                  <p className="mo-punkt-addr">{order.pickupPointAddress}</p>
                                )}
                              </div>
                            </div>
                            {(order.pickupPointMapLink || order.pickupPointAddress) && (
                              <a
                                className="mo-punkt-map"
                                href={order.pickupPointMapLink || `https://maps.google.com/?q=${encodeURIComponent(order.pickupPointAddress)}`}
                                target="_blank" rel="noopener noreferrer"
                              >
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                {t('myOrders.viewOnMap')}
                                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                              </a>
                            )}
                          </div>
                        )}

                        <div className="mo-order-items">
                          {order.items?.map((item, j) => (
                            <div key={j} className="mo-item">
                              <span className="mo-item-emoji">{item.emoji || '📦'}</span>
                              <span className="mo-item-name">{item.name}</span>
                              <span className="mo-item-qty">× {item.qty}</span>
                              <span className="mo-item-price">{(item.price * item.qty).toLocaleString()} UZS</span>
                            </div>
                          ))}
                        </div>
                        <div className="mo-order-meta">
                          <div className="mo-meta-row">
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                            {order.paymentMethod === 'cash' ? t('myOrders.cash') : t('myOrders.transfer')}
                          </div>
                        </div>
                        <div className="mo-order-total">
                          <span>{t('myOrders.total')}:</span>
                          <strong>{order.total?.toLocaleString()} UZS</strong>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

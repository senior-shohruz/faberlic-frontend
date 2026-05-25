import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../context/LanguageContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function CheckoutModal({ onClose, onRequireAuth }) {
  const { user } = useAuth()
  const { items, total, clear } = useCart()
  const { addToast } = useToast()
  const { t } = useLang()

  const [pickupPoints, setPickupPoints] = useState([])
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    comment: '',
    pickupPointId: '',
    payment: 'cash',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [pointsLoading, setPointsLoading] = useState(true)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    fetch(`${API}/pickup-points`)
      .then(r => r.json())
      .then(data => {
        const active = data.filter(p => p.active !== false)
        setPickupPoints(active)
        if (active.length > 0) setForm(f => ({ ...f, pickupPointId: active[0].id }))
      })
      .catch(() => {})
      .finally(() => setPointsLoading(false))
  }, [])

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.fullName.trim()) errs.fullName = t('checkout.required')
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 9) errs.phone = t('checkout.phoneInvalid')
    if (!form.pickupPointId) errs.pickupPointId = t('checkout.pickupRequired')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function submit(e) {
    e.preventDefault()
    if (!user) { onRequireAuth?.(); onClose(); return }
    if (!validate()) return
    const selectedPoint = pickupPoints.find(p => p.id === form.pickupPointId)
    setLoading(true)
    try {
      const token = localStorage.getItem('fab_token')
      const resp = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, emoji: i.emoji })),
          total,
          fullName: form.fullName,
          phone: '+998' + form.phone.replace(/\D/g, ''),
          comment: form.comment,
          paymentMethod: form.payment,
          deliveryMethod: 'pickup',
          pickupPointId: form.pickupPointId,
          pickupPointName: selectedPoint?.name || '',
          pickupPointAddress: selectedPoint?.address || '',
          pickupPointMapLink: selectedPoint?.mapLink || '',
          deliveryCost: 0,
        }),
      })
      if (!resp.ok) throw new Error('error')
      const order = await resp.json()
      setSuccess(order)
      clear()
    } catch {
      addToast(t('checkout.errorMsg'), 'error')
    } finally {
      setLoading(false)
    }
  }

  /* ── Login gate ── */
  if (!user) return createPortal(
    <div className="ck-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="ck-modal ck-modal-sm">
        <button className="ck-x" onClick={onClose}><XIcon /></button>
        <div className="ck-gate">
          <div className="ck-gate-ico">🔐</div>
          <h3>{t('checkout.loginGate')}</h3>
          <button className="ck-submit" onClick={() => { onRequireAuth?.(); onClose() }}>{t('checkout.login')}</button>
        </div>
      </div>
    </div>,
    document.body
  )

  /* ── Success screen ── */
  if (success) {
    const point = pickupPoints.find(p => p.id === success.pickupPointId)
    const mapLink = success.pickupPointMapLink
      || (success.pickupPointAddress ? `https://maps.google.com/?q=${encodeURIComponent(success.pickupPointAddress)}` : null)
    return createPortal(
      <div className="ck-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
        <div className="ck-modal ck-modal-sm">
          <div className="ck-success">
            <div className="ck-success-ring">
              <svg width="52" height="52" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="ck-success-title">{t('checkout.orderAccepted')}</h2>
            <p className="ck-success-desc">{t('checkout.weWillContact')}</p>
            <div className="ck-success-id">
              {t('checkout.orderLabel')} <strong>#{success.id?.slice(0, 8).toUpperCase()}</strong>
            </div>

            {success.pickupPointName && (
              <div className="ck-goto-card">
                <div className="ck-goto-label">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {t('checkout.comeHere')}
                </div>
                <div className="ck-goto-top">
                  <span className="ck-goto-emoji">{point?.emoji || '🏪'}</span>
                  <div>
                    <p className="ck-goto-name">{success.pickupPointName}</p>
                    <p className="ck-goto-addr">{success.pickupPointAddress}</p>
                  </div>
                </div>
                {point?.hours && <p className="ck-goto-hrs">🕐 {point.hours}</p>}
                {point?.landmark && <p className="ck-goto-ldmk">🚶 {point.landmark}</p>}
                {mapLink && (
                  <a className="ck-goto-map" href={mapLink} target="_blank" rel="noopener noreferrer">
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {t('checkout.viewOnMap')}
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                )}
              </div>
            )}

            <button className="ck-submit" onClick={onClose}>{t('checkout.continue')}</button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  /* ── Main form ── */
  return createPortal(
    <div className="ck-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="ck-modal">

        {/* Header */}
        <div className="ck-head">
          <div className="ck-head-left">
            <div className="ck-head-ico">🛍️</div>
            <div>
              <h2 className="ck-head-title">{t('checkout.title')}</h2>
              <p className="ck-head-sub">{items.length} {t('checkout.items')}</p>
            </div>
          </div>
          <button className="ck-x" onClick={onClose}><XIcon /></button>
        </div>

        {/* Body */}
        <div className="ck-body">
          <form className="ck-grid" onSubmit={submit} noValidate>

            {/* LEFT */}
            <div className="ck-left">

              {/* Step 1: Contact */}
              <div className="ck-card">
                <div className="ck-step-title">
                  <span className="ck-step-num">1</span>
                  {t('checkout.contactInfo')}
                </div>
                <div className="ck-row2">
                  <div className={`ck-field ${errors.fullName ? 'err' : ''}`}>
                    <label>{t('checkout.fullName')}</label>
                    <div className="ck-inp-wrap">
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <input type="text" placeholder={t('checkout.namePlaceholder')} value={form.fullName} onChange={e => set('fullName', e.target.value)} />
                    </div>
                    {errors.fullName && <span className="ck-err">{errors.fullName}</span>}
                  </div>
                  <div className={`ck-field ${errors.phone ? 'err' : ''}`}>
                    <label>{t('checkout.phone')}</label>
                    <div className="ck-inp-wrap ck-phone">
                      <span className="ck-prefix">+998</span>
                      <input type="tel" placeholder={t('checkout.phonePlaceholder')} value={form.phone}
                        onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 9))} />
                    </div>
                    {errors.phone && <span className="ck-err">{errors.phone}</span>}
                  </div>
                </div>
                <div className="ck-field">
                  <label>{t('checkout.comment')} <span className="ck-opt">{t('checkout.commentOptional')}</span></label>
                  <textarea className="ck-textarea" placeholder={t('checkout.commentPlaceholder')} value={form.comment}
                    onChange={e => set('comment', e.target.value)} rows={2} />
                </div>
              </div>

              {/* Step 2: Pickup */}
              <div className="ck-card">
                <div className="ck-step-title">
                  <span className="ck-step-num">2</span>
                  {t('checkout.pickupPoint')}
                </div>
                {pointsLoading ? (
                  <div className="ck-loading"><span className="ck-spin" /></div>
                ) : (
                  <div className="ck-points">
                    {pickupPoints.map(point => (
                      <label key={point.id} className={`ck-point ${form.pickupPointId === point.id ? 'on' : ''}`}>
                        <input type="radio" name="pp" value={point.id}
                          checked={form.pickupPointId === point.id}
                          onChange={() => set('pickupPointId', point.id)} />
                        <div className="ck-point-top">
                          <span className="ck-point-emoji">{point.emoji}</span>
                          {form.pickupPointId === point.id && (
                            <span className="ck-point-check">
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                            </span>
                          )}
                        </div>
                        <p className="ck-point-name">{point.name}</p>
                        <a className="ck-point-addr"
                          href={point.mapLink || `https://maps.google.com/?q=${encodeURIComponent(point.address)}`}
                          target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}>
                          📍 {point.address}
                        </a>
                        <p className="ck-point-hrs">🕐 {point.hours}</p>
                        {point.landmark && <p className="ck-point-ldmk">🚶 {point.landmark}</p>}
                      </label>
                    ))}
                  </div>
                )}
                {errors.pickupPointId && <span className="ck-err" style={{marginTop:8,display:'block'}}>{errors.pickupPointId}</span>}
              </div>

              {/* Step 3: Payment */}
              <div className="ck-card">
                <div className="ck-step-title">
                  <span className="ck-step-num">3</span>
                  {t('checkout.payment')}
                </div>
                <div className="ck-pay-opts">
                  <label className={`ck-pay ${form.payment === 'cash' ? 'on' : ''}`}>
                    <input type="radio" name="pay" value="cash" checked={form.payment === 'cash'} onChange={() => set('payment', 'cash')} />
                    <span className="ck-pay-ico">💵</span>
                    <div>
                      <strong>{t('checkout.cash')}</strong>
                      <small>{t('checkout.cashDesc')}</small>
                    </div>
                  </label>
                  <label className={`ck-pay ${form.payment === 'transfer' ? 'on' : ''}`}>
                    <input type="radio" name="pay" value="transfer" checked={form.payment === 'transfer'} onChange={() => set('payment', 'transfer')} />
                    <span className="ck-pay-ico">💳</span>
                    <div>
                      <strong>{t('checkout.transfer')}</strong>
                      <small>{t('checkout.transferDesc')}</small>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* RIGHT: Summary */}
            <div className="ck-right">
              <div className="ck-summary">
                <h3 className="ck-sum-title">{t('checkout.summary')}</h3>
                <div className="ck-sum-items">
                  {items.map(item => (
                    <div key={item.id} className="ck-sum-item">
                      <span className="ck-sum-ico">{item.emoji || '📦'}</span>
                      <div className="ck-sum-info">
                        <p className="ck-sum-name">{item.name}</p>
                        <p className="ck-sum-qty">× {item.qty}</p>
                      </div>
                      <span className="ck-sum-price">{(item.price * item.qty).toLocaleString()} UZS</span>
                    </div>
                  ))}
                </div>
                <div className="ck-sum-footer">
                  <div className="ck-sum-row">
                    <span>🏪 {t('checkout.pickupLabel')}</span>
                    <span style={{color:'#22c55e',fontWeight:600}}>{t('checkout.free')}</span>
                  </div>
                  <div className="ck-sum-total">
                    <span>{t('checkout.total')}</span>
                    <strong>{total.toLocaleString()} UZS</strong>
                  </div>
                </div>
                <button type="submit" className="ck-submit" disabled={loading}>
                  {loading
                    ? <><span className="ck-spin" /> {t('checkout.submitting')}</>
                    : <>{t('checkout.submit')} <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>,
    document.body
  )
}

function XIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
}

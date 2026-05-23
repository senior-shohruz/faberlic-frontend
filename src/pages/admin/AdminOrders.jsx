import { useState, useEffect } from 'react'
import { api } from '../../api'

const STATUSES = [
  { value: 'pending',    label: 'Kutilmoqda',    color: '#f59e0b', bg: '#fef3c7' },
  { value: 'processing', label: 'Jarayonda',     color: '#3b82f6', bg: '#dbeafe' },
  { value: 'delivered',  label: 'Yetkazildi',    color: '#22c55e', bg: '#dcfce7' },
  { value: 'cancelled',  label: 'Bekor qilindi', color: '#ef4444', bg: '#fee2e2' },
]

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [detail, setDetail] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/orders').then(data => setOrders([...data].reverse())).finally(() => setLoading(false))
  }, [])

  async function changeStatus(id, status) {
    try {
      const updated = await api.put(`/orders/${id}/status`, { status })
      setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, status: updated.status } : o))
      if (detail?.id === id) setDetail(d => ({ ...d, status: updated.status }))
    } catch (e) { alert(e.message) }
  }

  async function remove(id) {
    if (!confirm("Buyurtmani o'chirishni tasdiqlaysizmi?")) return
    await api.delete(`/orders/${id}`)
    setOrders(prev => prev.filter(o => o.id !== id))
    if (detail?.id === id) setDetail(null)
  }

  const getStatus = val => STATUSES.find(s => s.value === val) || STATUSES[0]

  const filtered = orders.filter(o => {
    const matchFilter = filter === 'all' || o.status === filter
    const matchSearch = !search || o.userName?.toLowerCase().includes(search.toLowerCase()) || o.phone?.includes(search)
    return matchFilter && matchSearch
  })

  const counts = STATUSES.reduce((acc, s) => {
    acc[s.value] = orders.filter(o => o.status === s.value).length
    return acc
  }, {})

  if (loading) return <div className="adm-loading-wrap"><div className="adm-spinner" /><p>Yuklanmoqda...</p></div>

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Buyurtmalar</h1>
          <p className="adm-page-sub">{orders.length} ta buyurtma</p>
        </div>
        <div className="adm-search-wrap">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input className="adm-search" placeholder="Mijoz nomi yoki telefon..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="adm-filter-btns">
        <button className={`adm-filter-btn${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
          Barchasi <span className="adm-filter-count">{orders.length}</span>
        </button>
        {STATUSES.map(s => (
          <button key={s.value} className={`adm-filter-btn${filter === s.value ? ' active' : ''}`} onClick={() => setFilter(s.value)} style={filter === s.value ? { borderColor: s.color, color: s.color } : {}}>
            {s.label} <span className="adm-filter-count">{counts[s.value]}</span>
          </button>
        ))}
      </div>

      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Mijoz</th>
                <th>Mahsulotlar</th>
                <th>Punkt</th>
                <th>Summa</th>
                <th>Status</th>
                <th>Sana</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => {
                const st = getStatus(o.status)
                return (
                  <tr key={o.id} onClick={() => setDetail(o)} className="adm-row-clickable">
                    <td><span className="adm-art">#{filtered.length - i}</span></td>
                    <td>
                      <div className="adm-u-row">
                        <div className="adm-u-avatar sm">{o.userName?.[0]?.toUpperCase()}</div>
                        <div>
                          <div className="adm-u-name">{o.userName}</div>
                          {o.phone && <div className="adm-muted" style={{ fontSize: 11 }}>{o.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="adm-muted" style={{ maxWidth: 180, fontSize: 12 }}>
                      {o.items?.slice(0, 2).map(it => `${it.emoji || ''} ${it.name}`.trim()).join(', ')}
                      {o.items?.length > 2 && ` +${o.items.length - 2}`}
                    </td>
                    <td>
                      {o.pickupPointName
                        ? <span className="ord-punkt-pill">🏪 {o.pickupPointName}</span>
                        : <span className="adm-muted" style={{fontSize:12}}>—</span>}
                    </td>
                    <td><strong className="adm-price-new">{o.total?.toLocaleString()} UZS</strong></td>
                    <td onClick={e => e.stopPropagation()}>
                      <select
                        className="adm-status-select"
                        style={{ borderColor: st.color, color: st.color, background: st.bg }}
                        value={o.status}
                        onChange={e => changeStatus(o.id, e.target.value)}
                      >
                        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="adm-muted" style={{ fontSize: 12 }}>
                      {new Date(o.createdAt).toLocaleDateString('uz-UZ')}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="adm-btn-icon del" onClick={() => remove(o.id)} title="O'chirish">
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="adm-empty"><div className="adm-empty-icon">📋</div><p>Buyurtmalar yo'q</p></div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {detail && (
        <div className="adm-overlay" onMouseDown={e => e.target === e.currentTarget && setDetail(null)}>
          <div className="adm-modal adm-order-modal">
            <div className="adm-modal-header">
              <h2>Buyurtma #{detail.id?.slice(0, 8).toUpperCase()}</h2>
              <button className="adm-modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="adm-modal-body">
              <div className="ord-detail-grid">
                <div className="ord-detail-col">
                  <h4 className="ord-section-title">Mijoz ma'lumotlari</h4>
                  <div className="ord-info-row"><span>Ism:</span><strong>{detail.userName}</strong></div>
                  {detail.phone && <div className="ord-info-row"><span>Telefon:</span><a href={`tel:${detail.phone}`}><strong>{detail.phone}</strong></a></div>}
                  {detail.comment && <div className="ord-info-row"><span>Izoh:</span><span>{detail.comment}</span></div>}
                  <div className="ord-info-row"><span>To'lov:</span><strong>{detail.paymentMethod === 'cash' ? '💵 Naqd' : '💳 Karta'}</strong></div>
                </div>
                <div className="ord-detail-col">
                  <h4 className="ord-section-title">Olib ketish punkti</h4>
                  {detail.pickupPointName ? (
                    <div className="ord-punkt-card">
                      <div className="ord-punkt-head">
                        <span className="ord-punkt-ico">🏪</span>
                        <div>
                          <p className="ord-punkt-name">{detail.pickupPointName}</p>
                          <p className="ord-punkt-addr">{detail.pickupPointAddress}</p>
                        </div>
                      </div>
                      {(detail.pickupPointMapLink || detail.pickupPointAddress) && (
                        <a
                          className="ord-punkt-map"
                          href={detail.pickupPointMapLink || `https://maps.google.com/?q=${encodeURIComponent(detail.pickupPointAddress)}`}
                          target="_blank" rel="noopener noreferrer"
                        >
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          Xaritada ochish
                          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        </a>
                      )}
                    </div>
                  ) : <p className="adm-muted">—</p>}
                  <h4 className="ord-section-title" style={{ marginTop: 16 }}>Status</h4>
                  <select
                    className="adm-status-select"
                    style={{ borderColor: getStatus(detail.status).color, color: getStatus(detail.status).color, background: getStatus(detail.status).bg, width: '100%' }}
                    value={detail.status}
                    onChange={e => changeStatus(detail.id, e.target.value)}
                  >
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <h4 className="ord-section-title" style={{ marginTop: 20 }}>Mahsulotlar</h4>
              <div className="ord-items">
                {detail.items?.map((it, i) => (
                  <div key={i} className="ord-item">
                    <span className="ord-item-emoji">{it.emoji || '📦'}</span>
                    <span className="ord-item-name">{it.name}</span>
                    <span className="ord-item-qty">× {it.qty}</span>
                    <span className="ord-item-price">{(it.price * it.qty).toLocaleString()} UZS</span>
                  </div>
                ))}
                <div className="ord-item-total">
                  <span>Jami:</span>
                  <strong>{detail.total?.toLocaleString()} UZS</strong>
                </div>
              </div>
            </div>
            <div className="adm-modal-footer">
              <button className="adm-btn-icon del" onClick={() => remove(detail.id)} style={{ padding: '8px 16px', borderRadius: 10 }}>
                <TrashIcon /> O'chirish
              </button>
              <button className="adm-btn-primary" onClick={() => setDetail(null)}>Yopish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TrashIcon() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg> }

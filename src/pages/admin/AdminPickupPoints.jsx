import { useState, useEffect } from 'react'
import { api } from '../../api'

const EMPTY = { name: '', address: '', phone: '', hours: '', landmark: '', emoji: '🏪', active: true, mapLink: '' }

export default function AdminPickupPoints() {
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | point-object
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    api.get('/pickup-points').then(setPoints).finally(() => setLoading(false))
  }, [])

  function openAdd() { setForm(EMPTY); setErrors({}); setModal('add') }
  function openEdit(p) { setForm({ ...p }); setErrors({}); setModal(p) }
  function closeModal() { setModal(null); setErrors({}) }

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Majburiy maydon'
    if (!form.address.trim()) e.address = 'Majburiy maydon'
    if (!form.hours.trim()) e.hours = 'Majburiy maydon'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function save() {
    if (!validate()) return
    setSaving(true)
    try {
      if (modal === 'add') {
        const created = await api.post('/pickup-points', form)
        setPoints(prev => [...prev, created])
      } else {
        const updated = await api.put(`/pickup-points/${modal.id}`, form)
        setPoints(prev => prev.map(p => p.id === updated.id ? updated : p))
      }
      closeModal()
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  async function toggleActive(point) {
    try {
      const updated = await api.put(`/pickup-points/${point.id}`, { ...point, active: !point.active })
      setPoints(prev => prev.map(p => p.id === updated.id ? updated : p))
    } catch (e) { alert(e.message) }
  }

  async function remove(id) {
    if (!confirm("Punktni o'chirishni tasdiqlaysizmi?")) return
    await api.delete(`/pickup-points/${id}`)
    setPoints(prev => prev.filter(p => p.id !== id))
  }

  if (loading) return <div className="adm-loading">Yuklanmoqda...</div>

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Olib ketish punktlari</h1>
          <p className="adm-page-sub">{points.length} ta punkt</p>
        </div>
        <button className="adm-btn-primary" onClick={openAdd}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Yangi punkt
        </button>
      </div>

      <div className="pp-grid">
        {points.map(point => (
          <div key={point.id} className={`pp-card ${!point.active ? 'inactive' : ''}`}>
            <div className="pp-card-top">
              <div className="pp-emoji">{point.emoji}</div>
              <div className="pp-card-actions">
                <button
                  className={`pp-toggle ${point.active ? 'on' : 'off'}`}
                  onClick={() => toggleActive(point)}
                  title={point.active ? 'Faolsizlashtirish' : 'Faollashtirish'}
                >
                  <span className="pp-toggle-knob" />
                </button>
                <button className="adm-btn-icon" onClick={() => openEdit(point)} title="Tahrirlash">
                  <EditIcon />
                </button>
                <button className="adm-btn-icon del" onClick={() => remove(point.id)} title="O'chirish">
                  <TrashIcon />
                </button>
              </div>
            </div>
            <h3 className="pp-name">{point.name}</h3>
            <div className="pp-info-rows">
              <a
                className="pp-info-row pp-map-link"
                href={point.mapLink || `https://maps.google.com/?q=${encodeURIComponent(point.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {point.address}
              </a>
              {point.phone && (
                <div className="pp-info-row">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.08 6.08l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  {point.phone}
                </div>
              )}
              <div className="pp-info-row">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {point.hours}
              </div>
              {point.landmark && (
                <div className="pp-info-row landmark">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                  {point.landmark}
                </div>
              )}
            </div>
            <div className={`pp-status-badge ${point.active ? 'active' : 'inactive'}`}>
              {point.active ? '✅ Faol' : '⏸ Faolsiz'}
            </div>
          </div>
        ))}

        {points.length === 0 && (
          <div className="adm-empty" style={{ gridColumn: '1/-1' }}>
            <div className="adm-empty-icon">🏪</div>
            <p>Hali punkt qo'shilmagan</p>
            <button className="adm-btn-primary" onClick={openAdd}>Birinchi punktni qo'shish</button>
          </div>
        )}
      </div>

      {modal && (
        <div className="adm-overlay" onMouseDown={e => e.target === e.currentTarget && closeModal()}>
          <div className="pp-modal">
            {/* Header */}
            <div className="pp-modal-header">
              <div className="pp-modal-header-left">
                <div className="pp-modal-icon">{form.emoji || '🏪'}</div>
                <div>
                  <h2 className="pp-modal-title">
                    {modal === 'add' ? "Yangi punkt qo'shish" : 'Punktni tahrirlash'}
                  </h2>
                  <p className="pp-modal-sub">Olib ketish punkti ma'lumotlari</p>
                </div>
              </div>
              <button className="pp-modal-close" onClick={closeModal}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Body */}
            <div className="pp-modal-body">
              {/* Name + Emoji */}
              <div className="pp-mform-row">
                <div className="pp-mfield" style={{ flex: 1 }}>
                  <label>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    Nomi *
                  </label>
                  <input
                    className={errors.name ? 'error' : ''}
                    value={form.name}
                    onChange={e => setField('name', e.target.value)}
                    placeholder="Chilonzor filiali"
                  />
                  {errors.name && <span className="pp-merr">{errors.name}</span>}
                </div>
                <div className="pp-mfield pp-mfield-emoji">
                  <label>Emoji</label>
                  <input
                    value={form.emoji}
                    onChange={e => setField('emoji', e.target.value)}
                    placeholder="🏪"
                    className="pp-emoji-input"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="pp-mfield">
                <label>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  To'liq manzil *
                </label>
                <input
                  className={errors.address ? 'error' : ''}
                  value={form.address}
                  onChange={e => setField('address', e.target.value)}
                  placeholder="Toshkent sh., Chilonzor tumani, Bunyodkor ko'chasi 5-uy"
                />
                {errors.address && <span className="pp-merr">{errors.address}</span>}
              </div>

              {/* Phone + Hours */}
              <div className="pp-mform-row">
                <div className="pp-mfield" style={{ flex: 1 }}>
                  <label>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.08 6.08l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                    Telefon
                  </label>
                  <input value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="+998 71 123-45-67" />
                </div>
                <div className="pp-mfield" style={{ flex: 1 }}>
                  <label>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Ish vaqti *
                  </label>
                  <input
                    className={errors.hours ? 'error' : ''}
                    value={form.hours}
                    onChange={e => setField('hours', e.target.value)}
                    placeholder="Du–Sha: 09:00–20:00"
                  />
                  {errors.hours && <span className="pp-merr">{errors.hours}</span>}
                </div>
              </div>

              {/* Landmark */}
              <div className="pp-mfield">
                <label>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                  Mo'ljal <span style={{ color: '#94a3b8', fontWeight: 500 }}>(ixtiyoriy)</span>
                </label>
                <input value={form.landmark} onChange={e => setField('landmark', e.target.value)} placeholder="Metro Chilonzordan 3 daqiqa yurish" />
              </div>

              {/* Google Maps Link */}
              <div className="pp-mfield">
                <label>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Google Maps link <span style={{ color: '#94a3b8', fontWeight: 500 }}>(ixtiyoriy)</span>
                </label>
                <input value={form.mapLink} onChange={e => setField('mapLink', e.target.value)} placeholder="https://maps.app.goo.gl/..." />
              </div>

              {/* Active toggle */}
              <label className="pp-mactive">
                <div className="pp-mactive-text">
                  <span className="pp-mactive-label">Faol holat</span>
                  <span className="pp-mactive-sub">Saytda ko'rinadi va buyurtma beriladi</span>
                </div>
                <button
                  type="button"
                  className={`pp-toggle ${form.active ? 'on' : 'off'}`}
                  onClick={() => setField('active', !form.active)}
                >
                  <span className="pp-toggle-knob" />
                </button>
              </label>
            </div>

            {/* Footer */}
            <div className="pp-modal-footer">
              <button className="pp-mcancel" onClick={closeModal}>Bekor qilish</button>
              <button className="pp-msave" onClick={save} disabled={saving}>
                {saving ? (
                  <><span className="pp-mbtn-spinner" /> Saqlanmoqda...</>
                ) : (
                  <><svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> Saqlash</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EditIcon() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }
function TrashIcon() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg> }

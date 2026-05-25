import { useState, useEffect, useRef } from 'react'
import { api } from '../../api'
import { useToast } from '../../context/ToastContext'

const GRADIENTS = [
  { label: 'Pushti',     value: 'linear-gradient(135deg, #ff6b9d 0%, #ffd1e8 100%)', accent: '#e91e8c' },
  { label: 'Binafsha',   value: 'linear-gradient(135deg, #6B2FA0 0%, #C39BD3 100%)', accent: '#6B2FA0' },
  { label: 'Yashil',     value: 'linear-gradient(135deg, #11998e 0%, #A9DFBF 100%)', accent: '#11998e' },
  { label: 'Ko\'k',      value: 'linear-gradient(135deg, #1a6bc8 0%, #AED6F1 100%)', accent: '#1a6bc8' },
  { label: 'To\'q sariq',value: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)', accent: '#f7971e' },
  { label: 'Qizil',      value: 'linear-gradient(135deg, #e63946 0%, #ffb3b3 100%)', accent: '#e63946' },
]

const EMPTY = {
  title: '',
  subtitle: '',
  badge: '',
  badgeSub: 'CHEGIRMA',
  btnText: 'Hozir xarid qiling!',
  gradient: GRADIENTS[0].value,
  accentColor: GRADIENTS[0].accent,
  bgImage: '',
  productImage: '',
  active: true,
}

export default function AdminBanners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [delId, setDelId] = useState(null)
  const bgRef = useRef()
  const prodRef = useRef()
  const { addToast } = useToast()

  useEffect(() => {
    api.get('/banners/all').then(setBanners).catch(() => setBanners([])).finally(() => setLoading(false))
  }, [])

  function openAdd() { setForm(EMPTY); setModal('add') }
  function openEdit(b) { setForm({ ...b, bgImage: b.bgImage || '', productImage: b.productImage || '' }); setModal(b) }
  function closeModal() { setModal(null) }
  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function selectGradient(g) { setForm(f => ({ ...f, gradient: g.value, accentColor: g.accent })) }

  function handleImg(key, e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setField(key, reader.result)
    reader.readAsDataURL(file)
  }

  async function save() {
    if (!form.title.trim()) { addToast('Sarlavha kiritish majburiy!', 'error'); return }
    setSaving(true)
    try {
      if (modal === 'add') {
        const b = await api.post('/banners', form)
        setBanners(prev => [...prev, b])
        addToast('✅ Banner qo\'shildi', 'success')
      } else {
        const b = await api.put(`/banners/${modal.id}`, form)
        setBanners(prev => prev.map(x => x.id === b.id ? b : x))
        addToast('✅ Banner yangilandi', 'success')
      }
      closeModal()
    } catch (e) { addToast(e.message, 'error') }
    setSaving(false)
  }

  async function toggleActive(banner) {
    try {
      const b = await api.put(`/banners/${banner.id}`, { ...banner, active: !banner.active })
      setBanners(prev => prev.map(x => x.id === b.id ? b : x))
      addToast(b.active ? 'Banner yoqildi' : 'Banner o\'chirildi', 'info')
    } catch (e) { addToast(e.message, 'error') }
  }

  async function remove(id) {
    try {
      await api.delete(`/banners/${id}`)
      setBanners(prev => prev.filter(b => b.id !== id))
      addToast('Banner o\'chirildi', 'info')
    } catch (e) { addToast(e.message, 'error') }
    setDelId(null)
  }

  if (loading) return (
    <div className="adm-loading-wrap"><div className="adm-spinner" /><p>Yuklanmoqda...</p></div>
  )

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Reklamalar (Bannerlar)</h1>
          <p className="adm-page-sub">{banners.length} ta banner • {banners.filter(b => b.active).length} ta faol</p>
        </div>
        <button className="adm-btn-primary" onClick={openAdd}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Yangi banner
        </button>
      </div>

      {banners.length === 0 ? (
        <div className="adm-card">
          <div className="adm-empty">
            <div className="adm-empty-icon">🖼️</div>
            <p>Banner yo'q. Yangi banner qo'shing.</p>
          </div>
        </div>
      ) : (
        <div className="bnr-admin-grid">
          {banners.map(b => (
            <div key={b.id} className={`bnr-admin-card ${!b.active ? 'inactive' : ''}`}>
              <div
                className="bnr-admin-preview"
                style={{
                  background: b.bgImage ? `url(${b.bgImage}) center/cover no-repeat` : b.gradient,
                }}
              >
                {b.bgImage && <div className="bnr-admin-preview-overlay" />}
                <div className="bnr-admin-preview-content">
                  <h3 className="bnr-admin-preview-title">{b.title || 'Sarlavha'}</h3>
                  {b.badge && (
                    <div className="bnr-admin-preview-badge" style={{ color: b.accentColor }}>
                      {b.badge} <span>{b.badgeSub}</span>
                    </div>
                  )}
                  <div className="bnr-admin-preview-btn" style={{ background: b.accentColor }}>{b.btnText}</div>
                </div>
                {b.productImage && (
                  <img src={b.productImage} alt="" className="bnr-admin-preview-prod" />
                )}
                {!b.active && <div className="bnr-admin-inactive-overlay"><span>Nofaol</span></div>}
              </div>

              <div className="bnr-admin-info">
                <p className="bnr-admin-subtitle">{b.subtitle || '—'}</p>
                <div className="bnr-admin-footer">
                  <button
                    className={`bnr-toggle ${b.active ? 'on' : 'off'}`}
                    onClick={() => toggleActive(b)}
                    title={b.active ? 'Nofaol qilish' : 'Faollashtirish'}
                  >
                    <span className="bnr-toggle-thumb" />
                  </button>
                  <span className="bnr-toggle-label">{b.active ? 'Faol' : 'Nofaol'}</span>
                  <div style={{ flex: 1 }} />
                  <button className="adm-btn-icon edit" onClick={() => openEdit(b)}><EditIcon /></button>
                  <button className="adm-btn-icon del" onClick={() => setDelId(b.id)}><TrashIcon /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <div className="adm-overlay" onMouseDown={e => e.target === e.currentTarget && closeModal()}>
          <div className="adm-modal large" style={{ maxWidth: 700 }}>
            <div className="adm-modal-head">
              <h2>{modal === 'add' ? '+ Yangi banner' : 'Bannerni tahrirlash'}</h2>
              <button className="adm-close-btn" onClick={closeModal}><CloseIcon /></button>
            </div>
            <div className="adm-modal-body">

              {/* Live preview */}
              <div
                className="bnr-form-preview"
                style={{
                  background: form.bgImage
                    ? `url(${form.bgImage}) center/cover no-repeat`
                    : form.gradient,
                }}
              >
                {form.bgImage && <div className="bnr-form-preview-overlay" />}
                <div className="bnr-form-preview-text">
                  <div className="bnr-form-preview-title">{form.title || 'Sarlavha...'}</div>
                  {form.badge && (
                    <div className="bnr-form-preview-badge" style={{ color: form.accentColor }}>
                      {form.badge} <span style={{ fontSize: 13 }}>{form.badgeSub}</span>
                    </div>
                  )}
                  <div className="bnr-form-preview-btn" style={{ background: form.accentColor }}>
                    {form.btnText || 'Tugma matni'}
                  </div>
                </div>
                {form.productImage && (
                  <img src={form.productImage} alt="" className="bnr-form-preview-prod" />
                )}
              </div>

              {/* Images row */}
              <div className="adm-form-row" style={{ gap: 16 }}>
                {/* Background image */}
                <div className="adm-field" style={{ flex: 1 }}>
                  <label>Fon rasmi (ixtiyoriy)</label>
                  <input ref={bgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImg('bgImage', e)} />
                  {form.bgImage ? (
                    <div className="bnr-img-preview-wrap">
                      <img src={form.bgImage} alt="bg" className="bnr-img-thumb" />
                      <div className="bnr-img-preview-actions">
                        <button type="button" className="bnr-img-btn change" onClick={() => bgRef.current.click()}>Almashtirish</button>
                        <button type="button" className="bnr-img-btn remove" onClick={() => setField('bgImage', '')}>O'chirish</button>
                      </div>
                    </div>
                  ) : (
                    <div className="bnr-img-upload" onClick={() => bgRef.current.click()}>
                      <svg width="28" height="28" fill="none" stroke="#cbd5e1" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <p>Fon rasmi yuklash</p>
                      <span>JPG, PNG, WEBP</span>
                    </div>
                  )}
                </div>

                {/* Product image */}
                <div className="adm-field" style={{ flex: 1 }}>
                  <label>Mahsulot rasmi (ixtiyoriy)</label>
                  <input ref={prodRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImg('productImage', e)} />
                  {form.productImage ? (
                    <div className="bnr-img-preview-wrap">
                      <img src={form.productImage} alt="product" className="bnr-img-thumb" />
                      <div className="bnr-img-preview-actions">
                        <button type="button" className="bnr-img-btn change" onClick={() => prodRef.current.click()}>Almashtirish</button>
                        <button type="button" className="bnr-img-btn remove" onClick={() => setField('productImage', '')}>O'chirish</button>
                      </div>
                    </div>
                  ) : (
                    <div className="bnr-img-upload" onClick={() => prodRef.current.click()}>
                      <svg width="28" height="28" fill="none" stroke="#cbd5e1" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <p>Mahsulot rasmi yuklash</p>
                      <span>JPG, PNG, WEBP</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="adm-field full">
                <label>Sarlavha *</label>
                <input value={form.title} onChange={e => setField('title', e.target.value.toUpperCase())} placeholder="YANGI KOLLEKSIYA" />
              </div>

              <div className="adm-field full">
                <label>Tavsif matni</label>
                <input value={form.subtitle} onChange={e => setField('subtitle', e.target.value)} placeholder="Banner tavsifi..." />
              </div>

              <div className="adm-form-row">
                <div className="adm-field">
                  <label>Chegirma (masalan: -30%)</label>
                  <input value={form.badge} onChange={e => setField('badge', e.target.value)} placeholder="-30%" />
                </div>
                <div className="adm-field">
                  <label>Qo'shimcha matn</label>
                  <input value={form.badgeSub} onChange={e => setField('badgeSub', e.target.value)} placeholder="GACHA" />
                </div>
              </div>

              <div className="adm-field">
                <label>Tugma matni</label>
                <input value={form.btnText} onChange={e => setField('btnText', e.target.value)} placeholder="Hozir xarid qiling!" />
              </div>

              <div className="adm-field">
                <label>Accent rang (tugma va badge rangi)</label>
                <div className="bnr-gradient-picker">
                  {GRADIENTS.map(g => (
                    <button
                      key={g.value}
                      className={`bnr-gradient-opt ${form.gradient === g.value ? 'selected' : ''}`}
                      style={{ background: g.value }}
                      onClick={() => selectGradient(g)}
                      title={g.label}
                    >
                      {form.gradient === g.value && <span className="bnr-gradient-check">✓</span>}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  Fon rasmi yuklansa — bu gradient yashiriladi, faqat accent rang tugmaga ta'sir qiladi
                </p>
              </div>

              <label className="adm-checkbox-row">
                <input type="checkbox" checked={form.active} onChange={e => setField('active', e.target.checked)} />
                <span>Faol (saytda ko'rinadi)</span>
              </label>
            </div>
            <div className="adm-modal-foot">
              <button className="adm-btn-ghost" onClick={closeModal}>Bekor qilish</button>
              <button className="adm-btn-primary" onClick={save} disabled={saving}>
                {saving ? <><span className="btn-spinner" /> Saqlanmoqda...</> : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {delId && (
        <div className="adm-overlay" onMouseDown={e => e.target === e.currentTarget && setDelId(null)}>
          <div className="adm-confirm">
            <div className="adm-confirm-icon">🗑️</div>
            <h3>Bannerni o'chirish</h3>
            <p>Bu amalni qaytarib bo'lmaydi.</p>
            <div className="adm-confirm-btns">
              <button className="adm-btn-ghost" onClick={() => setDelId(null)}>Bekor qilish</button>
              <button className="adm-btn-danger" onClick={() => remove(delId)}>O'chirish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EditIcon() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }
function TrashIcon() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg> }
function CloseIcon() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg> }

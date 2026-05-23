import { useState, useEffect, useRef } from 'react'
import { api } from '../../api'

const EMPTY = { name: '', category: 'Kosmetika', oldPrice: '', price: '', discount: '', image: '', emoji: '📦', badges: ['Yangi mahsulot'], stock: '' }
const CATS = ['Kosmetika', 'Parfyumeriya', 'Salomatlik', 'Gigiena', 'Bolalar', "Uy-ro'zg'or"]

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [delId, setDelId] = useState(null)
  const fileRef = useRef()

  useEffect(() => { api.get('/products').then(setProducts).finally(() => setLoading(false)) }, [])

  function openAdd() { setForm(EMPTY); setModal('add') }
  function openEdit(p) { setForm({ ...p, oldPrice: p.oldPrice || '', badges: p.badges || [], image: p.image || '' }); setModal(p) }
  function closeModal() { setModal(null) }
  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleImgChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setField('image', reader.result)
    reader.readAsDataURL(file)
  }

  async function save() {
    setSaving(true)
    const body = { ...form, oldPrice: Number(form.oldPrice), price: Number(form.price), discount: Number(form.discount), stock: Number(form.stock) }
    try {
      if (modal === 'add') {
        const p = await api.post('/products', body)
        setProducts(prev => [...prev, p])
      } else {
        const p = await api.put(`/products/${modal.id}`, body)
        setProducts(prev => prev.map(x => x.id === p.id ? p : x))
      }
      closeModal()
    } catch (e) { alert(e.message) }
    setSaving(false)
  }

  async function remove(id) {
    await api.delete(`/products/${id}`)
    setProducts(prev => prev.filter(p => p.id !== id))
    setDelId(null)
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.art?.includes(search)
  )

  if (loading) return (
    <div className="adm-loading-wrap">
      <div className="adm-spinner" />
      <p>Yuklanmoqda...</p>
    </div>
  )

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Mahsulotlar</h1>
          <p className="adm-page-sub">{products.length} ta mahsulot mavjud</p>
        </div>
        <button className="adm-btn-primary" onClick={openAdd}>
          <PlusIcon /> Yangi mahsulot
        </button>
      </div>

      <div className="adm-card">
        <div className="adm-search-row">
          <div className="adm-search-wrap">
            <SearchIcon />
            <input className="adm-search" placeholder="Nom yoki art raqam bo'yicha qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="adm-count-badge">{filtered.length} ta natija</span>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Rasm</th>
                <th>Mahsulot nomi</th>
                <th>Kategoriya</th>
                <th>Narx</th>
                <th>Chegirma</th>
                <th>Ombor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="adm-prod-img">
                      {p.image
                        ? <img src={p.image} alt={p.name} />
                        : <span className="adm-prod-emoji">{p.emoji || '📦'}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <div className="adm-prod-name">{p.name}</div>
                  </td>
                  <td><span className="adm-cat-badge">{p.category}</span></td>
                  <td>
                    <div className="adm-price-col">
                      <strong className="adm-price-new">{p.price?.toLocaleString()} UZS</strong>
                      {p.oldPrice > p.price && <span className="adm-price-old">{p.oldPrice?.toLocaleString()}</span>}
                    </div>
                  </td>
                  <td>
                    {p.discount > 0 && <span className="adm-discount-badge">-{p.discount}%</span>}
                  </td>
                  <td>
                    <span className={`adm-stock-badge ${p.stock < 10 ? 'low' : ''}`}>{p.stock} dona</span>
                  </td>
                  <td>
                    <div className="adm-actions">
                      <button className="adm-btn-icon edit" onClick={() => openEdit(p)} title="Tahrirlash">
                        <EditIcon />
                      </button>
                      <button className="adm-btn-icon del" onClick={() => setDelId(p.id)} title="O'chirish">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="adm-empty">
              <div className="adm-empty-icon">🔍</div>
              <p>Mahsulot topilmadi</p>
            </div>
          )}
        </div>
      </div>

      {modal !== null && (
        <div className="adm-overlay" onMouseDown={e => e.target === e.currentTarget && closeModal()}>
          <div className="adm-modal large">
            <div className="adm-modal-head">
              <h2>{modal === 'add' ? '+ Yangi mahsulot' : 'Mahsulotni tahrirlash'}</h2>
              <button className="adm-close-btn" onClick={closeModal}><CloseIcon /></button>
            </div>
            <div className="adm-modal-body">
              {/* Image Upload */}
              <div className="adm-field full">
                <label>Mahsulot rasmi</label>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImgChange} style={{ display: 'none' }} />
                {form.image
                  ? (
                    <div className="adm-img-preview">
                      <img src={form.image} alt="preview" />
                      <div className="adm-img-preview-actions">
                        <button type="button" onClick={() => fileRef.current.click()} className="adm-img-change-btn">Rasmni almashtirish</button>
                        <button type="button" onClick={() => setField('image', '')} className="adm-img-remove-btn">O'chirish</button>
                      </div>
                    </div>
                  )
                  : (
                    <div className="adm-img-upload" onClick={() => fileRef.current.click()}>
                      <div className="adm-img-upload-icon"><ImgIcon /></div>
                      <p className="adm-img-upload-text">Rasm yuklash uchun bosing</p>
                      <p className="adm-img-upload-sub">JPG, PNG, WEBP — max 5MB</p>
                    </div>
                  )
                }
              </div>

              <div className="adm-form-row">
                <Field label="Ombor (dona)" value={form.stock} onChange={v => setField('stock', v)} type="number" placeholder="50" />
              </div>

              <div className="adm-form-row">
                <Field label="Mahsulot nomi" value={form.name} onChange={v => setField('name', v)} placeholder="Mahsulot nomini kiriting..." full />
                <div className="adm-field" style={{ maxWidth: 100 }}>
                  <label>Emoji</label>
                  <input
                    type="text"
                    value={form.emoji}
                    onChange={e => setField('emoji', e.target.value)}
                    placeholder="📦"
                    style={{ textAlign: 'center', fontSize: 22 }}
                  />
                </div>
              </div>

              <div className="adm-form-row">
                <div className="adm-field">
                  <label>Kategoriya</label>
                  <select value={form.category} onChange={e => setField('category', e.target.value)}>
                    {CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <Field label="Chegirma %" value={form.discount} onChange={v => setField('discount', v)} type="number" placeholder="0" />
              </div>

              <div className="adm-form-row">
                <Field label="Eski narx (UZS)" value={form.oldPrice} onChange={v => setField('oldPrice', v)} type="number" placeholder="100000" />
                <Field label="Yangi narx (UZS)" value={form.price} onChange={v => setField('price', v)} type="number" placeholder="79000" />
              </div>
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
            <h3>Mahsulotni o'chirish</h3>
            <p>Bu amalni qaytarib bo'lmaydi. Davom etasizmi?</p>
            <div className="adm-confirm-btns">
              <button className="adm-btn-ghost" onClick={() => setDelId(null)}>Bekor qilish</button>
              <button className="adm-btn-danger" onClick={() => remove(delId)}>Ha, o'chirish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, full }) {
  return (
    <div className={`adm-field${full ? ' full' : ''}`}>
      <label>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

function PlusIcon() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg> }
function SearchIcon() { return <svg width="16" height="16" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg> }
function EditIcon() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }
function TrashIcon() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg> }
function CloseIcon() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg> }
function ImgIcon() { return <svg width="32" height="32" fill="none" stroke="#ccc" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> }

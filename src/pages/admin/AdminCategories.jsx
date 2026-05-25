import { useState, useEffect } from 'react'
import { api } from '../../api'
import { useToast } from '../../context/ToastContext'

const EMPTY = { name: '', icon: '📦', count: 0 }

export default function AdminCategories() {
  const [cats, setCats] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [delId, setDelId] = useState(null)
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => { api.get('/categories').then(setCats).finally(() => setLoading(false)) }, [])

  function openAdd() { setForm(EMPTY); setModal('add') }
  function openEdit(c) { setForm({ ...c }); setModal(c) }

  async function save() {
    if (!form.name.trim()) { addToast('Kategoriya nomini kiriting', 'error'); return }
    setSaving(true)
    try {
      const body = { ...form, count: Number(form.count) }
      if (modal === 'add') {
        const c = await api.post('/categories', body)
        setCats(prev => [...prev, c])
        addToast('✅ Kategoriya qo\'shildi', 'success')
      } else {
        const c = await api.put(`/categories/${modal.id}`, body)
        setCats(prev => prev.map(x => x.id === c.id ? c : x))
        addToast('✅ Kategoriya yangilandi', 'success')
      }
      setModal(null)
    } catch (e) { addToast(e.message, 'error') }
    setSaving(false)
  }

  async function remove(id) {
    try {
      await api.delete(`/categories/${id}`)
      setCats(prev => prev.filter(c => c.id !== id))
      addToast('Kategoriya o\'chirildi', 'info')
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
          <h1 className="adm-page-title">Kategoriyalar</h1>
          <p className="adm-page-sub">{cats.length} ta kategoriya</p>
        </div>
        <button className="adm-btn-primary" onClick={openAdd}>
          <PlusIcon /> Yangi kategoriya
        </button>
      </div>

      <div className="adm-cats-grid">
        {cats.map(c => (
          <div key={c.id} className="adm-cat-card">
            <div className="adm-cat-icon">{c.icon}</div>
            <p className="adm-cat-name">{c.name}</p>
            <p className="adm-cat-count">{c.count} mahsulot</p>
            <div className="adm-cat-actions">
              <button className="adm-btn-icon edit" onClick={() => openEdit(c)} title="Tahrirlash"><EditIcon /></button>
              <button className="adm-btn-icon del" onClick={() => setDelId(c.id)} title="O'chirish"><TrashIcon /></button>
            </div>
          </div>
        ))}
        {cats.length === 0 && (
          <div className="adm-empty" style={{ gridColumn: '1/-1' }}>
            <div className="adm-empty-icon">🏷️</div>
            <p>Kategoriyalar yo'q</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modal !== null && (
        <div className="adm-overlay" onMouseDown={e => e.target === e.currentTarget && setModal(null)}>
          <div className="adm-modal" style={{ maxWidth: 420 }}>
            <div className="adm-modal-head">
              <h2>{modal === 'add' ? '+ Yangi kategoriya' : 'Kategoriyani tahrirlash'}</h2>
              <button className="adm-close-btn" onClick={() => setModal(null)}><CloseIcon /></button>
            </div>
            <div className="adm-modal-body">
              <div className="adm-form-row">
                <div className="adm-field" style={{ maxWidth: 80 }}>
                  <label>Emoji</label>
                  <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="📦" style={{ textAlign: 'center', fontSize: 22 }} />
                </div>
                <div className="adm-field full">
                  <label>Kategoriya nomi</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Kosmetika, Gigiena..." />
                </div>
              </div>
              <div className="adm-field">
                <label>Mahsulotlar soni (ko'rsatish uchun)</label>
                <input type="number" value={form.count} onChange={e => setForm(f => ({ ...f, count: e.target.value }))} placeholder="120" />
              </div>
            </div>
            <div className="adm-modal-foot">
              <button className="adm-btn-ghost" onClick={() => setModal(null)}>Bekor qilish</button>
              <button className="adm-btn-primary" onClick={save} disabled={saving}>
                {saving ? <><span className="btn-spinner" /> Saqlanmoqda...</> : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {delId && (
        <div className="adm-overlay" onMouseDown={e => e.target === e.currentTarget && setDelId(null)}>
          <div className="adm-confirm">
            <div className="adm-confirm-icon">🗑️</div>
            <h3>Kategoriyani o'chirish</h3>
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

function PlusIcon() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg> }
function EditIcon() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }
function TrashIcon() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg> }
function CloseIcon() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg> }

import { useState, useEffect } from 'react'
import { api } from '../../api'

const EMPTY = { name: '', icon: '📦', count: 0 }

export default function AdminCategories() {
  const [cats, setCats] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [delId, setDelId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.get('/categories').then(setCats).finally(() => setLoading(false)) }, [])

  function openAdd() { setForm(EMPTY); setModal('add') }
  function openEdit(c) { setForm({ ...c }); setModal(c) }

  async function save() {
    setSaving(true)
    try {
      const body = { ...form, count: Number(form.count) }
      if (modal === 'add') {
        const c = await api.post('/categories', body)
        setCats(prev => [...prev, c])
      } else {
        const c = await api.put(`/categories/${modal.id}`, body)
        setCats(prev => prev.map(x => x.id === c.id ? c : x))
      }
      setModal(null)
    } catch (e) { alert(e.message) }
    setSaving(false)
  }

  async function remove(id) {
    await api.delete(`/categories/${id}`)
    setCats(prev => prev.filter(c => c.id !== id))
    setDelId(null)
  }

  if (loading) return <div className="adm-loading">Yuklanmoqda...</div>

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <h1 className="adm-page-title">Kategoriyalar</h1>
        <button className="adm-btn-primary" onClick={openAdd}>+ Yangi kategoriya</button>
      </div>

      <div className="adm-cats-grid">
        {cats.map(c => (
          <div key={c.id} className="adm-cat-card">
            <div className="adm-cat-icon">{c.icon}</div>
            <p className="adm-cat-name">{c.name}</p>
            <p className="adm-cat-count">{c.count} mahsulot</p>
            <div className="adm-cat-actions">
              <button className="adm-btn-icon edit" onClick={() => openEdit(c)}>✏️</button>
              <button className="adm-btn-icon del" onClick={() => setDelId(c.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {modal !== null && (
        <div className="adm-overlay" onMouseDown={e => e.target === e.currentTarget && setModal(null)}>
          <div className="adm-modal" style={{ maxWidth: 400 }}>
            <div className="adm-modal-head">
              <h2>{modal === 'add' ? 'Yangi kategoriya' : 'Tahrirlash'}</h2>
              <button onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="adm-modal-body">
              <div className="adm-form-row">
                <div className="adm-field">
                  <label>Emoji</label>
                  <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="📦" />
                </div>
                <div className="adm-field full">
                  <label>Nomi</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Kategoriya nomi" />
                </div>
              </div>
              <div className="adm-field">
                <label>Mahsulotlar soni</label>
                <input type="number" value={form.count} onChange={e => setForm(f => ({ ...f, count: e.target.value }))} />
              </div>
            </div>
            <div className="adm-modal-foot">
              <button className="adm-btn-ghost" onClick={() => setModal(null)}>Bekor qilish</button>
              <button className="adm-btn-primary" onClick={save} disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
            </div>
          </div>
        </div>
      )}

      {delId && (
        <div className="adm-overlay" onMouseDown={e => e.target === e.currentTarget && setDelId(null)}>
          <div className="adm-confirm">
            <p>Kategoriyani o'chirishni tasdiqlaysizmi?</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="adm-btn-ghost" onClick={() => setDelId(null)}>Yo'q</button>
              <button className="adm-btn-danger" onClick={() => remove(delId)}>Ha, o'chirish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

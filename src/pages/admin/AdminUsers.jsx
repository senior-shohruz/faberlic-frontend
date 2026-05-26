import { useState, useEffect } from 'react'
import { api } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [delId, setDelId] = useState(null)
  const { user: me } = useAuth()
  const { addToast } = useToast()

  useEffect(() => { api.get('/users').then(setUsers).finally(() => setLoading(false)) }, [])

  async function toggleRole(u) {
    const newRole = u.role === 'admin' ? 'user' : 'admin'
    try {
      const updated = await api.put(`/users/${u.id}/role`, { role: newRole })
      setUsers(prev => prev.map(x => x.id === updated.id ? updated : x))
      addToast(`${updated.name} → ${newRole === 'admin' ? '👑 Admin' : '👤 User'}`, 'info')
    } catch (e) { addToast(e.message, 'error') }
  }

  async function remove(id) {
    try {
      await api.delete(`/users/${id}`)
      setUsers(prev => prev.filter(u => u.id !== id))
      addToast('Foydalanuvchi o\'chirildi', 'info')
    } catch (e) { addToast(e.message, 'error') }
    setDelId(null)
  }

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="adm-loading-wrap"><div className="adm-spinner" /><p>Yuklanmoqda...</p></div>
  )

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Foydalanuvchilar</h1>
          <p className="adm-page-sub">{users.length} ta foydalanuvchi</p>
        </div>
        <div className="adm-search-wrap">
          <SearchIcon />
          <input className="adm-search" placeholder="Ism yoki email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-table-wrap adm-desktop-only">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Foydalanuvchi</th>
                <th>Email</th>
                <th>Telefon</th>
                <th>Rol</th>
                <th>Qo'shilgan</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="adm-u-row">
                      <div className="adm-u-avatar">{u.name[0]?.toUpperCase()}</div>
                      <div>
                        <div className="adm-u-name">
                          {u.name}
                          {u.id === me?.id && <span className="adm-you">Siz</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="adm-muted">{u.email}</td>
                  <td className="adm-muted">+998 {u.phone}</td>
                  <td>
                    <span className={`adm-role-badge ${u.role}`}>
                      {u.role === 'admin' ? '👑 Admin' : '👤 User'}
                    </span>
                  </td>
                  <td className="adm-muted" style={{ fontSize: 12 }}>
                    {new Date(u.createdAt).toLocaleDateString('uz-UZ')}
                  </td>
                  <td>
                    {u.id !== me?.id && (
                      <div className="adm-actions">
                        <button className="adm-btn-sm" onClick={() => toggleRole(u)}>
                          {u.role === 'admin' ? 'User qil' : 'Admin qil'}
                        </button>
                        <button className="adm-btn-icon del" onClick={() => setDelId(u.id)} title="O'chirish">
                          <TrashIcon />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="adm-empty">
              <div className="adm-empty-icon">👥</div>
              <p>{search ? 'Foydalanuvchi topilmadi' : 'Foydalanuvchilar yo\'q'}</p>
            </div>
          )}
        </div>

        {/* Mobile cards */}
        <div className="adm-mobile-only adm-user-cards">
          {filtered.map(u => (
            <div key={u.id} className="adm-user-card">
              <div className="adm-uc-top">
                <div className="adm-u-avatar">{u.name[0]?.toUpperCase()}</div>
                <div className="adm-uc-main">
                  <div className="adm-uc-name">
                    {u.name}
                    {u.id === me?.id && <span className="adm-you">Siz</span>}
                  </div>
                  <span className={`adm-role-badge ${u.role} adm-uc-role`}>
                    {u.role === 'admin' ? '👑 Admin' : '👤 User'}
                  </span>
                </div>
              </div>
              <div className="adm-uc-rows">
                <div className="adm-uc-row">
                  <span className="adm-uc-key">Email</span>
                  <span className="adm-uc-val">{u.email}</span>
                </div>
                <div className="adm-uc-row">
                  <span className="adm-uc-key">Telefon</span>
                  <a className="adm-uc-val adm-uc-link" href={`tel:+998${u.phone}`}>+998 {u.phone}</a>
                </div>
                <div className="adm-uc-row">
                  <span className="adm-uc-key">Qo'shilgan</span>
                  <span className="adm-uc-val">{new Date(u.createdAt).toLocaleDateString('uz-UZ')}</span>
                </div>
              </div>
              {u.id !== me?.id && (
                <div className="adm-uc-actions">
                  <button className="adm-btn-sm adm-uc-role-btn" onClick={() => toggleRole(u)}>
                    {u.role === 'admin' ? 'User qil' : 'Admin qil'}
                  </button>
                  <button className="adm-btn-icon del" onClick={() => setDelId(u.id)} title="O'chirish">
                    <TrashIcon />
                  </button>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="adm-empty">
              <div className="adm-empty-icon">👥</div>
              <p>{search ? 'Foydalanuvchi topilmadi' : 'Foydalanuvchilar yo\'q'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm */}
      {delId && (
        <div className="adm-overlay" onMouseDown={e => e.target === e.currentTarget && setDelId(null)}>
          <div className="adm-confirm">
            <div className="adm-confirm-icon">⚠️</div>
            <h3>Foydalanuvchini o'chirish</h3>
            <p>Bu foydalanuvchining barcha ma'lumotlari o'chib ketadi.</p>
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

function SearchIcon() { return <svg width="16" height="16" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg> }
function TrashIcon() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg> }

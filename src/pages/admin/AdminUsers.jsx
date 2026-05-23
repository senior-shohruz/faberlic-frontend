import { useState, useEffect } from 'react'
import { api } from '../../api'
import { useAuth } from '../../context/AuthContext'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { user: me } = useAuth()

  useEffect(() => { api.get('/users').then(setUsers).finally(() => setLoading(false)) }, [])

  async function toggleRole(u) {
    const newRole = u.role === 'admin' ? 'user' : 'admin'
    try {
      const updated = await api.put(`/users/${u.id}/role`, { role: newRole })
      setUsers(prev => prev.map(x => x.id === updated.id ? updated : x))
    } catch (e) { alert(e.message) }
  }

  async function remove(id) {
    if (!confirm("Foydalanuvchini o'chirishni tasdiqlaysizmi?")) return
    try {
      await api.delete(`/users/${id}`)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (e) { alert(e.message) }
  }

  if (loading) return <div className="adm-loading">Yuklanmoqda...</div>

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <h1 className="adm-page-title">Foydalanuvchilar</h1>
        <span className="adm-muted">{users.length} ta foydalanuvchi</span>
      </div>

      <div className="adm-card">
        <table className="adm-table">
          <thead><tr><th>Ism</th><th>Email</th><th>Telefon</th><th>Rol</th><th>Qo'shilgan</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="adm-u-avatar">{u.name[0]?.toUpperCase()}</div>
                    <span>{u.name}</span>
                    {u.id === me?.id && <span className="adm-you">Siz</span>}
                  </div>
                </td>
                <td className="adm-muted">{u.email}</td>
                <td className="adm-muted">+998 {u.phone}</td>
                <td>
                  <span className={`adm-role-badge ${u.role}`}>{u.role === 'admin' ? '👑 Admin' : '👤 User'}</span>
                </td>
                <td className="adm-muted">{new Date(u.createdAt).toLocaleDateString('uz-UZ')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {u.id !== me?.id && (
                      <>
                        <button className="adm-btn-sm" onClick={() => toggleRole(u)}>
                          {u.role === 'admin' ? 'User qil' : 'Admin qil'}
                        </button>
                        <button className="adm-btn-icon del" onClick={() => remove(u.id)}>🗑️</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

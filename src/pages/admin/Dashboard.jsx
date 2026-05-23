import { useState, useEffect, useCallback } from 'react'
import { api } from '../../api'

const STATUS_MAP = {
  pending:    { label: 'Kutilmoqda',    color: '#f59e0b', bg: '#fef3c7' },
  processing: { label: 'Jarayonda',     color: '#3b82f6', bg: '#dbeafe' },
  delivered:  { label: 'Yetkazildi',    color: '#22c55e', bg: '#dcfce7' },
  cancelled:  { label: 'Bekor qilindi', color: '#ef4444', bg: '#fee2e2' },
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const data = await api.get('/stats')
      setStats(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="adm-loading-wrap">
      <div className="adm-spinner" />
      <p>Yuklanmoqda...</p>
    </div>
  )

  if (error) return (
    <div className="adm-error-wrap">
      <div className="adm-error-icon">⚠️</div>
      <p>{error}</p>
      <button className="adm-btn-primary" onClick={() => load()}>Qayta yuklash</button>
    </div>
  )

  const maxRevenue = Math.max(...(stats.revenueByDay?.map(d => d.amount) || [1]), 1)

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Dashboard</h1>
          <p className="adm-page-sub">Umumiy ko'rinish</p>
        </div>
        <button className="adm-btn-ghost" onClick={() => load(true)} disabled={refreshing}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: refreshing ? 'rotate(360deg)' : 'none', transition: 'transform 0.5s' }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
          Yangilash
        </button>
      </div>

      {/* Stat Cards */}
      <div className="adm-stat-grid">
        <StatCard icon="📦" label="Mahsulotlar" value={stats.totalProducts} color="#6366f1" trend="+2 bu hafta" />
        <StatCard icon="👥" label="Foydalanuvchilar" value={stats.totalUsers} color="#22c55e" trend="Jami ro'yxatdan o'tganlar" />
        <StatCard icon="🛒" label="Buyurtmalar" value={stats.totalOrders} color="#f59e0b" trend={`Bugun: ${stats.todayOrders}`} />
        <StatCard icon="💰" label="Jami daromad" value={stats.revenue.toLocaleString() + ' UZS'} color="#e63946" trend={`Bugun: ${stats.todayRevenue.toLocaleString()} UZS`} />
      </div>

      {/* Revenue Chart */}
      {stats.revenueByDay && (
        <div className="adm-card dash-chart-card">
          <div className="dash-chart-header">
            <h3 className="adm-card-title">Haftalik daromad</h3>
            <span className="dash-chart-total">{stats.revenue.toLocaleString()} UZS jami</span>
          </div>
          <div className="dash-chart">
            {stats.revenueByDay.map((day, i) => (
              <div key={i} className="dash-bar-col">
                <div className="dash-bar-wrap">
                  <div
                    className="dash-bar"
                    style={{ height: `${day.amount ? Math.max((day.amount / maxRevenue) * 100, 4) : 2}%` }}
                    title={`${day.amount.toLocaleString()} UZS`}
                  />
                </div>
                <span className="dash-bar-label">{day.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="adm-two-col">
        {/* Recent Orders */}
        <div className="adm-card">
          <div className="adm-card-head">
            <h3 className="adm-card-title">Oxirgi buyurtmalar</h3>
            <a href="/admin/orders" className="adm-card-link">Barchasi →</a>
          </div>
          <table className="adm-table">
            <thead>
              <tr><th>Mijoz</th><th>Summa</th><th>Status</th><th>Sana</th></tr>
            </thead>
            <tbody>
              {stats.recentOrders.map(o => {
                const st = STATUS_MAP[o.status] || STATUS_MAP.pending
                return (
                  <tr key={o.id}>
                    <td>
                      <div className="adm-u-row">
                        <div className="adm-u-avatar sm">{o.userName?.[0]?.toUpperCase()}</div>
                        <span className="adm-u-name">{o.userName}</span>
                      </div>
                    </td>
                    <td><strong>{o.total?.toLocaleString()} UZS</strong></td>
                    <td>
                      <span className="adm-status-pill" style={{ background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="adm-muted">{new Date(o.createdAt).toLocaleDateString('uz-UZ')}</td>
                  </tr>
                )
              })}
              {stats.recentOrders.length === 0 && (
                <tr><td colSpan="4" className="adm-empty-cell">Buyurtmalar yo'q</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Status breakdown */}
          <div className="adm-card">
            <h3 className="adm-card-title">Buyurtmalar holati</h3>
            <div className="dash-status-list">
              {Object.entries(STATUS_MAP).map(([key, meta]) => {
                const count = stats.statusCounts?.[key] || 0
                const pct = stats.totalOrders ? Math.round((count / stats.totalOrders) * 100) : 0
                return (
                  <div key={key} className="dash-status-row">
                    <div className="dash-status-left">
                      <span className="dash-status-dot" style={{ background: meta.color }} />
                      <span className="dash-status-lbl">{meta.label}</span>
                    </div>
                    <div className="dash-status-right">
                      <div className="dash-status-bar-wrap">
                        <div className="dash-status-bar" style={{ width: `${pct}%`, background: meta.color }} />
                      </div>
                      <span className="dash-status-count">{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Low stock */}
          <div className="adm-card">
            <h3 className="adm-card-title">⚠️ Kam qolgan mahsulotlar</h3>
            {stats.lowStock.length === 0
              ? <p className="adm-muted" style={{ fontSize: 13 }}>Barcha mahsulotlar yetarli</p>
              : stats.lowStock.slice(0, 5).map(p => (
                <div key={p.id} className="adm-low-item">
                  <span className="adm-low-emoji">{p.emoji}</span>
                  <span className="adm-low-name">{p.name.slice(0, 28)}{p.name.length > 28 ? '…' : ''}</span>
                  <span className="adm-low-badge">{p.stock} dona</span>
                </div>
              ))
            }
          </div>

          {/* Top products */}
          {stats.topProducts?.length > 0 && (
            <div className="adm-card">
              <h3 className="adm-card-title">🔥 Top mahsulotlar</h3>
              {stats.topProducts.map((p, i) => (
                <div key={i} className="adm-low-item">
                  <span className="adm-low-rank">#{i + 1}</span>
                  <span className="adm-low-name">{p.name.slice(0, 28)}{p.name.length > 28 ? '…' : ''}</span>
                  <span className="adm-low-badge" style={{ background: '#dbeafe', color: '#3b82f6' }}>{p.qty} ta</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, trend }) {
  return (
    <div className="adm-stat-card" style={{ '--stat-color': color }}>
      <div className="adm-stat-icon" style={{ background: color + '18', color }}>{icon}</div>
      <div className="adm-stat-body">
        <p className="adm-stat-label">{label}</p>
        <p className="adm-stat-value">{value}</p>
        {trend && <p className="adm-stat-trend">{trend}</p>}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: <GridIcon />, end: true },
  { to: '/admin/products', label: 'Mahsulotlar', icon: <BoxIcon /> },
  { to: '/admin/orders', label: 'Buyurtmalar', icon: <CartIcon /> },
  { to: '/admin/users', label: 'Foydalanuvchilar', icon: <UsersIcon /> },
  { to: '/admin/pickup-points', label: 'Punktlar', icon: <MapPinIcon /> },
  { to: '/admin/banners', label: 'Reklamalar', icon: <BannerIcon /> },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
  }

  function closeNav() {
    setSidebarOpen(false)
  }

  return (
    <div className="adm">

      {/* Mobile top bar */}
      <div className="adm-topbar">
        <button className="adm-topbar-menu" onClick={() => setSidebarOpen(true)}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div className="adm-topbar-brand">
          <span className="adm-topbar-name">PREMIUM STORE <span>Admin</span></span>
        </div>
        <div className="adm-topbar-avatar" onClick={handleLogout} title="Chiqish">
          {user?.name?.[0]?.toUpperCase()}
        </div>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="adm-sidebar-overlay" onClick={closeNav} />
      )}

      {/* Sidebar */}
      <aside className={`adm-sidebar${sidebarOpen ? ' adm-sidebar-open' : ''}`}>
        <div className="adm-sidebar-head">
          <div className="adm-logo">
            <div>
              <div className="adm-logo-text">PREMIUM STORE</div>
              <div className="adm-logo-sub">Admin Panel</div>
            </div>
          </div>
          <button className="adm-sidebar-close" onClick={closeNav}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <nav className="adm-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `adm-nav-link${isActive ? ' active' : ''}`}
              onClick={closeNav}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="adm-user">
          <div className="adm-user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="adm-user-info">
            <p className="adm-user-name">{user?.name}</p>
            <p className="adm-user-role">Administrator</p>
          </div>
          <button className="adm-logout" onClick={handleLogout} title="Chiqish">
            <LogoutIcon />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="adm-content">
        <Outlet />
      </div>

      {/* Mobile bottom navigation */}
      <nav className="adm-bottom-nav">
        {navItems.slice(0, 5).map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `adm-bottom-item${isActive ? ' active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function GridIcon() { return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> }
function BoxIcon() { return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> }
function UsersIcon() { return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> }
function CartIcon() { return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> }
function BannerIcon() { return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg> }
function LogoutIcon() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg> }
function MapPinIcon() { return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> }

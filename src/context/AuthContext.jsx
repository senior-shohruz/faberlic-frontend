import { createContext, useContext, useState } from 'react'
import { api } from '../api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fab_user')) } catch { return null }
  })

  async function login(email, password) {
    try {
      const data = await api.post('/auth/login', { email, password })
      localStorage.setItem('fab_token', data.token)
      localStorage.setItem('fab_user', JSON.stringify(data.user))
      setUser(data.user)
      return null
    } catch (err) {
      return err.message
    }
  }

  async function register(name, email, phone, password) {
    try {
      const data = await api.post('/auth/register', { name, email, phone, password })
      localStorage.setItem('fab_token', data.token)
      localStorage.setItem('fab_user', JSON.stringify(data.user))
      setUser(data.user)
      return null
    } catch (err) {
      return err.message
    }
  }

  function logout() {
    localStorage.removeItem('fab_token')
    localStorage.removeItem('fab_user')
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)

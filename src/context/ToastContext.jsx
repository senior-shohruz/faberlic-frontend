import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext()

const ICONS = {
  success: (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  ),
  error: (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  ),
  info: (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  warning: (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev.slice(-4), { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3800)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container" role="region" aria-live="polite" aria-label="Bildirishnomalar">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} role="alert">
            <span className="toast-icon">{ICONS[t.type] || ICONS.info}</span>
            <span className="toast-msg">{t.message}</span>
            <button className="toast-close" onClick={() => removeToast(t.id)} aria-label="Yopish">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() { return useContext(ToastContext) }

import { useState, useEffect } from 'react'
import { useLang } from '../context/LanguageContext'

const STATIC = [
  { id: 1, name: 'Kosmetika',    icon: '💄', count: 120 },
  { id: 2, name: 'Parfyumeriya', icon: '🌸', count: 85 },
  { id: 3, name: 'Salomatlik',   icon: '💊', count: 64 },
  { id: 4, name: 'Gigiena',      icon: '🧼', count: 97 },
  { id: 5, name: 'Bolalar',      icon: '🧸', count: 43 },
  { id: 6, name: "Uy-ro'zg'or", icon: '🏠', count: 38 },
]

function CatSkeleton() {
  return (
    <div className="cat-card">
      <div className="skeleton" style={{ width: 52, height: 52, borderRadius: '50%', margin: '0 auto 10px' }} />
      <div className="skeleton" style={{ height: 14, borderRadius: 8, width: 70, margin: '0 auto 6px' }} />
      <div className="skeleton" style={{ height: 12, borderRadius: 8, width: 45, margin: '0 auto' }} />
    </div>
  )
}

export default function Categories() {
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const { t } = useLang()

  useEffect(() => {
    fetch('http://localhost:5000/api/categories')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setCats(Array.isArray(data) && data.length > 0 ? data : STATIC); setLoading(false) })
      .catch(() => { setCats(STATIC); setLoading(false) })
  }, [])

  return (
    <section className="categories" id="categories">
      <div className="section-header">
        <p className="section-tag">{t('categories.tag')}</p>
        <h2 className="section-title">{t('categories.title')}</h2>
      </div>
      <div className="cats-grid">
        {loading
          ? [...Array(6)].map((_, i) => <CatSkeleton key={i} />)
          : cats.map(c => (
              <button key={c.id || c.name} className="cat-card">
                <span className="cat-icon">{c.icon}</span>
                <span className="cat-name">{c.name}</span>
                <span className="cat-count">{c.count} {t('categories.items')}</span>
              </button>
            ))
        }
      </div>
    </section>
  )
}

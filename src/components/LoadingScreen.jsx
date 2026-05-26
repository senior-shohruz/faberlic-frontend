import { useEffect, useState } from 'react'
import BrandLogo from './BrandLogo'

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const steps = [20, 45, 70, 90, 100]
    let i = 0
    const tick = () => {
      if (i < steps.length) {
        setProgress(steps[i++])
        setTimeout(tick, i === steps.length ? 200 : 300 + Math.random() * 200)
      } else {
        setTimeout(() => setVisible(false), 400)
      }
    }
    setTimeout(tick, 100)
  }, [])

  if (!visible) return null

  return (
    <div className={`ls-overlay ${progress === 100 ? 'ls-fade' : ''}`}>
      <div className="ls-content">
        <div className="ls-logo">
          <BrandLogo variant="stacked" size="xl" />
        </div>
        <div className="ls-rings">
          <div className="ls-ring ls-r1" />
          <div className="ls-ring ls-r2" />
          <div className="ls-ring ls-r3" />
        </div>
        <div className="ls-bar-wrap">
          <div className="ls-bar" style={{ width: `${progress}%` }} />
        </div>
        <p className="ls-pct">{progress}%</p>
      </div>
    </div>
  )
}

import { Link, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  {
    to: '/', label: '首页', icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l9-7 9 7"/><path d="M5 10v9h14v-9"/><rect x="10" y="15" width="4" height="4"/>
      </svg>
    )
  },
  {
    to: '/solar-term', label: '节气', icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/>
      </svg>
    )
  },
  {
    to: '/constitution', label: '体质', icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/>
      </svg>
    )
  },
  {
    to: '/wellness', label: '养生', icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C7 7 4 10 4 15a8 8 0 0 0 16 0c0-5-3-8-8-13z"/>
      </svg>
    )
  },
  {
    to: '/recipe', label: '食谱', icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="17" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>
      </svg>
    )
  },
  {
    to: '/tea', label: '花草茶', icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 8h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V8z"/><path d="M17 10h2a2 2 0 0 1 0 4h-2"/><path d="M8 2c0 1 1 1 1 2s-1 1-1 2M11 2c0 1 1 1 1 2s-1 1-1 2"/>
      </svg>
    )
  },
]

export default function Nav() {
  const location = useLocation()
  const currentPath = location.pathname === '/' ? '/' : location.pathname

  return (
    <nav className="top-nav">
      <div className="nav-brand">
        <div className="nav-brand-mark">顺</div>
        <span className="nav-brand-text">顺时生活</span>
      </div>
      <div className="nav-links">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className={`nav-link ${currentPath === item.to ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

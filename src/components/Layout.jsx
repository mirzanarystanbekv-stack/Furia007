import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useProfile } from '../context/ProfileContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const STEP_LINKS = [
  { to: '/profile', label: 'Профиль', num: 1 },
  { to: '/diagnostics', label: 'Диагностика', num: 2 },
  { to: '/recommendations', label: 'Рекомендации', num: 3 },
  { to: '/compare', label: 'Сравнение', num: 4 },
  { to: '/roadmap', label: 'Roadmap', num: 5 },
  { to: '/next', label: 'Следующий шаг', num: 6 },
]

export default function Layout() {
  const { hasProfile } = useProfile()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary-700">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600 text-white text-sm">МП</span>
            <span className="hidden sm:inline">МаршрутПоступления</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {STEP_LINKS.map((s) => (
              <NavLink
                key={s.to}
                to={s.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                {s.num}. {s.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {hasProfile && (
              <>
                <Link to="/recommendations" className="text-xl text-slate-400 hover:text-warning-500 transition" title="Избранное — звёздочки на рекомендациях">★</Link>
                <Link to="/next" className="btn-primary !px-4 !py-2 text-xs sm:text-sm">
                  Мой шаг →
                </Link>
              </>
            )}

            {/* Вход / аккаунт */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="h-9 w-9 rounded-full bg-primary-600 text-white font-bold text-sm flex items-center justify-center shadow-card hover:bg-primary-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  title={`${user.name} — меню аккаунта`}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>
                {menuOpen && (
                  <>
                    {/* Клик по подложке закрывает меню */}
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 card p-2 z-20" role="menu">
                      <div className="px-3 py-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setMenuOpen(false)
                          logout()
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-error-600 hover:bg-error-50 transition"
                        role="menuitem"
                      >
                        Выйти
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/auth" className="btn-secondary !px-4 !py-2 text-xs sm:text-sm">
                Войти
              </Link>
            )}
          </div>
        </div>

        {/* Мобильная навигация — горизонтальный скролл степпера */}
        {!isLanding && (
          <nav className="lg:hidden flex gap-1 overflow-x-auto px-4 pb-2 border-t border-slate-100">
            {STEP_LINKS.map((s) => (
              <NavLink
                key={s.to}
                to={s.to}
                className={({ isActive }) =>
                  `whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive ? 'bg-primary-600 text-white' : 'bg-slate-50 text-slate-600'
                  }`
                }
              >
                {s.num}. {s.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-slate-500 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
          <span>LOCUS Hackathon 2026 · Кейс №2 «Персональный маршрут поступления»</span>
          <span>Данные вузов: verified-источники и демонстрационные пометки. Демо-профиль вымышлен.</span>
        </div>
      </footer>
    </div>
  )
}

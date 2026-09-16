import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext.jsx'

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
              <Link to="/next" className="btn-primary !px-4 !py-2 text-xs sm:text-sm">
                Мой шаг →
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

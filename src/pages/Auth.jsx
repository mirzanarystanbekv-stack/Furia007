// Вход и регистрация. Единственная страница с формами авторизации:
// табы переключают режим, ошибки приходят из AuthContext (уже локализованы).
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Auth() {
  const { user, login, register, logout } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Уже вошёл — предлагаем продолжить, а не показываем формы заново
  if (user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="card p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary-600 text-white flex items-center justify-center text-xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Вы вошли как {user.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
          <button
            onClick={() => navigate('/profile')}
            className="btn-primary mt-6 w-full"
          >
            Продолжить заполнение анкеты →
          </button>
          <button onClick={logout} className="btn-ghost mt-2 w-full text-sm">
            Выйти из аккаунта
          </button>
        </div>
      </div>
    )
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    if (mode === 'register' && form.name.trim().length < 2) return 'Введите имя (минимум 2 символа)'
    if (!EMAIL_RE.test(form.email.trim())) return 'Введите корректный email'
    if (form.password.length < 6) return 'Пароль — минимум 6 символов'
    return ''
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const problem = validate()
    setError(problem)
    if (problem) return
    setBusy(true)
    const payload = { email: form.email.trim(), password: form.password }
    const result =
      mode === 'register'
        ? await register({ ...payload, name: form.name.trim() })
        : await login(payload)
    setBusy(false)
    if (result.ok) navigate('/profile')
    else setError(result.error)
  }

  const switchMode = (m) => {
    setMode(m)
    setError('')
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="card p-8">
        {/* Табы-переключатель режима */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          {[
            ['login', 'Вход'],
            ['register', 'Регистрация'],
          ].map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                mode === m ? 'bg-white text-primary-700 shadow-card' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <h1 className="mt-6 text-xl font-bold text-slate-900">
          {mode === 'login' ? 'С возвращением!' : 'Создайте аккаунт'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === 'login'
            ? 'Войдите, чтобы продолжить свой маршрут поступления.'
            : 'Аккаунт нужен, чтобы сохранить прогресс маршрута в этом браузере.'}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          {mode === 'register' && (
            <div>
              <label className="label" htmlFor="auth-name">Имя</label>
              <input
                id="auth-name"
                className="input"
                type="text"
                placeholder="Алихан Маратов"
                value={form.name}
                onChange={set('name')}
                autoComplete="name"
              />
            </div>
          )}
          <div>
            <label className="label" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              className="input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label" htmlFor="auth-password">Пароль</label>
            <input
              id="auth-password"
              className="input"
              type="password"
              placeholder={mode === 'register' ? 'Минимум 6 символов' : '••••••••'}
              value={form.password}
              onChange={set('password')}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-error-50 border border-error-200 px-4 py-2.5 text-sm text-error-700">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Секунду…' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          Демо-авторизация: данные хранятся только в этом браузере.
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Не хотите аккаунт?{' '}
        <Link to="/profile" className="font-semibold text-primary-700 hover:underline">
          Просто заполните анкету — это необязательно
        </Link>
      </p>
    </div>
  )
}

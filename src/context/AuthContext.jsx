// Локальная демо-авторизация без бэкенда: пользователи и сессия живут в
// localStorage этого браузера. Пароли не хранятся никогда — только SHA-256
// (Web Crypto, работает офлайн и из file://). Это демо для хакатона, не
// замена серверной аутентификации.
import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

const LS_USERS_KEY = 'locus.users.v1'
const LS_SESSION_KEY = 'locus.session.v1'

function loadJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => {
    const parsed = loadJSON(LS_USERS_KEY)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    // оставляем только записи правильной формы
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, u]) => u && typeof u === 'object' && typeof u.name === 'string' && typeof u.passHash === 'string',
      ),
    )
  })
  const [user, setUser] = useState(() => {
    const session = loadJSON(LS_SESSION_KEY)
    return session && typeof session.email === 'string' && typeof session.name === 'string' ? session : null
  })

  const persistUsers = (next) => {
    setUsers(next)
    try {
      localStorage.setItem(LS_USERS_KEY, JSON.stringify(next))
    } catch {
      /* квота localStorage — сессия всё равно работает до перезагрузки */
    }
  }

  // Web Crypto асинхронен — поэтому все экшены async
  async function hashPassword(password) {
    const data = new TextEncoder().encode('locus:' + password)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  const register = async ({ name, email, password }) => {
    const key = email.toLowerCase()
    if (users[key]) return { ok: false, error: 'Пользователь с таким email уже зарегистрирован' }
    const passHash = await hashPassword(password)
    const nextUsers = { ...users, [key]: { name, passHash } }
    persistUsers(nextUsers)
    const session = { email: key, name }
    setUser(session)
    try {
      localStorage.setItem(LS_SESSION_KEY, JSON.stringify(session))
    } catch {
      /* не критично */
    }
    return { ok: true }
  }

  const login = async ({ email, password }) => {
    const key = email.toLowerCase()
    const record = users[key]
    if (!record) return { ok: false, error: 'Пользователь не найден. Зарегистрируйтесь.' }
    const passHash = await hashPassword(password)
    if (passHash !== record.passHash) return { ok: false, error: 'Неверный пароль' }
    const session = { email: key, name: record.name }
    setUser(session)
    try {
      localStorage.setItem(LS_SESSION_KEY, JSON.stringify(session))
    } catch {
      /* не критично */
    }
    return { ok: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(LS_SESSION_KEY)
  }

  const value = useMemo(() => ({ user, users, register, login, logout }), [user, users])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

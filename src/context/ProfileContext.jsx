import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DEMO_PROFILE } from '../data/options.js'
import { scoreAllPrograms } from '../engine/scoring.js'
import { buildRoadmap } from '../engine/roadmap.js'

const ProfileContext = createContext(null)

const LS_PROFILE_KEY = 'locus.profile.v1'
const LS_DONE_KEY = 'locus.doneSteps.v1'
const LS_FAV_KEY = 'locus.favorites.v1'

const EMPTY_PROFILE = {
  grade: null,
  field: [],
  countries: [],
  gpa: '',
  achievements: false,
  achievements_text: '',
  ielts: '',
  target_lang_level: null,
  budget: null,
  priority: null,
  fear: null,
}

// localStorage может содержать что угодно (ручные правки, старые версии) —
// проверяем форму данных, а не только парсимость
function loadProfile() {
  try {
    const raw = localStorage.getItem(LS_PROFILE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      // сессии до мультевыбора направлений хранили строку — конвертируем
      const field = Array.isArray(parsed.field)
        ? parsed.field
        : parsed.field ? [parsed.field] : []
      // сессии до ввода прижима могли сохранить экстремальные значения
      const clamp = (v, max) => (typeof v === 'number' ? Math.min(max, Math.max(0, v)) : v)
      return { ...parsed, field, gpa: clamp(parsed.gpa, 5), ielts: clamp(parsed.ielts, 9) }
    }
  } catch {
    // повреждённая запись — стартуем с пустого профиля
  }
  return { ...EMPTY_PROFILE }
}

function loadDoneIds() {
  try {
    const raw = localStorage.getItem(LS_DONE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string')
  } catch {
    // повреждённая запись — стартуем с пустого списка
  }
  return []
}

function loadFavs() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LS_FAV_KEY) || 'null')
    if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string')
  } catch {
    // повреждённая запись — стартуем с пустого списка
  }
  return []
}

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(loadProfile)
  const [rawDone, setDoneIds] = useState(loadDoneIds)
  const [favs, setFavs] = useState(loadFavs)

  const filled = Boolean(profile.grade && profile.field && profile.countries.length > 0)

  useEffect(() => {
    localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    localStorage.setItem(LS_FAV_KEY, JSON.stringify(favs))
  }, [favs])

  const updateProfile = (patch) => setProfile((p) => ({ ...p, ...patch }))

  // Функциональное обновление — безопасно при быстрых кликах по чипам стран
  const toggleCountry = (c) =>
    setProfile((p) => {
      const has = p.countries.includes(c)
      return { ...p, countries: has ? p.countries.filter((x) => x !== c) : [...p.countries, c] }
    })

  const loadDemo = () => setProfile({ ...DEMO_PROFILE })
  const resetProfile = () => {
    setProfile({ ...EMPTY_PROFILE })
    setDoneIds([])
  }

  const toggleDone = (id) =>
    setDoneIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  const toggleFav = (id) =>
    setFavs((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  // Производные данные пересчитываются реактивно при любом изменении профиля
  const scored = useMemo(() => {
    return filled ? scoreAllPrograms(profile) : []
  }, [filled, profile])

  const roadmap = useMemo(() => {
    return filled ? buildRoadmap(profile, scored) : []
  }, [filled, scored, profile])

  // Единственный смысл «выполнено»: шаг есть в актуальном roadmap — иначе
  // протухшие id из прошлого профиля инфлируют прогресс вплоть до >100%
  const roadmapIdSet = useMemo(() => new Set(roadmap.map((s) => s.id)), [roadmap])
  const doneIds = useMemo(() => rawDone.filter((id) => roadmapIdSet.has(id)), [rawDone, roadmapIdSet])

  useEffect(() => {
    localStorage.setItem(LS_DONE_KEY, JSON.stringify(doneIds))
  }, [doneIds])

  const progress = roadmap.length ? Math.round((doneIds.length / roadmap.length) * 100) : 0

  const value = useMemo(
    () => ({
      profile,
      updateProfile,
      toggleCountry,
      loadDemo,
      resetProfile,
      doneIds,
      toggleDone,
      favs,
      toggleFav,
      scored,
      roadmap,
      progress,
      hasProfile: filled,
    }),
    [profile, doneIds, scored, roadmap, progress, filled, favs],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}

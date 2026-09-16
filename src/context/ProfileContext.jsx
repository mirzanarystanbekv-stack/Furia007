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
// localStorage может содержать что угодно (ручные правки, старые версии) —
// проверяем форму данных, а не только парсимость; повреждённая запись —
// тихий откат к дефолту
function loadJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

function loadProfile() {
  const parsed = loadJSON(LS_PROFILE_KEY)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...EMPTY_PROFILE }
  // сессии до мультевыбора направлений хранили строку — конвертируем
  const field = Array.isArray(parsed.field) ? parsed.field : parsed.field ? [parsed.field] : []
  // сессии до ввода прижима могли сохранить экстремальные значения
  const clamp = (v, max) => (typeof v === 'number' ? Math.min(max, Math.max(0, v)) : v)
  return { ...parsed, field, gpa: clamp(parsed.gpa, 5), ielts: clamp(parsed.ielts, 9) }
}

function loadIds(key) {
  const parsed = loadJSON(key)
  return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
}

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(loadProfile)
  const [rawDone, setDoneIds] = useState(() => loadIds(LS_DONE_KEY))
  const [favs, setFavs] = useState(() => loadIds(LS_FAV_KEY))

  // field — массив (мультивыбор); truthy-массив пустой длины не считается заполненным
  const filled = Boolean(profile.grade && profile.field?.length > 0 && profile.countries.length > 0)

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

  // То же для мультивыбора направлений: без функциональной формы два быстрых
  // клика в одном тике теряют первый выбор (перезапись по устаревшему профилю)
  const toggleField = (v) =>
    setProfile((p) => {
      const has = p.field.includes(v)
      const next = has ? p.field.filter((x) => x !== v) : [...p.field, v]
      return { ...p, field: next.slice(0, 3) }
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
      toggleField,
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

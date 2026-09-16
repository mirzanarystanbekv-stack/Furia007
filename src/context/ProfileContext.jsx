import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DEMO_PROFILE } from '../data/options.js'
import { scoreAllPrograms } from '../engine/scoring.js'
import { buildRoadmap } from '../engine/roadmap.js'

const ProfileContext = createContext(null)

const LS_PROFILE_KEY = 'locus.profile.v1'
const LS_DONE_KEY = 'locus.doneSteps.v1'

function loadFromLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export const EMPTY_PROFILE = {
  grade: null,
  field: null,
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

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(() => loadFromLS(LS_PROFILE_KEY, EMPTY_PROFILE))
  const [doneIds, setDoneIds] = useState(() => loadFromLS(LS_DONE_KEY, []))

  useEffect(() => {
    localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    localStorage.setItem(LS_DONE_KEY, JSON.stringify(doneIds))
  }, [doneIds])

  const updateProfile = (patch) => setProfile((p) => ({ ...p, ...patch }))

  const loadDemo = () => setProfile({ ...DEMO_PROFILE })
  const resetProfile = () => {
    setProfile({ ...EMPTY_PROFILE })
    setDoneIds([])
  }

  const toggleDone = (id) =>
    setDoneIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  // Производные данные пересчитываются реактивно при любом изменении профиля
  const scored = useMemo(() => {
    const filled = profile.grade && profile.field && profile.countries.length > 0
    return filled ? scoreAllPrograms(profile) : []
  }, [profile])

  const roadmap = useMemo(() => {
    const filled = profile.grade && profile.field && profile.countries.length > 0
    return filled ? buildRoadmap(profile, scored) : []
  }, [profile, scored])

  const progress = roadmap.length ? Math.round((doneIds.length / roadmap.length) * 100) : 0

  const value = useMemo(
    () => ({
      profile,
      updateProfile,
      loadDemo,
      resetProfile,
      doneIds,
      toggleDone,
      scored,
      roadmap,
      progress,
      hasProfile: Boolean(profile.grade && profile.field && profile.countries.length > 0),
    }),
    [profile, doneIds, scored, roadmap, progress],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}

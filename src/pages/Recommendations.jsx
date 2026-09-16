import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext.jsx'
import { MAX_BASE_SCORE } from '../engine/scoring.js'
import { VerifiedBadge, DemoBadge } from '../components/Badges.jsx'
import { FIELDS, COUNTRIES } from '../data/options.js'

const SORTS = [
  { value: 'match', label: 'По совпадению' },
  { value: 'cheap', label: 'Сначала дешёвые' },
  { value: 'deadline', label: 'Ближе дедлайн' },
]

export function ProgramCard({ rec, rank, fav, onFav, compareSelected, onCompare }) {
  const p = rec.program
  return (
    <article className="card p-5 sm:p-6 hover:shadow-card-hover transition-shadow flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {rank && <span className="text-xs font-bold text-primary-600 uppercase tracking-wide">#{rank}</span>}
          <h2 className="font-bold text-slate-900 text-lg leading-snug">{p.university}</h2>
          <p className="text-sm text-slate-600">{p.program} · {p.city}</p>
        </div>
        <div className="text-right shrink-0 flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={onFav}
            aria-pressed={fav}
            title={fav ? 'Убрать из избранного' : 'В избранное'}
            className={`text-xl leading-none transition hover:scale-110 ${fav ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'}`}
          >
            {fav ? '★' : '☆'}
          </button>
          <div className="text-2xl font-extrabold text-primary-700">{Math.round(rec.score)}</div>
          <div className="text-[11px] text-slate-400">базовый порог {MAX_BASE_SCORE}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {p.verified ? <VerifiedBadge source={p.source} /> : <DemoBadge />}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">язык: {p.language}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{p.admission_track}</span>
        {p.grant && <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] text-emerald-700 font-semibold">грант возможен</span>}
      </div>

      {/* «Почему подходит именно вам» — строго из причин скоринга */}
      <div className="mt-4 rounded-xl bg-primary-50/60 border border-primary-100 p-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-primary-700">Почему подходит именно вам</h3>
        <ul className="mt-2 space-y-1.5">
          {rec.reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className={`mt-0.5 text-xs font-bold ${r.points > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {r.points > 0 ? `+${r.points}` : '!'}
              </span>
              <span className="text-slate-700">{r.reason}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-xs text-slate-400 block">Стоимость</span>
          <span className="text-slate-800">{p.tuition_display}</span>
        </div>
        <div>
          <span className="text-xs text-slate-400 block">Дедлайн</span>
          <span className="text-slate-800">{p.deadline_label}</span>
        </div>
      </div>

      {onCompare && (
        <button
          type="button"
          onClick={() => onCompare(p.id)}
          className={`btn mt-4 !py-2 text-xs w-full ${compareSelected ? 'btn-secondary' : 'btn-ghost border border-slate-200'}`}
        >
          {compareSelected ? '✓ В сравнении' : '⇄ В сравнение'}
        </button>
      )}
    </article>
  )
}

export default function Recommendations() {
  const { scored, hasProfile, profile, favs, toggleFav } = useProfile()
  const navigate = useNavigate()

  const [q, setQ] = useState('')
  const [fieldFilter, setFieldFilter] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [maxCost, setMaxCost] = useState(30000)
  const [sort, setSort] = useState('match')
  const [showFavs, setShowFavs] = useState(false)
  const [compare, setCompare] = useState([])
  const [limit, setLimit] = useState(12)

  if (!hasProfile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Сначала заполните анкету — рекомендации строятся из вашего профиля.</p>
        <Link to="/profile" className="btn-primary mt-4">Заполнить анкету</Link>
      </div>
    )
  }

  const filtered = useMemo(() => {
    let list = scored
    if (showFavs) list = list.filter((r) => favs.includes(r.program.id))
    const query = q.trim().toLowerCase()
    if (query) {
      list = list.filter((r) =>
        `${r.program.university} ${r.program.program} ${r.program.city}`.toLowerCase().includes(query),
      )
    }
    if (fieldFilter) list = list.filter((r) => r.program.field === fieldFilter)
    if (countryFilter) list = list.filter((r) => r.program.country === countryFilter)
    list = list.filter((r) => (r.program.tuition_usd ?? 0) <= maxCost)
    const sorted = [...list]
    if (sort === 'cheap') sorted.sort((a, b) => (a.program.tuition_usd ?? 0) - (b.program.tuition_usd ?? 0))
    if (sort === 'deadline') sorted.sort((a, b) => a.program.deadline_month - b.program.deadline_month)
    return sorted
  }, [scored, favs, showFavs, q, fieldFilter, countryFilter, maxCost, sort])

  const visible = filtered.slice(0, limit)
  const hasActiveFilters = q.trim() || fieldFilter || countryFilter || maxCost < 30000 || showFavs

  const toggleCompare = (id) =>
    setCompare((sel) => {
      if (sel.includes(id)) return sel.filter((x) => x !== id)
      if (sel.length >= 2) return [sel[1], id]
      return [...sel, id]
    })

  const goCompare = () => {
    if (compare.length === 0) return
    navigate(`/compare?ids=${compare.join(',')}`)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Ваши рекомендации</h1>
          <p className="text-sm text-slate-500 mt-1">
            {scored.length} подходящих программ · приоритет: {profile.priority === 'grant' ? 'грант ≫ платное' : 'платное ок'} · интересов: {profile.field.length}
          </p>
        </div>
        <Link to="/profile" className="btn-secondary text-xs">Изменить вводные</Link>
      </div>

      {/* Поиск и фильтры */}
      <div className="mt-6 card p-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="search"
            className="input"
            placeholder="🔍 Вуз, программа, город…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="input" value={fieldFilter} onChange={(e) => setFieldFilter(e.target.value)}>
            <option value="">Все направления</option>
            {FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <select className="input" value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)}>
            <option value="">Все страны</option>
            {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <label className="text-xs text-slate-500 flex flex-col justify-center gap-1 min-w-[180px]">
          <span>Стоимость до ${maxCost.toLocaleString('ru-RU')}/год {maxCost >= 30000 && '(любая)'}</span>
          <input
            type="range" min="0" max="30000" step="1000"
            value={maxCost}
            onChange={(e) => setMaxCost(Number(e.target.value))}
            className="accent-primary-600"
          />
        </label>
      </div>

      {/* Тулбар: избранное + сравнение */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowFavs((v) => !v)}
          className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${showFavs ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300'}`}
        >
          ★ Избранное{favs.length ? ` (${favs.length})` : ''}
        </button>
        <button
          type="button"
          onClick={goCompare}
          disabled={compare.length === 0}
          className="btn-primary !py-2 !px-4 text-xs disabled:opacity-40 disabled:pointer-events-none"
        >
          ⇄ Сравнить выбранные{compare.length ? ` (${compare.length})` : ''}
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => { setQ(''); setFieldFilter(''); setCountryFilter(''); setMaxCost(30000); setShowFavs(false) }}
            className="btn-ghost text-xs"
          >
            ✕ Сбросить фильтры
          </button>
        )}
        <span className="text-xs text-slate-400 ml-auto">
          показано {visible.length} из {filtered.length}
        </span>
      </div>

      {/* Сетка карточек: 1 колонка на телефоне, 2 на ноутбуке */}
      {visible.length > 0 ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {visible.map((rec, i) => (
            <ProgramCard
              key={rec.program.id}
              rec={rec}
              rank={sort === 'match' && !hasActiveFilters ? i + 1 : undefined}
              fav={favs.includes(rec.program.id)}
              onFav={() => toggleFav(rec.program.id)}
              compareSelected={compare.includes(rec.program.id)}
              onCompare={toggleCompare}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5 card p-8 text-center">
          <p className="text-slate-600">
            {hasActiveFilters
              ? 'Ничего не найдено по фильтрам — попробуйте сбросить их или расширить критерии.'
              : 'Под эти вводные ничего не подошло. Попробуйте расширить бюджет или добавить страну.'}
          </p>
          {hasActiveFilters ? (
            <button type="button" onClick={() => { setQ(''); setFieldFilter(''); setCountryFilter(''); setMaxCost(30000); setShowFavs(false) }} className="btn-primary mt-4">
              Сбросить фильтры
            </button>
          ) : (
            <Link to="/profile" className="btn-primary mt-4">Изменить анкету</Link>
          )}
        </div>
      )}

      {filtered.length > limit && (
        <div className="mt-6 text-center">
          <button type="button" onClick={() => setLimit((n) => n + 12)} className="btn-secondary">
            Показать ещё ({filtered.length - limit})
          </button>
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row justify-between gap-3 pb-10">
        <Link to="/diagnostics" className="btn-ghost text-sm">← Назад к диагностике</Link>
        <Link to="/compare" className="btn-primary">Далее: сравнить варианты →</Link>
      </div>
    </div>
  )
}

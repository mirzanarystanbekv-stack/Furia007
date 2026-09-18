import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProfile } from '../context/useProfile.js'
import { programScholarships, scoreAllPrograms, scorePercent, SCORING_RULES } from '../engine/scoring.js'
import { buildRoadmap } from '../engine/roadmap.js'
import {
  buildRecommendationBrief,
  filterByNaturalQuery,
  parseNaturalQuery,
  requestGroundedExplanation,
} from '../engine/aiAssist.js'
import { VerifiedBadge, DemoBadge } from '../components/Badges.jsx'
import { FIELDS, COUNTRIES, SCHOLARSHIPS } from '../data/options.js'

const SORTS = [
  { value: 'match', label: 'По совпадению' },
  { value: 'cheap', label: 'Сначала дешёвые' },
  { value: 'deadline', label: 'Ближе дедлайн' },
]

function ProgramCard({ rec, rank, profile, fav, onFav, compareSelected, onCompare, explanation, explanationLoading, onExplain }) {
  const p = rec.program
  return (
    <article className="card p-5 sm:p-6 hover:shadow-card-hover transition-shadow flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {rank && <span className="text-xs font-bold text-primary-600 uppercase tracking-wide">#{rank}</span>}
          <h2 className="font-bold text-slate-900 text-lg leading-snug">{p.university}</h2>
          <p className="text-sm text-slate-600">{p.program} · {p.city}</p>
        </div>          <div className="text-right shrink-0 flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={onFav}
              aria-pressed={fav}
              title={fav ? 'Убрать из избранного' : 'В избранное'}
              aria-label={fav ? 'Убрать программу из избранного' : 'Добавить программу в избранное'}
              className={`text-xl leading-none transition hover:scale-110 ${fav ? 'text-warning-500' : 'text-slate-300 hover:text-warning-400'}`}
            >
              {fav ? '★' : '☆'}
            </button>
            {/* Бейдж совпадения (§6 ТЗ): score → % от базового порога, всегда
                с пометкой «оценочно» — скоринг модельный, не гарантия поступления */}
            <span
              className="rounded-full bg-primary-50 border border-primary-200 px-2 py-0.5 text-[11px] font-bold text-primary-700"
              title={`Совпадение ${scorePercent(rec.score, profile)}% от максимума для этих вводных — оценка, не гарантия поступления`}
            >
              Совпадение {scorePercent(rec.score, profile)}%
            </span>
            <div className="text-[11px] text-slate-400">оценочно, не гарантия</div>
          </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {rec.outsideChoice && (
          <span className="rounded-full border border-warning-200 bg-warning-50 px-2 py-0.5 text-[11px] font-semibold text-warning-700">
            вне выбранных стран — альтернатива
          </span>
        )}
        {p.verified ? <VerifiedBadge source={p.source} /> : <DemoBadge />}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">язык: {p.language}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{p.admission_track}</span>
        {p.grant && <span className="rounded-full bg-primary-50 border border-primary-200 px-2 py-0.5 text-[11px] text-primary-700 font-semibold">грант возможен</span>}
        {programScholarships(p).map((sid) => {
          const s = SCHOLARSHIPS.find((x) => x.id === sid)
          return (
            <span key={sid} title={p.scholarship} className="rounded-full bg-accent-50 border border-accent-200 px-2 py-0.5 text-[11px] font-semibold text-accent-700">
              🎓 {s.label}
            </span>
          )
        })}
      </div>

      {/* «Почему подходит именно вам» — строго из причин скоринга */}
      <div className="mt-4 rounded-xl bg-primary-50/60 border border-primary-100 p-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-primary-700">Почему подходит именно вам</h3>
        <ul className="mt-2 space-y-1.5">
          {rec.reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className={`mt-0.5 text-xs font-bold ${r.points > 0 ? 'text-primary-600' : 'text-warning-600'}`}>
                {r.points > 0 ? `+${r.points}` : '!'}
              </span>
              <span className="text-slate-700">{r.reason}</span>
            </li>
          ))}
        </ul>
        <details className="mt-3 rounded-lg border border-primary-100 bg-white/60 px-3 py-2 text-sm text-slate-700">
          <summary className="cursor-pointer font-semibold text-primary-700">Как мы считаем совпадение</summary>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {SCORING_RULES.map((rule) => (
              <li key={rule.label} className="flex justify-between gap-3">
                <span>{rule.label}</span>
                <strong className="shrink-0 text-primary-700">+{rule.points}</strong>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-500">Затем применяются множитель класса и приоритет гранта. Это оценка совпадения, а не гарантия поступления.</p>
        </details>
        <button
          type="button"
          onClick={onExplain}
          disabled={explanationLoading}
          className="btn-secondary !py-2 !px-3 mt-3 text-xs"
        >
          {explanationLoading ? 'Готовлю объяснение…' : explanation ? 'Обновить объяснение' : 'Объяснить проще'}
        </button>
        {explanation && (
          <div className="mt-3 rounded-lg bg-white/80 border border-primary-100 p-3 text-sm text-slate-700">
            <div className="text-[11px] font-bold uppercase tracking-wide text-primary-700">
              {explanation.mode === 'ai-assisted' ? 'AI-assisted объяснение' : 'Локальное объяснение'}
            </div>
            <p className="mt-1">{explanation.text}</p>
          </div>
        )}
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

      <button
        type="button"
        onClick={() => onCompare(p.id)}
        className={`btn mt-4 !py-2 text-xs w-full ${compareSelected ? 'btn-secondary' : 'btn-ghost border border-slate-200'}`}
      >
        {compareSelected ? '✓ В сравнении' : '⇄ В сравнение'}
      </button>
    </article>
  )
}

export default function Recommendations() {
  const { scored, hasProfile, profile, favs, toggleFav } = useProfile()
  const navigate = useNavigate()

  const [q, setQ] = useState('')
  const [smartQuery, setSmartQuery] = useState('')
  const [smartIntent, setSmartIntent] = useState(() => parseNaturalQuery(''))
  const [smartError, setSmartError] = useState('')
  const [explanations, setExplanations] = useState({})
  const [explanationLoading, setExplanationLoading] = useState({})
  const [fieldFilter, setFieldFilter] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [schFilter, setSchFilter] = useState('')
  const [maxCost, setMaxCost] = useState(30000)
  const [sort, setSort] = useState('match')
  const [showFavs, setShowFavs] = useState(false)
  const [compare, setCompare] = useState([])
  const [compareNotice, setCompareNotice] = useState('')
  const [limit, setLimit] = useState(12)
  const [whatIfBudget, setWhatIfBudget] = useState(profile.budget || 'mid')
  const [whatIfIelts, setWhatIfIelts] = useState(String(profile.ielts ?? ''))
  const resetFilters = () => {
    setQ('')
    setSmartQuery('')
    setSmartIntent(parseNaturalQuery(''))
    setSmartError('')
    setFieldFilter('')
    setCountryFilter('')
    setSchFilter('')
    setMaxCost(30000)
    setShowFavs(false)
  }

  const applySmartQuery = (event) => {
    event.preventDefault()
    const intent = parseNaturalQuery(smartQuery)
    setSmartIntent(intent)
    setSmartError(intent.hasIntent ? '' : 'Опишите направление, страну, язык, бюджет или стипендию.')
    setLimit(12)
  }

  const whatIfProfile = useMemo(() => ({ ...profile, budget: whatIfBudget, ielts: whatIfIelts }), [profile, whatIfBudget, whatIfIelts])
  const whatIfScored = useMemo(() => scoreAllPrograms(whatIfProfile).slice(0, 3), [whatIfProfile])
  const whatIfRoadmap = useMemo(() => buildRoadmap(whatIfProfile, whatIfScored), [whatIfProfile, whatIfScored])

  const filtered = useMemo(() => {
    let list = filterByNaturalQuery(scored, smartIntent)
    if (showFavs) list = list.filter((r) => favs.includes(r.program.id))
    const query = q.trim().toLowerCase()
    if (query) {
      list = list.filter((r) =>
        `${r.program.university} ${r.program.program} ${r.program.city}`.toLowerCase().includes(query),
      )
    }
    if (fieldFilter) list = list.filter((r) => r.program.field === fieldFilter)
    if (countryFilter) list = list.filter((r) => r.program.country === countryFilter)
    if (schFilter) list = list.filter((r) => programScholarships(r.program).includes(schFilter))
    list = list.filter((r) => r.program.tuition_usd === null || (r.program.tuition_usd ?? 0) <= maxCost)
    const sorted = [...list]
    if (sort === 'cheap') sorted.sort((a, b) => (a.program.tuition_usd === null ? Infinity : a.program.tuition_usd ?? 0) - (b.program.tuition_usd === null ? Infinity : b.program.tuition_usd ?? 0))
    if (sort === 'deadline') sorted.sort((a, b) => (a.program.deadline_month === null ? Infinity : a.program.deadline_month ?? Infinity) - (b.program.deadline_month === null ? Infinity : b.program.deadline_month ?? Infinity))
    return sorted
  }, [scored, smartIntent, favs, showFavs, q, fieldFilter, countryFilter, schFilter, maxCost, sort])

  const explainRecommendation = async (rec) => {
    setExplanationLoading((current) => ({ ...current, [rec.program.id]: true }))
    try {
      const explanation = await requestGroundedExplanation({ recommendation: rec, profile })
      setExplanations((current) => ({ ...current, [rec.program.id]: explanation }))
    } finally {
      setExplanationLoading((current) => ({ ...current, [rec.program.id]: false }))
    }
  }

  const visible = filtered.slice(0, limit)
  const recommendationBrief = useMemo(() => buildRecommendationBrief(filtered), [filtered])
  const hasActiveFilters = Boolean(smartIntent.raw || q.trim() || fieldFilter || countryFilter || schFilter || maxCost < 30000 || showFavs)

  const toggleCompare = (id) => {
    setCompare((sel) => {
      if (sel.includes(id)) {
        setCompareNotice('Вариант убран из сравнения.')
        return sel.filter((x) => x !== id)
      }
      if (sel.length >= 2) {
        setCompareNotice('Сравнение ограничено двумя вариантами — первый заменён.')
        return [sel[1], id]
      }
      setCompareNotice('Вариант добавлен в сравнение.')
      return [...sel, id]
    })
  }

  const goCompare = () => {
    if (compare.length === 0) return
    navigate(`/compare?ids=${compare.join(',')}`)
  }

  if (!hasProfile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Сначала заполните анкету — рекомендации строятся из вашего профиля.</p>
        <Link to="/profile" className="btn-primary mt-4">Заполнить анкету</Link>
      </div>
    )
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

      <form onSubmit={applySmartQuery} className="mt-6 card p-4">
        <label className="text-sm font-semibold text-slate-700" htmlFor="smart-university-search">AI-помощник рекомендаций</label>
        <div className="mt-2 flex flex-col sm:flex-row gap-2">
          <input
            id="smart-university-search"
            type="search"
            className="input"
            placeholder="Например: медицина на английском в Европе с грантом"
            value={smartQuery}
            onChange={(e) => setSmartQuery(e.target.value)}
          />
          <button type="submit" className="btn-primary shrink-0">Найти в каталоге</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Запрос разбирается локально, а рекомендации основаны на данных каталога. Если AI-сервис недоступен, используется локальный режим — без выдуманных цен и дедлайнов.</p>
        {smartIntent.summary.length > 0 && (
          <p className="mt-2 text-xs text-primary-700">Фильтры запроса: {smartIntent.summary.join(' · ')}</p>
        )}
        {smartError && <p className="mt-2 text-sm text-error-700">{smartError}</p>}
      </form>

      <section className="mt-4 card p-5 border-accent-200 bg-accent-50/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Что если изменить вводные?</h2>
            <p className="mt-1 text-sm text-slate-600">Симулятор не меняет ваш профиль — показывает, как условия повлияют на топ-3.</p>
          </div>
          <span className="text-xs rounded-full bg-white border border-accent-200 px-2 py-1 text-accent-700">пересчёт сразу</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-700">Бюджет
            <select className="input mt-1" value={whatIfBudget} onChange={(event) => setWhatIfBudget(event.target.value)}>
              <option value="low">до $1 500/год</option>
              <option value="mid">до $3 000/год</option>
              <option value="high">до $30 000/год</option>
            </select>
          </label>
          <label className="text-sm text-slate-700">IELTS
            <input className="input mt-1" type="number" min="0" max="9" step="0.5" value={whatIfIelts} onChange={(event) => setWhatIfIelts(event.target.value)} placeholder="например, 6.5" />
          </label>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {whatIfScored.map((item) => (
            <div key={item.program.id} className="rounded-lg bg-white border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-900 truncate">{item.program.university}</p>
              <p className="mt-1 text-xs text-slate-500 truncate">{item.program.program}</p>
              <p className="mt-2 text-sm font-bold text-primary-700">{scorePercent(item.score, whatIfProfile)}% совпадение</p>
              {(() => {
                const baseline = scored.find((candidate) => candidate.program.id === item.program.id)
                const delta = baseline ? item.score - baseline.score : 0
                return <p className="mt-1 text-xs text-slate-500">изменение модели: {delta === 0 ? 'без изменений' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} балла`}</p>
              })()}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">В этом сценарии roadmap содержит {whatIfRoadmap.length} шагов{whatIfRoadmap.some((step) => step.id === 'prep-year') ? ' и подготовительный год Hazırlık' : ''}. Процент оценочный и не гарантирует поступление. Для постоянного изменения вернитесь в анкету.</p>
      </section>

      {recommendationBrief.items.length > 0 && (
        <section className="mt-4 rounded-2xl border border-accent-200 bg-gradient-to-br from-accent-50 to-white p-5" aria-label="AI-рекомендация">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">AI-рекомендация по твоему профилю</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-700">{recommendationBrief.text}</p>
          <div className="mt-4 grid gap-3">
            {recommendationBrief.items.map((item) => {
              const selected = compare.includes(item.id)
              return (
                <div key={item.id} className="rounded-xl bg-white/80 border border-white p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCompare(item.id)}
                      className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition ${selected ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 hover:text-primary-700'}`}
                      aria-pressed={selected}
                    >
                      {selected ? '✓ В сравнении' : 'Добавить в сравнение'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          {compare.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary-200 bg-primary-50/70 px-3 py-2 text-sm text-primary-800" role="status" aria-live="polite">
              <span>{compareNotice || `В сравнении: ${compare.length} из 2 вариантов.`}</span>
              <Link to={`/compare?ids=${compare.join(',')}`} className="font-semibold underline underline-offset-2 hover:text-primary-950">
                Открыть Compare →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Поиск и фильтры */}
      <div className="mt-4 card p-4 grid gap-3 md:grid-cols-[1fr_auto]">
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
          <select className="input" value={schFilter} onChange={(e) => setSchFilter(e.target.value)}>
            <option value="">Любая стипендия</option>
            {SCHOLARSHIPS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
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
          className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${showFavs ? 'border-warning-400 bg-warning-50 text-warning-700' : 'border-slate-200 bg-white text-slate-600 hover:border-warning-300'}`}
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
          <button type="button" onClick={resetFilters} className="btn-ghost text-xs">
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
              profile={profile}
              fav={favs.includes(rec.program.id)}
              onFav={() => toggleFav(rec.program.id)}
              compareSelected={compare.includes(rec.program.id)}
              onCompare={toggleCompare}
              explanation={explanations[rec.program.id]}
              explanationLoading={Boolean(explanationLoading[rec.program.id])}
              onExplain={() => explainRecommendation(rec)}
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
            <button type="button" onClick={resetFilters} className="btn-primary mt-4">
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

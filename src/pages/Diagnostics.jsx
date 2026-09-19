import { Link } from 'react-router-dom'
import { useProfile } from '../context/useProfile.js'
import { diagnose, estimateChance } from '../engine/scoring.js'
import { getFearAccent } from '../data/fearModes.js'
import { DemoBadge } from '../components/Badges.jsx'

const LEVEL_STYLES = {
  'высокие': 'bg-primary-50 border-primary-200 text-primary-700',
  'хорошие': 'bg-accent-50 border-accent-200 text-accent-700',
  'средние': 'bg-warning-50 border-warning-200 text-warning-700',
  'требуют усиления': 'bg-warning-50 border-warning-200 text-warning-700',
}

export default function Diagnostics() {
  const { profile, scored, hasProfile } = useProfile()

  if (!hasProfile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Сначала заполните анкету — тогда мы сможем оценить ваш профиль.</p>
        <Link to="/profile" className="btn-primary mt-4">Заполнить анкету</Link>
      </div>
    )
  }

  const d = diagnose(profile)
  const fear = getFearAccent(profile.fear)
  const chance = estimateChance(scored, profile)

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Диагностика профиля</h1>
      <p className="text-sm text-slate-500 mt-1">Быстрый анализ сильных сторон и образовательной цели</p>

      {fear.label && (
        <div className="mt-4 card p-4 border-l-4 border-l-primary-500 bg-primary-50/50">
          <span className="text-xs font-bold uppercase tracking-wide text-primary-700">{fear.label}</span>
          <p className="text-sm text-slate-700 mt-1">{fear.text}</p>
        </div>
      )}

      <section className="card p-6 mt-6">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Образовательная цель</h2>
        <p className="mt-2 text-lg font-semibold text-slate-900">{d.goal} · {profile.countries.join(' + ')}</p>
        <p className="text-sm text-slate-500 mt-1">
          {profile.grade} класс · бюджет: {profile.budget === 'low' ? 'низкий' : profile.budget === 'mid' ? 'средний' : 'высокий'} ·
          приоритет: {profile.priority === 'grant' ? 'грант' : 'платное ок'}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-slate-900">Сильные стороны</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {d.strengths.map((s) => (
            <div key={s.title} className="card p-4 border-l-4 border-l-primary-500">
              <h3 className="font-semibold text-slate-900 text-sm">💪 {s.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {d.risks.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-bold text-slate-900">На что обратить внимание</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {d.risks.map((r) => (
              <div key={r.title} className="card p-4 border-l-4 border-l-warning-500">
                <h3 className="font-semibold text-slate-900 text-sm">⚠️ {r.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{r.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card p-6 mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Оценка шансов — топ-3 программы</h2>
          <DemoBadge text="оценочно, не гарантия" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-4xl font-bold text-slate-900">{chance.avg}%</span>
          <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${LEVEL_STYLES[chance.level] ?? LEVEL_STYLES['средние']}`}>
            {chance.level} шансы
          </span>
        </div>
        <p className="text-sm text-slate-600 mt-2">{chance.verdict}</p>
        <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
          {chance.reasons.map((reason) => <li key={reason} className="flex items-start gap-2"><span className="text-primary-600">•</span><span>{reason}</span></li>)}
        </ul>
        <div className="mt-4 space-y-2">
          {chance.top.map((t) => (
            <div key={t.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0"><div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-primary-500 transition-all duration-500" style={{ width: `${t.percent}%` }} /></div></div>
              <span className="text-xs text-slate-600 truncate max-w-[45%] text-right">{t.university} · {t.percent}%</span>
            </div>
          ))}
        </div>
      </section>

      {d.highGpaGrantFlag && (
        <div className="card p-4 mt-6 bg-warning-50/50">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-slate-900">GPA &gt; 4.5 — вы в зоне топ-грантов</span>
            <DemoBadge text="демонстрационная оценка" />
          </div>
          <p className="text-sm text-slate-600 mt-1">Это модельное предположение для демо-логики, а не гарантия. Реальные критерии смотрите на turkiyeburslari.gov.tr.</p>
        </div>
      )}


      <div className="mt-6 card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <p className="text-sm text-slate-600">Найдено подходящих программ: <b>{scored.length}</b> — пересчитывается при любом изменении профиля.</p>
        <div className="flex gap-2">
          <Link to="/profile" className="btn-secondary text-xs">Изменить анкету</Link>
          <Link to="/recommendations" className="btn-primary text-xs">К рекомендациям →</Link>
        </div>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext.jsx'
import { diagnose } from '../engine/scoring.js'
import { getFearAccent } from '../data/fearModes.js'
import { DemoBadge } from '../components/Badges.jsx'

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

      {/* Цель */}
      <section className="card p-6 mt-6">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Образовательная цель</h2>
        <p className="mt-2 text-lg font-semibold text-slate-900">
          {d.goal} · {profile.countries.join(' + ')}
        </p>
        <p className="text-sm text-slate-500 mt-1">
          {profile.grade} класс · бюджет: {profile.budget === 'low' ? 'низкий' : profile.budget === 'mid' ? 'средний' : 'высокий'} ·
          приоритет: {profile.priority === 'grant' ? 'грант' : 'платное ок'}
        </p>
      </section>

      {/* Сильные стороны */}
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

      {/* Риски */}
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

      {/* Модельное предположение из спеки — с обязательным бейджем */}
      {d.highGpaGrantFlag && (
        <div className="card p-4 mt-6 bg-warning-50/50">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-slate-900">GPA &gt; 4.5 — вы в зоне топ-грантов</span>
            <DemoBadge text="демонстрационная оценка" />
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Это модельное предположение для демо-логики, а не гарантия. Реальные критерии смотрите на turkiyeburslari.gov.tr.
          </p>
        </div>
      )}

      {/* Реактивность: видимая связь с профилем */}
      <div className="mt-6 card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <p className="text-sm text-slate-600">
          Найдено подходящих программ: <b>{scored.length}</b> — пересчитывается при любом изменении профиля.
        </p>
        <div className="flex gap-2">
          <Link to="/profile" className="btn-secondary text-xs">Изменить анкету</Link>
          <Link to="/recommendations" className="btn-primary text-xs">К рекомендациям →</Link>
        </div>
      </div>
    </div>
  )
}

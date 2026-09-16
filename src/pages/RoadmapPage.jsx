import { Link } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext.jsx'
import { formatMonth, getFearAccent } from '../engine/roadmap.js'
import { ProgressRing } from '../components/Badges.jsx'

const KIND_STYLES = {
  exam: { icon: '📝', label: 'Экзамены' },
  deadline: { icon: '⏰', label: 'Подача' },
  docs: { icon: '📄', label: 'Документы' },
  activity: { icon: '🏅', label: 'Активности' },
  risk: { icon: '⚠️', label: 'Риск' },
  milestone: { icon: '🎓', label: 'Финал' },
}

export default function RoadmapPage() {
  const { profile, roadmap, doneIds, toggleDone, hasProfile, progress } = useProfile()
  const fear = getFearAccent(profile.fear)

  if (!hasProfile || roadmap.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Roadmap строится из вашего профиля — сначала заполните анкету.</p>
        <Link to="/profile" className="btn-primary mt-4">Заполнить анкету</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Ваш Roadmap</h1>
          <p className="text-sm text-slate-500 mt-1">Пошаговый план до зачисления — отмечайте выполненное</p>
        </div>
        <ProgressRing value={progress} />
      </div>

      <div className="mt-4 card p-4 border-l-4 border-l-primary-500 bg-primary-50/50 text-sm text-slate-700">
        💡 Режим акцента: <b>{fear.label}</b> — {fear.text}
      </div>

      {/* Таймлайн */}
      <ol className="mt-6 space-y-3 pb-16">
        {roadmap.map((step) => {
          const done = doneIds.includes(step.id)
          const st = KIND_STYLES[step.kind] || { icon: '•', label: '' }
          return (
            <li key={step.id} className="card p-4 sm:p-5 flex gap-4 items-start">
              <button
                type="button"
                onClick={() => toggleDone(step.id)}
                aria-pressed={done}
                className={`mt-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                  done
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-slate-300 bg-white hover:border-primary-400'
                }`}
              >
                {done && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg leading-none">{st.icon}</span>
                  <h3 className={`font-semibold text-sm sm:text-base ${done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-600 mt-1">{step.desc}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-full bg-primary-50 text-primary-700 border border-primary-100 px-2 py-0.5 font-semibold">
                    📅 {formatMonth(step.month)}
                  </span>
                  <span className="rounded-full bg-slate-100 text-slate-500 px-2 py-0.5">{st.label}</span>
                  {step.source && (
                    <span className="text-slate-400 italic">{step.source}</span>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="flex flex-col sm:flex-row justify-between gap-3 pb-10">
        <Link to="/compare" className="btn-ghost text-sm">← К сравнению</Link>
        <Link to="/next" className="btn-primary">Следующее действие →</Link>
      </div>
    </div>
  )
}

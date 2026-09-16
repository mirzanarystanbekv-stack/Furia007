import { Link } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext.jsx'
import { formatMonth, getNextAction, getFearAccent } from '../engine/roadmap.js'
import { ProgressRing } from '../components/Badges.jsx'

export default function NextAction() {
  const { profile, roadmap, doneIds, toggleDone, hasProfile, progress } = useProfile()

  if (!hasProfile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Сначала заполните анкету — тогда мы подскажем ближайший шаг.</p>
        <Link to="/profile" className="btn-primary mt-4">Заполнить анкету</Link>
      </div>
    )
  }

  const next = getNextAction(roadmap, doneIds)
  const fear = getFearAccent(profile.fear)

  if (!next) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Все шаги выполнены!</h1>
        <p className="mt-2 text-slate-600">
          Ваш маршрут завершён — обновите анкету, чтобы спланировать следующий этап.
        </p>
        <Link to="/profile" className="btn-primary mt-6">Обновить анкету</Link>
      </div>
    )
  }

  const done = doneIds.includes(next.id)
  const total = roadmap.length
  const doneCount = doneIds.length

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wide text-primary-600">Следующее действие</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Один конкретный шаг сейчас</h1>
        </div>
        <ProgressRing value={progress} />
      </div>

      {fear.id === 'deadlines' && (
        <div className="mt-4 card p-4 border-l-4 border-l-amber-500 bg-amber-50/50 text-sm text-slate-700">
          ⏰ <b>Окно подачи:</b> {formatMonth(next.month)}. Не откладывайте — документы готовьте заранее, до окна.
        </div>
      )}
      {fear.id === 'documents' && (
        <div className="mt-4 card p-4 border-l-4 border-l-primary-500 bg-primary-50/50 text-sm text-slate-700">
          📄 <b>Сначала документы:</b> для этого шага заранее подготовьте транскрипт, переводы и мотивационное письмо — чек-лист на странице Roadmap.
        </div>
      )}
      {fear.id === 'choice' && (
        <div className="mt-4 card p-4 border-l-4 border-l-emerald-500 bg-emerald-50/50 text-sm text-slate-700">
          🎯 <b>Почему этот шаг:</b> он вытекает из ваших рекомендаций и прозрачного скоринга — так каждый шаг приближает к выбранному варианту.
        </div>
      )}

      {/* Большая карточка действия */}
      <div className="mt-6 card p-6 sm:p-8 border-2 border-primary-200">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => toggleDone(next.id)}
            aria-pressed={done}
            aria-label="Отметить шаг выполненным"
            className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0 mt-1 ${
              done
                ? 'bg-primary-600 border-primary-600 text-white'
                : 'bg-white border-slate-300 text-transparent hover:border-primary-400'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-primary-50 text-primary-700 border border-primary-100 px-2 py-0.5 font-semibold">
                📅 {formatMonth(next.month)}
              </span>
              <span className="rounded-full bg-slate-100 text-slate-500 px-2 py-0.5">
                {doneCount} из {total} шагов
              </span>
            </div>

            <h2 className={`mt-3 text-xl font-bold ${done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
              {next.title}
            </h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base">{next.desc}</p>
            {next.source && <p className="mt-2 text-xs text-slate-400 italic">{next.source}</p>}

            <button
              type="button"
              onClick={() => toggleDone(next.id)}
              className={`btn mt-5 ${done ? 'btn-secondary' : 'btn-primary'}`}
            >
              {done ? '↺ Вернуть в план' : '✓ Отметить выполненным'}
            </button>
          </div>
        </div>
      </div>

      {/* Что дальше */}
      <div className="mt-4 card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
        <span className="text-sm text-slate-600">После выполнения здесь появится следующий шаг из вашего roadmap.</span>
        <Link to="/roadmap" className="btn-secondary text-xs">Смотреть весь план</Link>
      </div>

      <div className="mt-8 flex justify-between pb-10">
        <Link to="/roadmap" className="btn-ghost text-sm">← К roadmap</Link>
        <Link to="/profile" className="btn-secondary text-sm">Изменить вводные</Link>
      </div>
    </div>
  )
}

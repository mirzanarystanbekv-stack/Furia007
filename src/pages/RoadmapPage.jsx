import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../context/useProfile.js'
import { buildRoadmapCalendar, formatMonth } from '../engine/roadmap.js'
import { getFearAccent, buildDocsChecklist } from '../data/fearModes.js'
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
  const { profile, scored, roadmap, doneIds, toggleDone, hasProfile, progress } = useProfile()
  const fear = getFearAccent(profile.fear)
  const [copyStatus, setCopyStatus] = useState('')

  const downloadCalendar = () => {
    const file = new Blob([buildRoadmapCalendar(roadmap)], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = 'moj-roadmap-postupleniya.ics'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!hasProfile || roadmap.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Roadmap строится из вашего профиля — сначала заполните анкету.</p>
        <Link to="/profile" className="btn-primary mt-4">Заполнить анкету</Link>
      </div>
    )
  }

  // Режим «главного страха» меняет порядок шагов и подсветку
  const sorted = fear.order ? [...roadmap].sort(fear.order) : roadmap
  const docsItems = fear.id === 'documents' ? buildDocsChecklist(scored) : null

  const copyRoadmap = async () => {
    if (!navigator.clipboard?.writeText) {
      setCopyStatus('error')
      return
    }
    const text = sorted
      .map((step) => `${formatMonth(step.month)} — ${step.title}\n${step.desc}${step.source ? `\n${step.source}` : ''}`)
      .join('\n\n')
    setCopyStatus('copying')
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Ваш Roadmap</h1>
          <p className="text-sm text-slate-500 mt-1">Пошаговый план до зачисления — отмечайте выполненное</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => window.print()} className="btn-ghost text-xs">
              🖨 Распечатать план
            </button>
            <button type="button" onClick={downloadCalendar} className="btn-secondary text-xs">
              📅 Скачать календарь (.ics)
            </button>
            <button
              type="button"
              onClick={copyRoadmap}
              disabled={copyStatus === 'copying'}
              className="btn-secondary text-xs"
            >
              {copyStatus === 'copied' ? '✓ План скопирован' : copyStatus === 'error' ? 'Не удалось скопировать' : '📋 Скопировать план'}
            </button>
          </div>
        </div>
        <ProgressRing value={progress} />
      </div>

      {fear.label && (
        <div className="mt-4 card p-4 border-l-4 border-l-primary-500 bg-primary-50/50 text-sm text-slate-700">
          💡 <b>{fear.label}</b> — {fear.text}
        </div>
      )}

      {/* Таймлайн */}
      <ol className="mt-6 space-y-3 pb-6">
        {sorted.map((step) => {
          const done = doneIds.includes(step.id)
          const st = KIND_STYLES[step.kind] || { icon: '•', label: '' }
          const highlighted = fear.id === 'deadlines' && step.kind === 'deadline' && !done
          return (
            <li
              key={step.id}
              className={`card p-4 sm:p-5 flex gap-4 items-start transition-shadow ${
                highlighted ? 'ring-2 ring-warning-300 border-warning-200' : ''
              }`}
            >
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
                  {step.titleNote && <span className="text-xs text-warning-600">{step.titleNote}</span>}
                </div>
                <p className="text-sm text-slate-600 mt-1">{step.desc}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-full bg-primary-50 text-primary-700 border border-primary-100 px-2 py-0.5 font-semibold">
                    📅 {formatMonth(step.month)}
                  </span>
                  <span className="rounded-full bg-slate-100 text-slate-500 px-2 py-0.5">{st.label}</span>
                  {step.source && (() => {
                    const sourceUrl = step.source.match(/https?:\/\/[^\s]+/)?.[0]
                    return (
                      <span className="text-slate-400 italic">
                        {sourceUrl ? (
                          <a href={sourceUrl} target="_blank" rel="noreferrer" className="text-primary-600 underline underline-offset-2 hover:text-primary-800">
                            Проверить официальный источник ↗
                          </a>
                        ) : step.source}
                      </span>
                    )
                  })()}
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      {/* Чек-лист документов — только в режиме «документы» */}
      {docsItems && (
        <section className="card p-5 mb-6 border-l-4 border-l-primary-500">
          <h2 className="font-bold text-slate-900">📄 Чек-лист документов под ваши программы</h2>
          <ul className="mt-3 space-y-2">
            {docsItems.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-0.5 h-4 w-4 rounded border border-slate-300 bg-white shrink-0" aria-hidden="true"></span>
                {item.text}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-400 italic">Отметьте пункты в своём трекере — требования уточняйте на страницах программ.</p>
        </section>
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-3 pb-10">
        <Link to="/compare" className="btn-ghost text-sm">← К сравнению</Link>
        <Link to="/next" className="btn-primary">Следующее действие →</Link>
      </div>
    </div>
  )
}

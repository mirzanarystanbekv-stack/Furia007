import { Link } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext.jsx'
import { MAX_SCORE } from '../engine/scoring.js'
import { VerifiedBadge, DemoBadge } from '../components/Badges.jsx'

function ProgramCard({ rec, rank }) {
  const p = rec.program
  return (
    <article className="card p-5 sm:p-6 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-primary-600 uppercase tracking-wide">#{rank}</span>
          <h2 className="font-bold text-slate-900 text-lg leading-snug">{p.university}</h2>
          <p className="text-sm text-slate-600">{p.program} · {p.city}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-extrabold text-primary-700">{Math.round(rec.score)}</div>
          <div className="text-[11px] text-slate-400">из {MAX_SCORE}</div>
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
    </article>
  )
}

export default function Recommendations() {
  const { scored, hasProfile, profile } = useProfile()

  if (!hasProfile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Сначала заполните анкету — рекомендации строятся из вашего профиля.</p>
        <Link to="/profile" className="btn-primary mt-4">Заполнить анкету</Link>
      </div>
    )
  }

  const top = scored.slice(0, 3)

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Ваши рекомендации</h1>
          <p className="text-sm text-slate-500 mt-1">
            Топ-3 из {scored.length} подходящих программ · приоритет: {profile.priority === 'grant' ? 'грант ≫ платное' : 'платное ок'}
          </p>
        </div>
        <Link to="/profile" className="btn-secondary text-xs">Изменить вводные</Link>
      </div>

      <div className="mt-6 space-y-4">
        {top.map((rec, i) => (
          <ProgramCard key={rec.program.id} rec={rec} rank={i + 1} />
        ))}
      </div>

      {scored.length === 0 && (
        <div className="card p-8 text-center mt-6">
          <p className="text-slate-600">Под эти вводные ничего не подошло. Попробуйте расширить бюджет или добавить страну.</p>
          <Link to="/profile" className="btn-primary mt-4">Изменить анкету</Link>
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row justify-between gap-3 pb-10">
        <Link to="/diagnostics" className="btn-ghost text-sm">← Назад к диагностике</Link>
        <Link to="/compare" className="btn-primary">Далее: сравнить варианты →</Link>
      </div>
    </div>
  )
}

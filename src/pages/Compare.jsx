import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useProfile } from '../context/useProfile.js'
import { VerifiedBadge, DemoBadge } from '../components/Badges.jsx'

const ROWS = [
  { key: 'university', label: 'Вуз / программа', render: (p) => `${p.university} — ${p.program}` },
  { key: 'city', label: 'Город / страна', render: (p) => `${p.city}, ${p.country}` },
  { key: 'tuition_display', label: 'Стоимость / год', render: (p) => p.tuition_display },
  { key: 'grant', label: 'Грант', render: (p) => (p.grant ? '✓ возможен' : '—') },
  { key: 'admission_track', label: 'Экзамен / трек', render: (p) => p.admission_track },
  { key: 'language', label: 'Язык обучения', render: (p) => p.language },
  { key: 'ielts_req', label: 'IELTS порог', render: (p) => (p.ielts_required ? `${p.ielts_required}` : 'не указан / демо') },
  { key: 'deadline_label', label: 'Дедлайн', render: (p) => p.deadline_label },
  { key: 'scholarship', label: 'Стипендии', render: (p) => p.scholarship || '—' },
  { key: 'data', label: 'Данные', render: (p) => (p.verified ? 'verified' : 'демо') },
]

export default function Compare() {
  const { scored, hasProfile } = useProfile()
  const [searchParams] = useSearchParams()

  // Внешний выбор из рекомендаций (?ids=a,b) задаёт начальные колонки;
  // дальше пользователь может поменять их селектами из ВСЕХ подходящих программ
  const initial = useMemo(() => {
    const raw = searchParams.get('ids')
    if (!raw) return [0, 1]
    const pool = scored
    const idx = raw.split(',').map((id) => pool.findIndex((r) => r.program.id === id)).filter((i) => i >= 0)
    return idx.length ? idx.slice(0, 2) : [0, 1]
  }, [searchParams, scored])

  const [sel, setSel] = useState(initial)

  if (!hasProfile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Сначала заполните анкету.</p>
        <Link to="/profile" className="btn-primary mt-4">Заполнить анкету</Link>
      </div>
    )
  }

  if (scored.length < 2) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Для сравнения нужно минимум 2 подходящие программы — расширьте вводные в анкете.</p>
        <Link to="/profile" className="btn-primary mt-4">Изменить анкету</Link>
      </div>
    )
  }

  const cols = sel.map((i) => scored[i]).filter(Boolean)

  const setCol = (colIdx, poolIdx) =>
    setSel((prev) => prev.map((v, i) => (i === colIdx ? poolIdx : v)))

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Сравнение вариантов</h1>
      <p className="text-sm text-slate-500 mt-1">Сравните любые программы из ваших рекомендаций — выбор в двух селектах</p>

      {/* Выбор колонок — всегда на экране, тупика без таблицы нет */}
      <div className="mt-5 card p-4 grid gap-3 sm:grid-cols-2">
        {[0, 1].map((colIdx) => (
          <label key={colIdx} className="block">
            <span className="text-xs font-semibold text-slate-500">Колонка {colIdx + 1}</span>
            <select
              className="input mt-1"
              value={sel[colIdx] ?? 0}
              onChange={(e) => setCol(colIdx, Number(e.target.value))}
            >
              {scored.map((r, i) => (
                <option key={r.program.id} value={i}>
                  {r.program.university.split('(')[0].trim()} — {r.program.program} ({Math.round(r.score)})
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {cols.length === 0 ? (
        <div className="mt-6 card p-8 text-center">
          <p className="text-slate-600">Выберите хотя бы одну программу — колонки появятся здесь.</p>
        </div>
      ) : (
        <>
          {/* Таблица сравнения — карточки на мобиле, таблица на десктопе */}
          <div className="mt-6 hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-3 text-xs uppercase tracking-wide text-slate-400 w-44">Параметр</th>
                  {cols.map((rec) => (
                    <th key={rec.program.id} className="text-left p-3">
                      <div className="font-bold text-slate-900">{rec.program.university}</div>
                      <div className="text-xs text-slate-500 font-normal">{rec.program.program}</div>
                      <div className="text-xs text-primary-700 font-bold mt-0.5">{Math.round(rec.score)} баллов</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ROWS.map((row) => (
                  <tr key={row.key} className="align-top">
                    <td className="p-3 text-xs font-semibold text-slate-500">{row.label}</td>
                    {cols.map((rec) => (
                      <td key={rec.program.id} className="p-3 text-slate-800">{row.render(rec.program)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Мобильная версия: карточки попарно */}
          <div className="mt-6 md:hidden space-y-4">
            {ROWS.map((row) => (
              <div key={row.key} className="card p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{row.label}</div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {cols.map((rec) => (
                    <div key={rec.program.id} className="text-sm text-slate-800">
                      <span className="block text-[10px] text-primary-600 font-bold">{rec.program.university.split('(')[0].trim()}</span>
                      {row.render(rec.program)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 card p-4 flex flex-wrap items-center gap-2 bg-slate-50/60">
            {cols.every((rec) => rec.program.verified) ? <VerifiedBadge source={cols[0].program.source} /> : <DemoBadge />}
            <span className="text-xs text-slate-500">Проверяйте актуальные требования на официальных сайтах вузов перед подачей.</span>
          </div>
        </>
      )}

      <div className="mt-8 flex flex-col sm:flex-row justify-between gap-3 pb-10">
        <Link to="/recommendations" className="btn-ghost text-sm">← К рекомендациям</Link>
        <Link to="/roadmap" className="btn-primary">Далее: мой Roadmap →</Link>
      </div>
    </div>
  )
}

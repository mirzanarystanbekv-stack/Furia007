import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useProfile } from '../context/useProfile.js'
import { scorePercent } from '../engine/scoring.js'
import { VerifiedBadge, DemoBadge } from '../components/Badges.jsx'

const BEST_CELL_CLASS = 'bg-primary-50 text-primary-800 font-semibold ring-1 ring-inset ring-primary-100'

function programLabel(program) {
  return `${program.university.split('(')[0].trim()} — ${program.program}`
}

const ROWS = [
  { key: 'university', label: 'Вуз / программа', render: (p) => `${p.university} — ${p.program}` },
  { key: 'score', label: 'Процент совпадения', render: (p) => `${p._matchPercent}%` },
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

function comparableValue(rowKey, program, rec, profile) {
  if (rowKey === 'tuition_display') return typeof program.tuition_usd === 'number' ? -program.tuition_usd : null
  if (rowKey === 'language') return program.language ? (program.language.includes('Английский') ? 1 : 0) : null
  if (rowKey === 'deadline_label') return typeof program.deadline_month === 'number' ? program.deadline_month : null
  if (rowKey === 'score') return scorePercent(rec.score, profile)
  return null
}

function bestIds(rowKey, cols, profile) {
  const values = cols.map((rec) => comparableValue(rowKey, rec.program, rec, profile))
  const available = values.filter((value) => value !== null)
  if (available.length < 2) return new Set()
  const best = Math.max(...available)
  const winners = values.reduce((ids, value, index) => {
    if (value === best) ids.push(cols[index].program.id)
    return ids
  }, [])
  return winners.length === 1 ? new Set(winners) : new Set()
}

function cellProps(rowLabel, rec, best) {
  if (!best.has(rec.program.id)) return {}
  return {
    className: BEST_CELL_CLASS,
    'aria-label': `${rowLabel}: лучшее сопоставимое значение`,
    title: 'Лучшее сопоставимое значение',
  }
}

export default function Compare() {
  const { profile, scored, hasProfile } = useProfile()
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
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="card p-8 text-center sm:p-10">
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">Следующий шаг</span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Сначала соберём ваш маршрут</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">Заполните короткую анкету — тогда здесь появятся программы, которые можно сравнить по стоимости, языку и дедлайнам.</p>
          <Link to="/profile" className="btn-primary mt-6">Заполнить анкету →</Link>
        </div>
      </div>
    )
  }

  if (scored.length < 2) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="card p-8 text-center sm:p-10">
          <span className="rounded-full bg-warning-50 px-3 py-1 text-xs font-semibold text-warning-700">Нужны ещё варианты</span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Пока недостаточно программ для сравнения</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">Измените направление, страну или другие вводные в анкете, чтобы получить как минимум два сопоставимых варианта.</p>
          <Link to="/profile" className="btn-primary mt-6">Изменить анкету →</Link>
        </div>
      </div>
    )
  }

  const cols = sel.map((i) => scored[i]).filter(Boolean).map((rec) => ({
    ...rec,
    program: { ...rec.program, _matchPercent: scorePercent(rec.score, profile) },
  }))
  const sameProgram = cols.length === 2 && cols[0].program.id === cols[1].program.id

  const setCol = (colIdx, poolIdx) =>
    setSel((prev) => prev.map((v, i) => (i === colIdx ? poolIdx : v)))

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">Шаг: сравнение</span>
        <span className="text-xs text-slate-500">Выберите два варианта и найдите разницу</span>
      </div>
      <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">Сравнение вариантов</h1>
      <p className="text-sm text-slate-500 mt-1">Поменяйте программу в любом поле — таблица обновится сразу, без потери вашего маршрута.</p>

      <div id="compare-help" className="mt-5 card border-primary-100 bg-primary-50/40 p-4">
        <p className="text-sm font-semibold text-slate-800">Как читать сравнение</p>
        <p className="mt-1 text-sm text-slate-600">Зелёная подсветка показывает единственное лучшее сопоставимое значение. Равные значения и данные, которых нет, не выделяются.</p>
      </div>

      <div className="mt-4 card p-4 grid gap-3 sm:grid-cols-2">
        {[0, 1].map((colIdx) => {
          const selected = scored[sel[colIdx]]
          const label = selected ? programLabel(selected.program) : 'Программа не выбрана'
          return (
            <label key={colIdx} className="block">
              <span className="text-xs font-semibold text-slate-500">Вариант {colIdx + 1}</span>
              <select
                className="input mt-1"
                value={sel[colIdx] ?? 0}
                title={label}
                aria-label={`Программа для варианта ${colIdx + 1}`}
                aria-describedby="compare-help compare-selection-status"
                onChange={(e) => setCol(colIdx, Number(e.target.value))}
              >
                {scored.map((r, i) => (
                  <option key={r.program.id} value={i}>
                    {programLabel(r.program)} ({Math.round(r.score)})
                  </option>
                ))}
              </select>
              <span className="mt-2 block truncate text-xs text-slate-500" title={label}>{label}</span>
            </label>
          )
        })}
      </div>

      <p id="compare-selection-status" role="status" aria-live="polite" className="mt-3 text-sm text-slate-600">
        {sameProgram
          ? 'Оба варианта сейчас одинаковые — выберите другую программу во втором поле, чтобы увидеть разницу.'
          : `Сравниваются: ${cols.map((rec) => programLabel(rec.program)).join(' · ')}`}
      </p>

      {sameProgram && (
        <p role="alert" className="mt-2 rounded-xl border border-warning-200 bg-warning-50 px-3 py-2 text-sm text-warning-800">
          Для содержательного сравнения выберите разные программы.
        </p>
      )}

      {cols.length === 0 ? (
        <div className="mt-6 card p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">Выберите варианты для сравнения</h2>
          <p className="mt-2 text-sm text-slate-600">Используйте поля выше — здесь появятся стоимость, язык, дедлайн и процент совпадения.</p>
        </div>
      ) : sameProgram ? (
        <div className="mt-6 card border-warning-200 bg-warning-50/40 p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">Сейчас сравнивается одна и та же программа</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">Выберите другой вариант во втором поле — тогда таблица покажет, где отличаются условия и процент совпадения.</p>
        </div>
      ) : (
        <>
          {/* Таблица сравнения — карточки на мобиле, таблица на десктопе */}
          <div className="mt-6 hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th scope="col" className="text-left p-3 text-xs uppercase tracking-wide text-slate-400 w-44">Параметр</th>
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
                {ROWS.map((row) => {
                  const best = bestIds(row.key, cols, profile)
                  return (
                    <tr key={row.key} className="align-top">
                      <th scope="row" className="p-3 text-left text-xs font-semibold text-slate-500">{row.label}</th>
                      {cols.map((rec) => {
                        const props = cellProps(row.label, rec, best)
                        return <td key={rec.program.id} {...props} className={`p-3 text-slate-800 ${props.className ?? ''}`}>{row.render(rec.program)}</td>
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Мобильная версия: карточки попарно */}
          <div className="mt-6 md:hidden space-y-4">
            {ROWS.map((row) => {
              const best = bestIds(row.key, cols, profile)
              return (
                <div key={row.key} className="card p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{row.label}</div>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {cols.map((rec) => {
                      const props = cellProps(row.label, rec, best)
                      return (
                        <div key={rec.program.id} {...props} className={`text-sm text-slate-800 ${props.className ?? ''}`}>
                          <span className="block text-[10px] text-primary-600 font-bold">{rec.program.university.split('(')[0].trim()}</span>
                          {row.render(rec.program)}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
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

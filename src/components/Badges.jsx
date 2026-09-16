// Иконки источников — обязательный флаг из спеки:
// verified данные — иконка источника + ссылка; demo — бейдж «демонстрационные данные».

export function VerifiedBadge({ source }) {
  return (
    <a
      href={source}
      target="_blank"
      rel="noreferrer"
      title={`Источник: ${source}`}
      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      verified
    </a>
  )
}

export function DemoBadge({ text = 'демонстрационные данные' }) {
  return (
    <span
      title="Оценочные данные — перепроверить на сайте вуза перед подачей"
      className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      </svg>
      {text}
    </span>
  )
}

export function ProgressRing({ value, size = 56 }) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  const off = c - (value / 100) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#4f46e5"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-500"
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="fill-primary-700 text-[13px] font-bold">
        {value}%
      </text>
    </svg>
  )
}

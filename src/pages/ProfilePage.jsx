import { Link } from 'react-router-dom'
import { useProfile } from '../context/useProfile.js'
import { GRADES, FIELDS, COUNTRIES, TARGET_LANGUAGES, BUDGETS, PRIORITIES, FEARS } from '../data/options.js'

function Choice({ options, value, onChange, columns = 1 }) {
  const cols = columns >= 3 ? 'sm:grid-cols-3' : columns === 2 ? 'sm:grid-cols-2' : ''
  return (
    <div className={`grid gap-2 ${cols}`}>
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-xl border px-4 py-2.5 text-left text-sm transition-all ${
              active
                ? 'border-primary-500 bg-primary-50 text-primary-800 font-semibold shadow-card'
                : 'border-slate-200 bg-white text-slate-700 hover:border-primary-300 hover:bg-primary-50/40'
            }`}
          >
            <span className="font-semibold">{o.label}</span>
            {o.hint && <span className="block text-xs text-slate-500 font-normal mt-0.5">{o.hint}</span>}
          </button>
        )
      })}
    </div>
  )
}

function Chip({ option, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
        active
          ? 'border-primary-500 bg-primary-600 text-white shadow-card'
          : 'border-slate-200 bg-white text-slate-700 hover:border-primary-300'
      }`}
    >
      {option}
    </button>
  )
}

// Мультевыбор чипами — для направлений (1–3)
function MultiChip({ options, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip
          key={o.value}
          option={o.label}
          active={selected.includes(o.value)}
          onClick={() => onToggle(o.value)}
        />
      ))}
    </div>
  )
}

// Сохраняем промежуточное состояние («4.»), иначе controlled input сразу
// превращает его в 4 и не даёт допечатать десятичную часть.
function normalizeDecimalInput(raw) {
  const value = String(raw).replace(',', '.')
  if (!/^\d*(\.\d*)?$/.test(value)) return null
  return value
}

function commitDecimal(raw, min, max) {
  const value = normalizeDecimalInput(raw)
  if (value === null || value === '') return ''
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  return Math.min(max, Math.max(min, n))
}

export default function ProfilePage() {
  const { profile, updateProfile, toggleCountry, toggleField, loadDemo, resetProfile, hasProfile: filled } = useProfile()
  const completedFields = [
    profile.grade,
    profile.field.length > 0,
    profile.countries.length > 0,
    profile.gpa !== '',
    profile.ielts !== '' || profile.target_lang_level,
    profile.budget,
    profile.priority,
    profile.fear,
  ].filter(Boolean).length
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Анкета абитуриента</h1>
          <p className="text-sm text-slate-500 mt-1">Ответьте на 8 вопросов — подборка и roadmap обновятся автоматически</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={loadDemo} className="btn-secondary text-xs">
            Заполнить демо-профиль
          </button>
          <button type="button" onClick={resetProfile} className="btn-ghost text-xs">
            Сбросить
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-primary-100 bg-primary-50/70 p-4 sm:p-5" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-primary-900">
              {completedFields === 0 ? 'Начните с трёх базовых ответов' : completedFields === 8 ? 'Профиль готов к диагностике' : 'Профиль заполняется'}
            </p>
            <p className="mt-1 text-xs text-primary-700">
              {completedFields === 0 ? 'Выберите класс, направление и хотя бы одну страну — этого достаточно, чтобы начать.' : 'Можно менять ответы в любой момент — рекомендации пересчитаются сами.'}
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-primary-700 shadow-sm">{completedFields}/8</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-primary-500 transition-all duration-500" style={{ width: `${Math.round((completedFields / 8) * 100)}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-primary-700">Автосохранение включено · данные остаются в браузере</p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
        {/* 1. Класс */}
        <section className="card p-5">
          <h2 className="label">1. Класс</h2>
          <Choice options={GRADES} value={profile.grade} onChange={(v) => updateProfile({ grade: v })} columns={3} />
        </section>

        {/* 2. Направление — мультевыбор: сравниваем до 3 интересов параллельно */}
        <section className="card p-5">
          <h2 className="label">2. Направление (можно до 3 — сравните интересы параллельно)</h2>
          <MultiChip
            options={FIELDS}
            selected={profile.field}
            onToggle={toggleField}
          />
        </section>

        {/* 3. Целевые страны */}
        <section className="card p-5">
          <h2 className="label">3. Целевые страны (можно несколько — включит план Б)</h2>
          <div className="flex flex-wrap gap-2">
            {COUNTRIES.map((c) => (
              <Chip key={c.value} option={c.label} active={profile.countries.includes(c.value)} onClick={() => toggleCountry(c.value)} />
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">Каждая страна — отдельный план поступления: движок найдёт варианты по всем выбранным</p>
        </section>

        {/* 4. Академический балл и достижения */}
        <section className="card p-5">
          <h2 className="label">4. Академический балл и достижения</h2>
          <label className="block">
            <span className="text-xs text-slate-500">GPA (0–5)</span>
            <span className="mt-1 block text-[11px] text-slate-400">Например: 4.5 или 4,5</span>
            <input
              type="text" inputMode="decimal"
              className="input mt-1"
              placeholder="например, 4.5 или 4,5"
              value={profile.gpa}
              onChange={(e) => {
                const value = normalizeDecimalInput(e.target.value)
                if (value !== null) updateProfile({ gpa: value })
              }}
              onBlur={(e) => updateProfile({ gpa: commitDecimal(e.target.value, 0, 5) })}
            />
          </label>
          <label className="mt-4 flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              checked={profile.achievements}
              onChange={(e) => updateProfile({ achievements: e.target.checked })}
            />
            <span className="text-sm text-slate-700">Есть олимпиады / грамоты</span>
          </label>
          {profile.achievements && (
            <input
              type="text"
              className="input mt-3"
              placeholder="Какие именно? (например: 2-е место на олимпиаде Дарын)"
              value={profile.achievements_text}
              onChange={(e) => updateProfile({ achievements_text: e.target.value })}
            />
          )}
        </section>

        {/* 5. Языки и баллы */}
        <section className="card p-5">
          <h2 className="label">5. Языки и баллы</h2>
          <label className="block">
            <span className="text-xs text-slate-500">IELTS (0–9, если сдавали)</span>
            <span className="mt-1 block text-[11px] text-slate-400">Можно вводить точку или запятую</span>
            <input
              type="text" inputMode="decimal"
              className="input mt-1"
              placeholder="например, 6.5 или 6,5"
              value={profile.ielts}
              onChange={(e) => {
                const value = normalizeDecimalInput(e.target.value)
                if (value !== null) updateProfile({ ielts: value })
              }}
              onBlur={(e) => updateProfile({ ielts: commitDecimal(e.target.value, 0, 9) })}
            />
          </label>
          <div className="mt-4">
            <span className="text-xs text-slate-500">Уровень целевого языка</span>
            <Choice options={TARGET_LANGUAGES} value={profile.target_lang_level} onChange={(v) => updateProfile({ target_lang_level: v })} columns={2} />
          </div>
        </section>

        {/* 6. Бюджет */}
        <section className="card p-5">
          <h2 className="label">6. Бюджет на обучение</h2>
          <Choice options={BUDGETS} value={profile.budget} onChange={(v) => updateProfile({ budget: v })} columns={3} />
        </section>

        {/* 7. Приоритет */}
        <section className="card p-5">
          <h2 className="label">7. Приоритет</h2>
          <Choice options={PRIORITIES} value={profile.priority} onChange={(v) => updateProfile({ priority: v })} columns={2} />
        </section>

        {/* 8. Главный страх / фокус */}
        <section className="card p-5">
          <h2 className="label">8. Что больше всего беспокоит?</h2>
          <p className="text-xs text-slate-500 mb-3">Меняет акцент сервиса: напоминания, объяснения или чек-лист документов</p>
          <Choice options={FEARS} value={profile.fear} onChange={(v) => updateProfile({ fear: v })} />
        </section>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-16">
          <span className={`text-sm ${filled ? 'text-primary-600' : 'text-slate-400'}`}>
            {filled ? '✓ Профиль заполнен — можно смотреть диагностику' : 'Заполните класс, направление и хотя бы одну страну'}
          </span>
          {filled ? (
            <Link to="/diagnostics" className="btn-primary">
              Далее: Диагностика →
            </Link>
          ) : (
            <span
              className="btn-primary cursor-not-allowed opacity-50"
              aria-disabled="true"
              title="Заполните класс, направление и хотя бы одну страну"
            >
              Далее: Диагностика →
            </span>
          )}
        </div>
      </form>
    </div>
  )
}

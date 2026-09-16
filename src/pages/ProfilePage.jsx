import { Link } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext.jsx'
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

export default function ProfilePage() {
  const { profile, updateProfile, toggleCountry, loadDemo, resetProfile, hasProfile } = useProfile()
  const filled = hasProfile

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Анкета абитуриента</h1>
          <p className="text-sm text-slate-500 mt-1">8 полей · сохраняется автоматически · рекомендации пересчитываются на лету</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={loadDemo} className="btn-secondary text-xs">
            Демо-профиль Алихана
          </button>
          <button type="button" onClick={resetProfile} className="btn-ghost text-xs">
            Сбросить
          </button>
        </div>
      </div>

      <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
        {/* 1. Класс */}
        <section className="card p-5">
          <h2 className="label">1. Класс</h2>
          <Choice options={GRADES} value={profile.grade} onChange={(v) => updateProfile({ grade: v })} columns={3} />
        </section>

        {/* 2. Направление */}
        <section className="card p-5">
          <h2 className="label">2. Направление</h2>
          <Choice options={FIELDS} value={profile.field} onChange={(v) => updateProfile({ field: v })} />
        </section>

        {/* 3. Целевые страны */}
        <section className="card p-5">
          <h2 className="label">3. Целевые страны (можно несколько — включит план Б)</h2>
          <div className="flex flex-wrap gap-2">
            {COUNTRIES.map((c) => (
              <Chip key={c.value} option={c.label} active={profile.countries.includes(c.value)} onClick={() => toggleCountry(c.value)} />
            ))}
          </div>
        </section>

        {/* 4. Академический балл и достижения */}
        <section className="card p-5">
          <h2 className="label">4. Академический балл и достижения</h2>
          <label className="block">
            <span className="text-xs text-slate-500">GPA (0–5)</span>
            <input
              type="number" min="0" max="5" step="0.01"
              className="input mt-1"
              placeholder="например, 4.85"
              value={profile.gpa}
              onChange={(e) => updateProfile({ gpa: e.target.value === '' ? '' : Number(e.target.value) })}
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
            <input
              type="number" min="0" max="9" step="0.5"
              className="input mt-1"
              placeholder="например, 6.0"
              value={profile.ielts}
              onChange={(e) => updateProfile({ ielts: e.target.value === '' ? '' : Number(e.target.value) })}
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
          <span className={`text-sm ${filled ? 'text-emerald-600' : 'text-slate-400'}`}>
            {filled ? '✓ Профиль заполнен — можно смотреть диагностику' : 'Заполните класс, направление и хотя бы одну страну'}
          </span>
          <Link to="/diagnostics" className={`btn-primary ${filled ? '' : 'opacity-50 pointer-events-none'}`}>
            Далее: Диагностика →
          </Link>
        </div>
      </form>
    </div>
  )
}

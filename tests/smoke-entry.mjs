// Смоук-тест движка: запускается через esbuild bundle:
// npx esbuild tests/smoke-entry.mjs --bundle --format=esm --outfile=tests/.smoke.mjs && node tests/.smoke.mjs
import { scoreAllPrograms, diagnose } from '../src/engine/scoring.js'
import { buildRoadmap, getNextAction } from '../src/engine/roadmap.js'

const profile = {
  grade: 11, field: 'it', countries: ['Турция', 'Казахстан'], gpa: 4.85,
  achievements: true, achievements_text: 'Дарын 2-е место', ielts: 6.0,
  target_lang_level: 'A2', budget: 'mid', priority: 'grant', fear: 'deadlines',
}

const assert = (cond, msg) => {
  if (!cond) {
    console.error('FAIL:', msg)
    process.exitCode = 1
  } else {
    console.log('PASS:', msg)
  }
}

// 1. Базовый профиль: минимум 3 рекомендации
const scored = scoreAllPrograms(profile)
assert(scored.length >= 3, `демо-профиль даёт ${scored.length} программ (нужно >=3)`)
assert(scored[0].score > 0 && scored[0].reasons.length > 0, 'у топ-программы есть скор и причины')

// 2. Реактивность: смена вводных меняет баллы и причины. Контрастная программа —
//    Sakarya ($2500): проходит средний бюджет (~$3000), но не низкий (~$1500)
const poor = { ...profile, budget: 'low', gpa: 2.5, achievements: false, ielts: 0, countries: ['Турция'] }
const scoredPoor = scoreAllPrograms(poor)
const sakaRich = scored.find((r) => r.program.id === 'sakarya-ceng')
const sakaPoor = scoredPoor.find((r) => r.program.id === 'sakarya-ceng')
assert(Boolean(sakaRich && sakaPoor), 'Sakarya присутствует в обоих профилях')
assert(sakaRich.reasons.some((x) => x.points === 15 && x.reason.includes('Бюджет')),
  'средний бюджет: Sakarya получает +15 за бюджет')
assert(sakaPoor.reasons.some((x) => x.points === 0 && x.reason.includes('Бюджет')) && sakaPoor.score !== sakaRich.score,
  `низкий бюджет: Sakarya теряет бюджетные баллы (скор ${sakaRich.score} → ${sakaPoor.score})`)
const metuPoor = scoredPoor.find((r) => r.program.id === 'metu-ceng')
assert(metuPoor && !metuPoor.reasons.some((x) => x.reason.includes('олимпиады')),
  'без достижений исчезает бонус +5 в причинах')

// 3. Приоритет «платное ок» поднимает платные программы
const paid = scoreAllPrograms({ ...profile, priority: 'paid-ok' })
assert(JSON.stringify(paid.slice(0, 3).map((r) => r.program.id)) !== JSON.stringify(scored.slice(0, 3).map((r) => r.program.id)),
  'приоритет грант/платное меняет порядок топ-3')

// 4. Roadmap: шаги строятся, есть next action
const steps = buildRoadmap(profile, scored)
assert(steps.length >= 5, `roadmap содержит ${steps.length} шагов (нужно >=5)`)
assert(steps.every((s, i) => i === 0 || steps[i - 1].month <= s.month), 'шаги отсортированы по датам')
assert(Boolean(getNextAction(steps, []).title), 'next action определён')
const withDone = getNextAction(steps, [steps[0].id])
assert(withDone && withDone.id !== steps[0].id, 'отмеченный шаг пропускается в next action')

// 5. Диагностика: сильные стороны и демо-флаг GPA
const d = diagnose(profile)
assert(d.strengths.length >= 2 && d.highGpaGrantFlag === true, 'диагностика: сильные стороны + демо-флаг GPA>4.5')
const d2 = diagnose({ ...profile, gpa: 3.0, ielts: 0 })
assert(d2.risks.length >= 2, 'слабый профиль получает риски')

console.log('')
console.log('Итог: смоук-тест завершён, exit code =', process.exitCode ?? 0)

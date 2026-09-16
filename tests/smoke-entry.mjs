// Смоук-тест движка: запускается через esbuild bundle:
// npx esbuild tests/smoke-entry.mjs --bundle --format=esm --outfile=tests/.smoke.mjs && node tests/.smoke.mjs
import { scoreAllPrograms, diagnose } from '../src/engine/scoring.js'
import { buildRoadmap, getNextAction, getFearAccent, buildDocsChecklist } from '../src/engine/roadmap.js'

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

// 6. ГРАНИЦЫ: пустой профиль не должен ронять движок
const empty = {}
const scoredEmpty = scoreAllPrograms(empty)
assert(Array.isArray(scoredEmpty), `пустой профиль: скоринг не падает (${scoredEmpty.length} программ)`)
const stepsEmpty = buildRoadmap(empty, scoredEmpty)
assert(Array.isArray(stepsEmpty) && stepsEmpty.length >= 1, `пустой профиль: roadmap не падает (${stepsEmpty.length} шагов)`)
const dEmpty = diagnose(empty)
assert(Array.isArray(dEmpty.strengths) && Array.isArray(dEmpty.risks), 'пустой профиль: диагностика не падает, GPA трактуется как 0')

// 7. ГРАНИЦЫ: мусор вместо GPA и IELTS — пустой GPA это «нет данных», а не «низкий балл»
const dGarbage = diagnose({ ...profile, gpa: '', ielts: '' })
assert(dGarbage.highGpaGrantFlag === false && dGarbage.risks.some((r) => r.title.includes('Укажите свой балл')),
  "GPA '' трактуется как отсутствие данных с честной подсказкой, не как «низкая успеваемость»")

// 8. Языковой разрыв: IELTS 0 → шаг Hazırlık появляется в roadmap (требование спеки)
const langGap = { ...profile, ielts: 0, countries: ['Турция'] }
const scoredGap = scoreAllPrograms(langGap)
const stepsGap = buildRoadmap(langGap, scoredGap)
assert(stepsGap.some((s) => s.id === 'prep-year'), 'IELTS ниже порога → roadmap содержит шаг Hazırlık (+1 год)')

// 9. getNextAction игнорирует протухшие id
const ghostDone = [steps[0].id, 'ghost-1', 'ghost-2']
assert(getNextAction(steps, ghostDone).id === steps[1].id, 'next action пропускает и валидные, и несуществующие done-id')

// 10. Уровень целевого языка (CEFR) участвует в логике: B2 без сертификата закрывает
//     порог ≤6.0, A2 — нет; скор, причины и Hazırlık реагируют
const bo = (list) => list.find((r) => r.program.id === 'bogazici-ceng')
const noCertA2 = { ...profile, ielts: 0, target_lang_level: 'A2' }
const noCertB2 = { ...profile, ielts: 0, target_lang_level: 'B2' }
const boA2 = bo(scoreAllPrograms(noCertA2))
const boB2 = bo(scoreAllPrograms(noCertB2))
assert(Boolean(boA2 && boB2), 'Boğaziçi присутствует в обоих языковых профилях')
assert(boB2.score > boA2.score, `уровень B2 поднимает скор Boğaziçi (${boA2.score} → ${boB2.score})`)
assert(boB2.reasons.some((x) => x.reason.includes('самооценке')), 'причина B2 объясняет закрытие порога самооценкой')
assert(!buildRoadmap(noCertB2, scoreAllPrograms(noCertB2)).some((s) => s.id === 'prep-year'),
  'B2 без сертификата: Hazırlık не появляется')
assert(buildRoadmap(noCertA2, scoreAllPrograms(noCertA2)).some((s) => s.id === 'prep-year'),
  'A2 без сертификата: Hazırlık появляется')

// 11. Режимы «главного страха» переупорядочивают roadmap
const stepsFear = buildRoadmap(profile, scored)
const firstKind = (order) => [...stepsFear].sort(order)[0].kind
const dl = getFearAccent('deadlines')
const ch = getFearAccent('choice')
const dc = getFearAccent('documents')
assert(typeof dl.order === 'function' && typeof ch.order === 'function' && typeof dc.order === 'function',
  'все три страха дают режим сортировки')
assert(firstKind(dl.order) === 'deadline', 'режим дедлайнов: заявка поднята первой')
assert(firstKind(ch.order) === 'exam', 'режим выбора: экзамен первый')
assert(firstKind(dc.order) === 'docs', 'режим документов: документы первые')
assert(getFearAccent(null).order === null, 'без страха — нейтральный порядок (даты)')
assert(buildDocsChecklist(scored).length === 8, `чек-лист документов: 5 базовых + топ-3 программы (${buildDocsChecklist(scored).length})`)

console.log('')
console.log('Итог: смоук-тест завершён, exit code =', process.exitCode ?? 0)

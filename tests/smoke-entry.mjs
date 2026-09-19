// Смоук-тест движка: запускается через esbuild bundle:
// npx esbuild tests/smoke-entry.mjs --bundle --format=esm --outfile=tests/.smoke.mjs && node tests/.smoke.mjs
import { buildPortfolioActions, scoreAllPrograms, scorePercent, diagnose, estimateChance, programScholarships, PROGRAMS, SCORING_RULES } from '../src/engine/scoring.js'
import { buildRoadmap, buildRoadmapCalendar, getNextAction } from '../src/engine/roadmap.js'
import { getFearAccent, buildDocsChecklist } from '../src/data/fearModes.js'
import { FIELDS, COUNTRIES, SCHOLARSHIPS } from '../src/data/options.js'
import { buildGroundedExplanation, buildRecommendationBrief, filterByNaturalQuery, parseNaturalQuery, requestGroundedExplanation } from '../src/engine/aiAssist.js'

const profile = {
  grade: 11, field: ['it'], countries: ['Турция', 'Казахстан'], gpa: 4.85,
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
assert(SCORING_RULES.map((rule) => rule.points).join(',') === '30,25,20,15,10,5,5', 'интерфейсная формула скоринга совпадает с текущей моделью')
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

// 3. Приоритет «платное ок» меняет поведение: буст-причина исчезает у грантовых,
//    порядок топ-3 реагирует
const paid = scoreAllPrograms({ ...profile, priority: 'paid-ok' })
const grantTop = scored.slice(0, 3)
assert(grantTop.some((r) => r.reasons.some((x) => x.isBoost)) && !paid.slice(0, 3).some((r) => r.reasons.some((x) => x.isBoost)),
  'буст-причины приоритета «грант» появляются/исчезают при переключении приоритета')
// Скор бесплатной грантовой при «гранте» ровно 1.15× от «платное ок»; у платной
// «грантовой» (KBTU, $4k) скоры равны — буст её не касается
const metuG = scored.find((r) => r.program.id === 'metu-ceng').score
const metuP = paid.find((r) => r.program.id === 'metu-ceng').score
assert(Math.abs(metuG - metuP * 1.15) < 1e-9, `скор METU при «гранте» = 1.15× от «платное ок» (${metuG.toFixed(1)} vs ${metuP.toFixed(1)})`)
const kbtuG = scored.find((r) => r.program.id === 'kbtu-it').score
const kbtuP = paid.find((r) => r.program.id === 'kbtu-it').score
assert(Math.abs(kbtuG - kbtuP) < 1e-9, 'платная «грантовая» (KBTU $4k) имеет одинаковый скор при обоих приоритетах')

// 4. Roadmap: шаги строятся, есть next action
const steps = buildRoadmap(profile, scored)
assert(steps.length >= 5, `roadmap содержит ${steps.length} шагов (нужно >=5)`)
assert(steps.every((s, i) => i === 0 || steps[i - 1].month <= s.month), 'шаги отсортированы по датам')
const calendar = buildRoadmapCalendar(steps)
assert(calendar.startsWith('BEGIN:VCALENDAR') && calendar.includes('BEGIN:VEVENT') && calendar.includes('DTSTART;VALUE=DATE:'),
  'roadmap экспортируется в календарь с событиями')
assert(calendar.includes('точную дату проверьте'), 'календарь честно помечает месячные ориентиры')
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

// 12. Мультивыбор направлений: программы обоих интересов получают баллы
const dual = { ...profile, field: ['it', 'economics'] }
const dualScored = scoreAllPrograms(dual)
const metuD = dualScored.find((r) => r.program.id === 'metu-ceng')
const hseD = dualScored.find((r) => r.program.id === 'hse-econ')
assert(Boolean(metuD && hseD && metuD.score > 0 && hseD.score > 0),
  'мультивыбор [it, economics]: программы обоих направлений получают баллы')

// 14. REGRESSION: +30 направления при массиве И при легаси-строке (миграция field)
//     До фикса массив давал 77 вместо 107 — главное слагаемое молча исчезало
const arrProfile = { ...profile, field: ['it'] }
const strProfile = { ...profile, field: 'it' } // легаси-форма из старых сессий
const metuArr = scoreAllPrograms(arrProfile).find((r) => r.program.id === 'metu-ceng')
const metuStr = scoreAllPrograms(strProfile).find((r) => r.program.id === 'metu-ceng')
assert(metuArr.reasons.some((x) => x.points === 30), 'массив field: программа интереса получает +30')
assert(metuStr.reasons.some((x) => x.points === 30), 'легаси-строка field: +30 сохраняется (единый порядок)')
assert(Math.abs(metuArr.score - metuStr.score) < 1e-9, `скор массива и строки совпадает (${metuArr.score.toFixed(1)} vs ${metuStr.score.toFixed(1)})`)

// 15. REGRESSION: приоритет «грант» бустит только безусловно бесплатные (tuition 0)
//     Асu-программы с merit-scholarship ($18k+) не должны подниматься грант-бустом
const grantPrio = { ...profile, field: ['engineering'], priority: 'grant' }
const boosted = scoreAllPrograms(grantPrio).find((r) => r.program.id === 'rwth-mech') // tuition 400, грант
const asu = scoreAllPrograms(grantPrio).find((r) => r.program.id === 'asu-cs') // tuition 18000, "грант"
assert(Boolean(boosted) && boosted.reasons.some((x) => x.isBoost), 'бесплатная грантовая (RWTH) получает грант-буст')
assert(Boolean(asu) && !asu.reasons.some((x) => x.isBoost), 'платная "грантовая" (ASU, $18k) грант-буст не получает')

// 16. Честный бюджет: «грант покрывает» только при реальном нуле; иначе — цена + грант-хинт
const asuMid = scoreAllPrograms({ ...profile, field: ['it'], budget: 'mid', priority: 'paid-ok' }).find((r) => r.program.id === 'asu-cs')
assert(asuMid.reasons.some((x) => x.points === 0 && x.reason.includes('дорого')), 'ASU при среднем бюджете честно помечен «дорого»')
const metuMid = scoreAllPrograms({ ...profile, field: ['it'], budget: 'mid', priority: 'grant' }).find((r) => r.program.id === 'metu-ceng')
assert(metuMid.reasons.some((x) => x.points === 15 && x.reason.includes('грант покрывает')), 'METU (tuition 0): «грант покрывает обучение»')

// 17. Кросс-страновая семантика: выбранные страны всегда раньше альтернатив.
//     До фикса METU (Турция, грант-буст) была #1 для профиля Польша+Венгрия
const plHu = { grade: 11, field: ['medicine'], countries: ['Польша', 'Венгрия'], gpa: 4.8, achievements: false, achievements_text: '', ielts: '', target_lang_level: 'B2', budget: 'low', priority: 'grant', fear: null }
const plHuScored = scoreAllPrograms(plHu)
assert(plHuScored[0].program.country === 'Польша' || plHuScored[0].program.country === 'Венгрия',
  `топ-рекомендация из выбранной страны (${plHuScored[0].program.country}, ${plHuScored[0].program.id})`)
const firstOutside = plHuScored.findIndex((r) => r.outsideChoice)
assert(firstOutside >= 3, `все выбранные программы раньше альтернатив (первая альтернатива: позиция ${firstOutside + 1})`)
assert(plHuScored.every((r) => (r.outsideChoice ? !plHu.countries.includes(r.program.country) : plHu.countries.includes(r.program.country))),
  'outsideChoice размечен ровно у невыбранных стран')
const alt = plHuScored.find((r) => r.outsideChoice)
assert(!alt.reasons.some((x) => x.points === 25), 'альтернатива не получает +25 страны')

// 18. Малая страна (ОАЭ = 2 программы): спека требует минимум 3 рекомендации —
//     добор альтернативами с пометкой
const uae = { ...plHu, field: ['engineering'], countries: ['ОАЭ'] }
const uaeScored = scoreAllPrograms(uae)
const uaeChosen = uaeScored.filter((r) => !r.outsideChoice)
assert(uaeScored.length >= 3, `малая страна: ${uaeScored.length} рекомендаций (нужно >=3)`)
assert(uaeChosen.length >= 10, `ОАЭ: все реальные программы страны в выбранном пуле (${uaeChosen.length})`)
assert(uaeScored.slice(uaeChosen.length).every((r) => r.outsideChoice), 'добор после выбранных помечен как альтернатива')

// 19. Roadmap: заявки только в выбранные страны — план 9-классника Казахстана
//     без «Подать заявку: METU»
const stepsPlHu = buildRoadmap(plHu, plHuScored)
const applySteps = stepsPlHu.filter((s) => s.id.startsWith('apply-'))
assert(applySteps.length > 0 && applySteps.every((s) => {
  const target = plHuScored.find((r) => `apply-${r.program.id}` === s.id)
  return target && !target.outsideChoice
}), 'все заявки roadmap — в выбранные страны')
assert(!applySteps.some((s) => s.id === 'apply-metu-ceng'), 'METU из невыбранной Турции не в плане заявок')

// 13. Целостность датасета: каждая страна и направление из анкеты представлены
const fieldsCovered = new Set(PROGRAMS.map((p) => p.field))
const countriesCovered = new Set(PROGRAMS.map((p) => p.country))
assert(FIELDS.every((f) => fieldsCovered.has(f.value)), 'каждое направление из анкеты есть в базе программ')
assert(COUNTRIES.every((c) => countriesCovered.has(c.value)), 'каждая страна из анкеты есть в базе программ')
const ids = PROGRAMS.map((p) => p.id)
assert(new Set(ids).size === ids.length, 'id программ уникальны')
assert(PROGRAMS.every((p) => (typeof p.tuition_usd === 'number' || p.tuition_usd === null) && (typeof p.deadline_month === 'number' || p.deadline_month === null)),
  'у всех программ есть числовые или честно неизвестные tuition_usd и deadline_month')
for (const country of COUNTRIES.map((c) => c.value)) {
  const universities = new Set(PROGRAMS.filter((p) => p.country === country).map((p) => p.university))
  assert(universities.size >= 10, `${country}: в каталоге минимум 10 реальных вузов (${universities.size})`)
}
const newFields = ['dentistry', 'pharmacy', 'business', 'data-science', 'cybersecurity', 'architecture', 'psychology', 'pedagogy', 'international-relations']
assert(newFields.every((field) => PROGRAMS.some((p) => p.field === field)), 'жизненные направления представлены в каталоге')
assert(PROGRAMS.filter((p) => p.verified).every((p) => typeof p.source === 'string' && p.source.startsWith('https://')),
  'каждая verified-программа имеет официальный source URL')

// 20. Оценка шансов (§8): top-3 → проценты от базового порога, уровни и вердикт
const chance = estimateChance(scored, profile)
assert(chance.top.length === 3, `шансы считаются по топ-3 (получено ${chance.top.length})`)
assert(chance.top.every((t) => t.percent > 0 && t.percent <= 100), `проценты в диапазоне (1..100): ${chance.top.map((t) => t.percent).join('/')}`)
assert(Math.round(chance.top.reduce((s, x) => s + x.percent, 0) / 3) === chance.avg, 'avg — среднее процентов топ-3')
assert(['высокие', 'хорошие', 'средние', 'требуют усиления'].includes(chance.level), `уровень из шкалы (${chance.level})`)
assert(chance.verdict.length > 10 && ['высокие', 'хорошие', 'средние', 'требуют усиления'].some((l) => chance.level === l), 'вердикт непустой для уровня')
assert(chance.reasons.length >= 3 && chance.reasons.every((reason) => typeof reason === 'string'), 'оценка шансов объясняет причины человеческим языком')
const demoPercentages = scored.slice(0, 8).map((item) => scorePercent(item.score, profile))
assert(demoPercentages.every((percent) => percent >= 0 && percent <= 100), `процент совпадения в диапазоне 0..100: ${demoPercentages.join('/')}`)
assert(new Set(demoPercentages).size > 1 && !demoPercentages.every((percent) => percent === 99), `проценты различают программы, а не фиксированы на 99: ${demoPercentages.join('/')}`)
const strongestMatch = scored.find((item) => item.program.id === 'metu-ceng')
assert(scorePercent(strongestMatch.score, profile) === 100, 'максимально совпадающая программа получает 100%, а не искусственные 99%')
const languageSensitive = scored.find((item) => item.program.id === 'bogazici-ceng')
const weakerLanguageProfile = { ...profile, ielts: 0, achievements: false, gpa: 3.5 }
const weakerLanguage = scoreAllPrograms(weakerLanguageProfile).find((item) => item.program.id === 'bogazici-ceng')
assert(scorePercent(languageSensitive.score, profile) > scorePercent(weakerLanguage.score, weakerLanguageProfile), 'процент одной программы меняется от IELTS, достижений и GPA профиля')
assert(buildPortfolioActions(profile).length >= 2 && buildPortfolioActions(profile).every((action) => action.title && action.text), 'портфолио предлагает конкретные действия под направление')
const weakProfile = { ...poor, field: ['it'], countries: ['ОАЭ'], budget: 'low', ielts: 0, target_lang_level: '' }
const weakChance = estimateChance(scoreAllPrograms(weakProfile), weakProfile)
assert(weakChance.avg < chance.avg, `слабый профиль даёт ниже проценты (${weakChance.avg} < ${chance.avg})`)

// 21. Стипендии (§8): распознавание именных грантов в scholarship-поле
const metuSch = programScholarships(PROGRAMS.find((p) => p.id === 'metu-ceng'))
assert(metuSch.includes('turkiye'), `METU распознаёт Türkiye Bursları (${metuSch.join(',')})`)
const debrecen = PROGRAMS.find((p) => (p.scholarship || '').includes('Stipendium Hungaricum'))
assert(debrecen && programScholarships(debrecen).includes('hungaricum'), 'Stipendium Hungaricum распознаётся')
const gksCount = PROGRAMS.filter((p) => programScholarships(p).includes('gks')).length
assert(gksCount >= 2, `GKS-программ ≥2 (${gksCount})`)
assert(SCHOLARSHIPS.every((s) => PROGRAMS.some((p) => (p.scholarship || '').includes(s.match))),
  'каждый грант из списка реально встречается в датасете (нет мёртвых фильтров)')

// 22. Естественный поиск: локально извлекает направление, регион, язык, бюджет и грант
const europeMedicine = parseNaturalQuery('медицина на английском в Европе с грантом до $3000')
assert(europeMedicine.fields.includes('medicine') && europeMedicine.countries.includes('Германия') && europeMedicine.languages.includes('Английский'),
  'естественный запрос распознаёт направление, регион и язык')
assert(europeMedicine.grantOnly === true && europeMedicine.maxCost === 3000, 'естественный запрос распознаёт грант и бюджет')
const europeMatches = filterByNaturalQuery(scoreAllPrograms(profile), europeMedicine)
assert(europeMatches.every((r) => ['Германия', 'Венгрия', 'Польша'].includes(r.program.country) && r.program.field === 'medicine'),
  'локальный поиск показывает только записи из найденного пула')
const dubaiCyber = parseNaturalQuery('cybersecurity в Дубае under $2000')
assert(dubaiCyber.fields.includes('cybersecurity') && dubaiCyber.countries.includes('ОАЭ') && dubaiCyber.maxCost === 2000,
  'естественный запрос понимает английские ключевые слова и город')

// 23. Объяснение grounded: только существующие reasons/status/source, без придуманных фактов
const grounded = buildGroundedExplanation(scored[0])
assert(grounded.text.includes(scored[0].reasons[0].reason) && !grounded.text.includes('99999'),
  'fallback-объяснение использует только причины скоринга и не придумывает цифры')
const fallbackExplanation = await requestGroundedExplanation({ recommendation: scored[0], profile, endpoint: '' })
assert(fallbackExplanation.mode === 'rule-based' && fallbackExplanation.text === grounded.text,
  'при отсутствии AI endpoint используется честный rule-based fallback')
const rejectedAi = await requestGroundedExplanation({
  recommendation: scored[0],
  profile,
  endpoint: '/api/ai',
  fetchImpl: async () => ({ ok: true, json: async () => ({ reasonIndexes: [999] }) }),
})
assert(rejectedAi.mode === 'rule-based' && rejectedAi.text === grounded.text,
  'AI-ответ с недопустимыми reason indexes отклоняется без выдуманных полей')
const brief = buildRecommendationBrief(scored)
const firstBriefUniversity = brief.items[0].title.slice(3).split(' — ')[0]
assert(brief.items.length === 3 && brief.text.includes(firstBriefUniversity),
  'AI-рекомендация пишет связный ответ по топ-3 вузам')
assert(brief.items.every((item) => item.text.includes('проверить') || item.text.includes('источник')),
  'текст AI-рекомендации содержит честный статус источника без выдуманных фактов')
const singleBrief = buildRecommendationBrief([scored[0]])
assert(singleBrief.text.includes('единственный вариант') && !singleBrief.text.includes('ещё 0'),
  'AI-рекомендация корректно описывает выдачу из одного варианта')

console.log('')
console.log('Итог: смоук-тест завершён, exit code =', process.exitCode ?? 0)

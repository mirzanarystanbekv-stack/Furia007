// Rule-based скоринг программ — формула из спецификации кейса №2:
// +30 направление, +25 страна, +20 язык, +15 бюджет, +10 дедлайн впереди,
// +5 достижения (грантовые); множители: класс (9/10/11) и грант-буст 1.15
// для бесплатных программ при priority="grant". Порядок выдачи: программы
// выбранных стран всегда раньше альтернатив из других. Каждая причина
// хранится как {reason, points} — текст «почему подходит» строится из них.

import programsData from '../data/universities.json'
import expandedProgramsData from '../data/universities-expanded.json'
import { SCHOLARSHIPS } from '../data/options.js'

export const PROGRAMS = [...programsData.programs, ...expandedProgramsData.programs]

export const MAX_BASE_SCORE = 30 + 25 + 20 + 15 + 10 // 100 — базовый порог без бонуса за достижения;
// реальные скоры выше из-за множителей (грант-буст, класс)

export const SCORING_RULES = [
  { label: 'Направление совпадает', points: 30 },
  { label: 'Целевая страна', points: 25 },
  { label: 'Язык соответствует порогу', points: 20 },
  { label: 'Бюджет укладывается', points: 15 },
  { label: 'Дедлайн впереди', points: 10 },
  { label: 'Достижения для грантовой программы', points: 5 },
]

const GRANT_MULTIPLIER = 1.15
const CREDIT_YEAR_MULTIPLIERS = { 9: 1.0, 10: 1.05, 11: 1.1 }

export function getNow() {
  return new Date()
}

function monthDiff(from, to) {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
}

const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1']

// Форма интереса — массив (мультивыбор из анкеты). Легаси-профили из старых
// сессий хранят строку — нормализуем в одном месте
function fieldList(profile) {
  if (Array.isArray(profile?.field)) return profile.field
  return profile?.field ? [profile.field] : []
}

// Самооценка уровня целевого языка из анкеты (поле 5): A1=1 … C1=5, не выбран = 0.
// Уверенным считаем B1 и выше: тогда самооценка может закрыть языковой порог ≤6.0,
// ниже — ненадёжна и на логику не влияет.
function selfAssessmentLevel(profile) {
  const i = CEFR_ORDER.indexOf(profile?.target_lang_level)
  return i === -1 ? 0 : i + 1
}

// Языковое соответствие программе: сертификат — прямое доказательство;
// если сертификата нет, уверенная самооценка B1+ закрывает пороги до 6.0 включительно
function languageMatches(program, profile) {
  const needIelts = typeof program.ielts_required === 'number'
  if (!needIelts) return true
  if ((Number(profile?.ielts) || 0) >= program.ielts_required) return true
  return selfAssessmentLevel(profile) >= 3 && program.ielts_required <= 6.0
}

export function needsPrepYear(program, profile) {
  return !languageMatches(program, profile)
}

function assessBudget(program, profile) {
  const tuition = program.tuition_usd
  const fmt = (n) => n.toLocaleString('ru-RU')
  const grantHint = program.grant ? ' — грант может покрыть, проверьте условия конкурса' : ''
  if (tuition === null || typeof tuition !== 'number') {
    return { fits: false, note: 'стоимость не подтверждена — уточните на официальном сайте' }
  }
  // Бесплатное (грантовое) обучение — честный ноль в данных; формулировка
  // «грант покрывает» как факт — только для verified-программ
  if (tuition === 0) {
    if (!program.grant) return { fits: true, note: 'обучение бесплатное' }
    return {
      fits: true,
      note: program.verified ? 'грант покрывает обучение' : 'грант может покрывать обучение (демо-данные — проверьте условия конкурса)',
    }
  }
  if (profile.budget === 'high') return { fits: true, note: 'бюджет позволяет платное обучение' }
  if (profile.budget === 'mid') {
    if (tuition <= 3000) return { fits: true, note: 'стоимость в рамках среднего бюджета (~$3 000/год)' }
    return { fits: false, note: `дорого для среднего бюджета (≈$${fmt(tuition)}/год)${grantHint}` }
  }
  if (tuition <= 1500) return { fits: true, note: 'стоимость в рамках низкого бюджета (~$1 500/год)' }
  return { fits: false, note: `дорого для низкого бюджета (≈$${fmt(tuition)}/год)${grantHint}` }
}

function scoreProgram(program, profile) {
  const reasons = []
  let score = 0

  // +30 направление (любой из выбранных интересов, мультивыбор до 3)
  if (fieldList(profile).includes(program.field)) {
    score += 30
    reasons.push({ reason: 'Направление совпадает с вашим интересом', points: 30 })
  }

  // +25 страна
  if (profile.countries?.includes(program.country)) {
    score += 25
    reasons.push({ reason: `${program.country} — в списке ваших целевых стран`, points: 25 })
  }

  // +20 язык (или шаг Hazırlık, если не соответствует).
  // Причина различает, чем закрыт порог: сертификатом или самооценкой уровня из анкеты
  const needIelts = typeof program.ielts_required === 'number'
  const certOk = (Number(profile?.ielts) || 0) >= (program.ielts_required ?? 0)
  const selfLevel = selfAssessmentLevel(profile)
  if (languageMatches(program, profile)) {
    score += 20
    if (needIelts && certOk) {
      reasons.push({ reason: `Сертификат IELTS ${profile.ielts} закрывает порог программы (${program.ielts_required})`, points: 20 })
    } else if (needIelts) {
      reasons.push({ reason: `Уровень ${profile.target_lang_level} по самооценке засчитывает порог программы (сертификат всё равно спросят при подаче)`, points: 20 })
    } else {
      reasons.push({ reason: 'Языковой порог программы выполняется', points: 20 })
    }
  } else {
    reasons.push({
      reason: `Языковой порог не выполнен${selfLevel > 0 ? `: самооценка ${profile.target_lang_level} ниже требуемой, сертификата нет` : ''} — потребуется подготовительный год (Hazırlık)`,
      points: 0,
    })
  }

  // +15 бюджет
  const budget = assessBudget(program, profile)
  if (budget.fits) {
    score += 15
    reasons.push({ reason: `Бюджет укладывается: ${budget.note}`, points: 15 })
  } else {
    reasons.push({ reason: `Бюджет не укладывается: ${budget.note}`, points: 0 })
  }

  // +10 дедлайн ещё не прошёл. Для демо-записей без подтверждённого окна
  // баллы не начисляются и в roadmap такая заявка не попадает.
  if (typeof program.deadline_month === 'number') {
    const now = getNow()
    let deadline = new Date(now.getFullYear(), program.deadline_month, 1)
    if (monthDiff(now, deadline) <= 0) {
      deadline = new Date(now.getFullYear() + 1, program.deadline_month, 1)
    }
    score += 10
    reasons.push({ reason: `Дедлайн ещё впереди: ${program.deadline_label} (~${monthDiff(now, deadline)} мес. до окна подачи)`, points: 10 })
  } else {
    reasons.push({ reason: 'Дедлайн не подтверждён — уточните окно подачи на официальном сайте', points: 0 })
  }

  // +5 достижения (грантовые программы)
  if (profile.achievements && program.grant) {
    score += 5
    reasons.push({ reason: 'Ваши олимпиады/грамоты — плюс для грантового конкурса', points: 5 })
  }

  // Множитель класса: чем ближе выпуск, тем приоритетнее реалистичные варианты
  score *= CREDIT_YEAR_MULTIPLIERS[profile.grade] ?? 1

  // Приоритет «грант» обещает «в первую очередь бесплатное»: буст получают
  // только программы с бесплатным обучением (tuition 0 или семестровый взнос
  // < $1000, как в госвузах Германии). «Грантовые» с платным fallback
  // (merit-scholarships США $18k+) не поднимаются — это не бесплатное
  if (profile.priority === 'grant' && program.grant && typeof program.tuition_usd === 'number' && program.tuition_usd < 1000) {
    score *= GRANT_MULTIPLIER
    reasons.push({ reason: 'Приоритет «грант» — программа грантовая, поднята в списке', points: 0, isBoost: true })
  }

  return { program, score, reasons }
}

// Главный вход движка: полный список с разбивкой по причинам.
// Выбор стран пользователя — фильтр пула рекомендаций: программы выбранных стран
// всегда раньше всех остальных (кросс-страновые скоры не должны их обгонять).
// Если выбранных меньше 3 (ОАЭ = 2), список добирается альтернативами из других
// стран — с флагом outsideChoice для честного бейджа в UI
export function scoreAllPrograms(profile) {
  const all = PROGRAMS.map((p) => scoreProgram(p, profile))
  const chosen = all.filter((r) => profile.countries?.includes(r.program.country)).sort((a, b) => b.score - a.score)
  const rest = all
    .filter((r) => !profile.countries?.includes(r.program.country))
    .map((r) => ({ ...r, outsideChoice: true }))
    .sort((a, b) => b.score - a.score)
  return [...chosen, ...rest]
}

// Именные гранты из аннотаций scholarship датасета (§8 «подбор стипендий»):
// одна строка-маркер на грант, распознаётся подстрокой в любом поле scholarship.
// Какие именные гранты упоминаются в поле scholarship программы
export function programScholarships(program) {
  const scholarship = program.scholarship || ''
  return SCHOLARSHIPS.filter((s) => scholarship.includes(s.match)).map((s) => s.id)
}

// Максимально возможный score для текущих вводных: учитываем достижимость
// бонуса за класс, достижения и грантовый приоритет, но не выдаём процент выше 100.
export function maxScoreForProfile(profile = {}) {
  const achievementMax = profile.achievements ? 5 : 0
  const yearMultiplier = CREDIT_YEAR_MULTIPLIERS[profile.grade] ?? 1
  const grantMultiplier = profile.priority === 'grant' ? GRANT_MULTIPLIER : 1
  return (MAX_BASE_SCORE + achievementMax) * yearMultiplier * grantMultiplier
}

// Процент совпадения — доля score от максимума для тех же вводных.
// Поэтому сильные и слабые программы получают разные значения, а не общий cap 99.
export function scorePercent(score, profile = {}) {
  if (!Number.isFinite(score) || score <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((score / maxScoreForProfile(profile)) * 100)))
}

// «Оценка шансов» (§8): среднее top-3 score → проценты.
// Это перевод модельного скоринга, а не вероятность приёма.
export function estimateChance(scored, profile = {}) {
  const top = scored.slice(0, 3).map((r) => ({
    id: r.program.id,
    university: r.program.university,
    percent: scorePercent(r.score, profile),
  }))
  const avg = top.length ? Math.round(top.reduce((s, x) => s + x.percent, 0) / top.length) : 0
  const level =
    avg >= 85 ? 'высокие' :
    avg >= 65 ? 'хорошие' :
    avg >= 45 ? 'средние' : 'требуют усиления'
  const verdict =
    avg >= 85 ? 'Профиль сильно попадает в подборку — удерживайте уровень и не пропустите дедлайны.' :
    avg >= 65 ? 'Хорошие вводные: пара целевых усилений (язык, GPA) поднимет шансы на топ-гранты.' :
    avg >= 45 ? 'Шансы средние: сфокусируйтесь на 2–3 реалистичных вариантах и закройте слабые места из рисков.' :
    'Пока сложно — расширьте список стран или бюджет, усильте язык и экзамены.'

  const reasons = []
  if ((Number(profile.ielts) || 0) >= 6.5) reasons.push('IELTS 6.5+ закрывает языковой порог большинства показанных программ.')
  else if ((Number(profile.ielts) || 0) >= 6) reasons.push('IELTS подходит для части программ; для некоторых топовых вариантов нужен более высокий порог.')
  else reasons.push('Нужно усилить IELTS: языковой порог ограничивает часть программ и может добавить Hazırlık.')
  if ((Number(profile.gpa) || 0) >= 4.5) reasons.push('Высокий GPA поддерживает заявки на гранты — это модельная оценка, не гарантия.')
  else reasons.push('Ещё один сильный академический результат или проект улучшит грантовую заявку.')
  if (profile.achievements) reasons.push('Достижения уже добавляют аргумент к грантовым заявкам.')
  else reasons.push('Не хватает подтверждённого проекта или олимпиады для усиления портфолио.')
  if (profile.budget === 'low') reasons.push('Низкий бюджет сужает выбор до бесплатных и грантовых вариантов.')
  return { top, avg, level, verdict, reasons }
}

export function buildPortfolioActions(profile = {}) {
  const fields = fieldList(profile)
  const actions = []
  if (fields.includes('it') || fields.includes('data-science') || fields.includes('cybersecurity')) {
    actions.push({ id: 'portfolio-project', title: 'Собрать практический проект', text: 'Опубликовать рабочий проект на GitHub и добавить короткое описание своей роли и результата.' })
    actions.push({ id: 'portfolio-hackathon', title: 'Участвовать в хакатоне', text: 'Выбрать хакатон по AI, данным или разработке и сохранить ссылку на результат команды.' })
  } else if (fields.includes('medicine') || fields.includes('dentistry') || fields.includes('pharmacy')) {
    actions.push({ id: 'portfolio-research', title: 'Добавить мини-исследование', text: 'Оформить обзор по выбранной медицинской теме с источниками и выводом.' })
    actions.push({ id: 'portfolio-volunteer', title: 'Получить профильный опыт', text: 'Найти подтверждённое волонтёрство или практику и зафиксировать, чему вы научились.' })
  } else {
    actions.push({ id: 'portfolio-project', title: 'Сделать профильный мини-проект', text: 'Подготовить работу по выбранному направлению с понятным результатом и ссылкой на материалы.' })
    actions.push({ id: 'portfolio-activity', title: 'Добавить профильную активность', text: 'Выбрать олимпиаду, конкурс, клуб или волонтёрство и сохранить подтверждение участия.' })
  }
  if (!profile.achievements) actions.push({ id: 'portfolio-proof', title: 'Собрать подтверждения', text: 'Сохранить сертификаты, рекомендации и описание результата каждого достижения в одной папке.' })
  return actions.slice(0, 3)
}

// Диагностика профиля: сильные стороны, цель, риски
export function diagnose(profile) {
  const strengths = []
  const risks = []
  const gpa = Number(profile.gpa) || 0 // '' и мусор из формы → 0
  const fields = fieldList(profile)

  if (gpa === 0) {
    // GPA не указан — это не «низкая успеваемость», а отсутствие данных
    risks.push({ title: 'Укажите свой балл', text: 'GPA не заполнен — добавьте его в анкете: от балла зависит часть грантовых рекомендаций.' })
  } else if (gpa >= 4.5) {
    strengths.push({ title: 'Высокая успеваемость', text: `GPA ${gpa}/5 — сильный показатель для грантовых программ.` })
  } else if (gpa >= 3.5) {
    strengths.push({ title: 'Хорошая успеваемость', text: `GPA ${gpa}/5 — уверенная база; гранты с жёстким отбором потребуют усиления.` })
  } else {
    risks.push({ title: 'Низкая успеваемость', text: `GPA ${gpa}/5 — сфокусируйтесь на программах, где важнее экзамены (YÖS/ЕНТ), чем аттестат.` })
  }

  if (profile.achievements) {
    strengths.push({
      title: 'Олимпиады и грамоты',
      text: profile.achievements_text
        ? `Ваше достижение: ${profile.achievements_text}. Это весомый аргумент в грантовых заявках.`
        : 'Олимпиады/грамоты усилят грантовую заявку.',
    })
  }

  const ielts = profile.ielts ?? 0
  if (ielts >= 6.5) {
    strengths.push({ title: 'Сильный английский', text: `IELTS ${ielts} — открывает англоязычные программы почти без ограничений.` })
  } else if (ielts >= 6.0) {
    strengths.push({ title: 'Рабочий английский', text: `IELTS ${ielts} — достаточно для большинства программ; для топовых может понадобиться 6.5+.` })
  } else {
    risks.push({ title: 'Английский ниже порога', text: `IELTS ${ielts} — стоит сдать на 6.0+ или выбрать программы с подготовительным годом.` })
  }

  if ((profile.countries?.length ?? 0) > 1) {
    strengths.push({ title: 'Гибкая стратегия', text: 'Несколько целевых стран — параллельные треки снижают риск «нигде не пройти».' })
  }

  if (fields.length > 1) {
    strengths.push({ title: 'Сравниваете интересы', text: `${fields.length} направления в анкете: рекомендации покажут лучшие варианты по каждому — так выбор осознаннее.` })
  }

  if (profile.grade === 9) {
    risks.push({ title: 'Много времени — используйте его', text: 'Вы в 9 классе: самое время качать экзамены и портфолио без спешки.' })
  }
  if (profile.grade === 11) {
    risks.push({ title: 'Выпускной год — жёсткие дедлайны', text: 'Окна подачи закрываются в течение учебного года: планируйте документы заранее.' })
  }

  // Модельное предположение из спеки — обязательно с бейджем «демо-оценка» в UI
  const highGpaGrantFlag = gpa > 4.5

  const first = fields[0]
  let goal = 'поступление по выбранному направлению'
  if (first === 'it') goal = 'Computer Engineering / IT-программа'
  if (first === 'economics') goal = 'Экономика / Бизнес-программа'
  if (first === 'engineering') goal = 'Инженерная программа'
  if (first === 'medicine') goal = 'Медицинская программа (MD)'
  if (first === 'dentistry') goal = 'Стоматологическая программа (DDS/DMD)'
  if (first === 'pharmacy') goal = 'Фармацевтическая программа'
  if (first === 'law') goal = 'Юридическая программа'
  if (first === 'business') goal = 'Бизнес / менеджмент-программа'
  if (first === 'data-science') goal = 'Data Science / аналитическая программа'
  if (first === 'cybersecurity') goal = 'Программа по кибербезопасности'
  if (first === 'science') goal = 'Программа по естественным наукам'
  if (first === 'architecture') goal = 'Архитектурная программа'
  if (first === 'design') goal = 'Программа по дизайну'
  if (first === 'psychology') goal = 'Программа по психологии'
  if (first === 'pedagogy') goal = 'Педагогическая программа'
  if (first === 'international-relations') goal = 'Программа по международным отношениям'
  if (fields.length > 1) goal += ` (+${fields.length - 1} доп. направление)`

  return { strengths, risks, goal, highGpaGrantFlag }
}

// Rule-based скоринг программ — формула из спецификации кейса №2:
// +30 направление, +25 страна, +20 язык, +15 бюджет, +10 дедлайн не прошёл,
// +5 достижения (если программа грантовая). При priority="grant" грантовые
// программы поднимаются множителем. Каждая причина хранится как {reason, points}.

import programsData from '../data/universities.json'

export const PROGRAMS = programsData.programs

export const MAX_BASE_SCORE = 30 + 25 + 20 + 15 + 10 // 100 — базовый порог без бонуса за достижения;
// реальные скоры выше из-за множителей (грант-буст, класс)

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
export function selfAssessmentLevel(profile) {
  const i = CEFR_ORDER.indexOf(profile?.target_lang_level)
  return i === -1 ? 0 : i + 1
}

// Языковое соответствие программе: сертификат — прямое доказательство;
// если сертификата нет, уверенная самооценка B1+ закрывает пороги до 6.0 включительно
export function languageMatches(program, profile) {
  const needIelts = typeof program.ielts_required === 'number'
  if (!needIelts) return true
  if ((Number(profile?.ielts) || 0) >= program.ielts_required) return true
  return selfAssessmentLevel(profile) >= 3 && program.ielts_required <= 6.0
}

export function needsPrepYear(program, profile) {
  return !languageMatches(program, profile)
}

function assessBudget(program, profile) {
  const tuition = program.tuition_usd ?? 0
  const fmt = (n) => n.toLocaleString('ru-RU')
  const grantHint = program.grant ? ' — грант может покрыть, проверьте условия конкурса' : ''
  // Бесплатное (грантовое) обучение — честный ноль в данных
  if (tuition === 0) {
    return { fits: true, note: program.grant ? 'грант покрывает обучение' : 'обучение бесплатное' }
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

  // +10 дедлайн ещё не прошёл (иначе программа вообще не показывается).
  // Окна приёма повторяются ежегодно ("по прошлым годам"), поэтому если окно этого
  // года уже прошло — берём ближайший будущий цикл. Программа скрывается только
  // если заявка реально больше не принимается (в демо-базе таких нет).
  const now = getNow()
  let deadline = new Date(now.getFullYear(), program.deadline_month, 1)
  if (monthDiff(now, deadline) <= 0) {
    deadline = new Date(now.getFullYear() + 1, program.deadline_month, 1)
  }
  const monthsLeft = monthDiff(now, deadline)
  if (monthsLeft <= 0) {
    return { program, eligible: false, score: 0, reasons, monthsLeft: 0 }
  }
  score += 10
  reasons.push({ reason: `Дедлайн ещё впереди: ${program.deadline_label} (~${monthsLeft} мес. до окна подачи)`, points: 10 })

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
  if (profile.priority === 'grant' && program.grant && (program.tuition_usd ?? 0) < 1000) {
    score *= GRANT_MULTIPLIER
    reasons.push({ reason: 'Приоритет «грант» — программа грантовая, поднята в списке', points: 0, isBoost: true })
  }

  return { program, eligible: true, score, reasons, monthsLeft }
}

// Главный вход движка: полный список с разбивкой по причинам
export function scoreAllPrograms(profile) {
  return PROGRAMS.map((p) => scoreProgram(p, profile))
    .filter((r) => r.eligible)
    .sort((a, b) => b.score - a.score)
}

// Топ-N рекомендаций
export function getRecommendations(profile, n = 3) {
  return scoreAllPrograms(profile).slice(0, n)
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
  if (first === 'law') goal = 'Юридическая программа'
  if (first === 'science') goal = 'Программа по естественным наукам'
  if (first === 'design') goal = 'Программа по дизайну / архитектуре'
  if (fields.length > 1) goal += ` (+${fields.length - 1} доп. направление)`

  return { strengths, risks, goal, highGpaGrantFlag }
}

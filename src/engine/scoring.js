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
  if (program.grant && profile.priority === 'grant') {
    return { fits: true, note: 'грант покрывает обучение' }
  }
  if (profile.budget === 'high') return { fits: true, note: 'бюджет позволяет платное обучение' }
  if (profile.budget === 'mid') return { fits: tuition <= 3000, note: tuition <= 3000 ? 'стоимость в рамках среднего бюджета (~$3 000/год)' : `дорого для среднего бюджета (≈$${tuition.toLocaleString('ru-RU')}/год)` }
  return { fits: tuition <= 1500, note: tuition <= 1500 ? 'стоимость в рамках низкого бюджета (~$1 500/год)' : `дорого для низкого бюджета (≈$${tuition.toLocaleString('ru-RU')}/год)` }
}

function scoreProgram(program, profile) {
  const reasons = []
  let score = 0

  // +30 направление
  if (program.field === profile.field) {
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

  // Приоритет «грант»: грантовые поднимаются множителем
  if (profile.priority === 'grant' && program.grant) {
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

  if (gpa >= 4.5) {
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

  if (profile.grade === 9) {
    risks.push({ title: 'Много времени — используйте его', text: 'Вы в 9 классе: самое время качать экзамены и портфолио без спешки.' })
  }
  if (profile.grade === 11) {
    risks.push({ title: 'Выпускной год — жёсткие дедлайны', text: 'Окна подачи закрываются в течение учебного года: планируйте документы заранее.' })
  }

  // Модельное предположение из спеки — обязательно с бейджем «демо-оценка» в UI
  const highGpaGrantFlag = gpa > 4.5

  let goal = 'поступление по выбранному направлению'
  if (profile.field === 'it') goal = 'Computer Engineering / IT-программа'
  if (profile.field === 'economics') goal = 'Экономика / Бизнес-программа'
  if (profile.field === 'engineering') goal = 'Инженерная программа'

  return { strengths, risks, goal, highGpaGrantFlag }
}

// Генератор персонального roadmap из профиля + отфильтрованных программ.
// Ключевое: если язык ниже порога выбранной программы — явный шаг
// «Подготовительный языковой год (Hazırlık), +1 год» с пометкой источника.

import { getNow, needsPrepYear } from './scoring.js'

const MONTHS_RU = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
]

function ym(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function formatMonth(ymStr) {
  const [y, m] = ymStr.split('-').map(Number)
  return `${MONTHS_RU[m - 1]} ${y}`
}

// Возвращает массив шагов { id, title, desc, month, kind, source }
export function buildRoadmap(profile, scoredPrograms) {
  const now = getNow()
  const baseY = now.getFullYear()
  const steps = []

  // Все проверки плана — только по программам выбранных стран: заявки, языковые
  // пороги и Hazırlık касаются того, куда пользователь реально собирается.
  // Альтернативы-добор из других стран (outsideChoice) в пошаговый план не попадают
  const chosenPrograms = profile.countries?.length
    ? scoredPrograms.filter((r) => profile.countries.includes(r.program.country))
    : scoredPrograms
  const top = chosenPrograms
    .filter((r) => typeof r.program.deadline_month === 'number')
    .slice(0, 3)
  const topGrant = top.find((r) => r.program.grant)

  const hasTurkey = profile.countries?.includes('Турция')
  const hasKz = profile.countries?.includes('Казахстан')

  const prepNeeded = chosenPrograms.some((r) => needsPrepYear(r.program, profile))

  // --- Подготовка экзаменов ---
  if (hasTurkey && profile.grade >= 10) {
    steps.push({
      id: 'tryos-prep',
      title: 'Подготовка к TR-YÖS',
      desc: 'Пройти пробный вариант, составить план занятий по математике и логике. TR-YÖS — основной вход для иностранцев в гос. вузы Турции.',
      month: ym(baseY, Math.max(now.getMonth() + 1, 10)),
      kind: 'exam',
      source: 'даты по прошлым годам',
    })
  }
  // IELTS нужен, если среди выбранных программ есть англ. пороги, которые
  // пользователь ещё не закрывает сертификатом (не только Турция — Германия и
  // Корея тоже требуют 6.0+)
  const ieltsNeeded = chosenPrograms.some(
    (r) => typeof r.program.ielts_required === 'number' && (Number(profile.ielts) || 0) < r.program.ielts_required,
  )
  if (ieltsNeeded) {
    const maxNeed = Math.max(
      ...chosenPrograms
        .filter((r) => typeof r.program.ielts_required === 'number')
        .map((r) => r.program.ielts_required),
    )
    steps.push({
      id: 'ielts-prep',
      title: `IELTS до ${maxNeed}+`,
      titleNote: maxNeed > 6.0 ? 'самый высокий порог среди ваших стран' : null,
      desc: 'Расписание подготовки и запись на ближайшую сессию — без сертификата часть программ закроется или добавит подготовительный год.',
      month: ym(baseY, Math.max(now.getMonth() + 1, 9)),
      kind: 'exam',
      source: 'пороги программ — проверяйте на сайтах вузов',
    })
  }
  if (hasKz) {
    steps.push({
      id: 'ent-prep',
      title: 'Подготовка к ЕНТ',
      desc: 'Сборник тестов ЕНТ + пробник по профильным предметам. ЕНТ — вход на гранты РК и ваш план Б.',
      month: ym(baseY, Math.max(now.getMonth() + 1, 10)),
      kind: 'exam',
      source: 'даты по прошлым годам',
    })
  }

  // --- Подача заявок по дедлайнам программ из рекомендаций ---
  for (const r of top) {
    const p = r.program
    steps.push({
      id: `apply-${p.id}`,
      title: `Подать заявку: ${p.university} — ${p.program}`,
      desc: `Окно подачи: ${p.deadline_label}. ${p.scholarship ? `Стипендии: ${p.scholarship}.` : ''}`,
      month: ym(baseY + 1, p.deadline_month),
      kind: 'deadline',
      source: p.verified ? `verified источник: ${p.source}` : 'демонстрационные данные — перепроверить',
    })
  }

  // --- Hazırlık: подготовительный языковой год ---
  if (prepNeeded) {
    steps.push({
      id: 'prep-year',
      title: 'Подготовительный языковой год (Hazırlık), +1 год к плану',
      desc: 'Язык ниже порога программы. Многие турецкие вузы допускают зачисление с условием года Hazırlık. Проверьте условия конкретной программы.',
      month: ym(baseY + 1, 9),
      kind: 'risk',
      source: 'требование языка — проверять на сайте программы',
    })
  }

  // --- Документы (чек-лист) ---
  const grantDeadlineMonth = topGrant ? topGrant.program.deadline_month : 3
  steps.push({
    id: 'docs',
    title: 'Документы: транскрипты, переводы, мотивационное письмо',
    desc: 'Собрать пакет: аттестат/транскрипт, нотариальные переводы, 1–2 рекомендации, мотивационное письмо под выбранную программу.',
    month: ym(baseY + 1, Math.max(1, grantDeadlineMonth - 2)),
    kind: 'docs',
  })

  // --- Внешкольные активности ---
  if (profile.grade <= 10) {
    steps.push({
      id: 'extracurricular',
      title: 'Внешкольные активности: олимпиады, проекты, волонтёрство',
      desc: 'Добавить 1–2 значимых достижения в портфолио: предметная олимпиада, командный проект, волонтёрство — усиливает грантовые заявки.',
      month: ym(baseY, 12),
      kind: 'activity',
    })
  }

  // --- Финал: зачисление ---
  steps.push({
    id: 'enroll',
    title: 'Получить приглашение и зачисление',
    desc: 'После результатов экзаменов и конкурса — выбор программы, виза/регистрация (для Турции), подтверждение места.',
    month: ym(baseY + 1, 8),
    kind: 'milestone',
  })

  steps.sort((a, b) => a.month.localeCompare(b.month))
  return steps
}

// Один ближайший шаг (Next Action) — самый ранний невыполненный
export function getNextAction(steps, doneIds) {
  return steps.find((s) => !doneIds.includes(s.id)) || null
}

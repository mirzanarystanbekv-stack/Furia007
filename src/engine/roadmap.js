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

  const top = scoredPrograms.slice(0, 3)
  const topGrant = top.find((r) => r.program.grant)

  const hasTurkey = profile.countries?.includes('Турция')
  const hasKz = profile.countries?.includes('Казахстан')

  // Проверяем весь пул подходящих программ, а не только топ-3: программы с
  // языковым порогом теряют баллы и проваливаются из топ-3 именно тогда,
  // когда язык пользователя слаб — а предупреждение как раз нужно в этот момент
  const prepNeeded = scoredPrograms.some((r) => needsPrepYear(r.program, profile))

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
  if (hasTurkey && (profile.ielts ?? 0) < 6.0) {
    steps.push({
      id: 'ielts-prep',
      title: 'IELTS до 6.0+',
      desc: 'Расписание подготовки и запись на ближайшую сессию. Некоторые программы (например, Boğaziçi) требуют 6.0.',
      month: ym(baseY, Math.max(now.getMonth() + 1, 9)),
      kind: 'exam',
      source: 'порог Boğaziçi — демонстрационные данные',
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

// «Главный страх» из анкеты выбирает режим UI: меняется банер, сортировка
// roadmap (что показывать первым) и дополнительный блок на Roadmap/Next Action.
// deadline-шаги здесь = kind 'deadline', документы = kind 'docs'.
export function getFearAccent(fear) {
  switch (fear) {
    case 'deadlines':
      return {
        id: 'deadlines',
        label: 'Режим дедлайнов',
        text: 'Шаги подачи подняты наверх и отсортированы по датам — ничего не пропустите.',
        // порядок шагов: заявки первыми, затем по возрастанию месяца
        order: (a, b) => {
          const w = (s) => (s.kind === 'deadline' ? 0 : 1)
          return w(a) - w(b) || a.month.localeCompare(b.month)
        },
        banner: null,
      }
    case 'choice':
      return {
        id: 'choice',
        label: 'Режим выбора',
        text: 'Экзамены идут первыми — сначала результаты, потом осознанная подача.',
        order: (a, b) => {
          const w = (s) => (s.kind === 'exam' ? 0 : 1)
          return w(a) - w(b) || a.month.localeCompare(b.month)
        },
        banner: null,
      }
    case 'documents':
      return {
        id: 'documents',
        label: 'Режим документов',
        text: 'Документы подняты наверх: соберите пакет до первого окна подачи.',
        order: (a, b) => {
          const w = (s) => (s.kind === 'docs' ? 0 : 1)
          return w(a) - w(b) || a.month.localeCompare(b.month)
        },
        banner: null,
      }
    default:
      return { id: null, label: '', text: '', order: null, banner: null }
  }
}

// Чек-лист документов для режима «documents» — производный от топ-программ
export function buildDocsChecklist(scoredPrograms) {
  const top = scoredPrograms.slice(0, 3)
  const items = [
    { id: 'docs-transcript', text: 'Транскрипт/аттестат за последние 2–3 года (оригинал + копии)' },
    { id: 'docs-translation', text: 'Нотариальные переводы транскрипта и паспорта' },
    { id: 'docs-motivation', text: 'Мотивационное письмо под конкретную программу' },
    { id: 'docs-recs', text: '1–2 рекомендации от учителей' },
    { id: 'docs-photo', text: 'Фото по требованиям вуза, сканы в PDF' },
  ]
  const perProgram = top.map((r) => ({
    id: `docs-${r.program.id}`,
    text: `Проверить требования конкретно для: ${r.program.university.split('(')[0].trim()} — ${r.program.program}`,
  }))
  return [...items, ...perProgram]
}

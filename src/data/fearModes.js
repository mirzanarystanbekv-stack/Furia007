// «Главный страх» из анкеты выбирает режим UI: банер, сортировка roadmap
// (что показывать первым) и дополнительный блок на Roadmap/Next Action.
// Это презентационная конфигурация, не логика генерации плана (см. engine/roadmap.js)

// deadline-шаги здесь = kind 'deadline', документы = kind 'docs'
export function getFearAccent(fear) {
  switch (fear) {
    case 'deadlines':
      return {
        id: 'deadlines',
        label: 'Режим дедлайнов',
        text: 'Шаги подачи подняты наверх и отсортированы по датам — ничего не пропустите.',
        order: (a, b) => {
          const w = (s) => (s.kind === 'deadline' ? 0 : 1)
          return w(a) - w(b) || a.month.localeCompare(b.month)
        },
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
      }
    default:
      return { id: null, label: '', text: '', order: null }
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

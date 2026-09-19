import { useState } from 'react'

const PORTFOLIO_KEY = 'locus.portfolio.v1'
const ESSAY_KEY = 'locus.essayNotes.v1'
const DOCUMENTS_KEY = 'locus.documents.v1'
const PORTFOLIO_FIELDS = [
  { key: 'projects', label: 'Проекты' },
  { key: 'awards', label: 'Награды' },
  { key: 'volunteering', label: 'Волонтёрство' },
]

function readStored(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback
  } catch {
    return fallback
  }
}

export default function ProfileTools() {
  const [portfolio, setPortfolio] = useState(() => ({ projects: 0, awards: 0, volunteering: 0, ...readStored(PORTFOLIO_KEY, {}) }))
  const [essayNotes, setEssayNotes] = useState(() => readStored(ESSAY_KEY, ''))
  const [savedEssay, setSavedEssay] = useState(() => Boolean(readStored(ESSAY_KEY, '')))
  const [documents, setDocuments] = useState(() => {
    const stored = readStored(DOCUMENTS_KEY, [])
    return Array.isArray(stored) ? stored : []
  })
  const [documentError, setDocumentError] = useState('')

  const changePortfolio = (key, delta) => {
    setPortfolio((current) => {
      const next = { ...current, [key]: Math.max(0, (Number(current[key]) || 0) + delta) }
      localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(next))
      return next
    })
  }

  const saveEssay = () => {
    localStorage.setItem(ESSAY_KEY, JSON.stringify(essayNotes))
    setSavedEssay(true)
  }

  const addDocuments = (event) => {
    const files = [...event.target.files]
    const tooLarge = files.find((file) => file.size > 5 * 1024 * 1024)
    if (tooLarge) {
      setDocumentError(`Файл «${tooLarge.name}» больше 5 МБ — выберите файл меньше.`)
      event.target.value = ''
      return
    }
    const next = [...documents, ...files.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      size: file.size,
      type: file.type || 'документ',
    }))].filter((file, index, all) => all.findIndex((item) => item.id === file.id) === index)
    setDocuments(next)
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(next))
    setDocumentError('')
    event.target.value = ''
  }

  const removeDocument = (id) => {
    const next = documents.filter((file) => file.id !== id)
    setDocuments(next)
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(next))
  }

  return (
    <section className="mt-8 space-y-4" aria-label="Инструменты профиля">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600">Сигналы профиля</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">Усиль портфолио</h2>
            <p className="mt-1 text-sm text-slate-500">Отмечайте сделанное — счётчики сохраняются в браузере.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {PORTFOLIO_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="text-sm font-semibold text-slate-700">{label}</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => changePortfolio(key, -1)}
                    className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                    aria-label={`Уменьшить количество: ${label}`}
                    disabled={portfolio[key] === 0}
                  >
                    −
                  </button>
                  <span className="min-w-5 text-center text-lg font-bold text-primary-700" aria-live="polite">{portfolio[key]}</span>
                  <button
                    type="button"
                    onClick={() => changePortfolio(key, 1)}
                    className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                    aria-label={`Увеличить количество: ${label}`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600">Заметки для эссе</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Твой черновик</h2>
          <textarea
            className="input mt-4 min-h-28 resize-y"
            maxLength={5000}
            value={essayNotes}
            onChange={(event) => { setEssayNotes(event.target.value); setSavedEssay(false) }}
            placeholder="Запишите идею, опыт или историю для мотивационного письма…"
            aria-label="Черновик мотивационного эссе"
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-400">
            <span>{essayNotes.length} / 5000</span>
            <button type="button" onClick={saveEssay} className="font-semibold text-primary-700 hover:text-primary-900">
              {savedEssay ? 'Сохранено ✓' : 'Сохранить заметки →'}
            </button>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600">Архив документов</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">Сертификаты и документы</h2>
            <p className="mt-1 text-sm text-slate-500">PDF и изображения до 5 МБ. В браузере сохраняются только названия и метаданные.</p>
          </div>
          <label className="btn-secondary cursor-pointer !px-3 !py-2 text-xs">
            + Добавить файлы
            <input type="file" className="sr-only" accept="application/pdf,image/*" multiple onChange={addDocuments} />
          </label>
        </div>
        {documentError && <p className="mt-3 text-sm text-error-700" role="alert">{documentError}</p>}
        {documents.length > 0 ? (
          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {documents.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="min-w-0 truncate text-slate-700" title={file.name}>{file.name}</span>
                <button type="button" onClick={() => removeDocument(file.id)} className="shrink-0 text-xs text-error-600 hover:underline" aria-label={`Удалить файл ${file.name}`}>
                  Удалить
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">Здесь появятся добавленные сертификаты и документы.</p>
        )}
      </div>
    </section>
  )
}

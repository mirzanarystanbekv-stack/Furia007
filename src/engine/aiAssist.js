import { COUNTRIES, FIELDS } from '../data/options.js'

const FIELD_ALIASES = [
  { value: 'medicine', patterns: ['медицин', 'medicine', 'medical', 'врач'] },
  { value: 'dentistry', patterns: ['стомат', 'dentist', 'dentistry', 'dental'] },
  { value: 'pharmacy', patterns: ['фармац', 'pharmacy'] },
  { value: 'engineering', patterns: ['инженер', 'engineering', 'mechanical', 'electrical'] },
  { value: 'it', patterns: ['\\bit\\b', 'программ', 'computer science', 'software', 'разработ'] },
  { value: 'data-science', patterns: ['data science', 'datascience', 'аналит', 'machine learning', '\\bml\\b'] },
  { value: 'cybersecurity', patterns: ['кибербезопас', 'cyber security', 'cybersecurity', 'infosec'] },
  { value: 'economics', patterns: ['эконом', 'economics', 'финанс', 'finance'] },
  { value: 'business', patterns: ['бизнес', 'business', 'менеджмент', 'management'] },
  { value: 'law', patterns: ['право', 'юриспруд', 'law'] },
  { value: 'science', patterns: ['наук', 'физик', 'математ', 'хим', 'physics', 'math'] },
  { value: 'architecture', patterns: ['архитект', 'architecture'] },
  { value: 'design', patterns: ['дизайн', 'design'] },
  { value: 'psychology', patterns: ['психолог', 'psychology'] },
  { value: 'pedagogy', patterns: ['педагог', 'образован', 'education', 'teacher'] },
  { value: 'international-relations', patterns: ['международн', 'international relations', 'diplomat'] },
]

const COUNTRY_ALIASES = [
  { value: 'Турция', patterns: ['турц', 'turkey', 'turkish'] },
  { value: 'Казахстан', patterns: ['казахстан', 'kazakhstan'] },
  { value: 'Германия', patterns: ['герман', 'немецк', 'germany', 'german'] },
  { value: 'Венгрия', patterns: ['венгр', 'hungary', 'hungarian'] },
  { value: 'Польша', patterns: ['польш', 'poland', 'polish'] },
  { value: 'Корея', patterns: ['коре', 'korea', 'korean'] },
  { value: 'Китай', patterns: ['кита', 'china', 'chinese'] },
  { value: 'Россия', patterns: ['росси', 'russia', 'russian'] },
  { value: 'Малайзия', patterns: ['малайз', 'malaysia'] },
  { value: 'ОАЭ', patterns: ['оаэ', 'эмират', 'дуба', 'uae', 'dubai'] },
  { value: 'США', patterns: ['сша', 'америк', 'usa', 'united states'] },
]

const REGION_ALIASES = [
  { label: 'Европа', patterns: ['европ', 'europe'], countries: ['Германия', 'Венгрия', 'Польша'] },
  { label: 'Азия', patterns: ['ази', 'asia'], countries: ['Казахстан', 'Корея', 'Китай', 'Малайзия'] },
]

const LANGUAGE_ALIASES = [
  { value: 'Английский', patterns: ['англ', 'english', '\\ben\\b'] },
  { value: 'Немецкий', patterns: ['немецк', 'german', 'deutsch'] },
  { value: 'Русский', patterns: ['русск', 'russian'] },
  { value: 'Казахский', patterns: ['казах', 'kazakh'] },
  { value: 'Турецкий', patterns: ['турецк', 'turkish'] },
  { value: 'Корейский', patterns: ['корейск', 'korean'] },
  { value: 'Китайский', patterns: ['китайск', 'chinese'] },
  { value: 'Польский', patterns: ['польск', 'polish'] },
  { value: 'Венгерский', patterns: ['венгерск', 'hungarian'] },
  { value: 'Малайский', patterns: ['малайск', 'malay'] },
]

const STOP_WORDS = new Set([
  'в', 'во', 'на', 'по', 'с', 'со', 'и', 'или', 'для', 'из', 'до', 'не', 'год', 'года',
  'хочу', 'хотел', 'хотела', 'ищу', 'нужен', 'нужна', 'нужны', 'подбери', 'найди',
  'вуз', 'вузы', 'университет', 'университеты', 'программу', 'программы', 'обучение',
  'поступление', 'поступить', 'бакалавриат', 'магистратура', 'дешево', 'дешевый',
])

function normalize(value) {
  return String(value || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim()
}

function patternMatches(text, pattern) {
  return new RegExp(pattern, 'i').test(text)
}

function unique(values) {
  return [...new Set(values)]
}

function parseAmount(text) {
  const match = text.match(/(?:до|не дороже|under|below|budget\s*(?:of)?|бюджет\s*(?:до|на)?)[^\d]{0,8}(\d[\d\s]*(?:[.,]\d+)?)/i)
  if (!match) return null
  const amount = Number(match[1].replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(amount) ? amount : null
}

function formatMoney(amount) {
  return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export function parseNaturalQuery(query) {
  const raw = normalize(query)
  const fields = unique(
    FIELD_ALIASES
      .filter((item) => item.patterns.some((pattern) => patternMatches(raw, pattern)))
      .map((item) => item.value),
  ).filter((value) => FIELDS.some((field) => field.value === value))
  const directCountries = COUNTRY_ALIASES
    .filter((item) => item.patterns.some((pattern) => patternMatches(raw, pattern)))
    .map((item) => item.value)
  const regions = REGION_ALIASES.filter((item) => item.patterns.some((pattern) => patternMatches(raw, pattern)))
  const countries = unique([...directCountries, ...regions.flatMap((region) => region.countries)])
    .filter((value) => COUNTRIES.some((country) => country.value === value))
  const languages = unique(
    LANGUAGE_ALIASES
      .filter((item) => item.patterns.some((pattern) => patternMatches(raw, pattern)))
      .map((item) => item.value),
  )

  const amount = parseAmount(raw)
  const lowBudget = /низк|недорог|дешев|low|cheap|affordable|бесплат|free/i.test(raw)
  const midBudget = /средн|mid|умерен/i.test(raw)
  const highBudget = /высок|без огранич|high|безлимит/i.test(raw)
  const grantOnly = /грант|стипенд|scholarship|financial aid/i.test(raw)
  const freeOnly = /бесплат|free|без оплаты/i.test(raw)
  const maxCost = amount ?? (freeOnly ? 0 : lowBudget ? 1500 : midBudget ? 3000 : null)
  const budgetTier = highBudget ? 'high' : lowBudget || freeOnly ? 'low' : midBudget || amount !== null ? 'mid' : null

  const semanticPatterns = [
    ...FIELD_ALIASES.flatMap((item) => item.patterns),
    ...COUNTRY_ALIASES.flatMap((item) => item.patterns),
    ...REGION_ALIASES.flatMap((item) => item.patterns),
    ...LANGUAGE_ALIASES.flatMap((item) => item.patterns),
    'до', 'under', 'below', 'budget', 'бюджет', 'низк', 'дешев', 'low', 'cheap',
    'средн', 'mid', 'высок', 'high', 'бесплат', 'free', 'грант', 'стипенд',
    'scholarship', 'financial aid', 'usd', '\\$?\\d[\\d\\s]*(?:[.,]\\d+)?',
  ]
  const textTerms = unique(
    raw
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .split(' ')
      .map((term) => term.trim())
      .filter((term) => term.length > 1
        && !STOP_WORDS.has(term)
        && !/^\d+$/.test(term)
        && !semanticPatterns.some((pattern) => patternMatches(term, pattern))),
  )

  const summary = [
    ...fields.map((value) => FIELDS.find((field) => field.value === value)?.label),
    ...regions.map((region) => region.label),
    ...directCountries,
    ...languages.map((language) => `язык: ${language.toLowerCase()}`),
    grantOnly ? 'грант/стипендия' : null,
    maxCost !== null ? `до ${formatMoney(maxCost)}` : null,
    ...textTerms.map((term) => `текст: ${term}`),
  ].filter(Boolean)

  return {
    raw,
    fields,
    countries,
    regions: regions.map((region) => region.label),
    languages,
    grantOnly,
    maxCost,
    budgetTier,
    textTerms,
    summary,
    hasIntent: Boolean(summary.length),
  }
}

export function matchesNaturalQuery(recommendation, intent) {
  const program = recommendation.program || recommendation
  if (intent.fields.length && !intent.fields.includes(program.field)) return false
  if (intent.countries.length && !intent.countries.includes(program.country)) return false
  if (intent.languages.length) {
    const language = normalize(program.language)
    if (!intent.languages.some((value) => language.includes(normalize(value)))) return false
  }
  if (intent.grantOnly && !program.grant && !String(program.scholarship || '').trim()) return false
  if (intent.maxCost !== null && (typeof program.tuition_usd !== 'number' || program.tuition_usd > intent.maxCost)) return false

  if (intent.textTerms.length) {
    const haystack = normalize([
      program.university,
      program.program,
      program.city,
      program.country,
      program.language,
      program.scholarship,
    ].join(' '))
    if (!intent.textTerms.every((term) => haystack.includes(term))) return false
  }
  return true
}

export function filterByNaturalQuery(recommendations, intent) {
  if (!intent.raw) return recommendations
  return recommendations.filter((recommendation) => matchesNaturalQuery(recommendation, intent))
}

export function buildRecommendationBrief(recommendations) {
  const candidates = recommendations.filter((recommendation) => !recommendation.outsideChoice).slice(0, 3)
  const pool = candidates.length >= 3 ? candidates : recommendations.slice(0, 3)
  if (!pool.length) return { text: '', items: [] }

  const items = pool.map((recommendation, index) => {
    const program = recommendation.program
    const reasons = recommendation.reasons
      .filter((reason) => reason.points > 0)
      .slice(0, 3)
      .map((reason) => reason.reason)
    const status = program.verified && program.source
      ? 'Есть официальный источник для проверки.'
      : 'Данные демонстрационные — стоимость, дедлайн и условия нужно проверить на сайте вуза.'
    return {
      id: program.id,
      title: `${index + 1}. ${program.university} — ${program.program}`,
      text: `${reasons.join(' ')} ${status}`.trim(),
    }
  })

  const text = pool.length > 1
    ? `По твоему профилю я бы начал с ${pool[0].program.university}. Ниже — ещё ${pool.length - 1} варианта, которые лучше всего совпали с твоими вводными.`
    : `По твоему профилю я бы начал с ${pool[0].program.university}. Это единственный вариант, который сейчас соответствует выбранным фильтрам.`

  return { text, items }
}

export function buildGroundedExplanation(recommendation, reasonIndexes) {
  const program = recommendation.program
  const validIndexes = unique((Array.isArray(reasonIndexes) ? reasonIndexes : [])
    .filter((index) => Number.isInteger(index) && index >= 0 && index < recommendation.reasons.length))
  const fallbackIndexes = recommendation.reasons
    .map((reason, index) => ({ reason, index }))
    .filter(({ reason }) => reason.points > 0)
    .slice(0, 4)
    .map(({ index }) => index)
  const indexes = validIndexes.length ? validIndexes : (fallbackIndexes.length ? fallbackIndexes : [0].filter((index) => recommendation.reasons[index]))
  const reasons = indexes.map((index) => recommendation.reasons[index].reason)
  const why = reasons.length ? reasons.join(' ') : 'В текущей модели нет подтверждённых совпадений по ключевым параметрам.'
  const status = program.verified && program.source
    ? `Статус данных: verified. Официальный источник: ${program.source}`
    : 'Статус данных: демонстрационные данные; стоимость, дедлайн и условия нужно проверить на официальном сайте.'

  return {
    text: `${why} ${status}`,
    reasonIndexes: indexes,
  }
}

function getConfiguredEndpoint() {
  const runtimeEndpoint = typeof window !== 'undefined' ? window.__LOCUS_AI_ENDPOINT__ : ''
  const buildEndpoint = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_AI_ENDPOINT : ''
  return runtimeEndpoint || buildEndpoint || ''
}

function sanitizeReasonIndexes(value, reasonCount) {
  return unique((Array.isArray(value) ? value : [])
    .filter((index) => Number.isInteger(index) && index >= 0 && index < reasonCount))
}

export async function requestGroundedExplanation({ recommendation, profile, endpoint = getConfiguredEndpoint(), signal, fetchImpl = globalThis.fetch, timeoutMs = 3500 }) {
  const fallback = buildGroundedExplanation(recommendation)
  if (!endpoint || typeof fetchImpl !== 'function') return { ...fallback, mode: 'rule-based' }

  const controller = new AbortController()
  const forwardAbort = () => controller.abort()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  if (signal) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
    signal.addEventListener('abort', forwardAbort, { once: true })
  }

  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        task: 'select_grounded_reason_indexes',
        constraints: 'Return JSON only: {"reasonIndexes":[number]}. Select only indexes from reasons. Never add tuition, deadlines, admission facts, or sources.',
        profile: {
          fields: profile.field,
          countries: profile.countries,
          budget: profile.budget,
          priority: profile.priority,
        },
        recommendation: {
          id: recommendation.program.id,
          university: recommendation.program.university,
          program: recommendation.program.program,
          country: recommendation.program.country,
          verified: Boolean(recommendation.program.verified),
          source: recommendation.program.verified ? recommendation.program.source || null : null,
          reasons: recommendation.reasons.map(({ reason, points }) => ({ reason, points })),
        },
      }),
    })
    if (!response.ok) throw new Error(`AI endpoint returned ${response.status}`)
    const data = await response.json()
    const indexes = sanitizeReasonIndexes(data.reasonIndexes, recommendation.reasons.length)
    if (!indexes.length) return { ...fallback, mode: 'rule-based' }
    return { ...buildGroundedExplanation(recommendation, indexes), mode: 'ai-assisted' }
  } catch (error) {
    if (signal?.aborted) throw error
    return { ...fallback, mode: 'rule-based' }
  } finally {
    clearTimeout(timeoutId)
    signal?.removeEventListener('abort', forwardAbort)
  }
}

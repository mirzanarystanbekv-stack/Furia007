// Опции анкеты — 8 полей по спецификации кейса №2
export const GRADES = [
  { value: 9, label: '9 класс' },
  { value: 10, label: '10 класс' },
  { value: 11, label: '11 класс' },
]

export const FIELDS = [
  { value: 'it', label: 'IT / Программирование' },
  { value: 'engineering', label: 'Инженерия' },
  { value: 'economics', label: 'Экономика / Бизнес' },
  { value: 'medicine', label: 'Медицина' },
  { value: 'dentistry', label: 'Стоматология' },
  { value: 'pharmacy', label: 'Фармацевтика' },
  { value: 'law', label: 'Право / Юриспруденция' },
  { value: 'business', label: 'Бизнес и менеджмент' },
  { value: 'data-science', label: 'Data Science / Аналитика' },
  { value: 'cybersecurity', label: 'Кибербезопасность' },
  { value: 'science', label: 'Наука (физика, мат, химия)' },
  { value: 'architecture', label: 'Архитектура' },
  { value: 'design', label: 'Дизайн' },
  { value: 'psychology', label: 'Психология' },
  { value: 'pedagogy', label: 'Педагогика' },
  { value: 'international-relations', label: 'Международные отношения' },
]

// Страны, по которым в базе есть программы (universities.json)
export const COUNTRIES = [
  { value: 'Турция', label: 'Турция' },
  { value: 'Казахстан', label: 'Казахстан' },
  { value: 'Германия', label: 'Германия' },
  { value: 'Венгрия', label: 'Венгрия' },
  { value: 'Польша', label: 'Польша' },
  { value: 'Корея', label: 'Корея' },
  { value: 'Китай', label: 'Китай' },
  { value: 'Россия', label: 'Россия' },
  { value: 'Малайзия', label: 'Малайзия' },
  { value: 'ОАЭ', label: 'ОАЭ' },
  { value: 'США', label: 'США' },
]

export const TARGET_LANGUAGES = [
  { value: 'A1', label: 'A1 — начальный' },
  { value: 'A2', label: 'A2 — базовый' },
  { value: 'B1', label: 'B1 — средний' },
  { value: 'B2', label: 'B2 — выше среднего' },
  { value: 'C1', label: 'C1 — продвинутый' },
]

export const SCHOLARSHIPS = [
  { id: 'turkiye', label: 'Türkiye Bursları', match: 'Türkiye Bursları' },
  { id: 'hungaricum', label: 'Stipendium Hungaricum', match: 'Stipendium Hungaricum' },
  { id: 'gks', label: 'GKS (Корея)', match: 'GKS' },
  { id: 'csc', label: 'CSC (Китай)', match: 'CSC' },
  { id: 'nawa', label: 'NAWA (Польша)', match: 'NAWA' },
  { id: 'rossotr', label: 'Квота РФ', match: 'Rossotrudnichestvo' },
  { id: 'kz-grant', label: 'Гос. гранты РК', match: 'гос. гранты РК' },
]

export const BUDGETS = [
  { value: 'low', label: 'Низкий', hint: 'только гранты и самые дешёвые варианты' },
  { value: 'mid', label: 'Средний', hint: 'до ~$3 000 в год' },
  { value: 'high', label: 'Высокий', hint: 'платное обучение возможно' },
]

export const PRIORITIES = [
  { value: 'grant', label: 'Грант >> платное', hint: 'ищем в первую очередь бесплатное' },
  { value: 'paid-ok', label: 'Платное ок', hint: 'рассматриваю и платные варианты' },
]

export const FEARS = [
  { value: 'deadlines', label: 'Пропустить дедлайны', hint: 'акцент: напоминания и даты' },
  { value: 'choice', label: 'Неправильно выбрать вуз', hint: 'акцент: объяснения «почему подходит»' },
  { value: 'documents', label: 'Запутаться в документах', hint: 'акцент: чек-лист документов' },
]

// Демо-профиль Алихана (для быстрой записи видео, из спецификации)
export const DEMO_PROFILE = {
  grade: 11,
  field: ['it'],
  countries: ['Турция', 'Казахстан'],
  gpa: 4.85,
  achievements: true,
  achievements_text: '2-е место на республиканской олимпиаде Дарын (информатика/программирование)',
  ielts: 6.0,
  target_lang_level: 'A2',
  budget: 'mid',
  priority: 'grant',
  fear: 'deadlines',
}

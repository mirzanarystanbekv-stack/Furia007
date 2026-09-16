import { Link } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext.jsx'

const FEATURES = [
  { icon: '🎯', title: 'Честный скоринг', text: 'Рекомендации объясняются прозрачно: почему подходит именно вам — по пунктам с баллами.' },
  { icon: '📅', title: 'Дедлайны под контролем', text: 'Персональный roadmap: экзамены, документы и окна подачи — с датами и источниками.' },
  { icon: '🔀', title: 'План Б встроен', text: 'Параллельные треки (Турция + Казахстан): если не пройдёте один — есть запасной.' },
  { icon: '✅', title: 'Один следующий шаг', text: 'Сервис всегда показывает один конкретный ближайший шаг и трекает прогресс.' },
]

const JOURNEY = [
  { n: 1, t: 'Профиль', d: '8 вопросов: класс, интересы, баллы, языки, бюджет' },
  { n: 2, t: 'Диагностика', d: 'Сильные стороны, риски и образовательная цель' },
  { n: 3, t: 'Рекомендации', d: 'Топ-3 программы с объяснением «почему подходит»' },
  { n: 4, t: 'Сравнение', d: 'Таблица: стоимость, дедлайны, язык, город' },
  { n: 5, t: 'Roadmap', d: 'Пошаговый план до зачисления' },
  { n: 6, t: 'Следующий шаг', d: 'Одно действие сейчас + трекинг прогресса' },
]

export default function Landing() {
  const { hasProfile } = useProfile()

  return (
    <div>
      <section className="bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24 text-center">
          <span className="inline-block rounded-full bg-primary-100 text-primary-700 px-4 py-1.5 text-xs font-bold tracking-wide uppercase">
            LOCUS Hackathon 2026 · Кейс №2
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Персональный маршрут
            <span className="text-primary-600"> поступления</span>
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
            Заполните короткую анкету — получите подборку вузов с честным объяснением «почему подходит именно
            вам», сравнение вариантов и пошаговый план действий до зачисления.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/profile" className="btn-primary text-base px-8 py-3">
              Начать — заполнить анкету
            </Link>
            {hasProfile && (
              <Link to="/recommendations" className="btn-secondary text-base px-8 py-3">
                Продолжить: мои рекомендации
              </Link>
            )}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Без регистрации · Данные хранятся только в вашем браузере (localStorage)
          </p>
        </div>
      </section>

      {/* Как это работает */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900">Как это работает — 6 шагов</h2>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {JOURNEY.map((s) => (
            <div key={s.n} className="card p-5 hover:shadow-card-hover transition-shadow">
              <div className="flex items-center gap-3">
                <span className="h-9 w-9 rounded-xl bg-primary-600 text-white font-bold flex items-center justify-center text-sm">
                  {s.n}
                </span>
                <h3 className="font-bold text-slate-900">{s.t}</h3>
              </div>
              <p className="mt-3 text-sm text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Почему это работает */}
      <section className="bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900">Почему это работает</h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-5">
                <div className="text-2xl">{f.icon}</div>
                <h3 className="mt-3 font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Начните маршрут за 3 минуты</h2>
        <p className="mt-3 text-slate-600 max-w-xl mx-auto">
          8 вопросов анкеты — и вы получите персональную подборку вузов и план действий.
        </p>
        <Link to="/profile" className="btn-primary mt-7 text-base px-8 py-3">
          Заполнить анкету
        </Link>
      </section>
    </div>
  )
}

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
  const { hasProfile, user } = useProfile()

  return (
    <div>
      {/* Декоративный hero-фон: сетка, световые пятна, маршрутная линия, спутники */}
      <div className="absolute inset-x-0 top-0 h-[640px] overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-100/80 via-primary-50/60 to-white" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgb(79 70 229 / 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgb(79 70 229 / 0.07) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 45%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 45%, transparent 100%)',
          }}
        />
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary-300/40 blur-3xl" />
        <div className="absolute -top-16 right-[-80px] h-[26rem] w-[26rem] rounded-full bg-accent-400/25 blur-3xl" />
        <div className="absolute top-72 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-primary-400/20 blur-3xl" />
        <svg className="absolute inset-0 h-full w-full" fill="none">
          <path
            d="M-60 610 C 120 470, 80 340, 260 300 S 520 210, 610 140 S 900 60, 1100 90"
            stroke="url(#routeGrad)"
            strokeWidth="2.5"
            strokeDasharray="1 14"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="routeGrad" x1="0" y1="610" x2="1100" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#1d9e75" stopOpacity="0" />
              <stop offset="0.55" stopColor="#1d9e75" stopOpacity="0.6" />
              <stop offset="1" stopColor="#0c447c" stopOpacity="0.7" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute top-24 left-[38%] h-2.5 w-2.5 rounded-full bg-primary-500 shadow-[0_0_16px_4px_rgba(29,158,117,0.5)]" />
        <span className="absolute top-52 left-[62%] h-2 w-2 rounded-full bg-accent-500 shadow-[0_0_14px_4px_rgba(12,68,124,0.45)]" />
      </div>
      <section className="relative">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24 text-center relative">
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
            {user ? (
              <Link to="/next" className="btn-primary text-base px-8 py-3">
                Продолжить как {user.name} →
              </Link>
            ) : (
              <Link to="/auth" className="btn-primary text-base px-8 py-3">
                Создать аккаунт
              </Link>
            )}
            <Link to="/profile" className="btn-secondary text-base px-8 py-3">
              {hasProfile ? 'Мои рекомендации' : 'Заполнить анкету'}
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Аккаунт хранится локально в браузере · Данные анкеты никуда не отправляются
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

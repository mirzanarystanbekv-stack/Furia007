import { Link } from 'react-router-dom'
import { useProfile } from '../context/useProfile.js'

const FEATURES = [
  { icon: '01', title: 'Профиль → сигнал', text: '8 коротких вопросов превращаются в понятную картину целей, ограничений и сильных сторон.' },
  { icon: '02', title: 'Рекомендации с логикой', text: 'Каждая программа объясняет, почему она подходит именно вам — без непрозрачного «магического» рейтинга.' },
  { icon: '03', title: 'Roadmap без хаоса', text: 'Экзамены, документы и окна подачи собраны в один маршрут с ближайшим действием.' },
  { icon: '04', title: 'План Б рядом', text: 'Сравнивайте страны и программы, сохраняйте варианты и не зависите от одного сценария.' },
]

const TESTIMONIALS = [
  { quote: 'Наконец понятно, что делать не «когда-нибудь», а на этой неделе.', name: 'Алихан, 11 класс', meta: 'демо-профиль · Шымкент' },
  { quote: 'Я увидела не просто список вузов, а причины и реальные следующие шаги.', name: 'Мадина, абитуриентка', meta: 'отзыв из пользовательского сценария' },
  { quote: 'Сравнение Турции и Казахстана помогло оставить сильный запасной маршрут.', name: 'Ерлан, родитель', meta: 'отзыв из демо-теста' },
]

const ROUTE_STEPS = [
  { label: 'Профиль', text: '8 вопросов', state: 'done', to: '/profile' },
  { label: 'Диагностика', text: 'ваши сильные стороны', state: 'done', to: '/diagnostics' },
  { label: 'Рекомендации', text: 'демо-подборка вариантов', state: 'active', to: '/recommendations' },
  { label: 'Roadmap', text: 'следующий шаг', state: 'next', to: '/roadmap' },
]

export default function Landing() {
  const { hasProfile, user } = useProfile()

  return (
    <div className="bg-slate-950 text-white overflow-hidden">
      <section className="relative min-h-[680px] flex items-center">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -inset-24 bg-[radial-gradient(ellipse_at_12%_18%,rgba(29,158,117,0.16),transparent_42%),radial-gradient(ellipse_at_88%_8%,rgba(58,130,246,0.14),transparent_43%),linear-gradient(135deg,#07131d_0%,#0b1724_52%,#101629_100%)] blur-2xl" />
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:48px_48px]" />
          <div className="absolute -left-40 top-0 h-[30rem] w-[34rem] rounded-full bg-primary-500/10 blur-[110px]" />
          <div className="absolute -right-48 -top-24 h-[34rem] w-[38rem] rounded-full bg-blue-500/10 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto w-full px-4 py-16 sm:py-24">
          <div className="grid lg:grid-cols-[1.02fr_0.98fr] gap-12 items-center">
            <div>
              <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl">
                МаршрутПоступления
                <span className="block bg-gradient-to-r from-primary-300 via-cyan-200 to-blue-300 bg-clip-text text-transparent">Один маршрут вместо десятков вкладок.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                Не просто каталог вузов. Один персональный маршрут: от анкеты и честных рекомендаций до понятного действия, которое можно сделать сегодня.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/profile" className="btn-primary !rounded-xl !bg-primary-500 !px-6 !py-3.5 !text-base !text-white hover:!bg-primary-400">
                  {hasProfile ? 'Открыть мои рекомендации' : 'Открыть маршрут'}
                  <span aria-hidden="true">↗</span>
                </Link>
                <Link to={user ? '/next' : '/auth'} className="btn !rounded-xl !border !border-white/15 !bg-white/5 !px-6 !py-3.5 !text-base !text-slate-200 hover:!bg-white/10">
                  {user ? 'Продолжить маршрут' : 'Создать аккаунт'}
                </Link>
              </div>
            </div>

            <div className="relative lg:pl-6" aria-label="Предпросмотр персонального маршрута">
              <div className="absolute -inset-10 rounded-[2rem] bg-primary-400/10 blur-[90px]" />
              <div className="relative rounded-[1.75rem] border border-white/25 bg-slate-800/80 p-3 shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <div className="rounded-2xl border border-white/15 bg-slate-900/95 p-5 shadow-inner sm:p-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-primary-300">live route preview</p>
                      <p className="mt-1 text-sm font-semibold text-white">Ваш маршрут поступления</p>
                    </div>
                    <span className="rounded-full border border-primary-400/30 bg-primary-400/10 px-2.5 py-1 text-[10px] text-primary-200">обновляется</span>
                  </div>
                  <p className="mt-3 text-[11px] text-amber-200/90">Демо-превью — не персональный расчёт</p>
                  <div className="mt-6 space-y-4">
                    {ROUTE_STEPS.map((step, index) => (
                      <Link
                        key={step.label}
                        to={step.to}
                        className="flex items-center gap-3 rounded-xl transition hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
                        aria-label={`Открыть раздел: ${step.label}`}
                      >
                        <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${step.state === 'active' ? 'bg-primary-400 text-slate-950 shadow-[0_0_20px_rgba(52,211,153,0.45)]' : step.state === 'done' ? 'bg-white/15 text-primary-200' : 'bg-white/5 text-slate-500'}`}>
                          {step.state === 'done' ? '✓' : index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className={`text-sm font-medium ${step.state === 'next' ? 'text-slate-400' : 'text-white'}`}>{step.label}</p>
                            <span className="text-[10px] text-slate-500">{step.state === 'active' ? 'сейчас' : step.state === 'next' ? 'дальше' : 'готово'}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{step.text}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-6 rounded-xl border border-primary-400/20 bg-primary-400/10 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-primary-300">next action</p>
                        <a
                          href="https://ielts.org/take-a-test"
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-white underline decoration-primary-300/70 underline-offset-4 hover:text-primary-200"
                          aria-label="Открыть официальную страницу IELTS в новой вкладке"
                        >
                          Проверить требования IELTS <span aria-hidden="true">↗</span>
                        </a>
                      </div>
                      <span className="text-lg text-primary-300">→</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-2 hidden rounded-xl border border-white/20 bg-slate-800/95 px-4 py-3 shadow-xl backdrop-blur sm:block">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">демо-подборка</p>
                <p className="mt-1 text-sm font-semibold text-white">Настройте профиль <span className="text-xs font-normal text-primary-300">для своих вариантов</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/10 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-20 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-300">one route, less noise</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Вся сложность поступления — в одном спокойном интерфейсе.</h2>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="bg-slate-950 p-6 transition hover:bg-white/[0.04]">
                <span className="text-xs font-semibold text-primary-300">{feature.icon}</span>
                <h3 className="mt-8 text-base font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="bg-slate-900/80">
        <div className="max-w-6xl mx-auto grid gap-12 px-4 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">built for decisions</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Сначала понять себя. Потом выбрать вуз.</h2>
            <p className="mt-5 text-sm leading-7 text-slate-400">Мы не прячем логику за красивыми обещаниями. Меняете страну, бюджет или язык — подборка и план пересчитываются заметно и сразу.</p>
            <Link to="/diagnostics" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary-300 hover:text-primary-200">Посмотреть диагностику <span>↗</span></Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['01', 'Сигнал', 'Поймите, что уже работает в вашем профиле.'],
              ['02', 'Выбор', 'Сравните варианты по цене, языку и дедлайнам.'],
              ['03', 'Действие', 'Получите один конкретный шаг вместо списка тревог.'],
            ].map(([n, title, text]) => (
              <div key={n} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <span className="text-xs text-primary-300">{n}</span>
                <h3 className="mt-10 font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-20 sm:py-24">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-300">early signals</p>
              <h2 className="mt-4 text-3xl font-semibold text-white">Меньше неопределённости. Больше движения.</h2>
            </div>
            <span className="text-xs text-slate-500">демо-отзывы пользовательского сценария</span>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((item) => (
              <figure key={item.name} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <blockquote className="text-base leading-7 text-slate-200">«{item.quote}»</blockquote>
                <figcaption className="mt-8 border-t border-white/10 pt-4">
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.meta}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / CTA */}
      <section className="bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center sm:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-300">start free</p>
          <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Ваш первый шаг уже может быть конкретным.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400">Без подписки и скрытых платежей. Заполните профиль, сохраните прогресс локально и соберите маршрут под свою ситуацию.</p>
          <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-primary-400/25 bg-primary-400/10 p-6 text-left">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold text-white">МаршрутПоступления</p>
                <p className="mt-1 text-xs text-slate-400">для абитуриента</p>
              </div>
              <p className="text-2xl font-semibold text-primary-200">free</p>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-slate-300">
              <li>✓ персональная анкета и диагностика</li>
              <li>✓ рекомендации и сравнение</li>
              <li>✓ Roadmap и Next Action</li>
            </ul>
            <Link to="/profile" className="btn-primary mt-6 w-full !bg-primary-500 !text-white hover:!bg-primary-400">Открыть маршрут ↗</Link>
          </div>
        </div>
      </section>

    </div>
  )
}

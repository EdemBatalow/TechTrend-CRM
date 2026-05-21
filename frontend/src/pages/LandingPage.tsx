import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import {
  TrendingUp,
  Clock,
  Layers,
  Home,
  BarChart2,
  ChevronRight,
  ArrowRight,
  Star,
  CheckCircle,
  Zap,
  Shield,
  Menu,
  X,
} from 'lucide-react'
import { colors, fontFamily } from '../theme'

const LogoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const MiniChart = () => {
  const data = [40, 65, 52, 78, 70, 92, 85, 110, 98, 125]
  const maxVal = Math.max(...data)
  const minVal = Math.min(...data)
  const range = maxVal - minVal
  const w = 320
  const h = 120
  const pad = 16
  const chartW = w - pad * 2
  const chartH = h - pad * 2
  const points = data.map((v, i) => ({
    x: pad + (chartW / (data.length - 1)) * i,
    y: pad + chartH - ((v - minVal) / range) * chartH,
  }))
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `M ${points[0].x} ${h - pad} L ${pathD.slice(2)} L ${points[points.length - 1].x} ${h - pad} Z`

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3E6B4F" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#7DAA82" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={pad} y1={pad + (chartH / 3) * i} x2={w - pad} y2={pad + (chartH / 3) * i}
          stroke={colors.beigeDeep} strokeOpacity="0.3" strokeWidth="1" />
      ))}
      <path d={areaD} fill="url(#chartGrad)" />
      <path d={pathD} fill="none" stroke={colors.greenPrimary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={colors.greenPrimary} />
      ))}
    </svg>
  )
}

const DashboardPreview = () => (
  <motion.div
    animate={{ y: [0, -12, 0] }}
    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    style={{ background: 'rgba(241,236,230,0.7)', backdropFilter: 'blur(24px)', borderRadius: 24, padding: 24, boxShadow: '0 32px 80px rgba(31,31,26,0.18), 0 0 0 1px rgba(181,169,154,0.25)' }}
  >
    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
      {[colors.beigeLight, colors.beigeDeep, colors.greenPrimary].map((c, i) => (
        <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
      ))}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
      {[
        { label: 'Выручка', val: '₽245M', change: '+12.5%' },
        { label: 'Клиенты', val: '328', change: '+24' },
        { label: 'Продано', val: '142', change: '+8' },
        { label: 'Готовность', val: '68%', change: '+5.2%' },
      ].map((item, i) => (
        <div key={i} style={{ background: colors.beigeLight, borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(181,169,154,0.2)' }}>
          <div style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 4 }}>{item.label}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: colors.textDark, letterSpacing: -0.5 }}>{item.val}</div>
          <div style={{ fontSize: 10, color: colors.greenPrimary, fontWeight: 600 }}>{item.change}</div>
        </div>
      ))}
    </div>
    <div style={{ background: colors.beigeLight, borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(181,169,154,0.2)' }}>
      <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 8, fontWeight: 500 }}>Динамика продаж</div>
      <MiniChart />
    </div>
  </motion.div>
)

const features = [
  {
    icon: <TrendingUp size={28} />,
    title: 'Умная аналитика спроса',
    desc: 'AI анализирует рынок, цены, сезонность и поведение покупателей, показывая где спрос будет завтра.',
  },
  {
    icon: <Clock size={28} />,
    title: 'Прогноз готовности к покупке',
    desc: 'Система оценивает вероятность покупки по каждому клиенту и помогает закрывать сделки быстрее.',
  },
  {
    icon: <Layers size={28} />,
    title: 'Единая платформа',
    desc: 'Маркетинг, продажи и аналитика объединены в одной CRM с полным контролем процессов.',
  },
  {
    icon: <Home size={28} />,
    title: 'Шахматка и бронирование',
    desc: 'Смотрите свободные квартиры, резервируйте и фиксируйте статусы бронирований прямо в CRM.',
  },
]

const analyticsList = [
  'Динамика цен на рынке недвижимости',
  'Сезонные колебания спроса',
  'Поведенческие паттерны покупателей',
  'Исторические данные продаж',
  'Экономические индикаторы и ставки',
]

const LandingPage = () => {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])
  const heroY = useTransform(scrollY, [0, 400], [0, -60])

  useEffect(() => {
    const token = localStorage.getItem('ttcrm_token')
    if (token) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  return (
    <div style={{ fontFamily, background: colors.beigeLight, color: colors.textDark, minHeight: '100vh' }}>
      <nav
        style={{
          background: 'rgba(241,236,230,0.88)',
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 4px 24px rgba(31,31,26,0.07)',
          borderBottom: '1px solid rgba(181,169,154,0.2)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: colors.greenPrimary, fontWeight: 700, fontSize: 18, letterSpacing: -0.5 }}>
            <LogoIcon />
            TechTrend CRM
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }} className="hidden-mobile">
            {['Возможности', 'Аналитика', 'О системе'].map((link, i) => (
              <a key={i} href={`#${['features', 'analytics', 'about'][i]}`}
                style={{ color: colors.textDark, textDecoration: 'none', fontWeight: 500, fontSize: 15, transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = colors.greenPrimary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = colors.textDark)}
              >{link}</a>
            ))}
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/login')}
              style={{ background: colors.greenPrimary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 16px rgba(62,107,79,0.3)' }}
            >
              Войти в систему
            </motion.button>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: colors.textDark }} className="show-mobile">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {menuOpen && (
          <div style={{ background: colors.beigeCreama, padding: '16px 24px', borderTop: '1px solid rgba(181,169,154,0.2)' }}>
            {['Возможности', 'Аналитика', 'О системе'].map((link, i) => (
              <a key={i} href={`#${['features', 'analytics', 'about'][i]}`} style={{ display: 'block', color: colors.textDark, textDecoration: 'none', padding: '12px 0', fontWeight: 500, borderBottom: '1px solid rgba(181,169,154,0.15)' }}>{link}</a>
            ))}
            <button onClick={() => navigate('/login')} style={{ width: '100%', marginTop: 16, background: colors.greenPrimary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
              Войти в систему
            </button>
          </div>
        )}
      </nav>

      <section ref={heroRef} style={{ position: 'relative', overflow: 'hidden', padding: '96px 0 140px' }}>
        {/* Cinematic Video Background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: -2 }}>
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/assets/hero_bg.png"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          >
            <source src="https://cdn.pixabay.com/video/2017/04/04/8595-211516109_large.mp4" type="video/mp4" />
          </video>
          {/* Gradients and Overlays for harmonic look */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to bottom, rgba(218, 210, 200, 0.4), ${colors.beigeLight} 95%), 
                         linear-gradient(to right, rgba(218, 210, 200, 0.2), transparent 50%)`,
            zIndex: -1
          }} />
        </div>

        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(125,170,130,0.1) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />

        <motion.div style={{ opacity: heroOpacity, y: heroY }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(62,107,79,0.1)', border: '1px solid rgba(62,107,79,0.2)', borderRadius: 100, padding: '6px 16px', marginBottom: 28 }}
              >
                <Zap size={14} color={colors.greenPrimary} />
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.greenPrimary }}>AI-driven платформа нового поколения</span>
              </motion.div>
              <h1 style={{ fontSize: 'clamp(2.5rem, 4vw, 3.75rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: -2, color: colors.textDark, marginBottom: 24 }}>
                Умная CRM-платформа
                <br />
                <span style={{ color: colors.greenPrimary }}>для застройщиков</span>
              </h1>
              <p style={{ fontSize: 18, lineHeight: 1.7, color: colors.textSecondary, marginBottom: 40, maxWidth: 520 }}>
                Принимайте решения на основе данных. AI-алгоритмы прогнозируют спрос и готовность клиентов к покупке.
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <motion.button
                  whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(62,107,79,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/register')}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.greenPrimary, color: '#fff', border: 'none', borderRadius: 14, padding: '16px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 20px rgba(62,107,79,0.3)', transition: 'all 0.3s' }}
                >
                  Попробовать бесплатно <ArrowRight size={18} />
                </motion.button>
                <motion.a
                  whileHover={{ y: -2 }}
                  href="#features"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', color: colors.textDark, border: `2px solid ${colors.beigeDeep}`, borderRadius: 14, padding: '16px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.3s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.greenPrimary; e.currentTarget.style.color = colors.greenPrimary }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.beigeDeep; e.currentTarget.style.color = colors.textDark }}
                >
                  Узнать больше
                </motion.a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 48 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={colors.greenPrimary} color={colors.greenPrimary} />)}
                </div>
                <span style={{ fontSize: 14, color: colors.textSecondary }}>
                  Более <strong style={{ color: colors.textDark }}>150+</strong> застройщиков доверяют нам
                </span>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}>
              <DashboardPreview />
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section id="features" style={{ padding: '100px 0', background: colors.beigeCreama }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 64 }}
          >
            <div style={{ display: 'inline-block', background: 'rgba(62,107,79,0.08)', borderRadius: 100, padding: '6px 20px', marginBottom: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.greenPrimary }}>ВОЗМОЖНОСТИ</span>
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 3vw, 2.75rem)', fontWeight: 800, letterSpacing: -1.5, color: colors.textDark }}>
              Все, что нужно для роста продаж
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }}
                whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(62,107,79,0.15)' }}
                style={{
                  background: colors.beigeLight, borderRadius: 20, padding: '2.5rem', border: '1px solid rgba(181,169,154,0.2)',
                  boxShadow: '0 4px 20px rgba(31,31,26,0.07)', transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)', cursor: 'default',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(62,107,79,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.greenPrimary, marginBottom: 24 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: colors.textDark, letterSpacing: -0.3, marginBottom: 12 }}>{f.title}</h3>
                <p style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 1.8 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="analytics" style={{ padding: '100px 0', background: colors.beigeLight }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
              <div style={{ display: 'inline-block', background: 'rgba(62,107,79,0.08)', borderRadius: 100, padding: '6px 20px', marginBottom: 20 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.greenPrimary }}>AI-АНАЛИТИКА</span>
              </div>
              <h2 style={{ fontSize: 'clamp(1.75rem, 2.5vw, 2.25rem)', fontWeight: 800, letterSpacing: -1, color: colors.textDark, marginBottom: 16 }}>
                Данные вместо интуиции
              </h2>
              <p style={{ fontSize: 17, color: colors.textSecondary, lineHeight: 1.7, marginBottom: 32 }}>
                Система использует машинное обучение для анализа ключевых факторов рынка и поведения клиентов.
              </p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {analyticsList.map((item, i) => (
                  <motion.li key={i}
                    initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid rgba(181,169,154,0.15)', color: colors.textSecondary, fontSize: 16 }}
                  >
                    <CheckCircle size={18} color={colors.greenPrimary} />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }}>
              <div style={{
                background: colors.beigeCreama, borderRadius: 24, padding: 32,
                boxShadow: '0 8px 40px rgba(31,31,26,0.1)', border: '1px solid rgba(181,169,154,0.2)',
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.textSecondary, marginBottom: 24 }}>Прогноз готовности к покупке</div>
                {[
                  { label: 'Высокая (80-100%)', val: 45, color: colors.greenPrimary },
                  { label: 'Средняя (50-79%)', val: 32, color: colors.greenSoft },
                  { label: 'Низкая (0-49%)', val: 23, color: colors.beigeDeep },
                ].map((item, i) => (
                  <div key={i} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: colors.textSecondary }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: colors.textDark }}>{item.val}%</span>
                    </div>
                    <div style={{ height: 10, background: 'rgba(181,169,154,0.2)', borderRadius: 10, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }} whileInView={{ width: `${item.val}%` }}
                        transition={{ duration: 1, delay: i * 0.2, ease: 'easeOut' }}
                        viewport={{ once: true }}
                        style={{ height: '100%', background: `linear-gradient(90deg, ${item.color}, ${colors.greenPastel})`, borderRadius: 10 }}
                      />
                    </div>
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 32 }}>
                  {[
                    { val: '68%', label: 'Средняя готовность' },
                    { val: '15', label: 'Клиентов активны' },
                    { val: '+5.2%', label: 'Рост за месяц' },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign: 'center', background: colors.beigeLight, borderRadius: 14, padding: '16px 12px' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: colors.greenPrimary, letterSpacing: -0.5 }}>{s.val}</div>
                      <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="about" style={{ padding: '80px 0', background: colors.beigeCreama }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
            <h2 style={{ fontSize: 'clamp(1.75rem, 2.5vw, 2.25rem)', fontWeight: 800, letterSpacing: -1, color: colors.textDark, marginBottom: 16 }}>
              Почему нас выбирают
            </h2>
            <p style={{ fontSize: 17, color: colors.textSecondary, maxWidth: 560, margin: '0 auto 56px' }}>
              Мы объединяем лучшие практики CRM с AI-технологиями специально для рынка недвижимости
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
              {[
                { icon: <Shield size={28} />, title: 'Безопасность данных', desc: 'Шифрование банковского уровня и контроль доступа' },
                { icon: <Zap size={28} />, title: 'Быстрый старт', desc: 'Развертывание и настройка за 1 рабочий день' },
                { icon: <BarChart2 size={28} />, title: 'Точность прогнозов', desc: 'Точность AI-моделей более 89% по историческим данным' },
                { icon: <Star size={28} />, title: 'Поддержка 24/7', desc: 'Персональный менеджер и приоритетная поддержка' },
              ].map((item, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                  style={{ background: colors.beigeLight, borderRadius: 16, padding: '28px 24px', textAlign: 'left', border: '1px solid rgba(181,169,154,0.2)' }}
                >
                  <div style={{ color: colors.greenPrimary, marginBottom: 16 }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, color: colors.textDark, marginBottom: 8 }}>{item.title}</div>
                  <div style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 1.6 }}>{item.desc}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section style={{ padding: '100px 24px', background: `linear-gradient(135deg, ${colors.greenPrimary} 0%, ${colors.greenSoft} 100%)`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-40%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(2rem, 3vw, 3rem)', fontWeight: 800, color: '#fff', letterSpacing: -1.5, marginBottom: 16, maxWidth: 700, margin: '0 auto 16px' }}>
            Готовы принимать решения на основе данных?
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)', marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
            Присоединяйтесь к застройщикам, которые уже используют TechTrend CRM
          </p>
          <motion.button
            whileHover={{ scale: 1.05, y: -3, boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/register')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#fff', color: colors.greenPrimary, border: 'none', borderRadius: 14, padding: '18px 40px', fontSize: 17, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
          >
            Начать работу <ChevronRight size={20} />
          </motion.button>
        </motion.div>
      </section>

      <footer style={{ background: colors.textDark, color: colors.beigeCreama, padding: '48px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: colors.greenPastel, fontWeight: 700, fontSize: 18 }}>
            <LogoIcon />
            TechTrend CRM
          </div>
          <p style={{ color: 'rgba(241,236,230,0.6)', fontSize: 14 }}>© 2026 TechTrend CRM. Все права защищены.</p>
        </div>
      </footer>

      <style>{`
        @media (max-width: 900px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
          section > div > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

export default LandingPage

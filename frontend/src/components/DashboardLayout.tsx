import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  LayoutDashboard,
  Building2,
  Users,
  Sparkles,
  BarChart3,
  Settings,
  CreditCard,
  ClipboardList,
  Briefcase,
  Bell,
  ChevronDown,
  Home,
  LogOut,
  Search,
  MessageSquare,
} from 'lucide-react'
import { colors, fontFamily } from '../theme'
import { markNotificationRead } from '../api'
import { useDashboardContext } from '../context/useDashboardContext'

const LogoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

type NavItem = {
  path: string
  label: string
  icon: typeof LayoutDashboard
  exact?: boolean
  roles?: string[]
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Дашборд', icon: LayoutDashboard, exact: true },
  { path: '/dashboard/apartments', label: 'Шахматка', icon: Building2 },
  { path: '/dashboard/clients', label: 'Клиенты', icon: Users },
  { path: '/dashboard/interactions', label: 'Касания', icon: MessageSquare },
  { path: '/dashboard/deals', label: 'Сделки', icon: Briefcase },
  { path: '/dashboard/ai', label: 'AI-модуль', icon: Sparkles },
  { path: '/dashboard/analytics', label: 'Аналитика', icon: BarChart3 },
  { path: '/dashboard/subscription', label: 'Подписка', icon: CreditCard },
  { path: '/dashboard/reports', label: 'Отчеты', icon: ClipboardList, roles: ['ADMIN', 'DIRECTOR'] },
  { path: '/dashboard/team', label: 'Команда', icon: Users, roles: ['ADMIN'] },
  { path: '/dashboard/profile', label: 'Настройки', icon: Settings },
]

const pageTitles: Record<string, string> = {
  '/dashboard': 'Дашборд',
  '/dashboard/apartments': 'Шахматка',
  '/dashboard/clients': 'Клиенты',
  '/dashboard/interactions': 'Касания и звонки',
  '/dashboard/deals': 'Сделки',
  '/dashboard/ai': 'AI-модуль',
  '/dashboard/analytics': 'Аналитика',
  '/dashboard/subscription': 'Подписка',
  '/dashboard/reports': 'Отчеты',
  '/dashboard/team': 'Команда',
  '/dashboard/profile': 'Настройки',
}

export function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, notifications, unreadCount, refreshNotifications } = useDashboardContext()

  const currentTitle = pageTitles[location.pathname] || 'Дашборд'
  const isActive = (path: string, exact?: boolean) => (exact ? location.pathname === path : location.pathname === path)

  const visibleNav = navItems.filter((item) => !item.roles || item.roles.includes(user?.role ?? 'MANAGER'))

  async function handleMarkRead(id: number) {
    await markNotificationRead(id)
    await refreshNotifications()
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.beigeLight, fontFamily }}>
      <motion.aside
        initial={false}
        style={{
          width: 272,
          background: colors.beigeCreama,
          borderRight: `1px solid rgba(181,169,154,0.25)`,
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          height: '100vh',
          zIndex: 50,
          boxShadow: '4px 0 24px rgba(31,31,26,0.05)',
          overflowY: 'auto',
        }}
      >
        <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid rgba(181,169,154,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ color: colors.greenPrimary }}>
              <LogoIcon />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: colors.greenPrimary, letterSpacing: -0.5 }}>
                TechTrend CRM
              </div>
              <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>Платформа для застройщиков</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 24px 8px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: colors.textSecondary, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Навигация
          </span>
        </div>

        <nav style={{ flex: 1, padding: '0 12px' }}>
          {visibleNav.map((item) => {
            const active = isActive(item.path, item.exact)
            return (
              <motion.button
                key={item.path}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 12,
                  marginBottom: 4,
                  background: active ? 'rgba(62,107,79,0.12)' : 'transparent',
                  color: active ? colors.greenPrimary : colors.textSecondary,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: active ? 600 : 500,
                  fontSize: 15,
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = colors.beigeLight
                    e.currentTarget.style.color = colors.textDark
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = colors.textSecondary
                  }
                }}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: 3, background: colors.greenPrimary, borderRadius: '0 3px 3px 0' }}
                  />
                )}
                <item.icon size={20} />
                <span>{item.label}</span>
                {active && (
                  <motion.div
                    layoutId="sidebar-dot"
                    style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: colors.greenPrimary }}
                  />
                )}
              </motion.button>
            )
          })}
        </nav>

        <div style={{ padding: '16px 12px 24px', borderTop: '1px solid rgba(181,169,154,0.2)' }}>
          <motion.button
            whileHover={{ x: 3 }}
            onClick={() => navigate('/')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 12,
              background: 'transparent',
              color: colors.textSecondary,
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              fontWeight: 500,
              fontSize: 15,
              transition: 'all 0.2s',
              marginBottom: 4,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.beigeLight
              e.currentTarget.style.color = colors.textDark
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = colors.textSecondary
            }}
          >
            <Home size={20} />
            <span>На главную</span>
          </motion.button>
          <motion.button
            whileHover={{ x: 3 }}
            onClick={() => {
              localStorage.removeItem('ttcrm_token')
              navigate('/login')
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 12,
              background: 'transparent',
              color: colors.textSecondary,
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              fontWeight: 500,
              fontSize: 15,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.beigeLight
              e.currentTarget.style.color = colors.textDark
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = colors.textSecondary
            }}
          >
            <LogOut size={20} />
            <span>Выйти</span>
          </motion.button>
        </div>
      </motion.aside>

      <div style={{ marginLeft: 272, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            background: 'rgba(241,236,230,0.92)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(181,169,154,0.2)',
            boxShadow: '0 2px 16px rgba(31,31,26,0.06)',
            padding: '0 32px',
            height: 72,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <AnimatePresence mode="wait">
              <motion.h1
                key={currentTitle}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: 22, fontWeight: 800, color: colors.textDark, letterSpacing: -0.5, margin: 0 }}
              >
                {currentTitle}
              </motion.h1>
            </AnimatePresence>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: colors.textSecondary }} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск..."
                  style={{
                    paddingLeft: 40,
                    paddingRight: 16,
                    paddingTop: 10,
                    paddingBottom: 10,
                    border: '1px solid rgba(181,169,154,0.3)',
                    borderRadius: 12,
                    background: colors.beigeLight,
                    fontSize: 14,
                    color: colors.textDark,
                    outline: 'none',
                    width: 220,
                    fontFamily,
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.greenPrimary
                    e.target.style.boxShadow = `0 0 0 4px rgba(62,107,79,0.15)`
                    e.target.style.width = '280px'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(181,169,154,0.3)'
                    e.target.style.boxShadow = 'none'
                    e.target.style.width = '220px'
                  }}
                />
              </div>

              <div style={{ position: 'relative' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setNotifOpen((v) => !v)}
                  style={{
                    position: 'relative',
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: colors.beigeLight,
                    border: '1px solid rgba(181,169,154,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Bell size={18} color={colors.textSecondary} />
                  {unreadCount > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: colors.greenPrimary,
                        border: `2px solid ${colors.beigeCreama}`,
                      }}
                    />
                  )}
                </motion.button>
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 54,
                        width: 360,
                        background: colors.beigeCreama,
                        borderRadius: 16,
                        padding: 16,
                        border: '1px solid rgba(181,169,154,0.3)',
                        boxShadow: '0 20px 40px rgba(31,31,26,0.15)',
                        zIndex: 60,
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 12 }}>Уведомления</div>
                      {notifications.length === 0 ? (
                        <div style={{ fontSize: 13, color: colors.textSecondary }}>Нет новых уведомлений</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto' }}>
                          {notifications.map((n) => (
                            <div key={n.id} style={{ background: colors.beigeLight, borderRadius: 12, padding: 12, border: '1px solid rgba(181,169,154,0.2)' }}>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{n.title}</div>
                              <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6 }}>{n.message}</div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: colors.textSecondary }}>{new Date(n.created_at).toLocaleString()}</span>
                                {!n.is_read && (
                                  <button
                                    onClick={() => void handleMarkRead(n.id)}
                                    style={{ border: 'none', background: 'none', color: colors.greenPrimary, fontWeight: 600, cursor: 'pointer', fontSize: 12 }}
                                  >
                                    Прочитано
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div style={{ position: 'relative' }}>
                <motion.div
                  whileHover={{ background: 'rgba(181,169,154,0.12)' }}
                  onClick={() => setUserMenuOpen((v) => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${colors.greenPrimary}, ${colors.greenSoft})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {(user?.full_name || 'Пользователь').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden-mobile">
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.textDark }}>{user?.full_name || 'Пользователь'}</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>{user?.email || '—'}</div>
                  </div>
                  <ChevronDown size={16} color={colors.textSecondary} style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </motion.div>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 54,
                        width: 200,
                        background: colors.beigeCreama,
                        borderRadius: 16,
                        padding: 8,
                        border: '1px solid rgba(181,169,154,0.3)',
                        boxShadow: '0 12px 32px rgba(31,31,26,0.15)',
                        zIndex: 70,
                      }}
                    >
                      <button
                        onClick={() => {
                          navigate('/dashboard/profile')
                          setUserMenuOpen(false)
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 14px',
                          borderRadius: 10,
                          border: 'none',
                          background: 'transparent',
                          color: colors.textDark,
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = colors.beigeLight)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Settings size={16} /> Профиль
                      </button>
                      <div style={{ height: 1, background: 'rgba(181,169,154,0.15)', margin: '4px 8px' }} />
                      <button
                        onClick={() => {
                          localStorage.removeItem('ttcrm_token')
                          navigate('/login')
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 14px',
                          borderRadius: 10,
                          border: 'none',
                          background: 'transparent',
                          color: colors.danger,
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = colors.beigeLight)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <LogOut size={16} /> Выйти
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

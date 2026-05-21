import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { DollarSign, Home, Users, Target, TrendingUp, Bell } from 'lucide-react'
import { colors, fontFamily } from '../../theme'
import { fetchAnalyticsOverview, fetchClients, fetchDashboardSummary, fetchDeals, fetchDemandForecast } from '../../api'
import type { AnalyticsOverview, Client, DashboardSummary, Deal } from '../../api'
import { useDashboardContext } from '../../context/useDashboardContext'

const stageScore: Record<string, number> = {
  LEAD: 35,
  SELECTION: 55,
  BOOKING: 70,
  MORTGAGE: 78,
  DDU: 85,
  CLOSED: 95,
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: colors.beigeCreama, border: '1px solid rgba(181,169,154,0.3)', borderRadius: 12, padding: '12px 16px', boxShadow: '0 8px 24px rgba(31,31,26,0.12)' }}>
        <p style={{ fontWeight: 700, color: colors.textDark, marginBottom: 8 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <span style={{ fontSize: 13, color: colors.textSecondary }}>{p.name}:</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.textDark }}>{p.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const DashboardHomePage = () => {
  const { notifications } = useDashboardContext()
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month')
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [demand, setDemand] = useState<{ label: string; value: number }[]>([])

  useEffect(() => {
    let active = true
    async function load() {
      const [summaryRes, clientsRes, dealsRes, overviewRes, demandRes] = await Promise.all([
        fetchDashboardSummary(),
        fetchClients(),
        fetchDeals(),
        fetchAnalyticsOverview().catch(() => null),
        fetchDemandForecast().catch(() => ({ points: [] })),
      ])
      if (!active) return
      setSummary(summaryRes)
      setClients(clientsRes)
      setDeals(dealsRes)
      setOverview(overviewRes)
      setDemand(demandRes.points ?? [])
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const topClients = useMemo(() => {
    const scoreMap = new Map<number, number>()
    deals.forEach((deal) => {
      const score = stageScore[deal.stage] ?? 40
      scoreMap.set(deal.client_id, Math.max(score, scoreMap.get(deal.client_id) ?? 0))
    })
    return clients
      .map((client) => ({
        ...client,
        score: scoreMap.get(client.id) ?? 40,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }, [clients, deals])

  const stats = [
    {
      label: 'Общая выручка',
      value: summary ? `${(summary.total_revenue / 1_000_000).toFixed(1)}M ₽` : '—',
      change: '+12.5%',
      positive: true,
      icon: <DollarSign size={24} />,
      sub: 'за текущий год',
    },
    {
      label: 'Продано квартир',
      value: summary ? summary.sold_apartments : '—',
      change: '+8 за месяц',
      positive: true,
      icon: <Home size={24} />,
      sub: summary ? `из ${summary.total_apartments}` : '—',
    },
    {
      label: 'Активных клиентов',
      value: summary ? summary.total_clients : '—',
      change: '+24 за неделю',
      positive: true,
      icon: <Users size={24} />,
      sub: 'в базе',
    },
    {
      label: 'Конверсия',
      value: overview ? `${overview.conversion_rate}%` : '—',
      change: '+5.2%',
      positive: true,
      icon: <Target size={24} />,
      sub: 'средний показатель',
    },
  ]

  return (
    <div style={{ fontFamily }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4, background: colors.beigeCreama, borderRadius: 12, padding: 4, border: '1px solid rgba(181,169,154,0.2)' }}>
            {[{ val: 'month', label: 'Месяц' }, { val: 'quarter', label: 'Квартал' }, { val: 'year', label: 'Год' }].map((opt) => (
              <motion.button
                key={opt.val}
                whileTap={{ scale: 0.96 }}
                onClick={() => setPeriod(opt.val as any)}
                style={{ padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: period === opt.val ? colors.greenPrimary : 'transparent', color: period === opt.val ? '#fff' : colors.textSecondary, transition: 'all 0.2s' }}
              >
                {opt.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 20, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            whileHover={{ y: -4, boxShadow: '0 12px 36px rgba(62,107,79,0.13)' }}
            style={{
              background: i === 0
                ? `linear-gradient(135deg, ${colors.greenPrimary} 0%, ${colors.greenSoft} 100%)`
                : colors.beigeCreama,
              borderRadius: 20, padding: i === 0 ? '28px 32px' : '24px',
              border: '1px solid rgba(181,169,154,0.2)',
              boxShadow: '0 4px 20px rgba(31,31,26,0.07)',
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              display: 'flex', flexDirection: i === 0 ? 'row' : 'column',
              alignItems: i === 0 ? 'center' : 'flex-start',
              gap: i === 0 ? 24 : 0,
              color: i === 0 ? '#fff' : colors.textDark,
            }}
          >
            {i === 0 ? (
              <>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.85, marginBottom: 12 }}>{s.label}</div>
                  <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ marginTop: 8, fontSize: 14, opacity: 0.85 }}>{s.sub}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {s.icon}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '6px 12px' }}>
                    <TrendingUp size={14} />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{s.change}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(62,107,79,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.greenPrimary, marginBottom: 16 }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: colors.textDark, letterSpacing: -1, marginBottom: 6 }}>{s.value}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <TrendingUp size={12} color={colors.greenPrimary} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: colors.greenPrimary }}>{s.change}</span>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 28 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ background: colors.beigeCreama, borderRadius: 20, padding: '24px 28px', border: '1px solid rgba(181,169,154,0.2)', boxShadow: '0 4px 20px rgba(31,31,26,0.07)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h3 style={{ fontWeight: 700, color: colors.textDark, fontSize: 18, letterSpacing: -0.3, marginBottom: 4 }}>Динамика спроса</h3>
              <p style={{ fontSize: 13, color: colors.textSecondary }}>Формируется по бронированиям за 7 дней</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={demand} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.greenPrimary} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={colors.greenPrimary} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(181,169,154,0.2)" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: colors.textSecondary }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: colors.textSecondary }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" name="Спрос" stroke={colors.greenPrimary} strokeWidth={2.5} fill="url(#demandGrad)" dot={{ fill: colors.greenPrimary, r: 4 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          style={{ background: colors.beigeCreama, borderRadius: 20, padding: '24px 28px', border: '1px solid rgba(181,169,154,0.2)', boxShadow: '0 4px 20px rgba(31,31,26,0.07)' }}
        >
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, color: colors.textDark, fontSize: 18, letterSpacing: -0.3, marginBottom: 4 }}>Конверсия по этапам</h3>
            <p style={{ fontSize: 13, color: colors.textSecondary }}>Сводка по текущим сделкам</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { name: 'Лиды', value: deals.filter((d) => d.stage === 'LEAD').length },
              { name: 'Подбор', value: deals.filter((d) => d.stage === 'SELECTION').length },
              { name: 'Бронь', value: deals.filter((d) => d.stage === 'BOOKING').length },
              { name: 'Ипотека', value: deals.filter((d) => d.stage === 'MORTGAGE').length },
              { name: 'ДДУ', value: deals.filter((d) => d.stage === 'DDU').length },
              { name: 'Сделка', value: deals.filter((d) => d.stage === 'CLOSED').length },
            ]} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(181,169,154,0.2)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: colors.textSecondary }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: colors.textSecondary }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Сделки" fill={colors.greenPrimary} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          style={{ background: colors.beigeCreama, borderRadius: 20, padding: '24px', border: '1px solid rgba(181,169,154,0.2)', boxShadow: '0 4px 20px rgba(31,31,26,0.07)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontWeight: 700, color: colors.textDark, fontSize: 18, letterSpacing: -0.3, marginBottom: 2 }}>Топ клиенты</h3>
              <p style={{ fontSize: 13, color: colors.textSecondary }}>По готовности к покупке</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topClients.map((client, i) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.08 }}
                whileHover={{ x: 4, background: colors.beigeCreama + 'dd' }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  background: colors.beigeLight, borderRadius: 14, cursor: 'pointer',
                  transition: 'all 0.25s', border: '1px solid rgba(181,169,154,0.15)',
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg, ${colors.greenPrimary}, ${colors.greenSoft})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {client.full_name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: colors.textDark, fontSize: 14, marginBottom: 3 }}>{client.full_name}</div>
                  <div style={{ fontSize: 12, color: colors.textSecondary }}>{client.email || '—'}</div>
                  <div style={{ marginTop: 6, height: 4, background: 'rgba(181,169,154,0.2)', borderRadius: 4, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${client.score}%` }}
                      transition={{ delay: 0.7 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                      style={{ height: '100%', background: `linear-gradient(90deg, ${colors.greenPrimary}, ${colors.greenPastel})`, borderRadius: 4 }}
                    />
                  </div>
                </div>
                <div style={{ padding: '6px 12px', borderRadius: 10, fontWeight: 700, fontSize: 14, background: 'rgba(62,107,79,0.12)', color: colors.greenPrimary }}>
                  {client.score}%
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          style={{ background: colors.beigeCreama, borderRadius: 20, padding: '24px', border: '1px solid rgba(181,169,154,0.2)', boxShadow: '0 4px 20px rgba(31,31,26,0.07)' }}
        >
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, color: colors.textDark, fontSize: 18, letterSpacing: -0.3, marginBottom: 2 }}>Последние события</h3>
            <p style={{ fontSize: 13, color: colors.textSecondary }}>Сигналы и уведомления системы</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.slice(0, 5).map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.08 }}
                whileHover={{ x: 4 }}
                style={{
                  display: 'flex', gap: 14, padding: '14px 16px',
                  background: colors.beigeLight, borderRadius: 14,
                  border: '1px solid rgba(181,169,154,0.15)', transition: 'all 0.25s',
                  borderLeft: `3px solid ${n.is_read ? colors.beigeDeep : colors.greenPrimary}`,
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(62,107,79,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.greenPrimary, flexShrink: 0 }}>
                  <Bell size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: colors.textDark, fontSize: 14, marginBottom: 3 }}>{n.title}</div>
                  <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: `${colors.textSecondary}99` }}>{new Date(n.created_at).toLocaleString()}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default DashboardHomePage

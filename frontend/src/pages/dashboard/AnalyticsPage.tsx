import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Calendar, TrendingDown, TrendingUp } from 'lucide-react'
import { colors, fontFamily } from '../../theme'
import {
  createAnalyticsRun,
  deleteAnalyticsRun,
  fetchAnalyticsOverview,
  fetchAnalyticsRuns,
  fetchDemandForecast,
  updateAnalyticsRun,
  type AnalyticsOverview,
  type AnalyticsRun,
} from '../../api'
import { useDashboardContext } from '../../context/useDashboardContext'

const segmentData = [
  { name: '1-к', value: 28, color: colors.greenPrimary },
  { name: '2-к', value: 38, color: colors.greenSoft },
  { name: '3-к', value: 24, color: colors.greenPastel },
  { name: '4-к+', value: 10, color: colors.beigeDeep },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: colors.beigeCreama, border: '1px solid rgba(181,169,154,0.3)', borderRadius: 12, padding: '12px 16px', boxShadow: '0 8px 24px rgba(31,31,26,0.12)' }}>
      <p style={{ fontWeight: 700, color: colors.textDark, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ fontSize: 13, color: colors.textSecondary }}>{p.name}:</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.textDark }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

const AnalyticsPage = () => {
  const { user } = useDashboardContext()
  const isPro = user?.subscription?.plan === 'pro'
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [demand, setDemand] = useState<{ label: string; value: number }[]>([])
  const [runs, setRuns] = useState<AnalyticsRun[]>([])
  const [scope, setScope] = useState<'internal' | 'external'>('internal')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [notes, setNotes] = useState('')
  const [editingRun, setEditingRun] = useState<AnalyticsRun | null>(null)
  const [error, setError] = useState<string | null>(null)
  const noData =
    !!user?.subscription &&
    user.subscription.status === 'active' &&
    overview !== null &&
    runs.length === 0 &&
    (overview?.conversion_rate ?? 0) === 0 &&
    (demand.length === 0 || demand.every((p) => p.value === 0))

  useEffect(() => {
    let active = true
    async function load() {
      const [overviewRes, demandRes, runsRes] = await Promise.all([
        fetchAnalyticsOverview().catch(() => null),
        fetchDemandForecast().catch(() => ({ points: [] })),
        fetchAnalyticsRuns().catch(() => []),
      ])
      if (!active) return
      setOverview(overviewRes)
      setDemand(demandRes.points ?? [])
      setRuns(runsRes)
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const kpiCards = useMemo(
    () => [
      { label: 'Конверсия в сделку', value: `${overview?.conversion_rate ?? 0}%`, change: '+2.1%', positive: true },
      { label: 'Ср. цикл продаж', value: `${overview?.avg_sale_cycle_days ?? 0} дней`, change: '-4 дня', positive: true },
      { label: 'Повторные контакты', value: `${overview?.repeat_contacts ?? 0}%`, change: '+3%', positive: true },
      { label: 'Рейтинг проекта', value: `${overview?.project_rating ?? 0}/5`, change: '+0.2', positive: true },
    ],
    [overview],
  )

  async function runAnalysis() {
    if (!user?.subscription || user.subscription.status !== 'active') return
    setError(null)
    try {
      const newRun = await createAnalyticsRun({
        scope,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        notes: notes || undefined,
      })
      const updated = await fetchAnalyticsRuns()
      setRuns(updated)
      setNotes('')
      setEditingRun(null)
      if (!runs.find((r) => r.id === newRun.id)) {
        setRuns((prev) => [newRun, ...prev])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка запуска анализа')
    }
  }

  async function saveNotes() {
    if (!editingRun) return
    await updateAnalyticsRun(editingRun.id, { notes })
    const updated = await fetchAnalyticsRuns()
    setRuns(updated)
    setEditingRun(null)
    setNotes('')
  }

  async function removeRun(runId: number) {
    await deleteAnalyticsRun(runId)
    const updated = await fetchAnalyticsRuns()
    setRuns(updated)
  }

  return (
    <div style={{ fontFamily }}>
      {error && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: '#fde8e8', border: '1px solid #efc4c4', color: colors.danger }}>
          {error}
        </div>
      )}
      {(!user?.subscription || user.subscription.status !== 'active') && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(141,140,135,0.15)', color: colors.textSecondary }}>
          Для аналитики нужна активная подписка. Администратор может активировать тариф.
        </div>
      )}
      {noData && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(62,107,79,0.08)', color: colors.textSecondary }}>
          Пока нет данных для аналитики. Добавьте клиентов, сделки или бронирования, чтобы построить отчёты.
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={18} color={colors.textSecondary} />
          <div style={{ display: 'flex', gap: 4, background: colors.beigeCreama, borderRadius: 12, padding: 4, border: '1px solid rgba(181,169,154,0.2)' }}>
            {[
              { val: 'internal', label: 'Внутренняя' },
              { val: 'external', label: 'Внешняя' },
            ].map((opt) => (
              <motion.button
                key={opt.val}
                whileTap={{ scale: 0.96 }}
                disabled={opt.val === 'external' && !isPro}
                onClick={() => setScope(opt.val as 'internal' | 'external')}
                style={{
                  padding: '8px 20px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: opt.val === 'external' && !isPro ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  background: scope === opt.val ? colors.greenPrimary : 'transparent',
                  color: scope === opt.val ? '#fff' : colors.textSecondary,
                  opacity: opt.val === 'external' && !isPro ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {opt.label}
              </motion.button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>
            С даты
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeCreama }} />
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>
            По дату
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeCreama }} />
          </label>
          <motion.button
            whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(62,107,79,0.35)' }} whileTap={{ scale: 0.97 }}
            onClick={() => void runAnalysis()}
            style={{ background: colors.greenPrimary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            Показать анализ
          </motion.button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -3 }}
            style={{ background: colors.beigeCreama, borderRadius: 16, padding: '20px 22px', border: '1px solid rgba(181,169,154,0.2)', boxShadow: '0 4px 16px rgba(31,31,26,0.07)' }}
          >
            <div style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 500, marginBottom: 10 }}>{kpi.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: colors.textDark, letterSpacing: -1, marginBottom: 10 }}>{kpi.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {kpi.positive ? <TrendingUp size={14} color={colors.greenPrimary} /> : <TrendingDown size={14} color="#ef4444" />}
              <span style={{ fontSize: 12, fontWeight: 600, color: kpi.positive ? colors.greenPrimary : '#ef4444' }}>{kpi.change}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 20 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ background: colors.beigeCreama, borderRadius: 20, padding: '24px 28px', border: '1px solid rgba(181,169,154,0.2)', boxShadow: '0 4px 20px rgba(31,31,26,0.07)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 18, color: colors.textDark, letterSpacing: -0.3, marginBottom: 4 }}>Спрос по дням</h3>
              <p style={{ fontSize: 13, color: colors.textSecondary }}>Данные по бронированиям</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={demand} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="anaGrad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.greenPrimary} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={colors.greenPrimary} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(181,169,154,0.2)" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: colors.textSecondary }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: colors.textSecondary }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" name="Спрос" stroke={colors.greenPrimary} strokeWidth={2.5} fill="url(#anaGrad1)" dot={{ fill: colors.greenPrimary, r: 4 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          style={{ background: colors.beigeCreama, borderRadius: 20, padding: '24px 28px', border: '1px solid rgba(181,169,154,0.2)', boxShadow: '0 4px 20px rgba(31,31,26,0.07)' }}
        >
          <h3 style={{ fontWeight: 700, fontSize: 18, color: colors.textDark, letterSpacing: -0.3, marginBottom: 4 }}>По типу квартир</h3>
          <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16 }}>Распределение продаж</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={segmentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {segmentData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {segmentData.map((seg, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: colors.beigeLight, borderRadius: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, color: colors.textSecondary }}>{seg.name} кв.</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: colors.textDark }}>{seg.value}%</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        style={{ background: colors.beigeCreama, borderRadius: 20, padding: '24px', border: '1px solid rgba(181,169,154,0.2)', boxShadow: '0 4px 20px rgba(31,31,26,0.07)' }}
      >
        <h3 style={{ fontWeight: 700, fontSize: 18, color: colors.textDark, letterSpacing: -0.3, marginBottom: 12 }}>История анализов</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12, fontSize: 12, color: colors.textSecondary }}>
          <div>Сводка</div>
          <div>Период</div>
          <div>Тип</div>
          <div>Заметка</div>
          <div>Действия</div>
        </div>
        {runs.map((run) => (
          <div key={run.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(181,169,154,0.15)' }}>
            <div style={{ fontSize: 13, color: colors.textDark }}>{run.summary}</div>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>{run.date_from || '—'} / {run.date_to || '—'}</div>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>{run.scope === 'external' ? 'Внешняя' : 'Внутренняя'}</div>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>{run.notes || '—'}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setEditingRun(run); setNotes(run.notes ?? '') }}
                style={{ border: 'none', background: 'none', color: colors.greenPrimary, cursor: 'pointer', fontWeight: 600 }}
              >
                Править
              </button>
              <button
                onClick={() => void removeRun(run.id)}
                style={{ border: 'none', background: 'none', color: colors.danger, cursor: 'pointer', fontWeight: 600 }}
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
        <AnimatePresence>
          {editingRun && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ marginTop: 16, padding: 16, borderRadius: 14, background: colors.beigeLight, border: '1px solid rgba(181,169,154,0.2)' }}
            >
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Заметка к анализу #{editingRun.id}</div>
              <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 600, color: colors.textDark }}>
                Заметка
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: '100%', minHeight: 80, padding: 12, border: '1px solid rgba(181,169,154,0.3)', borderRadius: 12, background: colors.beigeCreama }} />
              </label>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => void saveNotes()} style={{ border: 'none', borderRadius: 10, padding: '10px 14px', background: colors.greenPrimary, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  Сохранить
                </button>
                <button onClick={() => { setEditingRun(null); setNotes('') }} style={{ border: 'none', borderRadius: 10, padding: '10px 14px', background: colors.beigeDeep, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  Отмена
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default AnalyticsPage

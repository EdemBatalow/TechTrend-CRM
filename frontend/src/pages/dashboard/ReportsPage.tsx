import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Calendar } from 'lucide-react'
import { colors, fontFamily } from '../../theme'
import { fetchAnalyticsReport, fetchAnalyticsOverview, type AnalyticsOverview, type AnalyticsReport } from '../../api'
import { useDashboardContext } from '../../context/useDashboardContext'

const ReportsPage = () => {
  const { user } = useDashboardContext()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [report, setReport] = useState<AnalyticsReport | null>(null)
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)

  useEffect(() => {
    if (user?.role !== 'ADMIN') return
    let active = true
    async function load() {
      const [reportRes, overviewRes] = await Promise.all([
        fetchAnalyticsReport(dateFrom || undefined, dateTo || undefined).catch(() => null),
        fetchAnalyticsOverview().catch(() => null),
      ])
      if (!active) return
      setReport(reportRes)
      setOverview(overviewRes)
    }
    void load()
    return () => {
      active = false
    }
  }, [dateFrom, dateTo, user])

  if (user?.role !== 'ADMIN') {
    return <div style={{ fontFamily, color: colors.textSecondary }}>Доступно только администраторам.</div>
  }

  return (
    <div style={{ fontFamily }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Calendar size={18} color={colors.textSecondary} />
        <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>
          С даты
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeCreama }} />
        </label>
        <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>
          По дату
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeCreama }} />
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: colors.beigeCreama, borderRadius: 20, padding: '24px', border: '1px solid rgba(181,169,154,0.2)', boxShadow: '0 4px 20px rgba(31,31,26,0.07)' }}
        >
          <h3 style={{ marginTop: 0 }}>Отчет за период</h3>
          <p style={{ color: colors.textSecondary }}>{report?.report_period ?? '—'}</p>
          <p>Сделок всего: {report?.deals_total ?? 0}</p>
          <p>Закрыто: {report?.deals_closed ?? 0}</p>
          <p>Конверсия: {report?.conversion_rate ?? 0}%</p>
          <p>Выручка: {report ? (report.revenue_total >= 1_000_000 ? `${(report.revenue_total / 1_000_000).toFixed(1)} млн ₽` : `${report.revenue_total.toLocaleString()} ₽`) : '0 ₽'}</p>
          <p>Топ-менеджер: {report?.top_manager ?? '—'}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: colors.beigeCreama, borderRadius: 20, padding: '24px', border: '1px solid rgba(181,169,154,0.2)', boxShadow: '0 4px 20px rgba(31,31,26,0.07)' }}
        >
          <h3 style={{ marginTop: 0 }}>KPI</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>Конверсия: {overview?.conversion_rate ?? 0}%</div>
            <div>Повторные контакты: {overview?.repeat_contacts ?? 0}%</div>
            <div>Рейтинг проекта: {overview?.project_rating ?? 0}/5</div>
            <div>Средний цикл сделки: {overview?.avg_sale_cycle_days ?? 0} дней</div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ReportsPage

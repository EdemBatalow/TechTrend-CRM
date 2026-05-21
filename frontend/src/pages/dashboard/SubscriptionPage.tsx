import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { CreditCard } from 'lucide-react'
import { colors, fontFamily } from '../../theme'
import { checkoutSubscription, fetchSubscriptionPlans, type SubscriptionPlanInfo } from '../../api'
import { useDashboardContext } from '../../context/useDashboardContext'

const SubscriptionPage = () => {
  const { user, refreshUser } = useDashboardContext()
  const isAdmin = user?.role === 'ADMIN'
  const [plans, setPlans] = useState<SubscriptionPlanInfo[]>([])
  const [planFilter, setPlanFilter] = useState<'all' | 'basic' | 'pro'>('all')

  useEffect(() => {
    let active = true
    async function load() {
      const data = await fetchSubscriptionPlans()
      if (active) setPlans(data)
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  async function handleCheckout(plan: 'basic' | 'pro') {
    await checkoutSubscription(plan)
    await refreshUser()
  }

  const filtered = plans.filter((p) => (planFilter === 'all' ? true : p.code === planFilter))

  const daysLeft = user?.subscription?.renewal_at
    ? Math.max(0, Math.ceil((new Date(user.subscription.renewal_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div style={{ fontFamily }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 20 }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: colors.beigeCreama, borderRadius: 20, padding: '24px', border: '1px solid rgba(181,169,154,0.2)', boxShadow: '0 4px 20px rgba(31,31,26,0.07)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <CreditCard size={20} color={colors.greenPrimary} />
            <h3 style={{ fontWeight: 700, fontSize: 18, color: colors.textDark, letterSpacing: -0.3 }}>Статус подписки</h3>
          </div>
          {user?.subscription?.status === 'active' ? (
            <div style={{ display: 'grid', gap: 8, color: colors.textSecondary }}>
              <div>Тариф: <strong style={{ color: colors.textDark }}>{user.subscription.plan.toUpperCase()}</strong></div>
              <div>AI доступ: <strong style={{ color: colors.textDark }}>{user.subscription.ai_scope === 'external' ? 'Внутренний + внешний' : 'Внутренний'}</strong></div>
              <div>Осталось дней: <strong style={{ color: colors.textDark }}>{daysLeft}</strong></div>
              <div>Действует до: <strong style={{ color: colors.textDark }}>{user.subscription.renewal_at ? new Date(user.subscription.renewal_at).toLocaleDateString() : '—'}</strong></div>
            </div>
          ) : (
            <p style={{ color: colors.textSecondary }}>Подписка не активна. Администратор может активировать тариф.</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: colors.beigeCreama, borderRadius: 20, padding: '24px', border: '1px solid rgba(181,169,154,0.2)', boxShadow: '0 4px 20px rgba(31,31,26,0.07)' }}
        >
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Фильтр тарифов</div>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as 'all' | 'basic' | 'pro')}
            style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }}
          >
            <option value="all">Все</option>
            <option value="basic">Базовый</option>
            <option value="pro">Pro</option>
          </select>
          {!isAdmin && (
            <p style={{ marginTop: 16, color: colors.textSecondary }}>
              Оплату подписки выполняет администратор. После активации всем сотрудникам будет доступен AI-модуль.
            </p>
          )}
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {filtered.map((plan) => (
          <motion.div
            key={plan.code}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: colors.beigeCreama, borderRadius: 20, padding: '24px', border: '1px solid rgba(181,169,154,0.2)', boxShadow: '0 4px 20px rgba(31,31,26,0.07)' }}
          >
            <h3 style={{ margin: '0 0 10px' }}>{plan.title}</h3>
            <div style={{ fontSize: 26, fontWeight: 800, color: colors.greenPrimary, marginBottom: 12 }}>{plan.price} ₽ / {plan.period_days} дн.</div>
            <ul style={{ paddingLeft: 16, color: colors.textSecondary }}>
              {plan.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
            {isAdmin && (
              <motion.button
                whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(62,107,79,0.35)' }} whileTap={{ scale: 0.97 }}
                onClick={() => void handleCheckout(plan.code)}
                style={{ marginTop: 16, background: colors.greenPrimary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(62,107,79,0.3)' }}
              >
                {user?.subscription?.plan === plan.code && user.subscription.status === 'active' ? 'Продлить' : 'Активировать'}
              </motion.button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default SubscriptionPage

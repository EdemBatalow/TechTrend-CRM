import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Calendar, Filter, Plus, X } from 'lucide-react'
import { colors, fontFamily } from '../../theme'
import {
  assignDeal,
  createDeal,
  deleteDeal,
  fetchApartments,
  fetchClients,
  fetchDeals,
  fetchUsers,
  updateDeal,
  updateDealStage,
  type Apartment,
  type Client,
  type Deal,
  type DealStage,
  type User,
} from '../../api'
import { useDashboardContext } from '../../context/useDashboardContext'

const dealStages: DealStage[] = ['LEAD', 'SELECTION', 'BOOKING', 'MORTGAGE', 'DDU', 'CLOSED']
const stageLabel: Record<DealStage, string> = {
  LEAD: 'Лид',
  SELECTION: 'Подбор',
  BOOKING: 'Бронь',
  MORTGAGE: 'Ипотека',
  DDU: 'ДДУ',
  CLOSED: 'Закрыта',
}

type DealFormState = {
  stage: DealStage
  amount: number
  client_id: number
  apartment_id?: number
  expected_close_date?: string
  notes?: string
}

const DealsPage = () => {
  const { user } = useDashboardContext()
  const isManager = user?.role === 'MANAGER'
  const isAdmin = user?.role === 'ADMIN'
  const [deals, setDeals] = useState<Deal[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [team, setTeam] = useState<User[]>([])
  const [stageFilter, setStageFilter] = useState<DealStage | 'all'>('all')
  const [managerFilter, setManagerFilter] = useState<number | 'all'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Deal | null>(null)
  const [form, setForm] = useState<DealFormState>({ stage: 'LEAD', amount: 0, client_id: 0 })

  useEffect(() => {
    let active = true
    async function load() {
      const [dealsRes, clientsRes, apartmentsRes, usersRes] = await Promise.all([
        fetchDeals(stageFilter === 'all' ? undefined : stageFilter),
        fetchClients(),
        fetchApartments(),
        fetchUsers().catch(() => []),
      ])
      if (!active) return
      setDeals(dealsRes)
      setClients(clientsRes)
      setApartments(apartmentsRes)
      setTeam(usersRes)
    }
    void load()
    return () => {
      active = false
    }
  }, [stageFilter])

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const managerMatch = managerFilter === 'all' ? true : deal.manager_id === managerFilter
      const createdAt = new Date(deal.created_at)
      const fromMatch = dateFrom ? createdAt >= new Date(dateFrom) : true
      const toMatch = dateTo ? createdAt <= new Date(dateTo) : true
      return managerMatch && fromMatch && toMatch
    })
  }, [deals, managerFilter, dateFrom, dateTo])

  function openCreate() {
    setEditing(null)
    setForm({ stage: 'LEAD', amount: 0, client_id: 0 })
    setModalOpen(true)
  }

  function openEdit(deal: Deal) {
    setEditing(deal)
    setForm({
      stage: deal.stage,
      amount: deal.amount ?? 0,
      client_id: deal.client_id,
      apartment_id: deal.apartment_id,
      expected_close_date: deal.expected_close_date,
      notes: deal.notes,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!isManager) return
    if (editing) {
      await updateDeal(editing.id, {
        amount: form.amount,
        apartment_id: form.apartment_id || undefined,
        expected_close_date: form.expected_close_date || undefined,
        notes: form.notes || undefined,
      })
    } else {
      if (!form.client_id) return
      await createDeal({
        stage: form.stage,
        amount: form.amount,
        client_id: form.client_id,
        manager_id: user?.id ?? 0,
        apartment_id: form.apartment_id || undefined,
        expected_close_date: form.expected_close_date || undefined,
        notes: form.notes || undefined,
      })
    }
    const refreshed = await fetchDeals(stageFilter === 'all' ? undefined : stageFilter)
    setDeals(refreshed)
    setModalOpen(false)
  }

  async function handleDelete(deal: Deal) {
    await deleteDeal(deal.id)
    const refreshed = await fetchDeals(stageFilter === 'all' ? undefined : stageFilter)
    setDeals(refreshed)
  }

  async function handleAssign(dealId: number, managerId: number) {
    await assignDeal(dealId, managerId)
    const refreshed = await fetchDeals(stageFilter === 'all' ? undefined : stageFilter)
    setDeals(refreshed)
  }

  async function handleStageChange(dealId: number, stage: DealStage) {
    const updated = await updateDealStage(dealId, stage)
    setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
  }

  return (
    <div style={{ fontFamily }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Filter size={18} color={colors.textSecondary} />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as DealStage | 'all')}
            style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeCreama, fontSize: 13, fontWeight: 600 }}
          >
            <option value="all">Все этапы</option>
            {dealStages.map((stage) => (
              <option key={stage} value={stage}>{stageLabel[stage]}</option>
            ))}
          </select>
          {!isManager && (
            <select
              value={managerFilter}
              onChange={(e) => setManagerFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeCreama, fontSize: 13, fontWeight: 600 }}
            >
              <option value="all">Все менеджеры</option>
              {team.filter((t) => t.role === 'MANAGER').map((member) => (
                <option key={member.id} value={member.id}>{member.full_name}</option>
              ))}
            </select>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} color={colors.textSecondary} />
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeCreama }} />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeCreama }} />
          </div>
        </div>
        {isManager && (
          <motion.button
            whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(62,107,79,0.35)' }} whileTap={{ scale: 0.97 }}
            onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.greenPrimary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(62,107,79,0.3)' }}
          >
            <Plus size={16} /> Создать сделку
          </motion.button>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ background: colors.beigeCreama, borderRadius: 20, border: '1px solid rgba(181,169,154,0.2)', boxShadow: '0 4px 20px rgba(31,31,26,0.07)', overflow: 'hidden' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 1.5fr 1.4fr 1.2fr 1.1fr 1.1fr 1.4fr', padding: '16px 24px', borderBottom: '2px solid rgba(181,169,154,0.2)', gap: 12 }}>
          {['ID', 'Клиент', 'Этап', 'Менеджер', 'Сумма', 'Дата', 'Действия'].map((label) => (
            <div key={label} style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {label}
            </div>
          ))}
        </div>
        <div>
          {filteredDeals.map((deal) => (
            <div
              key={deal.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '0.7fr 1.5fr 1.4fr 1.2fr 1.1fr 1.1fr 1.4fr',
                padding: '18px 24px',
                borderBottom: '1px solid rgba(181,169,154,0.15)',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <div style={{ fontWeight: 700, color: colors.textDark }}>#{deal.id}</div>
              <div style={{ color: colors.textSecondary }}>{clients.find((c) => c.id === deal.client_id)?.full_name || `#${deal.client_id}`}</div>
              <div>
                {isManager ? (
                  <select
                    value={deal.stage}
                    onChange={(e) => void handleStageChange(deal.id, e.target.value as DealStage)}
                    style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight, fontSize: 13, fontWeight: 600 }}
                  >
                    {dealStages.map((stage) => (
                      <option key={stage} value={stage}>{stageLabel[stage]}</option>
                    ))}
                  </select>
                ) : (
                  <span style={{ padding: '6px 10px', borderRadius: 10, background: 'rgba(62,107,79,0.12)', color: colors.greenPrimary, fontWeight: 600, fontSize: 12 }}>
                    {stageLabel[deal.stage]}
                  </span>
                )}
              </div>
              <div style={{ color: colors.textSecondary }}>
                {team.find((m) => m.id === deal.manager_id)?.full_name || `#${deal.manager_id}`}
              </div>
              <div style={{ color: colors.textSecondary }}>
                {(deal.amount ?? 0).toLocaleString('ru-RU')} ₽
              </div>
              <div style={{ color: colors.textSecondary }}>{new Date(deal.created_at).toLocaleDateString()}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {isManager && (
                  <>
                    <button onClick={() => openEdit(deal)} style={{ border: 'none', background: 'none', color: colors.greenPrimary, cursor: 'pointer', fontWeight: 600 }}>Изменить</button>
                    <button onClick={() => void handleDelete(deal)} style={{ border: 'none', background: 'none', color: colors.danger, cursor: 'pointer', fontWeight: 600 }}>Удалить</button>
                  </>
                )}
                {isAdmin && (
                  <select
                    value={deal.manager_id}
                    onChange={(e) => void handleAssign(deal.id, Number(e.target.value))}
                    style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight, fontSize: 12, fontWeight: 600 }}
                  >
                    {team.filter((t) => t.role === 'MANAGER').map((member) => (
                      <option key={member.id} value={member.id}>{member.full_name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(31,31,26,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: colors.beigeCreama, borderRadius: 24, padding: 36, width: '100%', maxWidth: 520, boxShadow: '0 32px 80px rgba(31,31,26,0.25)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: colors.textDark, letterSpacing: -0.5 }}>{editing ? 'Изменение сделки' : 'Новая сделка'}</h2>
                  <p style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>Выберите клиента и параметры сделки</p>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => setModalOpen(false)}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: colors.beigeLight, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={18} color={colors.textSecondary} />
                </motion.button>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: colors.textDark }}>
                  Этап
                  <select value={form.stage} onChange={(e) => setForm((prev) => ({ ...prev, stage: e.target.value as DealStage }))}
                    style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }}>
                    {dealStages.map((stage) => <option key={stage} value={stage}>{stageLabel[stage]}</option>)}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: colors.textDark }}>
                  Сумма сделки
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                    placeholder="0"
                    style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: colors.textDark }}>
                  Клиент
                  <select value={form.client_id} onChange={(e) => setForm((prev) => ({ ...prev, client_id: Number(e.target.value) }))}
                    style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }}>
                  <option value={0}>Выберите клиента</option>
                  {clients.map((client) => <option key={client.id} value={client.id}>{client.full_name}</option>)}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: colors.textDark }}>
                  Квартира
                  <select value={form.apartment_id ?? 0} onChange={(e) => setForm((prev) => ({ ...prev, apartment_id: Number(e.target.value) || undefined }))}
                    style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }}>
                  <option value={0}>Квартира (необязательно)</option>
                  {apartments.map((apt) => <option key={apt.id} value={apt.id}>№{apt.number} • {apt.rooms}к</option>)}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: colors.textDark }}>
                  Дата закрытия
                  <input type="date" value={form.expected_close_date ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, expected_close_date: e.target.value }))}
                    style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }} />
                </label>
                <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: colors.textDark }}>
                  Комментарий
                  <textarea value={form.notes ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Комментарий по сделке"
                  style={{ width: '100%', minHeight: 90, padding: 12, border: '1px solid rgba(181,169,154,0.3)', borderRadius: 12, background: colors.beigeLight, fontSize: 14, color: colors.textDark, outline: 'none', fontFamily, boxSizing: 'border-box', resize: 'vertical' }}
                />
                </label>
              </div>

              <motion.button
                whileHover={{ y: -2, boxShadow: '0 10px 28px rgba(62,107,79,0.4)' }} whileTap={{ scale: 0.97 }}
                onClick={() => void handleSave()}
                style={{ width: '100%', background: colors.greenPrimary, color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 16 }}
              >
                {editing ? 'Сохранить изменения' : 'Создать сделку'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DealsPage

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Mail, Phone, Plus, Search, User, X } from 'lucide-react'
import { colors, fontFamily } from '../../theme'
import { createClient, deleteClient, fetchClients, fetchDeals, updateClient, type Client, type Deal } from '../../api'
import { useDashboardContext } from '../../context/useDashboardContext'

type ClientFormState = {
  full_name: string
  phone: string
  email?: string
  source?: string
  notes?: string
}

const stageScore: Record<string, number> = {
  LEAD: 35,
  SELECTION: 55,
  BOOKING: 70,
  MORTGAGE: 78,
  DDU: 85,
  CLOSED: 95,
}

const ClientsPage = () => {
  const { user } = useDashboardContext()
  const isManager = user?.role === 'MANAGER'
  const [clients, setClients] = useState<Client[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [minScore, setMinScore] = useState(0)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState<ClientFormState>({ full_name: '', phone: '' })

  useEffect(() => {
    let active = true
    async function load() {
      const [clientsRes, dealsRes] = await Promise.all([fetchClients(), fetchDeals()])
      if (!active) return
      setClients(clientsRes)
      setDeals(dealsRes)
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const scoreMap = useMemo(() => {
    const map = new Map<number, number>()
    deals.forEach((deal) => {
      const score = stageScore[deal.stage] ?? 40
      map.set(deal.client_id, Math.max(score, map.get(deal.client_id) ?? 0))
    })
    return map
  }, [deals])

  const sources = useMemo(() => {
    const set = new Set(clients.map((c) => c.source).filter(Boolean))
    return ['all', ...Array.from(set)]
  }, [clients])

  const filtered = clients
    .filter((c) => c.full_name.toLowerCase().includes(search.toLowerCase()) || (c.email ?? '').toLowerCase().includes(search.toLowerCase()))
    .filter((c) => (sourceFilter === 'all' ? true : c.source === sourceFilter))
    .filter((c) => (scoreMap.get(c.id) ?? 40) >= minScore)

  function openCreate() {
    setEditing(null)
    setForm({ full_name: '', phone: '', email: '', source: '', notes: '' })
    setModalOpen(true)
  }

  function openEdit(client: Client) {
    setEditing(client)
    setForm({
      full_name: client.full_name,
      phone: client.phone,
      email: client.email,
      source: client.source,
      notes: client.notes,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!isManager) return
    if (editing) {
      await updateClient(editing.id, form)
    } else {
      await createClient(form)
    }
    const data = await fetchClients()
    setClients(data)
    setModalOpen(false)
  }

  async function handleDelete(client: Client) {
    if (!isManager) return
    await deleteClient(client.id)
    const data = await fetchClients()
    setClients(data)
  }

  return (
    <div style={{ fontFamily }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Всего клиентов', value: clients.length, sub: 'В CRM', color: colors.greenPrimary },
          { label: 'Активных лидов', value: deals.filter((d) => d.stage !== 'CLOSED').length, sub: 'В работе', color: colors.greenSoft },
          { label: 'Готовность', value: `${Math.round((Array.from(scoreMap.values()).reduce((s, v) => s + v, 0) / Math.max(1, scoreMap.size)))}%`, sub: 'Средняя оценка', color: colors.greenPastel },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -3 }}
            style={{ background: i === 0 ? `linear-gradient(135deg, ${colors.greenPrimary}, ${colors.greenSoft})` : colors.beigeCreama, borderRadius: 18, padding: '22px 24px', border: i !== 0 ? '1px solid rgba(181,169,154,0.2)' : 'none', boxShadow: '0 4px 20px rgba(31,31,26,0.07)' }}
          >
            <div style={{ fontSize: 12, color: i === 0 ? 'rgba(255,255,255,0.8)' : colors.textSecondary, fontWeight: 500, marginBottom: 10 }}>{item.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1, color: i === 0 ? '#fff' : colors.textDark }}>{item.value}</div>
            <div style={{ fontSize: 12, marginTop: 8, color: i === 0 ? 'rgba(255,255,255,0.7)' : colors.greenPrimary, fontWeight: 500 }}>{item.sub}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: colors.textSecondary }} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск клиентов..."
              style={{ paddingLeft: 40, paddingRight: 16, paddingTop: 11, paddingBottom: 11, border: '1px solid rgba(181,169,154,0.3)', borderRadius: 12, background: colors.beigeCreama, fontSize: 14, color: colors.textDark, outline: 'none', width: 260, fontFamily }}
            />
          </div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            style={{ padding: '11px 16px', borderRadius: 12, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeCreama, fontSize: 13, fontWeight: 600, color: colors.textDark }}
          >
            {sources.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'Все источники' : s}</option>
            ))}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: colors.textSecondary }}>Готовность</span>
            <input type="range" min={0} max={100} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>{minScore}%</span>
          </div>
        </div>
        {isManager && (
          <motion.button
            whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(62,107,79,0.35)' }} whileTap={{ scale: 0.97 }}
            onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.greenPrimary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(62,107,79,0.3)' }}
          >
            <Plus size={16} /> Добавить клиента
          </motion.button>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ background: colors.beigeCreama, borderRadius: 20, border: '1px solid rgba(181,169,154,0.2)', boxShadow: '0 4px 20px rgba(31,31,26,0.07)', overflow: 'hidden' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.3fr 2fr 1.3fr 1fr', padding: '16px 24px', borderBottom: '2px solid rgba(181,169,154,0.2)', gap: 16 }}>
          {['Имя', 'Телефон', 'Email', 'Готовность', 'Действия'].map((label) => (
            <div key={label} style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {label}
            </div>
          ))}
        </div>
        <div>
          {filtered.map((client) => {
            const score = scoreMap.get(client.id) ?? 40
            return (
              <div key={client.id}>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2.2fr 1.3fr 2fr 1.3fr 1fr',
                    padding: '18px 24px',
                    borderBottom: '1px solid rgba(181,169,154,0.15)',
                    gap: 16,
                    alignItems: 'center',
                    cursor: 'pointer',
                    background: expanded === client.id ? colors.beigeLight : 'transparent',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => setExpanded(expanded === client.id ? null : client.id)}
                  onMouseEnter={(e) => { if (expanded !== client.id) e.currentTarget.style.background = colors.beigeLight }}
                  onMouseLeave={(e) => { if (expanded !== client.id) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg, ${colors.greenPrimary}, ${colors.greenSoft})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                      {client.full_name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: colors.textDark, fontSize: 14 }}>{client.full_name}</div>
                      <div style={{ fontSize: 12, color: colors.textSecondary }}>{client.source || '—'}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: colors.textSecondary }}>{client.phone}</div>
                  <div style={{ fontSize: 14, color: colors.textSecondary }}>{client.email || '—'}</div>
                  <div style={{ paddingRight: 16, fontWeight: 700, color: colors.greenPrimary }}>{score}%</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {isManager && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(client) }}
                          style={{ border: 'none', background: 'none', color: colors.greenPrimary, cursor: 'pointer', fontWeight: 600 }}
                        >
                          Изменить
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); void handleDelete(client) }}
                          style={{ border: 'none', background: 'none', color: colors.danger, cursor: 'pointer', fontWeight: 600 }}
                        >
                          Удалить
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
                <AnimatePresence>
                  {expanded === client.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      style={{ overflow: 'hidden', borderBottom: '1px solid rgba(181,169,154,0.15)' }}
                    >
                      <div style={{ padding: '20px 24px 24px', background: colors.beigeLight, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 20 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Заметки</div>
                          <div style={{ fontSize: 14, color: colors.textDark, lineHeight: 1.6 }}>{client.notes || 'Нет заметок'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Источник</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: colors.greenPrimary }}>{client.source || '—'}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.greenPrimary, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                            <Phone size={14} /> Позвонить
                          </motion.button>
                          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', color: colors.textDark, border: `2px solid ${colors.beigeDeep}`, borderRadius: 10, padding: '10px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                            <Mail size={14} /> Написать
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
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
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: colors.textDark, letterSpacing: -0.5 }}>{editing ? 'Изменение клиента' : 'Новый клиент'}</h2>
                  <p style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>Заполните основную информацию</p>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => setModalOpen(false)}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: colors.beigeLight, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={18} color={colors.textSecondary} />
                </motion.button>
              </div>

              {[
                { label: 'Имя и фамилия', placeholder: 'Введите имя...', icon: <User size={16} />, field: 'full_name' },
                { label: 'Телефон', placeholder: '+7 (___) ___-__-__', icon: <Phone size={16} />, field: 'phone' },
                { label: 'Email', placeholder: 'email@example.com', icon: <Mail size={16} />, field: 'email' },
                { label: 'Источник', placeholder: 'Instagram, сайт, рекомендации', icon: <Search size={16} />, field: 'source' },
              ].map((field) => (
                <div key={field.field} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.textDark, marginBottom: 8 }}>{field.label}</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: colors.textSecondary }}>{field.icon}</span>
                    <input
                      placeholder={field.placeholder}
                      value={(form as any)[field.field] ?? ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, [field.field]: e.target.value }))}
                      style={{ width: '100%', paddingLeft: 42, paddingRight: 16, paddingTop: 12, paddingBottom: 12, border: '1px solid rgba(181,169,154,0.3)', borderRadius: 12, background: colors.beigeLight, fontSize: 14, color: colors.textDark, outline: 'none', fontFamily, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              ))}

              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.textDark, marginBottom: 8 }}>Заметки</label>
              <textarea
                value={form.notes ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                style={{ width: '100%', minHeight: 80, padding: 12, border: '1px solid rgba(181,169,154,0.3)', borderRadius: 12, background: colors.beigeLight, fontSize: 14, color: colors.textDark, outline: 'none', fontFamily, boxSizing: 'border-box', resize: 'vertical', marginBottom: 16 }}
              />

              <motion.button
                whileHover={{ y: -2, boxShadow: '0 10px 28px rgba(62,107,79,0.4)' }} whileTap={{ scale: 0.97 }}
                onClick={() => void handleSave()}
                style={{ width: '100%', background: colors.greenPrimary, color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 8 }}
              >
                {editing ? 'Сохранить изменения' : 'Добавить клиента'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ClientsPage

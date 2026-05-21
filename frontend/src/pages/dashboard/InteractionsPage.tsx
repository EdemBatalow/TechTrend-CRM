import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Calendar, MessageSquare, Phone, Plus, Search, Users, Clock } from 'lucide-react'
import { colors, fontFamily } from '../../theme'
import { createInteraction, deleteInteraction, fetchInteractions, fetchClients, updateInteraction, type Interaction, type Client } from '../../api'
import { useDashboardContext } from '../../context/useDashboardContext'

type InteractionFormState = {
  type: string
  date: string
  description: string
  duration_minutes?: number
  client_id: string
  deal_id?: string
}

const InteractionsPage = () => {
  const { user } = useDashboardContext()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'DIRECTOR'
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Interaction | null>(null)
  const [form, setForm] = useState<InteractionFormState>({ type: 'Звонок', date: new Date().toISOString().slice(0, 16), description: '', client_id: '' })

  const loadData = async () => {
    const [intRes, cliRes] = await Promise.all([fetchInteractions(), fetchClients()])
    setInteractions(intRes)
    setClients(cliRes)
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filtered = interactions.filter((i) => {
    const client = clients.find((c) => c.id === i.client_id)
    const matchesSearch = client?.full_name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || i.type === typeFilter
    return matchesSearch && matchesType
  })

  function openCreate() {
    setEditing(null)
    setForm({ type: 'Звонок', date: new Date().toISOString().slice(0, 16), description: '', client_id: clients[0]?.id.toString() || '' })
    setModalOpen(true)
  }

  function openEdit(item: Interaction) {
    setEditing(item)
    setForm({
      type: item.type,
      date: new Date(item.date).toISOString().slice(0, 16),
      description: item.description,
      duration_minutes: item.duration_minutes,
      client_id: item.client_id.toString(),
      deal_id: item.deal_id?.toString()
    })
    setModalOpen(true)
  }

  async function handleSave() {
    const payload = {
      ...form,
      client_id: parseInt(form.client_id),
      deal_id: form.deal_id ? parseInt(form.deal_id) : undefined,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
      date: new Date(form.date).toISOString()
    }

    if (editing) {
      await updateInteraction(editing.id, payload)
    } else {
      await createInteraction(payload)
    }
    await loadData()
    setModalOpen(false)
  }

  async function handleDelete(id: number) {
    if (!isAdmin) return
    if (!confirm('Удалить запись о взаимодействии?')) return
    await deleteInteraction(id)
    await loadData()
  }

  return (
    <div style={{ fontFamily }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 12 }}>
           <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: colors.textSecondary }} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по описанию или клиенту..."
              style={{ paddingLeft: 40, paddingRight: 16, paddingTop: 11, paddingBottom: 11, border: '1px solid rgba(181,169,154,0.3)', borderRadius: 12, background: colors.beigeCreama, fontSize: 14, color: colors.textDark, outline: 'none', width: 320, fontFamily }}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: '11px 16px', borderRadius: 12, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeCreama, fontSize: 13, fontWeight: 600, color: colors.textDark }}
          >
            <option value="all">Все типы</option>
            <option value="Звонок">Звонки</option>
            <option value="Встреча">Встречи</option>
            <option value="Email">Email</option>
            <option value="Показ">Показы</option>
          </select>
        </div>
        <motion.button
          whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
          onClick={openCreate}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.greenPrimary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        >
          <Plus size={16} /> Добавить касание
        </motion.button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filtered.map((item) => {
          const client = clients.find(c => c.id === item.client_id)
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              style={{ background: colors.beigeCreama, borderRadius: 18, padding: 20, border: '1px solid rgba(181,169,154,0.2)', display: 'flex', gap: 20, alignItems: 'flex-start' }}
            >
              <div style={{ padding: 12, borderRadius: 12, background: 'rgba(62,107,79,0.1)', color: colors.greenPrimary }}>
                {item.type === 'Звонок' ? <Phone size={20}/> : item.type === 'Встреча' ? <Users size={20}/> : <MessageSquare size={20}/>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: colors.textDark }}>{item.type} с {client?.full_name || 'Клиентом'}</div>
                  <div style={{ fontSize: 13, color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} /> {new Date(item.date).toLocaleString('ru-RU')}
                  </div>
                </div>
                <div style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12, lineHeight: 1.5 }}>{item.description}</div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  {item.duration_minutes && (
                    <div style={{ fontSize: 12, color: colors.greenPrimary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {item.duration_minutes} мин.
                    </div>
                  )}
                  <button onClick={() => openEdit(item)} style={{ border: 'none', background: 'none', color: colors.greenPrimary, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Изменить</button>
                  {isAdmin && <button onClick={() => void handleDelete(item.id)} style={{ border: 'none', background: 'none', color: colors.danger, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Удалить</button>}
                </div>
              </div>
            </motion.div>
          )
        })}
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: colors.textSecondary }}>Ничего не найдено</div>}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(31,31,26,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              style={{ background: colors.beigeCreama, borderRadius: 24, padding: 32, width: '100%', maxWidth: 480 }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ marginBottom: 20 }}>{editing ? 'Изменить запись' : 'Новое взаимодействие'}</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Клиент</label>
                  <select
                    value={form.client_id}
                    onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                    style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #ccc' }}
                  >
                    {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Тип</label>
                    <select
                      value={form.type}
                      onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                      style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #ccc' }}
                    >
                      <option>Звонок</option>
                      <option>Встреча</option>
                      <option>Email</option>
                      <option>Показ</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Длительность (мин)</label>
                    <input
                      type="number"
                      value={form.duration_minutes || ''}
                      onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) }))}
                      style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #ccc' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Дата и время</label>
                  <input
                    type="datetime-local"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #ccc' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Описание</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    style={{ width: '100%', height: 100, padding: 10, borderRadius: 10, border: '1px solid #ccc', resize: 'none' }}
                  />
                </div>

                <button
                  onClick={() => void handleSave()}
                  style={{ background: colors.greenPrimary, color: 'white', border: 'none', padding: 14, borderRadius: 12, fontWeight: 700, cursor: 'pointer', marginTop: 10 }}
                >
                  {editing ? 'Сохранить изменения' : 'Создать запись'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default InteractionsPage

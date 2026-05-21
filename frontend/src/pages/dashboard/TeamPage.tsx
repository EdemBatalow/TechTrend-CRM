import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Plus, Search } from 'lucide-react'
import { colors, fontFamily } from '../../theme'
import {
  assignDeal,
  deleteUser,
  fetchDeals,
  fetchUsers,
  register,
  updateUserRole,
  type Deal,
  type Role,
  type User,
} from '../../api'
import { useDashboardContext } from '../../context/useDashboardContext'

const TeamPage = () => {
  const { user } = useDashboardContext()
  const [team, setTeam] = useState<User[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all')
  const [newUser, setNewUser] = useState({ login: '', full_name: '', email: '', phone: '', password: '', role: 'MANAGER' as Role })
  const [delegation, setDelegation] = useState({ deal_id: 0, manager_id: 0 })

  useEffect(() => {
    if (user?.role !== 'ADMIN') return
    let active = true
    async function load() {
      const [usersRes, dealsRes] = await Promise.all([fetchUsers(), fetchDeals()])
      if (!active) return
      setTeam(usersRes)
      setDeals(dealsRes)
    }
    void load()
    return () => {
      active = false
    }
  }, [user])

  const managers = useMemo(() => team.filter((t) => t.role === 'MANAGER'), [team])

  if (user?.role !== 'ADMIN') {
    return <div style={{ fontFamily, color: colors.textSecondary }}>Доступно только администраторам.</div>
  }

  const filteredTeam = team.filter((member) => {
    const matchSearch = member.full_name.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' ? true : member.role === roleFilter
    return matchSearch && matchRole
  })

  async function handleCreate() {
    await register({ ...newUser })
    const updated = await fetchUsers()
    setTeam(updated)
    setNewUser({ login: '', full_name: '', email: '', phone: '', password: '', role: 'MANAGER' })
  }

  async function handleRoleChange(userId: number, role: Role) {
    await updateUserRole(userId, role)
    const updated = await fetchUsers()
    setTeam(updated)
  }

  async function handleDelete(userId: number) {
    await deleteUser(userId)
    const updated = await fetchUsers()
    setTeam(updated)
  }

  async function handleDelegate() {
    if (!delegation.deal_id || !delegation.manager_id) return
    await assignDeal(delegation.deal_id, delegation.manager_id)
    const updatedDeals = await fetchDeals()
    setDeals(updatedDeals)
  }

  return (
    <div style={{ fontFamily }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 20 }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: colors.beigeCreama, borderRadius: 20, padding: '24px', border: '1px solid rgba(181,169,154,0.2)', boxShadow: '0 4px 20px rgba(31,31,26,0.07)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Добавить сотрудника</div>
            <Plus size={18} color={colors.greenPrimary} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 600, color: colors.textDark }}>
              Логин
              <input placeholder="Логин" value={newUser.login} onChange={(e) => setNewUser((v) => ({ ...v, login: e.target.value }))} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }} />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 600, color: colors.textDark }}>
              ФИО
              <input placeholder="ФИО" value={newUser.full_name} onChange={(e) => setNewUser((v) => ({ ...v, full_name: e.target.value }))} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }} />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 600, color: colors.textDark }}>
              Email
              <input placeholder="Email" value={newUser.email} onChange={(e) => setNewUser((v) => ({ ...v, email: e.target.value }))} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }} />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 600, color: colors.textDark }}>
              Телефон
              <input placeholder="Телефон" value={newUser.phone} onChange={(e) => setNewUser((v) => ({ ...v, phone: e.target.value }))} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }} />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 600, color: colors.textDark }}>
              Пароль
              <input type="password" placeholder="Пароль" value={newUser.password} onChange={(e) => setNewUser((v) => ({ ...v, password: e.target.value }))} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }} />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 600, color: colors.textDark }}>
              Роль
              <select value={newUser.role} onChange={(e) => setNewUser((v) => ({ ...v, role: e.target.value as Role }))} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }}>
                <option value="MANAGER">Менеджер</option>
                <option value="ADMIN">Администратор</option>
              </select>
            </label>
          </div>
          <motion.button
            whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(62,107,79,0.35)' }} whileTap={{ scale: 0.97 }}
            onClick={() => void handleCreate()}
            style={{ marginTop: 16, background: colors.greenPrimary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            Создать сотрудника
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: colors.beigeCreama, borderRadius: 20, padding: '24px', border: '1px solid rgba(181,169,154,0.2)', boxShadow: '0 4px 20px rgba(31,31,26,0.07)' }}
        >
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Делегирование сделок</div>
          <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 600, color: colors.textDark }}>
            Сделка
            <select value={delegation.deal_id} onChange={(e) => setDelegation((v) => ({ ...v, deal_id: Number(e.target.value) }))} style={{ width: '100%', marginBottom: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }}>
              <option value={0}>Выберите сделку</option>
              {deals.map((d) => <option key={d.id} value={d.id}>#{d.id} · {d.stage}</option>)}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 600, color: colors.textDark }}>
            Менеджер
            <select value={delegation.manager_id} onChange={(e) => setDelegation((v) => ({ ...v, manager_id: Number(e.target.value) }))} style={{ width: '100%', marginBottom: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }}>
              <option value={0}>Назначить менеджера</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </label>
          <motion.button
            whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(62,107,79,0.35)' }} whileTap={{ scale: 0.97 }}
            onClick={() => void handleDelegate()}
            style={{ background: colors.greenPrimary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', width: '100%' }}
          >
            Делегировать
          </motion.button>
        </motion.div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <Search size={16} color={colors.textSecondary} />
        <input placeholder="Поиск по ФИО" value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeCreama }} />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | 'all')} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeCreama }}>
          <option value="all">Все роли</option>
          <option value="ADMIN">ADMIN</option>
          <option value="DIRECTOR">DIRECTOR</option>
          <option value="MANAGER">MANAGER</option>
          <option value="AGENT">AGENT</option>
        </select>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: colors.beigeCreama, borderRadius: 20, padding: '16px 20px', border: '1px solid rgba(181,169,154,0.2)', boxShadow: '0 4px 20px rgba(31,31,26,0.07)' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr', gap: 12, fontSize: 12, color: colors.textSecondary, marginBottom: 10 }}>
          <div>ФИО</div>
          <div>Роль</div>
          <div>Email</div>
          <div>Действия</div>
        </div>
        {filteredTeam.map((member) => (
          <div key={member.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(181,169,154,0.15)' }}>
            <div>{member.full_name}</div>
            <select value={member.role} onChange={(e) => void handleRoleChange(member.id, e.target.value as Role)} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }}>
              <option value="MANAGER">MANAGER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <div style={{ color: colors.textSecondary }}>{member.email}</div>
            <button onClick={() => void handleDelete(member.id)} style={{ border: 'none', background: 'none', color: colors.danger, cursor: 'pointer', fontWeight: 600 }}>
              Удалить
            </button>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

export default TeamPage

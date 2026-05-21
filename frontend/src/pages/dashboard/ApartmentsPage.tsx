import { useMemo, useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { DollarSign, Filter, Home, Layers, Plus, X } from 'lucide-react'
import { colors, fontFamily } from '../../theme'
import {
  createApartment,
  deleteApartment,
  fetchDashboardSummary,
  fetchApartments,
  updateApartment,
  updateApartmentStatus,
  type Apartment,
  type ApartmentStatus,
  type DashboardSummary,
} from '../../api'
import { useDashboardContext } from '../../context/useDashboardContext'

const statusConfig: Record<ApartmentStatus, { label: string; bg: string; border: string; text: string; dot: string }> = {
  AVAILABLE: { label: 'Свободно', bg: 'rgba(125,170,130,0.18)', border: '#7DAA82', text: '#3E6B4F', dot: '#3E6B4F' },
  BOOKED: { label: 'Забронировано', bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', text: '#92400e', dot: '#f59e0b' },
  SOLD: { label: 'Продано', bg: 'rgba(239,68,68,0.1)', border: '#ef4444', text: '#991b1b', dot: '#ef4444' },
  RESERVED: { label: 'Резерв', bg: 'rgba(141,140,135,0.12)', border: '#8D8C87', text: '#8D8C87', dot: '#8D8C87' },
  MORTGAGE: { label: 'Ипотека', bg: 'rgba(76,115,156,0.12)', border: '#4C739C', text: '#36516a', dot: '#4C739C' },
}

type ApartmentForm = {
  number: string
  district?: string
  floor: number
  area: number
  rooms: number
  price: number
  status: ApartmentStatus
  section_id: number
}

const ApartmentsPage = () => {
  const { user } = useDashboardContext()
  const isAdmin = user?.role === 'ADMIN'
  const isManager = user?.role === 'MANAGER'
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [selected, setSelected] = useState<Apartment | null>(null)
  const [filter, setFilter] = useState<'all' | ApartmentStatus>('all')
  const [floorFilter, setFloorFilter] = useState<string>('all')
  const [districtFilter, setDistrictFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Apartment | null>(null)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [form, setForm] = useState<ApartmentForm>({
    number: '',
    district: '',
    floor: 1,
    area: 45,
    rooms: 1,
    price: 15000000,
    status: 'AVAILABLE',
    section_id: 1,
  })

  useEffect(() => {
    let active = true
    async function load() {
      const [apartmentsRes, summaryRes] = await Promise.all([
        fetchApartments(),
        fetchDashboardSummary().catch(() => null),
      ])
      if (!active) return
      setApartments(apartmentsRes)
      setSummary(summaryRes)
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const floors = useMemo(() => {
    const unique = Array.from(new Set(apartments.map((a) => a.floor))).sort((a, b) => b - a)
    return unique.length > 0 ? unique : [1]
  }, [apartments])

  const filteredApts = useMemo(() => {
    return apartments.filter((a) => {
      const statusMatch = filter === 'all' || a.status === filter
      const floorMatch = floorFilter === 'all' || a.floor === Number(floorFilter)
      const districtLabel = (a.district ?? '').trim() || 'Без района'
      const districtMatch = districtFilter === 'all' || districtLabel === districtFilter
      return statusMatch && floorMatch && districtMatch
    })
  }, [apartments, filter, floorFilter, districtFilter])

  const districts = useMemo(() => {
    const set = new Set<string>()
    apartments.forEach((apt) => {
      const label = (apt.district ?? '').trim() || 'Без района'
      set.add(label)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'))
  }, [apartments])

  const groupedByDistrict = useMemo(() => {
    const map = new Map<string, Apartment[]>()
    filteredApts.forEach((apt) => {
      const label = (apt.district ?? '').trim() || 'Без района'
      if (!map.has(label)) map.set(label, [])
      map.get(label)!.push(apt)
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'ru'))
  }, [filteredApts])

  const stats = useMemo(() => {
    return Object.keys(statusConfig).reduce((acc, status) => {
      acc[status as ApartmentStatus] = apartments.filter((a) => a.status === status).length
      return acc
    }, {} as Record<ApartmentStatus, number>)
  }, [apartments])

  const totalRevenue = summary?.total_revenue ?? 0

  function openCreate() {
    setEditing(null)
    setForm({ number: '', district: '', floor: 1, area: 45, rooms: 1, price: 15000000, status: 'AVAILABLE', section_id: 1 })
    setModalOpen(true)
  }

  function openEdit(apt: Apartment) {
    setEditing(apt)
    setForm({
      number: apt.number,
      district: apt.district ?? '',
      floor: apt.floor,
      area: apt.area,
      rooms: apt.rooms,
      price: apt.price,
      status: apt.status,
      section_id: apt.section_id,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!isAdmin) return
    if (editing) {
      await updateApartment(editing.id, form)
    } else {
      await createApartment(form)
    }
    const data = await fetchApartments()
    setApartments(data)
    setModalOpen(false)
  }

  async function handleDelete(apt: Apartment) {
    if (!isAdmin) return
    await deleteApartment(apt.id)
    const data = await fetchApartments()
    setApartments(data)
  }

  async function handleStatusChange(apt: Apartment, status: ApartmentStatus) {
    await updateApartmentStatus(apt.id, status)
    const data = await fetchApartments()
    setApartments(data)
  }

  return (
    <div style={{ fontFamily }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {(Object.entries(stats) as [ApartmentStatus, number][]).map(([status, count], i) => {
          const cfg = statusConfig[status]
          const total = apartments.length || 1
          return (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -3 }}
              onClick={() => setFilter(filter === status ? 'all' : status)}
              style={{
                background: filter === status ? cfg.bg : colors.beigeCreama,
                borderRadius: 16, padding: '20px 22px',
                border: `2px solid ${filter === status ? cfg.border : 'rgba(181,169,154,0.2)'}`,
                cursor: 'pointer', transition: 'all 0.25s',
                boxShadow: '0 4px 16px rgba(31,31,26,0.07)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.dot, marginTop: 4 }} />
                <div style={{ fontSize: 24, fontWeight: 800, color: cfg.text, letterSpacing: -1 }}>{count}</div>
              </div>
              <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: colors.textSecondary }}>{cfg.label}</div>
              <div style={{ marginTop: 6, height: 4, background: 'rgba(181,169,154,0.2)', borderRadius: 4 }}>
                <div style={{ height: '100%', background: cfg.dot, borderRadius: 4, width: `${(count / total) * 100}%`, transition: 'width 0.5s' }} />
              </div>
            </motion.div>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Filter size={18} color={colors.textSecondary} />
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ val: 'all', label: 'Все' }, { val: 'AVAILABLE', label: 'Свободные' }, { val: 'BOOKED', label: 'Бронь' }].map((opt) => (
              <motion.button
                key={opt.val}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setFilter(opt.val as any)}
                style={{
                  padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: filter === opt.val ? colors.greenPrimary : colors.beigeLight,
                  color: filter === opt.val ? '#fff' : colors.textSecondary,
                  transition: 'all 0.2s',
                }}
              >
                {opt.label}
              </motion.button>
            ))}
          </div>
          <select
            value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight, color: colors.textDark, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily }}
          >
            <option value="all">Все этажи</option>
            {floors.map((f) => (
              <option key={f} value={f}>{f} этаж</option>
            ))}
          </select>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight, color: colors.textDark, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily }}
          >
            <option value="all">Все районы</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 13, color: colors.textSecondary }}>
            Выручка: <strong style={{ color: colors.greenPrimary }}>₽{(totalRevenue / 1_000_000).toFixed(0)}M</strong>
          </div>
          {isAdmin && (
            <motion.button
              whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(62,107,79,0.35)' }} whileTap={{ scale: 0.97 }}
              onClick={openCreate}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.greenPrimary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(62,107,79,0.3)' }}
            >
              <Plus size={16} /> Добавить
            </motion.button>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{ background: colors.beigeCreama, borderRadius: 20, padding: 28, border: '1px solid rgba(181,169,154,0.2)', boxShadow: '0 4px 20px rgba(31,31,26,0.08)' }}
      >
        <div style={{ display: 'flex', gap: 24, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(181,169,154,0.2)', flexWrap: 'wrap' }}>
          {(Object.entries(statusConfig) as [ApartmentStatus, typeof statusConfig[ApartmentStatus]][]).map(([status, cfg]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: cfg.bg, border: `2px solid ${cfg.border}` }} />
              <span style={{ fontSize: 13, color: colors.textSecondary, fontWeight: 500 }}>{cfg.label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {groupedByDistrict.length === 0 ? (
            <div style={{ color: colors.textSecondary, fontSize: 13 }}>Нет объектов для отображения.</div>
          ) : (
            groupedByDistrict.map(([district, items]) => {
              const districtFloors = Array.from(new Set(items.map((apt) => apt.floor))).sort((a, b) => b - a)
              return (
                <div key={district}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.textDark, marginBottom: 10 }}>
                    Район: {district}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {districtFloors.map((floor) => {
                      const floorApts = items.filter((apt) => apt.floor === floor)
                      if (!floorApts || floorApts.length === 0) return null
                      return (
                        <div key={floor} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, flexShrink: 0, textAlign: 'right', fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>
                            {floor}э
                          </div>
                          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(100px, 1fr))`, gap: 8 }}>
                            {floorApts.map((apt, j) => {
                              const cfg = statusConfig[apt.status]
                              return (
                                <motion.div
                                  key={apt.id}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: j * 0.02, duration: 0.3 }}
                                  whileHover={{ scale: 1.05, zIndex: 1, boxShadow: '0 8px 24px rgba(31,31,26,0.15)' }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => setSelected(apt)}
                                  style={{
                                    aspectRatio: '1.2',
                                    background: cfg.bg,
                                    border: `2px solid ${cfg.border}`,
                                    borderRadius: 10,
                                    padding: '8px 10px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                    position: 'relative', overflow: 'hidden',
                                  }}
                                >
                                  <div style={{ fontSize: 11, fontWeight: 700, color: cfg.text }}>№{apt.number}</div>
                                  <div>
                                    <div style={{ fontSize: 10, color: colors.textSecondary }}>{apt.rooms}к · {apt.area}м²</div>
                                  </div>
                                </motion.div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(31,31,26,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: colors.beigeCreama, borderRadius: 24, padding: 36, width: '100%', maxWidth: 460, boxShadow: '0 32px 80px rgba(31,31,26,0.25)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                <div>
                  <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>Квартира</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: colors.textDark, letterSpacing: -1 }}>№{selected.number}</div>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setSelected(null)}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: colors.beigeLight, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={18} color={colors.textSecondary} />
                </motion.button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                {[
                  { icon: <Layers size={16} />, label: 'Этаж', value: `${selected.floor} этаж` },
                  { icon: <Home size={16} />, label: 'Район', value: selected.district || 'Без района' },
                  { icon: <Home size={16} />, label: 'Комнаты', value: `${selected.rooms}-комн.` },
                  { icon: <Home size={16} />, label: 'Площадь', value: `${selected.area} м²` },
                  { icon: <DollarSign size={16} />, label: 'Цена', value: `₽${(selected.price / 1_000_000).toFixed(1)}M` },
                ].map((item, i) => (
                  <div key={i} style={{ background: colors.beigeLight, borderRadius: 14, padding: '16px', border: '1px solid rgba(181,169,154,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.textSecondary, marginBottom: 8 }}>
                      {item.icon}
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{item.label}</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: colors.textDark }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{
                padding: '14px 18px', borderRadius: 14,
                background: statusConfig[selected.status].bg,
                border: `1px solid ${statusConfig[selected.status].border}`,
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusConfig[selected.status].dot, flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: statusConfig[selected.status].text }}>{statusConfig[selected.status].label}</span>
              </div>

              {isManager && (
                <select
                  value={selected.status}
                  onChange={(e) => void handleStatusChange(selected, e.target.value as ApartmentStatus)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }}
                >
                  {(Object.keys(statusConfig) as ApartmentStatus[]).map((status) => (
                    <option key={status} value={status}>{statusConfig[status].label}</option>
                  ))}
                </select>
              )}

              {isAdmin && (
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <motion.button
                    whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(62,107,79,0.3)' }} whileTap={{ scale: 0.97 }}
                    onClick={() => openEdit(selected)}
                    style={{ flex: 1, background: colors.greenPrimary, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                  >
                    Изменить
                  </motion.button>
                  <motion.button
                    whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                    onClick={() => void handleDelete(selected)}
                    style={{ flex: 1, background: 'transparent', color: colors.textDark, border: `2px solid ${colors.beigeDeep}`, borderRadius: 12, padding: '14px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
                  >
                    Удалить
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: colors.textDark, letterSpacing: -0.5 }}>{editing ? 'Изменение квартиры' : 'Новая квартира'}</h2>
                  <p style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>Заполните параметры квартиры</p>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => setModalOpen(false)}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: colors.beigeLight, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={18} color={colors.textSecondary} />
                </motion.button>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: colors.textDark }}>
                  Номер
                  <input value={form.number} onChange={(e) => setForm((prev) => ({ ...prev, number: e.target.value }))} placeholder="Номер"
                    style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }} />
                </label>
                <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: colors.textDark }}>
                  Район
                  <input value={form.district ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, district: e.target.value }))} placeholder="Например, Центр"
                    style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }} />
                </label>
                <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: colors.textDark }}>
                  Этаж
                  <input type="number" value={form.floor} onChange={(e) => setForm((prev) => ({ ...prev, floor: Number(e.target.value) }))} placeholder="Этаж"
                    style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }} />
                </label>
                <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: colors.textDark }}>
                  Площадь, м²
                  <input type="number" value={form.area} onChange={(e) => setForm((prev) => ({ ...prev, area: Number(e.target.value) }))} placeholder="Площадь"
                    style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }} />
                </label>
                <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: colors.textDark }}>
                  Комнаты
                  <input type="number" value={form.rooms} onChange={(e) => setForm((prev) => ({ ...prev, rooms: Number(e.target.value) }))} placeholder="Комнаты"
                    style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }} />
                </label>
                <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: colors.textDark }}>
                  Цена, ₽
                  <input type="number" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))} placeholder="Цена"
                    style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }} />
                </label>
                <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: colors.textDark }}>
                  Статус
                  <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as ApartmentStatus }))}
                    style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(181,169,154,0.3)', background: colors.beigeLight }}>
                    {(Object.keys(statusConfig) as ApartmentStatus[]).map((status) => (
                      <option key={status} value={status}>{statusConfig[status].label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <motion.button
                whileHover={{ y: -2, boxShadow: '0 10px 28px rgba(62,107,79,0.4)' }} whileTap={{ scale: 0.97 }}
                onClick={() => void handleSave()}
                style={{ width: '100%', background: colors.greenPrimary, color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 16 }}
              >
                {editing ? 'Сохранить изменения' : 'Добавить квартиру'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ApartmentsPage

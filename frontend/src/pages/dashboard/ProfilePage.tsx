import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Check, Save, User } from 'lucide-react'
import { colors, fontFamily } from '../../theme'
import { updateMe } from '../../api'
import { useDashboardContext } from '../../context/useDashboardContext'

const ProfilePage = () => {
  const { user, refreshUser } = useDashboardContext()
  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [saved, setSaved] = useState(false)
  const [section, setSection] = useState<'profile' | 'notifications'>('profile')

  useEffect(() => {
    setFullName(user?.full_name ?? '')
    setEmail(user?.email ?? '')
    setPhone(user?.phone ?? '')
  }, [user])

  async function handleSave() {
    await updateMe({ full_name: fullName, email, phone })
    await refreshUser()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ fontFamily }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        {[
          { val: 'profile', label: 'Профиль' },
          { val: 'notifications', label: 'Уведомления' },
        ].map((opt) => (
          <motion.button
            key={opt.val}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSection(opt.val as any)}
            style={{ padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: section === opt.val ? colors.greenPrimary : colors.beigeLight, color: section === opt.val ? '#fff' : colors.textSecondary, transition: 'all 0.2s' }}
          >
            {opt.label}
          </motion.button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>Управление профилем пользователя</p>
        </div>
        <motion.button
          whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(62,107,79,0.35)' }} whileTap={{ scale: 0.97 }}
          onClick={() => void handleSave()}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: saved ? colors.greenSoft : colors.greenPrimary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(62,107,79,0.3)', transition: 'all 0.3s' }}
        >
          {saved ? <><Check size={16} /> Сохранено!</> : <><Save size={16} /> Сохранить изменения</>}
        </motion.button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {section === 'profile' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: colors.beigeCreama, borderRadius: 20, padding: '28px', border: '1px solid rgba(181,169,154,0.2)', boxShadow: '0 4px 20px rgba(31,31,26,0.07)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(181,169,154,0.15)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(62,107,79,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.greenPrimary }}>
              <User size={22} />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: 17, color: colors.textDark, letterSpacing: -0.3 }}>Профиль</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '16px', background: colors.beigeLight, borderRadius: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: `linear-gradient(135deg, ${colors.greenPrimary}, ${colors.greenSoft})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20 }}>
              {(fullName || 'П').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: colors.textDark, fontSize: 16 }}>{fullName || 'Пользователь'}</div>
              <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{user?.role}</div>
            </div>
          </div>

          {[
            { label: 'Имя и фамилия', value: fullName, setter: setFullName },
            { label: 'Email', value: email, setter: setEmail },
            { label: 'Телефон', value: phone, setter: setPhone },
          ].map((field) => (
            <div key={field.label} style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.textDark, marginBottom: 8 }}>{field.label}</label>
              <input
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', border: '1px solid rgba(181,169,154,0.3)', borderRadius: 12, background: colors.beigeLight, fontSize: 14, color: colors.textDark, outline: 'none', fontFamily, boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </motion.div>
        )}

        {section === 'notifications' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: colors.beigeCreama, borderRadius: 20, padding: '28px', border: '1px solid rgba(181,169,154,0.2)', boxShadow: '0 4px 20px rgba(31,31,26,0.07)' }}
        >
          <h3 style={{ fontWeight: 700, fontSize: 17, color: colors.textDark, letterSpacing: -0.3 }}>Настройки уведомлений</h3>
          <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
            {[
              'Email-уведомления',
              'SMS-уведомления',
              'Новые клиенты',
              'Новые бронирования',
              'AI-отчеты',
            ].map((label) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(181,169,154,0.15)' }}>
                <div style={{ color: colors.textDark, fontSize: 14 }}>{label}</div>
                <div style={{ width: 46, height: 26, borderRadius: 13, background: colors.greenPrimary }} />
              </div>
            ))}
          </div>
        </motion.div>
        )}
      </div>
    </div>
  )
}

export default ProfilePage

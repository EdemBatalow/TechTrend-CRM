import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, type Role } from '../api'
import { motion } from 'motion/react'
import { colors, fontFamily } from '../theme'

const RegisterPage = () => {
  const navigate = useNavigate()
  const [login, setLogin] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('MANAGER')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await register({ login, full_name: fullName, email, phone, password, role })
      navigate('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden', padding: 20, fontFamily }}>
      <motion.div
        initial={{ scale: 1.1, filter: 'blur(10px) brightness(0.6)' }}
        animate={{ scale: 1, filter: 'blur(0px) brightness(0.7)' }}
        transition={{ duration: 1.2 }}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/assets/auth_bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Animated decor bubbles */}
      <motion.div
        animate={{ 
          x: [0, 30, 0],
          y: [0, 50, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          top: '10%',
          left: '15%',
          width: 250,
          height: 250,
          background: 'radial-gradient(circle, rgba(125,170,130,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }}
      />

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          position: 'relative',
          width: 'min(580px, 100%)',
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(16px) saturate(160%)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          borderRadius: 32,
          padding: 40,
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.2)',
          display: 'grid',
          gap: 20,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: colors.textDark }}>Регистрация CRM</h1>
          <p style={{ margin: 0, color: colors.textSecondary, fontSize: 15 }}>
            Создайте учетную запись для управления проектами.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: colors.textDark }}>
              Логин
              <input type="text" value={login} onChange={(e) => setLogin(e.target.value)} required style={{ border: '1px solid rgba(181,169,154,0.3)', borderRadius: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.4)', outline: 'none' }} />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: colors.textDark }}>
              ФИО
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ border: '1px solid rgba(181,169,154,0.3)', borderRadius: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.4)', outline: 'none' }} />
            </label>
          </div>

          <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: colors.textDark }}>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ border: '1px solid rgba(181,169,154,0.3)', borderRadius: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.4)', outline: 'none' }} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
            <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: colors.textDark }}>
              Телефон
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ border: '1px solid rgba(181,169,154,0.3)', borderRadius: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.4)', outline: 'none' }} />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: colors.textDark }}>
              Роль
              <select value={role} onChange={(e) => setRole(e.target.value as Role)} style={{ border: '1px solid rgba(181,169,154,0.3)', borderRadius: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.4)', outline: 'none', cursor: 'pointer' }}>
                <option value="MANAGER">Менеджер</option>
                <option value="ADMIN">Администратор</option>
              </select>
            </label>
          </div>

          <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: colors.textDark }}>
            Пароль
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ border: '1px solid rgba(181,169,154,0.3)', borderRadius: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.4)', outline: 'none' }} />
          </label>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '10px', borderRadius: 12, background: '#fde8e8', color: colors.danger, fontSize: 13 }}>
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(62,107,79,0.3)' }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            style={{
              border: 'none',
              borderRadius: 16,
              padding: '16px',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              background: `linear-gradient(135deg, ${colors.greenPrimary}, ${colors.greenSoft})`,
              color: '#fff',
              marginTop: 8
            }}
          >
            {loading ? 'Создание...' : 'Зарегистрироваться'}
          </motion.button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <p style={{ margin: 0, fontSize: 14, color: colors.textSecondary }}>
            Уже есть аккаунт? <Link to="/login" style={{ color: colors.greenPrimary, fontWeight: 700, textDecoration: 'none' }}>Войти</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default RegisterPage

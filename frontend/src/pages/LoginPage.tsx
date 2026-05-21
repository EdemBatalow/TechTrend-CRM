import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api'
import { colors, fontFamily } from '../theme'

const LoginPage = () => {
  const navigate = useNavigate()
  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const data = await login(loginValue, password)
      localStorage.setItem('ttcrm_token', data.access_token)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden', padding: 20, fontFamily }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/assets/auth_bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.9)',
        }}
      />
      <div
        style={{
          position: 'relative',
          width: 'min(520px, 100%)',
          background: 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(9px)',
          border: '1px solid rgba(181, 169, 154, 0.36)',
          borderRadius: 20,
          padding: 28,
          boxShadow: '0 16px 32px rgba(30, 38, 28, 0.12)',
        }}
      >
        <h1 style={{ margin: '0 0 8px', fontSize: 26 }}>Вход в TechTrend CRM</h1>
        <p style={{ margin: '0 0 18px', color: colors.textSecondary }}>
          Администратор, менеджер и директор работают в одном защищённом пространстве.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6, fontSize: 14 }}>
            Логин
            <input
              type="text"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              required
              style={{
                border: '1px solid rgba(181,169,154,0.4)',
                borderRadius: 12,
                padding: '12px 14px',
                background: colors.beigeLight,
              }}
            />
          </label>
          <label style={{ display: 'grid', gap: 6, fontSize: 14 }}>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                border: '1px solid rgba(181,169,154,0.4)',
                borderRadius: 12,
                padding: '12px 14px',
                background: colors.beigeLight,
              }}
            />
          </label>
          {error && (
            <div style={{ padding: '9px 10px', borderRadius: 10, background: '#fde8e8', border: '1px solid #efc4c4', color: colors.danger }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              border: 'none',
              borderRadius: 12,
              padding: '12px 22px',
              fontWeight: 700,
              cursor: 'pointer',
              background: `linear-gradient(120deg, ${colors.greenPrimary}, ${colors.greenSoft})`,
              color: '#fff',
              boxShadow: '0 8px 18px rgba(62, 107, 79, 0.28)',
            }}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <p style={{ marginTop: 12, fontSize: 13, color: colors.textSecondary }}>
          Нет аккаунта? <Link to="/register" style={{ color: colors.greenPrimary, fontWeight: 700, textDecoration: 'none' }}>Зарегистрироваться</Link>
        </p>
        <p style={{ marginTop: 4, fontSize: 11, color: colors.textSecondary, opacity: 0.8 }}>
          Доступ в систему также предоставляется администратором организации.
        </p>
      </div>
    </div>
  )
}

export default LoginPage

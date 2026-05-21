import { createContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { fetchMe, fetchNotifications, type CurrentUser, type Notification } from '../api'

type DashboardContextValue = {
  user: CurrentUser | null
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  refreshUser: () => Promise<void>
  refreshNotifications: () => Promise<void>
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refreshUser() {
    const me = await fetchMe()
    setUser(me)
  }

  async function refreshNotifications() {
    const items = await fetchNotifications()
    setNotifications(items)
  }

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const [me, items] = await Promise.all([fetchMe(), fetchNotifications()])
        if (!active) return
        setUser(me)
        setNotifications(items)
      } catch (err) {
        if (!active) return
        const message = err instanceof Error ? err.message : 'Ошибка загрузки'
        setError(message)
        if (/401|учет|credentials|auth/i.test(message)) {
          localStorage.removeItem('ttcrm_token')
          navigate('/login', { replace: true })
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [navigate])

  const value = useMemo<DashboardContextValue>(
    () => ({
      user,
      notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length,
      loading,
      error,
      refreshUser,
      refreshNotifications,
    }),
    [user, notifications, loading, error],
  )

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}
export { DashboardContext }

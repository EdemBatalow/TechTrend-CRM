import { useContext } from 'react'

import { DashboardContext } from './DashboardContext'

export function useDashboardContext() {
  const ctx = useContext(DashboardContext)
  if (!ctx) {
    throw new Error('DashboardContext is not available')
  }
  return ctx
}

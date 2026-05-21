import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { ReactElement } from 'react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { DashboardLayout } from './components/DashboardLayout'
import { DashboardProvider } from './context/DashboardContext'
import DashboardHomePage from './pages/dashboard/DashboardHomePage'
import ClientsPage from './pages/dashboard/ClientsPage'
import DealsPage from './pages/dashboard/DealsPage'
import ApartmentsPage from './pages/dashboard/ApartmentsPage'
import AiPage from './pages/dashboard/AiPage'
import AnalyticsPage from './pages/dashboard/AnalyticsPage'
import SubscriptionPage from './pages/dashboard/SubscriptionPage'
import TeamPage from './pages/dashboard/TeamPage'
import ReportsPage from './pages/dashboard/ReportsPage'
import ProfilePage from './pages/dashboard/ProfilePage'
import InteractionsPage from './pages/dashboard/InteractionsPage'

function ProtectedDashboard({ children }: { children: ReactElement }) {
  const token = localStorage.getItem('ttcrm_token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedDashboard>
              <DashboardProvider>
                <DashboardLayout />
              </DashboardProvider>
            </ProtectedDashboard>
          }
        >
          <Route index element={<DashboardHomePage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="interactions" element={<InteractionsPage />} />
          <Route path="deals" element={<DealsPage />} />
          <Route path="apartments" element={<ApartmentsPage />} />
          <Route path="ai" element={<AiPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

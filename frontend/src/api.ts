const API_URL = 'http://localhost:8000'

function getToken() {
  return localStorage.getItem('ttcrm_token')
}

function buildHeaders(contentType = 'application/json') {
  const token = getToken()
  return {
    'Content-Type': contentType,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const payload = await res.json().catch(() => null)
    const message = (payload && (payload.detail as string)) || `API error ${res.status}`
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: buildHeaders() })
  return parseResponse<T>(res)
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  })
  return parseResponse<T>(res)
}

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  })
  return parseResponse<T>(res)
}

async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, { method: 'DELETE', headers: buildHeaders() })
  return parseResponse<void>(res)
}

export type Role = 'ADMIN' | 'MANAGER' | 'DIRECTOR' | 'AGENT'
export type SubscriptionPlan = 'basic' | 'pro'
export type DealStage = 'LEAD' | 'SELECTION' | 'BOOKING' | 'MORTGAGE' | 'DDU' | 'CLOSED'
export type ApartmentStatus = 'AVAILABLE' | 'BOOKED' | 'MORTGAGE' | 'SOLD' | 'RESERVED'

export interface Subscription {
  plan: SubscriptionPlan
  status: 'inactive' | 'active' | 'past_due'
  ai_scope: 'internal' | 'external'
  started_at?: string
  renewal_at?: string
  last_payment_at?: string
  amount?: number
}

export interface CurrentUser {
  id: number
  login: string
  email: string
  phone?: string
  full_name: string
  is_active: boolean
  role: Role
  created_date: string
  subscription?: Subscription
}

export interface User {
  id: number
  login: string
  email: string
  phone?: string
  full_name: string
  is_active: boolean
  role: Role
  created_date: string
}

export interface Notification {
  id: number
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface SubscriptionPlanInfo {
  code: SubscriptionPlan
  title: string
  price: number
  period_days: number
  ai_scope: 'internal' | 'external'
  features: string[]
}

export interface SubscriptionCheckoutResult {
  payment_url: string
  message: string
  subscription: Subscription
}

export interface DashboardSummary {
  total_clients: number
  active_deals: number
  closed_deals: number
  total_apartments: number
  sold_apartments: number
  reserved_apartments: number
  available_apartments: number
  total_revenue: number
}

export interface Client {
  id: number
  full_name: string
  phone: string
  email?: string
  source?: string
  notes?: string
  created_at: string
}

export interface Apartment {
  id: number
  number: string
  district?: string
  floor: number
  area: number
  rooms: number
  price: number
  status: ApartmentStatus
  section_id: number
}

export interface Deal {
  id: number
  stage: DealStage
  amount: number
  client_id: number
  manager_id: number
  apartment_id?: number
  expected_close_date?: string
  notes?: string
  created_at: string
}

export interface AISeriesPoint {
  label: string
  value: number
}

export interface AIDemandForecast {
  title: string
  points: AISeriesPoint[]
}

export interface AIEnvironmentInsight {
  module: 'internal' | 'external'
  summary: string
  factors: string[]
  recommendations: string[]
}

export interface AIChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIChatResponse {
  reply: string
  suggestions: string[]
}

export interface AnalyticsOverview {
  conversion_rate: number
  avg_sale_cycle_days: number
  project_rating: number
  repeat_contacts: number
}

export interface AnalyticsReport {
  report_period: string
  deals_total: number
  deals_closed: number
  conversion_rate: number
  revenue_total: number
  top_manager?: string
}

export interface AnalyticsRun {
  id: number
  scope: 'internal' | 'external'
  date_from?: string
  date_to?: string
  summary: string
  payload: string
  notes?: string
  created_at: string
}

export async function login(login: string, password: string) {
  const formData = new URLSearchParams()
  formData.append('username', login)
  formData.append('password', password)
  const response = await fetch(`${API_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  })
  return parseResponse<{ access_token: string }>(response)
}

export function register(payload: { login: string; email: string; phone?: string; full_name: string; password: string; role: Role }) {
  return apiPost<User>('/auth/register', payload)
}

export function fetchMe() { return apiGet<CurrentUser>('/auth/me') }
export function updateMe(payload: { email?: string; phone?: string; full_name?: string }) { return apiPatch<CurrentUser>('/auth/me', payload) }
export function fetchUsers(search?: string) { return apiGet<User[]>(`/auth/users${search ? `?search=${encodeURIComponent(search)}` : ''}`) }
export function updateUserRole(userId: number, role: Role) { return apiPatch<User>(`/auth/users/${userId}/role`, { role }) }
export function deleteUser(userId: number) { return apiDelete(`/auth/users/${userId}`) }

export function fetchNotifications() { return apiGet<Notification[]>('/notifications/me') }
export function markNotificationRead(id: number) { return apiPatch<Notification>(`/notifications/${id}/read`, {}) }

export function fetchSubscriptionPlans() { return apiGet<SubscriptionPlanInfo[]>('/billing/plans') }
export function checkoutSubscription(plan: SubscriptionPlan) { return apiPost<SubscriptionCheckoutResult>('/billing/checkout', { plan }) }

export function fetchDashboardSummary() { return apiGet<DashboardSummary>('/dashboard/summary') }

export function fetchClients(search?: string) { return apiGet<Client[]>(`/clients/${search ? `?search=${encodeURIComponent(search)}` : ''}`) }
export function createClient(payload: { full_name: string; phone: string; email?: string; source?: string; notes?: string }) {
  return apiPost<Client>('/clients/', payload)
}
export function updateClient(clientId: number, payload: { full_name?: string; phone?: string; email?: string; source?: string; notes?: string }) {
  return apiPatch<Client>(`/clients/${clientId}`, payload)
}
export function deleteClient(clientId: number) { return apiDelete(`/clients/${clientId}`) }

export function fetchDeals(stage?: DealStage) { return apiGet<Deal[]>(`/deals/${stage ? `?stage=${stage}` : ''}`) }
export function createDeal(payload: { stage: DealStage; amount: number; client_id: number; manager_id: number; apartment_id?: number; expected_close_date?: string; notes?: string }) {
  return apiPost<Deal>('/deals/', payload)
}
export function updateDealStage(dealId: number, stage: DealStage) { return apiPatch<Deal>(`/deals/${dealId}/stage`, { stage }) }
export function updateDeal(dealId: number, payload: { amount?: number; apartment_id?: number; expected_close_date?: string; notes?: string }) {
  return apiPatch<Deal>(`/deals/${dealId}`, payload)
}
export function assignDeal(dealId: number, manager_id: number) { return apiPatch<Deal>(`/deals/${dealId}/assign`, { manager_id }) }
export function deleteDeal(dealId: number) { return apiDelete(`/deals/${dealId}`) }

export function fetchApartments() { return apiGet<Apartment[]>('/apartments/') }
export function createApartment(payload: { number: string; district?: string; floor: number; area: number; rooms: number; price: number; status: ApartmentStatus; section_id: number }) {
  return apiPost<Apartment>('/apartments/', payload)
}
export function updateApartmentStatus(apartmentId: number, status: ApartmentStatus) {
  return apiPatch<Apartment>(`/apartments/${apartmentId}/status`, { status })
}
export function updateApartment(apartmentId: number, payload: { number: string; district?: string; floor: number; area: number; rooms: number; price: number; status: ApartmentStatus; section_id: number }) {
  return apiPatch<Apartment>(`/apartments/${apartmentId}`, payload)
}
export function deleteApartment(apartmentId: number) {
  return apiDelete(`/apartments/${apartmentId}`)
}

export function fetchDemandForecast() { return apiGet<AIDemandForecast>('/ai/demand') }
export function fetchAIInternal() { return apiGet<AIEnvironmentInsight>('/ai/internal') }
export function fetchAIExternal() { return apiGet<AIEnvironmentInsight>('/ai/external') }
export function sendAIChat(messages: AIChatMessage[]) {
  return apiPost<AIChatResponse>('/ai/chat', { messages })
}

export function fetchAnalyticsOverview() { return apiGet<AnalyticsOverview>('/analytics/overview') }
export function fetchAnalyticsReport(dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams()
  if (dateFrom) params.set('date_from', dateFrom)
  if (dateTo) params.set('date_to', dateTo)
  return apiGet<AnalyticsReport>(`/analytics/report${params.toString() ? `?${params.toString()}` : ''}`)
}

export function createAnalyticsRun(payload: { scope: 'internal' | 'external'; date_from?: string; date_to?: string; notes?: string }) {
  return apiPost<AnalyticsRun>('/analytics/runs', payload)
}
export function fetchAnalyticsRuns(scope?: 'internal' | 'external') {
  return apiGet<AnalyticsRun[]>(`/analytics/runs${scope ? `?scope=${scope}` : ''}`)
}
export function updateAnalyticsRun(runId: number, payload: { notes?: string }) {
  return apiPatch<AnalyticsRun>(`/analytics/runs/${runId}`, payload)
}
export function deleteAnalyticsRun(runId: number) {
  return apiDelete(`/analytics/runs/${runId}`)
}
export interface Interaction {
  id: number
  type: string
  date: string
  description: string
  duration_minutes?: number
  client_id: number
  user_id?: number
  deal_id?: number
  created_date: string
}

export function fetchInteractions(params?: { client_id?: number; deal_id?: number }) {
  const query = new URLSearchParams()
  if (params?.client_id) query.set('client_id', params.client_id.toString())
  if (params?.deal_id) query.set('deal_id', params.deal_id.toString())
  return apiGet<Interaction[]>(`/interactions/${query.toString() ? `?${query.toString()}` : ''}`)
}

export function createInteraction(payload: { type: string; date: string; description: string; duration_minutes?: number; client_id: number; deal_id?: number }) {
  return apiPost<Interaction>('/interactions/', payload)
}

export function updateInteraction(id: number, payload: { type?: string; date?: string; description?: string; duration_minutes?: number; deal_id?: number }) {
  return apiPatch<Interaction>(`/interactions/${id}`, payload)
}

export function deleteInteraction(id: number) {
  return apiDelete(`/interactions/${id}`)
}

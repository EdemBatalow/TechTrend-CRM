import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { MessageSquare, RefreshCw, Sparkles, TrendingUp, Zap } from 'lucide-react'
import {
  createAnalyticsRun,
  deleteAnalyticsRun,
  fetchAIExternal,
  fetchAIInternal,
  fetchAnalyticsRuns,
  sendAIChat,
  type AIChatMessage,
  type AIEnvironmentInsight,
  type AnalyticsRun,
} from '../../api'
import { colors, fontFamily } from '../../theme'
import { useDashboardContext } from '../../context/useDashboardContext'

const initialChat: AIChatMessage[] = [
  {
    role: 'assistant',
    content: 'Я могу коротко разобрать сделки, клиентов, риски по воронке и дать практический следующий шаг по данным CRM.',
  },
]

const cardStyle = {
  background: colors.beigeCreama,
  borderRadius: 20,
  padding: 24,
  border: '1px solid rgba(181,169,154,0.2)',
  boxShadow: '0 4px 20px rgba(31,31,26,0.07)',
} as const

function InsightCard({
  title,
  subtitle,
  summary,
  factors,
  recommendations,
  loading,
  emptyText,
  onRefresh,
}: {
  title: string
  subtitle: string
  summary?: string
  factors: string[]
  recommendations: string[]
  loading: boolean
  emptyText: string
  onRefresh: () => void
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.greenPrimary, marginBottom: 4 }}>{subtitle}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: colors.textDark }}>{title}</div>
        </div>
        <button
          onClick={onRefresh}
          type="button"
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            border: '1px solid rgba(181,169,154,0.3)',
            background: colors.beigeLight,
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <RefreshCw size={16} color={colors.textSecondary} />
        </button>
      </div>

      {loading ? (
        <div style={{ color: colors.textSecondary }}>Готовлю анализ...</div>
      ) : summary ? (
        <>
          <div style={{ color: colors.textSecondary, lineHeight: 1.6 }}>{summary}</div>
          <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
            {factors.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: colors.textDark, marginBottom: 8 }}>Ключевые сигналы</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {factors.map((item) => (
                    <div key={item} style={{ padding: '10px 12px', borderRadius: 12, background: colors.beigeLight, color: colors.textSecondary, fontSize: 13 }}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {recommendations.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: colors.textDark, marginBottom: 8 }}>Что сделать дальше</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {recommendations.map((item) => (
                    <div key={item} style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(62,107,79,0.08)', color: colors.textDark, fontSize: 13 }}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ color: colors.textSecondary }}>{emptyText}</div>
      )}
    </motion.div>
  )
}

const AiPage = () => {
  const { user } = useDashboardContext()
  const [internal, setInternal] = useState<AIEnvironmentInsight | null>(null)
  const [external, setExternal] = useState<AIEnvironmentInsight | null>(null)
  const [externalError, setExternalError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'all' | 'internal' | 'external'>('all')
  const [runs, setRuns] = useState<AnalyticsRun[]>([])
  const [note, setNote] = useState('')
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>(initialChat)
  const [chatInput, setChatInput] = useState('')
  const [chatSuggestions, setChatSuggestions] = useState<string[]>([
    'Какие сделки требуют внимания в первую очередь?',
    'Какие клиенты сейчас самые перспективные?',
    'Что замедляет конверсию по воронке?',
  ])
  const [chatLoading, setChatLoading] = useState(false)

  const hasSubscription = user?.subscription?.status === 'active'
  const isPro = user?.subscription?.plan === 'pro'

  async function load() {
    setLoading(true)
    setActionError(null)
    let nextExternalError: string | null = null
    try {
      const [internalRes, externalRes, runsRes] = await Promise.all([
        fetchAIInternal().catch(() => null),
        isPro
          ? fetchAIExternal().catch((err) => {
              nextExternalError = err instanceof Error ? err.message : 'Не удалось загрузить внешние источники'
              return null
            })
          : Promise.resolve(null),
        fetchAnalyticsRuns().catch(() => []),
      ])
      setInternal(internalRes)
      setExternal(externalRes)
      setRuns(runsRes)
      setExternalError(nextExternalError)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [isPro])

  async function submitChat(prefilledQuestion?: string) {
    const content = (prefilledQuestion ?? chatInput).trim()
    if (!content || chatLoading || !hasSubscription) return

    const nextMessages: AIChatMessage[] = [...chatMessages, { role: 'user', content }]
    setChatMessages(nextMessages)
    setChatInput('')
    setChatLoading(true)
    setActionError(null)

    try {
      const response = await sendAIChat(nextMessages)
      setChatMessages([...nextMessages, { role: 'assistant', content: response.reply }])
      if (response.suggestions.length) {
        setChatSuggestions(response.suggestions)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось получить ответ AI'
      setActionError(message)
      setChatMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: 'Не удалось получить ответ модели. Попробуйте повторить запрос или обновить данные анализа.',
        },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  async function saveRun() {
    if (!hasSubscription) return
    setActionError(null)
    try {
      await createAnalyticsRun({
        scope: view === 'external' && isPro ? 'external' : 'internal',
        notes: note || undefined,
      })
      setNote('')
      const updated = await fetchAnalyticsRuns().catch(() => [])
      setRuns(updated)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось сохранить запуск')
    }
  }

  const visibleRecommendations = [
    ...(internal?.recommendations ?? []),
    ...(view !== 'internal' ? external?.recommendations ?? [] : []),
  ].slice(0, 4)

  return (
    <div style={{ fontFamily }}>
      {actionError && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: '#fde8e8', border: '1px solid #efc4c4', color: colors.danger }}>
          {actionError}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {[
            { val: 'all', label: 'Все' },
            { val: 'internal', label: 'Внутренний' },
            { val: 'external', label: 'Внешний' },
          ].map((option) => (
            <button
              key={option.val}
              type="button"
              disabled={option.val === 'external' && !isPro}
              onClick={() => setView(option.val as 'all' | 'internal' | 'external')}
              style={{
                padding: '8px 18px',
                borderRadius: 12,
                border: 'none',
                cursor: option.val === 'external' && !isPro ? 'not-allowed' : 'pointer',
                background: view === option.val ? colors.greenPrimary : colors.beigeCreama,
                color: view === option.val ? '#fff' : colors.textSecondary,
                fontWeight: 700,
                opacity: option.val === 'external' && !isPro ? 0.45 : 1,
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div style={{ color: colors.textSecondary, fontSize: 13 }}>
          {hasSubscription ? `Тариф: ${isPro ? 'Pro' : 'Basic'}` : 'AI доступен после активации подписки'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 20 }}>
        {(view === 'all' || view === 'internal') && (
          <InsightCard
            title="Внутренний AI-анализ"
            subtitle="CRM и воронка"
            summary={hasSubscription ? internal?.summary : undefined}
            factors={internal?.factors ?? []}
            recommendations={internal?.recommendations ?? []}
            loading={loading}
            emptyText="Подключите подписку, чтобы AI анализировал сделки, клиентов и остатки прямо из CRM."
            onRefresh={() => void load()}
          />
        )}

        {(view === 'all' || view === 'external') && (
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <TrendingUp size={18} color={colors.greenPrimary} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: colors.greenPrimary, marginBottom: 4 }}>Рынок и ставки</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: colors.textDark }}>Внешний AI-анализ</div>
              </div>
            </div>
            {!hasSubscription ? (
              <div style={{ color: colors.textSecondary }}>Внешний анализ откроется после активации подписки.</div>
            ) : !isPro ? (
              <div style={{ color: colors.textSecondary }}>Внешние источники доступны на тарифе Pro.</div>
            ) : externalError ? (
              <div style={{ color: colors.textSecondary }}>{externalError}</div>
            ) : (
              <>
                <div style={{ color: colors.textSecondary, lineHeight: 1.6 }}>{external?.summary ?? 'Готовлю анализ внешнего рынка...'}</div>
                <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
                  {(external?.factors ?? []).map((item) => (
                    <div key={item} style={{ padding: '10px 12px', borderRadius: 12, background: colors.beigeLight, color: colors.textSecondary, fontSize: 13 }}>
                      {item}
                    </div>
                  ))}
                </div>
                {(external?.recommendations ?? []).length > 0 && (
                  <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
                    {external?.recommendations.map((item) => (
                      <div key={item} style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(62,107,79,0.08)', color: colors.textDark, fontSize: 13 }}>
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Zap size={18} color={colors.greenPrimary} />
            <div style={{ fontSize: 18, fontWeight: 800, color: colors.textDark }}>Короткие действия</div>
          </div>
          {visibleRecommendations.length > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {visibleRecommendations.map((item, index) => (
                <div key={`${item}-${index}`} style={{ padding: '12px 14px', borderRadius: 14, background: colors.beigeLight }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.greenPrimary, marginBottom: 4 }}>Приоритет {index + 1}</div>
                  <div style={{ color: colors.textDark, lineHeight: 1.5 }}>{item}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: colors.textSecondary }}>После анализа здесь появятся конкретные действия по лидам, сделкам и остаткам.</div>
          )}

          <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(181,169,154,0.2)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.textDark, marginBottom: 8 }}>Сохранить текущий запуск</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Короткая заметка к запуску"
              style={{
                width: '100%',
                minHeight: 88,
                resize: 'vertical',
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(181,169,154,0.3)',
                background: colors.beigeLight,
                color: colors.textDark,
                fontFamily,
              }}
            />
            <button
              type="button"
              disabled={!hasSubscription}
              onClick={() => void saveRun()}
              style={{
                marginTop: 10,
                border: 'none',
                borderRadius: 12,
                padding: '11px 16px',
                background: colors.greenPrimary,
                color: '#fff',
                fontWeight: 700,
                cursor: hasSubscription ? 'pointer' : 'not-allowed',
                opacity: hasSubscription ? 1 : 0.55,
              }}
            >
              Сохранить запуск
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <MessageSquare size={18} color={colors.greenPrimary} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: colors.textDark }}>AI-чат</div>
              <div style={{ fontSize: 12, color: colors.textSecondary }}>Небольшой помощник по вашим сделкам и клиентам</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {chatSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                disabled={!hasSubscription || chatLoading}
                onClick={() => void submitChat(item)}
                style={{
                  border: '1px solid rgba(181,169,154,0.3)',
                  borderRadius: 999,
                  padding: '7px 12px',
                  background: colors.beigeLight,
                  color: colors.textSecondary,
                  cursor: hasSubscription ? 'pointer' : 'not-allowed',
                  fontSize: 12,
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <div style={{ maxHeight: 280, overflowY: 'auto', display: 'grid', gap: 10, paddingRight: 4, marginBottom: 12 }}>
            {chatMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                style={{
                  justifySelf: message.role === 'user' ? 'end' : 'start',
                  maxWidth: '88%',
                  padding: '10px 12px',
                  borderRadius: 14,
                  background: message.role === 'user' ? colors.greenPrimary : colors.beigeLight,
                  color: message.role === 'user' ? '#fff' : colors.textDark,
                  lineHeight: 1.5,
                  fontSize: 13,
                }}
              >
                {message.content}
              </div>
            ))}
            {chatLoading && (
              <div style={{ justifySelf: 'start', padding: '10px 12px', borderRadius: 14, background: colors.beigeLight, color: colors.textSecondary, fontSize: 13 }}>
                AI формирует ответ...
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={hasSubscription ? 'Например: какие сделки сейчас самые рискованные?' : 'AI-чат станет доступен после активации подписки'}
              style={{
                width: '100%',
                minHeight: 88,
                resize: 'vertical',
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(181,169,154,0.3)',
                background: colors.beigeLight,
                color: colors.textDark,
                fontFamily,
              }}
            />
            <button
              type="button"
              disabled={!hasSubscription || chatLoading || !chatInput.trim()}
              onClick={() => void submitChat()}
              style={{
                border: 'none',
                borderRadius: 12,
                padding: '11px 16px',
                background: colors.greenPrimary,
                color: '#fff',
                fontWeight: 700,
                cursor: !hasSubscription || chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
                opacity: !hasSubscription || chatLoading || !chatInput.trim() ? 0.55 : 1,
              }}
            >
              Отправить вопрос
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Sparkles size={18} color={colors.greenPrimary} />
            <div style={{ fontSize: 18, fontWeight: 800, color: colors.textDark }}>История запусков</div>
          </div>
          {runs.length === 0 ? (
            <div style={{ color: colors.textSecondary }}>Сохранённых запусков пока нет.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {runs.slice(0, 8).map((run) => (
                <div key={run.id} style={{ paddingBottom: 12, borderBottom: '1px solid rgba(181,169,154,0.16)' }}>
                  <div style={{ fontWeight: 700, color: colors.textDark, marginBottom: 4 }}>{run.summary}</div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 8 }}>
                    {run.scope === 'external' ? 'Внешний' : 'Внутренний'} анализ • {new Date(run.created_at).toLocaleString()}
                  </div>
                  {run.notes && <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>{run.notes}</div>}
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteAnalyticsRun(run.id)
                      const updated = await fetchAnalyticsRuns().catch(() => [])
                      setRuns(updated)
                    }}
                    style={{ border: 'none', background: 'none', color: colors.danger, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default AiPage

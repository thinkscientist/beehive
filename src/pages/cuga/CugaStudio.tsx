import {
  Button,
  ContentSwitcher,
  InlineNotification,
  InlineLoading,
  Switch,
  Tag,
  TextInput,
  Tile,
} from '@carbon/react'
import { Reset, Undo } from '@carbon/icons-react'
import { useId, useState, type FormEvent } from 'react'
import { postJson } from '../../lib/http'
import { useServiceStatus } from '../../lib/useServiceStatus'
import DemoPage from './DemoPage'
import {
  BASELINE_PAGE,
  pageText,
  runGuidedCommand,
  type HighlightId,
  type PageState,
  type TimelineStep,
} from './guidedEngine'

type Mode = 'guided' | 'live'
type Origin = 'guided demo' | 'live CUGA'

interface ChatEntry {
  id: number
  role: 'you' | 'studio'
  text: string
  origin?: Origin
}

interface TimelineEntry extends TimelineStep {
  id: number
  origin: Origin
}

const EXAMPLES = [
  'What does this page say about data retention?',
  'Find the cancellation policy and highlight it.',
  'Which button is the main action?',
  'Rewrite this heading to be clearer.',
  'Make the primary button more prominent.',
  'Add a short explanation under this section.',
  'Change the page to a calmer blue theme.',
  'Remove the redundant paragraph.',
]

function CugaStudio() {
  const status = useServiceStatus()
  const liveAvailable =
    status.phase === 'ready' &&
    status.status.cugaApi.configured &&
    status.status.cugaApi.reachable

  const inputId = useId()
  const [mode, setMode] = useState<Mode>('guided')
  const [page, setPage] = useState<PageState>(BASELINE_PAGE)
  const [history, setHistory] = useState<PageState[]>([])
  const [highlight, setHighlight] = useState<HighlightId | null>(null)
  const [showBefore, setShowBefore] = useState(false)
  const [chat, setChat] = useState<ChatEntry[]>([])
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextId, setNextId] = useState(1)

  const effectiveMode: Mode =
    mode === 'live' && liveAvailable ? 'live' : 'guided'

  function append(
    entries: Omit<ChatEntry, 'id'>[],
    steps: TimelineStep[],
    stepOrigin: Origin,
  ) {
    let id = nextId
    setChat((c) => [...c, ...entries.map((e) => ({ ...e, id: id++ }))])
    setTimeline((t) => [
      ...t,
      ...steps.map((s) => ({ ...s, id: id++, origin: stepOrigin })),
    ])
    setNextId(id)
  }

  async function submit(message: string) {
    const trimmed = message.trim()
    if (!trimmed || busy) return
    setError(null)
    setDraft('')

    if (effectiveMode === 'guided') {
      const result = runGuidedCommand(trimmed, page)
      if (result.next !== page) {
        setHistory((h) => [...h, page])
        setPage(result.next)
      }
      setHighlight(result.highlight)
      setShowBefore(false)
      append(
        [
          { role: 'you', text: trimmed },
          { role: 'studio', text: result.reply, origin: 'guided demo' },
        ],
        result.steps,
        'guided demo',
      )
      return
    }

    setBusy(true)
    try {
      const response = await postJson<{
        answer: string
        events: { name: string }[]
      }>('/api/cuga/chat', { message: trimmed, pageContext: pageText(page) })
      setHighlight(null)
      append(
        [
          { role: 'you', text: trimmed },
          {
            role: 'studio',
            text: response.answer || 'CUGA finished without an answer.',
            origin: 'live CUGA',
          },
        ],
        [
          {
            label: 'CUGA run',
            detail: `Received ${response.events.length} events from CUGA`,
          },
        ],
        'live CUGA',
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    void submit(draft)
  }

  function undo() {
    const previous = history[history.length - 1]
    if (!previous) return
    setPage(previous)
    setHistory(history.slice(0, -1))
    setHighlight(null)
  }

  function reset() {
    setPage(BASELINE_PAGE)
    setHistory([])
    setHighlight(null)
    setShowBefore(false)
    setChat([])
    setTimeline([])
    setError(null)
  }

  const changed = page !== BASELINE_PAGE

  return (
    <div className="studio studio--cuga">
      <header className="studio__header">
        <Tag type="blue">CUGA</Tag>
        <h1 className="cds--productive-heading-05">CUGA Page Studio</h1>
        <p className="cds--body-long-01">
          Ask questions about a demo page and request edits. This experience is
          independent of the Hive tab.
        </p>
      </header>

      <div className="studio__mode" role="group" aria-label="Demo mode">
        <ContentSwitcher
          size="md"
          selectedIndex={effectiveMode === 'live' ? 1 : 0}
          onChange={({ name }) => setMode(name as Mode)}
        >
          <Switch name="guided" text="Guided demo" />
          <Switch name="live" text="Live CUGA" disabled={!liveAvailable} />
        </ContentSwitcher>
        <Tag type={effectiveMode === 'live' ? 'green' : 'purple'}>
          {effectiveMode === 'live' ? 'Live: CUGA' : 'Guided demo: simulated'}
        </Tag>
      </div>

      {status.phase === 'loading' && (
        <InlineLoading description="Checking for a CUGA connection" />
      )}
      {status.phase !== 'loading' && !liveAvailable && (
        <InlineNotification
          kind="info"
          lowContrast
          hideCloseButton
          title="CUGA is not connected."
          subtitle={
            status.phase === 'unavailable'
              ? 'The site server is not running, so only the guided demo is available. Every result below is simulated.'
              : status.status.cugaApi.configured
                ? 'The configured CUGA server did not answer. Every result below is simulated.'
                : 'No CUGA server is configured. Every result below is simulated.'
          }
        />
      )}
      {effectiveMode === 'live' && (
        <InlineNotification
          kind="warning"
          lowContrast
          hideCloseButton
          title="Live mode answers questions only."
          subtitle="CUGA sees the text of the demo page. Page edits and highlights need CUGA's browser extension runtime, which this site does not embed, so they stay in the guided demo."
        />
      )}
      {error && (
        <InlineNotification
          kind="error"
          lowContrast
          title="Request failed."
          subtitle={error}
          onCloseButtonClick={() => setError(null)}
        />
      )}

      <div className="studio__grid">
        <Tile className="studio__panel">
          <h2 className="cds--productive-heading-03">Chat</h2>
          <div
            className="studio__log"
            role="log"
            aria-live="polite"
            aria-label="Conversation"
          >
            {chat.length === 0 && (
              <p className="studio__empty">
                No messages yet. Pick an example or type a request.
              </p>
            )}
            {chat.map((entry) => (
              <div
                key={entry.id}
                className={`studio__msg studio__msg--${entry.role}`}
              >
                <strong>{entry.role === 'you' ? 'You' : 'Studio'}</strong>
                {entry.origin && (
                  <Tag
                    size="sm"
                    type={entry.origin === 'live CUGA' ? 'green' : 'purple'}
                  >
                    {entry.origin}
                  </Tag>
                )}
                <span>{entry.text}</span>
              </div>
            ))}
            {busy && <InlineLoading description="CUGA is working" />}
          </div>
          <div
            className="studio__examples"
            role="group"
            aria-label="Example requests"
          >
            {EXAMPLES.map((example) => (
              <Button
                key={example}
                kind="tertiary"
                size="sm"
                disabled={busy}
                onClick={() => void submit(example)}
              >
                {example}
              </Button>
            ))}
          </div>
          <form className="studio__form" onSubmit={onSubmit}>
            <TextInput
              id={inputId}
              labelText="Ask or request an edit"
              value={draft}
              maxLength={2000}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button type="submit" disabled={busy || !draft.trim()}>
              Send
            </Button>
          </form>
        </Tile>

        <Tile className="studio__panel">
          <div className="studio__panel-head">
            <h2 className="cds--productive-heading-03">Page preview</h2>
            <div className="studio__controls">
              <Button
                kind="ghost"
                size="sm"
                renderIcon={Undo}
                disabled={history.length === 0}
                onClick={undo}
              >
                Undo
              </Button>
              <Button kind="ghost" size="sm" renderIcon={Reset} onClick={reset}>
                Reset
              </Button>
              <Button
                kind="ghost"
                size="sm"
                disabled={!changed}
                aria-pressed={showBefore}
                onClick={() => setShowBefore((v) => !v)}
              >
                {showBefore ? 'Show after' : 'Show before'}
              </Button>
            </div>
          </div>
          <Tag type="gray" size="sm">
            {showBefore ? 'Before' : changed ? 'After' : 'Original'}: temporary
            preview edit
          </Tag>
          <DemoPage
            page={showBefore ? BASELINE_PAGE : page}
            highlight={showBefore ? null : highlight}
          />
          <p className="studio__note">
            Edits change this preview in your browser session only. They do not
            change the site&apos;s source code or any repository.
          </p>
        </Tile>

        <Tile className="studio__panel">
          <h2 className="cds--productive-heading-03">Action timeline</h2>
          {timeline.length === 0 ? (
            <p className="studio__empty">
              Actions appear here as the studio works.
            </p>
          ) : (
            <ol className="studio__timeline" aria-label="Action timeline">
              {timeline.map((step) => (
                <li key={step.id}>
                  <strong>{step.label}</strong>
                  <span>{step.detail}</span>
                  <Tag
                    size="sm"
                    type={step.origin === 'live CUGA' ? 'green' : 'purple'}
                  >
                    {step.origin}
                  </Tag>
                </li>
              ))}
            </ol>
          )}
        </Tile>
      </div>
    </div>
  )
}

export default CugaStudio

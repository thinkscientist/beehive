import {
  InlineLoading,
  InlineNotification,
  StructuredListBody,
  StructuredListCell,
  StructuredListHead,
  StructuredListRow,
  StructuredListWrapper,
  Tag,
} from '@carbon/react'
import { useEffect, useState } from 'react'
import { getJson } from '../../lib/http'

interface LiveRun {
  key: string
  title: string
  repo: string
  stage: string
  waitingOn: string
  assignee: string | null
}

type LiveState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; runs: LiveRun[] }

function LiveRuns() {
  const [state, setState] = useState<LiveState>({ phase: 'loading' })

  useEffect(() => {
    let active = true
    getJson<{ runs: LiveRun[] }>('/api/hive/runs')
      .then(({ runs }) => active && setState({ phase: 'ready', runs }))
      .catch(
        (e: unknown) =>
          active &&
          setState({
            phase: 'error',
            message: e instanceof Error ? e.message : 'Something went wrong.',
          }),
      )
    return () => {
      active = false
    }
  }, [])

  return (
    <section aria-labelledby="hive-live-heading" className="studio__section">
      <h2 id="hive-live-heading" className="cds--productive-heading-03">
        Live runs <Tag type="green">Live: Hive</Tag>
      </h2>
      {state.phase === 'loading' && (
        <InlineLoading description="Loading runs from Hive" />
      )}
      {state.phase === 'error' && (
        <InlineNotification
          kind="error"
          lowContrast
          hideCloseButton
          title="Could not load Hive runs."
          subtitle={state.message}
        />
      )}
      {state.phase === 'ready' && state.runs.length === 0 && (
        <p className="studio__empty">Hive reports no active runs.</p>
      )}
      {state.phase === 'ready' && state.runs.length > 0 && (
        <StructuredListWrapper aria-label="Live Hive runs">
          <StructuredListHead>
            <StructuredListRow head>
              <StructuredListCell head>Run</StructuredListCell>
              <StructuredListCell head>Stage</StructuredListCell>
              <StructuredListCell head>Waiting on</StructuredListCell>
              <StructuredListCell head>Assignee</StructuredListCell>
            </StructuredListRow>
          </StructuredListHead>
          <StructuredListBody>
            {state.runs.map((run) => (
              <StructuredListRow key={run.key}>
                <StructuredListCell>
                  {run.title}
                  <br />
                  <small>{run.key}</small>
                </StructuredListCell>
                <StructuredListCell>{run.stage}</StructuredListCell>
                <StructuredListCell>{run.waitingOn}</StructuredListCell>
                <StructuredListCell>
                  {run.assignee ?? 'unassigned'}
                </StructuredListCell>
              </StructuredListRow>
            ))}
          </StructuredListBody>
        </StructuredListWrapper>
      )}
    </section>
  )
}

export default LiveRuns

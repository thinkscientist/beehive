import {
  Button,
  InlineLoading,
  InlineNotification,
  ProgressIndicator,
  ProgressStep,
  StructuredListBody,
  StructuredListCell,
  StructuredListRow,
  StructuredListWrapper,
  Tag,
  Tile,
} from '@carbon/react'
import { useState } from 'react'
import { useServiceStatus } from '../../lib/useServiceStatus'
import LiveRuns from './LiveRuns'
import {
  SAMPLE_LANES,
  SAMPLE_REPO,
  SAMPLE_STAGES,
  SAMPLE_TASK_TITLE,
  TRUST_LEVELS,
} from './sampleData'

function HiveFleet() {
  const status = useServiceStatus()
  const live =
    status.phase === 'ready' &&
    status.status.hiveApi.configured &&
    status.status.hiveApi.reachable
  const [step, setStep] = useState(0)
  const stage = SAMPLE_STAGES[step]

  return (
    <div className="studio studio--hive">
      <header className="studio__header">
        <Tag type="purple">Hive</Tag>
        <h1 className="cds--productive-heading-05">Hive Agent Fleet</h1>
        <p className="cds--body-long-01">
          Hive is a work-governance plane for AI coding agents that maintain
          repositories. It connects the work queue, the rules and the review
          history. It is not a chat agent. This experience is independent of the
          CUGA tab.
        </p>
      </header>

      {status.phase === 'loading' && (
        <InlineLoading description="Checking for a Hive connection" />
      )}
      {status.phase !== 'loading' && !live && (
        <InlineNotification
          kind="info"
          lowContrast
          hideCloseButton
          title="Hive is not connected. Showing a guided preview."
          subtitle={
            status.phase === 'unavailable'
              ? 'The site server is not running. Everything below is sample data.'
              : status.status.hiveApi.configured
                ? 'The configured Hive dashboard did not answer. Everything below is sample data.'
                : 'No Hive dashboard is configured. Everything below is sample data.'
          }
        />
      )}

      {live && <LiveRuns />}

      <section
        aria-labelledby="hive-scenario-heading"
        className="studio__section"
      >
        <h2 id="hive-scenario-heading" className="cds--productive-heading-03">
          Guided scenario <Tag type="purple">Sample data, not live</Tag>
        </h2>
        <Tile className="studio__panel">
          <p>
            <strong>{SAMPLE_TASK_TITLE}</strong> in <code>{SAMPLE_REPO}</code>
          </p>
          <ProgressIndicator
            currentIndex={step}
            spaceEqually
            onChange={(index: number) => setStep(index)}
          >
            {SAMPLE_STAGES.map((s) => (
              <ProgressStep
                key={s.label}
                label={s.label}
                secondaryLabel={s.appliesTo}
              />
            ))}
          </ProgressIndicator>
          <div aria-live="polite" className="studio__stage">
            <div className="studio__stage-tags">
              <Tag type="blue">{stage.appliesTo}</Tag>{' '}
              <Tag type={stage.actor === 'human' ? 'red' : 'gray'}>
                acts: {stage.actor}
              </Tag>
            </div>
            <p>{stage.summary}</p>
            <p>
              <strong>Audit note (sample):</strong> {stage.audit}
            </p>
          </div>
          <div className="studio__controls">
            <Button
              kind="secondary"
              size="sm"
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
            >
              Previous stage
            </Button>
            <Button
              size="sm"
              disabled={step === SAMPLE_STAGES.length - 1}
              onClick={() => setStep(step + 1)}
            >
              Advance stage
            </Button>
          </div>
        </Tile>
      </section>

      <section aria-labelledby="hive-lanes-heading" className="studio__section">
        <h2 id="hive-lanes-heading" className="cds--productive-heading-03">
          Agent lanes <Tag type="purple">Sample data, not live</Tag>
        </h2>
        <div className="studio__lanes">
          {SAMPLE_LANES.map((lane) => (
            <Tile key={lane.role}>
              <strong>{lane.role}</strong>
              <div className="studio__lane-status">
                <Tag
                  type={lane.status === 'working' ? 'green' : 'gray'}
                  size="sm"
                >
                  {lane.status}
                </Tag>
              </div>
              <p>{lane.doing}</p>
            </Tile>
          ))}
        </div>
      </section>

      <section aria-labelledby="hive-trust-heading" className="studio__section">
        <h2 id="hive-trust-heading" className="cds--productive-heading-03">
          Trust levels (ACMM)
        </h2>
        <p className="cds--body-long-01">
          From the Hive documentation. The level decides which agents run and
          what they may do. Holdgated PRs carry a hold label that only a person
          removes.
        </p>
        <StructuredListWrapper aria-label="ACMM trust levels">
          <StructuredListBody>
            {TRUST_LEVELS.map((t) => (
              <StructuredListRow key={t.level}>
                <StructuredListCell noWrap>
                  {t.level} {t.name}
                </StructuredListCell>
                <StructuredListCell>{t.summary}</StructuredListCell>
              </StructuredListRow>
            ))}
          </StructuredListBody>
        </StructuredListWrapper>
      </section>
    </div>
  )
}

export default HiveFleet

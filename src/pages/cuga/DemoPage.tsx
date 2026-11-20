import {
  PRIMARY_BUTTON_LABEL,
  type HighlightId,
  type PageState,
} from './guidedEngine'

function DemoPage({
  page,
  highlight,
}: {
  page: PageState
  highlight: HighlightId | null
}) {
  const mark = (id: HighlightId) =>
    highlight === id ? 'cuga-page__mark cuga-page__mark--on' : 'cuga-page__mark'
  return (
    <article
      className={`cuga-page${page.calmTheme ? ' cuga-page--calm' : ''}`}
      aria-label="Demo page preview"
    >
      <h3 className="cuga-page__heading">{page.heading}</h3>
      {page.sections.map((section) => (
        <section key={section.id} className={mark(section.id)}>
          <h4>{section.title}</h4>
          <p>{section.body}</p>
          {section.id === 'retention' && page.explanation && (
            <p className="cuga-page__added">{page.explanation}</p>
          )}
        </section>
      ))}
      <button
        type="button"
        className={`${mark('primary-button')} cuga-page__button${
          page.prominentButton ? ' cuga-page__button--prominent' : ''
        }`}
      >
        {PRIMARY_BUTTON_LABEL}
      </button>
    </article>
  )
}

export default DemoPage

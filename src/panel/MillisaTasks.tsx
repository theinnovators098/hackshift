import TaskCard from '../millisa/TaskCard'
import { useMillisa } from '../millisa/MillisaProvider'
import { useStore } from '../store/AppStore'
import { Empty, PanelHead, Section, timeAgo, panelStyles as styles } from './ui'

export default function MillisaTasks() {
  const { tasks, clearTaskHistory, usedToday, data } = useStore()
  const { openPanel } = useMillisa()
  const waiting = tasks.filter((t) => t.status === 'waiting')
  const history = tasks.filter((t) => t.status !== 'waiting')

  return (
    <>
      <PanelHead
        title="Millisa tasks"
        intro="Millisa prepares applications, session requests, messages and posts. Nothing is sent until you approve it here or under its reply."
      >
        <button type="button" className="btn btn-primary btn-sm" onClick={openPanel}>
          Ask Millisa
        </button>
      </PanelHead>
      <p className={styles.cardSub}>
        {usedToday} of {data.settings.millisaDailyLimit} Millisa requests used today. Each answer can take a few requests when Millisa looks things up.
      </p>
      <Section title={`Waiting for your approval (${waiting.length})`}>
        {waiting.length === 0 ? (
          <Empty title="Nothing waiting">Ask Millisa to apply, book a mentor or write a message, and it will wait here for you.</Empty>
        ) : (
          <ul className={styles.list}>
            {waiting.map((t) => (
              <li key={t.id}>
                <TaskCard id={t.id} />
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="History">
        {history.length === 0 ? (
          <Empty title="No history yet" />
        ) : (
          <>
            <ul className={styles.feed}>
              {history.map((t) => (
                <li key={t.id}>
                  <span>
                    {t.summary}
                    <span className={styles.cellSub}> {t.result ?? t.status}</span>
                  </span>
                  <time dateTime={t.at}>{timeAgo(t.at)}</time>
                </li>
              ))}
            </ul>
            <div>
              <button type="button" className={styles.link} onClick={clearTaskHistory}>
                Clear history
              </button>
            </div>
          </>
        )}
      </Section>
    </>
  )
}

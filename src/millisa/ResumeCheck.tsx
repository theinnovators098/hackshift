import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Bookmark, BookmarkCheck, FileText, RotateCcw, Upload } from 'lucide-react'
import { matchOpportunities, overlap } from '../lib/match'
import { askJson, errorText, MillisaError, SMART } from '../lib/millisa'
import { adviceRequest, resumeRequest, type ResumeAdvice, type ResumeRead } from '../lib/millisaPrompts'
import { checkResumeFile, keepResumeDraft, mergeResume, readAsBase64, resumeAccept } from '../lib/resume'
import { useStore } from '../store/AppStore'
import { useMillisa } from './MillisaProvider'
import { LangToggle, MillisaMark, Points, Problem, Thinking } from './parts'
import styles from './ResumeCheck.module.css'

type Step = 'idle' | 'reading' | 'advising' | 'done' | 'error'

const tone = { Strong: styles.strong, 'Good start': styles.middle, 'Needs work': styles.weak }

export default function ResumeCheck() {
  const store = useStore()
  const { account, profile, opportunities, challenges, mentors, saved, toggleSaved, saveProfile, setResume } = store
  const { ensureKey, keyRejected, lang } = useMillisa()
  const navigate = useNavigate()
  const input = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('idle')
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [found, setFound] = useState<ResumeRead | null>(null)
  const [advice, setAdvice] = useState<ResumeAdvice | null>(null)
  const [dragging, setDragging] = useState(false)
  const [added, setAdded] = useState(false)
  const lastFile = useRef<File | null>(null)

  const isSeeker = !!account && account.kind === 'seeker'

  const advise = async (read: ResumeRead) => {
    setStep('advising')
    const { data } = await askJson<ResumeAdvice>({ model: SMART, ...adviceRequest(read, { opportunities, challenges, mentors }, lang) })
    setAdvice(data)
    setStep('done')
  }

  const run = async (file: File) => {
    const problem = checkResumeFile(file)
    if (problem) {
      setError(problem)
      setStep('error')
      return
    }
    if (!(await ensureKey())) return
    lastFile.current = file
    setFileName(file.name)
    setFound(null)
    setAdvice(null)
    setAdded(false)
    setError('')
    setStep('reading')
    try {
      const data = await readAsBase64(file)
      const { data: read } = await askJson<ResumeRead>({ model: SMART, ...resumeRequest(), files: [{ mimeType: file.type, data }] })
      if (read.skills.length === 0 && read.education.length === 0 && read.work.length === 0) {
        setError('Millisa could not find resume details in that file. Try a clearer photo or the PDF of your resume.')
        setStep('error')
        return
      }
      setFound(read)
      if (account) setResume(file.name)
      await advise(read)
    } catch (e) {
      if (e instanceof MillisaError && e.kind === 'bad-key') keyRejected()
      setError(errorText(e))
      setStep('error')
    }
  }

  const pickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) run(file)
  }

  const drop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) run(file)
  }

  const retry = () => {
    if (found) {
      advise(found).catch((e) => {
        setError(errorText(e))
        setStep('error')
      })
    } else if (lastFile.current) run(lastFile.current)
  }

  const addToProfile = () => {
    if (!found || !profile) return
    saveProfile(mergeResume(profile, found))
    setAdded(true)
  }

  const createProfile = () => {
    if (!found) return
    keepResumeDraft(found)
    navigate('/start')
  }

  const live = (id: string) => opportunities.find((o) => o.id === id)
  const roles = advice
    ? advice.roles.filter((r) => live(r.id))
    : []
  const fallback = found && advice && roles.length === 0 ? matchOpportunities(opportunities, found.skills, 3).filter((m) => m.hits.length) : []
  const picks = (list: { id: string; why: string }[], from: { id: string }[]) => list.filter((x) => from.some((y) => y.id === x.id))

  return (
    <div className={styles.wrap}>
      <section
        className={`${styles.drop} ${dragging ? styles.dragging : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
      >
        <MillisaMark size={34} />
        <div className={styles.dropText}>
          <h2>{found ? 'Check another resume' : 'Upload your resume'}</h2>
          <p>PDF, or a clear photo of a printed resume. Up to 4 MB. You can also drop the file here.</p>
        </div>
        <div className={styles.dropActions}>
          <LangToggle />
          <input ref={input} type="file" accept={resumeAccept} hidden onChange={pickFile} />
          <button type="button" className="btn btn-accent" onClick={() => input.current?.click()} disabled={step === 'reading' || step === 'advising'}>
            <Upload size={17} /> {found ? 'Upload again' : 'Choose a file'}
          </button>
        </div>
        <p className={styles.privacy}>
          Your resume is sent to Millisa’s AI service to be read. HackShift does not keep the file, only the details you choose to add to your profile.
        </p>
      </section>

      {step === 'reading' && <Thinking>Millisa is reading {fileName}</Thinking>}
      {step === 'error' && <Problem message={error} onRetry={lastFile.current ? retry : undefined} />}

      {found && (
        <section className={styles.block}>
          <div className={styles.blockHead}>
            <h2>
              <FileText size={18} aria-hidden="true" /> What Millisa found
            </h2>
            {isSeeker ? (
              added ? (
                <Link to="/panel/profile" className="btn btn-ghost btn-sm">
                  Added. See my profile
                </Link>
              ) : (
                <button type="button" className="btn btn-primary btn-sm" onClick={addToProfile}>
                  Add these details to my profile
                </button>
              )
            ) : !account ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={createProfile}>
                Create my profile from this
              </button>
            ) : null}
          </div>
          <div className={styles.found}>
            <div>
              {found.name && <p className={styles.name}>{found.name}</p>}
              <p className={styles.sub}>{[found.headline, found.city].filter(Boolean).join('. ')}</p>
              {found.skills.length > 0 && (
                <div className={styles.skills}>
                  {found.skills.map((s) => (
                    <span key={s} className="tag">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <dl className={styles.facts}>
              <div>
                <dt>Education</dt>
                <dd>{found.education.map((e) => `${e.degree}, ${e.school}`).join('; ') || 'Not found'}</dd>
              </div>
              <div>
                <dt>Work and projects</dt>
                <dd>{found.work.map((w) => `${w.role}${w.org ? `, ${w.org}` : ''}`).join('; ') || 'Not found'}</dd>
              </div>
              <div>
                <dt>Certificates</dt>
                <dd>{found.certificates.map((c) => c.name).join('; ') || 'None'}</dd>
              </div>
            </dl>
          </div>
          <p className={styles.note}>Check these details. Millisa copies what it reads and can misread a blurry photo.</p>
        </section>
      )}

      {step === 'advising' && <Thinking>Millisa is matching your resume to roles, challenges and mentors on HackShift</Thinking>}

      {advice && found && (
        <>
          <section className={styles.verdict}>
            <p className={`${styles.badge} ${tone[advice.strength]}`}>{advice.strength}</p>
            <p className={styles.summary}>{advice.summary}</p>
          </section>

          <section className={styles.block}>
            <div className={styles.blockHead}>
              <h2>Roles that fit this resume</h2>
              <Link to="/opportunities" className={styles.more}>
                All roles
              </Link>
            </div>
            {roles.length === 0 && fallback.length === 0 ? (
              <p className={styles.note}>Nothing on HackShift fits closely yet. The skills below would open up the most roles.</p>
            ) : (
              <ul className={styles.roles}>
                {(roles.length ? roles : fallback.map((m) => ({ id: m.item.id, why: `You list ${m.hits.join(' and ')}.`, missing: m.item.skills.filter((s) => !m.hits.includes(s)) }))).map((r) => {
                  const o = live(r.id)!
                  const hits = overlap(o.skills, found.skills)
                  return (
                    <li key={r.id} className={styles.role}>
                      <div className={styles.roleTop}>
                        <div>
                          <Link to={`/opportunities/${o.id}`} className={styles.roleTitle}>
                            {o.title}
                          </Link>
                          <p className={styles.sub}>
                            {o.company}, {o.city}
                            {o.remote ? ', remote ok' : ''}. <span className="num">{o.pay}</span>
                          </p>
                        </div>
                        {isSeeker && (
                          <button type="button" className={styles.save} onClick={() => toggleSaved(o.id)} aria-pressed={saved.includes(o.id)} aria-label={saved.includes(o.id) ? `Remove ${o.title} from saved` : `Save ${o.title}`}>
                            {saved.includes(o.id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                          </button>
                        )}
                      </div>
                      <p className={styles.why}>{r.why}</p>
                      <p className={styles.match}>
                        {hits.length > 0 && <span className={styles.have}>You have {hits.join(', ')}</span>}
                        {r.missing.length > 0 && <span className={styles.miss}>Missing {r.missing.join(', ')}</span>}
                      </p>
                      <Link to={`/opportunities/${o.id}`} className={styles.go}>
                        See the role and apply <ArrowRight size={15} />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <div className={styles.two}>
            <section className={styles.block}>
              <h2>Make the resume stronger</h2>
              <Points title="Fix these first" items={advice.fixes} tone="gap" />
              {advice.rewrites.length > 0 && (
                <div className={styles.rewrites}>
                  <h3>Lines to rewrite</h3>
                  {advice.rewrites.map((w) => (
                    <div key={w.before} className={styles.rewrite}>
                      <p className={styles.before}>{w.before}</p>
                      <p className={styles.after}>{w.after}</p>
                    </div>
                  ))}
                  <p className={styles.note}>Fill anything in square brackets with your real numbers.</p>
                </div>
              )}
            </section>

            <section className={styles.block}>
              <h2>Grow from here</h2>
              {advice.learn.length > 0 && (
                <div>
                  <h3>Skills to learn next</h3>
                  <ul className={styles.list}>
                    {advice.learn.map((l) => (
                      <li key={l.skill}>
                        <strong>{l.skill}</strong>. {l.how}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {picks(advice.challenges, challenges).length > 0 && (
                <div>
                  <h3>Prove it with a challenge</h3>
                  <ul className={styles.list}>
                    {picks(advice.challenges, challenges).map((c) => (
                      <li key={c.id}>
                        <Link to={`/challenges/${c.id}`}>{challenges.find((x) => x.id === c.id)!.title}</Link>. {c.why}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {picks(advice.mentors, mentors).length > 0 && (
                <div>
                  <h3>Talk to a mentor</h3>
                  <ul className={styles.list}>
                    {picks(advice.mentors, mentors).map((m) => (
                      <li key={m.id}>
                        <Link to={`/mentors/${m.id}`}>{mentors.find((x) => x.id === m.id)!.name}</Link>. {m.why}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>

          <div className={styles.end}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={retry}>
              <RotateCcw size={15} /> Suggest again
            </button>
            {isSeeker && (
              <Link to="/panel/plan" className="btn btn-ghost btn-sm">
                Make a career plan
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}

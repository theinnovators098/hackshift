import { Navigate, useLocation } from 'react-router-dom'
import { useStore } from '../store/AppStore'
import MentorPanel from './MentorPanel'
import RecruiterPanel from './RecruiterPanel'
import SeekerPanel from './SeekerPanel'
import StartupPanel from './StartupPanel'

export function MemberGate() {
  const { account } = useStore()
  const { pathname } = useLocation()
  if (!account) return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />
  if (account.kind === 'startup') return <StartupPanel />
  if (account.kind === 'mentor') return <MentorPanel />
  if (account.kind === 'recruiter') return <RecruiterPanel />
  return <SeekerPanel />
}

import { Navigate, useLocation } from 'react-router-dom'
import { useStore } from '../store/AppStore'
import AdminPanel from './AdminPanel'
import MentorPanel from './MentorPanel'
import RecruiterPanel from './RecruiterPanel'
import SeekerPanel from './SeekerPanel'
import StartupPanel from './StartupPanel'

function useGate() {
  const { account } = useStore()
  const { pathname } = useLocation()
  return { account, login: <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace /> }
}

export function MemberGate() {
  const { account, login } = useGate()
  if (!account) return login
  if (account.kind === 'admin') return <Navigate to="/admin" replace />
  if (account.kind === 'startup') return <StartupPanel />
  if (account.kind === 'mentor') return <MentorPanel />
  if (account.kind === 'recruiter') return <RecruiterPanel />
  return <SeekerPanel />
}

export function AdminGate() {
  const { account, login } = useGate()
  if (!account) return login
  if (account.kind !== 'admin') return <Navigate to="/panel" replace />
  return <AdminPanel />
}

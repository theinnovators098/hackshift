import { Navigate, useLocation } from 'react-router-dom'
import { useStore } from '../store/AppStore'
import SeekerPanel from './SeekerPanel'
import StartupPanel from './StartupPanel'

export function MemberGate() {
  const { account } = useStore()
  const { pathname } = useLocation()
  if (!account) return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />
  if (account.kind === 'startup') return <StartupPanel />
  return <SeekerPanel />
}

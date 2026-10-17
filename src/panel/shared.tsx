import { Route } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { MillisaMarkIcon } from './MillisaIcon'
import { useStore } from '../store/AppStore'
import Messages from './Messages'
import MillisaTasks from './MillisaTasks'
import type { NavItem } from './PanelShell'

export function useSharedNav(base: '/panel' | '/admin'): NavItem[] {
  const { threads, tasks } = useStore()
  const unread = threads.reduce((n, t) => n + t.unread, 0)
  const waiting = tasks.filter((t) => t.status === 'waiting').length
  return [
    { to: `${base}/messages`, label: 'Messages', icon: MessageSquare, count: unread },
    { to: `${base}/millisa`, label: 'Millisa tasks', icon: MillisaMarkIcon, count: waiting },
  ]
}

export function sharedRoutes() {
  return (
    <>
      <Route path="messages" element={<Messages />} />
      <Route path="messages/:otherId" element={<Messages />} />
      <Route path="millisa" element={<MillisaTasks />} />
    </>
  )
}

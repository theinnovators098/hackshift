import { Route } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { useStore } from '../store/AppStore'
import Messages from './Messages'
import type { NavItem } from './PanelShell'

export function useSharedNav(base: '/panel' | '/admin'): NavItem[] {
  const { threads } = useStore()
  const unread = threads.reduce((n, t) => n + t.unread, 0)
  return [{ to: `${base}/messages`, label: 'Messages', icon: MessageSquare, count: unread }]
}

export function sharedRoutes() {
  return (
    <>
      <Route path="messages" element={<Messages />} />
      <Route path="messages/:otherId" element={<Messages />} />
    </>
  )
}

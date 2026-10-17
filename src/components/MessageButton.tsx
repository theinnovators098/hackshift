import { useNavigate } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { useStore } from '../store/AppStore'

interface Props {
  to?: string
  label?: string
  small?: boolean
  plain?: boolean
}

export default function MessageButton({ to, label = 'Message', small = true, plain = false }: Props) {
  const { account, accountById } = useStore()
  const navigate = useNavigate()
  const target = to ? accountById(to) : undefined
  if (!target || target.id === account?.id || target.status !== 'active') return null
  const hiring = account?.kind === 'startup' || account?.kind === 'recruiter'
  if (hiring && target.kind === 'seeker' && target.profile.allowMessages === false) return null

  const open = () => {
    const base = account?.kind === 'admin' ? '/admin/messages' : '/panel/messages'
    navigate(account ? `${base}/${target.id}` : `/login?next=${encodeURIComponent(`/panel/messages/${target.id}`)}`)
  }

  return (
    <button type="button" className={plain ? 'text-btn' : `btn btn-ghost ${small ? 'btn-sm' : ''}`} onClick={open}>
      <MessageSquare size={small ? 15 : 17} aria-hidden="true" /> {label}
    </button>
  )
}

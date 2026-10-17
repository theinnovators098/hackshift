import { Navigate, Route, Routes } from 'react-router-dom'
import { Briefcase, Building2, CalendarDays, ClipboardCheck, LayoutDashboard, UserCog, Users, Zap } from 'lucide-react'
import AccountSettings from './AccountSettings'
import Calendar from './Calendar'
import { ChallengeEditor, RoleEditor } from './Editors'
import { Applicants, Company, ContentTable, HiringOverview, Submissions, useCompany } from './hiring'
import { sharedRoutes, useSharedNav } from './shared'
import PanelShell from './PanelShell'

export default function StartupPanel() {
  const { applicants, submissions } = useCompany()
  const shared = useSharedNav('/panel')
  const nav = [
    { to: '/panel', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/panel/roles', label: 'Roles', icon: Briefcase },
    { to: '/panel/applicants', label: 'Applicants', icon: Users, count: applicants.filter((a) => a.status === 'Applied').length },
    { to: '/panel/challenges', label: 'Challenges', icon: Zap },
    { to: '/panel/submissions', label: 'Challenge work', icon: ClipboardCheck, count: submissions.filter((s) => s.status === 'In review').length },
    { to: '/panel/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/panel/company', label: 'Company profile', icon: Building2 },
    ...shared,
    { to: '/panel/account', label: 'Account', icon: UserCog },
  ]
  return (
    <PanelShell nav={nav} publicLink={{ to: '/opportunities', label: 'See the public site' }}>
      <Routes>
        <Route index element={<HiringOverview />} />
        <Route path="roles" element={<ContentTable kind="opportunities" />} />
        <Route path="roles/new" element={<RoleEditor backTo="/panel/roles" />} />
        <Route path="roles/:id" element={<RoleEditor backTo="/panel/roles" />} />
        <Route path="challenges" element={<ContentTable kind="challenges" />} />
        <Route path="challenges/new" element={<ChallengeEditor backTo="/panel/challenges" />} />
        <Route path="challenges/:id" element={<ChallengeEditor backTo="/panel/challenges" />} />
        <Route path="applicants" element={<Applicants />} />
        <Route path="submissions" element={<Submissions />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="company" element={<Company />} />
        {sharedRoutes()}
        <Route path="account" element={<AccountSettings />} />
        <Route path="*" element={<Navigate to="/panel" replace />} />
      </Routes>
    </PanelShell>
  )
}

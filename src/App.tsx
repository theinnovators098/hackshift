import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Opportunities from './pages/Opportunities'
import OpportunityDetail from './pages/OpportunityDetail'
import Practice from './pages/Practice'
import Talent from './pages/Talent'
import Mentors from './pages/Mentors'
import MentorDetail from './pages/MentorDetail'
import Profile from './pages/Profile'
import Ventures from './pages/Ventures'
import VentureDetail from './pages/VentureDetail'
import NewVenture from './pages/NewVenture'
import Schemes from './pages/Schemes'
import Challenges from './pages/Challenges'
import ChallengeDetail from './pages/ChallengeDetail'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="start" element={<Onboarding />} />
        <Route path="login" element={<Login />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="opportunities" element={<Opportunities />} />
        <Route path="opportunities/:id" element={<OpportunityDetail />} />
        <Route path="opportunities/:id/practice" element={<Practice />} />
        <Route path="challenges" element={<Challenges />} />
        <Route path="challenges/:id" element={<ChallengeDetail />} />
        <Route path="ventures" element={<Ventures />} />
        <Route path="ventures/new" element={<NewVenture />} />
        <Route path="ventures/:id" element={<VentureDetail />} />
        <Route path="schemes" element={<Schemes />} />
        <Route path="mentors" element={<Mentors />} />
        <Route path="mentors/:id" element={<MentorDetail />} />
        <Route path="profile" element={<Profile />} />
        <Route path="talent" element={<Talent />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

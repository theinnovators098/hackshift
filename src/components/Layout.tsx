import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

const titles: Record<string, string> = {
  '': 'HackShift',
  start: 'Your profile',
  dashboard: 'Dashboard',
  profile: 'Profile',
  opportunities: 'Opportunities',
  challenges: 'Challenges',
  ventures: 'Ventures',
  mentors: 'Mentors',
  talent: 'Find talent',
  schemes: 'Government schemes',
}

export default function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    const section = pathname.split('/')[1] ?? ''
    const name = titles[section]
    document.title = section === '' ? 'HackShift' : `${name ?? 'Page not found'} | HackShift`
  }, [pathname])

  return (
    <>
      <a href="#main" className="visually-hidden">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

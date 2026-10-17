import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Role, Stage, Venture } from '../data/types'

export interface Profile {
  name: string
  city: string
  college: string
  roles: Role[]
  skills: string[]
  goal: string
}

export interface Application {
  opportunityId: string
  note: string
  appliedOn: string
}

export interface Submission {
  challengeId: string
  link: string
  note: string
  submittedOn: string
  status: 'In review' | 'Accepted'
}

export interface Booking {
  mentorId: string
  day: string
  time: string
  topic: string
}

interface State {
  profile: Profile | null
  saved: string[]
  applications: Application[]
  submissions: Submission[]
  bookings: Booking[]
  myVentures: Venture[]
  interested: string[]
  reviewRequests: string[]
  shortlist: string[]
}

const emptyState: State = {
  profile: null,
  saved: [],
  applications: [],
  submissions: [],
  bookings: [],
  myVentures: [],
  interested: [],
  reviewRequests: [],
  shortlist: [],
}

const STORAGE_KEY = 'hackshift:v1'

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...emptyState, ...JSON.parse(raw) } : emptyState
  } catch {
    return emptyState
  }
}

function today() {
  return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

function useAppState() {
  const [state, setState] = useState<State>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      return
    }
  }, [state])

  const saveProfile = useCallback((profile: Profile) => setState((s) => ({ ...s, profile })), [])

  const toggleSaved = useCallback((id: string) => setState((s) => ({ ...s, saved: toggle(s.saved, id) })), [])

  const apply = useCallback(
    (opportunityId: string, note: string) =>
      setState((s) => ({
        ...s,
        applications: [...s.applications.filter((a) => a.opportunityId !== opportunityId), { opportunityId, note, appliedOn: today() }],
      })),
    [],
  )

  const submit = useCallback(
    (challengeId: string, link: string, note: string) =>
      setState((s) => ({
        ...s,
        submissions: [
          ...s.submissions.filter((x) => x.challengeId !== challengeId),
          { challengeId, link, note, submittedOn: today(), status: 'In review' },
        ],
      })),
    [],
  )

  const markReviewed = useCallback(
    (challengeId: string) =>
      setState((s) => ({
        ...s,
        submissions: s.submissions.map((x) => (x.challengeId === challengeId ? { ...x, status: 'Accepted' } : x)),
      })),
    [],
  )

  const book = useCallback((booking: Booking) => setState((s) => ({ ...s, bookings: [...s.bookings, booking] })), [])

  const cancelBooking = useCallback(
    (booking: Booking) =>
      setState((s) => ({
        ...s,
        bookings: s.bookings.filter(
          (b) => !(b.mentorId === booking.mentorId && b.day === booking.day && b.time === booking.time),
        ),
      })),
    [],
  )

  const addVenture = useCallback(
    (venture: Venture) => setState((s) => ({ ...s, myVentures: [venture, ...s.myVentures] })),
    [],
  )

  const moveVenture = useCallback(
    (id: string, stage: Stage) =>
      setState((s) => ({ ...s, myVentures: s.myVentures.map((v) => (v.id === id ? { ...v, stage } : v)) })),
    [],
  )

  const toggleInterest = useCallback(
    (id: string) => setState((s) => ({ ...s, interested: toggle(s.interested, id) })),
    [],
  )

  const requestReview = useCallback(
    (id: string) =>
      setState((s) => ({ ...s, reviewRequests: s.reviewRequests.includes(id) ? s.reviewRequests : [...s.reviewRequests, id] })),
    [],
  )

  const toggleShortlist = useCallback(
    (id: string) => setState((s) => ({ ...s, shortlist: toggle(s.shortlist, id) })),
    [],
  )

  const reset = useCallback(() => setState(emptyState), [])

  return useMemo(
    () => ({
      ...state,
      saveProfile,
      toggleSaved,
      apply,
      submit,
      markReviewed,
      book,
      cancelBooking,
      addVenture,
      moveVenture,
      toggleInterest,
      requestReview,
      toggleShortlist,
      reset,
    }),
    [state, saveProfile, toggleSaved, apply, submit, markReviewed, book, cancelBooking, addVenture, moveVenture, toggleInterest, requestReview, toggleShortlist, reset],
  )
}

type Store = ReturnType<typeof useAppState>

const StoreContext = createContext<Store | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const store = useAppState()
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside AppStoreProvider')
  return store
}

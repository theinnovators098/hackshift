import { challenges } from '../data/challenges'
import { opportunities } from '../data/opportunities'
import { mentors, people } from '../data/people'
import { schemes } from '../data/schemes'
import { ventures } from '../data/ventures'
import type { Account, Data } from './types'

export const DEMO_PASSWORD = 'demo1234'

function dayLabel(offset: number) {
  const d = new Date()
  let added = 0
  while (added < offset) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0) added++
  }
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

function dateLabel(daysAgo: number) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function minutesAgo(n: number) {
  return new Date(Date.now() - n * 60000).toISOString()
}

const emptyLists = () => ({ saved: [], interested: [], reviewRequests: [] })

function personAccount(personId: string, email: string, joined: number): Account {
  const p = people.find((x) => x.id === personId)!
  return {
    id: `acc-${personId}`,
    kind: 'seeker',
    name: p.name,
    email,
    password: DEMO_PASSWORD,
    status: 'active',
    joinedOn: dateLabel(joined),
    personId,
    profile: { name: p.name, city: p.city, college: p.college, roles: ['seeker'], skills: p.skills, goal: p.headline },
    lists: emptyLists(),
  }
}

export function seed(): Data {
  const accounts: Account[] = [
    {
      id: 'acc-admin',
      kind: 'admin',
      name: 'Abhishek',
      email: 'admin@hackshift.in',
      password: DEMO_PASSWORD,
      status: 'active',
      joinedOn: dateLabel(40),
      profile: { name: 'Abhishek', city: 'Delhi', college: 'HackShift team', roles: [], skills: [], goal: '' },
      lists: emptyLists(),
    },
    {
      ...personAccount('riya-sharma', 'riya@hackshift.in', 12),
      profile: {
        name: 'Riya Sharma',
        city: 'Indore',
        college: 'DAVV Indore',
        roles: ['seeker', 'founder'],
        skills: ['React', 'CSS', 'Figma'],
        goal: 'A frontend internship at a startup that works with small businesses',
      },
    },
    {
      id: 'acc-tapri',
      kind: 'startup',
      name: 'Karan Malhotra',
      email: 'karan@tapripay.in',
      password: DEMO_PASSWORD,
      status: 'active',
      joinedOn: dateLabel(30),
      company: 'Tapri Pay',
      companyAbout:
        'Tapri Pay lets chai stalls and small kirana shops accept UPI and keep a simple khata. We have 40,000 shops on the app and a team of eleven.',
      website: 'https://tapripay.in',
      profile: { name: 'Karan Malhotra', city: 'Pune', college: 'Tapri Pay', roles: ['startup'], skills: [], goal: '' },
      lists: emptyLists(),
    },
    {
      id: 'acc-meera',
      kind: 'mentor',
      name: 'Meera Iyer',
      email: 'meera@hackshift.in',
      password: DEMO_PASSWORD,
      status: 'active',
      joinedOn: dateLabel(60),
      mentorId: 'meera-iyer',
      profile: { name: 'Meera Iyer', city: 'Bengaluru', college: 'a payments company', roles: ['mentor'], skills: ['Product'], goal: '' },
      lists: emptyLists(),
    },
    {
      id: 'acc-neha',
      kind: 'recruiter',
      name: 'Neha Kapoor',
      email: 'neha@pinwheel.in',
      password: DEMO_PASSWORD,
      status: 'active',
      joinedOn: dateLabel(20),
      company: 'Pinwheel Logistics',
      profile: { name: 'Neha Kapoor', city: 'Surat', college: 'Pinwheel Logistics', roles: ['recruiter'], skills: [], goal: '' },
      lists: emptyLists(),
    },
    personAccount('aman-verma', 'aman@hackshift.in', 9),
    personAccount('nandini-reddy', 'nandini@hackshift.in', 15),
    personAccount('sahil-bhat', 'sahil@hackshift.in', 22),
    personAccount('priya-nair', 'priya@hackshift.in', 6),
    personAccount('vikram-joshi', 'vikram@hackshift.in', 4),
    personAccount('tanvi-desai', 'tanvi@hackshift.in', 18),
    {
      id: 'acc-rohit-bansal',
      kind: 'mentor',
      name: 'Rohit Bansal',
      email: 'rohit@hackshift.in',
      password: DEMO_PASSWORD,
      status: 'active',
      joinedOn: dateLabel(1),
      mentorId: 'rohit-bansal',
      profile: { name: 'Rohit Bansal', city: 'Chandigarh', college: 'a D2C apparel brand', roles: ['mentor'], skills: [], goal: '' },
      lists: emptyLists(),
    },
  ]

  return {
    version: 2,
    session: null,
    accounts,
    opportunities: [
      ...opportunities.map((o) => (o.company === 'Tapri Pay' ? { ...o, ownerId: 'acc-tapri' } : o)),
      {
        id: 'tapri-support-marathi',
        title: 'Shopkeeper support associate (Marathi)',
        company: 'Tapri Pay',
        kind: 'Job',
        city: 'Pune',
        remote: false,
        pay: '₹2.6–3 LPA',
        skills: ['Marathi', 'Communication', 'Customer support'],
        postedDaysAgo: 0,
        closes: '10 Nov',
        about:
          'Tapri Pay lets chai stalls and small kirana shops accept UPI and keep a simple khata. We have 40,000 shops on the app and a team of eleven.',
        work: [
          'Answer calls and WhatsApp messages from shopkeepers in Marathi and Hindi',
          'Help new shops set up their first UPI QR code',
          'Write down the questions people ask most so we can fix the app',
        ],
        status: 'pending',
        ownerId: 'acc-tapri',
      },
    ],
    challenges: challenges.map((c) => (c.company === 'Tapri Pay' ? { ...c, ownerId: 'acc-tapri' } : c)),
    mentors: [
      ...mentors.map((m) => (m.id === 'meera-iyer' ? { ...m, ownerId: 'acc-meera' } : m)),
      {
        id: 'rohit-bansal',
        name: 'Rohit Bansal',
        title: 'Growth head',
        company: 'a D2C apparel brand',
        city: 'Chandigarh',
        expertise: ['Marketing', 'Branding', 'Instagram'],
        languages: ['English', 'Hindi', 'Punjabi'],
        bio: 'Took a Ludhiana knitwear label from zero to ₹4 crore in online sales. Happy to look at your launch plan or your first ads.',
        sessions: 0,
        yearsExp: 8,
        status: 'pending',
        ownerId: 'acc-rohit-bansal',
      },
    ],
    people,
    ventures: [
      ...ventures,
      {
        id: 'chai-ledger',
        name: 'Chai Ledger',
        oneLiner: 'Voice notes that turn into a daily sales record for tea stalls',
        founder: 'Tanvi Desai',
        city: 'Vadodara',
        sector: 'Fintech',
        stage: 'Idea',
        problem: 'Tea stall owners in Vadodara do not write down sales, so they never know which days lose money.',
        progress: ['Spoke to 11 stall owners near MSU'],
        lookingFor: ['Technical co-founder'],
        team: 1,
        status: 'pending',
        ownerId: 'acc-tanvi-desai',
      },
    ],
    schemes,
    applications: [
      {
        id: 'app-1',
        opportunityId: 'tapri-frontend-intern',
        accountId: 'acc-vikram-joshi',
        note: 'I built the registration and payment pages for two college fests in React. I also did your payment screen challenge, where I made the amount the biggest thing on the screen.',
        appliedOn: dateLabel(2),
        status: 'Sent',
      },
      {
        id: 'app-2',
        opportunityId: 'tapri-frontend-intern',
        accountId: 'acc-tanvi-desai',
        note: 'I am a designer first, but I can turn my Figma screens into clean CSS. I would love to design for shopkeepers.',
        appliedOn: dateLabel(1),
        status: 'Shortlisted',
      },
      {
        id: 'app-3',
        opportunityId: 'ganit-ml-intern',
        accountId: 'acc-nandini-reddy',
        note: 'I grouped fraction mistakes for your challenge and found four misconceptions that cover most wrong answers.',
        appliedOn: dateLabel(3),
        status: 'Interview',
      },
      {
        id: 'app-4',
        opportunityId: 'pinwheel-ops-analyst',
        accountId: 'acc-aman-verma',
        note: 'I found that the Ring Road delays come from loading time at two warehouses, not traffic.',
        appliedOn: dateLabel(4),
        status: 'Shortlisted',
      },
    ],
    submissions: [
      {
        id: 'sub-1',
        challengeId: 'tapri-checkout',
        accountId: 'acc-vikram-joshi',
        link: 'https://github.com/vikramjoshi/tapri-confirm',
        note: 'The amount is now three times larger and the screen turns green with a short sound. Large payments over ₹500 also vibrate twice.',
        submittedOn: dateLabel(3),
        status: 'In review',
      },
      {
        id: 'sub-2',
        challengeId: 'tapri-checkout',
        accountId: 'acc-tanvi-desai',
        link: 'https://www.figma.com/file/tanvi-tapri',
        note: 'Figma prototype only. I used colour bands for amount ranges so a shopkeeper can tell ₹10 from ₹1,000 from across the counter.',
        submittedOn: dateLabel(2),
        status: 'In review',
      },
      {
        id: 'sub-3',
        challengeId: 'bunkar-tag',
        accountId: 'acc-tanvi-desai',
        link: 'https://www.figma.com/file/tanvi-bunkar',
        note: 'A folded tag with the weaver family photo and a QR code to a 30 second video.',
        submittedOn: dateLabel(9),
        status: 'Accepted',
        feedback: 'Lovely work. We are printing it for the Diwali batch.',
      },
    ],
    bookings: [
      {
        id: 'book-1',
        mentorId: 'meera-iyer',
        accountId: 'acc-aman-verma',
        day: dayLabel(1),
        time: '7:30 pm',
        topic: 'I am moving from mechanical engineering to data analysis. How do I explain the switch in interviews?',
        status: 'Requested',
      },
      {
        id: 'book-2',
        mentorId: 'meera-iyer',
        accountId: 'acc-priya-nair',
        day: dayLabel(2),
        time: '8:00 pm',
        topic: 'Can a content writer move into product? What should I build first?',
        status: 'Confirmed',
      },
    ],
    pipeline: [
      {
        id: 'pipe-1',
        recruiterId: 'acc-neha',
        personId: 'aman-verma',
        stage: 'Interview',
        note: 'Strong on the late routes challenge. Second round with ops head.',
        interviewOn: `${dayLabel(2)}, 11:00 am`,
        updatedOn: dateLabel(1),
      },
      {
        id: 'pipe-2',
        recruiterId: 'acc-neha',
        personId: 'nandini-reddy',
        stage: 'Contacted',
        note: 'Sent a message about the analyst role. Waiting to hear back.',
        updatedOn: dateLabel(2),
      },
      {
        id: 'pipe-3',
        recruiterId: 'acc-neha',
        personId: 'sahil-bhat',
        stage: 'Shortlisted',
        note: '',
        updatedOn: dateLabel(3),
      },
    ],
    log: [
      { id: 'log-1', at: minutesAgo(35), actorId: 'acc-rohit-bansal', text: 'Rohit Bansal applied to become a mentor' },
      { id: 'log-2', at: minutesAgo(80), actorId: 'acc-tapri', text: 'Tapri Pay posted "Shopkeeper support associate (Marathi)" for review' },
      { id: 'log-3', at: minutesAgo(140), actorId: 'acc-tanvi-desai', text: 'Tanvi Desai posted the idea "Chai Ledger" for review' },
      { id: 'log-4', at: minutesAgo(300), actorId: 'acc-vikram-joshi', text: 'Vikram Joshi applied to Frontend intern at Tapri Pay' },
      { id: 'log-5', at: minutesAgo(1440), actorId: 'acc-priya-nair', text: 'Priya Nair booked a session with Meera Iyer' },
    ],
    settings: { reviewPosts: true },
  }
}

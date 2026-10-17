import { challenges } from '../data/challenges'
import { opportunities } from '../data/opportunities'
import { mentors, people } from '../data/people'
import { schemes } from '../data/schemes'
import { ventures } from '../data/ventures'
import type { Experience, Opportunity, WorkMode } from '../data/types'
import type { Account, Data } from './types'

export const DEMO_PASSWORD = 'demo1234'

const roleFacts: Record<string, { mode: WorkMode; experience?: Experience; monthly?: number }> = {
  'tapri-frontend-intern': { mode: 'Remote', experience: 'Fresher', monthly: 18000 },
  'haldi-content-gig': { mode: 'Remote', experience: 'Fresher', monthly: 8400 },
  'pinwheel-ops-analyst': { mode: 'On-site', experience: '1-3 years', monthly: 40000 },
  'chalo-kitab-cofounder': { mode: 'On-site' },
  'ganit-ml-intern': { mode: 'Hybrid', experience: 'Fresher', monthly: 25000 },
  'bunkar-brand-designer': { mode: 'Remote', experience: '1-3 years', monthly: 35000 },
  'kheti-field-sales': { mode: 'On-site', experience: 'Fresher', monthly: 26700 },
  'rasta-android-dev': { mode: 'On-site', experience: '1-3 years', monthly: 58000 },
  'nukkad-marketing-intern': { mode: 'Hybrid', experience: 'Fresher', monthly: 12000 },
  'dhaaga-cofounder-ops': { mode: 'On-site', experience: '3+ years' },
}

const moreRoles: Opportunity[] = [
  {
    id: 'ganit-weekend-tutor',
    title: 'Weekend maths tutor (online, Hindi)',
    company: 'Ganit Labs',
    kind: 'Part-time',
    city: 'Bengaluru',
    remote: true,
    mode: 'Remote',
    experience: 'Fresher',
    monthly: 9000,
    pay: '₹450 per hour, about 5 hours a week',
    skills: ['Hindi', 'Teaching', 'Maths'],
    postedDaysAgo: 3,
    closes: '12 Nov',
    about:
      'Ganit Labs builds a maths practice app for Class 6–10 students in government schools. Our model picks the next question based on what a student got wrong.',
    work: [
      'Teach two live doubt-clearing classes every Saturday and Sunday',
      'Explain fractions and algebra in simple Hindi',
      'Tell our content team which questions confuse students most',
    ],
  },
  {
    id: 'sunkiran-solar-apprentice',
    title: 'Solar installation apprentice',
    company: 'SunKiran Energy',
    kind: 'Apprenticeship',
    city: 'Jodhpur',
    remote: false,
    mode: 'On-site',
    experience: 'Fresher',
    monthly: 9000,
    pay: '₹9,000 / month stipend',
    skills: ['Electrical', 'Safety', 'Field work'],
    postedDaysAgo: 2,
    closes: '20 Nov',
    about: 'SunKiran puts rooftop solar on homes and small shops across western Rajasthan. We train every installer ourselves.',
    work: [
      'Learn to install and test rooftop solar panels with a senior installer',
      'Follow site safety rules on every job',
      'Earn a certificate after twelve months of training',
    ],
  },
  {
    id: 'haldi-flutter-contract',
    title: 'Flutter developer, 3-month contract',
    company: 'Haldi Health',
    kind: 'Contract',
    city: 'Kochi',
    remote: true,
    mode: 'Remote',
    experience: '1-3 years',
    monthly: 70000,
    pay: '₹70,000 / month for 3 months',
    skills: ['Flutter', 'Dart', 'Firebase'],
    postedDaysAgo: 5,
    closes: '8 Nov',
    about:
      'Haldi Health runs teleconsults for families in small towns. Patients read our explainers before a call, so they need to be clear and calm.',
    work: [
      'Rebuild the appointment booking flow in Flutter',
      'Make the app work on slow 3G connections',
      'Hand over clean code and notes to our in-house developer',
    ],
  },
]

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

function interviewAt(days: number, hour: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`
}

function minutesAgo(n: number) {
  return new Date(Date.now() - n * 60000).toISOString()
}

const emptyLists = () => ({ saved: [], interested: [], reviewRequests: [] })

type SeedAccount = Omit<Account, 'kinds'>

function personAccount(personId: string, email: string, joined: number): SeedAccount {
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
  const raw: SeedAccount[] = [
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
      verified: true,
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
      verified: true,
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
      verified: true,
      companyAbout:
        'Pinwheel moves textile shipments for 900+ traders in Surat. We are replacing phone calls and paper challans with one tracking system.',
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
      verifyRequested: true,
      profile: { name: 'Rohit Bansal', city: 'Chandigarh', college: 'a D2C apparel brand', roles: ['mentor'], skills: [], goal: '' },
      lists: emptyLists(),
    },
  ]

  const accounts: Account[] = raw.map((a) => ({ ...a, kinds: [a.kind] }))

  return {
    version: 3,
    session: null,
    accounts,
    opportunities: [
      ...opportunities.map((o) => ({
        ...o,
        ...roleFacts[o.id],
        ...(o.company === 'Tapri Pay' ? { ownerId: 'acc-tapri' } : o.company === 'Pinwheel Logistics' ? { ownerId: 'acc-neha' } : {}),
      })),
      ...moreRoles,
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
        mode: 'On-site',
        experience: 'Fresher',
        monthly: 23000,
        status: 'pending',
        ownerId: 'acc-tapri',
      },
    ],
    challenges: challenges.map((c) =>
      c.company === 'Tapri Pay' ? { ...c, ownerId: 'acc-tapri' } : c.company === 'Pinwheel Logistics' ? { ...c, ownerId: 'acc-neha' } : c,
    ),
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
        status: 'Applied',
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
        interview: { when: interviewAt(2, 11), mode: 'Video', where: 'https://meet.google.com/gnt-labs-ml', status: 'Accepted' },
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
    notices: [
      {
        id: 'n-1',
        accountId: 'acc-riya-sharma',
        at: minutesAgo(90),
        text: 'Welcome to HackShift. Finish one challenge this week to get noticed by startups.',
        link: '/challenges',
        read: false,
      },
      {
        id: 'n-2',
        accountId: 'acc-tapri',
        at: minutesAgo(300),
        text: 'Vikram Joshi applied to Frontend intern',
        link: '/panel/applicants',
        read: false,
      },
      {
        id: 'n-3',
        accountId: 'acc-meera',
        at: minutesAgo(200),
        text: 'Aman Verma asked you for a session',
        link: '/panel/sessions',
        read: false,
      },
      {
        id: 'n-4',
        accountId: 'acc-admin',
        at: minutesAgo(35),
        text: 'Rohit Bansal asked to be verified as a mentor',
        link: '/admin/verification',
        read: false,
      },
    ],
    messages: [
      {
        id: 'm-1',
        from: 'acc-admin',
        to: 'acc-riya-sharma',
        text: 'Hi Riya, welcome to HackShift. If you get stuck anywhere, reply here and the team will help.',
        at: minutesAgo(95),
        read: false,
      },
      {
        id: 'm-2',
        from: 'acc-neha',
        to: 'acc-aman-verma',
        text: 'Hi Aman, loved your late routes analysis. Can you do a second round with our ops head this week?',
        at: minutesAgo(1500),
        read: true,
      },
      {
        id: 'm-3',
        from: 'acc-aman-verma',
        to: 'acc-neha',
        text: 'Thank you. Any morning works for me.',
        at: minutesAgo(1380),
        read: false,
      },
    ],
    tasks: [],
    usage: [],
    settings: { reviewPosts: true, millisaDailyLimit: 80 },
  }
}

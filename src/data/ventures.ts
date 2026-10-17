import type { Stage, Venture } from './types'

export const stages: Stage[] = ['Idea', 'Validated', 'MVP', 'Funded']

export const stageHelp: Record<Stage, string> = {
  Idea: 'A problem you understand and a first guess at the answer',
  Validated: 'Real people told you they have this problem, or paid for a fix',
  MVP: 'A working first version that people use',
  Funded: 'Grant, angel or seed money in the bank',
}

export const ventures: Venture[] = [
  {
    id: 'mandi-bhav',
    name: 'Mandi Bhav',
    oneLiner: 'Daily crop prices from nearby mandis, sent on WhatsApp in the farmer’s language',
    founder: 'Pooja Yadav',
    city: 'Indore',
    sector: 'Agritech',
    stage: 'Validated',
    problem:
      'Soybean farmers around Indore sell to the first trader who quotes because checking prices at three mandis means a day of travel.',
    progress: [
      'Spoke to 62 farmers across 4 villages',
      '140 farmers on a test WhatsApp list',
      '31 said they waited a day to sell because of a price message',
    ],
    lookingFor: ['Technical co-founder', 'Mentor in agri supply chains'],
    team: 1,
  },
  {
    id: 'saheli-shifts',
    name: 'Saheli Shifts',
    oneLiner: 'Safe, verified part-time work for women in Tier-2 cities',
    founder: 'Ananya Mishra',
    city: 'Bhopal',
    sector: 'Employment',
    stage: 'MVP',
    problem:
      'Women who want 3–4 hours of work a day near home mostly hear about it through relatives, and many listings are unsafe or fake.',
    progress: [
      'Web app live with 18 verified employers',
      '210 women signed up in 6 weeks',
      '47 shifts completed, all rated',
    ],
    lookingFor: ['Growth marketer', 'Seed funding'],
    team: 3,
  },
  {
    id: 'pathshala-audio',
    name: 'Pathshala Audio',
    oneLiner: 'NCERT lessons as short audio episodes for students without smartphones',
    founder: 'Ritesh Kumar',
    city: 'Patna',
    sector: 'Edtech',
    stage: 'Idea',
    problem:
      'Many students in rural Bihar share one basic phone with the whole family. Video lessons do not reach them, but a phone call does.',
    progress: ['Recorded 10 sample lessons', 'Tested with 2 students in Gaya'],
    lookingFor: ['Co-founder with edtech experience', 'Voice artists'],
    team: 1,
  },
  {
    id: 'thali-track',
    name: 'Thali Track',
    oneLiner: 'Waste tracking for hostel and canteen kitchens',
    founder: 'Karan Gill',
    city: 'Chandigarh',
    sector: 'Sustainability',
    stage: 'Funded',
    problem:
      'Large kitchens throw away up to a fifth of what they cook and have no idea which dishes cause it.',
    progress: [
      'Used in 9 college hostels',
      'Cut food waste by 22% on average',
      'Raised ₹40 lakh from the Startup India Seed Fund via an incubator',
    ],
    lookingFor: ['Full-stack developer', 'Sales lead for corporate canteens'],
    team: 5,
  },
  {
    id: 'kaam-kaaj',
    name: 'KaamKaaj',
    oneLiner: 'Voice-first job app for plumbers, electricians and carpenters',
    founder: 'Imran Shaikh',
    city: 'Nagpur',
    sector: 'Employment',
    stage: 'MVP',
    problem:
      'Skilled tradespeople find work through contractors who take a large cut, and most job apps assume people can type in English.',
    progress: [
      'Android app with Hindi and Marathi voice search',
      '600 workers and 85 households using it',
      'Average job filled in 3 hours',
    ],
    lookingFor: ['Mentor for fundraising', 'Android developer'],
    team: 2,
  },
  {
    id: 'dawa-dost',
    name: 'Dawa Dost',
    oneLiner: 'Medicine reminders for elderly parents, managed by their children in other cities',
    founder: 'Sneha Pillai',
    city: 'Thiruvananthapuram',
    sector: 'Healthtech',
    stage: 'Idea',
    problem:
      'Children who move to metros for work worry about parents missing medicines back home, and calling three times a day is not practical.',
    progress: ['Surveyed 120 working professionals', 'Clickable prototype in Figma'],
    lookingFor: ['Technical co-founder', 'Doctor as advisor'],
    team: 1,
  },
]

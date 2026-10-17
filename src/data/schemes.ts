import type { Scheme } from './types'

export const schemes: Scheme[] = [
  {
    id: 'dpiit',
    name: 'DPIIT Startup Recognition',
    runBy: 'Startup India, Ministry of Commerce',
    amount: 'Free to apply',
    summary:
      'Official recognition as a startup. Most other schemes ask for it first, and it opens up tax benefits, easier compliance and faster patent filing.',
    stages: ['Idea', 'Validated', 'MVP', 'Funded'],
    needs: ['recognition'],
    link: 'https://www.startupindia.gov.in',
  },
  {
    id: 'sisfs',
    name: 'Startup India Seed Fund Scheme',
    runBy: 'DPIIT, through selected incubators',
    amount: 'Up to ₹20 lakh grant, up to ₹50 lakh as debt or convertibles',
    summary:
      'Money for proof of concept, prototype, product trials and market entry. You apply to an incubator listed on the Startup India portal.',
    stages: ['Validated', 'MVP'],
    needs: ['grant', 'incubation'],
    link: 'https://seedfund.startupindia.gov.in',
  },
  {
    id: 'nidhi-prayas',
    name: 'NIDHI-PRAYAS',
    runBy: 'Department of Science and Technology',
    amount: 'Up to ₹10 lakh',
    summary:
      'Support for turning an idea into a working prototype, given through PRAYAS centres at technology business incubators.',
    stages: ['Idea', 'Validated'],
    needs: ['grant', 'incubation'],
    link: 'https://nidhi.dst.gov.in',
  },
  {
    id: 'aim-aic',
    name: 'Atal Incubation Centres',
    runBy: 'Atal Innovation Mission, NITI Aayog',
    amount: 'Space, mentors and network',
    summary:
      'Incubators across India that give early-stage founders workspace, mentoring, lab access and introductions to investors.',
    stages: ['Idea', 'Validated', 'MVP'],
    needs: ['incubation'],
    link: 'https://aim.gov.in',
  },
  {
    id: 'mudra',
    name: 'Pradhan Mantri Mudra Yojana',
    runBy: 'Ministry of Finance, through banks and NBFCs',
    amount: 'Up to ₹20 lakh loan, no collateral',
    summary:
      'Loans for small businesses in four slabs: Shishu, Kishore, Tarun and Tarun Plus. Good for working capital or equipment.',
    stages: ['MVP', 'Funded'],
    needs: ['loan'],
    link: 'https://www.mudra.org.in',
  },
  {
    id: 'standup',
    name: 'Stand-Up India',
    runBy: 'SIDBI, through scheduled commercial banks',
    amount: '₹10 lakh to ₹1 crore loan',
    summary:
      'Bank loans for a new business in manufacturing, services, trading or allied agriculture, for women and SC/ST founders.',
    stages: ['Validated', 'MVP', 'Funded'],
    needs: ['loan'],
    onlyFor: ['women', 'scst'],
    link: 'https://www.standupmitra.in',
  },
  {
    id: 'cgtmse',
    name: 'Credit Guarantee for Micro and Small Enterprises',
    runBy: 'CGTMSE, Ministry of MSME and SIDBI',
    amount: 'Guarantee on loans up to ₹5 crore',
    summary:
      'Lets banks give you a business loan without asking for property as collateral, because the trust guarantees most of it.',
    stages: ['MVP', 'Funded'],
    needs: ['loan'],
    link: 'https://www.cgtmse.in',
  },
  {
    id: 'samridh',
    name: 'MeitY SAMRIDH',
    runBy: 'Ministry of Electronics and IT',
    amount: 'Up to ₹40 lakh, matched by the accelerator',
    summary:
      'Acceleration and investment for software product startups that already have a product and early customers.',
    stages: ['MVP', 'Funded'],
    needs: ['grant', 'incubation'],
    link: 'https://msh.meity.gov.in',
  },
]

# HackShift

**Connecting talent, ideas and opportunities across India.**

Built for Hack Shift, the national-level hackathon at IIIT Delhi, under the theme *Entrepreneurship and Employment*.

Live site: https://theinnovators098.github.io/hackshift/

## The problem

A student in Indore, a founder in Patna and a startup in Surat are all looking for each other, but they use different apps and none of those apps show what a person can actually do. Resumes look the same, good ideas stay in notebooks, and most opportunities stay inside a few big cities.

## What HackShift does

HackShift puts job seekers, founders, startups, mentors and recruiters on one platform, and connects them through work people have actually done.

| Feature | What it does |
| --- | --- |
| Shift Challenges | Startups post small paid tasks. People submit their work, and accepted work becomes a badge recruiters can search. |
| Opportunities | Internships, jobs, gigs and co-founder roles with pay on every listing. Filter by city, remote and skill match. |
| Ventures | Ideas move through four stages: Idea, Validated, MVP, Funded. Founders find co-founders and ask for mentor reviews. |
| Mentors | Book a free 30 minute session with someone who has built, hired or raised before, in your language. |
| Find talent | Recruiters search people by verified work, city and availability, and keep a shortlist. |
| Government schemes | Answer three questions to see which schemes fit you, such as Startup India Seed Fund, MUDRA and Stand-Up India. |
| Dashboard | Changes with your role: matched roles, challenge status, ventures, sessions and a progress checklist. |

## Built for Bharat

- Cities outside the metros come first: Indore, Jaipur, Kochi, Bhubaneswar, Nashik and more.
- Pay is shown in rupees on every listing.
- Mentors list the languages they speak.
- Real government schemes with links to official websites.

## Tech stack

- React 18, TypeScript and Vite
- React Router
- CSS Modules with a small set of design tokens
- Lucide icons
- Anek Latin by Ek Type, an Indian type foundry
- Data is stored in the browser with localStorage, so the demo works without a backend
- Deployed to GitHub Pages with GitHub Actions

## Run it locally

```bash
git clone https://github.com/theinnovators098/hackshift.git
cd hackshift
npm install
npm run dev
```

Open http://localhost:5173/hackshift/

To build for production:

```bash
npm run build
npm run preview
```

## Demo flow

1. Create a profile and pick "Looking for work" and "Building an idea".
2. Open a challenge, submit a link and mark it accepted to see the badge on your profile.
3. Apply to an opportunity linked to that challenge.
4. Post an idea in Ventures and ask for a mentor review.
5. Book a mentor session and check it on your dashboard.
6. Use the schemes finder to see which schemes fit your stage.

To start over, open your profile and choose "Clear my data".

## Project structure

```
src/
  components/   header, footer, layout, Shift Board
  data/         mock opportunities, challenges, ventures, mentors and schemes
  lib/          skill matching helpers
  pages/        one file per screen, each with its own CSS module
  store/        app state saved to localStorage
  styles/       design tokens and shared styles
```

## Team

| Name | Focus |
| --- | --- |
| Abhishek | Team lead, design system, landing page, dashboard, deployment |
| Mridul | Opportunities, talent search, applications |
| Aadya | Ventures, co-founder matching, schemes finder |
| Muskan | Onboarding, mentors and booking, challenges, profile |

## What is next

- Accounts and a real database
- Hindi and regional language support across the interface
- Startups posting their own challenges from a dashboard
- Notifications on WhatsApp for new matches

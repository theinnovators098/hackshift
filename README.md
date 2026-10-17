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

## Panels for every role

Sign in at `/login`. Each account type gets its own panel at `/panel`, and the super admin works from `/admin`.

| Panel | Who | What they manage |
| --- | --- | --- |
| Job seeker | Students, job seekers and founders | Applications and their status, challenge submissions and feedback, mentor sessions, saved roles, their ventures, account |
| Startup | Companies hiring on HackShift | Post and edit roles and challenges, move applicants through Shortlisted, Interview and Hired, accept challenge work with feedback, company profile |
| Mentor | Mentors | Accept or decline session requests, mark sessions done with a note, set weekly times, edit the mentor profile |
| Recruiter | Hiring teams | A pipeline from Shortlisted to Hired with notes and interview times, filled from Find talent |
| Super admin | The HackShift team | Every account (suspend, delete, view as the user), the review queue for new posts and mentors, all content, government schemes, the activity log and platform settings |

Changes flow between panels. When a startup moves an applicant to Interview, the applicant sees it in their panel. When a mentor accepts a session, the person who booked it sees it confirmed.

### Demo accounts

The sign-in page has one-click demo accounts. They all use the password `demo1234`.

| Account | Email |
| --- | --- |
| Job seeker | riya@hackshift.in |
| Startup (Tapri Pay) | karan@tapripay.in |
| Mentor | meera@hackshift.in |
| Recruiter (Pinwheel Logistics) | neha@pinwheel.in |
| Super admin | admin@hackshift.in |

All accounts and data are saved in the browser, so this is a demo, not real security. The super admin can reset everything to the demo data from Settings.

## Millisa, the HackShift assistant

Millisa is built into the pages people already use. It replies in English or Hindi.

| Where | What Millisa does |
| --- | --- |
| Every page | **Ask Millisa** chat. It knows every role, challenge, mentor, venture and scheme on HackShift and links straight to them. |
| Opportunity page | **Check my fit** gives an honest verdict, what you have, what is missing and one thing to do first. |
| Apply form | **Draft with Millisa** writes a short application note from your profile, without inventing experience. |
| Practice interview | Five questions written for the role. Millisa scores each answer and shows a stronger version. |
| Post your idea | **Check with Millisa** reviews the idea, the stage, the questions people will ask and three cheap ways to test it. |
| Challenge page | **Pre-review my work** checks your link and note against the brief before you submit. |

Answers to the checks are saved in the browser, so if the internet drops during a demo, Millisa shows the answer it gave earlier for the same question and says so.

### Connecting Millisa

Millisa needs an access key. The key is never stored in this repository.

- **On the live site:** the first time someone uses Millisa it asks for the key and saves it in that browser only. Use "Disconnect Millisa" on the profile page to remove it.
- **When running locally:** create a file called `.env.local` in the project folder with this line, and Millisa connects on its own in `npm run dev`:

```
VITE_MILLISA_KEY=your-key-here
```

`.env.local` is ignored by git, so it is never committed.

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
- Anek Latin and Anek Devanagari by Ek Type, an Indian type foundry
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

1. Sign in as Riya, the job seeker, from the sign-in page.
2. Open the Tapri Pay challenge and submit a link. Sign in as Karan from Tapri Pay and accept it to give Riya a badge.
3. Apply to an opportunity linked to that challenge.
4. Post an idea in Ventures and ask for a mentor review.
5. Book a mentor session and check it on your dashboard.
6. Use the schemes finder to see which schemes fit your stage.
7. Open a role, press "Check my fit", then "Practice the interview" and answer one question in Hindi.
8. Ask Millisa in Hindi: "मेरे आइडिया के लिए कौन सी सरकारी योजना सही है?"

To start over, sign in as the super admin and choose "Reset to demo data" in Settings.

## Project structure

```
src/
  components/   header, footer, layout, Shift Board
  data/         mock opportunities, challenges, ventures, mentors and schemes
  lib/          skill matching, the Millisa client and its prompts
  millisa/      Millisa chat panel, key dialog and the feature panels
  pages/        one file per screen, each with its own CSS module
  panel/        the job seeker, startup, mentor, recruiter and super admin panels
  store/        accounts and data saved to localStorage, and the demo seed
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
- Hindi and regional languages across the whole interface, not only in Millisa
- A small server for Millisa so visitors do not need a key
- Startups posting their own challenges from a dashboard
- Notifications on WhatsApp for new matches

# HackShift 2026 IIIT Delhi.

**Connecting talent, ideas and opportunities across India.**

Built for Hack Shift, the national-level hackathon at IIIT Delhi, under the theme *Entrepreneurship and Employment*.

Live site: https://theinnovators098.github.io/hackshift/

# The problem
A student in Indore is looking for work, a founder in Patna needs a co-founder, and a startup in Surat is searching for skilled talent.but they use different apps and none of those apps show what a person can actually do. Resumes look the same, good ideas stay in notebooks, and most opportunities stay inside a few big cities.

## What HackShift does it

HackShift puts job seekers, founders, startups, mentors and recruiters on one platform, and connects them through work people have actually done.

| Feature | What it does |
| --- | --- |
| Shift Challenges | Startups post small paid tasks. People submit their work, and accepted work becomes a badge recruiters can search. |
| Opportunities | Internships, jobs, part-time, apprenticeships, contracts, gigs and co-founder roles with pay on every listing. Filter by city, work mode, experience, pay and skill match. Save a search to get an alert when a new role matches. |
| Ventures | Ideas move through four stages: Idea, Validated, MVP, Funded. Founders find co-founders and ask for mentor reviews. |
| Mentors | Book a free 30 minute session with someone who has built, hired or raised before, in your language. |
| Find talent | Recruiters search people by verified work, city and availability, and keep a shortlist. |
| Government schemes | Answer three questions to see which schemes fit you, such as Startup India Seed Fund, MUDRA and Stand-Up India. |
| Dashboard | Changes with your role. Matched roles explain why they match. |
| Messages and notifications | Direct messages between any two accounts, and a bell for every update that matters to you. |
| Search | Press Ctrl K anywhere to search roles, challenges, mentors, ideas and schemes. |
| Events | A banner across the top of the homepage slides through featured hackathons, demo days, workshops and hiring drives. People register in one click and the event joins their calendar. The super admin picks what appears in the banner. |
| Trust | Verified badges for companies and mentors, reports on any post or account, and a review queue before new posts go live. |

## Panels for every role

Sign in at `/login`. Each account type gets its own panel at `/panel`, and the super admin works from `/admin`.

| Panel | Who | What they manage |
| --- | --- | --- |
| Job seeker | Students, job seekers and founders | Full profile with a completion score, resume upload that Millisa reads, a printable resume, applications with interview invites, challenge feedback, mentor sessions with action items and ratings, a career plan, saved roles and searches, calendar, and a founder workspace |
| Founder workspace | Anyone building an idea | Idea workspace, Millisa business plan, MVP plan and pitch deck outline, budget and runway, open positions with explained co-founder matches, milestones, mentor feedback and a launch readiness score |
| Startup | Companies hiring on HackShift | Roles and challenges, applicants from Applied to Hired with a reason on rejection, interview invites, private notes, interview feedback, challenge reviews, role performance and a company profile |
| Mentor | Mentors | Accept with a meeting link, suggest another time, finish sessions with notes and action items, venture reviews, weekly times, ratings and a mentor profile |
| Recruiter | Hiring teams | Everything a startup has for hiring, plus a sourcing pipeline from Shortlisted to Hired filled from Find talent |
| Super admin | The HackShift team | Accounts (suspend, delete, view as), verification, review queue, reports, content, schemes, analytics, Millisa usage and limits, activity log and settings |

One account can hold more than one role, for example a student who also runs a startup, and switch between panels.

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
| Profile | Reads a PDF resume and fills in the profile after you confirm. Writes the About paragraph. |
| Resume check | Upload a resume as a PDF or a photo, at `/resume-check` or in the job seeker panel. Millisa shows what it read, then suggests roles on HackShift with what you have and what is missing, lines to rewrite, skills to learn, a challenge and mentors. One click adds the details to your profile, or starts a new profile from them. |
| Career plan | Compares your profile with the role you want and lays out a week-by-week plan with challenges and mentors from HackShift. |
| Founder workspace | Drafts a business plan, an MVP plan and a pitch deck outline from the idea. |
| Hiring | Writes a role from rough notes, explains how an applicant fits, suggests interview questions, drafts messages and summarises the pipeline. It explains and never decides or rejects. |
| Mentor sessions | Prepares a session agenda and turns rough notes into action items. |

### Millisa does tasks, with approval

In the chat, Millisa can search HackShift, check your own activity and save roles. It can also prepare an application, a session request, a message, a new role or moving an applicant forward. Nothing is sent until you press Approve, and every task is listed under Millisa tasks in your panel.

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

1. Sign in as Riya, the job seeker. On Profile and resume, upload a PDF resume and let Millisa fill the profile.
2. Ask Millisa: "Find me a remote React internship and apply to the best one." Approve the application under its reply.
3. Sign in as Karan from Tapri Pay. Open Applicants, press "Explain fit", then schedule an interview.
4. Sign back in as Riya. Accept the interview time and see it on the Calendar.
5. Post an idea in Ventures, open the founder workspace and make the business plan and the pitch deck.
6. Sign in as Meera, the mentor. Accept a session with a meeting link, then finish one with notes and action items.
7. Sign in as the super admin. Approve the new posts in the review queue, and look at Reports, Analytics and Millisa.
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
| Abhishek | Team lead, design system, landing pages, dashboard, deployment |
| Mridul | Opportunities, talent search, applications |
| Aadya | Ventures, co-founder matching, schemes finder |
| Muskan | Onboarding, mentors and booking, challenges, profile |

## What is next

- Real accounts, a database and server-side permissions.
- A small server for Millisa so visitors do not need a key.
- College and institution portal for placement officers
- Investor portal for startup discovery and founder introductions
- Hindi and regional languages across the whole interface, not only in Millisa
- Notifications on WhatsApp and email

## Requirements

### Tech Stack

- Frontend with React
- Backend with Next.js
- Supabase auth
- PostgreSQL (on Supabase)
- Vercel deployment

### Functional Requirements

#### Auth

- [x] Users log in to the system
- [x] 2 roles: framer and admin
- [x] Framers can create submissions
- [x] Framer can view only their submissions
- [x] Admin can view all submissions

#### Framer Dashboard

##### Safety form

- [x] Select job site
- [x] Select date
- [x] Safety checklist: PPE worn (hard hat, vest, boots, eye protection), fall protection in place, ladders/scaffolding inspected, tools and cords in good condition, hazards identified
- [x] Free text field
- [x] Upload images (one or more)
- [x] Validations for each with clear messages

#### Admin dashboard

- [x] Lists submissions (worker, site, date and status)
- [x] Filter submissions (by site, worker, date range)
- [x] Detailed submission view for each submission (pictures, form data)
- [x] A summary section (e.g., submissions per site, who has not submitted today - including a few charts)

### Non functional requirements

- Mobile friendly
- Uses RAS branding (logo, colors, etc - generally adheres to style guidelines implied by their website)
- Code quality
- Understanding of code
-

### Deliverables

- [x] Entity relationship diagram (ERD)
- [x] Public or private github repo
- [x] Provided credentials for at least 1 framer
- [x] Provided credentials for at least 1 admin
- [x] README with: setup instructions, tech stack, and assumptions

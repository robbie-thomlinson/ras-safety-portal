## Requirements

### Tech Stack

- Frontend with React
- Backend with Next.js
- Supabase auth
- PostgreSQL (on Supabase)
- Vercel deployment

### Functional Requirements

#### Auth

- [ ] Users log in to the system
- [ ] 2 roles: farmer and admin
- [ ] Farmers can create submissions
- [ ] Farmer can view only their submissions
- [ ] Admin can view all submissions

#### Farmer Dashboard

##### Safety form
- [ ] Select job site
- [ ] Select date
- [ ] Safety checklist: PPE word (hard hat, vest, boots, eye protection), fall protection in place, ladders/scaffolding inspected, tools and cords in good condition, hazards identified
- [ ] Free text field
- [ ] Upload images (one or more)
- [ ] Validations for each with clear messages

#### Admin dashboard
- [ ] Lists submissions (worker, site, date and status)
- [ ] Filter submissions (by site, worker, date range)
- [ ] Detailed submission view for each submission (pictures, form data)
- [ ] A summary section (e.g., submissions per site, who has not submitted today - including a few charts)

### Non functional requirements

- Mobile friendly 
- Uses RAS branding (logo, colors, etc - generally adheres to style guidelines implied by their website)
- Code quality
- Understanding of code
- 

### Deliverables

- [ ] Entity relationship diagram (ERD)
- [ ] Public or private github repo
- [ ] Provided credentials for at least 1 farmer
- [ ] Provided credentials for at least 1 admin
- [ ] README with: setup instructions, tech stack, and assumptions

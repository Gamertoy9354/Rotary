# Rotary Club of Bardoli — Community Platform

Full-stack club & community platform: React (Vite) + Supabase (Postgres, Auth, Storage, RLS).

## Features

- **Auth & roles** — email/password and Google sign-in. Emails on the club roster automatically
  get their role (`admin` = president, `officer` = officers & Board of Directors, `member`);
  everyone else joins as a community `visitor`.
- **Membership requests** — signed-in visitors apply from their dashboard; the president,
  officers and BOD review and approve as **Member** or **Board of Director** in-platform.
- **Group joining** — groups are `open` (members join directly) or `approval` (request goes to
  the group lead / BOD / president, who approve on the group page). Officers & BOD create groups
  and choose the policy.
- **Role dashboards** — profile management (photo, bio) for everyone; groups/projects + project
  creation for members; help-request inbox, donation ledger and group creation for officers.
- **Projects** — public catalog with status filters, detail pages, lead group, team roster;
  members join/leave teams with one click.
- **Community** — committees/groups with members and leads, full people directory, public profiles
  showing each person's groups, projects and posts.
- **Feed / threads** — posts with up to 4 images, likes, comments, share links, group/project tags;
  authors and officers can delete.
- **Request help** — public form (no sign-in) that lands in the officers' dashboard with status tracking.
- **Donations** — public pledge form; treasurer marks pledges received in the dashboard.
  No money moves online — payment completes offline with the club.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
```

`.env` holds `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (publishable key — safe for browsers;
all authorization is enforced by Row Level Security in Postgres).

## Supabase (project: Rotary / vlftingelwwxiixtfiwn)

- Tables: `profiles`, `club_roster`, `groups`, `group_members`, `projects`, `project_members`,
  `posts`, `post_likes`, `post_comments`, `help_requests`, `donations` — all with RLS.
- Helper functions live in the `private` schema (not exposed over the API).
- Storage: public `media` bucket (5 MB limit, images only); users upload to their own folder.
- Signup trigger `private.handle_new_user` creates the profile and matches `club_roster` by email.

### Google OAuth setup (one-time)

The "Continue with Google" button needs the Google provider enabled:

1. **Google Cloud Console** (console.cloud.google.com) → APIs & Services → Credentials →
   Create Credentials → **OAuth client ID** → type **Web application**.
   - Authorized JavaScript origins: `http://localhost:5173`, `http://localhost:4173`,
     and your production URL.
   - Authorized redirect URI: `https://vlftingelwwxiixtfiwn.supabase.co/auth/v1/callback`
   - (First time: configure the OAuth consent screen — External, app name
     "Rotary Club of Bardoli", your support email.)
2. **Supabase Dashboard** → Authentication → Sign In / Up → **Google** → enable, paste the
   Client ID and Client Secret from step 1.
3. **Supabase Dashboard** → Authentication → **URL Configuration** → set Site URL to your
   production URL and add `http://localhost:5173/**` and `http://localhost:4173/**` to
   Additional Redirect URLs.

Google accounts whose email matches the club roster get their member/officer role automatically,
and the profile picks up their Google name and photo.

### Admin notes

- **Email confirmation is ON** (Supabase default). For quick testing, turn it off in
  Dashboard → Authentication → Sign In / Up → Email. For production, configure a custom SMTP
  provider (built-in email is limited to a couple of messages per hour).
- To onboard a new member, add their row to `club_roster` (email, name, role, title, member since)
  — their account picks up the role when they register. For existing accounts, officers can also
  update the profile role directly.
- Officer/admin accounts see help-request contact details — treat them as confidential.

## Deploy

Any static host works (Netlify, Vercel, Cloudflare Pages):
build command `npm run build`, output `dist/`, and add the two `VITE_*` env vars.
Configure SPA fallback (all routes → `index.html`).

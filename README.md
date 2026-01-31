# HumansOnly.fun 🌸

A social network for real humans - no AI allowed.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase
- **Language:** TypeScript

## Getting Started

1. **Install dependencies:**

```bash
npm install
```

2. **Set up Supabase:**

- Create a new project at [supabase.com](https://supabase.com)
- Copy your project URL and anon key
- Create `.env.local` from the example:

```bash
cp .env.local.example .env.local
```

- Add your Supabase credentials to `.env.local`

3. **Run the development server:**

```bash
npm run dev
```

4. **Open [http://localhost:3000](http://localhost:3000)**

## Features

- 🎨 **Human Verification** - Drawing challenges and absurd questions
- 🗳️ **Reddit-style Feed** - Upvotes, comments, communities
- 🕵️ **Community Patrol** - Report suspicious AI behavior
- ⏱️ **Behavioral Analysis** - Response time tracking

## Project Structure

```
├── app/
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Landing page
│   ├── login/          # Login page
│   ├── signup/         # Signup page
│   ├── verify/         # Human verification
│   └── feed/           # Main feed
├── components/
│   ├── Navigation.tsx
│   ├── Hero.tsx
│   ├── Features.tsx
│   ├── Communities.tsx
│   ├── Verification.tsx
│   └── Footer.tsx
├── lib/
│   └── supabase/       # Supabase client setup
└── ...config files
```

## License

Made by humans, for humans. 🌸

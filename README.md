# TrackerGoal

TrackerGoal is a focused productivity suite designed around your goals. It helps you measure intention instead of just work by allowing you to track your time, visualize your progress, and build streaks for recurring habits. It also features an integrated AI assistant powered by Gemini to help you manage your goals and tasks conversationally.

## Features

- **Goals that mean something:** Capture what matters with categories, priorities, target hours, and deadlines.
- **One-tap timers:** Start a focused session in a single click. Pause, resume, or log time manually.
- **Streaks & habits:** Turn recurring goals into daily wins with streak tracking that keeps you honest.
- **Insightful analytics:** See exactly where your hours go — by goal, by category, by day, or by week.
- **Progress at a glance:** Track target hours vs. logged time with clean, motivating progress bars.
- **AI Chat Assistant:** Converse with an AI to create goals, tasks, plans, list your active goals, or control timers directly from the chat interface.

## Tech Stack

This project is a modern full-stack web application built with:

### Frontend
- **Framework:** React + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/)
- **Routing:** React Router v6
- **Data Fetching:** TanStack React Query
- **Authentication:** Clerk
- **Charts:** Recharts
- **Animations:** Framer Motion

### Backend & Database
- **Server:** Node.js / Express
- **Database:** Supabase
- **AI Integration:** Google Gemini API (`@google/genai`)

## Getting Started

### Prerequisites
- Node.js & npm (or bun)
- Clerk account for authentication credentials
- Supabase account for database credentials
- Google Gemini API key

### Installation

1. **Clone the repository:**
   ```sh
   git clone <YOUR_GIT_URL>
   cd TrackerGoal
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add the necessary environment variables:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the development servers:**
   You will need to start both the Vite frontend server and the Express backend server:
   
   Start the frontend (Vite):
   ```sh
   npm run dev
   ```
   
   Start the backend (Express + Gemini integration):
   ```sh
   npm run dev:server
   ```

## Editing the Code

### Use your preferred IDE

You can clone this repo and push changes. The only requirement is having Node.js & npm installed.

```sh
# Start the development server with auto-reloading and an instant preview.
npm run dev
```

## AI Chat Capabilities

The built-in chat server located in `server/chat.ts` connects to Google Gemini 2.5 Pro and features tool-calling. It maps conversational requests to your database so you can manage the application naturally:
- **createGoal**: Tell the AI to create a new goal.
- **createTask**: Break a goal down into actionable tasks.
- **createPlan**: Let the AI automatically draft a plan of tasks.
- **listGoals**: Query the state of your active goals.
- **controlTimer**: Start or stop your pomodoro/timers.



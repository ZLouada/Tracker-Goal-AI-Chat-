import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/react";
import {
  Target,
  Timer,
  BarChart3,
  Flame,
  CalendarCheck,
  Layers,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const features = [
  { icon: Target, title: "Goals that mean something", desc: "Capture what matters with categories, priorities, target hours and deadlines." },
  { icon: Timer, title: "One-tap timers", desc: "Start a focused session in a single click. Pause, resume, or log time manually." },
  { icon: Flame, title: "Streaks & habits", desc: "Turn recurring goals into daily wins with streak tracking that keeps you honest." },
  { icon: BarChart3, title: "Insightful analytics", desc: "See exactly where your hours go — by goal, by category, by day or week." },
  { icon: CalendarCheck, title: "Progress at a glance", desc: "Track target hours vs. logged time with clean, motivating progress bars." },
  { icon: Layers, title: "Built for depth", desc: "Notes per session, history per goal — review your work as easily as you do it." },
];

const stats = [
  { value: "1-tap", label: "Start tracking" },
  { value: "100%", label: "Your data, yours" },
  { value: "0$", label: "To get going" },
];

import { ThemeToggle } from "@/components/ThemeToggle";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#why" className="hover:text-foreground">Why TrackerGoal</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Show when="signed-out">
              <SignInButton mode="redirect" forceRedirectUrl="/dashboard">
                <Button variant="ghost" size="sm">Sign in</Button>
              </SignInButton>
              <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
                <Button size="sm">Get started</Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Button asChild size="sm" variant="ghost">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <UserButton afterSignOutUrl="/" />
            </Show>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            A time tracker built around your goals
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            Time you spend
            <br />
            <span className="text-primary">becomes progress.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            TrackerGoal turns scattered hours into measurable progress on the goals you actually care about. Set a goal, hit start, watch yourself level up.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Show when="signed-out">
              <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
                <Button size="lg" className="text-base">
                  Start tracking free <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Button asChild size="lg" className="text-base">
                <Link to="/dashboard">
                  Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </Show>
            <Button asChild variant="outline" size="lg" className="text-base">
              <a href="#features">See features</a>
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-display text-3xl md:text-4xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <p className="text-sm font-medium text-primary mb-3">Features</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Everything to track, nothing to distract.
            </h2>
            <p className="text-muted-foreground text-lg">
              A focused productivity suite — goals, timers, streaks and analytics — without the bloat.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 border-t border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-primary mb-3">How it works</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Three steps. That's it.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: "01", t: "Set a goal", d: "Name it, color it, give it a target — 50 hours of guitar, 30 sessions of running, whatever drives you." },
              { n: "02", t: "Hit start", d: "When you sit down to work on it, tap the timer. We'll record every second precisely." },
              { n: "03", t: "Watch progress", d: "Streaks build. Charts fill. Your goal moves closer with every focused block." },
            ].map((s) => (
              <div key={s.n}>
                <div className="font-display text-5xl font-bold text-primary/30 mb-3">{s.n}</div>
                <h3 className="font-display text-xl font-semibold mb-2">{s.t}</h3>
                <p className="text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="py-24 border-t border-border">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-medium text-primary mb-3">Why TrackerGoal</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Most trackers measure work. We measure intention.
            </h2>
            <p className="text-muted-foreground text-lg mb-6">
              Time is the only resource you can't restock. TrackerGoal makes sure the hours you invest line up with the life you're trying to build.
            </p>
            <Show when="signed-out">
              <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
                <Button size="lg">Start your first goal</Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Button asChild size="lg">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            </Show>
          </div>
          <ul className="space-y-4">
            {[
              "Unlimited goals & time entries",
              "Daily streaks for recurring habits",
              "Categorize and prioritize",
              "Analytics with breakdown by goal & day",
              "Dark mode, fast UI, zero noise",
              "Your data is private and yours",
            ].map((b) => (
              <li key={b} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-5">
            Your next hour is going somewhere.
            <br />
            <span className="text-primary">Make it count.</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Free to start. Takes a minute to set up your first goal.
          </p>
          <Show when="signed-out">
            <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
              <Button size="lg" className="text-base">
                Open TrackerGoal <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Button asChild size="lg" className="text-base">
              <Link to="/dashboard">
                Open TrackerGoal <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </Show>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Logo size="sm" />
          <p>&copy; {new Date().getFullYear()} TrackerGoal. Time well measured.</p>
        </div>
      </footer>
    </div>
  );
}

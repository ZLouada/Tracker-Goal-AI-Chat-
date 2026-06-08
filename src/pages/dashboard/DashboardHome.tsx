import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useActiveTimer, useStopTimer, useCancelTimer, useGoals, useTimeEntries } from "@/hooks/useGoals";
import { formatClock, formatDuration, todayISO } from "@/lib/time";
import { Pause, X, Target, Flame, Clock, Plus, ArrowRight } from "lucide-react";

function LiveTimer({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  return <span className="font-display tabular-nums">{formatClock(elapsed)}</span>;
}

export default function DashboardHome() {
  const { data: timer } = useActiveTimer();
  const stop = useStopTimer();
  const cancel = useCancelTimer();
  const { data: goals } = useGoals();
  const { data: entries } = useTimeEntries();

  const activeGoal = goals?.find((g) => g.id === timer?.goal_id);

  const today = todayISO();
  const todayEntries = entries?.filter((e) => e.started_at >= today) ?? [];
  const todaySeconds = todayEntries.reduce((s, e) => s + e.duration_seconds, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const weekEntries = entries?.filter((e) => new Date(e.started_at) >= weekStart) ?? [];
  const weekSeconds = weekEntries.reduce((s, e) => s + e.duration_seconds, 0);

  const activeGoals = goals?.filter((g) => g.status === "active") ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Your time, today.</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/goals"><Plus className="w-4 h-4 mr-2" /> New goal</Link>
        </Button>
      </div>

      {/* Active timer */}
      {timer && activeGoal ? (
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: activeGoal.color ?? "#6366f1" }}>
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Tracking now</p>
                <p className="font-display text-xl font-semibold">{activeGoal.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-3xl md:text-4xl font-bold tabular-nums">
                <LiveTimer startedAt={timer.started_at} />
              </div>
              <Button onClick={() => stop.mutate(timer)} disabled={stop.isPending}>
                <Pause className="w-4 h-4 mr-2" /> Stop & save
              </Button>
              <Button variant="ghost" size="icon" onClick={() => cancel.mutate()} title="Discard">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 border-dashed">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold">No timer running</p>
              <p className="text-sm text-muted-foreground">Pick a goal and start tracking time.</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/dashboard/goals">Choose a goal <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard icon={Clock} label="Today" value={formatDuration(todaySeconds)} sub={`${todayEntries.length} session${todayEntries.length === 1 ? "" : "s"}`} />
        <StatCard icon={Flame} label="Last 7 days" value={formatDuration(weekSeconds)} sub={`${weekEntries.length} sessions`} />
        <StatCard icon={Target} label="Active goals" value={String(activeGoals.length)} sub={`${goals?.length ?? 0} total`} />
      </div>

      {/* Goals list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">Your goals</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/goals">View all <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </div>
        {activeGoals.length === 0 ? (
          <Card className="p-10 text-center">
            <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">No goals yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create your first goal to start tracking.</p>
            <Button asChild><Link to="/dashboard/goals">Create a goal</Link></Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGoals.slice(0, 6).map((g) => {
              const goalSecs = entries?.filter((e) => e.goal_id === g.id).reduce((s, e) => s + e.duration_seconds, 0) ?? 0;
              const target = (g.target_minutes ?? 0) * 60;
              const pct = target > 0 ? Math.min(100, (goalSecs / target) * 100) : 0;
              return (
                <Link key={g.id} to={`/dashboard/goals/${g.id}`}>
                  <Card className="p-5 hover:shadow-md transition-all hover:-translate-y-0.5 h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-8 h-8 rounded-lg shrink-0" style={{ backgroundColor: g.color ?? "#6366f1" }} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{g.title}</p>
                        {g.category && <p className="text-xs text-muted-foreground truncate">{g.category}</p>}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {formatDuration(goalSecs)}
                      {target > 0 && <> &middot; {Math.round(pct)}% of target</>}
                    </div>
                    {target > 0 && (
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="font-display text-3xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </Card>
  );
}

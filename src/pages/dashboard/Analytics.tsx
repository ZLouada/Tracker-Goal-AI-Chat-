import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useGoals, useTimeEntries } from "@/hooks/useGoals";
import { formatDuration } from "@/lib/time";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Target, Clock, Flame } from "lucide-react";

export default function Analytics() {
  const { data: goals } = useGoals();
  const { data: entries } = useTimeEntries(undefined, 1000);

  const data = useMemo(() => {
    if (!goals || !entries) return null;

    const totalSecs = entries.reduce((s, e) => s + e.duration_seconds, 0);

    // last 14 days
    const days: { label: string; key: string; seconds: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({
        label: d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" }),
        key: d.toISOString().slice(0, 10),
        seconds: 0,
      });
    }
    entries.forEach((e) => {
      const k = new Date(e.started_at).toISOString().slice(0, 10);
      const d = days.find((x) => x.key === k);
      if (d) d.seconds += e.duration_seconds;
    });
    const dailyChart = days.map((d) => ({ name: d.label, minutes: Math.round(d.seconds / 60) }));

    // by goal
    const byGoal = goals.map((g) => {
      const secs = entries.filter((e) => e.goal_id === g.id).reduce((s, e) => s + e.duration_seconds, 0);
      return { name: g.title, value: secs, color: g.color ?? "#6366f1" };
    }).filter((g) => g.value > 0).sort((a, b) => b.value - a.value);

    // by category
    const catMap = new Map<string, number>();
    entries.forEach((e) => {
      const g = goals.find((x) => x.id === e.goal_id);
      const cat = g?.category ?? "Uncategorized";
      catMap.set(cat, (catMap.get(cat) ?? 0) + e.duration_seconds);
    });
    const byCategory = Array.from(catMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return { totalSecs, dailyChart, byGoal, byCategory };
  }, [goals, entries]);

  if (!data) return null;

  const COLORS = ["#6366f1", "#ec4899", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#8b5cf6", "#ef4444"];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Where your time is actually going.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Stat icon={Clock} label="Total tracked" value={formatDuration(data.totalSecs)} />
        <Stat icon={Target} label="Goals with time" value={String(data.byGoal.length)} />
        <Stat icon={Flame} label="Sessions" value={String(entries?.length ?? 0)} />
      </div>

      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold mb-4">Last 14 days (minutes)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.dailyChart}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold mb-4">By goal</h2>
          {data.byGoal.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No time logged yet.</p>
          ) : (
            <div className="space-y-3">
              {data.byGoal.slice(0, 8).map((g) => {
                const pct = data.totalSecs > 0 ? (g.value / data.totalSecs) * 100 : 0;
                return (
                  <div key={g.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate">{g.name}</span>
                      <span className="text-muted-foreground shrink-0 ml-2">{formatDuration(g.value)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: g.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold mb-4">By category</h2>
          {data.byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No time logged yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {data.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => formatDuration(v)}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="font-display text-3xl font-bold">{value}</p>
    </Card>
  );
}

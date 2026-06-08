import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useGoals, useCreateGoal, useTimeEntries, useStartTimer, useActiveTimer } from "@/hooks/useGoals";
import { formatDuration } from "@/lib/time";
import { Plus, Target, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#6366f1", "#ec4899", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#8b5cf6", "#ef4444"];

export default function Goals() {
  const [tab, setTab] = useState<"active" | "completed" | "archived">("active");
  const statusMap = { active: "active" as const, completed: "completed" as const, archived: "archived" as const };
  const { data: goals, isLoading } = useGoals(statusMap[tab]);
  const { data: entries } = useTimeEntries();
  const { data: timer } = useActiveTimer();
  const startTimer = useStartTimer();
  const create = useCreateGoal();
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [targetHours, setTargetHours] = useState<string>("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  const handleCreate = async () => {
    if (!title.trim()) return toast.error("Title is required");
    try {
      await create.mutateAsync({
        title: title.trim(),
        description: desc.trim() || null,
        category: category.trim() || null,
        color,
        priority,
        target_minutes: targetHours ? Math.round(parseFloat(targetHours) * 60) : null,
      });
      setTitle(""); setDesc(""); setCategory(""); setColor(COLORS[0]); setTargetHours(""); setPriority("medium");
      setOpen(false);
      toast.success("Goal created");
    } catch {
      // Error toast is handled by the mutation's onError callback
    }
  };

  const handleStart = async (goalId: string) => {
    try {
      await startTimer.mutateAsync({ goal_id: goalId });
      toast.success("Timer started");
    } catch {
      // Error toast is handled by the mutation's onError callback
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground mt-1">Everything you're working toward.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New goal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create a goal</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Learn Spanish" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What does success look like?" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Learning" />
                </div>
                <div>
                  <Label>Target (hours)</Label>
                  <Input type="number" min={0} step={0.5} value={targetHours} onChange={(e) => setTargetHours(e.target.value)} placeholder="50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-foreground" : ""}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={create.isPending}>
                {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create goal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-6">
          {isLoading ? (
            <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : goals?.length === 0 ? (
            <Card className="p-10 text-center">
              <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold mb-1">No {tab} goals</p>
              <p className="text-sm text-muted-foreground">{tab === "active" ? "Click 'New goal' to get started." : "Nothing here yet."}</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals!.map((g) => {
                const goalSecs = entries?.filter((e) => e.goal_id === g.id).reduce((s, e) => s + e.duration_seconds, 0) ?? 0;
                const target = (g.target_minutes ?? 0) * 60;
                const pct = target > 0 ? Math.min(100, (goalSecs / target) * 100) : 0;
                const isActiveTimer = timer?.goal_id === g.id;
                return (
                  <Card key={g.id} className="p-5 group hover:shadow-md transition-all">
                    <Link to={`/dashboard/goals/${g.id}`} className="block">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="w-8 h-8 rounded-lg shrink-0 mt-0.5" style={{ backgroundColor: g.color ?? "#6366f1" }} />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate">{g.title}</p>
                          {g.category && <p className="text-xs text-muted-foreground">{g.category}</p>}
                        </div>
                      </div>
                      {g.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{g.description}</p>}
                      <div className="text-sm mb-2">
                        <span className="font-medium">{formatDuration(goalSecs)}</span>
                        {target > 0 && <span className="text-muted-foreground"> / {formatDuration(target)}</span>}
                      </div>
                      {target > 0 && (
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-4">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </Link>
                    {tab === "active" && (
                      <Button
                        size="sm"
                        variant={isActiveTimer ? "secondary" : "outline"}
                        className="w-full"
                        disabled={isActiveTimer || startTimer.isPending}
                        onClick={() => handleStart(g.id)}
                      >
                        <Play className="w-3.5 h-3.5 mr-2" />
                        {isActiveTimer ? "Tracking…" : "Start timer"}
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

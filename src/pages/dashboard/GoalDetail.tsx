import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import {
  useGoal, useUpdateGoal, useDeleteGoal, useTimeEntries,
  useActiveTimer, useStartTimer, useStopTimer, useCancelTimer,
  useCreateTimeEntry, useDeleteTimeEntry,
  useTasks, useToggleTaskStatus,
} from "@/hooks/useGoals";
import { formatClock, formatDuration } from "@/lib/time";
import { ArrowLeft, Play, Pause, X, Plus, Trash2, Loader2, CheckCircle2, Archive, CheckSquare, Square, Calendar, FileDown, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

function LiveClock({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  return <span className="font-display tabular-nums">{formatClock(elapsed)}</span>;
}

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: goal, isLoading } = useGoal(id);
  const { data: entries } = useTimeEntries(id);
  const { data: tasks } = useTasks(id);
  const { data: timer } = useActiveTimer();
  const start = useStartTimer();
  const stop = useStopTimer();
  const cancel = useCancelTimer();
  const update = useUpdateGoal();
  const del = useDeleteGoal();
  const createEntry = useCreateTimeEntry();
  const deleteEntry = useDeleteTimeEntry();
  const toggleTask = useToggleTaskStatus();

  const [logOpen, setLogOpen] = useState(false);
  const [logHours, setLogHours] = useState("");
  const [logMinutes, setLogMinutes] = useState("");
  const [logNote, setLogNote] = useState("");

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!goal) {
    return (
      <div className="text-center p-10">
        <p className="text-muted-foreground mb-4">Goal not found.</p>
        <Button asChild variant="outline"><Link to="/dashboard/goals"><ArrowLeft className="w-4 h-4 mr-2" />Back to goals</Link></Button>
      </div>
    );
  }

  const isActive = timer?.goal_id === goal.id;
  const totalSecs = entries?.reduce((s, e) => s + e.duration_seconds, 0) ?? 0;
  const target = (goal.target_minutes ?? 0) * 60;
  const pct = target > 0 ? Math.min(100, (totalSecs / target) * 100) : 0;

  const handleLogManual = async () => {
    const h = parseFloat(logHours || "0") || 0;
    const m = parseFloat(logMinutes || "0") || 0;
    const secs = Math.round(h * 3600 + m * 60);
    if (secs <= 0) return toast.error("Enter a duration");
    const ended = new Date();
    const started = new Date(ended.getTime() - secs * 1000);
    try {
      await createEntry.mutateAsync({
        goal_id: goal.id,
        started_at: started.toISOString(),
        ended_at: ended.toISOString(),
        duration_seconds: secs,
        note: logNote.trim() || null,
      });
      setLogHours(""); setLogMinutes(""); setLogNote("");
      setLogOpen(false);
      toast.success("Time logged");
    } catch {
      // Error toast is handled by the mutation's onError callback
    }
  };

  const handleDownloadPDF = (title: string, summary: string) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      // Header Banner
      doc.setFillColor(99, 102, 241); // Indigo color
      doc.rect(0, 0, pageWidth, 40, "F");

      // Title Text
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("TrackerGoal Study Summary", margin, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 30);

      // Goal Title section
      doc.setTextColor(31, 41, 55); // Gray-800
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(`Study Goal: ${title}`, margin, 52);

      // Separator
      doc.setDrawColor(229, 231, 235); // Gray-200
      doc.line(margin, 57, pageWidth - margin, 57);

      // Body text formatting
      doc.setTextColor(55, 65, 81); // Gray-700
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      // Clean markdown symbols to look neat in PDF
      const cleanSummary = summary
        .replace(/\*\*/g, "")
        .replace(/\*/g, "-")
        .replace(/#/g, "");

      const splitText = doc.splitTextToSize(cleanSummary, contentWidth);

      let yPos = 66;
      const lineHeight = 6;

      for (let i = 0; i < splitText.length; i++) {
        if (yPos + lineHeight > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(splitText[i], margin, yPos);
        yPos += lineHeight;
      }

      const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      doc.save(`${safeTitle}-study-summary.pdf`);
      toast.success("PDF Downloaded!");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Failed to generate PDF document.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/goals"><ArrowLeft className="w-4 h-4 mr-2" />All goals</Link>
        </Button>
        <div className="flex items-center gap-2">
          <Select value={goal.status} onValueChange={(v: any) => update.mutate({ id: goal.id, updates: { status: v } })}>
            <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed"><CheckCircle2 className="w-3 h-3 inline mr-1" />Completed</SelectItem>
              <SelectItem value="archived"><Archive className="w-3 h-3 inline mr-1" />Archived</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={async () => {
            if (!confirm("Delete this goal and all its time entries?")) return;
            try {
              await del.mutateAsync(goal.id);
              toast.success("Goal deleted");
              navigate("/dashboard/goals");
            } catch {
              // Error toast is handled by the mutation's onError callback
            }
          }}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Hero */}
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <span className="w-12 h-12 rounded-xl shrink-0" style={{ backgroundColor: goal.color ?? "#6366f1" }} />
          <div className="flex-1 min-w-0">
            <Input
              defaultValue={goal.title}
              onBlur={(e) => e.target.value !== goal.title && update.mutate({ id: goal.id, updates: { title: e.target.value } })}
              className="font-display text-2xl font-bold border-0 px-0 h-auto focus-visible:ring-0 shadow-none"
            />
            <div className="flex flex-wrap gap-2 mt-1">
              {goal.category && <Badge variant="secondary">{goal.category}</Badge>}
              <Badge variant="outline" className="capitalize">{goal.priority}</Badge>
            </div>
          </div>
        </div>
        <Textarea
          defaultValue={goal.description ?? ""}
          placeholder="Add a description..."
          onBlur={(e) => e.target.value !== (goal.description ?? "") && update.mutate({ id: goal.id, updates: { description: e.target.value || null } })}
          className="resize-none border-0 px-0 shadow-none focus-visible:ring-0"
          rows={2}
        />

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-display font-bold">{formatDuration(totalSecs)}</span>
            {target > 0 && (
              <span className="text-sm text-muted-foreground">of {formatDuration(target)} &middot; {Math.round(pct)}%</span>
            )}
          </div>
          {target > 0 && (
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      </Card>

      {/* Timer */}
      <Card className="p-6">
        {isActive && timer ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Tracking now</p>
              <div className="text-4xl md:text-5xl font-bold mt-1"><LiveClock startedAt={timer.started_at} /></div>
            </div>
            <div className="flex gap-2">
              <Button size="lg" onClick={() => stop.mutate(timer)} disabled={stop.isPending}>
                <Pause className="w-4 h-4 mr-2" /> Stop & save
              </Button>
              <Button size="lg" variant="ghost" onClick={() => cancel.mutate()}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold">Ready to focus?</p>
              <p className="text-sm text-muted-foreground">Start a timed session or log time you already spent.</p>
            </div>
            <div className="flex gap-2">
              <Button size="lg" onClick={async () => {
                try {
                  await start.mutateAsync({ goal_id: goal.id });
                  toast.success("Timer started");
                } catch {
                  // Error toast is handled by the mutation's onError callback
                }
              }} disabled={!!timer || start.isPending}>
                <Play className="w-4 h-4 mr-2" /> Start timer
              </Button>
              <Dialog open={logOpen} onOpenChange={setLogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline"><Plus className="w-4 h-4 mr-2" /> Log time</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Log time manually</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Hours</Label>
                        <Input type="number" min={0} value={logHours} onChange={(e) => setLogHours(e.target.value)} />
                      </div>
                      <div>
                        <Label>Minutes</Label>
                        <Input type="number" min={0} max={59} value={logMinutes} onChange={(e) => setLogMinutes(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label>Note</Label>
                      <Textarea value={logNote} onChange={(e) => setLogNote(e.target.value)} rows={2} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setLogOpen(false)}>Cancel</Button>
                    <Button onClick={handleLogManual} disabled={createEntry.isPending}>Log it</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </Card>

      {/* AI Study Materials */}
      {(goal as any).study_summary && (
        <div className="space-y-3">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            AI Study Materials
          </h2>
          <Card className="p-5 bg-gradient-to-br from-primary/5 to-muted/20 border-primary/20">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <p className="font-semibold text-xs uppercase tracking-wider text-primary">
                  Document Summary & Analysis
                </p>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto pr-2">
                  {(goal as any).study_summary}
                </div>
              </div>
              <Button
                onClick={() => handleDownloadPDF(goal.title, (goal as any).study_summary)}
                className="shrink-0 gap-2 shadow-sm self-start md:self-center"
              >
                <FileDown className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Tasks roadmap */}
      <div>
        <h2 className="font-display text-xl font-semibold mb-3 flex items-center gap-2">
          Study Roadmap & Tasks
          {tasks && tasks.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {tasks.filter((t) => t.status === "completed").length} / {tasks.length} Completed
            </Badge>
          )}
        </h2>
        {!tasks || tasks.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground border-dashed">
            No study roadmap or tasks created for this goal yet. Upload a lecture/PDF in the AI Chatbot to auto-generate one!
          </Card>
        ) : (
          <Card className="divide-y divide-border">
            {tasks.map((task) => {
              const isCompleted = task.status === "completed";
              return (
                <div key={task.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      onClick={() =>
                        toggleTask.mutate({
                          id: task.id,
                          status: isCompleted ? "pending" : "completed",
                        })
                      }
                      className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {isCompleted ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <p className={`font-medium ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{task.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(task.due_date).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                        {task.duration_minutes && (
                          <span>{task.duration_minutes} mins</span>
                        )}
                        {task.priority && (
                          <span className="capitalize">{task.priority} priority</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </div>

      {/* Time entries */}
      <div>
        <h2 className="font-display text-xl font-semibold mb-3">History</h2>
        {!entries || entries.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No sessions logged yet.</Card>
        ) : (
          <Card className="divide-y divide-border">
            {entries.map((e) => (
              <div key={e.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium">{formatDuration(e.duration_seconds)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.started_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  {e.note && <p className="text-sm text-muted-foreground mt-1 truncate">{e.note}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteEntry.mutate(e.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

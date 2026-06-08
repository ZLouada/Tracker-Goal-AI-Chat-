import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGoals, useCreateTimeEntry } from "@/hooks/useGoals";
import { formatClock } from "@/lib/time";
import { toast } from "sonner";
import { Play, Pause, RotateCcw, SkipForward, Timer as TimerIcon, Hourglass, Watch } from "lucide-react";

// --- shared helpers ---
function useTick(active: boolean, ms = 250) {
  const [, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setN((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [active, ms]);
}

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880;
    o.type = "sine";
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
    o.start();
    o.stop(ctx.currentTime + 0.75);
  } catch {}
}

function notify(title: string, body?: string) {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try { new Notification(title, { body }); } catch {}
  }
}

export default function Timers() {
  const [activeTab, setActiveTab] = useState("pomodoro");

  useEffect(() => {
    const handleControl = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.timerType) {
        setActiveTab(detail.timerType);
      }
    };
    window.addEventListener("trackergoal-timer-control", handleControl);
    return () => window.removeEventListener("trackergoal-timer-control", handleControl);
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Timers</h1>
        <p className="text-muted-foreground mt-1">Pomodoro, countdown, and stopwatch — all in one place.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="rounded-full">
          <TabsTrigger value="pomodoro" className="rounded-full"><TimerIcon className="w-4 h-4 mr-2" />Pomodoro</TabsTrigger>
          <TabsTrigger value="countdown" className="rounded-full"><Hourglass className="w-4 h-4 mr-2" />Countdown</TabsTrigger>
          <TabsTrigger value="stopwatch" className="rounded-full"><Watch className="w-4 h-4 mr-2" />Stopwatch</TabsTrigger>
        </TabsList>

        <TabsContent value="pomodoro" className="mt-6"><Pomodoro /></TabsContent>
        <TabsContent value="countdown" className="mt-6"><Countdown /></TabsContent>
        <TabsContent value="stopwatch" className="mt-6"><Stopwatch /></TabsContent>
      </Tabs>
    </div>
  );
}

// ============== POMODORO 25 / 5 / 15 ==============
type Phase = "focus" | "short" | "long";
const PHASE_SEC: Record<Phase, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const PHASE_LABEL: Record<Phase, string> = { focus: "Focus", short: "Short break", long: "Long break" };

function Pomodoro() {
  const { data: goals } = useGoals("active");
  const createEntry = useCreateTimeEntry();

  const [phase, setPhase] = useState<Phase>("focus");
  const [goalId, setGoalId] = useState<string>("none");
  const [running, setRunning] = useState(false);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remainingFrozen, setRemainingFrozen] = useState<number>(PHASE_SEC.focus);
  const [completedFocus, setCompletedFocus] = useState(0);
  const startedAtRef = useRef<number | null>(null);

  useTick(running);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const remaining = running && endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : remainingFrozen;

  // auto-advance when timer hits 0
  useEffect(() => {
    if (!running || !endsAt) return;
    if (remaining > 0) return;
    setRunning(false);
    handlePhaseComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running, endsAt]);

  function handlePhaseComplete() {
    beep();
    if (phase === "focus") {
      // log focus minutes to goal if linked
      if (goalId !== "none" && startedAtRef.current) {
        createEntry.mutate({
          goal_id: goalId,
          started_at: new Date(startedAtRef.current).toISOString(),
          ended_at: new Date().toISOString(),
          duration_seconds: PHASE_SEC.focus,
          note: "Pomodoro focus session",
        });
      }
      const next = completedFocus + 1;
      setCompletedFocus(next);
      const nextPhase: Phase = next % 4 === 0 ? "long" : "short";
      notify("Focus done! 🎉", `Time for a ${nextPhase === "long" ? "long" : "short"} break.`);
      switchPhase(nextPhase);
    } else {
      notify("Break over", "Back to focus.");
      switchPhase("focus");
    }
    startedAtRef.current = null;
  }

  function switchPhase(p: Phase) {
    setPhase(p);
    setRemainingFrozen(PHASE_SEC[p]);
    setEndsAt(null);
    setRunning(false);
  }

  function start() {
    const secs = remainingFrozen > 0 ? remainingFrozen : PHASE_SEC[phase];
    setEndsAt(Date.now() + secs * 1000);
    setRunning(true);
    if (phase === "focus" && !startedAtRef.current) {
      startedAtRef.current = Date.now() - (PHASE_SEC.focus - secs) * 1000;
    }
  }
  function pause() {
    if (!endsAt) return;
    setRemainingFrozen(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    setRunning(false);
    setEndsAt(null);
  }
  function reset() {
    setRunning(false);
    setEndsAt(null);
    setRemainingFrozen(PHASE_SEC[phase]);
    startedAtRef.current = null;
  }
  function skip() {
    setRunning(false);
    setEndsAt(null);
    handlePhaseComplete();
  }

  const startRef = useRef(start);
  const pauseRef = useRef(pause);
  const resetRef = useRef(reset);
  startRef.current = start;
  pauseRef.current = pause;
  resetRef.current = reset;

  useEffect(() => {
    const handleControl = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.timerType !== "pomodoro") return;
      if (detail.goalId && detail.goalId !== "none") {
        setGoalId(detail.goalId);
      }
      if (detail.action === "start") {
        // Wait a tiny bit for tab/state sync if needed, then execute
        setTimeout(() => startRef.current(), 50);
      } else if (detail.action === "pause") {
        pauseRef.current();
      } else if (detail.action === "reset") {
        resetRef.current();
      }
    };
    window.addEventListener("trackergoal-timer-control", handleControl);
    return () => window.removeEventListener("trackergoal-timer-control", handleControl);
  }, []);

  const total = PHASE_SEC[phase];
  const pct = ((total - remaining) / total) * 100;

  return (
    <Card className="p-8">
      <div className="flex items-center justify-center gap-2 mb-6">
        {(["focus", "short", "long"] as Phase[]).map((p) => (
          <button
            key={p}
            onClick={() => switchPhase(p)}
            className={`px-4 h-9 rounded-full text-sm font-medium transition-colors ${
              phase === p ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {PHASE_LABEL[p]}
          </button>
        ))}
      </div>

      <div className="relative mx-auto w-64 h-64 mb-6">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="46" fill="none"
            stroke="hsl(var(--primary))" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 46}`}
            strokeDashoffset={`${2 * Math.PI * 46 * (1 - pct / 100)}`}
            style={{ transition: "stroke-dashoffset 0.4s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-display text-5xl font-bold tabular-nums">{formatClock(remaining)}</div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mt-2">{PHASE_LABEL[phase]}</div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mb-6">
        {!running ? (
          <Button size="lg" onClick={start}><Play className="w-4 h-4 mr-2" />Start</Button>
        ) : (
          <Button size="lg" variant="outline" onClick={pause}><Pause className="w-4 h-4 mr-2" />Pause</Button>
        )}
        <Button size="lg" variant="ghost" onClick={reset}><RotateCcw className="w-4 h-4 mr-2" />Reset</Button>
        <Button size="lg" variant="ghost" onClick={skip}><SkipForward className="w-4 h-4 mr-2" />Skip</Button>
      </div>

      <div className="max-w-sm mx-auto space-y-2">
        <Label className="text-xs">Log focus time to (optional)</Label>
        <Select value={goalId} onValueChange={setGoalId}>
          <SelectTrigger className="rounded-full"><SelectValue placeholder="No goal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No goal</SelectItem>
            {goals?.map((g) => <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground text-center pt-2">
          Completed focus sessions: <span className="font-semibold text-foreground">{completedFocus}</span>
        </p>
      </div>
    </Card>
  );
}

// ============== COUNTDOWN ==============
function Countdown() {
  const [minutes, setMinutes] = useState(10);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [frozen, setFrozen] = useState(600);

  useTick(running);

  const total = minutes * 60 + seconds;
  const remaining = running && endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : frozen;

  useEffect(() => {
    if (!running) setFrozen(total);
  }, [minutes, seconds, total, running]);

  useEffect(() => {
    if (running && remaining === 0) {
      setRunning(false);
      setEndsAt(null);
      beep();
      notify("Countdown done", `${minutes}m ${seconds}s elapsed.`);
      toast.success("Time's up!");
    }
  }, [remaining, running, minutes, seconds]);

  function start(overrideSecs?: number) {
    const secs = overrideSecs !== undefined ? overrideSecs : (frozen > 0 ? frozen : total);
    if (secs <= 0) return;
    setEndsAt(Date.now() + secs * 1000);
    setRunning(true);
  }
  function pause() {
    if (!endsAt) return;
    setFrozen(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    setRunning(false);
    setEndsAt(null);
  }
  function reset() {
    setRunning(false);
    setEndsAt(null);
    setFrozen(total);
  }

  const startRef = useRef(start);
  const pauseRef = useRef(pause);
  const resetRef = useRef(reset);
  startRef.current = start;
  pauseRef.current = pause;
  resetRef.current = reset;

  useEffect(() => {
    const handleControl = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.timerType !== "countdown") return;
      
      let finalSecs = undefined;
      if (typeof detail.minutes === "number" || typeof detail.seconds === "number") {
        const m = typeof detail.minutes === "number" ? detail.minutes : minutes;
        const s = typeof detail.seconds === "number" ? detail.seconds : seconds;
        setMinutes(m);
        setSeconds(s);
        setFrozen(m * 60 + s);
        finalSecs = m * 60 + s;
      }
      
      if (detail.action === "start") {
        setTimeout(() => startRef.current(finalSecs), 50);
      } else if (detail.action === "pause") {
        pauseRef.current();
      } else if (detail.action === "reset") {
        resetRef.current();
      }
    };
    window.addEventListener("trackergoal-timer-control", handleControl);
    return () => window.removeEventListener("trackergoal-timer-control", handleControl);
  }, [minutes, seconds]);

  const presets = [1, 5, 10, 15, 25, 45];

  return (
    <Card className="p-8">
      <div className="text-center mb-6">
        <div className="font-display text-6xl font-bold tabular-nums">{formatClock(remaining)}</div>
      </div>

      {!running && (
        <>
          <div className="flex items-end justify-center gap-3 mb-4">
            <div className="space-y-1">
              <Label className="text-xs">Minutes</Label>
              <Input
                type="number" min={0} max={999} value={minutes}
                onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                className="rounded-full w-24 text-center"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Seconds</Label>
              <Input
                type="number" min={0} max={59} value={seconds}
                onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                className="rounded-full w-24 text-center"
              />
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {presets.map((m) => (
              <button
                key={m}
                onClick={() => { setMinutes(m); setSeconds(0); }}
                className="px-3 h-8 rounded-full bg-muted text-xs text-muted-foreground hover:bg-muted/70"
              >{m}m</button>
            ))}
          </div>
        </>
      )}

      <div className="flex items-center justify-center gap-3">
        {!running ? (
          <Button size="lg" onClick={start} disabled={total === 0}><Play className="w-4 h-4 mr-2" />Start</Button>
        ) : (
          <Button size="lg" variant="outline" onClick={pause}><Pause className="w-4 h-4 mr-2" />Pause</Button>
        )}
        <Button size="lg" variant="ghost" onClick={reset}><RotateCcw className="w-4 h-4 mr-2" />Reset</Button>
      </div>
    </Card>
  );
}

// ============== STOPWATCH ==============
function Stopwatch() {
  const { data: goals } = useGoals("active");
  const createEntry = useCreateTimeEntry();

  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [accumulated, setAccumulated] = useState(0); // seconds when paused
  const [laps, setLaps] = useState<number[]>([]);
  const [goalId, setGoalId] = useState<string>("none");

  useTick(running);

  const elapsed = running && startedAt
    ? accumulated + Math.floor((Date.now() - startedAt) / 1000)
    : accumulated;

  function start() { setStartedAt(Date.now()); setRunning(true); }
  function pause() {
    if (startedAt) setAccumulated(accumulated + Math.floor((Date.now() - startedAt) / 1000));
    setStartedAt(null);
    setRunning(false);
  }
  function reset() {
    setRunning(false);
    setStartedAt(null);
    setAccumulated(0);
    setLaps([]);
  }
  function lap() { setLaps([elapsed, ...laps]); }

  const startRef = useRef(start);
  const pauseRef = useRef(pause);
  const resetRef = useRef(reset);
  startRef.current = start;
  pauseRef.current = pause;
  resetRef.current = reset;

  useEffect(() => {
    const handleControl = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.timerType !== "stopwatch") return;
      if (detail.goalId && detail.goalId !== "none") {
        setGoalId(detail.goalId);
      }
      if (detail.action === "start") {
        setTimeout(() => startRef.current(), 50);
      } else if (detail.action === "pause") {
        pauseRef.current();
      } else if (detail.action === "reset") {
        resetRef.current();
      }
    };
    window.addEventListener("trackergoal-timer-control", handleControl);
    return () => window.removeEventListener("trackergoal-timer-control", handleControl);
  }, []);

  function saveToGoal() {
    if (goalId === "none" || elapsed < 1) return;
    const ended = new Date();
    const started = new Date(ended.getTime() - elapsed * 1000);
    createEntry.mutate(
      {
        goal_id: goalId,
        started_at: started.toISOString(),
        ended_at: ended.toISOString(),
        duration_seconds: elapsed,
        note: "Stopwatch session",
      },
      {
        onSuccess: () => {
          toast.success("Session saved to goal");
          reset();
        },
      }
    );
  }

  return (
    <Card className="p-8">
      <div className="text-center mb-6">
        <div className="font-display text-6xl font-bold tabular-nums">{formatClock(elapsed)}</div>
      </div>

      <div className="flex items-center justify-center gap-3 mb-6">
        {!running ? (
          <Button size="lg" onClick={start}><Play className="w-4 h-4 mr-2" />Start</Button>
        ) : (
          <Button size="lg" variant="outline" onClick={pause}><Pause className="w-4 h-4 mr-2" />Pause</Button>
        )}
        <Button size="lg" variant="ghost" onClick={lap} disabled={!running}>Lap</Button>
        <Button size="lg" variant="ghost" onClick={reset}><RotateCcw className="w-4 h-4 mr-2" />Reset</Button>
      </div>

      <div className="max-w-sm mx-auto space-y-2 mb-4">
        <Label className="text-xs">Save session to goal (optional)</Label>
        <div className="flex gap-2">
          <Select value={goalId} onValueChange={setGoalId}>
            <SelectTrigger className="rounded-full"><SelectValue placeholder="No goal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No goal</SelectItem>
              {goals?.map((g) => <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={saveToGoal} disabled={goalId === "none" || elapsed < 1 || createEntry.isPending}>
            Save
          </Button>
        </div>
      </div>

      {laps.length > 0 && (
        <div className="max-w-sm mx-auto">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Laps</p>
          <ul className="space-y-1 max-h-48 overflow-auto">
            {laps.map((l, i) => (
              <li key={i} className="flex justify-between text-sm tabular-nums py-1.5 px-3 rounded-full bg-muted/50">
                <span className="text-muted-foreground">#{laps.length - i}</span>
                <span className="font-medium">{formatClock(l)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

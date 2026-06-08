import { useEffect, useState } from "react";
import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Preset = { name: string; primary: string; accent: string };

const PRESETS: Preset[] = [
  { name: "Rose",    primary: "340 75% 58%", accent: "340 60% 92%" },
  { name: "Indigo",  primary: "243 75% 60%", accent: "243 60% 94%" },
  { name: "Emerald", primary: "160 65% 42%", accent: "160 50% 92%" },
  { name: "Amber",   primary: "35 92% 55%",  accent: "35 80% 92%" },
  { name: "Cyan",    primary: "190 80% 45%", accent: "190 60% 92%" },
  { name: "Violet",  primary: "270 70% 60%", accent: "270 55% 94%" },
  { name: "Slate",   primary: "220 25% 25%", accent: "220 15% 92%" },
  { name: "Crimson", primary: "0 75% 55%",   accent: "0 70% 94%" },
];

const STORAGE_KEY = "tg-theme-colors";
const DEFAULT_COLORS: Colors = { primary: PRESETS[0].primary, accent: PRESETS[0].accent };

type Colors = { primary: string; accent: string };

function readStored(): Colors | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

function writeStored(c: Colors) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch {}
}

function apply({ primary, accent }: Colors) {
  const root = document.documentElement;
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--ring", primary);
  root.style.setProperty("--sidebar-primary", primary);
  root.style.setProperty("--sidebar-ring", primary);
  root.style.setProperty("--accent", accent);
}

export function ThemeBootstrap() {
  const { user } = useAuth();

  // 1. Instant local apply (no flash) on mount.
  useEffect(() => {
    const s = readStored();
    if (s) apply(s);
  }, []);

  // 2. When auth resolves, hydrate from profile and override local.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("theme_primary, theme_accent")
          .eq("id", user.id)
          .maybeSingle();
        if (cancelled || !data) return;
        const p = (data as any).theme_primary as string | null;
        const a = (data as any).theme_accent as string | null;
        if (p && a) {
          const colors = { primary: p, accent: a };
          apply(colors);
          writeStored(colors);
        }
      } catch {
        // Supabase query failed — use local theme instead
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  return null;
}

export function ThemeCustomizer() {
  const { user } = useAuth();
  const [colors, setColors] = useState<Colors>(() => readStored() ?? DEFAULT_COLORS);
  const [hydrated, setHydrated] = useState(false);

  // Pull saved colors from profile once signed in.
  useEffect(() => {
    if (!user) { setHydrated(true); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("theme_primary, theme_accent")
          .eq("id", user.id)
          .maybeSingle();
        if (cancelled) return;
        const p = (data as any)?.theme_primary as string | null;
        const a = (data as any)?.theme_accent as string | null;
        if (p && a) setColors({ primary: p, accent: a });
      } catch {
        // Supabase query failed — use local theme
      }
      setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Apply + persist locally on any change.
  useEffect(() => {
    apply(colors);
    writeStored(colors);
  }, [colors]);

  // Persist to profile (debounced) once hydrated.
  useEffect(() => {
    if (!user || !hydrated) return;
    const t = setTimeout(() => {
      supabase
        .from("profiles")
        .update({ theme_primary: colors.primary, theme_accent: colors.accent } as any)
        .eq("id", user.id)
        .then(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [colors, user, hydrated]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" title="Customize theme">
          <Palette className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-4">
          <div>
            <p className="font-display font-semibold text-sm">Theme colors</p>
            <p className="text-xs text-muted-foreground">
              {user ? "Synced to your account." : "Saved locally on this device."}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">Presets</p>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((p) => {
                const active = p.primary === colors.primary;
                return (
                  <button
                    key={p.name}
                    onClick={() => setColors({ primary: p.primary, accent: p.accent })}
                    title={p.name}
                    className="aspect-square rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{ backgroundColor: `hsl(${p.primary})` }}
                  >
                    {active && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          <ColorTuner
            label="Primary"
            value={colors.primary}
            onChange={(primary) => setColors((c) => ({ ...c, primary }))}
          />
          <ColorTuner
            label="Accent"
            value={colors.accent}
            onChange={(accent) => setColors((c) => ({ ...c, accent }))}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function parseHsl(v: string): [number, number, number] {
  const m = v.match(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
  if (!m) return [0, 0, 50];
  return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
}

function ColorTuner({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [h, s, l] = parseHsl(value);
  const set = (nh: number, ns: number, nl: number) => onChange(`${Math.round(nh)} ${Math.round(ns)}% ${Math.round(nl)}%`);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className="w-5 h-5 rounded-full" style={{ backgroundColor: `hsl(${value})` }} />
      </div>
      <Slider label="Hue" min={0} max={360} value={h} onChange={(v) => set(v, s, l)} />
      <Slider label="Sat" min={0} max={100} value={s} onChange={(v) => set(h, v, l)} />
      <Slider label="Light" min={0} max={100} value={l} onChange={(v) => set(h, s, v)} />
    </div>
  );
}

function Slider({ label, min, max, value, onChange }: { label: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="w-10 text-muted-foreground">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-primary"
      />
      <span className="w-8 tabular-nums text-right text-muted-foreground">{Math.round(value)}</span>
    </label>
  );
}

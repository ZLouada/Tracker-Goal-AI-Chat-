import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid Hydration Mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-9 h-9 rounded-full relative hover:bg-muted transition-colors duration-200"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        {/* Sun Icon */}
        <Sun
          className={`w-5 h-5 absolute transition-all duration-300 transform ${
            isDark 
              ? "rotate-90 scale-0 opacity-0 translate-y-3" 
              : "rotate-0 scale-100 opacity-100 translate-y-0"
          }`}
        />
        {/* Moon Icon */}
        <Moon
          className={`w-5 h-5 absolute transition-all duration-300 transform ${
            isDark 
              ? "rotate-0 scale-100 opacity-100 translate-y-0" 
              : "-rotate-90 scale-0 opacity-0 -translate-y-3"
          }`}
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

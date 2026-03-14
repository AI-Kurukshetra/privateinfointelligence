"use client";

import { Moon, Sun } from "lucide-react";
import { useState } from "react";

type ThemeMode = "light" | "dark";

function getCurrentTheme(): ThemeMode {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(getCurrentTheme);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem("ui-theme", nextTheme);
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="ui-btn ui-btn-secondary inline-flex items-center gap-2 px-3"
      onClick={toggleTheme}
      suppressHydrationWarning
    >
      {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      <span className="text-[13px]">{theme === "light" ? "Dark" : "Light"}</span>
    </button>
  );
}

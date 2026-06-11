"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_THEME,
  THEME_IDS,
  THEME_STORAGE_KEY,
  type ThemeId,
} from "@/lib/themes";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);

  // The inline script in layout.tsx sets data-theme before paint;
  // sync React state to it after hydration.
  useEffect(() => {
    const current = document.documentElement.getAttribute(
      "data-theme"
    ) as ThemeId | null;
    if (current && THEME_IDS.includes(current)) {
      setThemeState(current);
    }
  }, []);

  const setTheme = useCallback((next: ThemeId) => {
    document.documentElement.setAttribute("data-theme", next);
    setThemeState((prev) => {
      if (prev !== next) {
        // The globe intro IS the theme transition — it replays with the new
        // theme's colors. (The old drift choreography ran during the globe's
        // page snapshot and smeared it, so it's gone.)
        window.dispatchEvent(new CustomEvent("theme-change"));
      }
      return next;
    });
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // private mode etc. — non-fatal
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

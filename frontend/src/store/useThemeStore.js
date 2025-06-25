import { create } from "zustand";
import { THEMES } from "../constants";

export const useThemeStore = create((set, get) => ({
  theme: localStorage.getItem("streamify-theme") || "light",

  setTheme: (themeName) => {
    localStorage.setItem("streamify-theme", themeName);
    set({ theme: themeName });
  },

  toggleTheme: () => {
    const currentThemeName = get().theme;
    const currentTheme = THEMES.find((t) => t.name === currentThemeName);
    if (!currentTheme) {
      // Default to light if theme is unknown
      get().setTheme("light");
      return;
    }

    // Toggle between light and dark
    if (currentTheme.isDark) {
      get().setTheme("light");
    } else {
      get().setTheme("dark");
    }
  },
}));

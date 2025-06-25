import { SunIcon, MoonIcon } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import { THEMES } from "../constants";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();

  const currentTheme = THEMES.find((t) => t.name === theme);
  const isDark = currentTheme ? currentTheme.isDark : false;

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-ghost btn-circle transition-all duration-300 hover:scale-110"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <SunIcon className="size-5 text-yellow-400" />
      ) : (
        <MoonIcon className="size-5 text-slate-600" />
      )}
    </button>
  );
};

export default ThemeToggle; 
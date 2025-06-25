import { SunIcon, MoonIcon } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import { THEMES } from "../constants";

const SimpleThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();

  // We need to check the metadata of the current theme to know if it's dark
  const currentTheme = THEMES.find((t) => t.name === theme);
  const isDark = currentTheme ? currentTheme.isDark : false;

  return (
    <button
      onClick={toggleTheme}
      className='btn btn-outline btn-sm transition-all duration-200 border-base-300 hover:border-primary hover:shadow-sm flex items-center gap-2'
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <>
          <SunIcon className='size-4 text-yellow-400' />
          <span className='text-sm'>Light</span>
        </>
      ) : (
        <>
          <MoonIcon className='size-4 text-slate-600' />
          <span className='text-sm'>Dark</span>
        </>
      )}
    </button>
  );
};

export default SimpleThemeToggle; 
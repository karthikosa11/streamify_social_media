import { SunIcon, MoonIcon } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import { THEMES } from "../constants";

const ThemeToggleAdvanced = () => {
  const { theme, toggleTheme } = useThemeStore();

  const currentTheme = THEMES.find((t) => t.name === theme);
  const isDark = currentTheme ? currentTheme.isDark : false;

  return (
    <button
      onClick={toggleTheme}
      className="relative w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-base-100"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Toggle Switch */}
      <div
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
          isDark ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
      
      {/* Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-1">
        <SunIcon 
          className={`w-3 h-3 transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-yellow-500'
          }`} 
        />
        <MoonIcon 
          className={`w-3 h-3 transition-colors duration-300 ${
            isDark ? 'text-blue-400' : 'text-gray-400'
          }`} 
        />
      </div>
    </button>
  );
};

export default ThemeToggleAdvanced; 
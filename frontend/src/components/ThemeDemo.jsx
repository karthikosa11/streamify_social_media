import ThemeToggle from "./ThemeToggle";
import ThemeToggleAdvanced from "./ThemeToggleAdvanced";
import ThemeSelector from "./ThemeSelector";
import { useThemeStore } from "../store/useThemeStore";

const ThemeDemo = () => {
  const { theme } = useThemeStore();

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Theme Toggle Demo</h2>
        <p className="text-base-content/70">Current theme: {theme}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Simple Toggle */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Simple Toggle</h3>
            <p className="text-sm text-base-content/70 mb-4">
              Basic icon-based toggle button
            </p>
            <div className="flex justify-center">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Advanced Toggle */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Advanced Toggle</h3>
            <p className="text-sm text-base-content/70 mb-4">
              Animated switch with icons
            </p>
            <div className="flex justify-center">
              <ThemeToggleAdvanced />
            </div>
          </div>
        </div>

        {/* Theme Selector */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Theme Selector</h3>
            <p className="text-sm text-base-content/70 mb-4">
              Full theme palette selector
            </p>
            <div className="flex justify-center">
              <ThemeSelector />
            </div>
          </div>
        </div>
      </div>

      {/* Theme Preview */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Theme Preview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-primary text-primary-content rounded-lg">
              <p className="font-semibold">Primary</p>
              <p className="text-sm opacity-80">Primary color sample</p>
            </div>
            <div className="p-4 bg-secondary text-secondary-content rounded-lg">
              <p className="font-semibold">Secondary</p>
              <p className="text-sm opacity-80">Secondary color sample</p>
            </div>
            <div className="p-4 bg-accent text-accent-content rounded-lg">
              <p className="font-semibold">Accent</p>
              <p className="text-sm opacity-80">Accent color sample</p>
            </div>
            <div className="p-4 bg-base-200 text-base-content rounded-lg">
              <p className="font-semibold">Base</p>
              <p className="text-sm opacity-80">Base color sample</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeDemo; 
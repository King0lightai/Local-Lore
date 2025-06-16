import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-all duration-200 hover:bg-writer-surface dark:hover:bg-dark-panel"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-writer-subtle dark:text-dark-subtle" />
      ) : (
        <Sun className="w-5 h-5 text-writer-subtle dark:text-dark-subtle" />
      )}
    </button>
  );
};

export default ThemeToggle;
import React from 'react';
import { Button } from './ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="relative overflow-hidden bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/20 dark:border-purple-400/20 hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-300"
    >
      <div className="relative z-10">
        {theme === 'light' ? (
          <Moon className="h-4 w-4 text-blue-600 dark:text-purple-400" />
        ) : (
          <Sun className="h-4 w-4 text-yellow-500" />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
    </Button>
  );
}
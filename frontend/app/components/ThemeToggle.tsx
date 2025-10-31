'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.remove(newTheme === 'dark' ? 'light' : 'dark');
    document.documentElement.classList.add(newTheme);
  };

  return (
    <button onClick={toggleTheme} className="p-2 rounded-lg bg-secondary cursor-pointer fixed z-1 right-5 top-5">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
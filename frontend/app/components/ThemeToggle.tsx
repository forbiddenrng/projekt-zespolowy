'use client';

import { useEffect, useState } from 'react';
import { FaMoon, FaSun } from "react-icons/fa";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.body.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.classList.remove(newTheme === 'dark' ? 'light' : 'dark');
    document.body.classList.add(newTheme);
  };

  return (
    <div className="flex items-center justify-between w-full px-4 py-3 rounded-lg hover:bg-secondary transition-all duration-200">
      <div className="flex items-center gap-3">
        <span className="text-xl text-muted">
          {theme === 'dark' ? <FaMoon /> : <FaSun />}
        </span>
        <span className="font-medium text-muted">
          {theme === 'dark' ? 'Ciemny motyw' : 'Jasny motyw'}
        </span>
      </div>
      
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={theme === 'dark'}
          onChange={toggleTheme}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
      </label>
    </div>
  );
}
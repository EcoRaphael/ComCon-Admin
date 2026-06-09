// src/hooks/useDarkMode.js
// Toggles class="dark" on <html>, persists preference to localStorage.
// Works with Tailwind's darkMode: 'class' config.

import { useState, useEffect } from 'react'

const KEY = 'cc-dark-mode'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    // 1. Check saved preference
    const saved = localStorage.getItem(KEY)
    if (saved !== null) return saved === 'true'
    // 2. Fall back to OS preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem(KEY, String(isDark))
  }, [isDark])

  const toggle = () => setIsDark(prev => !prev)

  return { isDark, toggle }
}
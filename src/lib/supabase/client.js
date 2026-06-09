// src/lib/supabase/client.js
// Supabase client — single instance shared across the entire app
// Part 1: initialize with env variables from .env.local

import { createClient } from '@supabase/supabase-js'

// Add these two lines at the top of client.js temporarily
console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY)

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ Missing Supabase env variables.\n' +
    'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env.local file.\n' +
    'See .env.local for setup instructions.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Persist session across browser tabs and page refreshes
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export default supabase

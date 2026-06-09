// src/lib/supabase/connectionTest.js
// Run this to verify your Supabase connection is working
// Used by the Settings page to show connection status

import { supabase } from './client'

export async function testConnection() {
  try {
    const start = Date.now()
    const { data, error } = await supabase
      .from('fare_matrix')
      .select('vehicle_type')
      .limit(1)

    if (error) throw error

    return {
      connected: true,
      latency:   Date.now() - start,
      message:   `Connected — ${data?.length ?? 0} record(s) returned`,
    }
  } catch (err) {
    return {
      connected: false,
      latency:   null,
      message:   err.message || 'Connection failed',
    }
  }
}

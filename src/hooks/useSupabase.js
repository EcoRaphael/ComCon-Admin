// src/hooks/useSupabase.js
// Custom hooks that wrap service calls with loading + error states
// Drop-in replacements for the AdminContext mock data

import { useState, useEffect, useCallback } from 'react'

// Generic fetch hook — handles loading, error, and refetch
export function useQuery(fetchFn, deps = []) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn()
      setData(result)
    } catch (err) {
      setError(err.message)
      console.error('useQuery error:', err)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { run() }, [run])

  return { data, loading, error, refetch: run }
}

// Generic mutation hook — for insert/update/delete operations
export function useMutation(mutateFn) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const mutate = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await mutateFn(...args)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [mutateFn])

  return { mutate, loading, error }
}

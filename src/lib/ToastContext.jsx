// src/lib/ToastContext.jsx
import { createContext, useContext } from 'react'
import { useToast } from '@/hooks/useToast'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const { toasts, addToast, removeToast } = useToast()

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <ToastContainer toasts={toasts} remove={removeToast} />
    </ToastContext.Provider>
  )
}

export const useToastCtx = () => useContext(ToastContext)

function ToastContainer({ toasts, remove }) {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="animate-slide-up pointer-events-auto flex items-center gap-3 bg-navy text-white rounded-xl px-5 py-3.5 shadow-lg text-sm font-semibold max-w-xs cursor-pointer"
          onClick={() => remove(t.id)}
        >
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}

// src/main.jsx
// Entry point — mounts the React app into #root

import { StrictMode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { createRoot }  from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </StrictMode>
)
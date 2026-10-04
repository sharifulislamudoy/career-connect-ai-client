// src/main.jsx
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { router } from './router/routes'
import { RouterProvider } from 'react-router/dom'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { Toaster } from 'react-hot-toast'
import { initializePwa } from './lib/pwa'

initializePwa()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <Suspense fallback={<div role="status" className="min-h-[60vh] flex items-center justify-center text-sm text-gray-500">Opening your workspace…</div>}><RouterProvider router={router} /></Suspense>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: 'green',
                  secondary: 'black',
                },
              },
              error: {
                duration: 4000,
                theme: {
                  primary: 'red',
                  secondary: 'black',
                },
              },
            }}
          />
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  </StrictMode>,
)

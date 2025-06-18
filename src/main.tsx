import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { NotificationProvider } from './contexts/NotificationContext'
import App from './App'
import './styles/globals.css'

const Root = () => {
  const [darkMode, setDarkMode] = useState(() => {
    // Vérifier la préférence système ou utiliser le thème sombre par défaut
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        return savedTheme === 'dark'
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return true
  })

  // Appliquer le thème au chargement
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <React.StrictMode>
      <NotificationProvider>
        <App darkMode={darkMode} onDarkModeChange={setDarkMode} />
      </NotificationProvider>
    </React.StrictMode>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<Root />);

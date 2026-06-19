import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './context/AuthContext'   // ✅ Import AuthProvider
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>          {/* ✅ Wrap App */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
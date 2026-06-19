import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './context/AuthContext'   // ✅ import AuthProvider
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>    {/* ✅ Wrap App with AuthProvider */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
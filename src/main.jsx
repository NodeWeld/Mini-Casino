import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { BalanceProvider } from './hooks/useBalance.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <BalanceProvider>
        <App />
      </BalanceProvider>
    </BrowserRouter>
  </React.StrictMode>
)

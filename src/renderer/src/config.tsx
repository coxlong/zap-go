import { createRoot } from 'react-dom/client'
import { ConfigWindow } from './components/ConfigWindow'
import './assets/main.css'
import { StrictMode } from 'react'

createRoot(document.getElementById('config-root')!).render(
  <StrictMode>
    <ConfigWindow
      onClose={() => {
        window.close()
      }}
    />
  </StrictMode>
)

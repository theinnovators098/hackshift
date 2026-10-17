import './styles/global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppStoreProvider } from './store/AppStore'
import { MillisaProvider } from './millisa/MillisaProvider'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppStoreProvider>
        <MillisaProvider>
          <App />
        </MillisaProvider>
      </AppStoreProvider>
    </BrowserRouter>
  </StrictMode>,
)

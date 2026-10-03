import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { App } from './studio/App'

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)

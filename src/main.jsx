import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'
import App from './App'
import { ToastProvider } from './components/ToastContext'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

window.i18n = i18n;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then(reg => console.log('Service Worker registered:', reg))
            .catch(err => console.error('SW registration failed:', err))
    })
}

registerSW()

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
    <I18nextProvider i18n={i18n}>
        <React.StrictMode>
            <BrowserRouter>
                <ToastProvider>
                    <App />
                </ToastProvider>
            </BrowserRouter>
        </React.StrictMode>
    </I18nextProvider>
)


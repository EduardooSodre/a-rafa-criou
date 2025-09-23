'use client'

import { useState, useEffect } from 'react'
import { Toast } from '@/components/ui/toast'

interface ToastData {
    id: string
    message: string
    type: 'success' | 'error' | 'info'
}

export default function ToastProvider() {
    const [toasts, setToasts] = useState<ToastData[]>([])

    useEffect(() => {
        const handleShowToast = (event: CustomEvent) => {
            const { message, type } = event.detail
            const id = Math.random().toString(36).substr(2, 9)

            setToasts(prev => [...prev, { id, message, type }])
        }

        window.addEventListener('show-toast', handleShowToast as EventListener)

        return () => {
            window.removeEventListener('show-toast', handleShowToast as EventListener)
        }
    }, [])

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }

    return (
        <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
            {toasts.map((toast, index) => (
                <div
                    key={toast.id}
                    style={{ top: `${index * 80}px` }}
                    className="relative"
                >
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                </div>
            ))}
        </div>
    )
}
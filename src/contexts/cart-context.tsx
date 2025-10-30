'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface CartItem {
    id: string
    productId: string
    variationId: string
    name: string
    price: number
    variationName: string
    image: string
    quantity: number
    attributes?: { name: string; value: string }[]
}

interface CartContextType {
    items: CartItem[]
    totalItems: number
    totalPrice: number
    addItem: (item: Omit<CartItem, 'quantity'>) => void
    removeItem: (id: string) => void
    updateItem: (id: string, updates: Partial<Omit<CartItem, 'id' | 'productId' | 'quantity'>>) => void
    clearCart: () => void
    cartSheetOpen: boolean
    setCartSheetOpen: (open: boolean) => void
    openCartSheet: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [isHydrated, setIsHydrated] = useState(false)
    const [cartSheetOpen, setCartSheetOpen] = useState(false)
    const openCartSheet = () => setCartSheetOpen(true)

    // Hidratar carrinho do localStorage apenas no cliente
    useEffect(() => {
        setIsHydrated(true)
        const savedCart = localStorage.getItem('cart')
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart))
            } catch {
                // Silenciosamente resetar carrinho se houver dados corrompidos
                setItems([])
            }
        }
    }, [])

    // Salvar carrinho no localStorage sempre que mudar (apenas após hidratação)
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem('cart', JSON.stringify(items))
        }
    }, [items, isHydrated])

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
        setItems(current => {
            const existingItem = current.find(item =>
                item.productId === newItem.productId && item.variationId === newItem.variationId
            )
            if (existingItem) {
                // Se já existe, não adiciona novamente
                return current
            } else {
                // Se não existe, adiciona novo item com quantidade 1
                return [...current, { ...newItem, quantity: 1 }]
            }
        })
    }

    const removeItem = (id: string) => {
        setItems(current => current.filter(item => item.id !== id))
    }


    const updateItem = (id: string, updates: Partial<Omit<CartItem, 'id' | 'productId' | 'quantity'>>) => {
        setItems(current =>
            current.map(item =>
                item.id === id ? { ...item, ...updates } : item
            )
        )
    }

    const clearCart = () => {
        setItems([])
    }

    return (
        <CartContext.Provider value={{
            items,
            totalItems,
            totalPrice,
            addItem,
            removeItem,
            updateItem,
            clearCart,
            cartSheetOpen,
            setCartSheetOpen,
            openCartSheet
        }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error('useCart deve ser usado dentro de um CartProvider')
    }
    return context
}
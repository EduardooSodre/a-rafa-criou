'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/contexts/cart-context'
import { LanguageSelector } from './header/LanguageSelector'
import { MobileHeader } from './header/MobileHeader'
import { DesktopHeader } from './header/DesktopHeader'
import { DesktopNavigation } from './header/DesktopNavigation'
import { PromotionalBanner } from './header/PromotionalBanner'

export function Header() {
    const [selectedLanguage, setSelectedLanguage] = useState('Portuguese')
    const [isScrolled, setIsScrolled] = useState(false)
    const { totalItems } = useCart()

    useEffect(() => {
        // Só executar no lado do cliente
        if (typeof window === 'undefined') return

        let ticking = false
        let lastScrollY = window.scrollY

        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollTop = window.scrollY
                    
                    // Só atualizar se houver uma diferença significativa no scroll
                    if (Math.abs(scrollTop - lastScrollY) < 10) {
                        ticking = false
                        return
                    }

                    // Hysteresis mais robusto: thresholds maiores para evitar loop
                    if (!isScrolled && scrollTop > 200) {
                        setIsScrolled(true)
                    } else if (isScrolled && scrollTop < 100) {
                        setIsScrolled(false)
                    }

                    lastScrollY = scrollTop
                    ticking = false
                })
                ticking = true
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [isScrolled])

    return (
        <header className="sticky top-0 z-50 w-full">
            {/* Barra superior de idiomas */}
            <LanguageSelector 
                selectedLanguage={selectedLanguage}
                setSelectedLanguage={setSelectedLanguage}
                isScrolled={isScrolled}
            />

            {/* Headers Mobile e Desktop */}
            <MobileHeader />
            <DesktopHeader totalItems={totalItems} />

            {/* Menu de navegação desktop */}
            <DesktopNavigation />

            {/* Barra promocional */}
            <PromotionalBanner isScrolled={isScrolled} />
        </header>
    )
}
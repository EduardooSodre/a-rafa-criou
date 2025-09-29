'use client'

import { useTranslation } from 'react-i18next'

interface PromotionalBannerProps {
    isScrolled: boolean
}

export function PromotionalBanner({ isScrolled }: PromotionalBannerProps) {
    const { t } = useTranslation('common')
    const promo = t('header.promo', 'USE O CUPOM "PRIMEIRACOMPRA" PARA TER 10% DE DESCONTO NA SUA PRIMEIRA COMPRA! ✨')

    return (
        <div className={`bg-[#FD9555] transition-all duration-500 ease-in-out overflow-hidden ${isScrolled ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'}`}>
            <div className="animate-marquee whitespace-nowrap py-2">
                <span className="text-white font-medium text-xs lg:text-sm px-4">{promo}</span>
                <span className="text-white font-medium text-xs lg:text-sm px-4">{promo}</span>
                <span className="text-white font-medium text-xs lg:text-sm px-4">{promo}</span>
            </div>
        </div>
    )
}
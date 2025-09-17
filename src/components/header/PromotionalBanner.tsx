'use client'

interface PromotionalBannerProps {
    isScrolled: boolean
}

export function PromotionalBanner({ isScrolled }: PromotionalBannerProps) {
    return (
        <div className={`bg-[#FD9555] transition-all duration-500 ease-in-out overflow-hidden ${isScrolled ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'}`}>
            <div className="animate-marquee whitespace-nowrap py-2">
                <span className="text-white font-medium text-xs lg:text-sm px-4">
                    USE O CUPOM &quot;PRIMEIRACOMPRA&quot; PARA TER 10% DE DESCONTO NA SUA PRIMEIRA COMPRA! ✨
                </span>
                <span className="text-white font-medium text-xs lg:text-sm px-4">
                    USE O CUPOM &quot;PRIMEIRACOMPRA&quot; PARA TER 10% DE DESCONTO NA SUA PRIMEIRA COMPRA! ✨
                </span>
                <span className="text-white font-medium text-xs lg:text-sm px-4">
                    USE O CUPOM &quot;PRIMEIRACOMPRA&quot; PARA TER 10% DE DESCONTO NA SUA PRIMEIRA COMPRA! ✨
                </span>
            </div>
        </div>
    )
}
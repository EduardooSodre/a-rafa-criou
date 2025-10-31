'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Menu, Home, ShoppingCart, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';
import { MobileMegaMenuSheet } from './MobileMegaMenuSheet';
import { MobileCartSheet } from './MobileCartSheet';
import { MobileSearchSheet } from './MobileSearchSheet';
import { useCart } from '@/contexts/cart-context';

interface MobileBottomMenuProps {
    onHomeClick?: () => void;
    className?: string;
}

export default function MobileBottomMenu({
    onHomeClick,
    className
}: MobileBottomMenuProps) {
    const { t } = useTranslation('common');
    const { totalItems, cartSheetOpen, setCartSheetOpen } = useCart();
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const ticking = useRef(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkIfAtBottom = () => {
            if (!ticking.current) {
                window.requestAnimationFrame(() => {
                    const windowHeight = window.innerHeight;
                    const documentHeight = document.documentElement.scrollHeight;
                    const scrollTop = window.scrollY || document.documentElement.scrollTop;

                    // Considera "no final" quando está a 100px ou menos do fim
                    const distanceFromBottom = documentHeight - (scrollTop + windowHeight);
                    setIsAtBottom(distanceFromBottom <= 100);

                    ticking.current = false;
                });
                ticking.current = true;
            }
        };

        // Verificar inicialmente
        checkIfAtBottom();

        window.addEventListener('scroll', checkIfAtBottom, { passive: true });
        window.addEventListener('resize', checkIfAtBottom, { passive: true });

        return () => {
            window.removeEventListener('scroll', checkIfAtBottom);
            window.removeEventListener('resize', checkIfAtBottom);
        };
    }, []);

    // Don't render on admin routes
    if (typeof pathname === 'string' && pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <>
            <MobileMegaMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
            <MobileCartSheet open={cartSheetOpen} onOpenChange={setCartSheetOpen} />
            <MobileSearchSheet open={searchOpen} onOpenChange={setSearchOpen} />

            <div className={cn(
                "fixed bottom-0 left-0 right-0 z-50 bg-[#FD9555] lg:hidden shadow-2xl border-t border-[#FD9555]/20",
                "mx-2 mb-2 rounded-2xl backdrop-blur-sm",
                "transition-transform duration-300 ease-in-out",
                !isAtBottom ? "translate-y-0" : "translate-y-full",
                className
            )}>
                <div className="grid grid-cols-4 h-18 items-center justify-center px-1 py-2">
                    {/* Menu */}
                    <Button
                        variant="ghost"
                        size="lg"
                        className={cn(
                            "flex flex-col items-center justify-center text-white py-3 px-2 h-auto gap-1",
                            "hover:bg-white/10 hover:text-white active:bg-white/20 transition-all duration-200",
                            "focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0 uppercase",
                            "rounded-xl"
                        )}
                        onClick={() => setMenuOpen(true)}
                        aria-label={t('nav.menuAria', 'Abrir menu')}
                    >
                        <Menu className="w-7 h-7" strokeWidth={2} />
                        <span className="text-[10px] font-bold tracking-wide">{t('nav.menu', 'MENU')}</span>
                    </Button>

                    {/* Início */}
                    <Button
                        variant="ghost"
                        size="lg"
                        className={cn(
                            "flex flex-col items-center justify-center text-white py-3 px-2 h-auto gap-1",
                            "hover:bg-white/10 hover:text-white active:bg-white/20 transition-all duration-200",
                            "focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0 uppercase",
                            "rounded-xl"
                        )}
                        onClick={() => onHomeClick ? onHomeClick() : router.push('/')}
                        aria-label={t('nav.home', 'Início')}
                    >
                        <Home className="w-7 h-7" strokeWidth={2} />
                        <span className="text-[10px] font-bold tracking-wide">{t('nav.home', 'INÍCIO')}</span>
                    </Button>

                    {/* Carrinho */}
                    <Button
                        variant="ghost"
                        size="lg"
                        className={cn(
                            "flex flex-col items-center justify-center text-white py-3 px-2 h-auto gap-1 relative",
                            "hover:bg-white/10 hover:text-white active:bg-white/20 transition-all duration-200",
                            "focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0 uppercase",
                            "rounded-xl"
                        )}
                        onClick={() => setCartSheetOpen(true)}
                        aria-label={t('nav.cartAria', `CARRINHO ${totalItems > 0 ? `com ${totalItems} ${totalItems === 1 ? 'item' : 'itens'}` : 'vazio'}`)}
                    >
                        <div className="relative">
                            <ShoppingCart className="w-7 h-7" strokeWidth={2} />
                            {totalItems > 0 && (
                                <div className={cn(
                                    "absolute -top-1 -right-1 bg-white text-[#FD9555] text-[9px] font-black rounded-full",
                                    "min-w-[18px] h-[18px] flex items-center justify-center border-2 border-[#FD9555] uppercase",
                                    "shadow-lg animate-pulse"
                                )}>
                                    {totalItems > 99 ? '99+' : totalItems}
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] font-bold tracking-wide">{t('nav.cart', 'CARRINHO')}</span>
                    </Button>

                    {/* Busca */}
                    <Button
                        variant="ghost"
                        size="lg"
                        className={cn(
                            "flex flex-col items-center justify-center text-white py-3 px-2 h-auto gap-1",
                            "hover:bg-white/10 hover:text-white active:bg-white/20 transition-all duration-200",
                            "focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0",
                            "rounded-xl"
                        )}
                        onClick={() => setSearchOpen(true)}
                        aria-label={t('nav.searchAria', 'Buscar produtos')}
                    >
                        <Search className="w-7 h-7" strokeWidth={2} />
                        <span className="text-[10px] font-bold tracking-wide">{t('nav.search', 'BUSCA')}</span>
                    </Button>
                </div>
            </div>
        </>
    );
}
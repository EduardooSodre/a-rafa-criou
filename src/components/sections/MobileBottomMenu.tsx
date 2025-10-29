'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
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
    const { totalItems } = useCart();
    const [menuOpen, setMenuOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const pathname = usePathname();

    // Don't render on admin routes
    if (typeof pathname === 'string' && pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <>
            <MobileMegaMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
            <MobileCartSheet open={cartOpen} onOpenChange={setCartOpen} />
            <MobileSearchSheet open={searchOpen} onOpenChange={setSearchOpen} />

            <div className={cn(
                "fixed bottom-0 left-0 right-0 z-50 bg-[#FD9555] lg:hidden shadow-2xl border-t border-[#FD9555]/20",
                "mx-2 mb-2 rounded-2xl backdrop-blur-sm",
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
                            "focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0",
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
                            "focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0",
                            "rounded-xl"
                        )}
                        onClick={onHomeClick}
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
                            "focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0",
                            "rounded-xl"
                        )}
                        onClick={() => setCartOpen(true)}
                        aria-label={t('nav.cartAria', `Carrinho ${totalItems > 0 ? `com ${totalItems} ${totalItems === 1 ? 'item' : 'itens'}` : 'vazio'}`)}
                    >
                        <div className="relative">
                            <ShoppingCart className="w-7 h-7" strokeWidth={2} />
                            {totalItems > 0 && (
                                <div className={cn(
                                    "absolute -top-1 -right-1 bg-white text-[#FD9555] text-[9px] font-black rounded-full",
                                    "min-w-[18px] h-[18px] flex items-center justify-center border-2 border-[#FD9555]",
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
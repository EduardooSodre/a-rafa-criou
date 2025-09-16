'use client';

interface MobileBottomMenuProps {
    cartItemCount?: number;
    onMenuClick?: () => void;
    onHomeClick?: () => void;
    onCartClick?: () => void;
    onSearchClick?: () => void;
}

export default function MobileBottomMenu({
    cartItemCount = 0,
    onMenuClick,
    onHomeClick,
    onCartClick,
    onSearchClick
}: MobileBottomMenuProps) {

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#FD9555] md:hidden rounded-3xl mx-3 mb-3 shadow-lg">
            <div className="grid grid-cols-4 h-20 px-2">
                {/* Menu */}
                <button
                    className="flex flex-col items-center justify-center text-white py-2"
                    onClick={onMenuClick}
                >
                    <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
                    </svg>
                    <span className="text-xs font-bold">MENU</span>
                </button>

                {/* Início */}
                <button
                    className="flex flex-col items-center justify-center text-white py-2"
                    onClick={onHomeClick}
                >
                    <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                    </svg>
                    <span className="text-xs font-bold">INÍCIO</span>
                </button>

                {/* Carrinho */}
                <button
                    className="flex flex-col items-center justify-center text-white relative py-2"
                    onClick={onCartClick}
                >
                    <div className="relative">
                        <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.42-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                        {cartItemCount > 0 && (
                            <div className="absolute -top-2 -right-2 bg-white text-[#FD9555] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border border-[#FD9555]">
                                {cartItemCount > 99 ? '99+' : cartItemCount}
                            </div>
                        )}
                    </div>
                    <span className="text-xs font-bold">CARRINHO</span>
                </button>

                {/* Busca */}
                <button
                    className="flex flex-col items-center justify-center text-white py-2"
                    onClick={onSearchClick}
                >
                    <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                    </svg>
                    <span className="text-xs font-bold">BUSCA</span>
                </button>
            </div>
        </div>
    );
}
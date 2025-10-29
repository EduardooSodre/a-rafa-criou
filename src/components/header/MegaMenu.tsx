
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, User, ShoppingBag, Settings, LogOut } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuItem
} from '@/components/ui/dropdown-menu'
import { useTranslation } from 'react-i18next'
import { useSession, signOut } from 'next-auth/react'

interface Subcategory {
    id: string
    name: string
    slug: string
}

interface Category {
    id: string
    name: string
    slug: string
    icon?: string
    subcategories?: Subcategory[]
}

export function MegaMenu() {
    const [categories, setCategories] = useState<Category[]>([]);
    const { t } = useTranslation('common');
    const { data: session, status } = useSession();

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/' });
    };

    useEffect(() => {
        fetch('/api/categories?includeSubcategories=true')
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error('Erro ao buscar categorias:', err));
    }, []);

    const getCategoryIcon = (slug: string) => {
        switch (slug) {
            case 'cartas':
                return '💌';
            case 'diversos':
                return '🎨';
            case 'lembrancinhas':
                return '🎁';
            default:
                return '📦';
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-white hover:text-[#FD9555] transition-colors font-bold px-3 py-2 rounded-md hover:bg-white/10 cursor-pointer uppercase text-base">
                    {t('nav.menu')}
                    <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full mx-auto p-3 md:p-6 bg-[#FD9555] rounded-2xl shadow-2xl grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 md:max-w-2xl xl:max-w-4xl justify-center items-start">
                {/* Coluna 1: Categorias */}
                <DropdownMenuGroup className="bg-white rounded-2xl p-4 flex flex-col items-center min-w-[180px]">
                    <DropdownMenuLabel className="text-lg font-bold text-[#8B4513] mb-3 text-center tracking-wide">
                        {t('menu.categories')}
                    </DropdownMenuLabel>
                    <div className="flex flex-col gap-2 w-full">
                        {categories.map((category) => (
                            <div key={category.id} className="w-full">
                                <DropdownMenuItem asChild>
                                    <Link href={`/produtos?categoria=${category.slug}`} className="flex items-center gap-2 text-gray-700 hover:text-[#FD9555] transition-colors py-2 px-2 rounded-md hover:bg-gray-50 no-underline group w-full text-base font-bold">
                                        <span className="text-xl flex-shrink-0 filter brightness-110">{getCategoryIcon(category.slug)}</span>
                                        <span className="font-bold text-base text-gray-700 group-hover:text-[#FD9555]">{category.name}</span>
                                    </Link>
                                </DropdownMenuItem>
                                {/* Subcategorias */}
                                {category.subcategories && category.subcategories.length > 0 && (
                                    <div className="ml-6 mt-1 space-y-1">
                                        {category.subcategories.map((sub) => (
                                            <DropdownMenuItem asChild key={sub.id}>
                                                <Link href={`/produtos?categoria=${category.slug}&subcategoria=${sub.slug}`} className="block text-xs text-gray-500 hover:text-[#FD9555] transition-colors py-1 px-2 rounded no-underline w-full">
                                                    {sub.name}
                                                </Link>
                                            </DropdownMenuItem>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </DropdownMenuGroup>
                {/* Coluna 2: Minha Conta */}
                <DropdownMenuGroup className="bg-[#FD9555] rounded-2xl p-4 flex flex-col items-center min-w-[180px]">
                    <DropdownMenuLabel className="text-lg font-bold text-white mb-3 text-center flex items-center justify-center gap-2 tracking-wide">
                        <span className="text-xl bg-white rounded-full w-7 h-7 flex items-center justify-center">👤</span>
                        {t('menu.myAccount')}
                    </DropdownMenuLabel>
                    <div className="bg-white rounded-xl p-4 shadow-inner w-full flex items-center justify-center">
                        {status === 'loading' ? (
                            <div className="text-center">
                                <p className="text-gray-600 text-sm">{t('loading')}</p>
                            </div>
                        ) : session ? (
                            <div className="text-center space-y-2 w-full">
                                <div className="flex items-center justify-center gap-2">
                                    <User className="w-5 h-5 text-[#FD9555]" />
                                    <p className="font-semibold text-gray-800">{session.user?.name}</p>
                                </div>
                                <div className="flex flex-col gap-1 mt-2">
                                    <DropdownMenuItem asChild>
                                        <Link href="/conta" className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-[#FD9555] transition-colors py-1 w-full">
                                            <Settings className="w-4 h-4" />
                                            {t('headerDropdown.account')}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/conta/pedidos" className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-[#FD9555] transition-colors py-1 w-full">
                                            <ShoppingBag className="w-4 h-4" />
                                            {t('headerDropdown.orders')}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <button onClick={handleSignOut} className="flex items-center justify-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors mt-2 py-1 w-full">
                                            <LogOut className="w-4 h-4" />
                                            {t('headerDropdown.signOut')}
                                        </button>
                                    </DropdownMenuItem>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="text-gray-600 text-sm mb-2">{t('auth.loginSubtitle')}</p>
                                <DropdownMenuItem asChild>
                                    <Link href="/auth/login" className="inline-block px-4 py-2 bg-[#FD9555] text-white font-bold rounded-lg hover:bg-[#E88544] transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 no-underline text-sm w-full">
                                        {t('auth.login')}
                                    </Link>
                                </DropdownMenuItem>
                            </div>
                        )}
                    </div>
                </DropdownMenuGroup>
                {/* Coluna 3: Úteis */}
                <DropdownMenuGroup className="bg-white rounded-2xl p-4 flex flex-col items-center min-w-[180px]">
                    <DropdownMenuLabel className="text-lg font-bold text-[#8B4513] mb-3 text-center tracking-wide">
                        {t('menu.useful')}
                    </DropdownMenuLabel>
                    <div className="flex flex-col gap-2 w-full">
                        <DropdownMenuItem asChild>
                            <Link href="/direitos-autorais" className="flex items-center gap-2 text-gray-700 hover:text-[#FD9555] transition-colors py-2 px-2 rounded-md hover:bg-gray-50 no-underline group w-full text-base font-bold">
                                <span className="text-xl flex-shrink-0 filter brightness-110">©️</span>
                                <span className="font-bold text-base text-gray-700 leading-tight group-hover:text-[#FD9555]">{t('menu.copyrights')}</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/contato" className="flex items-center gap-2 text-gray-700 hover:text-[#FD9555] transition-colors py-2 px-2 rounded-md hover:bg-gray-50 no-underline group w-full text-base font-bold">
                                <span className="text-xl flex-shrink-0 filter brightness-110">📞</span>
                                <span className="font-bold text-base text-gray-700 leading-tight group-hover:text-[#FD9555]">{t('menu.contact')}</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/perguntas-frequentes" className="flex items-center gap-2 text-gray-700 hover:text-[#FD9555] transition-colors py-2 px-2 rounded-md hover:bg-gray-50 no-underline group w-full text-base font-bold">
                                <span className="text-xl flex-shrink-0 filter brightness-110">❓</span>
                                <span className="font-bold text-base text-gray-700 leading-tight group-hover:text-[#FD9555]">{t('menu.faq')}</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/troca-devolucao" className="flex items-center gap-2 text-gray-700 hover:text-[#FD9555] transition-colors py-2 px-2 rounded-md hover:bg-gray-50 no-underline group w-full text-base font-bold">
                                <span className="text-xl flex-shrink-0 filter brightness-110">🔄</span>
                                <span className="font-bold text-base text-gray-700 leading-tight group-hover:text-[#FD9555]">{t('menu.returns')}</span>
                            </Link>
                        </DropdownMenuItem>
                    </div>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

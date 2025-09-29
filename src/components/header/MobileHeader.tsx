'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, Settings, ShoppingBag } from 'lucide-react'
import { getDisplayName } from '@/lib/utils/user'
import { useTranslation } from 'react-i18next'

interface ExtendedUser {
    id: string
    email: string
    name?: string
    role?: string
    image?: string
}

export function MobileHeader() {
    const { data: session, status } = useSession()
    const { t } = useTranslation('common')

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/' })
    }

    return (
        <div className="bg-[#FED466] py-2 sm:py-3 md:py-4">
            <div className="container mx-auto px-2 sm:px-4">
                <div className="flex items-center justify-between md:hidden">
                    {/* Mobile: User Avatar/Icon - primeiro */}
                    {status === 'loading' ? null : session ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    size="lg"
                                    className="relative transition-all duration-200 ease-out cursor-pointer p-4 rounded-lg"
                                >
                                    <Avatar
                                        imageUrl={(session.user as ExtendedUser)?.image}
                                        name={session.user?.name}
                                        size="lg"
                                        className="w-12 h-12 ring-3 ring-white/40 hover:ring-white/60 hover:scale-105 active:scale-95 transition-all duration-200 drop-shadow-lg"
                                    />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{getDisplayName(session.user?.name)}</p>
                                        <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/conta" className="flex items-center gap-2 no-underline">
                                        <Settings className="w-4 h-4" />
                                        {t('headerDropdown.account', 'Minha Conta')}
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/conta/pedidos" className="flex items-center gap-2 no-underline">
                                        <ShoppingBag className="w-4 h-4" />
                                        {t('headerDropdown.orders', 'Meus Pedidos')}
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleSignOut}
                                    className="flex items-center gap-2 text-red-600 focus:text-red-600"
                                >
                                    <LogOut className="w-4 h-4" />
                                    {t('headerDropdown.signOut', 'Sair')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="p-4 flex flex-col items-center gap-2 min-w-[85px] hover:scale-110 active:scale-95 transition-all duration-200">
                            <Link href="/auth/login" className="no-underline flex flex-col items-center gap-2">
                                <Image
                                    src="/user.png"
                                    alt={t('header.accountIconAlt', 'Ícone de usuário')}
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 text-white drop-shadow-md hover:scale-110 active:scale-95 transition-all duration-200"
                                />
                                <span className="text-xs font-bold text-white tracking-wide drop-shadow-md">{t('header.account', 'CONTA')}</span>
                            </Link>
                        </div>
                    )}

                    {/* Mobile: Logo centralizada */}
                    <Link href="/" className="flex items-center justify-center gap-2 no-underline">
                        <Image
                            src="/logo.webp"
                            alt={t('siteTitle', 'A Rafa Criou - E-commerce de PDFs')}
                            width={200}
                            height={60}
                            className="h-22 sm:h-22 w-auto"
                        />
                    </Link>

                    {/* Mobile: Favoritos Icon */}
                    <div className="p-4 flex flex-col items-center gap-2 min-w-[85px] hover:scale-110 active:scale-95 transition-all duration-200">
                        <Link href="/favoritos" className="no-underline flex flex-col items-center gap-2">
                            <Image
                                src="/favorito.png"
                                alt={t('header.favoritesIconAlt', 'Ícone de favoritos')}
                                width={48}
                                height={48}
                                className="w-8 h-8 text-white drop-shadow-md hover:scale-110 active:scale-95 transition-all duration-200"
                            />
                            <span className="text-xs font-bold text-white tracking-wide drop-shadow-md ">{t('header.favorites', 'FAVORITOS')}</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
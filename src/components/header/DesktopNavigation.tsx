'use client'

import Link from 'next/link'
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
import {
    Home,
    LogOut,
    Settings,
    ShoppingBag,
    Heart,
    CircleUserRound,
} from 'lucide-react'
import { getDisplayName } from '@/lib/utils/user'
import { useTranslation } from 'react-i18next'
import { MegaMenu } from './MegaMenu'

interface ExtendedUser {
    id: string
    email: string
    name?: string
    role?: string
    image?: string
}

export function DesktopNavigation() {
    const { data: session, status } = useSession();
    const { t } = useTranslation('common');
    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/' });
    };
    const navigation = [
        { name: t('nav.home', 'Início'), href: '/', icon: Home },
        { name: t('nav.favorites', 'Favoritos'), href: '/favoritos', icon: Heart },
    ];
    return (
        <div className="bg-[#8FBC8F] shadow-md hidden md:block">
            <div className="container mx-auto px-4">
                <nav className="flex flex-row items-center justify-center py-2 w-full gap-8">
                    <div className="flex items-center gap-6">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="flex items-center gap-2 text-white hover:text-[#FD9555] transition-colors font-bold px-2 py-2 rounded-md hover:bg-white/10 cursor-pointer no-underline uppercase text-base tracking-wide"
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="uppercase text-base font-bold">{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-6">
                        <MegaMenu />
                    </div>
                    <div className="flex items-center gap-6">
                        {/* User menu no menu verde */}
                        {status === 'loading' ? null : session ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="flex items-center gap-2 text-white hover:text-[#FD9555] transition-colors font-bold px-2 py-2 rounded-md hover:bg-white/10 cursor-pointer uppercase text-base">
                                        <Avatar
                                            imageUrl={(session.user as ExtendedUser)?.image}
                                            name={session.user?.name}
                                            size="sm"
                                        />
                                        <span className="uppercase text-base font-bold">{getDisplayName(session.user?.name)}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-base font-bold uppercase">{getDisplayName(session.user?.name)}</p>
                                            <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/conta" className="flex items-center gap-2 no-underline uppercase text-base font-bold">
                                            <Settings className="w-4 h-4" />
                                            {t('account.title')}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/conta/pedidos" className="flex items-center gap-2 no-underline uppercase text-base font-bold">
                                            <ShoppingBag className="w-4 h-4" />
                                            {t('account.orders')}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleSignOut}
                                        className="flex items-center gap-2 text-red-600 focus:text-red-600 uppercase text-base font-bold"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {t('auth.signOut', 'Sair')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="text-base flex items-center gap-2 text-white hover:text-[#FD9555] transition-colors font-bold px-2 py-2 rounded-md hover:bg-white/10 cursor-pointer uppercase">
                                        <CircleUserRound className="w-4 h-4" />
                                        <span className="uppercase text-base font-bold">{t('nav.login')}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem asChild>
                                        <Link href="/auth/login" className="flex items-center gap-2 w-full no-underline uppercase text-base font-bold ">
                                            <LogOut className="w-4 h-4" />
                                            {t('auth.login')}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/auth/register" className="flex items-center gap-2 w-full no-underline uppercase text-base font-bold">
                                            <CircleUserRound className="w-4 h-4" />
                                            {t('nav.register')}
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </nav>
            </div>
        </div>
    );
}
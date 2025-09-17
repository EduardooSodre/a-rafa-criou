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
import { User, Heart, LogOut, Settings, ShoppingBag } from 'lucide-react'
import { getDisplayName } from '@/lib/utils/user'

interface ExtendedUser {
    id: string
    email: string
    name?: string
    role?: string
    image?: string
}

export function MobileHeader() {
    const { data: session, status } = useSession()

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
                                    size="sm"
                                    className="relative  transition-all duration-200  cursor-pointer"
                                >
                                    <Avatar
                                        imageUrl={(session.user as ExtendedUser)?.image}
                                        name={session.user?.name}
                                        size="md"
                                        className="w-10 h-10 ring-2 ring-white/20 hover:ring-white/40 transition-all duration-200"
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
                                        Minha Conta
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/conta/pedidos" className="flex items-center gap-2 no-underline">
                                        <ShoppingBag className="w-4 h-4" />
                                        Meus Pedidos
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleSignOut}
                                    className="flex items-center gap-2 text-red-600 focus:text-red-600"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sair
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button asChild variant="ghost" size="sm" className="hover:bg-white/10 p-6 flex flex-col items-center gap-1">
                            <Link href="/auth/login" className="no-underline">
                                <User className="w-6 h-6 text-white" strokeWidth={2.5} />
                                <span className="text-[10px] font-bold text-white">CONTA</span>
                            </Link>
                        </Button>
                    )}

                    {/* Mobile: Logo centralizada */}
                    <Link href="/" className="flex items-center justify-center gap-2 no-underline">
                        <Image
                            src="/logo.webp"
                            alt="A Rafa Criou"
                            width={200}
                            height={60}
                            className="h-14 sm:h-16 w-auto"
                        />
                    </Link>

                    {/* Mobile: Favoritos Icon */}
                    <Button asChild variant="ghost" size="sm" className="hover:bg-white/10 p-6 flex flex-col items-center gap-1">
                        <Link href="/favoritos" className="no-underline">
                            <Heart className="w-6 h-6 text-white" strokeWidth={2.5} />
                            <span className="text-[10px] font-bold text-white">FAVORITOS</span>
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
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
    Package,
    User,
    LogOut,
    Settings,
    ShoppingBag,
    Heart,
} from 'lucide-react'

export function DesktopNavigation() {
    const { data: session, status } = useSession()

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/' })
    }

    const navigation = [
        { name: 'Início', href: '/', icon: Home },
        { name: 'Menu', href: '/produtos', icon: Package },
        { name: 'Favoritos', href: '/favoritos', icon: Heart },
    ]

    return (
        <div className="bg-[#8FBC8F] shadow-md hidden md:block">
            <div className="container mx-auto px-4">
                <nav className="flex items-center justify-center py-2">
                    <div className="flex items-center gap-8">
                        {navigation.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="flex items-center gap-2 text-white hover:text-white/80 transition-colors font-bold px-4 py-2 rounded-md hover:bg-white/10 cursor-pointer no-underline"
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.name}
                                </Link>
                            )
                        })}

                        {/* User menu no menu verde */}
                        {status === 'loading' ? null : session ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="flex items-center gap-2 text-white hover:text-white/80 transition-colors font-bold px-4 py-2 rounded-md hover:bg-white/10 cursor-pointer">
                                        <User className="w-4 h-4" />
                                        {session.user?.name || 'Usuário'}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium">{session.user?.name}</p>
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
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="text-md flex items-center gap-2 text-white hover:text-white/80 transition-colors font-bold px-4 py-2 rounded-md hover:bg-white/10 cursor-pointer">
                                        <User className="w-4 h-4" />
                                        Login
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem asChild>
                                        <Link href="/auth/login" className="flex items-center gap-2 w-full no-underline ">
                                            <LogOut className="w-4 h-4" />
                                            Entrar
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/auth/register" className="flex items-center gap-2 w-full no-underline">
                                            <User className="w-4 h-4" />
                                            Cadastrar
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </nav>
            </div>
        </div>
    )
}
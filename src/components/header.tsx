'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCart } from '@/contexts/cart-context'
import {
    Search,
    ShoppingCart,
    Menu,
    X,
    Home,
    Package,
    User,
    LogOut,
    Settings,
    ShoppingBag,
    Heart,
    Instagram
} from 'lucide-react'

export function Header() {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const { totalItems } = useCart()
    const { data: session, status } = useSession()

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            window.location.href = `/produtos?search=${encodeURIComponent(searchQuery)}`
        }
    }

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/' })
    }

    const navigation = [
        { name: 'Início', href: '/', icon: Home },
        { name: 'Menu', href: '/produtos', icon: Package },
        { name: 'Favoritos', href: '/favoritos', icon: Heart },
    ]

    return (
        <header className="sticky top-0 z-50 w-full">
            {/* Barra superior de idiomas */}
            <div className="bg-[#FED466] py-2">
                <div className="container mx-auto px-4 flex justify-center items-center">
                    <span className="text-black font-medium mr-4">SELECIONE SEU IDIOMA</span>
                    <div className="flex gap-2">
                        <button className="w-8 h-6 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">
                            BR
                        </button>
                        <button className="w-8 h-6 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                            MX
                        </button>
                        <button className="w-8 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                            US
                        </button>
                    </div>
                </div>
            </div>

            {/* Header principal */}
            <div className="bg-[#FED466] py-4">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-4">
                            <Link href="/" className="flex items-center gap-2">
                                <Image
                                    src="/logo.webp"
                                    alt="A Rafa Criou"
                                    width={200}
                                    height={60}
                                    className="h-12 w-auto"
                                />
                            </Link>

                            {/* Instagram */}
                            <Link
                                href="https://instagram.com/arafacriou"
                                target="_blank"
                                className="bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
                            >
                                <Instagram className="w-5 h-5 text-black" />
                            </Link>
                        </div>

                        {/* Barra de busca central */}
                        <div className="flex-1 max-w-2xl mx-8 hidden md:block">
                            <form onSubmit={handleSearch} className="relative">
                                <Input
                                    type="search"
                                    placeholder="O que você procura?"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-12 pl-4 pr-12 rounded-lg border-0 bg-white text-black placeholder:text-gray-500"
                                />
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="absolute right-1 top-1 h-10 w-10 bg-[#FD9555] hover:bg-[#FD9555]/90 text-white rounded-lg"
                                >
                                    <Search className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>

                        {/* Carrinho e Mobile Menu */}
                        <div className="flex items-center gap-2">
                            <Button asChild variant="ghost" size="lg" className="relative bg-white/20 hover:bg-white/30 rounded-full">
                                <Link href="/carrinho">
                                    <ShoppingCart className="w-6 h-6 text-black" />
                                    {totalItems > 0 && (
                                        <Badge
                                            variant="destructive"
                                            className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs bg-[#FD9555] text-white border-2 border-white rounded-full"
                                        >
                                            {totalItems}
                                        </Badge>
                                    )}
                                </Link>
                            </Button>

                            {/* Mobile Menu Button */}
                            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="sm" className="md:hidden bg-white/20 hover:bg-white/30">
                                        <Menu className="w-5 h-5 text-black" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-72">
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="font-bold text-lg">Menu</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </div>

                                    {/* Mobile Search */}
                                    <div className="mb-6">
                                        <form onSubmit={handleSearch}>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <Input
                                                    type="search"
                                                    placeholder="O que você procura?"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pl-10 pr-4"
                                                />
                                            </div>
                                        </form>
                                    </div>

                                    {/* Mobile Navigation */}
                                    <nav className="space-y-2">
                                        {navigation.map((item) => {
                                            const Icon = item.icon
                                            return (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    className="flex items-center gap-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 p-3 rounded-md transition-colors"
                                                    onClick={() => setIsOpen(false)}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                    {item.name}
                                                </Link>
                                            )
                                        })}
                                    </nav>

                                    {/* Mobile Auth */}
                                    <div className="mt-6 pt-6 border-t">
                                        {session ? (
                                            <div className="space-y-2">
                                                <div className="p-3 bg-gray-50 rounded-md">
                                                    <p className="font-medium text-sm">{session.user?.name}</p>
                                                    <p className="text-xs text-gray-500">{session.user?.email}</p>
                                                </div>
                                                <Button
                                                    onClick={handleSignOut}
                                                    variant="outline"
                                                    className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                                                >
                                                    <LogOut className="w-4 h-4 mr-2" />
                                                    Sair
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Button asChild variant="outline" className="w-full">
                                                    <Link href="/auth/login">Entrar</Link>
                                                </Button>
                                                <Button asChild className="w-full bg-[#FD9555] hover:bg-[#FD9555]/90">
                                                    <Link href="/auth/register">Cadastrar</Link>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu verde */}
            <div className="bg-[#8FBC8F] shadow-md hidden md:block">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center justify-center py-3">
                        <div className="flex items-center gap-8">
                            {navigation.map((item) => {
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className="flex items-center gap-2 text-white hover:text-white/80 transition-colors font-medium px-4 py-2 rounded-md hover:bg-white/10"
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
                                        <Button variant="ghost" className="text-white hover:text-white/80 hover:bg-white/10">
                                            <User className="w-4 h-4 mr-2" />
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
                                            <Link href="/conta" className="flex items-center gap-2">
                                                <Settings className="w-4 h-4" />
                                                Minha Conta
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/conta/pedidos" className="flex items-center gap-2">
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
                                <div className="flex items-center gap-2">
                                    <Button asChild variant="ghost" className="text-white hover:text-white/80 hover:bg-white/10">
                                        <Link href="/auth/login">Entrar</Link>
                                    </Button>
                                    <Button asChild className="bg-[#FD9555] hover:bg-[#FD9555]/90 text-white">
                                        <Link href="/auth/register">Cadastrar</Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </nav>
                </div>
            </div>

            {/* Barra promocional */}
            <div className="bg-[#FD9555] py-2 overflow-hidden">
                <div className="animate-marquee whitespace-nowrap">
                    <span className="text-white font-medium px-4">
                        USE O CUPOM &quot;PRIMEIRACOMPRA&quot; PARA TER 10% DE DESCONTO NA SUA PRIMEIRA COMPRA! ✨
                    </span>
                    <span className="text-white font-medium px-4">
                        USE O CUPOM &quot;PRIMEIRACOMPRA&quot; PARA TER 10% DE DESCONTO NA SUA PRIMEIRA COMPRA! ✨
                    </span>
                    <span className="text-white font-medium px-4">
                        USE O CUPOM &quot;PRIMEIRACOMPRA&quot; PARA TER 10% DE DESCONTO NA SUA PRIMEIRA COMPRA! ✨
                    </span>
                </div>
            </div>
        </header>
    )
}
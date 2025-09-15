'use client'

import { useState } from 'react'
import Link from 'next/link'
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
    Phone,
    LogOut,
    Settings,
    ShoppingBag
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
        { name: 'Produtos', href: '/produtos', icon: Package },
        { name: 'Contato', href: '/contato', icon: Phone },
    ]

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                            <span className="text-black font-bold text-lg">R</span>
                        </div>
                        <span className="font-bold text-xl text-gray-900 hidden sm:block">
                            A Rafa Criou
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Search Bar - Desktop */}
                    <div className="hidden lg:flex flex-1 max-w-md mx-8">
                        <form onSubmit={handleSearch} className="relative w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                type="search"
                                placeholder="Buscar produtos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4"
                            />
                        </form>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-2">
                        {/* Search Button - Mobile */}
                        <Button variant="ghost" size="sm" className="lg:hidden">
                            <Search className="w-5 h-5" />
                        </Button>

                        {/* Cart Button */}
                        <Button asChild variant="ghost" size="sm" className="relative">
                            <Link href="/carrinho">
                                <ShoppingCart className="w-5 h-5" />
                                {totalItems > 0 && (
                                    <Badge
                                        variant="destructive"
                                        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-black hover:bg-secondary"
                                    >
                                        {totalItems > 99 ? '99+' : totalItems}
                                    </Badge>
                                )}
                            </Link>
                        </Button>

                        {/* User Authentication */}
                        {status === 'loading' ? (
                            <Button variant="ghost" size="sm" disabled>
                                <User className="w-5 h-5" />
                            </Button>
                        ) : session ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                                        <User className="w-5 h-5" />
                                        <span className="hidden sm:inline text-sm font-medium">
                                            {session.user?.name || 'Usuário'}
                                        </span>
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
                                <Button asChild variant="ghost" size="sm">
                                    <Link href="/auth/login">Entrar</Link>
                                </Button>
                                <Button asChild size="sm" className="bg-primary hover:bg-secondary text-black">
                                    <Link href="/auth/register">Cadastrar</Link>
                                </Button>
                            </div>
                        )}

                        {/* Mobile Menu */}
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="sm" className="md:hidden">
                                    <Menu className="w-5 h-5" />
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
                                                placeholder="Buscar produtos..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </form>
                                </div>

                                {/* Mobile Navigation */}
                                <nav className="space-y-4">
                                    {navigation.map((item) => {
                                        const Icon = item.icon
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <Icon className="w-5 h-5 text-gray-600" />
                                                <span className="font-medium">{item.name}</span>
                                            </Link>
                                        )
                                    })}

                                    <Link
                                        href="/carrinho"
                                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <div className="relative">
                                            <ShoppingCart className="w-5 h-5 text-gray-600" />
                                            {totalItems > 0 && (
                                                <Badge
                                                    variant="destructive"
                                                    className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs bg-primary text-black"
                                                >
                                                    {totalItems > 9 ? '9+' : totalItems}
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="font-medium">
                                            Carrinho {totalItems > 0 && `(${totalItems})`}
                                        </span>
                                    </Link>

                                    {/* Mobile Authentication Menu */}
                                    {session ? (
                                        <>
                                            <div className="px-3 py-2 border-t mt-4 pt-4">
                                                <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                                                <p className="text-xs text-gray-500">{session.user?.email}</p>
                                            </div>

                                            <Link
                                                href="/conta"
                                                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <Settings className="w-5 h-5 text-gray-600" />
                                                <span className="font-medium">Minha Conta</span>
                                            </Link>

                                            <Link
                                                href="/conta/pedidos"
                                                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <ShoppingBag className="w-5 h-5 text-gray-600" />
                                                <span className="font-medium">Meus Pedidos</span>
                                            </Link>

                                            <button
                                                onClick={() => {
                                                    setIsOpen(false)
                                                    handleSignOut()
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-red-600"
                                            >
                                                <LogOut className="w-5 h-5" />
                                                <span className="font-medium">Sair</span>
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="border-t mt-4 pt-4 space-y-2">
                                                <Link
                                                    href="/auth/login"
                                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border hover:bg-gray-50 transition-colors"
                                                    onClick={() => setIsOpen(false)}
                                                >
                                                    <User className="w-4 h-4" />
                                                    <span className="font-medium">Entrar</span>
                                                </Link>

                                                <Link
                                                    href="/auth/register"
                                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary hover:bg-secondary text-black transition-colors"
                                                    onClick={() => setIsOpen(false)}
                                                >
                                                    <span className="font-medium">Cadastrar</span>
                                                </Link>
                                            </div>
                                        </>
                                    )}
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    )
}
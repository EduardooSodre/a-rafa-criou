'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
    const [searchQuery, setSearchQuery] = useState('')
    const [isScrolled, setIsScrolled] = useState(false)
    const router = useRouter()
    const { totalItems } = useCart()
    const { data: session, status } = useSession()

    useEffect(() => {
        // Só executar no lado do cliente
        if (typeof window === 'undefined') return

        let ticking = false

        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollTop = window.scrollY

                    // Hysteresis: diferentes thresholds para evitar tremor
                    if (!isScrolled && scrollTop > 80) {
                        setIsScrolled(true)
                    } else if (isScrolled && scrollTop < 30) {
                        setIsScrolled(false)
                    }

                    ticking = false
                })
                ticking = true
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [isScrolled])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/produtos?search=${encodeURIComponent(searchQuery)}`)
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
            <div className={`bg-[#FED466] transition-all duration-300 ${isScrolled ? 'h-0 py-0 overflow-hidden opacity-0' : 'py-1 sm:py-2 opacity-100'}`}>
                <div className="container mx-auto px-2 sm:px-4 flex justify-center items-center">
                    <span className="text-black font-medium mr-2 sm:mr-4 text-xs sm:text-sm">SELECIONE SEU IDIOMA</span>
                    <div className="flex gap-1 sm:gap-2">
                        <button className="w-6 h-4 sm:w-8 sm:h-6 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">
                            BR
                        </button>
                        <button className="w-6 h-4 sm:w-8 sm:h-6 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                            MX
                        </button>
                        <button className="w-6 h-4 sm:w-8 sm:h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                            US
                        </button>
                    </div>
                </div>
            </div>

            {/* Header principal */}
            <div className="bg-[#FED466] py-2 sm:py-3 md:py-4">
                <div className="container mx-auto px-2 sm:px-4">
                    <div className="flex items-center justify-between">
                        {/* Mobile: User Icon - primeiro / Desktop: Logo + Espaço */}
                        <div className="flex items-center gap-2 sm:gap-4">
                            {/* Mobile: User Icon */}
                            <Button asChild variant="ghost" size="sm" className="md:hidden hover:bg-white/10 p-6 flex flex-col items-center gap-1">
                                <Link href="/auth/login" className="no-underline">
                                    <User className="w-6 h-6 text-white" strokeWidth={2.5} />
                                    <span className="text-[10px] font-bold text-white">CONTA</span>
                                </Link>
                            </Button>

                            {/* Desktop: Logo */}
                            <Link href="/" className="hidden md:flex items-center gap-2 no-underline">
                                <Image
                                    src="/logo.webp"
                                    alt="A Rafa Criou"
                                    width={200}
                                    height={60}
                                    className="h-14 sm:h-16 md:h-18 w-auto"
                                />
                            </Link>
                        </div>

                        {/* Mobile: Logo - centro / Desktop: Barra de busca */}
                        <div className="flex-1 max-w-md sm:max-w-lg md:max-w-2xl mx-4 sm:mx-6 md:mx-8">
                            {/* Mobile: Logo centralizada */}
                            <Link href="/" className="md:hidden flex items-center justify-center gap-2 no-underline">
                                <Image
                                    src="/logo.webp"
                                    alt="A Rafa Criou"
                                    width={200}
                                    height={60}
                                    className="h-14 sm:h-16 w-auto"
                                />
                            </Link>

                            {/* Desktop: Barra de busca central */}
                            <form onSubmit={handleSearch} className="relative hidden md:block">
                                <Input
                                    type="search"
                                    placeholder="O que você procura?"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-10 md:h-12 pl-4 pr-12 rounded-lg border-0 bg-white text-black placeholder:text-gray-500"
                                />
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="absolute right-1 top-1 h-8 w-8 md:h-10 md:w-10 bg-[#FD9555] hover:bg-[#FD9555]/90 text-white rounded-lg"
                                >
                                    <Search className="w-3 h-3 md:w-4 md:h-4" />
                                </Button>
                            </form>
                        </div>

                        {/* Mobile: Favoritos / Desktop: Carrinho + Instagram */}
                        <div className="flex items-center gap-2">
                            {/* Mobile: Favoritos Icon */}
                            <Button asChild variant="ghost" size="sm" className="md:hidden hover:bg-white/10 p-6 flex flex-col items-center gap-1">
                                <Link href="/favoritos" className="no-underline">
                                    <Heart className="w-6 h-6 text-white" strokeWidth={2.5} />
                                    <span className="text-[10px] font-bold text-white">FAVORITOS</span>
                                </Link>
                            </Button>

                            {/* Carrinho - apenas desktop */}
                            <Button asChild variant="ghost" size="lg" className="relative bg-white/20 hover:bg-white/30 rounded-full p-6 hidden md:flex">
                                <Link href="/carrinho" className="no-underline">
                                    <ShoppingCart className="w-5 h-5 text-black" />
                                    {totalItems > 0 && (
                                        <Badge
                                            variant="destructive"
                                            className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center p-0 text-xs bg-[#FD9555] text-white border-2 border-white rounded-full"
                                        >
                                            {totalItems}
                                        </Badge>
                                    )}
                                </Link>
                            </Button>

                            {/* Instagram - apenas desktop */}
                            <Link
                                href="https://instagram.com/arafacriou"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/20 rounded-full p-3 hover:bg-white/30 transition-colors hidden md:flex no-underline"
                            >
                                <Instagram className="w-5 h-5 text-black" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu verde */}
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

            {/* Barra promocional */}
            <div className={`bg-[#FD9555] overflow-hidden transition-all duration-300 ${isScrolled ? 'h-0 overflow-hidden opacity-0' : 'opacity-100'}`}>
                <div className="animate-marquee whitespace-nowrap">
                    <span className="text-white font-medium text-xs lg:text-sm px-4">
                        USE O CUPOM &quot;PRIMEIRACOMPRA&quot; PARA TER 10% DE DESCONTO NA SUA PRIMEIRA COMPRA! ✨
                    </span>
                    <span className="text-white font-medium text-xs lg:text-sm px-4">
                        USE O CUPOM &quot;PRIMEIRACOMPRA&quot; PARA TER 10% DE DESCONTO NA SUA PRIMEIRA COMPRA! ✨
                    </span>
                    <span className="text-white font-medium text-xs lg:text-sm px-4">
                        USE O CUPOM &quot;PRIMEIRACOMPRA&quot; PARA TER 10% DE DESCONTO NA SUA PRIMEIRA COMPRA! ✨
                    </span>
                </div>
            </div>
        </header>
    )
}
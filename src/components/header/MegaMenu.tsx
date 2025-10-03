'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, User, ShoppingBag, Settings, LogOut } from 'lucide-react'
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
    const [isOpen, setIsOpen] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const { t } = useTranslation('common')
    const { data: session, status } = useSession()

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/' })
    }

    useEffect(() => {
        // Buscar categorias do banco
        fetch('/api/categories?includeSubcategories=true')
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error('Erro ao buscar categorias:', err))
    }, [])

    // Mapeamento de ícones por categoria
    const getCategoryIcon = (slug: string) => {
        switch (slug) {
            case 'cartas':
                return '💌' // Carta de amor/envelope com coração
            case 'diversos':
                return '🎨' // Arte/criatividade para produtos diversos
            case 'lembrancinhas':
                return '🎁' // Presente/lembrancinha
            default:
                return '📦'
        }
    }

    return (
        <div
            className="relative group"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            {/* Botão Menu */}
            <button className="flex items-center gap-2 text-white hover:text-[#FD9555] transition-colors font-bold px-4 py-2 rounded-md hover:bg-white/10 cursor-pointer text-lg">
                Menu
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Mega Menu Dropdown - Com delay para permitir navegação */}
            <div 
                className={`absolute left-1/2 transform -translate-x-1/2 top-full pt-2 z-50 transition-all duration-200 ${
                    isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
                }`}
                style={{ width: '1100px' }}
            >
                <div className="bg-[#FD9555] rounded-3xl shadow-2xl p-5 overflow-hidden">
                    <div className="flex gap-5">
                        {/* Coluna 1: CATEGORIAS */}
                        <div className="bg-white rounded-3xl p-6 flex-shrink-0" style={{ width: '320px' }}>
                            <h3 className="text-xl font-bold text-[#8B4513] mb-5 text-center tracking-wide">
                                CATEGORIAS
                            </h3>
                            <div className="space-y-2">
                                {categories.map((category) => (
                                    <div key={category.id}>
                                        <Link
                                            href={`/produtos?categoria=${category.slug}`}
                                            className="flex items-center gap-3 text-gray-600 hover:text-[#FD9555] transition-colors py-2 px-2 rounded-md hover:bg-gray-50 no-underline group"
                                        >
                                            <span className="text-2xl flex-shrink-0" style={{ filter: 'brightness(1.1)' }}>
                                                {getCategoryIcon(category.slug)}
                                            </span>
                                            <span className="font-medium text-base text-gray-600 group-hover:text-[#FD9555]">
                                                {category.name.toUpperCase()}
                                            </span>
                                        </Link>
                                        {/* Subcategorias */}
                                        {category.subcategories && category.subcategories.length > 0 && (
                                            <div className="ml-8 mt-1 space-y-1">
                                                {category.subcategories.map((sub) => (
                                                    <Link
                                                        key={sub.id}
                                                        href={`/produtos?categoria=${category.slug}&subcategoria=${sub.slug}`}
                                                        className="block text-xs text-gray-500 hover:text-[#FD9555] transition-colors py-1 px-2 rounded no-underline"
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Coluna 2: MINHA CONTA */}
                        <div className="bg-[#FD9555] rounded-3xl p-6 flex flex-col flex-1">
                            <h3 className="text-xl font-bold text-white mb-5 text-center flex items-center justify-center gap-3 tracking-wide">
                                <span className="text-2xl bg-white rounded-full w-9 h-9 flex items-center justify-center">
                                    👤
                                </span>
                                MINHA CONTA
                            </h3>
                            <div className="bg-white rounded-2xl p-8 shadow-inner flex-1 flex items-center justify-center">
                                {status === 'loading' ? (
                                    <div className="text-center">
                                        <p className="text-gray-600 text-sm">Carregando...</p>
                                    </div>
                                ) : session ? (
                                    // Usuário logado: Mostrar informações do usuário
                                    <div className="text-center space-y-3 w-full">
                                        <div className="flex items-center justify-center gap-2">
                                            <User className="w-5 h-5 text-[#FD9555]" />
                                            <p className="font-semibold text-gray-800">{session.user?.name}</p>
                                        </div>
                                        <div className="flex flex-col gap-2 mt-4">
                                            <Link 
                                                href="/conta" 
                                                className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-[#FD9555] transition-colors py-1"
                                            >
                                                <Settings className="w-4 h-4" />
                                                Minha Conta
                                            </Link>
                                            <Link 
                                                href="/conta/pedidos" 
                                                className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-[#FD9555] transition-colors py-1"
                                            >
                                                <ShoppingBag className="w-4 h-4" />
                                                Meus Pedidos
                                            </Link>
                                            <button 
                                                onClick={handleSignOut}
                                                className="flex items-center justify-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors mt-2 py-1"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Sair
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // Usuário não logado: Mostrar prompt de login
                                    <div className="text-center">
                                        <p className="text-gray-600 text-sm mb-4">
                                            Faça login para acessar sua conta
                                        </p>
                                        <Link
                                            href="/auth/login"
                                            className="inline-block px-6 py-2.5 bg-[#FD9555] text-white font-bold rounded-lg hover:bg-[#E88544] transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 no-underline text-sm"
                                        >
                                            {t('auth.login', 'Entrar')}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Coluna 3: ÚTEIS */}
                        <div className="bg-white rounded-3xl p-6 flex-shrink-0" style={{ width: '320px' }}>
                            <h3 className="text-xl font-bold text-[#8B4513] mb-5 text-center tracking-wide">
                                ÚTEIS
                            </h3>
                            <div className="space-y-2">
                                <Link
                                    href="/direitos-autorais"
                                    className="flex items-center gap-3 text-gray-600 hover:text-[#FD9555] transition-colors py-2 px-2 rounded-md hover:bg-gray-50 no-underline group"
                                >
                                    <span className="text-2xl flex-shrink-0" style={{ filter: 'brightness(1.1)' }}>
                                        ©️
                                    </span>
                                    <span className="font-medium text-sm text-gray-600 leading-tight group-hover:text-[#FD9555]">
                                        DIREITOS AUTORAIS
                                    </span>
                                </Link>
                                <Link
                                    href="/contato"
                                    className="flex items-center gap-3 text-gray-600 hover:text-[#FD9555] transition-colors py-2 px-2 rounded-md hover:bg-gray-50 no-underline group"
                                >
                                    <span className="text-2xl flex-shrink-0" style={{ filter: 'brightness(1.1)' }}>
                                        📞
                                    </span>
                                    <span className="font-medium text-sm text-gray-600 leading-tight group-hover:text-[#FD9555]">
                                        CONTATO
                                    </span>
                                </Link>
                                <Link
                                    href="/perguntas-frequentes"
                                    className="flex items-center gap-3 text-gray-600 hover:text-[#FD9555] transition-colors py-2 px-2 rounded-md hover:bg-gray-50 no-underline group"
                                >
                                    <span className="text-2xl flex-shrink-0" style={{ filter: 'brightness(1.1)' }}>
                                        ❓
                                    </span>
                                    <span className="font-medium text-sm text-gray-600 leading-tight group-hover:text-[#FD9555]">
                                        PERGUNTAS<br />FREQUENTES
                                    </span>
                                </Link>
                                <Link
                                    href="/troca-devolucao"
                                    className="flex items-center gap-3 text-gray-600 hover:text-[#FD9555] transition-colors py-2 px-2 rounded-md hover:bg-gray-50 no-underline group"
                                >
                                    <span className="text-2xl flex-shrink-0" style={{ filter: 'brightness(1.1)' }}>
                                        🔄
                                    </span>
                                    <span className="font-medium text-sm text-gray-600 leading-tight group-hover:text-[#FD9555]">
                                        TROCA, DEVOLUÇÃO E<br />REEMBOLSO
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

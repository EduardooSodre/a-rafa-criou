'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSession } from 'next-auth/react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

interface Subcategory {
    id: string
    name: string
    slug: string
}

interface Category {
    id: string
    name: string
    slug: string
    subcategories?: Subcategory[]
}

interface MobileMegaMenuSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function MobileMegaMenuSheet({ open, onOpenChange }: MobileMegaMenuSheetProps) {
    const [categories, setCategories] = useState<Category[]>([])
    const [expandedCategories, setExpandedCategories] = useState<string[]>([])
    const { t } = useTranslation('common')
    const { data: session } = useSession()

    useEffect(() => {
        // Buscar categorias do banco
        fetch('/api/categories?includeSubcategories=true')
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error('Erro ao buscar categorias:', err))
    }, [])

    const getCategoryIcon = (slug: string) => {
        switch (slug) {
            case 'cartas':
                return '💌'
            case 'diversos':
                return '🎨'
            case 'lembrancinhas':
                return '🎁'
            default:
                return '📦'
        }
    }

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        )
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="w-[80vw] p-0 bg-[#FD9555]">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <div className="h-full flex flex-col">
                    {/* Conteúdo scrollable */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Seção CATEGORIAS */}
                        <div className="bg-white rounded-3xl p-5">
                            <h3 className="text-lg font-bold text-[#8B4513] mb-4 text-center tracking-wide">
                                CATEGORIAS
                            </h3>
                            <div className="space-y-1">
                                {categories.map((category) => (
                                    <div key={category.id}>
                                        {/* Categoria principal - clicável para expandir */}
                                        <button
                                            onClick={() => toggleCategory(category.id)}
                                            className={`w-full flex items-center justify-between gap-3 transition-all py-2.5 px-3 rounded-lg ${
                                                expandedCategories.includes(category.id)
                                                    ? 'bg-[#FD9555]/10 text-[#FD9555]'
                                                    : 'text-gray-600 hover:text-[#FD9555] hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl flex-shrink-0" style={{ filter: 'brightness(1.1)' }}>
                                                    {getCategoryIcon(category.slug)}
                                                </span>
                                                <span className={`font-medium text-sm ${
                                                    expandedCategories.includes(category.id) ? 'text-[#FD9555]' : 'text-gray-700'
                                                }`}>
                                                    {category.name.toUpperCase()}
                                                </span>
                                            </div>
                                            {category.subcategories && category.subcategories.length > 0 && (
                                                <ChevronDown
                                                    className={`w-4 h-4 transition-transform ${
                                                        expandedCategories.includes(category.id) 
                                                            ? 'rotate-180 text-[#FD9555]' 
                                                            : 'text-gray-400'
                                                    }`}
                                                />
                                            )}
                                        </button>

                                        {/* Subcategorias expandíveis */}
                                        {category.subcategories && category.subcategories.length > 0 && expandedCategories.includes(category.id) && (
                                            <div className="ml-8 mt-1 space-y-1 mb-2">
                                                {category.subcategories.map((sub) => (
                                                    <Link
                                                        key={sub.id}
                                                        href={`/produtos?categoria=${category.slug}&subcategoria=${sub.slug}`}
                                                        className="block text-xs text-gray-500 hover:text-[#FD9555] hover:bg-gray-50 transition-colors py-2 px-3 rounded no-underline"
                                                        onClick={() => onOpenChange(false)}
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

                        {/* Seção MINHA CONTA */}
                        <div className="bg-white rounded-3xl p-5">
                            <h3 className="text-lg font-bold text-[#8B4513] mb-4 text-center tracking-wide">
                                <span className="text-xl">👤</span> MINHA CONTA
                            </h3>
                            <div className="space-y-2">
                                {session ? (
                                    <>
                                        <div className="mb-3 px-3">
                                            <p className="font-semibold text-gray-800 text-sm">{session.user?.name}</p>
                                        </div>
                                        <Link
                                            href="/conta"
                                            className="flex items-center gap-3 text-gray-600 hover:text-[#FD9555] transition-colors py-2.5 px-3 rounded-lg hover:bg-gray-50 no-underline"
                                            onClick={() => onOpenChange(false)}
                                        >
                                            <User className="w-4 h-4" />
                                            <span className="font-medium text-sm">Minha Conta</span>
                                        </Link>
                                    </>
                                ) : (
                                    <div className="px-3">
                                        <Link
                                            href="/auth/login"
                                            className="block text-center px-6 py-2.5 bg-[#FD9555] text-white font-bold rounded-lg hover:bg-[#E88544] transition-all shadow-md no-underline text-sm"
                                            onClick={() => onOpenChange(false)}
                                        >
                                            {t('auth.login', 'Entrar')}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Seção ÚTEIS */}
                        <div className="bg-white rounded-3xl p-5">
                            <h3 className="text-lg font-bold text-[#8B4513] mb-4 text-center tracking-wide">
                                ÚTEIS
                            </h3>
                            <div className="space-y-1">
                                <Link
                                    href="/direitos-autorais"
                                    className="flex items-center gap-3 text-gray-600 hover:text-[#FD9555] transition-colors py-2.5 px-3 rounded-lg hover:bg-gray-50 no-underline group"
                                    onClick={() => onOpenChange(false)}
                                >
                                    <span className="text-xl flex-shrink-0" style={{ filter: 'brightness(1.1)' }}>
                                        ©️
                                    </span>
                                    <span className="font-medium text-xs text-gray-700 group-hover:text-[#FD9555]">
                                        DIREITOS AUTORAIS
                                    </span>
                                </Link>
                                <Link
                                    href="/contato"
                                    className="flex items-center gap-3 text-gray-600 hover:text-[#FD9555] transition-colors py-2.5 px-3 rounded-lg hover:bg-gray-50 no-underline group"
                                    onClick={() => onOpenChange(false)}
                                >
                                    <span className="text-xl flex-shrink-0" style={{ filter: 'brightness(1.1)' }}>
                                        📞
                                    </span>
                                    <span className="font-medium text-xs text-gray-700 group-hover:text-[#FD9555]">
                                        CONTATO
                                    </span>
                                </Link>
                                <Link
                                    href="/perguntas-frequentes"
                                    className="flex items-center gap-3 text-gray-600 hover:text-[#FD9555] transition-colors py-2.5 px-3 rounded-lg hover:bg-gray-50 no-underline group"
                                    onClick={() => onOpenChange(false)}
                                >
                                    <span className="text-xl flex-shrink-0" style={{ filter: 'brightness(1.1)' }}>
                                        ❓
                                    </span>
                                    <span className="font-medium text-xs text-gray-700 group-hover:text-[#FD9555]">
                                        PERGUNTAS FREQUENTES
                                    </span>
                                </Link>
                                <Link
                                    href="/troca-devolucao"
                                    className="flex items-center gap-3 text-gray-600 hover:text-[#FD9555] transition-colors py-2.5 px-3 rounded-lg hover:bg-gray-50 no-underline group"
                                    onClick={() => onOpenChange(false)}
                                >
                                    <span className="text-xl flex-shrink-0" style={{ filter: 'brightness(1.1)' }}>
                                        🔄
                                    </span>
                                    <span className="font-medium text-xs text-gray-700 group-hover:text-[#FD9555]">
                                        TROCA, DEVOLUÇÃO E REEMBOLSO
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

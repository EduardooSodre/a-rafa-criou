'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import ProductsTable from '@/components/admin/ProductsTable'

export default function ProductsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [search] = useState(searchParams.get('search') || '')
    const [category, setCategory] = useState(searchParams.get('category') || 'all')

    // Auto-aplicar filtros quando mudarem
    useEffect(() => {
        const params = new URLSearchParams()

        if (search) params.set('search', search)
        if (category && category !== 'all') params.set('category', category)

        const queryString = params.toString()
        const newURL = queryString ? `/admin/produtos?${queryString}` : '/admin/produtos'

        router.push(newURL, { scroll: false })
    }, [search, category, router])

    return (
        <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
                    <p className="text-gray-600 mt-1">Gerencie todos os produtos da sua loja</p>
                </div>
                <Link href="/admin/produtos/novo">
                    <Button className="bg-[#FED466] hover:bg-[#FED466]/90 text-black">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Produto
                    </Button>
                </Link>
            </div>

            {/* Products Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Lista de Produtos</CardTitle>
                            <CardDescription>
                                Todos os produtos cadastrados na plataforma
                            </CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">

                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="w-full sm:w-[180px] bg-white border-gray-300 shadow-sm hover:border-gray-400 focus:border-[#FED466] focus:ring-2 focus:ring-[#FED466]/20">
                                    <SelectValue placeholder="Categoria" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                    <SelectItem value="all" className="hover:bg-gray-50 focus:bg-[#FED466]/10">Todas</SelectItem>
                                    <SelectItem value="planner" className="hover:bg-gray-50 focus:bg-[#FED466]/10">Planners</SelectItem>
                                    <SelectItem value="adesivos" className="hover:bg-gray-50 focus:bg-[#FED466]/10">Adesivos</SelectItem>
                                    <SelectItem value="etiquetas" className="hover:bg-gray-50 focus:bg-[#FED466]/10">Etiquetas</SelectItem>
                                    <SelectItem value="agenda" className="hover:bg-gray-50 focus:bg-[#FED466]/10">Agendas</SelectItem>
                                    <SelectItem value="organizacao" className="hover:bg-gray-50 focus:bg-[#FED466]/10">Organização</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ProductsTable
                        search={search}
                        category={category === 'all' ? '' : category}
                    />
                </CardContent>
            </Card>
        </>
    )
}
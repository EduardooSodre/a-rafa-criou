'use client'

import { useState } from 'react'
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
  
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState(searchParams.get('category') || 'all')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))

  // Função para atualizar URL com os parâmetros
  const updateURL = (newSearch: string, newCategory: string, newPage: number = 1) => {
    const params = new URLSearchParams()
    
    if (newSearch) params.set('search', newSearch)
    if (newCategory && newCategory !== 'all') params.set('category', newCategory)
    if (newPage > 1) params.set('page', newPage.toString())

    const queryString = params.toString()
    const newURL = queryString ? `/admin/produtos?${queryString}` : '/admin/produtos'
    
    router.push(newURL, { scroll: false })
  }

  // Aplicar filtros
  const handleApplyFilters = () => {
    setPage(1)
    updateURL(search, category, 1)
  }

  // Limpar filtros
  const handleClearFilters = () => {
    setSearch('')
    setCategory('all')
    setPage(1)
    updateURL('', 'all', 1)
  }

  // Enter no input de busca
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyFilters()
    }
  }

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

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar produtos específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome, descrição ou SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="pl-10"
              />
            </div>
            
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="planner">Planners</SelectItem>
                <SelectItem value="adesivos">Adesivos</SelectItem>
                <SelectItem value="etiquetas">Etiquetas</SelectItem>
                <SelectItem value="agenda">Agendas</SelectItem>
                <SelectItem value="organizacao">Organização</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button onClick={handleApplyFilters} className="bg-[#FED466] hover:bg-[#FED466]/90 text-black">
                Aplicar Filtros
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
          <CardDescription>
            Todos os produtos cadastrados na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductsTable 
            search={search} 
            page={page} 
            category={category === 'all' ? '' : category} 
          />
        </CardContent>
      </Card>
    </>
  )
}
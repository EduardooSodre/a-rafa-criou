'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Edit, Loader2 } from 'lucide-react'

interface ProductData {
    id: string
    name: string
    slug: string
    description?: string
    shortDescription?: string
    price: number
    categoryId?: string
    isActive: boolean
    isFeatured: boolean
    seoTitle?: string
    seoDescription?: string
}

interface Category {
    id: string
    name: string
    slug: string
}

interface EditProductDialogProps {
    product: ProductData
    onSuccess?: () => void
    trigger?: React.ReactNode
}

export default function EditProductDialog({
    product,
    onSuccess,
    trigger
}: EditProductDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [formData, setFormData] = useState<ProductData>({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        price: product.price,
        categoryId: product.categoryId || 'sem-categoria',
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        seoTitle: product.seoTitle || '',
        seoDescription: product.seoDescription || '',
    })

    // Load categories when dialog opens
    useEffect(() => {
        if (open) {
            fetchCategories()
        }
    }, [open])

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/admin/categories')
            if (response.ok) {
                const data = await response.json()
                setCategories(data.categories || [])
            }
        } catch (error) {
            console.error('Erro ao carregar categorias:', error)
        }
    }

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
    }

    const handleNameChange = (name: string) => {
        setFormData(prev => ({
            ...prev,
            name,
            slug: generateSlug(name)
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch(`/api/admin/products/${product.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    slug: formData.slug,
                    description: formData.description || null,
                    shortDescription: formData.shortDescription || null,
                    price: formData.price,
                    categoryId: formData.categoryId === 'sem-categoria' ? null : formData.categoryId,
                    isActive: formData.isActive,
                    isFeatured: formData.isFeatured,
                    seoTitle: formData.seoTitle || null,
                    seoDescription: formData.seoDescription || null,
                }),
            })

            if (!response.ok) {
                throw new Error('Erro ao atualizar produto')
            }

            setOpen(false)
            onSuccess?.()
        } catch (error) {
            console.error('Erro ao atualizar produto:', error)
            alert('Erro ao atualizar produto. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                        <Edit className="h-4 w-4 text-gray-600" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Produto</DialogTitle>
                    <DialogDescription>
                        Atualize as informações do produto &quot;{product.name}&quot;.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informações Básicas */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Informações Básicas</h3>
                        
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome do Produto *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="Nome do produto"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    value={formData.slug}
                                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                    placeholder="slug-do-produto"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="price">Preço *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.price}
                                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Categoria</Label>
                                <Select
                                    value={formData.categoryId}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma categoria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sem-categoria">Sem categoria</SelectItem>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="shortDescription">Descrição Curta</Label>
                            <Textarea
                                id="shortDescription"
                                value={formData.shortDescription}
                                onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                                placeholder="Breve descrição do produto"
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição Completa</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Descrição detalhada do produto"
                                rows={4}
                            />
                        </div>
                    </div>

                    {/* SEO */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">SEO</h3>
                        
                        <div className="space-y-2">
                            <Label htmlFor="seoTitle">Título SEO</Label>
                            <Input
                                id="seoTitle"
                                value={formData.seoTitle}
                                onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                                placeholder="Título para SEO"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="seoDescription">Descrição SEO</Label>
                            <Textarea
                                id="seoDescription"
                                value={formData.seoDescription}
                                onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                                placeholder="Descrição para SEO"
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Configurações */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Configurações</h3>
                        
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label htmlFor="isActive">Produto Ativo</Label>
                                <p className="text-sm text-gray-500">
                                    Produto visível para os clientes
                                </p>
                            </div>
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label htmlFor="isFeatured">Produto em Destaque</Label>
                                <p className="text-sm text-gray-500">
                                    Exibir na seção de produtos em destaque
                                </p>
                            </div>
                            <Switch
                                id="isFeatured"
                                checked={formData.isFeatured}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                'Salvar Alterações'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
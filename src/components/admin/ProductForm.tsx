'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, FileText, Loader2, Plus, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

interface ProductVariation {
    id?: string
    name: string
    price: string
    files: UploadedFile[]
    isActive: boolean
}

interface ProductFormData {
    name: string
    slug: string
    description: string
    basePrice: string
    isActive: boolean
    isFeatured: boolean
    variations: ProductVariation[]
}

interface UploadedFile {
    file: File
    type: 'pdf' | 'image'
    uploading?: boolean
    uploaded?: boolean
    r2Key?: string
    error?: string
}

interface ProductFormProps {
    initialData?: Partial<ProductFormData & { id: string }>
    isEditing?: boolean
    onSuccess?: () => void
}

export default function ProductForm({ initialData, isEditing = false, onSuccess }: ProductFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [formData, setFormData] = useState<ProductFormData>({
        name: initialData?.name || '',
        slug: initialData?.slug || '',
        description: initialData?.description || '',
        basePrice: initialData?.basePrice || '0.00',
        isActive: initialData?.isActive ?? true,
        isFeatured: initialData?.isFeatured ?? false,
        variations: initialData?.variations || [
            {
                name: 'Padrão',
                price: '0.00',
                files: [],
                isActive: true
            }
        ]
    })

    // Gerar slug automaticamente
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
            slug: !isEditing ? generateSlug(name) : prev.slug
        }))
    }

    const handleInputChange = (field: keyof ProductFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    // Funções para gerenciar variações
    const addVariation = () => {
        setFormData(prev => ({
            ...prev,
            variations: [...prev.variations, {
                name: `Variação ${prev.variations.length + 1}`,
                price: prev.basePrice,
                files: [],
                isActive: true
            }]
        }))
    }

    const removeVariation = (index: number) => {
        if (formData.variations.length > 1) {
            setFormData(prev => ({
                ...prev,
                variations: prev.variations.filter((_, i) => i !== index)
            }))
        }
    }

    const updateVariation = (index: number, field: keyof ProductVariation, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            variations: prev.variations.map((variation, i) =>
                i === index ? { ...variation, [field]: value } : variation
            )
        }))
    }

    // Upload de arquivos para variação específica
    const handleFileUpload = async (variationIndex: number, files: FileList) => {
        const validFiles = Array.from(files).filter(file => {
            const isValidType = file.type === 'application/pdf' || file.type.startsWith('image/')
            const isValidSize = file.size <= 50 * 1024 * 1024 // 50MB
            return isValidType && isValidSize
        })

        for (const file of validFiles) {
            const uploadFile: UploadedFile = {
                file,
                type: file.type === 'application/pdf' ? 'pdf' : 'image',
                uploading: true
            }

            // Adicionar arquivo à variação
            setFormData(prev => ({
                ...prev,
                variations: prev.variations.map((variation, i) =>
                    i === variationIndex
                        ? { ...variation, files: [...variation.files, uploadFile] }
                        : variation
                )
            }))

            try {
                const formDataUpload = new FormData()
                formDataUpload.append('file', file)

                const response = await fetch('/api/r2/upload', {
                    method: 'POST',
                    body: formDataUpload,
                })

                if (response.ok) {
                    const result = await response.json()

                    // Atualizar arquivo como uploaded
                    setFormData(prev => ({
                        ...prev,
                        variations: prev.variations.map((variation, i) =>
                            i === variationIndex
                                ? {
                                    ...variation,
                                    files: variation.files.map(f =>
                                        f.file === file
                                            ? { ...f, uploading: false, uploaded: true, r2Key: result.key }
                                            : f
                                    )
                                }
                                : variation
                        )
                    }))
                } else {
                    throw new Error('Falha no upload')
                }
            } catch {
                // Marcar erro no arquivo
                setFormData(prev => ({
                    ...prev,
                    variations: prev.variations.map((variation, i) =>
                        i === variationIndex
                            ? {
                                ...variation,
                                files: variation.files.map(f =>
                                    f.file === file
                                        ? { ...f, uploading: false, error: 'Erro no upload' }
                                        : f
                                )
                            }
                            : variation
                    )
                }))
            }
        }
    }

    const removeFileFromVariation = (variationIndex: number, fileIndex: number) => {
        setFormData(prev => ({
            ...prev,
            variations: prev.variations.map((variation, i) =>
                i === variationIndex
                    ? { ...variation, files: variation.files.filter((_, fi) => fi !== fileIndex) }
                    : variation
            )
        }))
    }

    // Validação
    const validateForm = () => {
        if (!formData.name.trim()) {
            alert('Nome do produto é obrigatório')
            return false
        }

        if (!formData.description.trim()) {
            alert('Descrição é obrigatória')
            return false
        }

        if (parseFloat(formData.basePrice) < 0) {
            alert('Preço base deve ser maior ou igual a R$ 0,00')
            return false
        }

        // Validar variações
        for (let i = 0; i < formData.variations.length; i++) {
            const variation = formData.variations[i]
            if (!variation.name.trim()) {
                alert(`Nome da variação ${i + 1} é obrigatório`)
                return false
            }
            if (parseFloat(variation.price) <= 0) {
                alert(`Preço da variação ${i + 1} deve ser maior que R$ 0,00`)
                return false
            }
            if (variation.files.length === 0) {
                alert(`Variação ${i + 1} deve ter pelo menos um arquivo`)
                return false
            }
        }

        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setIsSubmitting(true)

        try {
            const productData = {
                name: formData.name,
                slug: formData.slug,
                description: formData.description,
                price: parseFloat(formData.basePrice),
                isActive: formData.isActive,
                isFeatured: formData.isFeatured,
                variations: formData.variations.map(variation => ({
                    name: variation.name,
                    price: parseFloat(variation.price),
                    isActive: variation.isActive,
                    files: variation.files
                        .filter(f => f.uploaded)
                        .map(f => ({
                            filename: f.file.name,
                            originalName: f.file.name,
                            fileSize: f.file.size,
                            mimeType: f.file.type,
                            r2Key: f.r2Key
                        }))
                }))
            }

            const url = isEditing ? `/api/admin/products/${initialData?.id}` : '/api/admin/products'
            const method = isEditing ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData),
            })

            if (!response.ok) {
                throw new Error('Erro ao salvar produto')
            }

            if (onSuccess) {
                onSuccess()
                alert('Produto salvo com sucesso!')
            } else {
                router.push('/admin/produtos')
            }
        } catch {
            alert('Erro ao salvar produto')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informações Básicas */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Informações do Produto
                        </CardTitle>
                        <CardDescription>
                            Dados básicos do produto
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name">Nome do Produto *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="Ex: Planner 2024 Digital"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="slug">Slug (URL)</Label>
                                <Input
                                    id="slug"
                                    value={formData.slug}
                                    onChange={(e) => handleInputChange('slug', e.target.value)}
                                    placeholder="planner-2024-digital"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description">Descrição *</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Descreva o produto..."
                                rows={4}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="basePrice">Preço Base (R$)</Label>
                                <Input
                                    id="basePrice"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.basePrice}
                                    onChange={(e) => handleInputChange('basePrice', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isActive"
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                                    />
                                    <Label htmlFor="isActive" className="text-sm">Produto Ativo</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isFeatured"
                                        checked={formData.isFeatured}
                                        onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                                    />
                                    <Label htmlFor="isFeatured" className="text-sm">Produto em Destaque</Label>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Variações */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Variações do Produto</CardTitle>
                                <CardDescription>
                                    Crie diferentes versões do produto com preços e arquivos específicos
                                </CardDescription>
                            </div>
                            <Button type="button" onClick={addVariation} variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Nova Variação
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {formData.variations.map((variation, index) => (
                            <Card key={index} className="border-l-4 border-l-blue-500">
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg">
                                            Variação {index + 1}
                                            {!variation.isActive && (
                                                <Badge variant="secondary" className="ml-2">Inativa</Badge>
                                            )}
                                        </CardTitle>
                                        {formData.variations.length > 1 && (
                                            <Button
                                                type="button"
                                                onClick={() => removeVariation(index)}
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
                                        <div className="lg:col-span-2">
                                            <Label>Nome da Variação</Label>
                                            <Input
                                                value={variation.name}
                                                onChange={(e) => updateVariation(index, 'name', e.target.value)}
                                                placeholder="Ex: PDF Simples"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>Preço (R$)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={variation.price}
                                                onChange={(e) => updateVariation(index, 'price', e.target.value)}
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={variation.isActive}
                                                onCheckedChange={(checked) => updateVariation(index, 'isActive', checked)}
                                            />
                                            <Label className="text-sm">Ativa</Label>
                                        </div>
                                    </div>

                                    {/* Upload de Arquivos */}
                                    <div>
                                        <Label>Arquivos da Variação *</Label>
                                        <div className="mt-2">
                                            <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer">
                                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                <span className="mt-2 block text-sm font-medium text-gray-900">
                                                    Clique para fazer upload ou arraste arquivos aqui
                                                </span>
                                                <span className="mt-1 block text-xs text-gray-500">
                                                    PDF, PNG, JPG até 50MB cada
                                                </span>
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept=".pdf,image/*"
                                                    onChange={(e) => e.target.files && handleFileUpload(index, e.target.files)}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>

                                        {/* Lista de Arquivos */}
                                        {variation.files.length > 0 && (
                                            <div className="mt-4 space-y-2">
                                                {variation.files.map((file, fileIndex) => (
                                                    <div key={fileIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <div className="flex items-center space-x-3">
                                                            <FileText className="w-5 h-5 text-gray-400" />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {file.file.name}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            {file.uploading && (
                                                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                                            )}
                                                            {file.uploaded && (
                                                                <Badge variant="default" className="bg-green-500">
                                                                    Uploaded
                                                                </Badge>
                                                            )}
                                                            {file.error && (
                                                                <Badge variant="destructive">
                                                                    Erro
                                                                </Badge>
                                                            )}
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeFileFromVariation(index, fileIndex)}
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </CardContent>
                </Card>

                {/* Botões de Ação */}
                <div className="flex justify-end space-x-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onSuccess ? onSuccess() : router.push('/admin/produtos')}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            isEditing ? 'Atualizar Produto' : 'Criar Produto'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
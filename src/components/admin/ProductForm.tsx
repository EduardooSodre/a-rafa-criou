'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, FileText, Loader2, Plus, Trash2, Package, FolderPlus, Image as ImageIcon, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Category {
    id: string
    name: string
    slug: string
    description?: string
}

interface UploadedImage {
    file: File
    uploading?: boolean
    uploaded?: boolean
    r2Key?: string
    error?: string
    url?: string
    preview?: string
    alt?: string
    isMain?: boolean
}

interface ProductVariation {
    id?: string
    name: string
    price: string
    files: UploadedFile[]
    images: UploadedImage[]
    mainImageIndex?: number
    isActive: boolean
}

interface ProductFormData {
    name: string
    slug: string
    description: string
    basePrice: string
    categoryId: string
    isActive: boolean
    isFeatured: boolean
    images: UploadedImage[]
    files: UploadedFile[]
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
    const [categories, setCategories] = useState<Category[]>([])
    const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryDescription, setNewCategoryDescription] = useState('')
    const [isCreatingCategory, setIsCreatingCategory] = useState(false)

    const [formData, setFormData] = useState<ProductFormData>({
        name: initialData?.name || '',
        slug: initialData?.slug || '',
        description: initialData?.description || '',
        basePrice: initialData?.basePrice || '0.00',
        categoryId: initialData?.categoryId || '',
        isActive: initialData?.isActive ?? true,
        isFeatured: initialData?.isFeatured ?? false,
        images: initialData?.images || [],
        files: initialData?.files || [],
        variations: initialData?.variations || [
            {
                name: 'Padrão',
                price: '0.00',
                files: [],
                images: [],
                isActive: true
            }
        ]
    })

    // Carregar categorias
    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/admin/categories')
            if (response.ok) {
                const data = await response.json()
                setCategories(data.categories)
            }
        } catch (error) {
            console.error('Erro ao carregar categorias:', error)
        }
    }

    // Criar nova categoria
    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return

        setIsCreatingCategory(true)
        try {
            const response = await fetch('/api/admin/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newCategoryName,
                    description: newCategoryDescription
                })
            })

            if (response.ok) {
                const newCategory = await response.json()
                setCategories(prev => [newCategory, ...prev])
                setFormData(prev => ({ ...prev, categoryId: newCategory.id }))
                setNewCategoryName('')
                setNewCategoryDescription('')
                setIsNewCategoryOpen(false)
            } else {
                alert('Erro ao criar categoria')
            }
        } catch (error) {
            console.error('Erro ao criar categoria:', error)
            alert('Erro ao criar categoria')
        } finally {
            setIsCreatingCategory(false)
        }
    }

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
                images: [],
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

    // Upload de arquivos para o produto principal
    const handleProductFileUpload = async (files: FileList) => {
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

            // Adicionar arquivo ao produto
            setFormData(prev => ({
                ...prev,
                files: [...prev.files, uploadFile]
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
                        files: prev.files.map(f =>
                            f.file === file
                                ? { ...f, uploading: false, uploaded: true, r2Key: result.key }
                                : f
                        )
                    }))
                } else {
                    throw new Error('Falha no upload')
                }
            } catch {
                // Marcar erro no arquivo
                setFormData(prev => ({
                    ...prev,
                    files: prev.files.map(f =>
                        f.file === file
                            ? { ...f, uploading: false, error: 'Erro no upload' }
                            : f
                    )
                }))
            }
        }
    }

    const removeProductFile = (fileIndex: number) => {
        setFormData(prev => ({
            ...prev,
            files: prev.files.filter((_, i) => i !== fileIndex)
        }))
    }

    // Upload de imagens para o produto
    const handleProductImageUpload = async (files: FileList) => {
        const validFiles = Array.from(files).filter(file => {
            const isValidType = file.type.startsWith('image/')
            const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
            return isValidType && isValidSize
        })

        for (const file of validFiles) {
            const uploadImage: UploadedImage = {
                file,
                uploading: true
            }

            // Adicionar imagem ao produto
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, uploadImage]
            }))

            try {
                const formData = new FormData()
                formData.append('file', file)

                const response = await fetch('/api/r2/upload', {
                    method: 'POST',
                    body: formData,
                })

                if (response.ok) {
                    const result = await response.json()
                    
                    // Atualizar imagem como uploaded
                    setFormData(prev => ({
                        ...prev,
                        images: prev.images.map(img => 
                            img.file === file 
                                ? { ...img, uploading: false, uploaded: true, r2Key: result.key, url: result.url }
                                : img
                        )
                    }))
                } else {
                    throw new Error('Falha no upload')
                }
            } catch {
                // Marcar erro na imagem
                setFormData(prev => ({
                    ...prev,
                    images: prev.images.map(img => 
                        img.file === file 
                            ? { ...img, uploading: false, error: 'Erro no upload' }
                            : img
                    )
                }))
            }
        }
    }

    // Upload de imagens para variação específica
    const handleVariationImageUpload = async (variationIndex: number, files: FileList) => {
        const validFiles = Array.from(files).filter(file => {
            const isValidType = file.type.startsWith('image/')
            const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
            return isValidType && isValidSize
        })

        for (const file of validFiles) {
            const uploadImage: UploadedImage = {
                file,
                uploading: true
            }

            // Adicionar imagem à variação
            setFormData(prev => ({
                ...prev,
                variations: prev.variations.map((variation, i) => 
                    i === variationIndex 
                        ? { ...variation, images: [...variation.images, uploadImage] }
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
                    
                    // Atualizar imagem como uploaded
                    setFormData(prev => ({
                        ...prev,
                        variations: prev.variations.map((variation, i) => 
                            i === variationIndex 
                                ? {
                                    ...variation,
                                    images: variation.images.map(img => 
                                        img.file === file 
                                            ? { ...img, uploading: false, uploaded: true, r2Key: result.key, url: result.url }
                                            : img
                                    )
                                }
                                : variation
                        )
                    }))
                } else {
                    throw new Error('Falha no upload')
                }
            } catch {
                // Marcar erro na imagem
                setFormData(prev => ({
                    ...prev,
                    variations: prev.variations.map((variation, i) => 
                        i === variationIndex 
                            ? {
                                ...variation,
                                images: variation.images.map(img => 
                                    img.file === file 
                                        ? { ...img, uploading: false, error: 'Erro no upload' }
                                        : img
                                )
                            }
                            : variation
                    )
                }))
            }
        }
    }

    const removeProductImage = (imageIndex: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== imageIndex)
        }))
    }

    const removeVariationImage = (variationIndex: number, imageIndex: number) => {
        setFormData(prev => ({
            ...prev,
            variations: prev.variations.map((variation, i) => 
                i === variationIndex 
                    ? { ...variation, images: variation.images.filter((_, ii) => ii !== imageIndex) }
                    : variation
            )
        }))
    }

    const setMainProductImage = (imageIndex: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.map((img, i) => ({ ...img, isMain: i === imageIndex }))
        }))
    }

    const setMainVariationImage = (variationIndex: number, imageIndex: number) => {
        setFormData(prev => ({
            ...prev,
            variations: prev.variations.map((variation, i) => 
                i === variationIndex 
                    ? {
                        ...variation,
                        images: variation.images.map((img, ii) => ({ ...img, isMain: ii === imageIndex }))
                    }
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
                categoryId: formData.categoryId || null,
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
                {/* Informações do Produto */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Informações do Produto
                        </CardTitle>
                        <CardDescription>
                            Dados básicos, arquivos e imagens do produto
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Dados Básicos */}
                        <div className="space-y-4">
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

                            {/* Categoria */}
                            <div>
                                <Label>Categoria</Label>
                                <div className="flex gap-2">
                                    <Select
                                        value={formData.categoryId}
                                        onValueChange={(value) => handleInputChange('categoryId', value)}
                                    >
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Selecione uma categoria" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    
                                    <Dialog open={isNewCategoryOpen} onOpenChange={setIsNewCategoryOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="cursor-pointer"
                                                title="Nova categoria"
                                            >
                                                <FolderPlus className="w-4 h-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[600px] lg:max-w-[700px]">
                                            <DialogHeader>
                                                <DialogTitle>Nova Categoria</DialogTitle>
                                                <DialogDescription>
                                                    Crie uma nova categoria para organizar seus produtos
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div>
                                                    <Label htmlFor="categoryName">Nome da Categoria *</Label>
                                                    <Input
                                                        id="categoryName"
                                                        value={newCategoryName}
                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                        placeholder="Ex: Planners"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="categoryDescription">Descrição</Label>
                                                    <Textarea
                                                        id="categoryDescription"
                                                        value={newCategoryDescription}
                                                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                                                        placeholder="Descrição opcional da categoria..."
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setIsNewCategoryOpen(false)}
                                                    className="cursor-pointer"
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={handleCreateCategory}
                                                    disabled={isCreatingCategory || !newCategoryName.trim()}
                                                    className="cursor-pointer"
                                                >
                                                    {isCreatingCategory ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Criando...
                                                        </>
                                                    ) : (
                                                        'Criar Categoria'
                                                    )}
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
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
                        </div>

                        {/* Upload de Arquivos */}
                        <div>
                            <Label>Arquivos do Produto *</Label>
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
                                        onChange={(e) => e.target.files && handleProductFileUpload(e.target.files)}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {/* Lista de Arquivos */}
                            {formData.files.length > 0 && (
                                <div className="mt-4 max-h-64 scroll-rounded space-y-2">
                                    {formData.files.map((file, fileIndex) => (
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
                                                    onClick={() => removeProductFile(fileIndex)}
                                                    className="cursor-pointer"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Upload de Imagens do Produto */}
                        <div>
                            <Label>Imagens do Produto</Label>
                            <div className="mt-2">
                                <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer">
                                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <span className="mt-2 block text-sm font-medium text-gray-900">
                                        Clique para fazer upload ou arraste imagens aqui
                                    </span>
                                    <span className="mt-1 block text-xs text-gray-500">
                                        PNG, JPG, WebP até 10MB cada
                                    </span>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) => e.target.files && handleProductImageUpload(e.target.files)}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {/* Grid de Imagens do Produto */}
                            {formData.images.length > 0 && (
                                <div className="mt-4">
                                    <div className="max-h-80 scroll-rounded grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {formData.images.map((image, imageIndex) => (
                                            <div key={imageIndex} className="relative group">
                                                <div className="aspect-square rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50">
                                                    {image.uploading ? (
                                                        <div className="flex items-center justify-center h-full">
                                                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                                        </div>
                                                    ) : (
                                                        <img
                                                            src={image.url || image.preview}
                                                            alt={image.alt || `Imagem do produto ${imageIndex + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}
                                                </div>
                                                
                                                {/* Controles da Imagem */}
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => setMainProductImage(imageIndex)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Star className={`w-4 h-4 ${image.isMain ? 'text-yellow-500 fill-yellow-500' : 'text-white'}`} />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => removeProductImage(imageIndex)}
                                                            className="cursor-pointer"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Indicador de Imagem Principal */}
                                                {image.isMain && (
                                                    <div className="absolute top-2 left-2">
                                                        <Badge className="bg-yellow-500 text-yellow-900">
                                                            Principal
                                                        </Badge>
                                                    </div>
                                                )}

                                                {/* Status do Upload */}
                                                {image.error && (
                                                    <div className="absolute top-2 right-2">
                                                        <Badge variant="destructive">
                                                            Erro
                                                        </Badge>
                                                    </div>
                                                )}
                                                {image.uploaded && !image.error && (
                                                    <div className="absolute top-2 right-2">
                                                        <Badge className="bg-green-500">
                                                            ✓
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Campo de Alt Text para Imagens */}
                                    <div className="mt-4 space-y-3">
                                        {formData.images.map((image, imageIndex) => (
                                            <div key={imageIndex} className="flex items-center space-x-3">
                                                <div className="w-12 h-12 rounded border overflow-hidden bg-gray-100 flex-shrink-0">
                                                    <img
                                                        src={image.url || image.preview}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <Input
                                                        placeholder="Texto alternativo da imagem"
                                                        value={image.alt || ''}
                                                        onChange={(e) => {
                                                            const updatedFormData = { ...formData };
                                                            updatedFormData.images[imageIndex].alt = e.target.value;
                                                            setFormData(updatedFormData);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
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
                            <Button type="button" onClick={addVariation} variant="outline" size="sm" className="cursor-pointer">
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
                                                className="text-red-600 hover:text-red-700 cursor-pointer"
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
                                            <div className="mt-4 max-h-48 scroll-rounded space-y-2">
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
                                                                className="cursor-pointer"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload de Imagens da Variação */}
                                    <div>
                                        <Label>Imagens da Variação</Label>
                                        <div className="mt-2">
                                            <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer">
                                                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                <span className="mt-2 block text-sm font-medium text-gray-900">
                                                    Clique para fazer upload ou arraste imagens aqui
                                                </span>
                                                <span className="mt-1 block text-xs text-gray-500">
                                                    PNG, JPG, WebP até 10MB cada
                                                </span>
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={(e) => e.target.files && handleVariationImageUpload(index, e.target.files)}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>

                                        {/* Grid de Imagens da Variação */}
                                        {variation.images.length > 0 && (
                                            <div className="mt-4">
                                                <div className="max-h-64 scroll-rounded grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                    {variation.images.map((image, imageIndex) => (
                                                        <div key={imageIndex} className="relative group">
                                                            <div className="aspect-square rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50">
                                                                {image.uploading ? (
                                                                    <div className="flex items-center justify-center h-full">
                                                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                                                    </div>
                                                                ) : (
                                                                    <img
                                                                        src={image.preview}
                                                                        alt={image.alt || `Imagem da variação ${imageIndex + 1}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                )}
                                                            </div>
                                                            
                                                            {/* Controles da Imagem */}
                                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                <div className="flex space-x-2">
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant="secondary"
                                                                        onClick={() => {
                                                                            const updatedFormData = { ...formData };
                                                                            updatedFormData.variations[index].mainImageIndex = imageIndex;
                                                                            setFormData(updatedFormData);
                                                                        }}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <Star className={`w-4 h-4 ${variation.mainImageIndex === imageIndex ? 'text-yellow-500 fill-yellow-500' : 'text-white'}`} />
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => removeVariationImage(index, imageIndex)}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            {/* Indicador de Imagem Principal */}
                                                            {variation.mainImageIndex === imageIndex && (
                                                                <div className="absolute top-2 left-2">
                                                                    <Badge className="bg-yellow-500 text-yellow-900">
                                                                        Principal
                                                                    </Badge>
                                                                </div>
                                                            )}

                                                            {/* Status do Upload */}
                                                            {image.error && (
                                                                <div className="absolute top-2 right-2">
                                                                    <Badge variant="destructive">
                                                                        Erro
                                                                    </Badge>
                                                                </div>
                                                            )}
                                                            {image.uploaded && !image.error && (
                                                                <div className="absolute top-2 right-2">
                                                                    <Badge className="bg-green-500">
                                                                        ✓
                                                                    </Badge>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Campo de Alt Text para Imagens */}
                                                <div className="mt-4 space-y-3">
                                                    {variation.images.map((image, imageIndex) => (
                                                        <div key={imageIndex} className="flex items-center space-x-3">
                                                            <div className="w-12 h-12 rounded border overflow-hidden bg-gray-100 flex-shrink-0">
                                                                <img
                                                                    src={image.preview}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <Input
                                                                    placeholder="Texto alternativo da imagem"
                                                                    value={image.alt || ''}
                                                                    onChange={(e) => {
                                                                        const updatedFormData = { ...formData };
                                                                        updatedFormData.variations[index].images[imageIndex].alt = e.target.value;
                                                                        setFormData(updatedFormData);
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
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
                        className="cursor-pointer"
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
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
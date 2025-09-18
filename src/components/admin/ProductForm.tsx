'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

interface ProductFormData {
    name: string
    slug: string
    description: string
    shortDescription: string
    price: string
    isActive: boolean
    isFeatured: boolean
    seoTitle: string
    seoDescription: string
}

interface UploadedFile {
    file: File
    type: 'pdf'
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
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [errors, setErrors] = useState<Partial<ProductFormData>>({})

    const [formData, setFormData] = useState<ProductFormData>({
        name: initialData?.name || '',
        slug: initialData?.slug || '',
        description: initialData?.description || '',
        shortDescription: initialData?.shortDescription || '',
        price: initialData?.price || '0.00',
        isActive: initialData?.isActive ?? true,
        isFeatured: initialData?.isFeatured ?? false,
        seoTitle: initialData?.seoTitle || '',
        seoDescription: initialData?.seoDescription || '',
    })

    // Gerar slug automaticamente baseado no nome
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
            .replace(/\s+/g, '-') // Substitui espaços por hífens
            .replace(/-+/g, '-') // Remove hífens duplos
            .trim()
    }

    // Atualizar slug quando o nome mudar
    const handleNameChange = (name: string) => {
        setFormData(prev => ({
            ...prev,
            name,
            slug: !isEditing ? generateSlug(name) : prev.slug
        }))
    }

    const handleInputChange = (field: keyof ProductFormData, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
        // Limpar erro do campo
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }))
        }
    }

    const validateForm = (): boolean => {
        const newErrors: Partial<ProductFormData> = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Nome é obrigatório'
        }
        if (!formData.slug.trim()) {
            newErrors.slug = 'Slug é obrigatório'
        }
        if (!formData.price || parseFloat(formData.price) <= 0) {
            newErrors.price = 'Preço deve ser maior que R$ 0,00'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleFileUpload = async (files: FileList) => {
        const fileArray = Array.from(files)

        for (const file of fileArray) {
            if (file.type !== 'application/pdf') {
                alert('Apenas arquivos PDF são permitidos')
                continue
            }

            if (file.size > 100 * 1024 * 1024) { // 100MB
                alert('Arquivo muito grande. Máximo 100MB')
                continue
            }

            const uploadFile: UploadedFile = {
                file,
                type: 'pdf',
                uploading: true
            }

            setUploadedFiles(prev => [...prev, uploadFile])

            try {
                const formDataUpload = new FormData()
                formDataUpload.append('file', file)
                formDataUpload.append('folder', 'products')

                const response = await fetch('/api/r2/upload', {
                    method: 'POST',
                    body: formDataUpload
                })

                if (!response.ok) {
                    throw new Error('Erro no upload')
                }

                const result = await response.json()

                setUploadedFiles(prev =>
                    prev.map(f =>
                        f.file === file
                            ? { ...f, uploading: false, uploaded: true, r2Key: result.key }
                            : f
                    )
                )
            } catch {
                setUploadedFiles(prev =>
                    prev.map(f =>
                        f.file === file
                            ? { ...f, uploading: false, error: 'Erro no upload' }
                            : f
                    )
                )
            }
        }
    }

    const removeFile = (fileToRemove: UploadedFile) => {
        setUploadedFiles(prev => prev.filter(f => f !== fileToRemove))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setIsSubmitting(true)

        try {
            const productData = {
                ...formData,
                price: parseFloat(formData.price), // Converter para number
                files: uploadedFiles
                    .filter(f => f.uploaded)
                    .map(f => ({
                        filename: f.file.name, // Usar 'filename' em vez de 'name'
                        originalName: f.file.name,
                        fileSize: f.file.size, // Usar 'fileSize' em vez de 'size'
                        mimeType: f.file.type
                    }))
            }

            console.log('Sending product data:', productData)

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

            // Chamar callback se fornecido, senão navegar
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
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        {isEditing ? 'Editar Produto' : 'Novo Produto'}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {isEditing ? 'Atualize as informações do produto' : 'Crie um novo produto digital'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Informações Básicas */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informações Básicas</CardTitle>
                        <CardDescription>
                            Configure as informações principais do produto
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome do Produto</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="Digite o nome do produto"
                            />
                            {errors.name && (
                                <p className="text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug (URL)</Label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => handleInputChange('slug', e.target.value)}
                                placeholder="slug-do-produto"
                                disabled={!isEditing}
                            />
                            {errors.slug && (
                                <p className="text-sm text-red-600">{errors.slug}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="shortDescription">Descrição Curta</Label>
                            <Textarea
                                id="shortDescription"
                                value={formData.shortDescription}
                                onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                                placeholder="Breve descrição do produto"
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição Completa</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Descrição detalhada do produto"
                                rows={4}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Preço e Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Preço e Status</CardTitle>
                        <CardDescription>
                            Configure o preço e visibilidade do produto
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="price">Preço (R$)</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.price}
                                onChange={(e) => handleInputChange('price', e.target.value)}
                                placeholder="0.00"
                            />
                            {errors.price && (
                                <p className="text-sm text-red-600">{errors.price}</p>
                            )}
                        </div>

                        <div className="flex items-center space-x-8">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                                />
                                <Label htmlFor="isActive" className="text-sm font-normal">
                                    Produto Ativo
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isFeatured"
                                    checked={formData.isFeatured}
                                    onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                                />
                                <Label htmlFor="isFeatured" className="text-sm font-normal">
                                    Produto em Destaque
                                </Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* SEO */}
                <Card>
                    <CardHeader>
                        <CardTitle>SEO</CardTitle>
                        <CardDescription>
                            Otimize o produto para mecanismos de busca
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="seoTitle">Título SEO</Label>
                            <Input
                                id="seoTitle"
                                value={formData.seoTitle}
                                onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                                placeholder="Título otimizado para SEO"
                                maxLength={60}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="seoDescription">Descrição SEO</Label>
                            <Textarea
                                id="seoDescription"
                                value={formData.seoDescription}
                                onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                                placeholder="Descrição otimizada para SEO"
                                rows={2}
                                maxLength={160}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Upload de Arquivos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Arquivos do Produto</CardTitle>
                        <CardDescription>
                            Faça upload dos arquivos PDF que serão entregues aos clientes
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <input
                                type="file"
                                accept=".pdf"
                                multiple
                                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer flex flex-col items-center space-y-2"
                            >
                                <Upload className="w-12 h-12 text-gray-400" />
                                <span className="text-lg font-medium text-gray-700">
                                    Clique para fazer upload
                                </span>
                                <span className="text-sm text-gray-500">
                                    Apenas arquivos PDF (máximo 100MB cada)
                                </span>
                            </label>
                        </div>

                        {/* Lista de arquivos */}
                        {uploadedFiles.length > 0 && (
                            <div className="space-y-2">
                                <Label>Arquivos Carregados:</Label>
                                {uploadedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <FileText className="w-5 h-5 text-red-600" />
                                            <div>
                                                <p className="font-medium">{file.file.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                            {file.uploading && (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            )}
                                            {file.uploaded && (
                                                <Badge variant="default" className="bg-green-100 text-green-800">
                                                    Enviado
                                                </Badge>
                                            )}
                                            {file.error && (
                                                <Badge variant="destructive">
                                                    {file.error}
                                                </Badge>
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFile(file)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Botões de Ação */}
                <div className="flex items-center justify-end space-x-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || uploadedFiles.some(f => f.uploading)}
                    >
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
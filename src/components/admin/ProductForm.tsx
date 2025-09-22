'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, FileText, Loader2, Plus, Trash2, Package, FolderPlus, Image as ImageIcon, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable'
import {
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Category {
    id: string
    name: string
    slug: string
    description?: string
}

interface UploadedImage {
    id: string // ID único para drag and drop
    file: File
    uploading?: boolean
    uploaded?: boolean
    data?: string // Base64 data
    error?: string
    url?: string
    preview?: string
    alt?: string
    isMain?: boolean
    order: number
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

// Componente para item de imagem arrastável
interface SortableImageItemProps {
    image: UploadedImage
    index: number
    isMain: boolean
    onRemove: () => void
}

function SortableImageItem({ image, index, isMain, onRemove }: SortableImageItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: image.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} className="relative group">
            <div className="aspect-square rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50">
                {image.uploading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <img
                        src={image.url || image.preview}
                        alt={image.alt || `Imagem ${index + 1}`}
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            {/* Handle de drag - área bem visível */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-2 left-2 bg-white/90 hover:bg-white rounded p-2 cursor-grab active:cursor-grabbing shadow-sm border"
                style={{ zIndex: 10 }}
            >
                <GripVertical className="w-4 h-4 text-gray-700" />
            </div>

            {/* Botão de excluir */}
            <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={onRemove}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0 cursor-pointer shadow-sm"
                style={{ zIndex: 10 }}
            >
                <X className="w-4 h-4" />
            </Button>

            {/* Indicador de Imagem Principal */}
            {isMain && (
                <div className="absolute top-2 left-12">
                    <Badge className="bg-yellow-500 text-yellow-900 text-xs">
                        Capa
                    </Badge>
                </div>
            )}

            {/* Indicador de Ordem */}
            <div className="absolute bottom-2 left-2">
                <Badge variant="secondary" className="text-xs">
                    #{index + 1}
                </Badge>
            </div>

            {/* Status do Upload */}
            {image.error && (
                <div className="absolute top-12 right-2">
                    <Badge variant="destructive" className="text-xs">
                        Erro
                    </Badge>
                </div>
            )}
        </div>
    )
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

    // Configuração do DnD Kit
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

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

    // Upload de arquivos para variação específica (apenas armazenar localmente)
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
                uploading: false, // Não fazemos upload imediato
                uploaded: false   // Será marcado como true apenas após salvar o produto
            }

            // Adicionar arquivo à variação (apenas localmente)
            setFormData(prev => ({
                ...prev,
                variations: prev.variations.map((variation, i) =>
                    i === variationIndex
                        ? { ...variation, files: [...variation.files, uploadFile] }
                        : variation
                )
            }))
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
    // Upload de arquivos para o produto principal (apenas armazenar localmente)
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
                uploading: false, // Não fazemos upload imediato
                uploaded: false   // Será marcado como true apenas após salvar o produto
            }

            // Adicionar arquivo ao produto (apenas localmente)
            setFormData(prev => ({
                ...prev,
                files: [...prev.files, uploadFile]
            }))
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
                id: `product-img-${Date.now()}-${Math.random()}`,
                file,
                uploading: true,
                order: formData.images.length
            }

            // Adicionar imagem ao produto
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, uploadImage]
            }))

            try {
                // Converter arquivo para base64
                const base64Data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as string)
                    reader.onerror = reject
                    reader.readAsDataURL(file)
                })

                // Atualizar imagem como uploaded com dados base64
                setFormData(prev => ({
                    ...prev,
                    images: prev.images.map(img =>
                        img.file === file
                            ? { ...img, uploading: false, uploaded: true, data: base64Data, url: base64Data }
                            : img
                    )
                }))
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
                id: `variation-${variationIndex}-img-${Date.now()}-${Math.random()}`,
                file,
                uploading: true,
                order: formData.variations[variationIndex]?.images.length || 0
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
                // Converter arquivo para base64
                const base64Data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as string)
                    reader.onerror = reject
                    reader.readAsDataURL(file)
                })

                // Atualizar imagem como uploaded com dados base64
                setFormData(prev => ({
                    ...prev,
                    variations: prev.variations.map((variation, i) =>
                        i === variationIndex
                            ? {
                                ...variation,
                                images: variation.images.map(img =>
                                    img.file === file
                                        ? { ...img, uploading: false, uploaded: true, data: base64Data, url: base64Data }
                                        : img
                                )
                            }
                            : variation
                    )
                }))
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

    // Funções de Drag and Drop para imagens do produto
    const handleProductImageDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = formData.images.findIndex(img => img.id === active.id)
            const newIndex = formData.images.findIndex(img => img.id === over.id)

            if (oldIndex !== -1 && newIndex !== -1) {
                const reorderedImages = arrayMove(formData.images, oldIndex, newIndex)

                // Atualizar ordens
                const updatedImages = reorderedImages.map((img, index) => ({
                    ...img,
                    order: index,
                    isMain: index === 0 // Primeira imagem sempre é a capa
                }))

                setFormData(prev => ({
                    ...prev,
                    images: updatedImages
                }))
            }
        }
    }

    // Funções de Drag and Drop para imagens das variações
    const handleVariationImageDragEnd = (variationIndex: number) => (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const variation = formData.variations[variationIndex]
            const oldIndex = variation.images.findIndex(img => img.id === active.id)
            const newIndex = variation.images.findIndex(img => img.id === over.id)

            if (oldIndex !== -1 && newIndex !== -1) {
                const reorderedImages = arrayMove(variation.images, oldIndex, newIndex)

                // Atualizar ordens
                const updatedImages = reorderedImages.map((img, index) => ({
                    ...img,
                    order: index
                }))

                setFormData(prev => ({
                    ...prev,
                    variations: prev.variations.map((v, i) =>
                        i === variationIndex
                            ? { ...v, images: updatedImages }
                            : v
                    )
                }))
            }
        }
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
            console.log('=== INÍCIO DO SUBMIT ===')
            console.log('FormData inicial:', {
                mainFiles: formData.files.length,
                variations: formData.variations.map((v, i) => ({
                    index: i,
                    name: v.name,
                    files: v.files.length,
                    filesDetail: v.files.map(f => ({
                        name: f.file?.name || 'no-file',
                        uploaded: f.uploaded,
                        r2Key: f.r2Key,
                        hasFile: !!f.file
                    }))
                }))
            })

            // Fazer upload dos arquivos PDF para o R2 antes de salvar o produto
            const uploadedFiles: { file: UploadedFile; r2Key: string }[] = []

            // Upload dos arquivos do produto principal
            for (const file of formData.files) {
                if (!file.uploaded && !file.error && file.file) {
                    try {
                        const formDataUpload = new FormData()
                        formDataUpload.append('file', file.file)

                        const response = await fetch('/api/r2/upload', {
                            method: 'POST',
                            body: formDataUpload,
                        })

                        if (response.ok) {
                            const result = await response.json()
                            console.log(`Upload response for ${file.file.name}:`, {
                                success: result.success,
                                hasData: !!result.data,
                                hasKey: !!(result.data?.key || result.key)
                            })

                            // Tentar diferentes estruturas de resposta
                            let r2Key = null
                            if (result.data && result.data.key) {
                                r2Key = result.data.key
                            } else if (result.key) {
                                r2Key = result.key
                            }

                            if (r2Key) {
                                uploadedFiles.push({ file, r2Key })
                                console.log(`Successfully stored r2Key: ${r2Key}`)
                            } else {
                                console.error('Upload response missing key in any expected location:', result)
                                throw new Error(`Upload bem-sucedido mas sem chave R2 para ${file.file.name}`)
                            }
                        } else {
                            throw new Error(`Erro no upload do arquivo ${file.file.name}`)
                        }
                    } catch (error) {
                        throw new Error(`Falha no upload do arquivo ${file.file.name}: ${error}`)
                    }
                } else if (file.uploaded && file.r2Key) {
                    // Arquivo já foi uploadado anteriormente
                    uploadedFiles.push({ file, r2Key: file.r2Key })
                }
            }

            // Upload dos arquivos das variações
            const uploadedVariationFiles: { variationIndex: number; file: UploadedFile; r2Key: string }[] = []

            for (let variationIndex = 0; variationIndex < formData.variations.length; variationIndex++) {
                const variation = formData.variations[variationIndex]
                console.log(`Processing variation ${variationIndex} with ${variation.files.length} files`)

                for (let fileIndex = 0; fileIndex < variation.files.length; fileIndex++) {
                    const file = variation.files[fileIndex]
                    console.log(`File ${fileIndex}: uploaded=${file.uploaded}, r2Key=${file.r2Key}, hasFile=${!!file.file}`)

                    if (!file.uploaded && !file.error && file.file) {
                        try {
                            console.log(`Uploading variation file: ${file.file.name}`)
                            const formDataUpload = new FormData()
                            formDataUpload.append('file', file.file)

                            const response = await fetch('/api/r2/upload', {
                                method: 'POST',
                                body: formDataUpload,
                            })

                            if (response.ok) {
                                const result = await response.json()
                                console.log(`Upload response for variation file ${file.file.name}:`, {
                                    success: result.success,
                                    hasData: !!result.data,
                                    hasKey: !!(result.data?.key || result.key)
                                })

                                // Tentar diferentes estruturas de resposta
                                let r2Key = null
                                if (result.data && result.data.key) {
                                    r2Key = result.data.key
                                } else if (result.key) {
                                    r2Key = result.key
                                }

                                if (r2Key) {
                                    uploadedVariationFiles.push({ variationIndex, file, r2Key })
                                    console.log(`Successfully added variation file to uploadedVariationFiles: ${r2Key}`)
                                } else {
                                    console.error('Upload response missing key in any expected location:', result)
                                    throw new Error(`Upload bem-sucedido mas sem chave R2 para ${file.file.name}`)
                                }
                            } else {
                                throw new Error(`Erro no upload do arquivo ${file.file.name}`)
                            }
                        } catch (error) {
                            console.error(`Error uploading variation file ${file.file.name}:`, error)
                            throw new Error(`Falha no upload do arquivo ${file.file.name}: ${error}`)
                        }
                    } else if (file.uploaded && file.r2Key) {
                        // Arquivo já foi uploadado anteriormente
                        console.log(`Using previously uploaded file: ${file.r2Key}`)
                        uploadedVariationFiles.push({ variationIndex, file, r2Key: file.r2Key })
                    } else {
                        console.warn(`Skipping file ${fileIndex} in variation ${variationIndex}: uploaded=${file.uploaded}, r2Key=${file.r2Key}, hasFile=${!!file.file}`)
                    }
                }
            }

            console.log(`Total uploaded variation files: ${uploadedVariationFiles.length}`)

            const productData = {
                name: formData.name,
                slug: formData.slug,
                description: formData.description,
                price: parseFloat(formData.basePrice),
                categoryId: formData.categoryId || null,
                isActive: formData.isActive,
                isFeatured: formData.isFeatured,
                images: formData.images
                    .filter(img => img.uploaded && img.data)
                    .map(img => ({
                        data: img.data!,
                        alt: img.alt || formData.name,
                        isMain: img.isMain || false,
                        order: img.order
                    })),
                files: uploadedFiles
                    .filter(({ r2Key }) => r2Key && r2Key.trim() !== '') // Garantir que r2Key existe
                    .map(({ file, r2Key }) => ({
                        filename: file.file.name,
                        originalName: file.file.name,
                        fileSize: file.file.size,
                        mimeType: file.file.type,
                        r2Key: r2Key
                    })),
                variations: formData.variations.map((variation, index) => {
                    const variationFiles = uploadedVariationFiles
                        .filter(({ variationIndex, r2Key }) => variationIndex === index && r2Key && r2Key.trim() !== '') // Garantir que r2Key existe
                        .map(({ file, r2Key }) => ({
                            filename: file.file.name,
                            originalName: file.file.name,
                            fileSize: file.file.size,
                            mimeType: file.file.type,
                            r2Key: r2Key
                        }))

                    console.log(`Variation ${index} (${variation.name}): ${variationFiles.length} files with r2Key`)
                    variationFiles.forEach((f, i) => console.log(`  File ${i}: ${f.filename} -> ${f.r2Key}`))

                    return {
                        name: variation.name,
                        price: parseFloat(variation.price),
                        isActive: variation.isActive,
                        images: variation.images
                            .filter(img => img.uploaded && img.data)
                            .map(img => ({
                                data: img.data!,
                                alt: img.alt || variation.name,
                                isMain: img.isMain || false,
                                order: img.order
                            })),
                        files: variationFiles
                    }
                })
            }

            // Debug: Log para verificar se todos os arquivos têm r2Key
            console.log('Files to be sent:', productData.files.length)
            console.log('Variation files:', productData.variations.map(v => v.files.length))

            // Log detailed info about all files
            console.log('Product files:', productData.files.map(f => ({ name: f.filename, r2Key: f.r2Key })))
            productData.variations.forEach((v, i) => {
                console.log(`Variation ${i} files:`, v.files.map(f => ({ name: f.filename, r2Key: f.r2Key })))
            })

            // Validação extra antes de enviar
            const allFiles = [
                ...productData.files,
                ...productData.variations.flatMap(v => v.files)
            ]

            const filesWithoutR2Key = allFiles.filter(f => !f.r2Key || f.r2Key.trim() === '')
            if (filesWithoutR2Key.length > 0) {
                console.error('Files without r2Key:', filesWithoutR2Key)
                throw new Error(`Alguns arquivos não têm chave R2 válida: ${filesWithoutR2Key.map(f => f.filename).join(', ')}`)
            }

            const url = isEditing ? `/api/admin/products/${initialData?.id}` : '/api/admin/products'
            const method = isEditing ? 'PUT' : 'POST'

            console.log('=== ENVIANDO PARA API ===')
            console.log('URL:', url)
            console.log('Method:', method)
            console.log('Payload summary:', {
                name: productData.name,
                filesCount: productData.files.length,
                variationsCount: productData.variations.length,
                imagesCount: productData.images.length
            })

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
                throw new Error(`Erro ao salvar produto: ${errorData.error || 'Erro desconhecido'}`)
            }

            if (onSuccess) {
                onSuccess()
                alert('Produto salvo com sucesso!')
            } else {
                router.push('/admin/produtos')
            }
        } catch (error) {
            console.error('Erro completo:', error)
            alert(`Erro ao salvar produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
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
                                    <div className="mb-4">
                                        <Label className="text-sm text-gray-600">
                                            Arraste as imagens para reordenar. A primeira imagem será a capa.
                                        </Label>
                                    </div>

                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleProductImageDragEnd}
                                    >
                                        <SortableContext
                                            items={formData.images.map(img => img.id)}
                                            strategy={rectSortingStrategy}
                                        >
                                            <div className="max-h-80 scroll-rounded grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {formData.images.map((image, imageIndex) => (
                                                    <SortableImageItem
                                                        key={image.id}
                                                        image={image}
                                                        index={imageIndex}
                                                        isMain={imageIndex === 0}
                                                        onRemove={() => removeProductImage(imageIndex)}
                                                    />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </DndContext>
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
                                                <div className="mb-4">
                                                    <Label className="text-sm text-gray-600">
                                                        Arraste as imagens para reordenar. A primeira imagem será a capa.
                                                    </Label>
                                                </div>

                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={handleVariationImageDragEnd(index)}
                                                >
                                                    <SortableContext
                                                        items={variation.images.map(img => img.id)}
                                                        strategy={rectSortingStrategy}
                                                    >
                                                        <div className="max-h-64 scroll-rounded grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                            {variation.images.map((image, imageIndex) => (
                                                                <SortableImageItem
                                                                    key={image.id}
                                                                    image={image}
                                                                    index={imageIndex}
                                                                    isMain={variation.mainImageIndex === imageIndex}
                                                                    onRemove={() => removeVariationImage(index, imageIndex)}
                                                                />
                                                            ))}
                                                        </div>
                                                    </SortableContext>
                                                </DndContext>
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
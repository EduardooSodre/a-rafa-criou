"use client";

import { useState, useEffect, useRef } from 'react'
import { Upload, X, FileText, Loader2, Plus, Trash2, Package, FolderPlus, Image as ImageIcon, GripVertical } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useTranslation } from 'react-i18next'
    const { t } = useTranslation('common')
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
    id: string
    file?: File
    uploading?: boolean
    uploaded?: boolean
    data?: string
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
    idioma?: string
}

interface ProductFormData {
    name: string
    slug: string
    description: string
    categoryId: string
    isActive: boolean
    isFeatured: boolean
    images: UploadedImage[]
    variations: ProductVariation[]
}

interface UploadedFile {
    file?: File
    type: 'pdf' | 'image'
    uploading?: boolean
    uploaded?: boolean
    r2Key?: string
    error?: string
    filename?: string
    originalName?: string
    fileSize?: number
    mimeType?: string
    url?: string // para arquivos já existentes
}

interface EditProductDialogProps {
    product: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

function SortableImageItem({ image, index, isMain, onRemove }: { image: UploadedImage, index: number, isMain: boolean, onRemove: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: image.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group">
            <div className="aspect-square rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50">
                {image.uploading ? (
                    <>
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                        <Image
                            src={image.url || image.preview || '/placeholder.png'}
                            alt={image.alt || `Imagem ${index + 1}`}
                            className="w-full h-full object-cover"
                            width={400}
                            height={400}
                            style={{ objectFit: 'cover' }}
                            unoptimized={true}
                            priority={index === 0}
                        />
                    </>
                ) : (
                    <Image
                        src={image.url || image.preview || '/placeholder.png'}
                        alt={image.alt || `Imagem ${index + 1}`}
                        className="w-full h-full object-cover"
                        width={400}
                        height={400}
                        style={{ objectFit: 'cover' }}
                        unoptimized={true}
                        priority={index === 0}
                    />
                )}
            </div>
            <div
                {...attributes}
                {...listeners}
                className="absolute top-2 left-2 bg-white/90 hover:bg-white rounded p-2 cursor-grab active:cursor-grabbing shadow-sm border"
                style={{ zIndex: 10 }}
            >
                <GripVertical className="w-4 h-4 text-gray-700" />
            </div>
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
            {isMain && (
                <div className="absolute top-2 left-12">
                    <Badge className="bg-yellow-500 text-yellow-900 text-xs">
                        Capa
                    </Badge>
                </div>
            )}
            <div className="absolute bottom-2 left-2">
                <Badge variant="secondary" className="text-xs">
                    #{index + 1}
                </Badge>
            </div>
            {image.error && (
                <div className="absolute top-12 right-2">
                    <Badge variant="destructive" className="text-xs">
                        Erro
                    </Badge>
                </div>
            )}
        </div>
    );
}

export default function EditProductDialog({ product, open, onOpenChange, onSuccess }: EditProductDialogProps) {
    const { t } = useTranslation('common')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryDescription, setNewCategoryDescription] = useState('')
    const [isCreatingCategory, setIsCreatingCategory] = useState(false)

    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        slug: '',
        description: '',
        categoryId: '',
        isActive: true,
        isFeatured: false,
        images: [],
        variations: []
    })

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        if (open && product) {
            loadProductData()
        }
    }, [open, product])

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

    const loadProductData = () => {
        if (!product) return

        const productImages: UploadedImage[] = (product.images || []).map((img: any, index: number) => ({
            id: `existing-product-img-${img.id || index}`,
            uploaded: true,
            url: img.url,
            preview: img.url,
            alt: img.alt,
            isMain: img.isMain,
            order: img.order || index
        }))

        const variations: ProductVariation[] = (product.variations || []).map((variation: any, index: number) => ({
            id: variation.id,
            name: variation.name,
            price: variation.price?.toString() || '0.00',
            isActive: variation.isActive ?? true,
            idioma: variation.idioma || '',
            files: (variation.files || []).map((file: any) => ({
                type: file.mimeType === 'application/pdf' ? 'pdf' : 'image',
                uploaded: true,
                r2Key: file.r2Key,
                filename: file.filename,
                originalName: file.originalName,
                fileSize: file.fileSize,
                mimeType: file.mimeType,
                url: file.url || (file.r2Key ? `/api/r2/download?r2Key=${encodeURIComponent(file.r2Key)}` : undefined)
            })),
            images: (variation.images || []).map((img: any, imgIndex: number) => ({
                id: `existing-variation-${variation.id}-img-${img.id || imgIndex}`,
                uploaded: true,
                url: img.url,
                preview: img.url,
                alt: img.alt,
                isMain: img.isMain,
                order: img.order || imgIndex
            }))
        }))

        setFormData({
            name: product.name || '',
            slug: product.slug || '',
            description: product.description || '',
            categoryId: product.categoryId || '',
            isActive: product.isActive ?? true,
            isFeatured: product.isFeatured ?? false,
            images: productImages,
            variations: variations.length > 0 ? variations : [{
                name: 'Padrão',
                price: '0.00',
                files: [],
                images: [],
                isActive: true
            }]
        })
    }

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

    const handleInputChange = (field: keyof ProductFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const variationRefs = useRef<(HTMLDivElement | null)[]>([]);
    const addVariation = () => {
        setFormData(prev => {
            const newVariations = [
                ...prev.variations,
                {
                    name: `Variação ${prev.variations.length + 1}`,
                    price: '',
                    files: [],
                    images: [],
                    isActive: true,
                    idioma: ''
                }
            ];
            setTimeout(() => {
                const lastIdx = newVariations.length - 1;
                variationRefs.current[lastIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return {
                ...prev,
                variations: newVariations
            };
        });
    }

    const LANGUAGE_OPTIONS = [
        { value: 'portugues', label: 'Português' },
        { value: 'espanhol', label: 'Espanhol' },
        { value: 'escreva', label: 'Escreva sua mensagem' },
    ];

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

    const handleFileUpload = async (variationIndex: number, files: FileList) => {
        const validFiles = Array.from(files).filter(file => {
            const isValidType = file.type === 'application/pdf' || file.type.startsWith('image/')
            const isValidSize = file.size <= 50 * 1024 * 1024
            return isValidType && isValidSize
        })

        for (const file of validFiles) {
            const uploadFile: UploadedFile = {
                file,
                type: file.type === 'application/pdf' ? 'pdf' : 'image',
                uploading: false,
                uploaded: false
            }

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

    const handleProductImageUpload = async (files: FileList) => {
        const validFiles = Array.from(files).filter(file => {
            const isValidType = file.type.startsWith('image/')
            const isValidSize = file.size <= 10 * 1024 * 1024
            return isValidType && isValidSize
        })

        for (const file of validFiles) {
            const uploadImage: UploadedImage = {
                id: `product-img-${Date.now()}-${Math.random()}`,
                file,
                uploading: true,
                order: formData.images.length
            }

            setFormData(prev => ({
                ...prev,
                images: [...prev.images, uploadImage]
            }))

            try {
                const base64Data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as string)
                    reader.onerror = reject
                    reader.readAsDataURL(file)
                })

                setFormData(prev => ({
                    ...prev,
                    images: prev.images.map(img =>
                        img.file === file
                            ? { ...img, uploading: false, uploaded: true, data: base64Data, url: base64Data }
                            : img
                    )
                }))
            } catch {
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

    const handleVariationImageUpload = async (variationIndex: number, files: FileList) => {
        const validFiles = Array.from(files).filter(file => {
            const isValidType = file.type.startsWith('image/')
            const isValidSize = file.size <= 10 * 1024 * 1024
            return isValidType && isValidSize
        })

        for (const file of validFiles) {
            const uploadImage: UploadedImage = {
                id: `variation-${variationIndex}-img-${Date.now()}-${Math.random()}`,
                file,
                uploading: true,
                order: formData.variations[variationIndex]?.images.length || 0
            }

            setFormData(prev => ({
                ...prev,
                variations: prev.variations.map((variation, i) =>
                    i === variationIndex
                        ? { ...variation, images: [...variation.images, uploadImage] }
                        : variation
                )
            }))

            try {
                const base64Data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as string)
                    reader.onerror = reject
                    reader.readAsDataURL(file)
                })

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

    const handleProductImageDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = formData.images.findIndex(img => img.id === active.id)
            const newIndex = formData.images.findIndex(img => img.id === over.id)

            if (oldIndex !== -1 && newIndex !== -1) {
                const reorderedImages = arrayMove(formData.images, oldIndex, newIndex)

                const updatedImages = reorderedImages.map((img, index) => ({
                    ...img,
                    order: index,
                    isMain: index === 0
                }))

                setFormData(prev => ({
                    ...prev,
                    images: updatedImages
                }))
            }
        }
    }

    const handleVariationImageDragEnd = (variationIndex: number) => (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const variation = formData.variations[variationIndex]
            const oldIndex = variation.images.findIndex(img => img.id === active.id)
            const newIndex = variation.images.findIndex(img => img.id === over.id)

            if (oldIndex !== -1 && newIndex !== -1) {
                const reorderedImages = arrayMove(variation.images, oldIndex, newIndex)

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

    const validateForm = () => {
        if (!formData.name.trim()) {
            alert('Nome do produto é obrigatório')
            return false
        }

        if (!formData.description.trim()) {
            alert('Descrição é obrigatória')
            return false
        }

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
            console.log('=== INÍCIO DO SUBMIT (EDIT) ===')

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
                                console.log(`Upload response for variation file ${file.file.name}:`, result)

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
                        console.log(`Using previously uploaded file: ${file.r2Key}`)
                        uploadedVariationFiles.push({ variationIndex, file, r2Key: file.r2Key })
                    } else {
                        console.warn(`Skipping file ${fileIndex} in variation ${variationIndex}: uploaded=${file.uploaded}, r2Key=${file.r2Key}, hasFile=${!!file.file}`)
                    }
                }
            }

            console.log(`Total uploaded variation files: ${uploadedVariationFiles.length}`)

            const variationPrices = formData.variations
                .map(v => {
                    const n = Number(v.price);
                    return isNaN(n) ? undefined : n;
                })
                .filter((p): p is number => typeof p === 'number' && !isNaN(p) && p > 0);
            const minPrice = variationPrices.length > 0 ? Math.min(...variationPrices) : 0;
            const maxPrice = variationPrices.length > 0 ? Math.max(...variationPrices) : 0;
            const safePrice = typeof minPrice === 'number' && !isNaN(minPrice) ? minPrice : 0;

            const productData = {
                name: formData.name,
                slug: formData.slug,
                description: formData.description,
                categoryId: formData.categoryId || null,
                isActive: formData.isActive,
                isFeatured: formData.isFeatured,
                minPrice,
                maxPrice,
                price: safePrice,
                images: formData.images
                    .filter(img => img.uploaded && img.data)
                    .map(img => ({
                        data: img.data!,
                        alt: img.alt || formData.name,
                        isMain: img.isMain || false,
                        order: img.order
                    })),
                variations: formData.variations.map((variation, index) => {
                    const variationFiles = uploadedVariationFiles
                        .filter(({ variationIndex, r2Key }) => variationIndex === index && r2Key && r2Key.trim() !== '')
                        .map(({ file, r2Key }) => ({
                            filename: file.filename || file.file?.name || 'unknown',
                            originalName: file.originalName || file.file?.name || 'unknown',
                            fileSize: file.fileSize || file.file?.size || 0,
                            mimeType: file.mimeType || file.file?.type || 'application/octet-stream',
                            r2Key: r2Key
                        }))
                    return {
                        id: variation.id,
                        name: variation.name,
                        price: variation.price ? Number(variation.price) : 0,
                        isActive: variation.isActive,
                        idioma: variation.idioma,
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
            };

            const allFiles = [
                ...productData.variations.flatMap(v => v.files)
            ]

            const filesWithoutR2Key = allFiles.filter(f => !f.r2Key || f.r2Key.trim() === '')
            if (filesWithoutR2Key.length > 0) {
                console.error('Files without r2Key:', filesWithoutR2Key)
                throw new Error(`Alguns arquivos não têm chave R2 válida: ${filesWithoutR2Key.map(f => f.filename).join(', ')}`)
            }

            console.log('[DEBUG] Valor final de productData.price:', productData.price, typeof productData.price);
            console.log('[DEBUG] productData completo:', productData);

            const url = `/api/admin/products/${product.id}`
            const method = 'PUT'

            console.log('=== ENVIANDO PARA API (EDIT) ===')
            console.log('URL:', url)
            console.log('Method:', method)

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
                throw new Error(`Erro ao atualizar produto: ${errorData.error || 'Erro desconhecido'}`)
            }

            if (onSuccess) {
                onSuccess()
            }
            onOpenChange(false)
            alert('Produto atualizado com sucesso!')
        } catch (error) {
            console.error('Erro completo:', error)
            alert(`Erro ao atualizar produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Produto</DialogTitle>
                    <DialogDescription>
                        Atualize as informações, imagens e variações do produto
                    </DialogDescription>
                </DialogHeader>

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

                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="isActive"
                                            checked={formData.isActive}
                                            onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                                        />
                                        <Label htmlFor="isActive" className="text-sm">{t('admin.productActive', 'Produto Ativo')}</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="isFeatured"
                                            checked={formData.isFeatured}
                                            onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                                        />
                                        <Label htmlFor="isFeatured" className="text-sm">{t('admin.productFeatured', 'Produto em Destaque')}</Label>
                                    </div>
                                </div>
                            </div>

                            {/* Upload de Imagens do Produto */}
                            <div>
                                <Label>Imagens do Produto</Label>
                                <div className="mt-2">
                                    <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer">
                                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <span className="mt-2 block text-sm font-medium text-gray-900">
                                            {t('admin.upload.clickOrDrop', 'Clique para fazer upload ou arraste imagens aqui')}
                                        </span>
                                        <span className="mt-1 block text-xs text-gray-500">
                                            {t('admin.upload.formats', 'PNG, JPG, WebP até 10MB cada')}
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
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="w-5 h-5" />
                                        Variações do Produto
                                    </CardTitle>
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
                                <div
                                    key={variation.id || index}
                                    ref={el => { variationRefs.current[index] = el; }}
                                    className={`border rounded-xl shadow-sm bg-white overflow-hidden transition-all duration-200 hover:shadow-md ${variation.isActive ? 'border-green-200' : 'border-gray-200'}`}
                                >
                                    {/* Header da Variação */}
                                    <div className={`p-4 ${variation.isActive ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-gray-50'} border-b`}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm ${variation.isActive
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-400 text-white'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {variation.name || `Variação ${index + 1}`}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <Badge
                                                            variant={variation.isActive ? "default" : "secondary"}
                                                            className={`text-xs font-medium ${variation.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                                                        >
                                                            {variation.isActive ? 'Ativa' : 'Inativa'}
                                                        </Badge>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-lg font-bold text-green-600">
                                                                R$ {parseFloat(variation.price || '0').toFixed(2).replace('.', ',')}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                                            <FileText className="w-4 h-4" />
                                                            <span>{variation.files?.length || 0} arquivo(s)</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                                            <ImageIcon className="w-4 h-4" />
                                                            <span>{variation.images?.length || 0} imagem(ns)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {formData.variations.length > 1 && (
                                                <Button
                                                    type="button"
                                                    onClick={() => removeVariation(index)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-100 cursor-pointer transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span className="ml-1 text-xs">Remover</span>
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Conteúdo da Variação */}
                                    <div className="p-6 space-y-6">
                                        {/* Informações Básicas */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                <Package className="w-4 h-4" />
                                                Informações Básicas
                                            </h4>
                                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                                <div className="lg:col-span-2">
                                                    <Label className="text-sm font-medium text-gray-700">Nome da Variação *</Label>
                                                    <Input
                                                        value={variation.name}
                                                        onChange={(e) => updateVariation(index, 'name', e.target.value)}
                                                        placeholder="Ex: PDF Premium, Kit Completo"
                                                        className="mt-1 border-gray-300 focus:border-blue-500"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-700">Preço (R$) *</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0.01"
                                                        value={variation.price}
                                                        onChange={(e) => updateVariation(index, 'price', e.target.value)}
                                                        placeholder="0,00"
                                                        className="mt-1 border-gray-300 focus:border-blue-500"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-700">Idioma *</Label>
                                                    <Select
                                                        value={variation.idioma || ''}
                                                        onValueChange={val => updateVariation(index, 'idioma', val)}
                                                    >
                                                        <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500">
                                                            <SelectValue placeholder="Selecione o idioma" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {LANGUAGE_OPTIONS.map(opt => (
                                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {variation.idioma === 'escreva' && (
                                                        <div className="bg-yellow-100 border-l-4 border-yellow-400 p-3 mt-2 rounded text-yellow-900 text-xs">
                                                            Este idioma permite que o cliente escreva uma mensagem personalizada. Certifique-se de configurar corretamente os campos e instruções no produto e na página de detalhes.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                                <div className="flex items-center space-x-3">
                                                    <Switch
                                                        checked={variation.isActive}
                                                        onCheckedChange={(checked) => updateVariation(index, 'isActive', checked)}
                                                        className="data-[state=checked]:bg-green-600"
                                                    />
                                                    <div>
                                                        <Label className="text-sm font-medium text-gray-700">Variação Ativa</Label>
                                                        <p className="text-xs text-gray-500">
                                                            {variation.isActive ? 'Esta variação estará disponível para compra' : 'Esta variação ficará oculta na loja'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${variation.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {variation.isActive ? 'Visível' : 'Oculta'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Upload de Imagens da Variação */}
                                        <div className="bg-[#FFF3ED] rounded-lg p-4 mb-6 border border-[#FD9555]">
                                            <div className="mb-4">
                                                <h4 className="text-sm font-semibold text-[#FD9555] flex items-center gap-2">
                                                    <ImageIcon className="w-4 h-4" style={{ color: '#FD9555' }} />
                                                    Imagens da Variação
                                                </h4>
                                                <p className="text-xs text-[#FD9555] mt-1">
                                                    Adicione imagens de preview para esta variação (opcional)
                                                </p>
                                            </div>
                                            <div className="border-2 border-dashed border-[#FD9555] rounded-lg p-6 hover:border-[#FD9555]/80 transition-all duration-200 bg-white hover:bg-[#FFF3ED]">
                                                <label className="cursor-pointer block text-center">
                                                    <ImageIcon className="mx-auto h-10 w-10" style={{ color: '#FD9555' }} />
                                                    <span className="mt-2 block text-sm font-medium text-[#FD9555]">
                                                        Clique para selecionar imagens
                                                    </span>
                                                    <span className="mt-1 block text-xs text-[#FD9555]">
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
                                                <div className="space-y-4 mt-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-sm font-medium text-gray-900">
                                                            Imagens ({variation.images.length})
                                                        </h4>
                                                        <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                                            Arraste para reordenar
                                                        </div>
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
                                                            <div className="max-h-64 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2">
                                                                {variation.images.map((image, imageIndex) => (
                                                                    <div key={image.id} className="relative group">
                                                                        <SortableImageItem
                                                                            image={image}
                                                                            index={imageIndex}
                                                                            isMain={variation.mainImageIndex === imageIndex}
                                                                            onRemove={() => removeVariationImage(index, imageIndex)}
                                                                        />
                                                                        {imageIndex === 0 && (
                                                                            <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                                                                Principal
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </SortableContext>
                                                    </DndContext>
                                                </div>
                                            )}
                                        </div>

                                        {/* Upload de Arquivos */}
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <div className="mb-4">
                                                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-blue-600" />
                                                    Arquivos da Variação *
                                                </h4>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Adicione os arquivos digitais que serão entregues ao cliente (PDF, PNG, JPG até 50MB cada)
                                                </p>
                                            </div>

                                            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 hover:border-blue-400 transition-all duration-200 bg-white hover:bg-blue-50">
                                                <label className="cursor-pointer block text-center">
                                                    <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <Upload className="h-6 w-6 text-blue-600" />
                                                    </div>
                                                    <span className="block text-sm font-semibold text-gray-900 mb-1">
                                                        Clique ou arraste arquivos aqui
                                                    </span>
                                                    <span className="block text-xs text-gray-500">
                                                        Suporta múltiplos arquivos: PDF, PNG, JPG
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

                                            {/* Lista de Arquivos Melhorada */}
                                            {variation.files.length > 0 && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-sm font-medium text-gray-900">
                                                            Arquivos ({variation.files.length})
                                                        </h4>
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto space-y-2">
                                                        {variation.files.map((file, fileIndex) => (
                                                            <div key={fileIndex} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                                    <div className={`p-2 rounded-lg ${file.type === 'pdf'
                                                                        ? 'bg-red-100 text-red-600'
                                                                        : 'bg-blue-100 text-blue-600'
                                                                        }`}>
                                                                        <FileText className="w-4 h-4" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                                            {(file.r2Key || file.url) ? (
                                                                                <a
                                                                                    href={file.url ? String(file.url) : `/api/r2/download?r2Key=${encodeURIComponent(file.r2Key || '')}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-blue-600 underline"
                                                                                >
                                                                                    {file.filename || file.originalName || 'Arquivo PDF'}
                                                                                </a>
                                                                            ) : (
                                                                                file.filename || file.file?.name || 'Arquivo sem nome'
                                                                            )}
                                                                        </p>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <p className="text-xs text-gray-500">
                                                                                {(file.fileSize || 0) / 1024 / 1024 > 0 ? `${((file.fileSize || 0) / 1024 / 1024).toFixed(2)} MB` : 'Tamanho desconhecido'}
                                                                            </p>
                                                                            <span className="text-xs text-gray-300">•</span>
                                                                            <p className="text-xs text-gray-500">
                                                                                {file.type === 'pdf' ? 'PDF' : 'Imagem'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center space-x-2 ml-4">
                                                                    {file.uploading && (
                                                                        <div className="flex items-center gap-2">
                                                                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                                                            <span className="text-xs text-blue-600">Enviando...</span>
                                                                        </div>
                                                                    )}
                                                                    {file.uploaded && (
                                                                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                                                            ✓ Enviado
                                                                        </Badge>
                                                                    )}
                                                                    {file.error && (
                                                                        <Badge variant="destructive">
                                                                            ✗ Erro
                                                                        </Badge>
                                                                    )}
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => removeFileFromVariation(index, fileIndex)}
                                                                        className="text-gray-400 hover:text-red-500 cursor-pointer p-1"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Botões de Ação */}
                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="cursor-pointer"
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Atualizando...
                                </>
                            ) : (
                                'Atualizar Produto'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
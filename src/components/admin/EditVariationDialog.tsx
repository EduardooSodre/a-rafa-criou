'use client'

import { useState, useRef } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Edit, Loader2, FileText, Image as ImageIcon, Trash2, Upload } from 'lucide-react'
import Image from 'next/image'


interface UploadedImage {
    id: string
    file: File
    uploading?: boolean
    uploaded?: boolean
    data?: string
    error?: string
    url?: string
    alt?: string
    order: number
}

interface UploadedFile {
    file: File
    type: 'pdf' | 'image'
    uploading?: boolean
    uploaded?: boolean
    r2Key?: string
    error?: string
    filename?: string
    originalName?: string
    fileSize?: number
    mimeType?: string
}

interface VariationData {
    id: string
    productId: string
    name: string
    slug: string
    price: string
    isActive: boolean
    idioma?: string
    images: UploadedImage[]
    files: UploadedFile[]
}

interface EditVariationDialogProps {
    variation: VariationData
    productId: string
    onSuccess?: () => void
    trigger?: React.ReactNode
}

export default function EditVariationDialog({
    variation,
    productId,
    onSuccess,
    trigger
}: EditVariationDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<VariationData>({
        ...variation,
        price: variation.price?.toString() ?? '',
        images: variation.images || [],
        files: variation.files || [],
        idioma: variation.idioma || '',
    })
    // Opções de idioma
    const LANGUAGE_OPTIONS = [
        { value: 'portugues', label: 'Português' },
        { value: 'espanhol', label: 'Espanhol' },
        { value: 'escreva', label: 'Escreva sua mensagem' },
    ]

    // Upload de arquivos (PDF ou imagem)
    const handleFileUpload = async (files: FileList) => {
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
                files: [...prev.files, uploadFile]
            }))
        }
    }

    const removeFile = (fileIndex: number) => {
        setFormData(prev => ({
            ...prev,
            files: prev.files.filter((_, i) => i !== fileIndex)
        }))
    }

    // Upload de imagens
    const handleImageUpload = async (files: FileList) => {
        const validFiles = Array.from(files).filter(file => {
            const isValidType = file.type.startsWith('image/')
            const isValidSize = file.size <= 10 * 1024 * 1024
            return isValidType && isValidSize
        })
        for (const file of validFiles) {
            const uploadImage: UploadedImage = {
                id: `variation-img-${Date.now()}-${Math.random()}`,
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

    const removeImage = (imageIndex: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== imageIndex)
        }))
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
            const url = `/api/admin/products/${productId}/variations/${variation.id}`
            const payload = {
                name: formData.name,
                slug: formData.slug,
                price: formData.price,
                isActive: formData.isActive,
                idioma: formData.idioma,
                images: formData.images.filter(img => img.uploaded && img.data).map(img => ({
                    data: img.data!,
                    alt: img.alt || formData.name,
                    order: img.order
                })),
                files: formData.files.map(file => ({
                    filename: file.file.name,
                    originalName: file.file.name,
                    fileSize: file.file.size,
                    mimeType: file.file.type,
                }))
            }
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })
            if (!response.ok) {
                const errorData = await response.text()
                throw new Error('Erro ao atualizar variação: ' + errorData)
            }
            setOpen(false)
            onSuccess?.()
        } catch (error) {
            alert('Erro ao atualizar variação. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0 hover:bg-gray-50">
                        <Edit className="h-3 w-3" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Editar Variação</DialogTitle>
                    <DialogDescription>
                        Atualize as informações da variação &quot;{variation.name}&quot;.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="name">Nome da Variação *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value, slug: generateSlug(e.target.value) }))}
                                placeholder="Nome da variação"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                placeholder="slug-da-variacao"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="price">Preço *</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={formData.price}
                                onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div>
                            <Label>Idioma *</Label>
                            <Select
                                value={formData.idioma || ''}
                                onValueChange={val => setFormData(prev => ({ ...prev, idioma: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o idioma" />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGE_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {formData.idioma === 'escreva' && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded text-yellow-900 text-sm">
                            Este idioma permite que o cliente escreva uma mensagem personalizada. Certifique-se de configurar corretamente os campos e instruções no produto e na página de detalhes.
                        </div>
                    )}
                    <div>
                        <Label>Arquivos (PDF ou imagem)</Label>
                        <div className="mt-2">
                            <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 cursor-pointer">
                                <FileText className="mx-auto h-8 w-8 text-gray-400" />
                                <span className="mt-2 block text-sm font-medium text-gray-900">
                                    Clique para fazer upload ou arraste arquivos aqui
                                </span>
                                <span className="mt-1 block text-xs text-gray-500">
                                    PDF ou imagens até 50MB cada
                                </span>
                                <input
                                    type="file"
                                    multiple
                                    accept="application/pdf,image/*"
                                    onChange={e => e.target.files && handleFileUpload(e.target.files)}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        {formData.files.length > 0 && (
                            <ul className="mt-3 space-y-2">
                                {formData.files.map((file, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm bg-gray-50 rounded p-2">
                                        <FileText className="w-4 h-4 text-gray-500" />
                                        <span className="flex-1 truncate">{file.file?.name || file.filename || 'Arquivo'}</span>
                                        <Button type="button" size="icon" variant="ghost" onClick={() => removeFile(i)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div>
                        <Label>Imagens da Variação</Label>
                        <div className="mt-2">
                            <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 cursor-pointer">
                                <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
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
                                    onChange={e => e.target.files && handleImageUpload(e.target.files)}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        {formData.images.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                                {formData.images.map((img, i) => (
                                    <div key={img.id || i} className="relative group border rounded overflow-hidden bg-gray-50">
                                        {img.data ? (
                                            <Image src={img.data} alt={img.alt || formData.name} width={120} height={120} className="object-cover w-full h-24" />
                                        ) : (
                                            <div className="flex items-center justify-center h-24 text-gray-400">
                                                <ImageIcon className="w-8 h-8" />
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-red-100"
                                            onClick={() => removeImage(i)}
                                            title="Remover imagem"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={checked => setFormData(prev => ({ ...prev, isActive: checked }))}
                            />
                            <Label htmlFor="isActive" className="text-sm">Variação Ativa</Label>
                        </div>
                        <div className="flex gap-2">
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
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
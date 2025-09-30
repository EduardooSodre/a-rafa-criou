'use client'

import { useState } from 'react'
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
// Select removed: 'Idioma' field was removed from variations
import { Edit, Loader2, FileText, Image as ImageIcon, Trash2 } from 'lucide-react'
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
    file?: File
    type?: 'pdf' | 'image'
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

interface VariationData {
    id: string
    productId: string
    name: string
    slug: string
    price: string | number
    isActive: boolean
    images?: UploadedImage[]
    files?: UploadedFile[]
}

interface EditVariationDialogProps {
    variation: Partial<VariationData> | Record<string, unknown>
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
        // variation.files may come in a different shape (FileData). Cast to UploadedFile[] safely.
        files: (variation.files as unknown as UploadedFile[]) || [],
    } as VariationData)
    // Upload de arquivos (PDF ou imagem) - add File objects to formData.files
    const handleFileUpload = (files: FileList) => {
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
                uploaded: false,
                filename: file.name,
                originalName: file.name,
                fileSize: file.size,
                mimeType: file.type,
            }
            setFormData(prev => ({
                ...prev,
                files: [...(prev.files || []), uploadFile]
            }))
        }
    }

    const removeFile = (fileIndex: number) => {
        setFormData(prev => ({
            ...prev,
            files: (prev.files || []).filter((_, i) => i !== fileIndex)
        }))
    }

    // Upload de imagens: add File objects to images array; actual upload happens on submit
    const handleImageUpload = (files: FileList) => {
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
                order: (formData.images || []).length
            }
            setFormData(prev => ({
                ...prev,
                images: [...(prev.images || []), uploadImage]
            }))
        }
    }

    const removeImage = (imageIndex: number) => {
        setFormData(prev => ({
            ...prev,
            images: (prev.images || []).filter((_, i) => i !== imageIndex)
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

    // name -> slug logic handled inline when editing the input

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            // validation: ensure at least one file (PDF) is present
            const filesArr = formData.files || []
            if (filesArr.length === 0) {
                alert('Cada variação precisa ter ao menos um arquivo (PDF).')
                setLoading(false)
                return
            }
            const hasPdf = filesArr.some(f => (f.mimeType === 'application/pdf') || (f.file && f.file.type === 'application/pdf') || (f.filename && f.filename.toLowerCase().endsWith('.pdf')))
            if (!hasPdf) {
                alert('Adicione pelo menos um arquivo PDF à variação.')
                setLoading(false)
                return
            }

            // First upload any files to R2 and collect r2Key
            const filesPayload: Array<{ filename: string; originalName: string; fileSize: number; mimeType: string; r2Key?: string }> = []
            for (const f of filesArr) {
                if (f.file) {
                    const fd = new FormData()
                    fd.append('file', f.file)
                    const res = await fetch('/api/r2/upload', { method: 'POST', body: fd })
                    if (!res.ok) throw new Error('Falha no upload de arquivo')
                    const j = await res.json()
                    const r2Key = j?.data?.key ?? j?.data
                    filesPayload.push({ filename: f.filename || f.file.name, originalName: f.file.name, fileSize: f.file.size, mimeType: f.file.type, r2Key })
                } else if (f.r2Key) {
                    filesPayload.push({ filename: f.filename || '', originalName: f.originalName || '', fileSize: f.fileSize || 0, mimeType: f.mimeType || '', r2Key: f.r2Key })
                }
            }

            // Upload images to R2 if File objects exist; otherwise use existing url/data
            const imagesPayload: Array<{ data: string; alt?: string; order?: number }> = []
            for (let i = 0; i < (formData.images || []).length; i++) {
                const img = formData.images![i]
                if (img.file) {
                    const fd = new FormData()
                    fd.append('file', img.file)
                    const resImg = await fetch('/api/r2/upload', { method: 'POST', body: fd })
                    if (!resImg.ok) throw new Error('Falha no upload de imagem da variação')
                    const jimg = await resImg.json()
                    const r2k = jimg?.data?.key ?? jimg?.data
                    imagesPayload.push({ data: r2k, alt: img.alt || undefined, order: img.order })
                } else if (img.data) {
                    imagesPayload.push({ data: img.data, alt: img.alt || undefined, order: img.order })
                } else if (img.url) {
                    imagesPayload.push({ data: img.url, alt: img.alt || undefined, order: img.order })
                }
            }

            // Build payload and send PUT to update variation
            const payload = {
                name: formData.name,
                slug: formData.slug,
                price: Number(formData.price) || 0,
                isActive: formData.isActive,
                files: filesPayload,
                images: imagesPayload,
            }

            const response = await fetch(`/api/admin/products/${productId}/variations/${formData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!response.ok) {
                const errorData = await response.text()
                throw new Error('Erro ao atualizar variação: ' + errorData)
            }
            setOpen(false)
            onSuccess?.()
        } catch (err) {
            console.error(err)
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
                        Atualize as informações da variação &quot;{(variation as unknown as Partial<VariationData>).name as string}&quot;.
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
                    </div>
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
                        {(formData.files || []).length > 0 && (
                            <ul className="mt-3 space-y-2">
                                {(formData.files || []).map((file, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm bg-gray-50 rounded p-2">
                                        <FileText className="w-4 h-4 text-gray-500" />
                                        {(file.r2Key || file.url) ? (
                                            <a
                                                href={file.url ? String(file.url) : `/api/r2/download?r2Key=${encodeURIComponent(file.r2Key || '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 truncate text-blue-600 underline"
                                            >
                                                {file.filename || file.originalName || (file.r2Key ? decodeURIComponent(file.r2Key.split('/').pop() || '') : 'Arquivo PDF')}
                                            </a>
                                        ) : (
                                            <span className="flex-1 truncate">{file.file?.name || file.filename || 'Arquivo'}</span>
                                        )}
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
                        {(formData.images || []).length > 0 && (
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                                {(formData.images || []).map((img, i) => (
                                    <div key={img.id || i} className="relative group border rounded overflow-hidden bg-gray-50">
                                        {img.data ? (
                                            <Image src={img.data} alt={img.alt || formData.name} width={120} height={120} className="object-cover w-full h-24" />
                                        ) : img.url ? (
                                            <Image src={img.url} alt={img.alt || formData.name} width={120} height={120} className="object-cover w-full h-24" />
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
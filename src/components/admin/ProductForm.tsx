import React, { useEffect, useRef, useState } from 'react'
import { Upload, X, Plus, Package, FolderPlus, Image as ImageIcon, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

// Types used in this form
interface Category { id: string; name: string }
interface AttributeValue { id: string; value: string }
interface Attribute { id: string; name: string; values?: AttributeValue[] }
interface UploadedFile { file?: File; filename?: string; r2Key?: string }
interface ImageFile { file?: File; filename?: string; previewUrl?: string }
interface VariationForm { name: string; price: string; attributeValues: { attributeId: string; valueId: string }[]; files: UploadedFile[]; images: ImageFile[] }
interface ProductFormData { name: string; slug?: string; description?: string; categoryId?: string | null; isActive?: boolean; isFeatured?: boolean; images: string[]; price?: string; variations: VariationForm[]; attributes?: { attributeId: string; valueIds: string[] }[] }

interface ProductFormProps { defaultValues?: Partial<ProductFormData>; categories?: Category[]; availableAttributes?: Attribute[]; isEditing?: boolean; onSuccess?: () => void }

export default function ProductForm({ defaultValues, categories = [], availableAttributes = [], isEditing = false, onSuccess }: ProductFormProps) {
    const router = useRouter()
    const [step, setStep] = useState<number>(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false)
    const [newAttrName, setNewAttrName] = useState('')
    const [newAttrValues, setNewAttrValues] = useState<string[]>([])
    const [newAttrValueInput, setNewAttrValueInput] = useState('')

    const [localAttributes, setLocalAttributes] = useState<Attribute[]>(availableAttributes)
    const [categoriesLocal, setCategoriesLocal] = useState<Category[]>(categories)
    const [slugTouched, setSlugTouched] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryDescription, setNewCategoryDescription] = useState('')
    const [isCreatingCategory, setIsCreatingCategory] = useState(false)

    const [formData, setFormData] = useState<ProductFormData>(() => ({
        name: defaultValues?.name || '',
        slug: defaultValues?.slug,
        description: defaultValues?.description,
        categoryId: defaultValues?.categoryId ?? null,
        isActive: defaultValues?.isActive ?? true,
        isFeatured: defaultValues?.isFeatured ?? false,
        images: defaultValues?.images || [],
        price: defaultValues?.price ? String(defaultValues.price) : '',
        variations: defaultValues?.variations || [{ name: '', price: '', attributeValues: [], files: [], images: [] }],
        attributes: defaultValues?.attributes || [],
    }))

    // Simple refs for variation blocks (used for scroll into view)
    const variationRefs = useRef<Array<HTMLDivElement | null>>([])

    // Refs and state for image previews and drag-and-drop
    const imagePreviewsRef = useRef<ImageFile[]>([])
    const dragIndexRef = useRef<number | null>(null)
    type DragPayload = { source: 'product'; imageIndex: number; image: ImageFile } | { source: 'variation'; variationIndex: number; imageIndex: number; image: ImageFile } | null
    const dragDataRef = useRef<DragPayload>(null)
    const variationDragRef = useRef<{ variationIndex: number; imageIndex: number } | null>(null)

    const [productDraggingIndex, setProductDraggingIndex] = useState<number | null>(null)
    const [productDragOverIndex, setProductDragOverIndex] = useState<number | null>(null)

    const [variationDraggingState, setVariationDraggingState] = useState<{ variationIndex: number; imageIndex: number } | null>(null)
    const [variationDragOverState, setVariationDragOverState] = useState<{ variationIndex: number; overIndex: number } | null>(null)

    function handleProductImageUpload(files: FileList) {
        const list = Array.from(files).map(f => ({ file: f, filename: f.name, previewUrl: URL.createObjectURL(f) }))
        imagePreviewsRef.current = [...imagePreviewsRef.current, ...list]
        setFormData(prev => ({ ...prev, images: [...prev.images, ...list.map(l => l.previewUrl!)] }))
    }

    function removeProductImageByPreview(previewUrl: string) {
        setFormData(prev => {
            const idx = prev.images.indexOf(previewUrl)
            if (idx === -1) return prev
            const previews = [...imagePreviewsRef.current]
            const [removed] = previews.splice(idx, 1)
            if (removed && removed.previewUrl) URL.revokeObjectURL(removed.previewUrl)
            imagePreviewsRef.current = previews
            return { ...prev, images: prev.images.filter(p => p !== previewUrl) }
        })
    }

    function handleVariationImageUpload(variationIndex: number, files: FileList) {
        const list = Array.from(files).map(f => ({ file: f, filename: f.name, previewUrl: URL.createObjectURL(f) }))
        setFormData(prev => ({ ...prev, variations: prev.variations.map((v, i) => i === variationIndex ? { ...v, images: [...v.images, ...list] } : v) }))
    }

    function addVariation() {
        setFormData(prev => ({ ...prev, variations: [...prev.variations, { name: '', price: '', attributeValues: [], files: [], images: [] }] }))
        // scroll to new variation after slight delay (UI)
        setTimeout(() => { const idx = formData.variations.length; variationRefs.current[idx]?.scrollIntoView({ behavior: 'smooth' }) }, 100)
    }

    function updateVariation<K extends keyof VariationForm | string>(index: number, key: K, value: unknown) {
        setFormData(prev => ({
            ...prev,
            variations: prev.variations.map((v, i) =>
                i === index
                    ? {
                        ...v,
                        [key]: value as VariationForm[Extract<keyof VariationForm, string>]
                    }
                    : v
            )
        }))
    }

    /* eslint-disable @typescript-eslint/no-unused-vars */
    function removeVariation(index: number) {
        setFormData(prev => ({ ...prev, variations: prev.variations.filter((_, i) => i !== index) }))
    }
    /* eslint-enable @typescript-eslint/no-unused-vars */

    // Small Dropzone component (local) to provide drag/drop and click-to-select behavior
    type DropzoneProps = { accept?: string; multiple?: boolean; onFilesSelected: (files: FileList) => void; children?: React.ReactNode }
    function Dropzone({ accept, multiple, onFilesSelected, children }: DropzoneProps) {
        const inputRef = useRef<HTMLInputElement | null>(null)

        function onDrop(e: React.DragEvent) {
            e.preventDefault()
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) onFilesSelected(e.dataTransfer.files)
        }

        return (
            <div onDragOver={e => e.preventDefault()} onDrop={onDrop} onClick={() => inputRef.current?.click()}>
                <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={e => e.target.files && onFilesSelected(e.target.files)} className="hidden" />
                {children}
            </div>
        )
    }

    function slugify(text: string) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-') // spaces to dashes
            .replace(/[^a-z0-9-_]/g, '') // remove invalid chars
            .replace(/-+/g, '-')
    }

    // fetch categories from API when none were passed as prop
    useEffect(() => {
        if ((!categories || categories.length === 0) && categoriesLocal.length === 0) {
            ; (async () => {
                try {
                    const res = await fetch('/api/admin/categories')
                    if (!res.ok) return
                    const j = await res.json()
                    setCategoriesLocal(j.categories || [])
                } catch (err) {
                    console.error('Falha ao buscar categorias', err)
                }
            })()
        }
    }, [categories, categoriesLocal.length])
    function removeVariationImage(variationIndex: number, imageIndex: number) {
        setFormData(prev => {
            const newVars = prev.variations.map((v, i) => {
                if (i !== variationIndex) return v
                const toRemove = v.images[imageIndex]
                if (toRemove && toRemove.previewUrl) URL.revokeObjectURL(toRemove.previewUrl)
                return { ...v, images: v.images.filter((_, idx) => idx !== imageIndex) }
            })
            return { ...prev, variations: newVars }
        })
    }

    function updateVariationAttributeValue(index: number, attributeId: string, valueId: string) {
        setFormData(prev => ({ ...prev, variations: prev.variations.map((v, i) => i === index ? { ...v, attributeValues: [...v.attributeValues.filter(av => av.attributeId !== attributeId), { attributeId, valueId }] } : v) }))
    }

    function handleFileUpload(variationIndex: number, files: FileList) {
        const list = Array.from(files).map(f => ({ file: f, filename: f.name }))
        setFormData(prev => ({ ...prev, variations: prev.variations.map((v, i) => i === variationIndex ? { ...v, files: [...v.files, ...list] } : v) }))
    }

    function handleToggleAttributeValue(attributeId: string, valueId: string) {
        setFormData(prev => {
            const arr = prev.attributes || []
            const att = arr.find(a => a.attributeId === attributeId)
            if (!att) return { ...prev, attributes: [...arr, { attributeId, valueIds: [valueId] }] }
            const exists = att.valueIds.includes(valueId)
            return { ...prev, attributes: arr.map(a => a.attributeId === attributeId ? { ...a, valueIds: exists ? a.valueIds.filter(v => v !== valueId) : [...a.valueIds, valueId] } : a) }
        })
    }

    function handleCreateAttribute() {
        if (!newAttrName) return
        const values = newAttrValues.map(s => s.trim()).filter(Boolean)
        if (values.length === 0) {
            alert('Adicione pelo menos um valor para o atributo')
            return
        }
        const id = `local-${Date.now()}`
        const attr: Attribute = { id, name: newAttrName, values: values.map((v, i) => ({ id: `${id}-${i}`, value: v })) }
        setLocalAttributes(prev => [attr, ...prev])
        setNewAttrName('')
        setNewAttrValues([])
        setNewAttrValueInput('')
        setIsNewCategoryOpen(false)
    }

    function prevStep() { setStep(s => Math.max(1, s - 1)) }
    function nextStep() { setStep(s => Math.min(3, s + 1)) }

    function validate(): string | null {
        // Ensure every variation has at least one file
        for (const v of formData.variations) {
            if (!v.files || v.files.length === 0) return 'Cada variação precisa ter pelo menos um arquivo.'
        }
        if (!formData.name) return 'Nome do produto é obrigatório.'
        // price must be present or at least one variation price
        const priceOk = !!formData.price || formData.variations.some(v => !!v.price)
        if (!priceOk) return 'Preço do produto é obrigatório (ou preencha preço nas variações).'
        return null
    }

    async function handleSubmit(e?: React.FormEvent) {
        e?.preventDefault()
        const err = validate()
        if (err) {
            alert(err)
            return
        }
        setIsSubmitting(true)
        try {
            // First: upload all variation files to R2
            type R2File = { filename: string; originalName: string; fileSize: number; mimeType: string; r2Key: string }
            const variationsPayload: Array<{ name: string; price: number; isActive: boolean; files: R2File[]; images?: Array<{ data: string; alt?: string; isMain?: boolean; order?: number }>; attributeValues: VariationForm['attributeValues'] }> = []
            for (let vi = 0; vi < formData.variations.length; vi++) {
                const variation = formData.variations[vi]
                const filesPayload: R2File[] = []
                for (const f of variation.files) {
                    if (f.file) {
                        const fd = new FormData()
                        fd.append('file', f.file)
                        const res = await fetch('/api/r2/upload', { method: 'POST', body: fd })
                        if (!res.ok) throw new Error('Falha no upload de arquivo')
                        const j = await res.json()
                        const r2Key = j?.data?.key ?? j?.data
                        filesPayload.push({ filename: f.filename || f.file.name, originalName: f.file.name, fileSize: f.file.size, mimeType: f.file.type, r2Key })
                    } else if ((f as unknown as R2File).r2Key) {
                        // already uploaded
                        filesPayload.push(f as unknown as R2File)
                    }
                }

                // Process variation images (upload to R2 if file present)
                const variationImagesPayload: Array<{ data: string; alt?: string; isMain?: boolean; order?: number }> = []
                for (let viImg = 0; viImg < (variation.images || []).length; viImg++) {
                    const vimg = variation.images[viImg]
                    if (vimg.file) {
                        const fd = new FormData()
                        fd.append('file', vimg.file)
                        const resImg = await fetch('/api/r2/upload', { method: 'POST', body: fd })
                        if (!resImg.ok) throw new Error('Falha no upload de imagem da variação')
                        const jimg = await resImg.json()
                        const r2k = jimg?.data?.key ?? jimg?.data
                        if (r2k) variationImagesPayload.push({ data: r2k, alt: vimg.filename || undefined, isMain: viImg === 0, order: viImg })
                        if (vimg.previewUrl) URL.revokeObjectURL(vimg.previewUrl)
                    } else if (vimg.previewUrl) {
                        variationImagesPayload.push({ data: vimg.previewUrl, alt: vimg.filename || undefined, isMain: viImg === 0, order: viImg })
                    }
                }

                variationsPayload.push({
                    name: variation.name,
                    price: parseFloat(variation.price) || 0,
                    isActive: true,
                    files: filesPayload,
                    images: variationImagesPayload,
                    attributeValues: variation.attributeValues || [],
                })
            }

            // Product price: prefer explicit field, otherwise first variation
            const productPrice = formData.price ? parseFloat(formData.price) : (formData.variations[0] ? parseFloat(formData.variations[0].price || '0') : 0)
            // Upload product images (if any previews present)
            const productImagesPayload: Array<{ data: string; alt?: string; isMain?: boolean; order?: number }> = []
            for (let i = 0; i < imagePreviewsRef.current.length; i++) {
                const img = imagePreviewsRef.current[i]
                if (img.file) {
                    const fd = new FormData()
                    fd.append('file', img.file)
                    const resImg = await fetch('/api/r2/upload', { method: 'POST', body: fd })
                    if (!resImg.ok) throw new Error('Falha no upload de imagem do produto')
                    const jimg = await resImg.json()
                    const r2k = jimg?.data?.key ?? jimg?.data
                    if (r2k) productImagesPayload.push({ data: r2k, alt: img.filename || undefined, isMain: i === 0, order: i })
                    // revoke preview URL after upload
                    if (img.previewUrl) URL.revokeObjectURL(img.previewUrl)
                } else if (img.previewUrl) {
                    // If there's no File object (existing preview), send the preview URL or key as data
                    productImagesPayload.push({ data: img.previewUrl, alt: img.filename || undefined, isMain: i === 0, order: i })
                }
            }

            const payload = {
                name: formData.name,
                slug: formData.slug,
                description: formData.description,
                price: productPrice,
                categoryId: formData.categoryId || null,
                isActive: formData.isActive,
                isFeatured: formData.isFeatured,
                images: productImagesPayload,
                variations: variationsPayload,
                files: [],
                attributes: formData.attributes || [],
                // include any locally-created attribute definitions so server can create them
                attributeDefinitions: localAttributes
                    .filter(a => a.id.startsWith('local-'))
                    .map(a => ({ id: a.id, name: a.name, values: (a.values || []).map(v => ({ id: v.id, value: v.value })) })),
            }

            const res = await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            if (!res.ok) {
                const txt = await res.text()
                throw new Error(`Erro na API de produtos: ${res.status} ${txt}`)
            }
            const saved = await res.json()
            console.log('Produto salvo', saved)
            setIsSubmitting(false)
            if (onSuccess) onSuccess()
            else router.push('/admin/produtos')
        } catch (err: unknown) {
            setIsSubmitting(false)
            console.error(err)
            alert('Erro ao salvar produto: ' + (err instanceof Error ? err.message : String(err)))
        }
    }

    // Small helper UI lists (language removed from variations - kept for potential future use)

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Stepper header */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-2 items-center">
                        <button type="button" onClick={() => setStep(1)} className={`px-3 py-1 rounded ${step === 1 ? 'bg-yellow-200 text-yellow-900' : 'bg-gray-100'}`}>1. Informações</button>
                        <button type="button" onClick={() => setStep(2)} className={`px-3 py-1 rounded ${step === 2 ? 'bg-yellow-200 text-yellow-900' : 'bg-gray-100'}`}>2. Atributos</button>
                        <button type="button" onClick={() => setStep(3)} className={`px-3 py-1 rounded ${step === 3 ? 'bg-yellow-200 text-yellow-900' : 'bg-gray-100'}`}>3. Variações</button>
                    </div>
                    <div className="text-sm text-gray-500">Passo {step} de 3</div>
                </div>

                {/* Step 1 */}
                {step === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" /> Informações do Produto</CardTitle>
                            <CardDescription>Dados básicos, imagens e categoria.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Nome *</Label>
                                    <Input value={formData.name} onChange={e => {
                                        const val = e.target.value
                                        setFormData(prev => ({ ...prev, name: val }))
                                        // auto-fill slug only if user hasn't touched slug field
                                        if (!slugTouched) setFormData(prev => ({ ...prev, slug: slugify(val) }))
                                    }} />
                                </div>
                                <div>
                                    <Label>Slug</Label>
                                    <Input value={formData.slug || ''} onChange={e => {
                                        setSlugTouched(true)
                                        setFormData(prev => ({ ...prev, slug: e.target.value }))
                                    }} />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Descrição *</Label>
                                    <Textarea value={formData.description || ''} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={4} />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Categoria</Label>
                                    <div className="flex gap-2">
                                        <Select value={formData.categoryId || ''} onValueChange={val => setFormData(prev => ({ ...prev, categoryId: val || null }))}>
                                            <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                                            <SelectContent>
                                                {categoriesLocal.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Dialog open={isNewCategoryOpen} onOpenChange={setIsNewCategoryOpen}>
                                            <DialogTrigger asChild>
                                                <Button type="button" variant="outline" size="icon"><FolderPlus className="w-4 h-4" /></Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader><DialogTitle>Nova Categoria</DialogTitle></DialogHeader>
                                                <div className="py-4 space-y-2">
                                                    <Input placeholder="Nome" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                                                    <Textarea placeholder="Descrição" rows={3} value={newCategoryDescription} onChange={e => setNewCategoryDescription(e.target.value)} />
                                                    <div className="flex justify-end mt-2 gap-2">
                                                        <Button disabled={isCreatingCategory} onClick={() => setIsNewCategoryOpen(false)}>Fechar</Button>
                                                        <Button disabled={isCreatingCategory || !newCategoryName} onClick={async () => {
                                                            // create category via API
                                                            setIsCreatingCategory(true)
                                                            try {
                                                                const res = await fetch('/api/admin/categories', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ name: newCategoryName, description: newCategoryDescription })
                                                                })
                                                                if (!res.ok) throw new Error('Erro ao criar categoria')
                                                                const created = await res.json()
                                                                if (created && created.id) {
                                                                    setCategoriesLocal(prev => [created, ...prev])
                                                                    setFormData(prev => ({ ...prev, categoryId: created.id }))
                                                                    setNewCategoryName('')
                                                                    setNewCategoryDescription('')
                                                                    setIsNewCategoryOpen(false)
                                                                } else {
                                                                    alert('Resposta inesperada ao criar categoria')
                                                                }
                                                            } catch (err) {
                                                                console.error(err)
                                                                alert('Falha ao criar categoria')
                                                            } finally {
                                                                setIsCreatingCategory(false)
                                                            }
                                                        }}>Criar</Button>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <div className="flex flex-col gap-2">
                                        <Label>Imagens do Produto</Label>
                                        <div className="mt-2">
                                            <Dropzone accept="image/*" multiple onFilesSelected={files => handleProductImageUpload(files)}>
                                                <div className="block w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
                                                    onDrop={e => {
                                                        const payload = dragDataRef.current
                                                        if (!payload) return
                                                        e.preventDefault()
                                                        if (payload.source === 'product') {
                                                            const from = payload.imageIndex
                                                            if (typeof from === 'number') {
                                                                setFormData(prev => {
                                                                    const arr = [...prev.images]
                                                                    const [moved] = arr.splice(from, 1)
                                                                    arr.push(moved)
                                                                    return { ...prev, images: arr }
                                                                })
                                                                const previews = [...imagePreviewsRef.current]
                                                                const [movedP] = previews.splice(from, 1)
                                                                previews.push(movedP)
                                                                imagePreviewsRef.current = previews
                                                            }
                                                        } else if (payload.source === 'variation') {
                                                            const fromVar = payload.variationIndex!
                                                            const fromIdx = payload.imageIndex
                                                            const imgObj = payload.image
                                                            setFormData(prev => {
                                                                const newVars = prev.variations.map((v, vi) => vi === fromVar ? { ...v, images: v.images.filter((_, i) => i !== fromIdx) } : v)
                                                                return { ...prev, variations: newVars, images: [...prev.images, imgObj!.previewUrl!] }
                                                            })
                                                            imagePreviewsRef.current = [...imagePreviewsRef.current, imgObj!]
                                                        }
                                                        dragDataRef.current = null
                                                        setProductDraggingIndex(null)
                                                    }}
                                                >
                                                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                    <div className="text-sm text-gray-500">Arraste e solte ou clique para selecionar imagens</div>
                                                </div>
                                            </Dropzone>

                                            {formData.images.length > 0 && (
                                                <div className="mt-3 grid grid-cols-4 gap-2">
                                                    {formData.images.map((url, idx) => (
                                                        <div key={url}
                                                            draggable
                                                            onDragStart={e => {
                                                                dragIndexRef.current = idx
                                                                setProductDraggingIndex(idx)
                                                                // attach payload for moving between product and variations
                                                                dragDataRef.current = { source: 'product', imageIndex: idx, image: imagePreviewsRef.current[idx] }
                                                                e.dataTransfer!.effectAllowed = 'move'
                                                            }}
                                                            onDragEnd={() => { dragIndexRef.current = null; setProductDraggingIndex(null); setProductDragOverIndex(null); dragDataRef.current = null }}
                                                            onDragOver={e => { e.preventDefault(); setProductDragOverIndex(idx) }}
                                                            onDragLeave={() => setProductDragOverIndex(null)}
                                                            onDrop={e => {
                                                                e.preventDefault()
                                                                const from = dragIndexRef.current
                                                                const to = idx
                                                                if (from === null || from === to) return
                                                                setFormData(prev => {
                                                                    const arr = [...prev.images]
                                                                    const [moved] = arr.splice(from, 1)
                                                                    arr.splice(to, 0, moved)
                                                                    return { ...prev, images: arr }
                                                                })
                                                                const previews = [...imagePreviewsRef.current]
                                                                const [movedP] = previews.splice(from, 1)
                                                                previews.splice(to, 0, movedP)
                                                                imagePreviewsRef.current = previews
                                                                dragIndexRef.current = null
                                                                setProductDraggingIndex(null)
                                                                setProductDragOverIndex(null)
                                                            }}
                                                            className={`relative border rounded overflow-hidden cursor-move transition-transform duration-150 ${productDraggingIndex === idx ? 'opacity-70 scale-95' : ''} ${productDragOverIndex === idx ? 'ring-2 ring-yellow-300' : ''}`}>
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={url} alt={`preview-${idx}`} className="w-full h-24 object-cover" />
                                                            {idx === 0 && <span className="absolute left-1 top-1 bg-yellow-300 text-black text-xs px-2 py-0.5 rounded">Capa</span>}
                                                            <button type="button" aria-label="Remover imagem" onClick={() => removeProductImageByPreview(url)} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"><X className="w-3 h-3" /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2 */}
                {step === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Atributos do Produto</CardTitle>
                            <CardDescription>Selecione atributos aplicáveis e valores. Você pode criar novos atributos.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <div className="flex flex-col gap-2">
                                        <Label>Criar novo atributo</Label>
                                        <div className="flex gap-2">
                                            <Input placeholder="Nome do atributo" value={newAttrName} onChange={e => setNewAttrName(e.target.value)} />
                                            <Button onClick={handleCreateAttribute} variant="default" className="bg-[#FED466] text-black hover:brightness-95 ring-1 ring-yellow-300" aria-label="Adicionar atributo">
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="mt-2">
                                            <div className="flex gap-2">
                                                <Input className="flex-1" placeholder="Adicionar valor e pressionar Enter" value={newAttrValueInput} onChange={e => setNewAttrValueInput(e.target.value)} onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault()
                                                        const v = newAttrValueInput.trim()
                                                        if (v) { setNewAttrValues(prev => [...prev, v]); setNewAttrValueInput('') }
                                                    }
                                                }} />
                                                <Button type="button" onClick={() => {
                                                    const v = newAttrValueInput.trim()
                                                    if (!v) return
                                                    setNewAttrValues(prev => [...prev, v])
                                                    setNewAttrValueInput('')
                                                }} className="bg-[#FED466] text-black hover:brightness-95">+</Button>
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {newAttrValues.map((v, i) => (
                                                    <div key={i} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border">
                                                        <span className="text-sm">{v}</span>
                                                        <button type="button" onClick={() => setNewAttrValues(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-500">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div>
                                        <Label>Atributos disponíveis</Label>
                                        <div className="max-h-72 overflow-y-auto mt-2 space-y-3">
                                            {localAttributes.map(attr => (
                                                <div key={attr.id} className="border rounded p-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="font-medium">{attr.name}</div>
                                                        <div>
                                                            <input type="checkbox" checked={!!formData.attributes?.find(a => a.attributeId === attr.id)} onChange={e => {
                                                                if (e.target.checked) setFormData(prev => ({ ...prev, attributes: [...(prev.attributes || []), { attributeId: attr.id, valueIds: [] }] }))
                                                                else setFormData(prev => ({ ...prev, attributes: (prev.attributes || []).filter(a => a.attributeId !== attr.id) }))
                                                            }} />
                                                        </div>
                                                    </div>
                                                    {formData.attributes?.find(a => a.attributeId === attr.id) && (
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {(attr.values || []).map((v: AttributeValue) => {
                                                                const selected = !!formData.attributes?.find(a => a.attributeId === attr.id && a.valueIds.includes(v.id))
                                                                return (
                                                                    <label key={v.id} className={`inline-flex items-center gap-2 px-2 py-1 rounded border ${selected ? 'bg-yellow-100' : 'bg-white'}`}>
                                                                        <input type="checkbox" checked={selected} onChange={() => handleToggleAttributeValue(attr.id, v.id)} />
                                                                        <span className="text-sm">{v.value}</span>
                                                                    </label>
                                                                )
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3 */}
                {step === 3 && (
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center w-full">
                                <div>
                                    <CardTitle>Variações do Produto</CardTitle>
                                    <CardDescription>Adicione variações, preços e arquivos. Cada variação precisa ter ao menos um arquivo.</CardDescription>
                                </div>
                                <div>
                                    <Button type="button" onClick={addVariation} variant="outline" size="sm"><Plus className="w-4 h-4" /> Nova Variação</Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {formData.variations.map((variation, index) => (
                                <div key={index} ref={el => { variationRefs.current[index] = el }} className="border rounded-xl p-4 mb-4 space-y-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="font-medium">{variation.name || `Variação ${index + 1}`}</div>
                                        <div className="text-sm text-gray-500">R$ {Number(variation.price || 0).toFixed(2)}</div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-2">
                                            <Label>Nome</Label>
                                            <Input value={variation.name} onChange={e => updateVariation(index, 'name', e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label>Preço (R$)</Label>
                                            <Input type="number" step="0.01" value={variation.price} onChange={e => updateVariation(index, 'price', e.target.value)} />
                                        </div>
                                    </div>

                                    {localAttributes.length > 0 && (
                                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {localAttributes.map(attr => (
                                                <div key={attr.id} className="flex flex-col gap-2">
                                                    <Label className="text-sm">{attr.name}</Label>
                                                    <Select value={variation.attributeValues?.find(av => av.attributeId === attr.id)?.valueId || ''} onValueChange={val => updateVariationAttributeValue(index, attr.id, val)}>
                                                        <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                                        <SelectContent>{(attr.values || []).map((v: AttributeValue) => <SelectItem key={v.id} value={v.id}>{v.value}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Arquivos da variação (PDFs) *</Label>
                                            <div className="mt-2">
                                                <label className="block w-full border-2 border-dashed rounded-lg p-4 text-center cursor-pointer">
                                                    <Upload className="mx-auto h-8 w-8" />
                                                    <input type="file" multiple accept=".pdf" onChange={e => e.target.files && handleFileUpload(index, e.target.files)} className="hidden" />
                                                </label>
                                            </div>
                                            {variation.files.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    {variation.files.map((f, fi) => (
                                                        <div key={fi} className="flex items-center justify-between bg-white border rounded p-3">
                                                            <div className="flex items-center gap-3">
                                                                <FileText className="w-4 h-4" />
                                                                <div className="text-sm">{f.filename}</div>
                                                            </div>
                                                            <div>
                                                                <Button type="button" variant="ghost" onClick={() => setFormData(prev => ({ ...prev, variations: prev.variations.map((v, i) => i === index ? { ...v, files: v.files.filter((_, idx) => idx !== fi) } : v) }))}><X className="w-4 h-4" /></Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <Label>Imagens da variação (preview)</Label>
                                            <div className="mt-2">
                                                <label className="block w-full border-2 border-dashed rounded-lg p-4 text-center cursor-pointer">
                                                    <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                                                    <input type="file" multiple accept="image/*" onChange={e => e.target.files && handleVariationImageUpload(index, e.target.files)} className="hidden" />
                                                </label>
                                            </div>
                                            {variation.images.length > 0 && (
                                                <div className="mt-3 grid grid-cols-3 gap-2">
                                                    {variation.images.map((img, ii) => (
                                                        <div key={ii}
                                                            draggable
                                                            onDragStart={e => {
                                                                variationDragRef.current = { variationIndex: index, imageIndex: ii }
                                                                setVariationDraggingState({ variationIndex: index, imageIndex: ii })
                                                                e.dataTransfer!.effectAllowed = 'move'
                                                            }}
                                                            onDragEnd={() => { variationDragRef.current = null; setVariationDraggingState(null); setVariationDragOverState(null) }}
                                                            onDragOver={e => { e.preventDefault(); setVariationDragOverState({ variationIndex: index, overIndex: ii }) }}
                                                            onDragLeave={() => setVariationDragOverState(null)}
                                                            onDrop={e => {
                                                                e.preventDefault()
                                                                const from = variationDragRef.current
                                                                const to = ii
                                                                if (!from) return
                                                                if (from.variationIndex !== index) return // only allow reorder within same variation
                                                                if (from.imageIndex === to) return
                                                                setFormData(prev => {
                                                                    const newVars = prev.variations.map((v, vi) => {
                                                                        if (vi !== index) return v
                                                                        const imgs = [...v.images]
                                                                        const [moved] = imgs.splice(from.imageIndex, 1)
                                                                        imgs.splice(to, 0, moved)
                                                                        return { ...v, images: imgs }
                                                                    })
                                                                    return { ...prev, variations: newVars }
                                                                })
                                                                variationDragRef.current = null
                                                                setVariationDraggingState(null)
                                                                setVariationDragOverState(null)
                                                            }}
                                                            className={`relative border rounded overflow-hidden cursor-move transition-transform duration-150 ${variationDraggingState?.variationIndex === index && variationDraggingState.imageIndex === ii ? 'opacity-70 scale-95' : ''} ${variationDragOverState?.variationIndex === index && variationDragOverState.overIndex === ii ? 'ring-2 ring-yellow-300' : ''}`}>
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={img.previewUrl || ''} alt={img.filename} className="w-full h-24 object-cover" />
                                                            {ii === 0 && <span className="absolute left-1 top-1 bg-yellow-300 text-black text-xs px-2 py-0.5 rounded">Capa</span>}
                                                            <button type="button" aria-label="Remover imagem" onClick={() => removeVariationImage(index, ii)} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"><X className="w-3 h-3" /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center">
                    <div>
                        <Button type="button" variant="outline" onClick={() => onSuccess ? onSuccess() : router.push('/admin/produtos')}>Cancelar</Button>
                    </div>
                    <div className="flex gap-2">
                        {step > 1 && <Button type="button" variant="ghost" onClick={prevStep}>Anterior</Button>}
                        {step < 3 && <Button type="button" onClick={nextStep}>Próximo</Button>}
                        {step === 3 && <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar Produto' : 'Criar Produto')}</Button>}
                    </div>
                </div>
            </form>
        </div>
    )
}

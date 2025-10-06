import React, { useEffect, useRef, useState } from 'react'
import { X, Package, FolderPlus, Image as ImageIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// Nested Dialog removed to keep a single outer modal during create/edit
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import AttributeManager from '@/components/admin/AttributeManager'
import VariationManager from '@/components/admin/VariationManager'

// Types used in this form
interface Category { id: string; name: string }
interface AttributeValue { id: string; value: string }
interface Attribute { id: string; name: string; values?: AttributeValue[] }
interface UploadedFile { file?: File; filename?: string; r2Key?: string }
interface ImageFile { file?: File; filename?: string; previewUrl?: string }
interface VariationForm { name: string; price: string; attributeValues: { attributeId: string; valueId: string }[]; files: UploadedFile[]; images: ImageFile[] }
interface ProductFormData { name: string; slug?: string; description?: string; categoryId?: string | null; isActive?: boolean; isFeatured?: boolean; images: string[]; price?: string; variations: VariationForm[]; attributes?: { attributeId: string; valueIds: string[] }[] }

interface ProductFormProps { defaultValues?: Partial<ProductFormData & { id?: string }>; categories?: Category[]; availableAttributes?: Attribute[]; isEditing?: boolean; productId?: string | null; onSuccess?: () => void }

export default function ProductForm({ defaultValues, categories = [], availableAttributes = [], isEditing = false, productId = null, onSuccess }: ProductFormProps) {
    const router = useRouter()
    const [step, setStep] = useState<number>(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false)

    const [localAttributes, setLocalAttributes] = useState<Attribute[]>(availableAttributes)
    const [isLoadingAttributes, setIsLoadingAttributes] = useState(false)

    // Carregar atributos do banco de dados apenas uma vez ao montar
    useEffect(() => {
        let isMounted = true

        async function loadAttributesFromDB() {
            // Se já tem atributos via prop, usar eles
            if (availableAttributes.length > 0) {
                setLocalAttributes(availableAttributes)
                return
            }

            try {
                setIsLoadingAttributes(true)
                const response = await fetch('/api/admin/attributes')
                if (response.ok && isMounted) {
                    const data = await response.json()
                    setLocalAttributes(data)
                }
            } catch {
                // Failed to load attributes
            } finally {
                if (isMounted) {
                    setIsLoadingAttributes(false)
                }
            }
        }

        loadAttributesFromDB()

        return () => {
            isMounted = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Executa apenas uma vez ao montar
    const [categoriesLocal, setCategoriesLocal] = useState<Category[]>(categories)
    const [slugTouched, setSlugTouched] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryDescription, setNewCategoryDescription] = useState('')
    const [isCreatingCategory, setIsCreatingCategory] = useState(false)
    const [categoryError, setCategoryError] = useState<string | null>(null)

    const [formData, setFormData] = useState<ProductFormData>(() => {
        return {
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
        }
    })

    // Defensive: when the step changes or the form is reloaded for editing, close any inline panels
    useEffect(() => {
        if (isNewCategoryOpen) setIsNewCategoryOpen(false)
    }, [step, isEditing, defaultValues, isNewCategoryOpen])

    // Sync form state when defaultValues change (e.g., opening edit dialog with product data)
    useEffect(() => {
        if (!defaultValues) return
        // ensure local attributes include server-provided ones
        // (merge by id, prefer existing local ones)
        if (availableAttributes && availableAttributes.length > 0) {
            setLocalAttributes(prev => {
                const map = new Map(prev.map(a => [a.id, a]))
                for (const a of availableAttributes) {
                    if (!map.has(a.id)) map.set(a.id, a)
                }
                return Array.from(map.values())
            })

        }

        // prepare image preview objects for product images so drag/reorder/removal work
        const prodImages = defaultValues?.images || []
        imagePreviewsRef.current = prodImages.map((imgData, i) => {
            if (typeof imgData === 'string') {
                return { file: undefined as File | undefined, filename: String(imgData).split('/').pop() || `img-${i}`, previewUrl: String(imgData) } as ImageFile
            }
            // imgData is an object with cloudinaryId and url
            const imgObj = imgData as { cloudinaryId?: string; url?: string; alt?: string }
            const previewUrl = imgObj.url || ''

            return {
                file: undefined as File | undefined,
                filename: imgObj.alt || imgObj.url?.split('/').pop() || `img-${i}`,
                previewUrl,
                cloudinaryId: imgObj.cloudinaryId
            } as ImageFile & { cloudinaryId?: string }
        }).filter(img => img.previewUrl) // Remove imagens sem URL válida

        // map variations: ensure images are ImageFile objects and keep files as-is
        type InFile = { filename?: string; originalName?: string; fileSize?: number; mimeType?: string; r2Key?: string; url?: string }
        const mappedVariations = (defaultValues?.variations || []).map((v: Partial<VariationForm>) => ({
            name: v.name || '',
            price: v.price ? String(v.price) : '',
            attributeValues: v.attributeValues || [],
            files: (v.files || []).map((f: string | InFile) => {
                if (typeof f === 'string') {
                    // if API sent a simple string (unlikely) treat as r2Key/url
                    const r = String(f)
                    return { file: undefined as File | undefined, filename: r.split('/').pop() || r, r2Key: r.startsWith('/') || r.includes('/api/r2/download') ? '' : r, url: r.startsWith('/') || r.includes('/api/r2/download') ? r : undefined }
                }
                const ff = f as InFile
                const url = ff.r2Key ? `/api/r2/download?r2Key=${encodeURIComponent(String(ff.r2Key))}` : (ff.url || undefined)
                return { file: undefined as File | undefined, filename: ff.filename || ff.originalName || url?.split('/').pop() || '', r2Key: ff.r2Key || '', originalName: ff.originalName, fileSize: ff.fileSize, mimeType: ff.mimeType, url }
            }),
            images: (v.images || []).map((img: string | { filename?: string; previewUrl?: string; url?: string; cloudinaryId?: string; alt?: string }, ii: number) => {
                // image may be string or object { cloudinaryId, url, alt }
                if (typeof img === 'string') return { file: undefined as File | undefined, filename: String(img).split('/').pop() || `var-${ii}`, previewUrl: img } as ImageFile
                type ImgObj = { filename?: string; previewUrl?: string; url?: string; cloudinaryId?: string; alt?: string }
                const io = img as ImgObj
                const preview = io.url || io.previewUrl || ''
                return {
                    file: undefined as File | undefined,
                    filename: io.alt || io.filename || String(preview || '').split('/').pop() || `var-${ii}`,
                    previewUrl: preview,
                    cloudinaryId: io.cloudinaryId
                } as ImageFile & { cloudinaryId?: string }
            }).filter(img => img.previewUrl && img.previewUrl.trim()) // Remove imagens sem URL válida
        }))

        const finalImages = imagePreviewsRef.current.map(img => img.previewUrl || '').filter(url => url.trim())

        setFormData({
            name: defaultValues?.name || '',
            slug: defaultValues?.slug,
            description: defaultValues?.description,
            categoryId: defaultValues?.categoryId ?? null,
            isActive: defaultValues?.isActive ?? true,
            isFeatured: defaultValues?.isFeatured ?? false,
            images: finalImages,
            price: defaultValues?.price ? String(defaultValues.price) : '',
            variations: mappedVariations.length > 0 ? mappedVariations : [{ name: '', price: '', attributeValues: [], files: [], images: [] }],
            attributes: defaultValues?.attributes || [],
        })
        // reset to first step when loading existing product
        setStep(1)
    }, [defaultValues, availableAttributes])

    // When availableAttributes prop changes after mount, merge into localAttributes
    useEffect(() => {
        if (!availableAttributes || availableAttributes.length === 0) return
        setLocalAttributes(prev => {
            const map = new Map(prev.map(a => [a.id, a]))
            for (const a of availableAttributes) {
                if (!map.has(a.id)) map.set(a.id, a)
            }
            return Array.from(map.values())
        })
    }, [availableAttributes])

    // Refs and state for image previews and drag-and-drop
    const imagePreviewsRef = useRef<ImageFile[]>([])
    const dragIndexRef = useRef<number | null>(null)
    type DragPayload = { source: 'product'; imageIndex: number; image: ImageFile } | { source: 'variation'; variationIndex: number; imageIndex: number; image: ImageFile } | null
    const dragDataRef = useRef<DragPayload>(null)

    const [productDraggingIndex, setProductDraggingIndex] = useState<number | null>(null)
    const [productDragOverIndex, setProductDragOverIndex] = useState<number | null>(null)

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
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={e => e.target.files && onFilesSelected(e.target.files)}
                    className="hidden"
                    title="Selecionar arquivos"
                />
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
                } catch {
                    // Failed to fetch categories
                }
            })()
        }
    }, [categories, categoriesLocal.length])

    function prevStep() { setStep(s => Math.max(1, s - 1)) }
    function nextStep() { setStep(s => Math.min(3, s + 1)) }

    function validate(): string | null {
        // Clear previous error
        setFormError(null)

        // Verificar se há atributos selecionados no Step 2
        const selectedAttributesCount = (formData.attributes || []).length

        // Ensure every variation has at least one file
        for (const [idx, v] of formData.variations.entries()) {
            if (!v.files || v.files.length === 0) {
                return `Cada variação (linha ${idx + 1}) precisa ter pelo menos um arquivo.`
            }

            // Se há atributos selecionados, todas as variações DEVEM ter todos os atributos preenchidos
            if (selectedAttributesCount > 0) {
                const variationAttributesCount = v.attributeValues?.length || 0
                if (variationAttributesCount < selectedAttributesCount) {
                    return `Variação "${v.name || `#${idx + 1}`}" está incompleta! Selecione TODOS os atributos (${variationAttributesCount}/${selectedAttributesCount} selecionados). Isso garante que o cliente compre o produto correto.`
                }
            }
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
            setFormError(err)
            return
        }
        setIsSubmitting(true)
        try {
            // First: upload all variation files (PDFs) to R2; images will be uploaded to Cloudinary
            type R2File = { filename: string; originalName: string; fileSize: number; mimeType: string; r2Key: string }
            type CloudinaryImage = { cloudinaryId: string; url: string; width?: number; height?: number; format?: string; size?: number; alt?: string; isMain?: boolean; order?: number }
            type VariationPayload = { id?: string; name: string; price: number; isActive: boolean; files: R2File[]; images?: CloudinaryImage[]; attributeValues: VariationForm['attributeValues'] }
            const variationsPayload: VariationPayload[] = []
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

                // Process variation images: upload to Cloudinary
                const variationImagesPayload: CloudinaryImage[] = []
                for (let viImg = 0; viImg < (variation.images || []).length; viImg++) {
                    const vimg = variation.images[viImg]
                    if (vimg.file) {
                        // Upload to Cloudinary
                        const arr = await vimg.file.arrayBuffer()
                        const b64 = Buffer.from(arr).toString('base64')
                        const mime = vimg.file.type || 'image/jpeg'
                        const dataUri = `data:${mime};base64,${b64}`

                        const cloudinaryRes = await fetch('/api/cloudinary/upload', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ image: dataUri, folder: 'variations' })
                        })
                        if (!cloudinaryRes.ok) throw new Error('Falha no upload da imagem para Cloudinary')
                        const cloudinaryData = await cloudinaryRes.json()

                        variationImagesPayload.push({
                            cloudinaryId: cloudinaryData.cloudinaryId,
                            url: cloudinaryData.url,
                            width: cloudinaryData.width,
                            height: cloudinaryData.height,
                            format: cloudinaryData.format,
                            size: cloudinaryData.size,
                            alt: vimg.filename || undefined,
                            isMain: viImg === 0,
                            order: viImg
                        })
                        if (vimg.previewUrl) URL.revokeObjectURL(vimg.previewUrl)
                    } else if (vimg.previewUrl && vimg.previewUrl.startsWith('http')) {
                        // Existing Cloudinary image - extract cloudinaryId from URL if possible
                        // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}
                        const cloudinaryId = (vimg as unknown as { cloudinaryId?: string }).cloudinaryId || ''
                        if (cloudinaryId) {
                            variationImagesPayload.push({
                                cloudinaryId,
                                url: vimg.previewUrl,
                                alt: vimg.filename || undefined,
                                isMain: viImg === 0,
                                order: viImg
                            })
                        }
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
            // Upload product images to Cloudinary
            const productImagesPayload: CloudinaryImage[] = []
            for (let i = 0; i < imagePreviewsRef.current.length; i++) {
                const img = imagePreviewsRef.current[i]
                if (img.file) {
                    // Upload to Cloudinary
                    const arr = await img.file.arrayBuffer()
                    const b64 = Buffer.from(arr).toString('base64')
                    const mime = img.file.type || 'image/jpeg'
                    const dataUri = `data:${mime};base64,${b64}`

                    const cloudinaryRes = await fetch('/api/cloudinary/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: dataUri, folder: 'products' })
                    })
                    if (!cloudinaryRes.ok) throw new Error('Falha no upload da imagem para Cloudinary')
                    const cloudinaryData = await cloudinaryRes.json()

                    productImagesPayload.push({
                        cloudinaryId: cloudinaryData.cloudinaryId,
                        url: cloudinaryData.url,
                        width: cloudinaryData.width,
                        height: cloudinaryData.height,
                        format: cloudinaryData.format,
                        size: cloudinaryData.size,
                        alt: img.filename || undefined,
                        isMain: i === 0,
                        order: i
                    })
                    if (img.previewUrl) URL.revokeObjectURL(img.previewUrl)
                } else if (img.previewUrl && img.previewUrl.startsWith('http')) {
                    // Existing Cloudinary image
                    const cloudinaryId = (img as unknown as { cloudinaryId?: string }).cloudinaryId || ''
                    if (cloudinaryId) {
                        productImagesPayload.push({
                            cloudinaryId,
                            url: img.previewUrl,
                            alt: img.filename || undefined,
                            isMain: i === 0,
                            order: i
                        })
                    }
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

            // Type-safe extraction of id from defaultValues: prefer explicit prop, fallback to defaultValues.id
            const dv = defaultValues as Partial<ProductFormData & { id?: string }> | undefined
            const effectiveProductId = productId ?? dv?.id
            const url = isEditing && effectiveProductId ? `/api/admin/products/${effectiveProductId}` : '/api/admin/products'
            const method = isEditing && effectiveProductId ? 'PUT' : 'POST'
            // When updating, include variation ids if present in defaultValues
            if (isEditing) {
                // Merge existing variation ids into payload.variations by index if available
                const existingVariations = (defaultValues?.variations || []) as Array<Partial<{ id?: string }>>
                for (let i = 0; i < (payload.variations || []).length; i++) {
                    const pv = payload.variations[i] as VariationPayload
                    const ev = existingVariations[i]
                    if (ev && ev.id) pv.id = ev.id
                }
            }

            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            if (!res.ok) {
                const txt = await res.text()
                throw new Error(`Erro na API de produtos: ${res.status} ${txt}`)
            }
            await res.json()
            setIsSubmitting(false)
            if (onSuccess) onSuccess()
            else router.push('/admin/produtos')
        } catch (err: unknown) {
            setIsSubmitting(false)
            setFormError('Erro ao salvar produto: ' + (err instanceof Error ? err.message : String(err)))
        }
    }

    // Small helper UI lists (language removed from variations - kept for potential future use)

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded">
                        <div className="flex items-start justify-between">
                            <div>{formError}</div>
                            <button type="button" onClick={() => setFormError(null)} className="text-sm text-red-600 underline">Fechar</button>
                        </div>
                    </div>
                )}
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
                                        <div>
                                            <Button type="button" variant="outline" size="icon" onClick={() => setIsNewCategoryOpen(v => !v)}><FolderPlus className="w-4 h-4" /></Button>
                                        </div>
                                        {isNewCategoryOpen && (
                                            <div className="mt-2 p-4 border rounded bg-white shadow">
                                                <div className="flex items-center justify-between">
                                                    <div className="font-medium">Nova Categoria</div>
                                                    <button type="button" onClick={() => setIsNewCategoryOpen(false)} className="text-gray-500">Fechar</button>
                                                </div>
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
                                                                    setCategoryError('Resposta inesperada ao criar categoria')
                                                                }
                                                            } catch {
                                                                setCategoryError('Falha ao criar categoria')
                                                            } finally {
                                                                setIsCreatingCategory(false)
                                                            }
                                                        }}>Criar</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {categoryError && (
                                            <div className="mt-2">
                                                <Alert variant="destructive">
                                                    <AlertTitle>Erro</AlertTitle>
                                                    <AlertDescription>{categoryError}</AlertDescription>
                                                </Alert>
                                            </div>
                                        )}
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
                                                    {formData.images.filter(url => typeof url === 'string' && url.trim()).map((url, idx) => (
                                                        <div key={url || idx}
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

                {/* Step 2 - Atributos */}
                {step === 2 && (
                    <>
                        {isLoadingAttributes && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded mb-4">
                                <div className="text-sm text-blue-800">Carregando atributos do banco de dados...</div>
                            </div>
                        )}
                        <AttributeManager
                            selectedAttributes={formData.attributes || []}
                            onChange={attributes => setFormData(prev => ({ ...prev, attributes }))}
                        />
                    </>
                )}

                {/* Step 3 - Variações */}
                {step === 3 && (
                    <>
                        {/* Debug info - Comentado, descomentar se necessário para debug */}
                        {/* 
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
                            <div className="text-sm font-semibold text-blue-900 mb-2">Debug - Atributos disponíveis:</div>
                            <div className="text-xs text-blue-800">
                                <div>Atributos selecionados no Step 2: {formData.attributes?.length || 0}</div>
                                <div>IDs selecionados: {formData.attributes?.map(a => a.attributeId).join(', ') || 'nenhum'}</div>
                                <div>Atributos em localAttributes: {localAttributes.length}</div>
                                <div>IDs locais: {localAttributes.map(a => a.id).join(', ') || 'nenhum'}</div>
                                <div className="mt-2 font-bold text-green-700">
                                    Atributos sendo enviados ao VariationManager: {localAttributes.filter(attr =>
                                        formData.attributes?.some(a => a.attributeId === attr.id)
                                    ).length}
                                </div>
                            </div>
                        </div>
                        */}

                        {isLoadingAttributes ? (
                            <div className="p-8 text-center text-gray-500">
                                Carregando atributos...
                            </div>
                        ) : (
                            <VariationManager
                                variations={formData.variations}
                                attributes={localAttributes.filter(attr =>
                                    formData.attributes?.some(a => a.attributeId === attr.id)
                                )}
                                onChange={variations => setFormData(prev => ({ ...prev, variations }))}
                            />
                        )}
                    </>
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

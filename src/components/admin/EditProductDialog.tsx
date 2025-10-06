"use client"

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import ProductForm from './ProductForm'
import { getPreviewSrc } from '@/lib/r2-utils'

// Types used only to map API product into ProductForm default values
interface ApiImage { id?: string; name?: string; r2Key?: string; url?: string; data?: string; mimeType?: string; alt?: string }
interface ApiFile { filename?: string; originalName?: string; fileSize?: number; mimeType?: string; r2Key?: string; url?: string }
interface ApiAttributeValue { attributeId?: string; valueId?: string; attribute_id?: string; attribute_value_id?: string }
interface ApiVariation { id?: string; name?: string; price?: number | string; isActive?: boolean; images?: ApiImage[]; files?: ApiFile[]; attributeValues?: ApiAttributeValue[] }
interface AdminProduct { id?: string; name?: string; slug?: string; description?: string; categoryId?: string; isActive?: boolean; isFeatured?: boolean; images?: ApiImage[]; price?: number; variations?: ApiVariation[]; attributes?: { attributeId: string; valueIds: string[] }[] }

interface EditProductDialogProps {
    product: AdminProduct | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

// Mirror the Attribute shape used by ProductForm (values key is 'value')
interface Attribute {
    id: string
    name: string
    values?: { id: string; value: string }[]
}

export default function EditProductDialog({ product, open, onOpenChange, onSuccess }: EditProductDialogProps) {
    const [availableAttributes, setAvailableAttributes] = useState<Attribute[]>([])

    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    const res = await fetch('/api/admin/attributes')
                    if (!res.ok) return
                    const j = await res.json()
                    if (!mounted) return
                    // map API attributes into our Attribute shape if necessary
                    const rawAttrs = (j.attributes || j || []) as unknown
                    const attrs: Attribute[] = Array.isArray(rawAttrs) ? rawAttrs.map((a: unknown) => {
                        const obj = a as Record<string, unknown>
                        const vals = Array.isArray(obj.values) ? obj.values as unknown[] : []
                        const values = vals.map(v => {
                            const vv = v as Record<string, unknown>
                            return { id: String(vv.id), value: String(vv.value ?? vv.name ?? '') }
                        })
                        return { id: String(obj.id), name: String(obj.name), values }
                    }) : []
                    setAvailableAttributes(attrs)
                } catch {
                    // Failed to fetch attributes
                }
            })()
        return () => { mounted = false }
    }, [])

    // Fetch full product details when dialog opens so we have images, variation attribute mappings and r2Keys
    const [detailedProduct, setDetailedProduct] = React.useState<AdminProduct | null>(null)

    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    if (!product?.id || !open) return
                    const res = await fetch(`/api/admin/products/${product.id}`)
                    if (!res.ok) return
                    const j = await res.json()
                    if (!mounted) return
                    setDetailedProduct(j)
                } catch {
                    // Failed to fetch product details
                }
            })()
        return () => { mounted = false }
    }, [product?.id, open])

    const defaultValues = React.useMemo(() => {
        const src = detailedProduct || product
        if (!src) return undefined
        const source = src as AdminProduct
        // ProductForm expects `images` as an array of string preview URLs
        const images = (source.images || []).map(i => {
            const raw = (i as ApiImage)?.data ?? (i as ApiImage)?.r2Key ?? (i as ApiImage)?.url ?? ''
            return getPreviewSrc(String(raw || ''), (i as ApiImage)?.mimeType)
        })
        type RawAttr = ApiAttributeValue & { attribute_id?: string; attribute_value_id?: string }
        type RawFile = ApiFile & { name?: string; path?: string; size?: number }
        const variations = (source.variations || []).map(v => {
            const vv = v as ApiVariation
            const imgs = (vv.images || []).map(img => {
                if (!img) return { filename: '', previewUrl: '' }
                const ai = img as ApiImage
                const raw = ai.data ?? ai.r2Key ?? ai.url ?? ''
                const preview = getPreviewSrc(String(raw || ''), ai.mimeType)
                return { filename: ai.alt || ai.name || '', previewUrl: preview }
            })
            const attrVals = (vv.attributeValues || []).map((av: RawAttr) => ({ attributeId: av.attributeId || av.attribute_id || '', valueId: av.valueId || av.attribute_value_id || '' })).filter(a => a.attributeId && a.valueId)
            const files = (vv.files || []).map((f: RawFile) => {
                const r2 = f.r2Key || f.path || ''
                const url = r2 ? `/api/r2/download?r2Key=${encodeURIComponent(String(r2))}` : (f.url || '')
                return {
                    filename: f.filename || f.originalName || f.name || '',
                    originalName: f.originalName || '',
                    fileSize: f.fileSize ?? f.size ?? 0,
                    mimeType: f.mimeType || '',
                    r2Key: r2,
                    uploaded: !!r2,
                    url,
                }
            })
            return {
                id: vv.id,
                name: vv.name || '',
                price: vv.price ? String(vv.price) : '',
                attributeValues: attrVals,
                files,
                images: imgs,
            }
        })
        const result = {
            id: source.id || undefined,
            name: source.name || '',
            slug: source.slug || '',
            description: source.description || '',
            categoryId: source.categoryId ?? null,
            isActive: source.isActive ?? true,
            isFeatured: source.isFeatured ?? false,
            images,
            price: source.price ? String(source.price) : '',
            variations,
            attributes: source.attributes || [],
        }

        return result
    }, [detailedProduct, product])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto rounded-lg" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-base font-semibold">Editar Produto</span>
                    </DialogTitle>
                    <DialogDescription>
                        Faça alterações nas informações do produto e salve para atualizar o catálogo
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                    <ProductForm
                        defaultValues={defaultValues}
                        availableAttributes={availableAttributes}
                        isEditing={!!product}
                        productId={product?.id}
                        onSuccess={() => {
                            onSuccess?.()
                            onOpenChange(false)
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}

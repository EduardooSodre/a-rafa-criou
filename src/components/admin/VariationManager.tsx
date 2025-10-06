'use client'

import React, { useState } from 'react'
import { Trash2, Plus, Upload, X, FileText, ImageIcon, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface AttributeValue {
    id: string
    value: string
}

interface Attribute {
    id: string
    name: string
    values?: AttributeValue[]
}

interface UploadedFile {
    file?: File
    filename?: string
    r2Key?: string
    url?: string
}

interface ImageFile {
    file?: File
    filename?: string
    previewUrl?: string
}

interface Variation {
    id?: string
    name: string
    price: string
    attributeValues: { attributeId: string; valueId: string }[]
    files: UploadedFile[]
    images: ImageFile[]
}

interface VariationManagerProps {
    variations: Variation[]
    attributes: Attribute[]
    onChange: (variations: Variation[]) => void
}

export default function VariationManager({ variations, attributes, onChange }: VariationManagerProps) {
    // Estado para controlar o dialog de confirmação
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean
        variationIndex: number
        fileIndex: number
        filename: string
        hasR2Key: boolean
    } | null>(null)

    function addVariation() {
        onChange([...variations, {
            name: '',
            price: '',
            attributeValues: [],
            files: [],
            images: []
        }])
    }

    function removeVariation(index: number) {
        if (confirm('Tem certeza que deseja remover esta variação?')) {
            onChange(variations.filter((_, i) => i !== index))
        }
    }

    function updateVariation(index: number, field: keyof Variation, value: unknown) {
        onChange(variations.map((v, i) => i === index ? { ...v, [field]: value } : v))
    }

    function updateAttributeValue(variationIndex: number, attributeId: string, valueId: string) {
        onChange(variations.map((v, i) => {
            if (i !== variationIndex) return v
            const filtered = v.attributeValues.filter(av => av.attributeId !== attributeId)
            return {
                ...v,
                attributeValues: [...filtered, { attributeId, valueId }]
            }
        }))
    }

    function handleFileUpload(variationIndex: number, files: FileList) {
        const newFiles = Array.from(files).map(f => ({
            file: f,
            filename: f.name
        }))
        onChange(variations.map((v, i) =>
            i === variationIndex ? { ...v, files: [...v.files, ...newFiles] } : v
        ))
    }

    async function removeFile(variationIndex: number, fileIndex: number) {
        const variation = variations[variationIndex]
        const file = variation.files[fileIndex]

        // Abrir dialog de confirmação
        setDeleteDialog({
            open: true,
            variationIndex,
            fileIndex,
            filename: file.filename || 'arquivo sem nome',
            hasR2Key: !!file.r2Key
        })
    }

    async function confirmRemoveFile() {
        if (!deleteDialog) return

        const { variationIndex, fileIndex } = deleteDialog
        const variation = variations[variationIndex]
        const file = variation.files[fileIndex]

        // Se o arquivo já foi carregado no R2 (tem r2Key), deletar do R2 imediatamente
        if (file.r2Key) {
            try {
                const response = await fetch(`/api/r2/delete?r2Key=${encodeURIComponent(file.r2Key)}`, {
                    method: 'DELETE'
                })

                if (!response.ok) {
                    const error = await response.json()
                    console.error('Erro ao deletar do R2:', error)
                    alert(`Erro ao deletar arquivo do R2: ${error.error || 'Erro desconhecido'}`)
                    setDeleteDialog(null)
                    return
                }

                console.log(`✅ Arquivo ${file.filename} deletado do R2 com sucesso`)
            } catch (error) {
                console.error('Erro ao deletar arquivo do R2:', error)
                alert('Erro ao deletar arquivo. Tente novamente.')
                setDeleteDialog(null)
                return
            }
        }

        // Remover do estado local
        onChange(variations.map((v, i) =>
            i === variationIndex ? { ...v, files: v.files.filter((_, fi) => fi !== fileIndex) } : v
        ))

        // Fechar dialog
        setDeleteDialog(null)
    }

    function handleImageUpload(variationIndex: number, files: FileList) {
        const newImages = Array.from(files).map(f => ({
            file: f,
            filename: f.name,
            previewUrl: URL.createObjectURL(f)
        }))
        onChange(variations.map((v, i) =>
            i === variationIndex ? { ...v, images: [...v.images, ...newImages] } : v
        ))
    }

    function removeImage(variationIndex: number, imageIndex: number) {
        onChange(variations.map((v, i) =>
            i === variationIndex ? { ...v, images: v.images.filter((_, ii) => ii !== imageIndex) } : v
        ))
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Variações do Produto</h3>
                    <p className="text-sm text-gray-500">
                        Cada variação deve ter nome, preço e pelo menos um arquivo PDF
                    </p>
                </div>
                <Button type="button" onClick={addVariation} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Variação
                </Button>
            </div>

            {variations.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                    Nenhuma variação adicionada. Clique em &quot;Nova Variação&quot; para começar.
                </div>
            )}

            {variations.map((variation, index) => (
                <Card key={index} className="p-5">
                    <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-base px-3 py-1">
                                    Variação {index + 1}
                                </Badge>
                                {variation.name && (
                                    <span className="font-semibold text-gray-900">{variation.name}</span>
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeVariation(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Remover
                            </Button>
                        </div>

                        {/* Nome e Preço */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Nome da Variação *</Label>
                                <Input
                                    value={variation.name}
                                    onChange={e => updateVariation(index, 'name', e.target.value)}
                                    placeholder="Ex: Premium, Básico, Completo"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label>Preço (R$) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={variation.price}
                                    onChange={e => updateVariation(index, 'price', e.target.value)}
                                    placeholder="0.00"
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        {/* Atributos */}
                        {attributes.length > 0 && (
                            <div>
                                <Label className="mb-2 block">Atributos da Variação *</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {attributes.map(attr => {
                                        const selectedValue = variation.attributeValues.find(
                                            av => av.attributeId === attr.id
                                        )?.valueId || undefined

                                        return (
                                            <div key={attr.id}>
                                                <Label className="text-sm text-gray-600">{attr.name}</Label>
                                                <Select
                                                    value={selectedValue}
                                                    onValueChange={val => {
                                                        console.log(`Selecionando atributo ${attr.name} = ${val} para variação ${index}`)
                                                        updateAttributeValue(index, attr.id, val)
                                                    }}
                                                >
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder={`Selecione ${attr.name}`} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {attr.values?.map(v => (
                                                            <SelectItem key={v.id} value={v.id}>
                                                                {v.value}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Resumo dos atributos selecionados */}
                                {variation.attributeValues.length > 0 && (
                                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="text-sm font-semibold text-green-800 mb-2">
                                            ✓ Atributos Selecionados:
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {variation.attributeValues.map((av, avIndex) => {
                                                const attr = attributes.find(a => a.id === av.attributeId)
                                                const val = attr?.values?.find(v => v.id === av.valueId)
                                                return (
                                                    <Badge key={avIndex} variant="secondary" className="bg-green-100 text-green-800">
                                                        {attr?.name}: {val?.value || 'N/A'}
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Alerta se faltam atributos */}
                                {attributes.length > variation.attributeValues.length && (
                                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <div className="text-sm font-semibold text-amber-800">
                                            ⚠️ Selecione todos os atributos para garantir que o cliente compre o produto correto
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Arquivos e Imagens */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Arquivos PDF */}
                            <div>
                                <Label>Arquivos PDF *</Label>
                                <div className="mt-2">
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-500">
                                            Clique ou arraste PDFs aqui
                                        </span>
                                        <input
                                            type="file"
                                            multiple
                                            accept=".pdf"
                                            onChange={e => e.target.files && handleFileUpload(index, e.target.files)}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                {variation.files.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        {variation.files.map((file, fi) => (
                                            <div
                                                key={fi}
                                                className="flex items-center justify-between bg-gray-50 rounded-lg p-2 border"
                                            >
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <FileText className="w-4 h-4 text-red-600 flex-shrink-0" />
                                                    <span className="text-sm truncate">{file.filename}</span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeFile(index, fi)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Imagens */}
                            <div>
                                <Label>Imagens (opcional)</Label>
                                <div className="mt-2">
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-500">
                                            Clique ou arraste imagens aqui
                                        </span>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={e => e.target.files && handleImageUpload(index, e.target.files)}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                {variation.images.length > 0 && (
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                        {variation.images.filter(img => img.previewUrl && img.previewUrl.trim()).map((img, ii) => (
                                            <div key={ii} className="relative group">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={img.previewUrl || '/file.svg'}
                                                    alt={img.filename || 'preview'}
                                                    className="w-full h-24 object-cover rounded-lg border"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => removeImage(index, ii)}
                                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Resumo */}
                        <div className="flex items-center gap-4 pt-3 border-t text-sm text-gray-600">
                            <div>
                                📄 {variation.files.length} {variation.files.length === 1 ? 'arquivo' : 'arquivos'}
                            </div>
                            <div>
                                🖼️ {variation.images.length} {variation.images.length === 1 ? 'imagem' : 'imagens'}
                            </div>
                            {variation.price && (
                                <div className="ml-auto font-semibold text-lg text-[#FD9555]">
                                    R$ {Number(variation.price).toFixed(2).replace('.', ',')}
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            ))}

            {/* Alert Dialog para confirmar exclusão de arquivo */}
            <AlertDialog open={deleteDialog?.open || false} onOpenChange={(open) => !open && setDeleteDialog(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Remover arquivo
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <div>
                                    Deseja remover o arquivo <strong>{deleteDialog?.filename}</strong>?
                                </div>
                                {deleteDialog?.hasR2Key && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-900">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <div className="font-semibold">⚠️ Atenção:</div>
                                                <div className="mt-1">
                                                    O arquivo será <strong>deletado permanentemente</strong> do Cloudflare R2 imediatamente.
                                                </div>
                                                <div className="mt-1">
                                                    Esta ação não pode ser desfeita, mesmo se você cancelar a edição do produto.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRemoveFile} className="bg-red-600 hover:bg-red-700">
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

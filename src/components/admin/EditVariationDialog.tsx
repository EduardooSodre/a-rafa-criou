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
import { Edit, Loader2 } from 'lucide-react'

interface VariationData {
    id: string
    productId: string
    name: string
    slug: string
    price: number
    isActive: boolean
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
        id: variation.id,
        productId: variation.productId,
        name: variation.name,
        slug: variation.slug,
        price: variation.price,
        isActive: variation.isActive,
    })

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
            console.log('Sending PUT request to:', url)
            console.log('Product ID:', productId)
            console.log('Variation ID:', variation.id)
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    slug: formData.slug,
                    price: formData.price,
                    isActive: formData.isActive,
                }),
            })

            console.log('Response status:', response.status)
            if (!response.ok) {
                const errorData = await response.text()
                console.log('Error response:', errorData)
                throw new Error('Erro ao atualizar variação')
            }

            setOpen(false)
            onSuccess?.()
        } catch (error) {
            console.error('Erro ao atualizar variação:', error)
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
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Variação</DialogTitle>
                    <DialogDescription>
                        Atualize as informações da variação &quot;{variation.name}&quot;.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome da Variação *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Nome da variação"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                            id="slug"
                            value={formData.slug}
                            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                            placeholder="slug-da-variacao"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="price">Preço *</Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                            placeholder="0.00"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label htmlFor="isActive">Variação Ativa</Label>
                            <p className="text-sm text-gray-500">
                                Variação disponível para compra
                            </p>
                        </div>
                        <Switch
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                        />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4 border-t">
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
                </form>
            </DialogContent>
        </Dialog>
    )
}
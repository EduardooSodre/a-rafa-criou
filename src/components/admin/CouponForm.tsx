'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

interface CouponFormProps {
    coupon?: {
        id: string
        code: string
        type: string
        value: string
        isActive: boolean
    }
    onSuccess: () => void
}

export default function CouponForm({ coupon, onSuccess }: CouponFormProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        code: coupon?.code || '',
        type: coupon?.type || 'percent',
        value: coupon?.value || '',
        minSubtotal: '',
        maxUses: '',
        maxUsesPerUser: '1',
        appliesTo: 'all',
        isActive: coupon?.isActive ?? true,
        stackable: false,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const url = coupon ? `/api/admin/coupons/${coupon.id}` : '/api/admin/coupons'
            const method = coupon ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    value: parseFloat(formData.value),
                    minSubtotal: formData.minSubtotal ? parseFloat(formData.minSubtotal) : null,
                    maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
                    maxUsesPerUser: parseInt(formData.maxUsesPerUser),
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erro ao salvar cupom')
            }

            onSuccess()
        } catch (error) {
            console.error('Erro:', error)
            alert(error instanceof Error ? error.message : 'Erro ao salvar cupom')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="code">Código do Cupom *</Label>
                    <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="EX: DESCONTO10"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Desconto *</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="percent">Percentual (%)</SelectItem>
                            <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="value">Valor do Desconto *</Label>
                    <Input
                        id="value"
                        type="number"
                        step="0.01"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        placeholder={formData.type === 'percent' ? '10' : '50.00'}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="minSubtotal">Valor Mínimo (R$)</Label>
                    <Input
                        id="minSubtotal"
                        type="number"
                        step="0.01"
                        value={formData.minSubtotal}
                        onChange={(e) => setFormData({ ...formData, minSubtotal: e.target.value })}
                        placeholder="0.00"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="maxUses">Usos Máximos</Label>
                    <Input
                        id="maxUses"
                        type="number"
                        value={formData.maxUses}
                        onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                        placeholder="Ilimitado"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="maxUsesPerUser">Usos por Usuário *</Label>
                    <Input
                        id="maxUsesPerUser"
                        type="number"
                        value={formData.maxUsesPerUser}
                        onChange={(e) => setFormData({ ...formData, maxUsesPerUser: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Cupom Ativo</Label>
                </div>

                <div className="flex items-center space-x-2">
                    <Switch
                        id="stackable"
                        checked={formData.stackable}
                        onCheckedChange={(checked) => setFormData({ ...formData, stackable: checked })}
                    />
                    <Label htmlFor="stackable">Acumulável</Label>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="submit" disabled={loading} className="bg-[#FED466] hover:bg-[#FD9555] text-gray-800">
                    {loading ? 'Salvando...' : coupon ? 'Atualizar Cupom' : 'Criar Cupom'}
                </Button>
            </div>
        </form>
    )
}

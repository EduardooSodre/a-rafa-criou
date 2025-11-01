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
        minSubtotal?: string | null
        maxUses?: number | null
        maxUsesPerUser?: number
        isActive: boolean
        stackable?: boolean
        startsAt?: string | null
        endsAt?: string | null
    }
    onSuccess: () => void
}

export default function CouponForm({ coupon, onSuccess }: CouponFormProps) {
    const [loading, setLoading] = useState(false)

    // Função para formatar data do banco (ISO) para datetime-local input
    const formatDateForInput = (dateString: string | null | undefined) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Formato: YYYY-MM-DDTHH:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const [formData, setFormData] = useState({
        code: coupon?.code || '',
        type: coupon?.type || 'percent',
        value: coupon?.value || '',
        minSubtotal: coupon?.minSubtotal || '',
        maxUses: coupon?.maxUses?.toString() || '',
        maxUsesPerUser: coupon?.maxUsesPerUser?.toString() || '1',
        appliesTo: 'all',
        isActive: coupon?.isActive ?? true,
        stackable: coupon?.stackable ?? false,
        startsAt: formatDateForInput(coupon?.startsAt),
        endsAt: formatDateForInput(coupon?.endsAt),
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
                    code: formData.code,
                    type: formData.type,
                    value: parseFloat(formData.value),
                    minSubtotal: formData.minSubtotal ? parseFloat(formData.minSubtotal) : null,
                    maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
                    maxUsesPerUser: parseInt(formData.maxUsesPerUser),
                    appliesTo: formData.appliesTo,
                    isActive: formData.isActive,
                    stackable: formData.stackable,
                    startsAt: formData.startsAt || null,
                    endsAt: formData.endsAt || null,
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
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seção: Informações Básicas */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">
                    Informações Básicas
                </h3>
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
                        <Label htmlFor="minSubtotal">Valor Mínimo da Compra (R$)</Label>
                        <Input
                            id="minSubtotal"
                            type="number"
                            step="0.01"
                            value={formData.minSubtotal}
                            onChange={(e) => setFormData({ ...formData, minSubtotal: e.target.value })}
                            placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500">Valor mínimo do carrinho para usar o cupom</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="maxUses">Usos Máximos Totais</Label>
                        <Input
                            id="maxUses"
                            type="number"
                            min="1"
                            value={formData.maxUses}
                            onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                            placeholder="Ilimitado"
                        />
                        <p className="text-xs text-gray-500">Quantas vezes o cupom pode ser usado (total)</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="maxUsesPerUser">Usos por Usuário *</Label>
                        <Input
                            id="maxUsesPerUser"
                            type="number"
                            min="1"
                            value={formData.maxUsesPerUser}
                            onChange={(e) => setFormData({ ...formData, maxUsesPerUser: e.target.value })}
                            required
                        />
                        <p className="text-xs text-gray-500">Quantas vezes cada usuário pode usar</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="startsAt">Data de Início (Opcional)</Label>
                        <Input
                            id="startsAt"
                            type="datetime-local"
                            value={formData.startsAt}
                            onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                        />
                        <p className="text-xs text-gray-500">Deixe vazio para ativar imediatamente</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="endsAt">Data de Término (Opcional)</Label>
                        <Input
                            id="endsAt"
                            type="datetime-local"
                            value={formData.endsAt}
                            onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                        />
                        <p className="text-xs text-gray-500">Deixe vazio para não expirar</p>
                    </div>
                </div>
            </div>

            {/* Seção: Configurações */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">
                    Configurações
                </h3>
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
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="submit" disabled={loading} className="bg-[#FED466] hover:bg-[#FD9555] text-gray-800">
                    {loading ? 'Salvando...' : coupon ? 'Atualizar Cupom' : 'Criar Cupom'}
                </Button>
            </div>
        </form>
    )
}

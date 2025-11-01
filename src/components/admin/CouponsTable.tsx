'use client'

import { useState, useEffect } from 'react'
import { MoreVertical, Edit, Trash2, Copy, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import CouponForm from './CouponForm'

interface Coupon {
    id: string
    code: string
    type: 'percent' | 'fixed'
    value: string
    minSubtotal: string | null
    maxUses: number | null
    maxUsesPerUser: number
    usedCount: number
    appliesTo: string
    stackable: boolean
    isActive: boolean
    startsAt: string | null
    endsAt: string | null
    createdAt: string
}

interface CouponsTableProps {
    search: string
    onRefresh: () => void
}

export default function CouponsTable({ search, onRefresh }: CouponsTableProps) {
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [editCoupon, setEditCoupon] = useState<Coupon | null>(null)

    const loadCoupons = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/coupons')
            if (response.ok) {
                const data = await response.json()
                setCoupons(data.coupons || [])
            }
        } catch (error) {
            console.error('Erro ao carregar cupons:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadCoupons()
    }, [])

    const handleDelete = async () => {
        if (!deleteId) return

        try {
            const response = await fetch(`/api/admin/coupons/${deleteId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setDeleteId(null)
                loadCoupons()
                onRefresh()
            } else {
                const error = await response.json()
                alert(error.error || 'Erro ao excluir cupom')
            }
        } catch (error) {
            console.error('Erro ao excluir cupom:', error)
            alert('Erro ao excluir cupom')
        }
    }

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code)
        alert('Código copiado!')
    }

    const filteredCoupons = coupons.filter(coupon =>
        coupon.code.toLowerCase().includes(search.toLowerCase())
    )

    const formatValue = (coupon: Coupon) => {
        if (coupon.type === 'percent') {
            return `${parseFloat(coupon.value)}%`
        }
        return `R$ ${parseFloat(coupon.value).toFixed(2)}`
    }

    const formatDate = (date: string | null) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('pt-BR')
    }

    if (loading) {
        return <div className="text-center py-8">Carregando cupons...</div>
    }

    if (filteredCoupons.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">
                    {search ? 'Nenhum cupom encontrado com esse código' : 'Nenhum cupom cadastrado'}
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Código</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Valor</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Mín. Compra</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Usos</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Validade</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCoupons.map((coupon) => (
                            <tr key={coupon.id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm font-semibold">
                                            {coupon.code}
                                        </code>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleCopyCode(coupon.code)}
                                            className="h-6 w-6 p-0"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <Badge variant={coupon.type === 'percent' ? 'default' : 'secondary'}>
                                        {coupon.type === 'percent' ? 'Percentual' : 'Fixo'}
                                    </Badge>
                                </td>
                                <td className="py-3 px-4 font-semibold text-[#FD9555]">
                                    {formatValue(coupon)}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600">
                                    {coupon.minSubtotal
                                        ? `R$ ${parseFloat(coupon.minSubtotal).toFixed(2)}`
                                        : '-'}
                                </td>
                                <td className="py-3 px-4">
                                    <div className="text-sm">
                                        <span className="font-semibold">{coupon.usedCount}</span>
                                        {coupon.maxUses && (
                                            <span className="text-gray-500"> / {coupon.maxUses}</span>
                                        )}
                                        {!coupon.maxUses && (
                                            <span className="text-gray-400"> / ∞</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
                                        {coupon.isActive ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="text-xs space-y-1">
                                        {coupon.startsAt && (
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <span>Início:</span>
                                                <span className="font-medium">{formatDate(coupon.startsAt)}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <Calendar className="w-3 h-3" />
                                            <span>{coupon.endsAt ? formatDate(coupon.endsAt) : 'Sem prazo'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => setEditCoupon(coupon)}>
                                                <Edit className="w-4 h-4 mr-2" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => setDeleteId(coupon.id)}
                                                className="text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Dialog de Edição */}
            <Dialog open={!!editCoupon} onOpenChange={(open) => !open && setEditCoupon(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Cupom</DialogTitle>
                        <DialogDescription>
                            Atualize as informações do cupom
                        </DialogDescription>
                    </DialogHeader>
                    {editCoupon && (
                        <CouponForm
                            coupon={editCoupon}
                            onSuccess={() => {
                                setEditCoupon(null)
                                loadCoupons()
                                onRefresh()
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Dialog de Confirmação de Exclusão */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este cupom? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

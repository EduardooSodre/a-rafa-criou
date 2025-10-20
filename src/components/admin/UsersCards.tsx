"use client"

import Link from 'next/link'
import { Users, Mail, Calendar, MoreVertical, Eye, UserCheck, UserX, Settings, Crown, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogAction, AlertDialogTrigger } from '@/components/ui/alert-dialog'

interface User {
    id: string
    name: string | null
    email: string
    role: 'admin' | 'user'
    createdAt: string
    lastLogin?: string | null
}

interface Props {
    users: User[]
    actionLoading?: string | null
    adminPassword?: string
    onPromoteUser?: (email: string, action: 'promote' | 'demote') => void
}

export default function UsersCards({ users, onPromoteUser }: Props) {
    const getRoleBadge = (role: string) => {
        if (role === 'admin') {
            return (
                <Badge variant="destructive" className="flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Admin
                </Badge>
            )
        }

        return (
            <Badge variant="secondary" className="flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                Usuário
            </Badge>
        )
    }

    if (!users || users.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
                <p className="text-gray-600">Tente ajustar os filtros de busca ou adicionar um novo usuário</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {users.map((user) => (
                    <Card key={user.id} className="group hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-[#FED466] overflow-hidden">
                        <div className="p-4 md:p-6">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#FED466] to-[#FD9555] rounded-full flex items-center justify-center shadow-sm text-white font-bold">
                                        {(user.name || user.email).charAt(0).toUpperCase()}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">{user.name || 'Sem nome'}</h3>
                                            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                                <Mail className="w-3 h-3" />
                                                <span className="truncate">{user.email}</span>
                                            </div>
                                        </div>

                                        <div className="ml-2">
                                            <div className="text-right">
                                                {getRoleBadge(user.role)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                <span>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                            <div className="text-xs text-gray-500">Último acesso: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}</div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                    <DropdownMenuItem>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        <Link href={`/admin/usuarios/${user.id}`}>Ver Perfil</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Settings className="w-4 h-4 mr-2" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />

                                                    {user.role !== 'admin' && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem
                                                                    onSelect={(e) => e.preventDefault()}
                                                                    className="text-green-600"
                                                                    // disabled handled by external caller using adminPassword/actionLoading
                                                                >
                                                                    <UserCheck className="w-4 h-4 mr-2" />
                                                                    Promover a Admin
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle className="flex items-center gap-2">
                                                                        <Crown className="w-5 h-5 text-yellow-500" />
                                                                        Promover a Administrador
                                                                    </AlertDialogTitle>
                                                                    <div className="text-amber-600 flex items-center gap-1 mt-2">
                                                                        <AlertTriangle className="w-4 h-4" />
                                                                        Esta ação dará acesso completo à área administrativa.
                                                                    </div>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => onPromoteUser?.(user.email, 'promote')}
                                                                        className="bg-green-600 hover:bg-green-700"
                                                                    >
                                                                        <Crown className="w-4 h-4 mr-2" />
                                                                        Promover
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}

                                                    {user.role === 'admin' && user.email !== 'admin@arafacriou.com.br' && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem
                                                                    onSelect={(e) => e.preventDefault()}
                                                                    className="text-red-600"
                                                                >
                                                                    <UserX className="w-4 h-4 mr-2" />
                                                                    Remover Admin
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle className="flex items-center gap-2">
                                                                        <UserX className="w-5 h-5 text-red-500" />
                                                                        Remover Administrador
                                                                    </AlertDialogTitle>
                                                                    <div className="text-amber-600 flex items-center gap-1 mt-2">
                                                                        <AlertTriangle className="w-4 h-4" />
                                                                        O usuário perderá acesso à área administrativa.
                                                                    </div>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => onPromoteUser?.(user.email, 'demote')}
                                                                        className="bg-red-600 hover:bg-red-700"
                                                                    >
                                                                        <UserX className="w-4 h-4 mr-2" />
                                                                        Remover Admin
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}

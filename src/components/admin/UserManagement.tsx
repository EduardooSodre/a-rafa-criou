'use client'

import { useState, useEffect } from 'react'
import { Shield, UserCheck, UserX, Eye, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface User {
    id: string
    name: string | null
    email: string
    role: string
    createdAt: string
    updatedAt: string
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [adminPassword, setAdminPassword] = useState('')
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    // Buscar usuários reais da API
    useEffect(() => {
        async function fetchUsers() {
            try {
                const response = await fetch('/api/admin/users')
                if (!response.ok) {
                    throw new Error('Erro ao buscar usuários')
                }
                const data = await response.json()
                setUsers(data.users || [])
                setLoading(false)
            } catch (error) {
                console.error('Erro ao buscar usuários:', error)
                // Fallback para dados mock em caso de erro
                const mockUsers = [
                    {
                        id: '1',
                        name: 'João Silva',
                        email: 'joao@example.com',
                        role: 'user',
                        createdAt: '2024-01-15T10:00:00Z',
                        updatedAt: '2024-01-15T10:00:00Z'
                    },
                    {
                        id: '2',
                        name: 'Maria Santos',
                        email: 'maria@example.com',
                        role: 'user',
                        createdAt: '2024-01-10T10:00:00Z',
                        updatedAt: '2024-01-12T10:00:00Z'
                    },
                    {
                        id: '3',
                        name: 'Administrador',
                        email: 'admin@arafacriou.com.br',
                        role: 'admin',
                        createdAt: '2024-01-01T10:00:00Z',
                        updatedAt: '2024-01-01T10:00:00Z'
                    }
                ]
                setUsers(mockUsers)
                setLoading(false)
            }
        }

        fetchUsers()
    }, [])

    const handlePromoteUser = async (email: string, action: 'promote' | 'demote') => {
        if (!adminPassword) {
            alert('Digite sua senha de admin para confirmar')
            return
        }

        setActionLoading(email)

        try {
            const user = users.find(u => u.email === email)
            if (!user) {
                throw new Error('Usuário não encontrado')
            }

            const newRole = action === 'promote' ? 'admin' : 'user'

            const response = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    role: newRole,
                    adminPassword
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erro na requisição')
            }

            const result = await response.json()

            // Atualizar lista de usuários
            setUsers(prev => prev.map(u =>
                u.email === email
                    ? { ...u, role: result.role, updatedAt: result.updatedAt }
                    : u
            ))

            alert(`Usuário ${action === 'promote' ? 'promovido a admin' : 'rebaixado para usuário'} com sucesso!`)
            setAdminPassword('')

        } catch (error) {
            console.error('Erro ao alterar permissão:', error)
            alert(error instanceof Error ? error.message : 'Erro ao alterar permissão')
        } finally {
            setActionLoading(null)
        }
    }

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    )

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <Badge className="bg-red-100 text-red-800">Admin</Badge>
            case 'member':
                return <Badge className="bg-blue-100 text-blue-800">Membro</Badge>
            case 'customer':
                return <Badge className="bg-gray-100 text-gray-800">Cliente</Badge>
            default:
                return <Badge variant="secondary">{role}</Badge>
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FED466]"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Cartão de Aviso de Segurança - Redesenhado */}
            <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                            <Shield className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-amber-800 mb-1">⚠️ Área de Alta Segurança</h3>
                            <p className="text-sm text-amber-700">
                                Alterar permissões requer sua senha de admin. Seja criterioso ao promover usuários.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Interface integrada - Busca + Senha */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Controle de Usuários
                    </CardTitle>
                    <CardDescription>
                        Busque usuários e gerencie permissões com segurança
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Busca */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Buscar por nome ou email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Senha de confirmação */}
                        <div className="lg:w-80">
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    type="password"
                                    placeholder="Senha de admin para ações..."
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {adminPassword ? '🔓 Ações habilitadas' : '🔒 Digite sua senha para habilitar ações'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Lista de Usuários - Redesenhada */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                👥 Todos os Usuários
                                <Badge variant="secondary" className="ml-2">{filteredUsers.length}</Badge>
                            </CardTitle>
                            <CardDescription>
                                Gerencie permissões e roles dos usuários da plataforma
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="font-semibold">Usuário</TableHead>
                                    <TableHead className="font-semibold">Role</TableHead>
                                    <TableHead className="font-semibold">Cadastrado em</TableHead>
                                    <TableHead className="text-right font-semibold">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-[#FED466] rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-bold text-gray-800">
                                                        {(user.name || user.email).charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{user.name || 'Sem nome'}</p>
                                                    <p className="text-sm text-gray-600">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getRoleBadge(user.role)}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-gray-600">
                                                {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <Eye className="w-4 h-4" />
                                                </Button>

                                                {user.role !== 'admin' && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                disabled={!adminPassword || actionLoading === user.email}
                                                                title="Promover a Admin"
                                                            >
                                                                <UserCheck className="w-4 h-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>🚀 Promover a Admin</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Tem certeza que deseja promover <strong>&ldquo;{user.name || user.email}&rdquo;</strong> a administrador?
                                                                    <br />
                                                                    <span className="text-amber-600">⚠️ Esta ação dará acesso completo à área administrativa.</span>
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handlePromoteUser(user.email, 'promote')}
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                >
                                                                    ✅ Promover
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}

                                                {user.role === 'admin' && user.email !== 'admin@arafacriou.com.br' && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                disabled={!adminPassword || actionLoading === user.email}
                                                                title="Remover Admin"
                                                            >
                                                                <UserX className="w-4 h-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>❌ Remover Admin</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Tem certeza que deseja remover <strong>&ldquo;{user.name || user.email}&rdquo;</strong> do cargo de administrador?
                                                                    <br />
                                                                    <span className="text-amber-600">⚠️ O usuário perderá acesso à área administrativa.</span>
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handlePromoteUser(user.email, 'demote')}
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    🗑️ Remover Admin
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <Users className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600 font-medium">Nenhum usuário encontrado</p>
                            <p className="text-sm text-gray-500">Tente ajustar os filtros de busca</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
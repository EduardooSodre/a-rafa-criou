'use client'

import { useState, useEffect } from 'react'
import {
    Users,
    Shield,
    UserCheck,
    UserPlus,
    Search,
    Filter,
    Calendar
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import UsersCards from '@/components/admin/UsersCards'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

interface User {
    id: string
    name: string | null
    email: string
    role: 'admin' | 'user'
    createdAt: string
    lastLogin?: string | null
}

interface UserStats {
    total: number
    admins: number
    users: number
    newThisMonth: number
}

export default function UsersPageClient() {
    const [users, setUsers] = useState<User[]>([])
    const [stats, setStats] = useState<UserStats>({ total: 0, admins: 0, users: 0, newThisMonth: 0 })
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [adminPassword, setAdminPassword] = useState('')
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [pageError, setPageError] = useState<string | null>(null)

    // Carregar dados reais
    useEffect(() => {
        const loadUsers = async () => {
            try {
                setLoading(true)
                const response = await fetch('/api/admin/users')

                if (!response.ok) {
                    throw new Error('Falha ao carregar usuários')
                }

                const data = await response.json()
                setUsers(data.users || [])

                // Calcular estatísticas
                const adminCount = data.users?.filter((u: User) => u.role === 'admin').length || 0
                const userCount = data.users?.filter((u: User) => u.role === 'user').length || 0
                const currentMonth = new Date().getMonth()
                const newThisMonth = data.users?.filter((u: User) =>
                    new Date(u.createdAt).getMonth() === currentMonth
                ).length || 0

                setStats({
                    total: data.users?.length || 0,
                    admins: adminCount,
                    users: userCount,
                    newThisMonth
                })
            } catch (error) {
                console.error('Erro ao carregar usuários:', error)
                setPageError('Falha ao carregar dados dos usuários')
            } finally {
                setLoading(false)
            }
        }

        loadUsers()
    }, [])

    const handlePromoteUser = async (email: string, action: 'promote' | 'demote') => {
        if (!adminPassword) {
            setPageError('Digite sua senha de administrador primeiro')
            return
        }

        try {
            setActionLoading(email)
            const response = await fetch('/api/admin/users/promote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    action,
                    adminPassword
                })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Falha na operação')
            }

            // keep success notification simple
            window.alert(result.message)

            // Recarregar lista - fazer nova busca
            const response2 = await fetch('/api/admin/users')
            if (response2.ok) {
                const data = await response2.json()
                setUsers(data.users || [])

                // Recalcular estatísticas
                const adminCount = data.users?.filter((u: User) => u.role === 'admin').length || 0
                const userCount = data.users?.filter((u: User) => u.role === 'user').length || 0
                const currentMonth = new Date().getMonth()
                const newThisMonth = data.users?.filter((u: User) =>
                    new Date(u.createdAt).getMonth() === currentMonth
                ).length || 0

                setStats({
                    total: data.users?.length || 0,
                    admins: adminCount,
                    users: userCount,
                    newThisMonth
                })
            }
        } catch (error) {
            setPageError(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
        } finally {
            setActionLoading(null)
        }
    }

    // Filtrar usuários
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRole = roleFilter === 'all' || user.role === roleFilter
        return matchesSearch && matchesRole
    })

    // Role badge rendering moved to UsersCards

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <Skeleton className="h-4 w-16 mb-2" />
                                <Skeleton className="h-8 w-12" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card>
                    <CardContent className="p-6">
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {pageError && (
                <div>
                    <Alert variant="destructive">
                        <AlertTitle>Erro</AlertTitle>
                        <AlertDescription>{pageError}</AlertDescription>
                    </Alert>
                </div>
            )}
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-[#FED466] to-[#FD9555] rounded-xl shadow-sm">
                        <Users className="w-7 h-7 text-gray-800" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
                        <p className="text-gray-600 mt-1">Controle total sobre permissões e roles da plataforma</p>
                    </div>
                </div>

                <Button className="bg-[#FED466] hover:bg-[#FD9555] text-gray-800 font-medium">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Novo Usuário
                </Button>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Administradores</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.admins}</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-full">
                                <Shield className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Usuários Comuns</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.users}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <UserCheck className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-[#FED466]">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Novos este Mês</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.newThisMonth}</p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-full">
                                <Calendar className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Controles e Tabela */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Lista de Usuários
                                <Badge variant="outline" className="ml-2">{filteredUsers.length}</Badge>
                            </CardTitle>
                            <CardDescription>
                                Gerencie permissões e roles dos usuários cadastrados na plataforma
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="users" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="users">👥 Usuários</TabsTrigger>
                            <TabsTrigger value="security">🔐 Segurança</TabsTrigger>
                        </TabsList>

                        <TabsContent value="users" className="space-y-4">
                            {/* Filtros */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Pesquisar por nome ou email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={roleFilter} onValueChange={setRoleFilter}>
                                    <SelectTrigger className="w-full sm:w-48">
                                        <Filter className="w-4 h-4 mr-2" />
                                        <SelectValue placeholder="Filtrar por role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os Roles</SelectItem>
                                        <SelectItem value="admin">Administradores</SelectItem>
                                        <SelectItem value="user">Usuários</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Cards view - mobile 2 per row, tablet/desktop more columns */}
                            <UsersCards
                                users={filteredUsers}
                                adminPassword={adminPassword}
                                actionLoading={actionLoading}
                                onPromoteUser={(email, action) => handlePromoteUser(email, action)}
                            />

                            {filteredUsers.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                        <Users className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
                                    <p className="text-gray-600">Tente ajustar os filtros de busca ou adicionar um novo usuário</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="security" className="space-y-4">
                            <Card className="border-amber-200 bg-amber-50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-amber-800">
                                        <Shield className="w-5 h-5" />
                                        Configurações de Segurança
                                    </CardTitle>
                                    <CardDescription className="text-amber-700">
                                        Configure sua senha de administrador para executar ações sensíveis
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                Senha de Administrador
                                            </label>
                                            <Input
                                                type="password"
                                                placeholder="Digite sua senha de admin..."
                                                value={adminPassword}
                                                onChange={(e) => setAdminPassword(e.target.value)}
                                                className="max-w-md"
                                            />
                                            <p className="text-xs text-gray-600 mt-1">
                                                Necessária para promover/rebaixar usuários
                                            </p>
                                        </div>

                                        {adminPassword && (
                                            <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
                                                <p className="text-sm text-green-800 flex items-center gap-2">
                                                    <UserCheck className="w-4 h-4" />
                                                    Senha configurada - você pode executar ações administrativas
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
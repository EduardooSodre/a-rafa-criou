'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Package, Settings, Download, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

export default function ContaPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    // Função para exibir apenas primeiro e segundo nome
    const getDisplayName = (fullName: string | null | undefined): string => {
        if (!fullName) return 'Usuário'
        const nameParts = fullName.trim().split(' ')
        if (nameParts.length === 1) return nameParts[0]
        return `${nameParts[0]} ${nameParts[1]}`
    }

    useEffect(() => {
        if (status === 'loading') return // Ainda carregando
        if (!session) {
            router.push('/auth/login') // Redirect para login se não autenticado
        }
    }, [session, status, router])

    if (status === 'loading') {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center">
                        <p className="text-gray-600">Carregando...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!session) {
        return null // Será redirecionado para login
    }

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/' })
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header da conta */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-4xl font-bold text-gray-900">
                            Minha Conta
                        </h1>
                        <Button
                            variant="outline"
                            onClick={handleSignOut}
                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sair
                        </Button>
                    </div>

                    <div className="bg-primary/10 rounded-lg p-6 border border-primary/20">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                                <User className="w-8 h-8 text-black" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900">
                                    {getDisplayName(session.user?.name)}
                                </h2>
                                <p className="text-gray-600">{session.user?.email}</p>
                                <span className="inline-block mt-1 px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                                    {session.user?.role === 'admin' ? 'Administrador' : 'Cliente'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Menu de opções */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader className="text-center">
                            <Package className="w-12 h-12 text-primary mx-auto mb-4" />
                            <CardTitle>Meus Pedidos</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-gray-600 mb-4">
                                Veja o histórico de todos os seus pedidos
                            </p>
                            <Button asChild className="w-full bg-primary hover:bg-secondary text-black">
                                <Link href="/conta/pedidos">
                                    Visualizar Pedidos
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader className="text-center">
                            <Download className="w-12 h-12 text-primary mx-auto mb-4" />
                            <CardTitle>Downloads</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-gray-600 mb-4">
                                Baixe novamente seus produtos digitais
                            </p>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/conta/downloads">
                                    Meus Downloads
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader className="text-center">
                            <Settings className="w-12 h-12 text-primary mx-auto mb-4" />
                            <CardTitle>Configurações</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-gray-600 mb-4">
                                Atualize suas informações pessoais
                            </p>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/conta/configuracoes">
                                    Editar Perfil
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Links rápidos */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Links Rápidos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button asChild variant="ghost" className="h-auto flex-col py-4">
                            <Link href="/produtos">
                                <Package className="w-6 h-6 mb-2" />
                                <span className="text-sm">Produtos</span>
                            </Link>
                        </Button>
                        <Button asChild variant="ghost" className="h-auto flex-col py-4">
                            <Link href="/carrinho">
                                <Package className="w-6 h-6 mb-2" />
                                <span className="text-sm">Carrinho</span>
                            </Link>
                        </Button>
                        <Button asChild variant="ghost" className="h-auto flex-col py-4">
                            <Link href="/contato">
                                <Package className="w-6 h-6 mb-2" />
                                <span className="text-sm">Contato</span>
                            </Link>
                        </Button>
                        <Button asChild variant="ghost" className="h-auto flex-col py-4">
                            <Link href="/">
                                <Package className="w-6 h-6 mb-2" />
                                <span className="text-sm">Início</span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
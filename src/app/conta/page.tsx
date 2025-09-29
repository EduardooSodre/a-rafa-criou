"use client"

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Package, Settings, Download, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { getDisplayName } from '@/lib/utils/user'
import { useTranslation } from 'react-i18next'

interface ExtendedUser {
    id: string
    email: string
    name?: string
    role?: string
    image?: string
}

export default function ContaPage() {
    const { t } = useTranslation('common');
    const { data: session, status } = useSession()
    const router = useRouter()

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
                        <p className="text-gray-600">{t('loading', 'Carregando...')}</p>
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
                            {t('account.title')}
                        </h1>
                        <Button
                            variant="outline"
                            onClick={handleSignOut}
                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            {t('auth.signOut', 'Sair')}
                        </Button>
                    </div>

                    <div className="bg-primary/10 rounded-lg p-6 border border-primary/20">
                        <div className="flex items-center gap-4">
                            <Avatar
                                imageUrl={(session.user as ExtendedUser)?.image}
                                name={session.user?.name}
                                size="lg"
                                className="w-16 h-16 bg-primary text-black"
                                fallbackClassName="bg-primary text-black"
                            />
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900">
                                    {getDisplayName(session.user?.name)}
                                </h2>
                                <p className="text-gray-600">{session.user?.email}</p>
                                <span className="inline-block mt-1 px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                                    {session.user?.role === 'admin' ? t('roles.admin', 'Administrador') : t('roles.customer', 'Cliente')}
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
                            <CardTitle>{t('account.orders', 'Meus Pedidos')}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-gray-600 mb-4">
                                {t('account.ordersDescription', 'Veja o histórico de todos os seus pedidos')}
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
                            <CardTitle>{t('account.downloads', 'Downloads')}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-gray-600 mb-4">
                                {t('account.downloadAgain')}
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
                            <CardTitle>{t('account.settings', 'Configurações')}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-gray-600 mb-4">
                                {t('account.updateInfo', 'Atualize suas informações pessoais')}
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('quickLinks', 'Links Rápidos')}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button asChild variant="ghost" className="h-auto flex-col py-4">
                            <Link href="/produtos">
                                <Package className="w-6 h-6 mb-2" />
                                <span className="text-sm">{t('nav.products')}</span>
                            </Link>
                        </Button>
                        <Button asChild variant="ghost" className="h-auto flex-col py-4">
                            <Link href="/carrinho">
                                <Package className="w-6 h-6 mb-2" />
                                <span className="text-sm">{t('nav.cart')}</span>
                            </Link>
                        </Button>
                        <Button asChild variant="ghost" className="h-auto flex-col py-4">
                            <Link href="/contato">
                                <Package className="w-6 h-6 mb-2" />
                                <span className="text-sm">{t('nav.contact')}</span>
                            </Link>
                        </Button>
                        <Button asChild variant="ghost" className="h-auto flex-col py-4">
                            <Link href="/">
                                <Package className="w-6 h-6 mb-2" />
                                <span className="text-sm">{t('nav.home', 'Início')}</span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}